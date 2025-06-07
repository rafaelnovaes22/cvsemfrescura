const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// DEBUG: Verificar JWT_SECRET
console.log('🔍 JWT_SECRET está definido?', process.env.JWT_SECRET ? 'SIM ✅' : 'NÃO ❌');
if (!process.env.JWT_SECRET) {
  console.log('❌ ERRO: JWT_SECRET não encontrado no .env');
  console.log('❌ Isso causará erro 401 em todas as requisições autenticadas');
  console.log('⚠️  JWT_SECRET não definido. Usando secret temporário para desenvolvimento.');
  console.log('⚠️  DEFINA JWT_SECRET no arquivo .env para produção!');
  process.env.JWT_SECRET = 'desenvolvimento_jwt_secret_temporario_minimo_32_caracteres_12345';
}

// DEBUG: Verificar configurações de proxy e rate limiting
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 Trust Proxy habilitado:', process.env.NODE_ENV === 'production' ? 'SIM (1)' : 'SIM (true)');
console.log('🔍 Rate Limit Window:', parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, 'ms');
console.log('🔍 Rate Limit Max:', parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, 'requests');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { logger, logRequest, logError } = require('./utils/logger');
const atsRoutes = require('./routes/ats');
const userRoutes = require('./routes/user');

const app = express();

// 🔧 Trust proxy para Railway/proxies reversos
// Em desenvolvimento, configurar para aceitar mais proxies
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Confia no primeiro proxy
} else {
  app.set('trust proxy', true); // Para desenvolvimento local
}

// Logging de requests
app.use(logRequest);

// 🔧 Middleware para debug de IPs em produção
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    const forwarded = req.get('X-Forwarded-For');
    const real = req.get('X-Real-IP');
    const ip = req.ip;

    if (forwarded || real) {
      logger.info('🔍 Request IP Info:', {
        forwarded,
        real,
        express_ip: ip,
        connection_ip: req.connection.remoteAddress
      });
    }
    next();
  });
}

// Segurança - Headers HTTP
app.use(helmet({
  contentSecurityPolicy: false, // Desabilitar CSP para não quebrar o frontend
  crossOriginEmbedderPolicy: false
}));

// Rate limiting - configurações mais permissivas para desenvolvimento
const isDevelopment = process.env.NODE_ENV !== 'production';
const limiter = rateLimit({
  windowMs: isDevelopment ? 60 * 1000 : 15 * 60 * 1000, // 1 minuto em dev, 15 minutos em prod
  max: isDevelopment ? 10000 : 100, // 10000 requests em dev (muito permissivo), 100 em prod
  message: 'Muitas tentativas. Tente novamente em alguns minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Em desenvolvimento, pular rate limiting para TUDO exceto casos específicos
    if (isDevelopment) {
      return true; // Pular rate limiting completamente em desenvolvimento
    }
    return false;
  }
});

// Rate limiting específico para análises ATS (menos restritivo em dev)
const atsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: isDevelopment ? 1000 : 10, // muito mais permissivo em desenvolvimento
  message: 'Limite de análises excedido. Tente novamente em 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Em desenvolvimento, pular rate limiting para ATS também
    if (isDevelopment) {
      return true;
    }
    return false;
  }
});

app.use(limiter);

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

