'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar se a coluna existe antes de tentar criá-la
    const tableInfo = await queryInterface.describeTable('Users');
    
    const columnsToAdd = [];
    
    if (!tableInfo.onboarding_completed) {
      columnsToAdd.push(
        queryInterface.addColumn('Users', 'onboarding_completed', {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        })
      );
    }
    
    if (!tableInfo.job_area) {
      columnsToAdd.push(
        queryInterface.addColumn('Users', 'job_area', {
          type: Sequelize.STRING,
          allowNull: true
        })
      );
    }
    
    if (!tableInfo.experience_level) {
      columnsToAdd.push(
        queryInterface.addColumn('Users', 'experience_level', {
          type: Sequelize.STRING,
          allowNull: true
        })
      );
    }
    
    if (!tableInfo.preferences) {
      columnsToAdd.push(
        queryInterface.addColumn('Users', 'preferences', {
          type: Sequelize.JSON,
          defaultValue: {}
        })
      );
    }
    
    return Promise.all(columnsToAdd);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('Users', 'onboarding_completed'),
      queryInterface.removeColumn('Users', 'job_area'),
      queryInterface.removeColumn('Users', 'experience_level'),
      queryInterface.removeColumn('Users', 'preferences')
    ]);
  }
};
