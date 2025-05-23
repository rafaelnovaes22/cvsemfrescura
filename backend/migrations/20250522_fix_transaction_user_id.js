'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Criar a tabela Transactions com a estrutura correta desde o início
      await queryInterface.createTable('Transactions', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id'
          }
        },
        amount: {
          type: Sequelize.FLOAT,
          allowNull: false,
        },
        credits: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        status: {
          type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'),
          defaultValue: 'pending',
        },
        paymentMethod: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        paymentIntentId: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        stripeCustomerId: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        metadata: {
          type: Sequelize.JSONB,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      });
      
      console.log('Tabela Transactions criada com sucesso!');
      return Promise.resolve();
    } catch (error) {
      // Se a tabela já existir, ignoramos o erro
      if (error.name === 'SequelizeUniqueConstraintError' || 
          (error.original && error.original.code === '23505') ||
          error.message.includes('already exists')) {
        console.log('A tabela Transactions já existe. Ignorando.');
        return Promise.resolve();
      }
      
      console.error('Erro ao executar migração:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Não é recomendado reverter esta migração em produção
    // pois isso pode causar incompatibilidade de dados
    return Promise.resolve();
  }
};
