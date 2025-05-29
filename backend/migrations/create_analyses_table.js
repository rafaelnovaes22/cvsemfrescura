'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('analyses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_email: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: 'email'
        }
      },
      filename: {
        type: Sequelize.STRING,
        allowNull: true
      },
      job_links: {
        type: Sequelize.JSON,
        allowNull: true
      },
      result_data: {
        type: Sequelize.JSON,
        allowNull: false
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      average_score: {
        type: Sequelize.DECIMAL(4, 2),
        allowNull: true
      },
      jobs_analyzed: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('processing', 'completed', 'failed'),
        defaultValue: 'completed'
      },
      analysis_type: {
        type: Sequelize.STRING,
        defaultValue: 'universal_ats'
      },
      credits_used: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Adicionar índices para performance
    await queryInterface.addIndex('analyses', ['user_email']);
    await queryInterface.addIndex('analyses', ['created_at']);
    await queryInterface.addIndex('analyses', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('analyses');
  }
}; 