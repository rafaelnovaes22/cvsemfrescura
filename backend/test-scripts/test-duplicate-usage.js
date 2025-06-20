const axios = require('axios');

async function testDuplicateUsage() {
    try {
        console.log('🧪 TESTE: Uso Duplo de Código de Presente\n');

        const baseURL = 'http://localhost:3000';

        // 0. Primeiro, tentar cadastrar usuário de teste
        console.log('0️⃣ Criando usuário de teste...');
        try {
            await axios.post(`${baseURL}/api/user/register`, {
                name: 'Usuário Teste',
                email: 'teste@exemplo.com',
                password: '123456'
            });
            console.log('✅ Usuário criado com sucesso!');
        } catch (error) {
            if (error.response?.data?.error?.includes('já existe')) {
                console.log('ℹ️ Usuário já existe, continuando...');
            } else {
                console.log(`❌ Erro ao criar usuário: ${error.response?.data?.error || error.message}`);
            }
        }

        // 1. Fazer login
        console.log('\n1️⃣ Fazendo login...');
        const loginResponse = await axios.post(`${baseURL}/api/user/login`, {
            email: 'teste@exemplo.com',
            password: '123456'
        });

        const token = loginResponse.data.token;
        console.log(`✅ Login realizado! Token: ${token.substring(0, 20)}...`);

        // 2. Primeira tentativa de usar o código
        console.log('\n2️⃣ Primeira tentativa de usar TESTE123...');
        try {
            const firstUse = await axios.post(`${baseURL}/api/gift-code/apply`,
                { code: 'TESTE123' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(`✅ Primeira vez: ${firstUse.data.message}`);
            console.log(`💰 Créditos após primeira uso: ${firstUse.data.credits}`);
        } catch (error) {
            console.log(`❌ Erro na primeira tentativa: ${error.response?.data?.error || error.message}`);
        }

        // 3. Segunda tentativa (deve falhar)
        console.log('\n3️⃣ Segunda tentativa com mesmo código...');
        try {
            const secondUse = await axios.post(`${baseURL}/api/gift-code/apply`,
                { code: 'TESTE123' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(`❌ PROBLEMA: Segunda tentativa deveria ter falhado mas foi aceita!`);
            console.log(`💰 Créditos: ${secondUse.data.credits}`);
        } catch (error) {
            console.log(`✅ Segunda tentativa rejeitada corretamente: ${error.response?.data?.error}`);
        }

        // 4. Tentar outro código para confirmar que ainda funciona
        console.log('\n4️⃣ Testando outro código (RHSUPER2025)...');
        try {
            const otherCode = await axios.post(`${baseURL}/api/gift-code/apply`,
                { code: 'RHSUPER2025' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log(`✅ Outro código funcionou: ${otherCode.data.message}`);
            console.log(`💰 Créditos finais: ${otherCode.data.credits}`);
        } catch (error) {
            console.log(`❌ Erro com outro código: ${error.response?.data?.error || error.message}`);
        }

    } catch (error) {
        console.error('❌ Erro no teste:', error.response?.data || error.message);
    }
}

// Executar teste
testDuplicateUsage(); 