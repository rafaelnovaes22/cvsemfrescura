const { Sequelize } = require('sequelize');
const path = require('path');

// Conectar diretamente ao SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database', 'dev.sqlite'),
    logging: console.log
});

async function fixSQLiteConstraint() {
    try {
        console.log('🔍 Conectando ao SQLite...');
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados SQLite');

        console.log('🔍 Verificando estrutura da tabela gift_code_usages...');

        // Verificar índices atuais
        const indexes = await sequelize.query(
            'PRAGMA index_list(gift_code_usages)',
            { type: Sequelize.QueryTypes.SELECT }
        );

        console.log('📋 Índices atuais:', indexes);

        // Verificar detalhes de cada índice
        for (const index of indexes) {
            const indexInfo = await sequelize.query(
                `PRAGMA index_info(${index.name})`,
                { type: Sequelize.QueryTypes.SELECT }
            );
            console.log(`📊 Índice ${index.name}:`, indexInfo);
        }

        // Verificar registros atuais
        const usages = await sequelize.query(
            'SELECT * FROM gift_code_usages',
            { type: Sequelize.QueryTypes.SELECT }
        );
        console.log('📝 Registros atuais em gift_code_usages:', usages);

        // Limpar tabela
        console.log('🗑️ Limpando tabela gift_code_usages...');
        await sequelize.query('DELETE FROM gift_code_usages');
        console.log('✅ Tabela limpa');

        // Dropar tabela e recriar com estrutura correta
        console.log('🔧 Recriando tabela com estrutura correta...');
        await sequelize.query('DROP TABLE IF EXISTS gift_code_usages');

        // Recriar tabela com a estrutura correta
        await sequelize.query(`
            CREATE TABLE gift_code_usages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                giftCodeId INTEGER NOT NULL,
                userId INTEGER NOT NULL,
                usedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (giftCodeId) REFERENCES gift_codes(id),
                FOREIGN KEY (userId) REFERENCES users(id),
                UNIQUE(giftCodeId, userId)
            )
        `);

        console.log('✅ Tabela recriada com estrutura correta!');

        // Verificar nova estrutura
        const newIndexes = await sequelize.query(
            'PRAGMA index_list(gift_code_usages)',
            { type: Sequelize.QueryTypes.SELECT }
        );
        console.log('🆕 Novos índices:', newIndexes);

        // Teste: tentar inserir o mesmo giftCodeId com usuários diferentes (deve funcionar)
        console.log('🧪 Testando nova estrutura...');

        // Testar inserção válida
        await sequelize.query(`
            INSERT INTO gift_code_usages (giftCodeId, userId) VALUES (1, 999), (1, 998)
        `);
        console.log('✅ Teste passou: diferentes usuários podem usar o mesmo código');

        // Limpar dados de teste
        await sequelize.query('DELETE FROM gift_code_usages WHERE userId IN (999, 998)');

        console.log('🎉 Correção concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro durante correção:', error);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

fixSQLiteConstraint(); 