const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database', 'dev.sqlite'),
    logging: false
});

async function fixConstraintSimple() {
    try {
        console.log('🔧 CORREÇÃO RÁPIDA: Removendo constraints problemáticas...');

        await sequelize.authenticate();

        // Limpar registros existentes
        await sequelize.query('DELETE FROM gift_code_usages');
        console.log('✅ Tabela gift_code_usages limpa');

        // Simplesmente recriar a tabela SEM constraints problemáticas
        await sequelize.query('DROP TABLE IF EXISTS gift_code_usages');

        await sequelize.query(`
            CREATE TABLE gift_code_usages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                giftCodeId INTEGER NOT NULL,
                userId INTEGER NOT NULL,
                usedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(giftCodeId, userId)
            )
        `);

        console.log('✅ Tabela recriada CORRETAMENTE!');

        // Testar inserção
        await sequelize.query(`
            INSERT INTO gift_code_usages (giftCodeId, userId) VALUES (1, 100), (1, 101)
        `);
        console.log('✅ TESTE OK: Múltiplos usuários podem usar o mesmo código!');

        // Limpar teste
        await sequelize.query('DELETE FROM gift_code_usages');
        console.log('🎉 PROBLEMA CORRIGIDO!');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

fixConstraintSimple(); 