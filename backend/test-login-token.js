const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testLogin() {
    try {
        console.log('🔐 Testando login para verificar token JWT...');

        const response = await axios.post('http://localhost:3000/api/user/login', {
            email: 'rafaeldenovaes@gmail.com',
            password: 'admin123' // ajuste a senha se necessário
        });

        if (response.data && response.data.token) {
            console.log('✅ Login realizado com sucesso!');

            // Decodificar o token para ver o payload
            const decoded = jwt.decode(response.data.token);

            console.log('');
            console.log('🎫 PAYLOAD DO TOKEN JWT:');
            console.log('─'.repeat(40));
            console.log('📧 Email:', decoded.email);
            console.log('👤 Nome:', decoded.name);
            console.log('🆔 ID:', decoded.id);
            console.log('👑 É Admin:', decoded.isAdmin ? 'SIM ✅' : 'NÃO ❌');
            console.log('⏰ Expira em:', new Date(decoded.exp * 1000).toLocaleString('pt-BR'));

            console.log('');
            if (decoded.isAdmin) {
                console.log('🎉 SUCESSO! Token inclui isAdmin = true');
                console.log('✅ Agora o painel admin deve funcionar!');
            } else {
                console.log('❌ PROBLEMA: Token não inclui isAdmin ou é false');
                console.log('🔧 Verifique se o usuário foi promovido corretamente');
            }

        } else {
            console.log('❌ Erro no login:', response.data);
        }

    } catch (error) {
        if (error.response) {
            console.log('❌ Erro HTTP:', error.response.status, error.response.data);
        } else {
            console.log('❌ Erro:', error.message);
        }
    }
}

testLogin(); 