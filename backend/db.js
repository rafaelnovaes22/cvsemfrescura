const { Sequelize } = require('sequelize');
const path = require('path');
const { logger } = require('./utils/logger');

let sequelize;

// Para desenvolvimento local, usar SQLite se DATABASE_URL contém sqlite
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sqlite')) {
  logger.info('Usando SQLite para desenvolvimento local');

  // Configurar SQLite para desenvolvimento
  const dbPath = path.join(__dirname, 'database', 'dev.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: process.env.NODE_ENV === 'development' ? logger.debug.bind(logger) : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

  logger.info(`Banco de dados SQLite configurado: ${path.basename(dbPath)}`);
} else if (process.env.NODE_ENV === 'development') {
  logger.info('Ambiente de desenvolvimento detectado - usando SQLite como fallback');

  // Configurar SQLite para desenvolvimento
  const dbPath = path.join(__dirname, 'database', 'dev.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: process.env.NODE_ENV === 'development' ? logger.debug.bind(logger) : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

  logger.info(`SQLite configurado para desenvolvimento`);
} else {
  // Produção - usar configuração original (PostgreSQL)
  const DATABASE_URL = process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER || 'cvuser'}:${process.env.DB_PASSWORD || 'cvpass123'}@${process.env.DB_HOST || 'postgres'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'cv_sem_frescura'}`;

  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: false,
    },
  });
  
  logger.info('PostgreSQL configurado para produção');
}

module.exports = sequelize;
