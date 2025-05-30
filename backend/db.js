const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let sequelize;

// Função para criar conexão SQLite como fallback
function createSQLiteConnection() {
  console.log('🔄 Criando conexão SQLite...');

  const sqliteSequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

  return sqliteSequelize;
}

// Função para tentar conectar ao PostgreSQL com timeout mais agressivo
async function tryPostgresConnection() {
  console.log('🔄 Tentando conectar ao PostgreSQL...');

  // Se não há DATABASE_URL ou está em modo emergência, pular PostgreSQL
  if (!process.env.DATABASE_URL || process.env.FORCE_SQLITE === 'true') {
    console.log('⚠️ DATABASE_URL não configurada ou FORCE_SQLITE ativado');
    throw new Error('PostgreSQL ignorado - usando SQLite');
  }

  const DATABASE_URL = process.env.DATABASE_URL;

  const postgresSequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 15000, // Reduzido para 15s
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false,
      connectTimeout: 10000, // 10s timeout
    },
    retry: {
      max: 2 // Apenas 2 tentativas
    }
  });

  try {
    // Timeout manual para evitar travamento
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout na conexão PostgreSQL')), 10000);
    });

    const authPromise = postgresSequelize.authenticate();

    await Promise.race([authPromise, timeoutPromise]);
    console.log('✅ PostgreSQL conectado com sucesso');
    return postgresSequelize;
  } catch (error) {
    console.log('❌ Falha na conexão PostgreSQL:', error.message);
    throw error;
  }
}

// Inicializar conexão com fallback GARANTIDO
async function initializeDatabase() {
  try {
    sequelize = await tryPostgresConnection();
    console.log('✅ Usando PostgreSQL como banco principal');
    return sequelize;
  } catch (error) {
    console.log('⚠️ PostgreSQL indisponível, FORÇANDO SQLite como fallback');
    console.log('🔄 Erro PostgreSQL:', error.message);

    try {
      sequelize = createSQLiteConnection();
      await sequelize.authenticate();
      console.log('✅ SQLite conectado com sucesso (fallback FORÇADO)');
      return sequelize;
    } catch (sqliteError) {
      console.error('❌ ERRO CRÍTICO: SQLite também falhou');
      console.error('PostgreSQL:', error.message);
      console.error('SQLite:', sqliteError.message);

      // ÚLTIMO RECURSO: Retornar sequelize mock para não quebrar aplicação
      if (process.env.NODE_ENV === 'production') {
        console.log('🆘 MODO EMERGÊNCIA: Retornando mock do banco');
        return {
          authenticate: () => Promise.resolve(),
          sync: () => Promise.resolve(),
          close: () => Promise.resolve(),
          getDialect: () => 'mock',
          config: { storage: 'emergency-mode' }
        };
      }

      throw sqliteError;
    }
  }
}

// Exportar uma Promise que resolve com a conexão
const databaseConnection = initializeDatabase();

// Para compatibilidade com código existente, exportar um proxy
const sequelizeProxy = new Proxy({}, {
  get(target, prop) {
    if (prop === 'then' || prop === 'catch') {
      return databaseConnection[prop].bind(databaseConnection);
    }

    if (sequelize) {
      return sequelize[prop];
    }

    // Se ainda não inicializou, retornar uma Promise
    return databaseConnection.then(seq => seq[prop]);
  }
});

module.exports = sequelizeProxy;
