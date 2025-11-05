const sequelize = require('./db');
const AnalysisResults = require('./models/AnalysisResults');
const User = require('./models/user');

async function testUserAnalyses() {
    try {
        console.log('🔍 Testando acesso às análises do usuário...');

        // Buscar usuário ID 1 (você)
        const user = await User.findByPk(1);
        if (!user) {
            console.log('❌ Usuário não encontrado');
            return;
        }

        console.log(`✅ Usuário encontrado: ${user.name} (${user.email})`);

        // Buscar análises usando o método novo
        const analyses = await AnalysisResults.findUserAnalyses(1, 10);

        console.log(`📊 Total de análises encontradas: ${analyses.length}`);

        if (analyses.length > 0) {
            console.log('\n📋 Suas análises anteriores:');
            analyses.forEach((analysis, index) => {
                console.log(`\n${index + 1}. ID: ${analysis.id}`);
                console.log(`   📄 Arquivo: ${analysis.fileName}`);
                console.log(`   📅 Data: ${new Date(analysis.createdAt).toLocaleString('pt-BR')}`);
                console.log(`   🔗 Vagas: ${analysis.jobCount}`);
                console.log(`   📊 Tem scores: ${analysis.summary.hasCompatibilityScores ? 'Sim' : 'Não'}`);
                console.log(`   🔑 Tem palavras-chave: ${analysis.summary.hasKeywords ? 'Sim' : 'Não'}`);
                console.log(`   📝 Tem avaliações: ${analysis.summary.hasEvaluations ? 'Sim' : 'Não'}`);
            });

            // Testar acesso a uma análise específica
            const firstAnalysisId = analyses[0].id;
            console.log(`\n🧪 Testando acesso à análise específica: ${firstAnalysisId}`);

            const specificAnalysis = await AnalysisResults.findUserAnalysis(firstAnalysisId, 1);

            if (specificAnalysis) {
                console.log('✅ Análise específica acessada com sucesso!');
                console.log(`   📝 Tem conclusão: ${!!specificAnalysis.conclusion}`);
                console.log(`   📊 Tem resumo: ${!!specificAnalysis.resumo}`);
                console.log(`   🔑 Palavras presentes: ${specificAnalysis.job_keywords_present?.length || 0}`);
                console.log(`   ❌ Palavras ausentes: ${specificAnalysis.job_keywords_missing?.length || 0}`);
                console.log(`   🏢 Vagas analisadas: ${specificAnalysis.jobs?.length || 0}`);
                console.log(`   📋 É visualização histórica: ${specificAnalysis.isHistoricalView}`);

                if (specificAnalysis.conclusion) {
                    console.log(`   📄 Conclusão (preview): "${specificAnalysis.conclusion.substring(0, 100)}..."`);
                }
            } else {
                console.log('❌ Não foi possível acessar a análise específica');
            }

        } else {
            console.log('⚠️ Nenhuma análise encontrada para este usuário');
        }

        console.log('\n🎉 Teste concluído!');

    } catch (error) {
        console.error('❌ Erro durante teste:', error);
    } finally {
        await sequelize.close();
    }
}

testUserAnalyses();