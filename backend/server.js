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

const app = express();

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
app.use('/health', require('./routes/health')); // Health check endpoint

// ✅ API raiz simples para health check
app.get('/', (req, res) => {
  res.json({
    message: 'CV Sem Frescura API',
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
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
    });
  })
  .catch(err => {
    console.error('Erro ao sincronizar banco de dados:', err);
  });
