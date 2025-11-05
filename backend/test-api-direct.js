const express = require('express');
const cors = require('cors');
const atsRoutes = require('./routes/ats');
const userRoutes = require('./routes/user');
const jwt = require('jsonwebtoken');

// Criar um servidor de teste simples
const app = express();

app.use(cors());
app.use(express.json());

// Middleware para simular autenticação
app.use((req, res, next) => {
    // Simular usuário autenticado (ID 1)
    req.user = { id: 1 };
    next();
});

app.use('/api/ats', atsRoutes);
app.use('/api/user', userRoutes);

const PORT = 3001;

app.listen(PORT, () => {
    console.log(`🚀 Servidor de teste rodando na porta ${PORT}`);
    console.log(`📋 Teste os endpoints:`);
    console.log(`   GET http://localhost:${PORT}/api/ats/history`);
    console.log(`   GET http://localhost:${PORT}/api/ats/analysis/328c0ad4-d927-4dac-95c8-abc8492c4358`);

    // Testar automaticamente
    setTimeout(async () => {
        try {
            console.log('\n🧪 Testando endpoints automaticamente...');

            // Teste 1: Histórico
            console.log('\n1️⃣ Testando /api/ats/history');
            const historyResponse = await fetch(`http://localhost:${PORT}/api/ats/history`);
            const historyData = await historyResponse.json();

            console.log(`✅ Status: ${historyResponse.status}`);
            console.log(`📊 Análises encontradas: ${historyData.length}`);

            if (historyData.length > 0) {
                const firstAnalysisId = historyData[0].id;
                console.log(`🆔 Primeira análise ID: ${firstAnalysisId}`);

                // Teste 2: Análise específica
                console.log(`\n2️⃣ Testando /api/ats/analysis/${firstAnalysisId}`);
                const analysisResponse = await fetch(`http://localhost:${PORT}/api/ats/analysis/${firstAnalysisId}`);
                const analysisData = await analysisResponse.json();

                console.log(`✅ Status: ${analysisResponse.status}`);
                console.log(`📝 Tem conclusão: ${!!analysisData.conclusion}`);
                console.log(`📊 Tem resumo: ${!!analysisData.resumo}`);
                console.log(`🔑 Palavras presentes: ${analysisData.job_keywords_present?.length || 0}`);
                console.log(`❌ Palavras ausentes: ${analysisData.job_keywords_missing?.length || 0}`);
                console.log(`📋 É histórico: ${analysisData.isHistoricalView}`);

                if (analysisData.conclusion) {
                    console.log(`📄 Conclusão (preview): "${analysisData.conclusion.substring(0, 100)}..."`);
                }

                console.log('\n🎉 Testes concluídos! APIs funcionando corretamente.');
            } else {
                console.log('⚠️ Nenhuma análise encontrada');
            }

        } catch (error) {
            console.error('❌ Erro durante teste:', error);
        }
    }, 1000);
});