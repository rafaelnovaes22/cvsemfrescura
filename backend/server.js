require('dotenv').config();

// DEBUG: Verificar JWT_SECRET
console.log('🔍 JWT_SECRET está definido?', process.env.JWT_SECRET ? 'SIM ✅' : 'NÃO ❌');
if (!process.env.JWT_SECRET) {
  console.log('❌ ERRO: JWT_SECRET não encontrado no .env');
  console.log('❌ Isso causará erro 401 em todas as requisições autenticadas');
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const { logger, logRequest, logError } = require('./utils/logger');
const atsRoutes = require('./routes/ats');
const userRoutes = require('./routes/user');
const { router: monitoringRouter, collectMetrics, incrementMetric } = require('./routes/monitoring');

// 🛡️ Importar proteções de segurança robustas
const { securityHeaders, additionalSecurityHeaders } = require('./middleware/securityHeaders');
const { apiRateLimit, authRateLimit } = require('./middleware/rateLimiting');

const app = express();

// ✅ Configurar trust proxy específico para Railway
if (process.env.NODE_ENV === 'production') {
  // Em produção (Railway), confiar apenas no primeiro proxy
  app.set('trust proxy', 1);
} else {
  // Em desenvolvimento, não configurar trust proxy
  app.set('trust proxy', false);
}

// 🛡️ PROTEÇÕES DE SEGURANÇA ROBUSTAS - PRIMEIRA LINHA DE DEFESA
app.use(securityHeaders()); // Headers de segurança rigorosos com Helmet
app.use(additionalSecurityHeaders); // Headers personalizados

// Logging de requests
app.use(logRequest);

// 🚦 Rate limiting GLOBAL - proteção contra ataques
app.use(apiRateLimit);

// 📊 Sistema de monitoramento - aplicar a todas as rotas
app.use(collectMetrics);

// Configuração de CORS para produção
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'https://cvsemfrescura.com.br']
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 horas
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Limite de payload

// 🔒 ROTAS COM PROTEÇÕES ESPECÍFICAS
// Rate limiting específico para análises ATS
const atsLimiter = require('express-rate-limit')({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // máximo 50 análises por IP por hora
  message: {
    error: 'Limite de análises excedido',
    message: 'Tente novamente em 1 hora',
    code: 'ATS_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: process.env.NODE_ENV === 'production',
});

// Rate limiting mais liberal para rotas de usuário (header, perfil)
const userLimiter = require('express-rate-limit')({
  windowMs: 60 * 1000, // 1 minuto
  max: 60, // máximo 60 requests por minuto (1 por segundo)
  message: {
    error: 'Muitas verificações de usuário',
    message: 'Aguarde um momento',
    code: 'USER_RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: process.env.NODE_ENV === 'production',
});

// 🔐 APLICAR ROTAS COM SUAS PROTEÇÕES ESPECÍFICAS
app.use('/api/user', authRateLimit, userLimiter, userRoutes); // Rate limiting para auth + usuário
app.use('/api/ats', atsLimiter, atsRoutes); // Rate limiting específico para ATS
app.use('/api/analysis', require('./routes/analysis')); // Rotas de histórico de análises
app.use('/api/upload', require('./routes/upload'));
app.use('/api/payment', require('./routes/payment')); // 🔒 JÁ TEM PROTEÇÃO MÁXIMA
app.use('/api/gift-code', require('./routes/giftCode'));
app.use('/api/password-reset', authRateLimit, require('./routes/passwordReset')); // Proteção anti-brute force
app.use('/api/contact', require('./routes/contact')); // Recuperação de senha
app.use('/api/admin', require('./routes/admin')); // Rotas administrativas
app.use('/api/config', require('./routes/config')); // ✅ Configurações dinâmicas (JÁ PROTEGIDAS)
app.use('/api/monitoring', monitoringRouter); // 📊 Sistema de monitoramento
app.use('/health', require('./routes/health')); // Health check endpoint

// ✅ Servir arquivos estáticos do frontend
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// 🔧 Endpoint de teste Railway
app.get('/railway-test', (req, res) => {
  res.json({
    status: 'Railway conectado!',
    message: 'Servidor funcionando corretamente',
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV
  });
});

// 🔧 Endpoint de teste Stripe (sem autenticação)
app.get('/stripe-test', async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Teste simples - criar PaymentIntent mínimo
    const testIntent = await stripe.paymentIntents.create({
      amount: 100, // R$ 1,00
      currency: 'brl',
      automatic_payment_methods: { enabled: true }
    });

    res.json({
      status: 'Stripe funcionando!',
      message: 'PaymentIntent de teste criado com sucesso',
      testIntentId: testIntent.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      status: 'Erro no Stripe',
      error: error.message,
      type: error.type,
      timestamp: new Date().toISOString()
    });
  }
});

