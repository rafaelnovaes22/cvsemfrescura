// Debug script para identificar testes falhando
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Iniciando análise de testes falhando...\n');

// Lista de arquivos de teste para verificar individualmente
const testFiles = [
    'tests/unit/controllers/userController.test.js',
    'tests/unit/controllers/giftCodeController.test.js', 
    'tests/unit/controllers/paymentController.test.js',
    'tests/unit/controllers/atsController.test.js',
    'tests/unit/services/openaiService.test.js',
    'tests/unit/services/emailService.test.js',
    'tests/unit/services/claudeService.test.js',
    'tests/unit/services/rateLimitMonitor.test.js',
    'tests/integration/auth.integration.test.js',
    'tests/integration/payment.integration.test.js'
];

const results = [];

for (const testFile of testFiles) {
    console.log(`\n🧪 Testando: ${testFile}`);
    
    try {
        // Verificar se arquivo existe
        if (!fs.existsSync(testFile)) {
            console.log(`❌ Arquivo não encontrado: ${testFile}`);
            results.push({ file: testFile, status: 'NOT_FOUND', error: 'Arquivo não existe' });
            continue;
        }

        // Executar teste
        const command = `npx jest "${testFile}" --verbose --no-coverage --silent`;
        const output = execSync(command, { 
            encoding: 'utf8', 
            timeout: 30000,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        console.log(`✅ PASSOU: ${testFile}`);
        results.push({ file: testFile, status: 'PASSED', output: output });
        
    } catch (error) {
        console.log(`❌ FALHOU: ${testFile}`);
        console.log(`Erro: ${error.message.substring(0, 200)}...`);
        
        results.push({ 
            file: testFile, 
            status: 'FAILED', 
            error: error.message,
            stderr: error.stderr?.toString() || 'N/A'
        });
    }
}

// Gerar relatório
console.log('\n📊 RELATÓRIO FINAL:');
console.log('==================');

const passed = results.filter(r => r.status === 'PASSED');
const failed = results.filter(r => r.status === 'FAILED');
const notFound = results.filter(r => r.status === 'NOT_FOUND');

console.log(`✅ Passaram: ${passed.length}`);
console.log(`❌ Falharam: ${failed.length}`);
console.log(`🚫 Não encontrados: ${notFound.length}`);

if (failed.length > 0) {
    console.log('\n🔍 DETALHES DAS FALHAS:');
    failed.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.file}`);
        console.log(`   Erro: ${result.error.substring(0, 300)}...`);
    });
}

// Salvar relatório detalhado
const report = {
    timestamp: new Date().toISOString(),
    summary: {
        total: results.length,
        passed: passed.length,
        failed: failed.length,
        notFound: notFound.length
    },
    details: results
};

fs.writeFileSync('test-debug-report.json', JSON.stringify(report, null, 2));
console.log('\n📄 Relatório detalhado salvo em: test-debug-report.json');

console.log('\n🎯 Próximos passos:');
if (failed.length > 0) {
    console.log('1. Corrigir testes falhando');
    console.log('2. Ajustar mocks problemáticos'); 
    console.log('3. Verificar imports e exports');
}
console.log('4. Executar suíte completa novamente');