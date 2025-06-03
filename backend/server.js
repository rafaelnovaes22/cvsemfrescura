require('dotenv').config();

// DEBUG: Verificar JWT_SECRET
console.log('🔍 JWT_SECRET está definido?', process.env.JWT_SECRET ? 'SIM ✅' : 'NÃO ❌');
if (!process.env.JWT_SECRET) {
  console.log('❌ ERRO: JWT_SECRET não encontrado no .env');
  console.log('❌ Isso causará erro 401 em todas as requisições autenticadas');
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
const path = require('path');
const { logger, logRequest, logError } = require('./utils/logger');
const atsRoutes = require('./routes/ats');
const userRoutes = require('./routes/user');

const app = express();

// 🔧 Trust proxy para Railway/proxies reversos
// Isso permite que o Express confie nos headers X-Forwarded-*
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Confia no primeiro proxy
} else {
  app.set('trust proxy', true); // Para desenvolvimento
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

// 🎨 Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
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

const PORT = process.env.PORT || 3000;

// Sincronia leve para garantir que as tabelas existam
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Banco de dados sincronizado');
    app.listen(PORT, () => {
      console.log(`ATS backend rodando na porta ${PORT}`);
      console.log(`Frontend servido em: http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Erro ao sincronizar banco de dados:', err);
  });
