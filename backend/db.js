const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Construindo DATABASE_URL a partir das variáveis individuais se não estiver definida
const DATABASE_URL = process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER || 'cvuser'}:${process.env.DB_PASSWORD || 'cvpass123'}@${process.env.DB_HOST || 'postgres'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'cv_sem_frescura'}`;

const sequelize = new Sequelize(DATABASE_URL, {
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

module.exports = sequelize;
