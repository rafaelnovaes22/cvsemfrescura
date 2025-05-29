'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

let sequelize;

try {
  console.log('🔍 [DATABASE] Inicializando conexão com banco de dados...');
  console.log('🔍 [DATABASE] Ambiente:', env);

  if (config.use_env_variable) {
    console.log('🔍 [DATABASE] Usando variável de ambiente:', config.use_env_variable);
    const databaseUrl = process.env[config.use_env_variable];

    if (!databaseUrl) {
      console.warn('⚠️ [DATABASE] DATABASE_URL não configurada, usando fallback SQLite');
      // Fallback para SQLite em caso de problema
      sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
        logging: false
      });
    } else {
      console.log('✅ [DATABASE] DATABASE_URL encontrada, conectando...');
      sequelize = new Sequelize(databaseUrl, {
        ...config,
        logging: env === 'development' ? console.log : false,
        retry: {
          max: 3
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      });
    }
  } else {
    console.log('🔍 [DATABASE] Usando configuração manual do banco');

    // Verificar se todas as configurações necessárias estão presentes
    if (!config.database || !config.username) {
      console.warn('⚠️ [DATABASE] Configurações incompletas, usando SQLite em memória');
      sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: ':memory:',
        logging: false
      });
    } else {
      sequelize = new Sequelize(config.database, config.username, config.password, {
        ...config,
        logging: env === 'development' ? console.log : false,
        retry: {
          max: 3
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      });
    }
  }

  console.log('✅ [DATABASE] Objeto Sequelize criado com sucesso');

} catch (error) {
  console.error('❌ [DATABASE] Erro ao criar conexão:', error.message);
  console.warn('⚠️ [DATABASE] Usando SQLite em memória como fallback');

  // Fallback para SQLite em caso de erro
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  });
}

// Carregar modelos com tratamento de erro
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    try {
      const modelDefiner = require(path.join(__dirname, file));

      // Verifica se é uma função (novo padrão) ou objeto (padrão antigo)
      if (typeof modelDefiner === 'function') {
        const model = modelDefiner(sequelize);
        db[model.name] = model;
        console.log('✅ [DATABASE] Modelo carregado:', model.name);
      } else if (modelDefiner && modelDefiner.name) {
        // Model já definido - adicionar diretamente
        db[modelDefiner.name] = modelDefiner;
        console.log('✅ [DATABASE] Modelo direto carregado:', modelDefiner.name);
      } else {
        // Compatibilidade com modelos antigos sem name
        const modelName = file.split('.')[0];
        db[modelName] = modelDefiner;
        console.log('✅ [DATABASE] Modelo legado carregado:', modelName);
      }
    } catch (error) {
      console.error('❌ [DATABASE] Erro ao carregar modelo', file, ':', error.message);
    }
  });

// Configurar associações com tratamento de erro
Object.keys(db).forEach(modelName => {
  try {
    if (db[modelName].associate) {
      db[modelName].associate(db);
      console.log('✅ [DATABASE] Associações configuradas para:', modelName);
    }
  } catch (error) {
    console.error('❌ [DATABASE] Erro nas associações de', modelName, ':', error.message);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Função utilitária para verificar conexão
db.testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ [DATABASE] Conexão testada com sucesso');
    return true;
  } catch (error) {
    console.error('❌ [DATABASE] Falha no teste de conexão:', error.message);
    return false;
  }
};

// Função para sync seguro
db.safeSync = async (options = {}) => {
  try {
    console.log('🔄 [DATABASE] Iniciando sincronização segura...');
    await sequelize.sync(options);
    console.log('✅ [DATABASE] Sincronização concluída com sucesso');
    return true;
  } catch (error) {
    console.error('❌ [DATABASE] Erro na sincronização:', error.message);
    console.warn('⚠️ [DATABASE] Sistema continuará sem persistência de dados');
    return false;
  }
};

module.exports = db;
