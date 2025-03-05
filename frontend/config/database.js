// config/database.js
const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    logger.info(`MongoDB Conectado: ${conn.connection.host}`);
    
    // Eventos para monitorar a conexão
    mongoose.connection.on('error', (err) => {
      logger.error(`Erro na conexão do MongoDB: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB desconectado, tentando reconectar...');
      setTimeout(connectDB, 5000);
    });
    
  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    // Tentar reconectar com delay
    logger.info('Tentando reconectar ao MongoDB em 5 segundos...');
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;