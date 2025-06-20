const axios = require('axios');

async function testLogin() {
    try {
        console.log('🧪 TESTE: Login de Usuário\n');

        const baseURL = 'http://localhost:3000';

        // 1. Testar login com usuário de teste
        console.log('1️⃣ Testando login com usuário de teste...');
        console.log('Email: teste@example.com');
        console.log('Senha: 123456');
        
        try {
            const loginResponse = await axios.post(`${baseURL}/api/user/login`, {
                email: 'teste@example.com',
                password: '123456'
            });
            
            console.log('✅ Login bem-sucedido!');
            console.log('👤 Usuário:', loginResponse.data.user.name);
            console.log('📧 Email:', loginResponse.data.user.email);
            console.log('🔑 Token:', loginResponse.data.token.substring(0, 20) + '...');
            console.log('💰 Créditos:', loginResponse.data.user.credits || 0);
            
        } catch (error) {
            console.log('❌ Erro no login:');
            console.log('Status:', error.response?.status);
            console.log('Erro:', error.response?.data?.error || error.message);
        }

        // 2. Testar login com dados inválidos
        console.log('\n2️⃣ Testando login com dados inválidos...');
        try {
            await axios.post(`${baseURL}/api/user/login`, {
                email: '',
                password: ''
            });
        } catch (error) {
            console.log('✅ Erro esperado para campos vazios:');
            console.log('Status:', error.response?.status);
            console.log('Erro:', error.response?.data?.error);
        }

        // 3. Testar login com email inexistente
        console.log('\n3️⃣ Testando login com email inexistente...');
        try {
            await axios.post(`${baseURL}/api/user/login`, {
                email: 'naoexiste@example.com',
                password: '123456'
            });
        } catch (error) {
            console.log('✅ Erro esperado para email inexistente:');
            console.log('Status:', error.response?.status);
            console.log('Erro:', error.response?.data?.error);
        }

        // 4. Testar login com senha incorreta
        console.log('\n4️⃣ Testando login com senha incorreta...');
        try {
            await axios.post(`${baseURL}/api/user/login`, {
                email: 'teste@example.com',
                password: 'senhaerrada'
            });
        } catch (error) {
            console.log('✅ Erro esperado para senha incorreta:');
            console.log('Status:', error.response?.status);
            console.log('Erro:', error.response?.data?.error);
        }

    } catch (error) {
        console.error('❌ Erro geral no teste:', error.message);
    }
}

// Executar teste
testLogin();
