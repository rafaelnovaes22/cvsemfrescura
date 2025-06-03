const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

let sequelize;

// Verificar se temos configuração de PostgreSQL (Railway/Produção)
if (process.env.DATABASE_URL) {
  console.log('🐘 Usando PostgreSQL (Railway/Produção)');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? { require: true, rejectUnauthorized: false } : false,
    },
  });
} else if (process.env.DB_HOST && process.env.DB_HOST !== 'postgres') {
  // Configuração PostgreSQL manual (não Docker)
  console.log('🐘 Usando PostgreSQL (configuração manual)');
  const DATABASE_URL = `postgresql://${process.env.DB_USER || 'cvuser'}:${process.env.DB_PASSWORD || 'cvpass123'}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'cv_sem_frescura'}`;
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
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
} else {
  // Fallback para SQLite (desenvolvimento local)
  console.log('💾 Usando SQLite (desenvolvimento local)');
  const dbPath = path.join(__dirname, 'database', 'cv_sem_frescura.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  });
}

module.exports = sequelize;
