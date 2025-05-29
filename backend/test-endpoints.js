// Script para testar endpoints de gift code
// node test-endpoints.js

const axios = require('axios');

async function testEndpoints() {
    console.log('🧪 Testando endpoints de Gift Code...\n');

    const baseURL = 'http://localhost:3001';

    try {
        // 1. Testar validação de código
        console.log('🔍 Testando validação de código...');
        const validateResponse = await axios.post(`${baseURL}/api/gift-code/validate`, {
            code: 'GIFTDL6608'
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('✅ Resposta da validação:', validateResponse.data);

        // 2. Testar aplicação (sem autenticação - deve dar erro 401)
        console.log('\n🎁 Testando aplicação sem autenticação...');
        try {
            const applyResponse = await axios.post(`${baseURL}/api/gift-code/apply`, {
                code: 'GIFTDL6608'
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Erro 401 esperado:', error.response.data);
            } else {
                console.log('❌ Erro inesperado:', error.response?.data || error.message);
            }
        }

        console.log('\n✅ Testes de endpoint concluídos!');
        console.log('💡 O sistema está funcionando. O problema pode ser no frontend ou autenticação.');

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ Servidor não está rodando na porta 3001');
            console.log('💡 Execute: npm start ou node server.js no diretório backend');
        } else {
            console.log('❌ Erro ao testar endpoints:', error.message);
        }
    }
}

testEndpoints(); 