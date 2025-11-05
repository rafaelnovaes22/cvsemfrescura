const sequelize = require('./db');
const AnalysisResults = require('./models/AnalysisResults');

async function debugCompleteFlow() {
    try {
        console.log('🔍 DEBUG COMPLETO - Fluxo de Histórico de Análises');
        console.log('='.repeat(60));

        // 1. Verificar dados no banco
        console.log('\n1️⃣ VERIFICANDO DADOS NO BANCO');
        const analyses = await AnalysisResults.findUserAnalyses(1, 5);
        console.log(`📊 Total de análises do usuário 1: ${analyses.length}`);

        if (analyses.length === 0) {
            console.log('❌ Nenhuma análise encontrada! Problema está no banco de dados.');
            return;
        }

        // Mostrar primeira análise
        const firstAnalysis = analyses[0];
        console.log(`\n📋 Primeira análise:`);
        console.log(`   🆔 ID: ${firstAnalysis.id}`);
        console.log(`   📄 Arquivo: ${firstAnalysis.fileName}`);
        console.log(`   📅 Data: ${new Date(firstAnalysis.createdAt).toLocaleString('pt-BR')}`);
        console.log(`   🔗 Vagas: ${firstAnalysis.jobCount}`);

        // 2. Testar busca de análise específica
        console.log('\n2️⃣ TESTANDO BUSCA DE ANÁLISE ESPECÍFICA');
        const specificAnalysis = await AnalysisResults.findUserAnalysis(firstAnalysis.id, 1);

        if (!specificAnalysis) {
            console.log('❌ Análise específica não encontrada! Problema no método findUserAnalysis.');
            return;
        }

        console.log('✅ Análise específica encontrada');
        console.log(`   📝 Tem conclusão: ${!!specificAnalysis.conclusion}`);
        console.log(`   📊 Tem resumo: ${!!specificAnalysis.resumo}`);
        console.log(`   🔑 Palavras presentes: ${specificAnalysis.job_keywords_present?.length || 0}`);
        console.log(`   ❌ Palavras ausentes: ${specificAnalysis.job_keywords_missing?.length || 0}`);
        console.log(`   📋 É histórico: ${specificAnalysis.isHistoricalView}`);
        console.log(`   📄 Nome do arquivo: ${specificAnalysis.fileName}`);

        // 3. Verificar estrutura completa dos dados
        console.log('\n3️⃣ VERIFICANDO ESTRUTURA DOS DADOS');
        const dataKeys = Object.keys(specificAnalysis);
        console.log(`📊 Total de campos: ${dataKeys.length}`);
        console.log(`🔑 Campos principais:`, dataKeys.slice(0, 10).join(', '));

        // Verificar campos críticos
        const criticalFields = [
            'conclusion',
            'resumo',
            'job_keywords_present',
            'job_keywords_missing',
            'isHistoricalView',
            'fileName'
        ];

        console.log('\n📋 Campos críticos:');
        criticalFields.forEach(field => {
            const exists = specificAnalysis[field] !== undefined;
            const hasValue = exists && (
                typeof specificAnalysis[field] === 'string' ? specificAnalysis[field].trim() !== '' :
                    Array.isArray(specificAnalysis[field]) ? specificAnalysis[field].length > 0 :
                        typeof specificAnalysis[field] === 'object' ? Object.keys(specificAnalysis[field]).length > 0 :
                            !!specificAnalysis[field]
            );

            console.log(`   ${hasValue ? '✅' : '⚠️'} ${field}: ${exists ? (hasValue ? 'OK' : 'VAZIO') : 'AUSENTE'}`);
        });

        // 4. Simular dados que seriam enviados para o frontend
        console.log('\n4️⃣ SIMULANDO DADOS PARA O FRONTEND');
        const frontendData = {
            atsResult: JSON.stringify(specificAnalysis),
            fileName: specificAnalysis.fileName,
            isHistoricalView: 'true'
        };

        console.log(`📦 Tamanho dos dados: ${frontendData.atsResult.length} caracteres`);
        console.log(`📄 Nome do arquivo: ${frontendData.fileName}`);
        console.log(`📋 É histórico: ${frontendData.isHistoricalView}`);

        // 5. Verificar se dados podem ser parseados
        console.log('\n5️⃣ TESTANDO PARSE DOS DADOS');
        try {
            const parsedData = JSON.parse(frontendData.atsResult);
            console.log('✅ Dados podem ser parseados corretamente');
            console.log(`📝 Conclusão existe após parse: ${!!parsedData.conclusion}`);

            if (parsedData.conclusion) {
                console.log(`📄 Conclusão (preview): "${parsedData.conclusion.substring(0, 100)}..."`);
            }
        } catch (parseError) {
            console.log('❌ Erro ao fazer parse dos dados:', parseError.message);
            return;
        }

        // 6. Verificar se há problemas de encoding
        console.log('\n6️⃣ VERIFICANDO ENCODING');
        if (specificAnalysis.conclusion) {
            const hasSpecialChars = /[^\x00-\x7F]/.test(specificAnalysis.conclusion);
            console.log(`🔤 Tem caracteres especiais: ${hasSpecialChars ? 'Sim' : 'Não'}`);

            if (hasSpecialChars) {
                console.log('⚠️ Pode haver problemas de encoding');
            }
        }

        console.log('\n🎯 DIAGNÓSTICO FINAL:');

        // Verificar se todos os componentes estão OK
        const componentsOK = {
            database: analyses.length > 0,
            specificQuery: !!specificAnalysis,
            hasConclusion: !!specificAnalysis.conclusion,
            hasResumo: !!specificAnalysis.resumo,
            hasKeywords: !!(specificAnalysis.job_keywords_present && specificAnalysis.job_keywords_present.length > 0),
            canParse: true // já testamos acima
        };

        const allOK = Object.values(componentsOK).every(Boolean);

        if (allOK) {
            console.log('🎉 TODOS OS COMPONENTES ESTÃO FUNCIONANDO!');
            console.log('✅ O problema deve estar no frontend (JavaScript ou HTML)');
            console.log('\n💡 PRÓXIMOS PASSOS:');
            console.log('1. Verificar se o servidor backend está rodando');
            console.log('2. Verificar se há erros no console do navegador');
            console.log('3. Verificar se os dados chegam ao sessionStorage');
            console.log('4. Verificar se o results.js está processando corretamente');
        } else {
            console.log('❌ PROBLEMAS ENCONTRADOS:');
            Object.entries(componentsOK).forEach(([component, isOK]) => {
                if (!isOK) {
                    console.log(`   ❌ ${component}: FALHOU`);
                }
            });
        }

    } catch (error) {
        console.error('❌ Erro durante debug:', error);
    } finally {
        await sequelize.close();
    }
}

debugCompleteFlow();