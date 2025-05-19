// Configurações iniciais
require('dotenv').config();
const initSentry = require('./config/sentry');

// Inicializar Sentry antes de qualquer outro código
initSentry();

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');

// Importando configurações do banco de dados PostgreSQL
const { connectDB } = require('./config/database');
const { initializeDatabase } = require('./config/initModels');

// Rotas da API
const atsRoutes = require('./routes/ats');
const feedbackRoutes = require('./routes/feedback');
const paymentRoutes = require('./routes/payments');
const authRoutes = require('./routes/auth');

const app = express();
app.use(helmet()); // Adiciona headers de segurança

// Configuração de CORS
const allowedOrigins = ['https://cvsemfrescura.com.br'];
const corsOptions = {
  origin: (origin, callback) => {
    // Permite requisições sem 'origin' (ex: mobile apps, curl, Postman) ou durante o desenvolvimento
    if (process.env.NODE_ENV === 'development' || !origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/ats', atsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);

// Servir arquivos estáticos do frontend
const frontendPath = path.resolve(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Redirecionar qualquer rota que não seja API para index.html (SPA)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;

// Função para iniciar o servidor após conectar ao banco de dados
const startServer = async () => {
  try {
    // Conecta ao PostgreSQL
    await connectDB();
    
    // Inicializa os modelos e sincroniza com o banco
    await initializeDatabase();
    
    // Inicia o servidor Express
    app.listen(PORT, () => {
      console.log(`ATS backend rodando na porta ${PORT}`);
      console.log('Conexão com PostgreSQL estabelecida com sucesso');
    });
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error.message);
    process.exit(1);
  }
};

// Inicia o servidor
startServer();
