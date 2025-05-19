/**
 * Configuração da conexão com o PostgreSQL usando Sequelize
 * Carrega configurações específicas do ambiente (development, test, production)
 * e prioriza variáveis de ambiente para dados sensíveis.
 */

const { Sequelize } = require('sequelize');
require('dotenv').config(); // Carrega variáveis do .env

const env = process.env.NODE_ENV || 'development';
const envConfig = require('./config.json')[env]; // Carrega a configuração do ambiente do config.json

// Prioriza variáveis de ambiente, depois o config.json, depois valores padrão se aplicável
const dbName = process.env.DB_NAME || envConfig.database || 'cvsemfrescura_fallback_db';
const dbUser = process.env.DB_USER || envConfig.username || 'postgres_fallback_user';
const dbPassword = process.env.DB_PASSWORD || envConfig.password || 'postgres_fallback_pass';
const dbHost = process.env.DB_HOST || envConfig.host || 'localhost';
const dbPort = process.env.DB_PORT || envConfig.port || 5432;

// Cria a instância do Sequelize
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: envConfig.dialect || 'postgres', // Pega o dialeto do config.json
  logging: envConfig.logging !== undefined ? envConfig.logging : console.log, // Pega o logging do config.json
  dialectOptions: envConfig.dialectOptions || {}, // Pega todas as dialectOptions do config.json
  pool: { // Configurações de pool podem ser padronizadas ou vir do config.json também
    max: 20,
    min: 5,
    acquire: 60000,
    idle: 10000
  }
});

// Função para testar a conexão
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`Conexão com PostgreSQL (${env}) estabelecida com sucesso.`);
    return sequelize;
  } catch (error) {
    console.error(`Erro ao conectar ao PostgreSQL (${env}):`, error.message);
    // Em produção, você pode querer um tratamento de erro mais robusto aqui
    // do que simplesmente sair do processo, dependendo da sua estratégia de reinicialização.
    if (process.env.NODE_ENV === 'production') {
      // Lógica de retry ou log mais detalhado para produção
    }
    process.exit(1); // Ou lance o erro para ser tratado por um gerenciador de processo
  }
};

module.exports = { sequelize, connectDB };
