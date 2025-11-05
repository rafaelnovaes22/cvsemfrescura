const sequelize = require('./db');
const AnalysisResults = require('./models/AnalysisResults');

async function debugHistory() {
    try {
        console.log('🔄 Conectando ao banco de dados...');

        // Verificar se a tabela existe
        const tableExists = await sequelize.getQueryInterface().showAllTables();
        console.log('📋 Tabelas existentes:', tableExists);

        // Verificar se AnalysisResults existe
        const hasAnalysisResults = tableExists.includes('AnalysisResults');
        console.log('✅ Tabela AnalysisResults existe:', hasAnalysisResults);

        if (!hasAnalysisResults) {
            console.log('❌ Tabela AnalysisResults não existe! Criando...');
            await sequelize.sync({ force: false });
            console.log('✅ Tabela criada com sucesso');
        }

        // Verificar total de análises
        const count = await AnalysisResults.count();
        console.log(`📊 Total de análises na base: ${count}`);

        if (count > 0) {
            // Buscar as últimas análises
            const analyses = await AnalysisResults.findAll({
                limit: 5,
                order: [['createdAt', 'DESC']],
                attributes: ['id', 'userId', 'resumeFileName', 'createdAt']
            });

            console.log('\n🔍 Últimas análises:');
            analyses.forEach((analysis, index) => {
                console.log(`${index + 1}. ID: ${analysis.id}, User: ${analysis.userId}, Arquivo: ${analysis.resumeFileName}, Data: ${analysis.createdAt}`);
            });
        } else {
            console.log('❌ Não há análises na base de dados!');
        }

    } catch (error) {
        console.error('❌ Erro ao verificar banco:', error);
    } finally {
        await sequelize.close();
        console.log('\n✅ Verificação concluída');
    }
}

debugHistory();