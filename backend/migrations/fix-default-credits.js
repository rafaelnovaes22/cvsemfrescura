'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Remover crédito automático de todos os usuários que foram criados com 1 crédito por padrão
        // Isso é importante para manter a integridade do sistema de créditos
        await queryInterface.sequelize.query(`
      UPDATE users 
      SET credits = 0 
      WHERE credits = 1 
      AND id NOT IN (
        -- Aqui podemos adicionar IDs de usuários que legitimamente devem ter créditos
        -- Por exemplo, usuários que compraram créditos ou receberam códigos promocionais
        SELECT id FROM users WHERE id < 0  -- Placeholder que não seleciona ninguém
      )
    `);

        // Alterar o valor padrão da coluna para 0 (caso a alteração no modelo não tenha sido aplicada)
        await queryInterface.changeColumn('users', 'credits', {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false
        });

        console.log('✅ Migração aplicada: créditos padrão ajustados para 0');
    },

    down: async (queryInterface, Sequelize) => {
        // Reverter as alterações se necessário
        await queryInterface.changeColumn('users', 'credits', {
            type: Sequelize.INTEGER,
            defaultValue: 1,
            allowNull: false
        });

        console.log('⏪ Migração revertida: créditos padrão voltaram para 1');
    }
}; 