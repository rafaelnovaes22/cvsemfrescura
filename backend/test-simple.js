// Teste simples para verificar Node.js
console.log('✅ Node.js funcionando!');
console.log('Versão Node:', process.version);
console.log('Diretório atual:', process.cwd());

// Teste simples de importação
try {
    const fs = require('fs');
    console.log('✅ Importação de módulos funcionando!');

    // Verificar se Jest está disponível
    const jestPath = require.resolve('jest');
    console.log('✅ Jest encontrado em:', jestPath);
} catch (error) {
    console.error('❌ Erro:', error.message);
}