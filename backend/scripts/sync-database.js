const sequelize = require('../db');
const AnalysisResults = require('../models/AnalysisResults');
const User = require('../models/user');
const { logger } = require('../utils/logger');

async function syncDatabase() {
    try {
        console.log('🔄 Iniciando sincronização do banco de dados...');

        // Verificar conexão
        await sequelize.authenticate();
        console.log('✅ Conexão com banco estabelecida');

        // Sincronizar modelos (criar tabelas se não existirem, alterar se necessário)
        console.log('🔧 Sincronizando modelos...');

        // Sincronizar User primeiro (dependência)
        await User.sync({ alter: true });
        console.log('✅ Tabela users sincronizada');

        // Sincronizar AnalysisResults
        await AnalysisResults.sync({ alter: true });
        console.log('✅ Tabela AnalysisResults sincronizada');

        // Verificar estrutura final
        const tables = await sequelize.getQueryInterface().showAllTables();
        console.log('📋 Tabelas disponíveis:', tables);

        if (tables.includes('AnalysisResults')) {
            const structure = await sequelize.getQueryInterface().describeTable('AnalysisResults');
            console.log('📊 Estrutura da tabela AnalysisResults:');
            Object.keys(structure).forEach(column => {
                console.log(`  - ${column}: ${structure[column].type} ${structure[column].allowNull ? '(nullable)' : '(not null)'}`);
            });
        }

        // Testar criação de uma análise de exemplo (sem salvar)
        console.log('🧪 Testando modelo AnalysisResults...');
        const testAnalysis = AnalysisResults.build({
            userId: 1,
            resumeFileName: 'test.pdf',
            resumeContent: 'Test content',
            jobUrls: ['http://example.com/job1', 'http://example.com/job2'],
            result: {
                conclusion: 'Test conclusion',
                resumo: { nota: 8.5, avaliacao: 'Test evaluation' },
                job_keywords_present: ['javascript', 'react'],
                job_keywords_missing: ['python', 'django']
            }
        });

        // Validar sem salvar
        await testAnalysis.validate();
        console.log('✅ Modelo AnalysisResults validado com sucesso');

        console.log('🎉 Sincronização concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro durante sincronização:', error);
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    syncDatabase()
        .then(() => {
            console.log('✅ Script concluído com sucesso');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script falhou:', error);
            process.exit(1);
        });
}

module.exports = syncDatabase;