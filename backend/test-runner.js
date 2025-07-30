const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando ambiente de testes E2E...\n');

// Configurações
const PORT = 3001;
const SERVER_STARTUP_TIME = 20000; // 20 segundos
const env = { ...process.env, PORT: PORT.toString() };

// Função para aguardar
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função para verificar se o servidor está rodando
const checkServer = () => {
  return new Promise((resolve) => {
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/api/health',
      method: 'GET',
      timeout: 1000
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
};

// Função principal
async function runTests() {
  // 1. Iniciar servidor
  console.log(`📦 Iniciando servidor na porta ${PORT}...`);
  const server = spawn('node', ['server.js'], {
    env,
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // Capturar logs do servidor
  server.stdout.on('data', (data) => {
    console.log(`[SERVER] ${data.toString().trim()}`);
  });

  server.stderr.on('data', (data) => {
    console.error(`[SERVER ERROR] ${data.toString().trim()}`);
  });

  server.on('error', (err) => {
    console.error('❌ Erro ao iniciar servidor:', err);
    process.exit(1);
  });

  // 2. Aguardar servidor iniciar
  console.log('⏳ Aguardando servidor iniciar...');
  let serverReady = false;
  const maxAttempts = 30;
  
  for (let i = 0; i < maxAttempts; i++) {
    process.stdout.write('.');
    if (await checkServer()) {
      serverReady = true;
      console.log('\n✅ Servidor respondendo!');
      break;
    }
    await wait(1000);
  }

  if (!serverReady) {
    console.error('\n❌ Servidor não iniciou no tempo esperado');
    server.kill();
    process.exit(1);
  }

  // 3. Executar testes
  console.log('\n🧪 Executando testes E2E...\n');
  
  const testFile = process.argv[2] || 'cypress/e2e/auth-updated.cy.js';
  const cypress = spawn('npx', ['cypress', 'run', '--spec', testFile], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  // 4. Aguardar conclusão dos testes
  cypress.on('close', (code) => {
    console.log(`\n✅ Testes finalizados com código: ${code}`);
    console.log('🛑 Encerrando servidor...');
    
    // Encerrar servidor
    server.kill('SIGTERM');
    
    // Aguardar um pouco e forçar encerramento se necessário
    setTimeout(() => {
      server.kill('SIGKILL');
      process.exit(code);
    }, 2000);
  });

  // Tratar interrupção do usuário
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Interrompido pelo usuário');
    server.kill('SIGKILL');
    cypress.kill('SIGKILL');
    process.exit(0);
  });
}

// Executar
runTests().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});