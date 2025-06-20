const http = require('http');

const postData = JSON.stringify({
    code: 'TESTE123'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/gift-code/validate',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('🔍 Testando API de validação...');
console.log('📡 Enviando para:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('📦 Dados:', postData);

const req = http.request(options, (res) => {
    console.log('📊 Status:', res.statusCode);
    console.log('📋 Headers:', res.headers);

    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log('📄 Resposta:', body);

        try {
            const response = JSON.parse(body);
            console.log('🎯 Resultado:', response);
        } catch (error) {
            console.log('❌ Erro ao parsear JSON:', error.message);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Erro na requisição:', error);
});

req.write(postData);
req.end(); 