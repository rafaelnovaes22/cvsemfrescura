// server.js
const dotenv = require('dotenv');
const path = require('path');

// Configurar variáveis de ambiente antes de qualquer importação
process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Carregar arquivo .env
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Validar variáveis de ambiente críticas
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'JWT_COOKIE_EXPIRES_IN'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Variáveis de ambiente obrigatórias não definidas: ${missingEnvVars.join(', ')}`);
}

const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./config/logger');

// Conectar ao banco de dados
connectDB();

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  logger.info(`Servidor rodando na porta ${port}`);
});

process.on('unhandledRejection', err => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
});

// Para plataformas Heroku/Render/etc
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEBIDO. Desligando graciosamente');
  server.close(() => {
    logger.info('💥 Processo terminado!');
  });
});