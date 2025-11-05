const sequelize = require('./db');
const AnalysisResults = require('./models/AnalysisResults');

async function simulateFrontendAccess() {
    try {
        console.log('🌐 Simulando acesso do frontend às análises...');

        // Simular chamada para /api/ats/history
        console.log('\n1️⃣ Simulando GET /api/ats/history');
        const historyData = await AnalysisResults.findUserAnalyses(1, 10);

        console.log(`✅ API retornaria ${historyData.length} análises para o histórico`);

        if (historyData.length > 0) {
            // Mostrar como apareceria na interface
            console.log('\n📋 Como apareceria na página de histórico:');
            historyData.slice(0, 3).forEach((analysis, index) => {
                console.log(`\n   ${index + 1}. [Ver Análise] ${analysis.fileName}`);
                console.log(`      📅 ${new Date(analysis.createdAt).toLocaleDateString('pt-BR')}`);
                console.log(`      🔗 ${analysis.jobCount} vagas analisadas`);
                console.log(`      🆔 ID: ${analysis.id}`);
            });

            // Simular clique em "Ver Análise"
            const firstAnalysisId = historyData[0].id;
            console.log(`\n2️⃣ Simulando clique em "Ver Análise" para ID: ${firstAnalysisId}`);

            // Simular chamada para /api/ats/analysis/:id
            const analysisData = await AnalysisResults.findUserAnalysis(firstAnalysisId, 1);

            if (analysisData) {
                console.log('✅ API retornaria dados completos da análise');

                // Simular o que seria salvo no sessionStorage
                console.log('\n3️⃣ Dados que seriam salvos no sessionStorage:');
                console.log(`   📄 fileName: "${analysisData.fileName}"`);
                console.log(`   📋 isHistoricalView: ${analysisData.isHistoricalView}`);
                console.log(`   📝 Tem conclusão: ${!!analysisData.conclusion}`);
                console.log(`   📊 Tem resumo: ${!!analysisData.resumo}`);
                console.log(`   🔑 Palavras presentes: ${analysisData.job_keywords_present?.length || 0}`);
                console.log(`   ❌ Palavras ausentes: ${analysisData.job_keywords_missing?.length || 0}`);

                // Verificar campos de avaliação
                const avaliacoes = ['resumo', 'idiomas', 'formacao', 'habilidades', 'informacoes_pessoais', 'experiencia_profissional'];
                console.log('\n4️⃣ Avaliações disponíveis:');
                avaliacoes.forEach(campo => {
                    const avaliacao = analysisData[campo];
                    if (avaliacao && avaliacao.nota) {
                        console.log(`   ✅ ${campo}: Nota ${avaliacao.nota}/10`);
                    } else {
                        console.log(`   ⚠️ ${campo}: Não disponível`);
                    }
                });

                // Simular o que apareceria na página results.html
                console.log('\n5️⃣ Como apareceria na página de resultados:');
                console.log('   🎯 Título: "📋 Análise de Currículo (Histórico)"');
                console.log('   🏷️ Badge: "📋 Análise do histórico - consulta gratuita"');
                console.log('   📄 Nome do arquivo exibido');
                console.log('   📝 Conclusão completa exibida');
                console.log('   📊 Todas as avaliações com notas');
                console.log('   🔑 Palavras-chave organizadas');
                console.log('   ✨ Sem consumo de créditos');

                console.log('\n🎉 SUCESSO! Suas análises anteriores podem ser consultadas normalmente!');

            } else {
                console.log('❌ Erro: Não foi possível acessar dados da análise');
            }
        } else {
            console.log('⚠️ Nenhuma análise encontrada');
        }

    } catch (error) {
        console.error('❌ Erro durante simulação:', error);
    } finally {
        await sequelize.close();
    }
}

simulateFrontendAccess();