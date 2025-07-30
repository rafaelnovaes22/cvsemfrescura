const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando servidor e testes e2e...');

// Define variáveis de ambiente
const env = { ...process.env, PORT: '3001' };

// Inicia o servidor
console.log('📦 Iniciando servidor na porta 3001...');
const server = spawn('node', ['server.js'], {
  env,
  cwd: __dirname,
  stdio: 'inherit'
});

// Aguarda o servidor iniciar
console.log('⏳ Aguardando servidor iniciar (30 segundos)...');
setTimeout(() => {
  console.log('🧪 Iniciando testes e2e...');
  
  // Executa os testes
  const tests = spawn('npm', ['run', 'test:e2e'], {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  tests.on('close', (code) => {
    console.log(`✅ Testes finalizados com código: ${code}`);
    console.log('🛑 Encerrando servidor...');
    server.kill();
    process.exit(code);
  });
}, 30000);

// Trata erros
server.on('error', (err) => {
  console.error('❌ Erro ao iniciar servidor:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Interrompido pelo usuário');
  server.kill();
  process.exit(0);
});