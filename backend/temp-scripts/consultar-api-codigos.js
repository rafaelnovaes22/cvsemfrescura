const http = require('http');

console.log('🔍 CONSULTANDO CÓDIGOS VIA API...');
console.log('═══════════════════════════════════');

// Função para fazer requisição HTTP
function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.end();
    });
}

async function consultarCodigos() {
    try {
        // Primeiro, verificar se o servidor está respondendo
        console.log('📡 Testando conexão com servidor...');
        const healthCheck = await makeRequest('/health');

        if (healthCheck.status === 200) {
            console.log('✅ Servidor está online');
            console.log(`📊 Status: ${healthCheck.data.status}`);
            console.log(`🕐 Timestamp: ${healthCheck.data.timestamp}`);
        } else {
            console.log('❌ Servidor não está respondendo corretamente');
            return;
        }

        console.log('');
        console.log('🔐 Tentando acessar API administrativa...');

        // Tentar acessar dashboard sem autenticação para ver a resposta
        const dashboardResponse = await makeRequest('/api/admin/dashboard');
        console.log(`📊 Dashboard Status: ${dashboardResponse.status}`);

        if (dashboardResponse.status === 401) {
            console.log('🔒 API requer autenticação (esperado)');
            console.log(`💬 Mensagem: ${dashboardResponse.data.error}`);
        }

        // Tentar acessar códigos sem autenticação
        const codesResponse = await makeRequest('/api/admin/codes');
        console.log(`📋 Códigos Status: ${codesResponse.status}`);

        if (codesResponse.status === 401) {
            console.log('🔒 API de códigos requer autenticação (esperado)');
        }

        console.log('');
        console.log('📝 RESUMO DA SITUAÇÃO:');
        console.log('═══════════════════════════════');
        console.log('✅ Servidor backend está funcionando');
        console.log('✅ APIs administrativas estão protegidas');
        console.log('🔒 Acesso requer autenticação de administrador');
        console.log('');
        console.log('💡 PARA VERIFICAR CÓDIGOS EM PRODUÇÃO:');
        console.log('1. Acesse: http://localhost:3000/admin.html');
        console.log('2. Faça login como administrador');
        console.log('3. Visualize o dashboard e lista de códigos');
        console.log('');
        console.log('🔧 ALTERNATIVAS:');
        console.log('• Criar usuário admin: node create-admin-user.js admin@test.com --create');
        console.log('• Verificar banco direto: (requer sqlite3 instalado)');
        console.log('• Usar painel web administrativo');

        // Tentar verificar se há códigos através de uma rota pública (se existir)
        console.log('');
        console.log('🔍 Verificando rotas públicas...');

        const publicRoutes = ['/api/health', '/api/config'];

        for (const route of publicRoutes) {
            try {
                const response = await makeRequest(route);
                console.log(`📍 ${route}: Status ${response.status}`);

                if (response.status === 200 && typeof response.data === 'object') {
                    console.log(`   📄 Dados disponíveis: ${Object.keys(response.data).join(', ')}`);
                }
            } catch (err) {
                console.log(`📍 ${route}: Erro - ${err.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Erro na consulta:', error.message);
        console.log('');
        console.log('💡 Possíveis causas:');
        console.log('• Servidor não está rodando na porta 3000');
        console.log('• Firewall bloqueando conexões locais');
        console.log('• Processo do servidor foi interrompido');
        console.log('');
        console.log('🔧 Soluções:');
        console.log('• Execute: cd backend && npm start');
        console.log('• Verifique: http://localhost:3000/health');
    }
}

consultarCodigos(); 