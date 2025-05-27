require('dotenv').config();

// DEBUG: Verificar JWT_SECRET
console.log('🔍 JWT_SECRET está definido?', process.env.JWT_SECRET ? 'SIM ✅' : 'NÃO ❌');
if (!process.env.JWT_SECRET) {
  console.log('❌ ERRO: JWT_SECRET não encontrado no .env');
  console.log('❌ Isso causará erro 401 em todas as requisições autenticadas');
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { logger, logRequest, logError } = require('./utils/logger');
const atsRoutes = require('./routes/ats');
const userRoutes = require('./routes/user');
const { router: monitoringRouter, collectMetrics, incrementMetric } = require('./routes/monitoring');

const app = express();

// ✅ Configurar trust proxy para Railway/produção
app.set('trust proxy', true);

// Logging de requests
app.use(logRequest);

// Segurança - Headers HTTP
app.use(helmet({
  contentSecurityPolicy: false, // Desabilitar CSP para não quebrar o frontend
  crossOriginEmbedderPolicy: false
}));

// Rate limiting - proteção contra ataques
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por janela
  message: 'Muitas tentativas. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting específico para análises ATS
const atsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 10 análises por IP por hora
  message: 'Limite de análises excedido. Tente novamente em 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

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
app.use('/api/user', userRoutes);
app.use('/api/ats', atsLimiter, atsRoutes); // Rate limiting específico para ATS
app.use('/api/upload', require('./routes/upload'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/gift-code', require('./routes/giftCode'));
app.use('/api/password-reset', require('./routes/passwordReset'));
app.use('/api/contact', require('./routes/contact')); // Recuperação de senha
app.use('/api/admin', require('./routes/admin')); // Rotas administrativas
app.use('/api/config', require('./routes/config')); // ✅ Configurações dinâmicas
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
const User = require('./models/user');
const GiftCode = require('./models/giftCode');
const GiftCodeUsage = require('./models/giftCodeUsage');
const Transaction = require('./models/Transaction');

console.log('Modelo User importado:', User ? 'OK' : 'ERRO');

const PORT = process.env.PORT || 3000;

console.log('🚀 Configuração do servidor:');
console.log('- Porta configurada:', PORT);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- Railway PORT env:', process.env.PORT ? 'SIM ✅' : 'NÃO ❌');

// Sincronia leve para garantir que as tabelas existam
sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ Banco de dados sincronizado');
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 CV Sem Frescura backend rodando na porta ${PORT}`);
      console.log(`🌐 Servidor disponível em todas as interfaces (0.0.0.0:${PORT})`);
    });

    // Tratamento de erros do servidor
    server.on('error', (error) => {
      console.error('❌ Erro no servidor:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Porta ${PORT} já está em uso`);
        process.exit(1);
      }
    });
  })
  .catch(err => {
    console.error('❌ Erro ao sincronizar banco de dados:', err);
    process.exit(1);
  });