// 🔧 DEBUG: Rota específica para login (contorna erro 405)
app.post('/login', async (req, res) => {
  try {
    // Importar e usar o controller diretamente
    const userController = require('./controllers/userController');
    await userController.login(req, res);
  } catch (error) {
    console.error('Erro na rota de login direto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 🔧 DEBUG: Rota específica para créditos (contorna erro 405)
app.get('/credits', async (req, res) => {
  try {
    const authMiddleware = require('./utils/authMiddleware');
    const userController = require('./controllers/userController');

    // Aplicar middleware de autenticação
    authMiddleware(req, res, async () => {
      await userController.getCredits(req, res);
    });
  } catch (error) {
    console.error('Erro na rota de créditos direto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 🔧 DEBUG: Rota específica para histórico (contorna erro 405)
app.get('/history', async (req, res) => {
  try {
    const authMiddleware = require('./utils/authMiddleware');
    const paymentController = require('./controllers/paymentController');

    // Aplicar middleware de autenticação
    authMiddleware(req, res, async () => {
      await paymentController.getTransactionHistory(req, res);
    });
  } catch (error) {
    console.error('Erro na rota de histórico direto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API Routes (ANTES dos arquivos estáticos)
app.use('/api/user', userRoutes);
app.use('/api/ats', atsLimiter, atsRoutes); // Rate limiting específico para ATS
app.use('/api/upload', require('./routes/upload'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/gift-code', require('./routes/giftCode'));
app.use('/api/password-reset', require('./routes/passwordReset'));
app.use('/api/contact', require('./routes/contact')); // Recuperação de senha
app.use('/api/admin', require('./routes/admin')); // Rotas administrativas
app.use('/api/config', require('./routes/config')); // ✅ Configurações dinâmicas
app.use('/health', require('./routes/health')); // Health check endpoint

// ✅ API health check para Railway
app.get('/api/health', (req, res) => {
  res.json({
    message: 'CV Sem Frescura API',
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 🎨 Servir arquivos estáticos do frontend com configuração específica de MIME types
const staticOptions = {
  setHeaders: (res, filePath) => {
    // Forçar MIME types corretos baseado na extensão do arquivo
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.css':
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
        break;
      case '.js':
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        break;
      case '.png':
        res.setHeader('Content-Type', 'image/png');
        break;
      case '.jpg':
      case '.jpeg':
        res.setHeader('Content-Type', 'image/jpeg');
        break;
      case '.svg':
        res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
        break;
      case '.ico':
        res.setHeader('Content-Type', 'image/x-icon');
        break;
      case '.html':
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        break;
      case '.woff':
        res.setHeader('Content-Type', 'font/woff');
        break;
      case '.woff2':
        res.setHeader('Content-Type', 'font/woff2');
        break;
      case '.ttf':
        res.setHeader('Content-Type', 'font/ttf');
        break;
      case '.json':
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        break;
    }

    // Headers de cache para assets estáticos
    if (ext === '.css' || ext === '.js' || ext === '.png' || ext === '.jpg' || ext === '.svg') {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 ano
    }
  },
  fallthrough: true, // ✅ Permitir que outras rotas sejam processadas se o arquivo não for encontrado
  index: false // ✅ Não servir index.html automaticamente para diretórios
};

// ✅ Middleware para pular arquivos estáticos em requisições de API
app.use((req, res, next) => {
  // Se for uma requisição para API, pular o middleware de arquivos estáticos
  if (req.path.startsWith('/api/')) {
    return next();
  }
  // Caso contrário, usar o middleware de arquivos estáticos
  return express.static(path.join(__dirname, '../frontend'), staticOptions)(req, res, next);
});

// ✅ Rota raiz serve a página principal (landing.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/landing.html'));
});

// ✅ Catch-all para SPA - redireciona para landing.html
app.get('*', (req, res) => {
  // Se for uma requisição para API, retorna 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // Caso contrário, serve a landing page
  res.sendFile(path.join(__dirname, '../frontend/landing.html'));
});

const sequelize = require('./db');

// Carregar modelos para sincronização
const User = require('./models/user');
const GiftCode = require('./models/giftCode');
const GiftCodeUsage = require('./models/giftCodeUsage');
const Transaction = require('./models/Transaction');

console.log('Modelo User importado:', User ? 'OK' : 'ERRO');

// Configurar associações entre modelos
const models = {
  User,
  GiftCode,
  GiftCodeUsage,
  Transaction
};

// Configurar as associações
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

const PORT = process.env.PORT || 3000;

// ✅ Sincronização segura - apenas criar tabelas que não existem
// Alterado de { alter: true } para { force: false } para evitar conflitos de foreign key
sequelize.sync({ force: false })
  .then(() => {
    console.log('✅ Banco de dados sincronizado com segurança');
    console.log('📊 Tabelas criadas se necessário, sem alterar estruturas existentes');
    app.listen(PORT, () => {
      console.log(`🚀 ATS backend rodando na porta ${PORT}`);
      console.log(`🌐 Frontend servido em: http://localhost:${PORT}`);
      console.log('✅ Servidor pronto para teste de validação!');
    });
  })
  .catch(err => {
    console.error('❌ Erro ao sincronizar banco de dados:', err);
    console.log('⚠️ Tentando iniciar servidor mesmo assim...');
    app.listen(PORT, () => {
      console.log(`🚀 ATS backend rodando na porta ${PORT} (modo fallback)`);
      console.log(`🌐 Frontend servido em: http://localhost:${PORT}`);
    });
  });
