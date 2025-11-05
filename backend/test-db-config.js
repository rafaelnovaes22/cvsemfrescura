const sequelize = require('./db');
const AnalysisResults = require('./models/AnalysisResults');

console.log('🔍 Testando configuração do banco...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Verificar configuração do Sequelize
console.log('\n📊 Configuração do Sequelize:');
console.log('Dialect:', sequelize.getDialect());
console.log('Options:', {
    storage: sequelize.options.storage,
    host: sequelize.options.host,
    database: sequelize.options.database
});

// Testar conexão
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('\n✅ Conexão com banco estabelecida com sucesso');

        // Testar se a tabela existe
        const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='AnalysisResults';");
        console.log('📊 Tabela AnalysisResults existe:', results.length > 0 ? 'SIM' : 'NÃO');

        if (results.length > 0) {
            // Contar registros usando o modelo
            const count = await AnalysisResults.count();
            console.log('📊 Total de análises no modelo:', count);

            if (count > 0) {
                const latest = await AnalysisResults.findOne({
                    where: { userId: 1 },
                    order: [['createdAt', 'DESC']],
                    attributes: ['id', 'resumeFileName', 'createdAt']
                });

                if (latest) {
                    console.log('🔍 Última análise encontrada:', {
                        id: latest.id,
                        fileName: latest.resumeFileName,
                        date: latest.createdAt
                    });
                } else {
                    console.log('❌ Nenhuma análise encontrada para usuário 1');
                }
            }
        }

    } catch (error) {
        console.error('❌ Erro na conexão:', error.message);
    } finally {
        await sequelize.close();
    }
}

testConnection();