// 🎁 Endpoint temporário para criar códigos de presente
app.get('/create-gift-codes', async (req, res) => {
  try {
    const db = require('./models');
    const GiftCode = db.GiftCode;

    const PRODUCTION_CODES = [
      'GIFTDL6608', 'GIFTIT6ISO', 'GIFT8Y20CT', 'GIFT28TTW1', 'GIFTSVWDFO',
      'GIFTFW98FA', 'GIFTBCGGLV', 'GIFTL026ZO', 'GIFT02NTXG', 'GIFTPYSD9P', 'GIFTJA0EH0'
    ];

    let created = 0;
    let existing = 0;
    const results = [];

    for (const code of PRODUCTION_CODES) {
      try {
        const existingCode = await GiftCode.findOne({ where: { code } });

        if (existingCode) {
          results.push(`⚠️ ${code} - já existe`);
          existing++;
          continue;
        }

        await GiftCode.create({
          code: code,
          maxUses: 1,
          usedCount: 0,
          isActive: true,
          expiresAt: null,
          createdById: null
        });

        results.push(`✅ ${code} - criado`);
        created++;

      } catch (error) {
        results.push(`❌ ${code} - erro: ${error.message}`);
      }
    }

    const totalCodes = await GiftCode.count({ where: { isActive: true } });

    res.json({
      success: true,
      message: '🎁 Códigos de presente criados!',
      summary: {
        created,
        existing,
        total: created + existing,
        totalInDatabase: totalCodes
      },
      codes: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Erro ao criar códigos de presente'
    });
  }
});

// 🧪 Endpoint temporário para adicionar créditos em modo desenvolvimento
app.get('/dev-add-credits/:userId/:credits', async (req, res) => {
  try {
    // Só funciona em desenvolvimento
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        error: 'Endpoint disponível apenas em modo de desenvolvimento'
      });
    }

    const db = require('./models');
    const User = db.User;
    const userId = parseInt(req.params.userId);
    const creditsToAdd = parseInt(req.params.credits);

    if (isNaN(userId) || isNaN(creditsToAdd)) {
      return res.status(400).json({
        error: 'userId e credits devem ser números válidos'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    const currentCredits = user.credits || 0;
    const newCredits = currentCredits + creditsToAdd;

    await user.update({ credits: newCredits });

    res.json({
      success: true,
      message: `🎁 Créditos adicionados para teste!`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        creditsAntes: currentCredits,
        creditsDepois: newCredits,
        creditosAdicionados: creditsToAdd
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Erro ao adicionar créditos'
    });
  }
});

// ✅ SPA routing - retornar index.html para rotas não-API
app.get('*', (req, res) => {
  // Se a rota começa com /api, não é uma rota do frontend
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return res.status(404).json({ error: 'API endpoint não encontrado' });
  }

  // Para rotas do frontend, servir landing.html como padrão
  const indexPath = path.join(frontendPath, 'landing.html');
  res.sendFile(indexPath);
});

const sequelize = require('./db');

// Carregar modelos para sincronização
const db = require('./models');
const User = db.User;
const GiftCode = db.GiftCode;
const GiftCodeUsage = db.GiftCodeUsage;
const Transaction = db.Transaction;

console.log('✅ Modelos carregados com sucesso');

const PORT = process.env.PORT || 3000;

console.log('🚀 Configuração do servidor:');
console.log('- Porta configurada:', PORT);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- Railway PORT env:', process.env.PORT ? 'SIM ✅' : 'NÃO ❌');

// 🔧 Função para inicializar servidor com fallback
async function startServer() {
  try {
    console.log('🔄 [SERVER] Iniciando servidor...');

    // Tentar conectar e sincronizar banco
    console.log('🔍 [DATABASE] Testando conexão com banco de dados...');
    const connectionOk = await db.testConnection();

    if (connectionOk) {
      console.log('✅ [DATABASE] Conexão estabelecida, sincronizando...');
      const syncOk = await db.safeSync({ alter: true });

      if (syncOk) {
        console.log('✅ [DATABASE] Banco de dados sincronizado com sucesso');
      } else {
        console.warn('⚠️ [DATABASE] Falha na sincronização, mas servidor continuará');
      }
    } else {
      console.warn('⚠️ [DATABASE] Conexão falhou, sistema funcionará sem persistência');
    }

    // Iniciar servidor independentemente do banco
    console.log('🚀 [SERVER] Iniciando servidor HTTP...');
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 CV Sem Frescura backend rodando na porta ${PORT}`);
      console.log(`🌐 Servidor disponível em todas as interfaces (0.0.0.0:${PORT})`);

      if (!connectionOk) {
        console.log('⚠️ [WARNING] Funcionalidades que dependem do banco (códigos de presente, histórico) podem não funcionar');
        console.log('ℹ️ [INFO] Configure DATABASE_URL para funcionalidade completa');
      }
    });

    // Tratamento de erros do servidor
    server.on('error', (error) => {
      console.error('❌ Erro no servidor:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Porta ${PORT} já está em uso`);
        process.exit(1);
      }
    });

    return server;

  } catch (error) {
    console.error('❌ [SERVER] Erro crítico ao iniciar:', error);

    // Tentar iniciar mesmo com erro
    console.log('🔄 [SERVER] Tentando iniciar sem banco de dados...');
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 CV Sem Frescura backend rodando na porta ${PORT} (modo limitado)`);
      console.log(`⚠️ Algumas funcionalidades podem não estar disponíveis`);
    });

    server.on('error', (serverError) => {
      console.error('❌ Erro crítico no servidor:', serverError);
      process.exit(1);
    });

    return server;
  }
}

// Inicializar servidor
startServer();