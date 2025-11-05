#!/usr/bin/env node

// Script de validação completa das correções aplicadas na Fase 4
console.log('🔍 VALIDAÇÃO COMPLETA DAS CORREÇÕES - FASE 4\n');

const { execSync } = require('child_process');
const fs = require('fs');

// Cores para output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function runTest(testName, testPath, description) {
    console.log(`\n${colors.blue}🧪 Testando: ${testName}${colors.reset}`);
    console.log(`📝 ${description}`);

    try {
        const result = execSync(`npx jest "${testPath}" --passWithNoTests --json`, {
            encoding: 'utf8',
            timeout: 60000
        });

        const parsed = JSON.parse(result);
        const passed = parsed.numPassedTests;
        const failed = parsed.numFailedTests;
        const total = parsed.numTotalTests;
        const successRate = Math.round((passed / total) * 100);

        if (failed === 0) {
            log('green', `✅ SUCESSO TOTAL: ${passed}/${total} (${successRate}%)`);
        } else {
            log('yellow', `⚠️  PARCIAL: ${passed}✅ ${failed}❌ de ${total} (${successRate}%)`);

            // Mostrar testes que falharam
            parsed.testResults.forEach(suite => {
                suite.assertionResults.forEach(test => {
                    if (test.status === 'failed') {
                        log('red', `   ❌ ${test.ancestorTitles.join(' › ')} › ${test.title}`);
                    }
                });
            });
        }

        return { passed, failed, total, successRate };

    } catch (error) {
        log('red', `❌ ERRO: ${error.message}`);
        return { passed: 0, failed: 0, total: 0, successRate: 0, error: true };
    }
}

async function main() {
    console.log(`${colors.cyan}🚀 Iniciando validação completa...${colors.reset}\n`);

    // 1. Verificar arquivos essenciais
    console.log(`${colors.blue}📁 Verificando arquivos essenciais:${colors.reset}`);
    const files = [
        'jest.config.js',
        'tests/setup.js',
        'tests/unit/controllers/atsController.test.js',
        'tests/unit/services/openaiService.test.js',
        'tests/unit/services/emailService.test.js',
        'controllers/atsController.js',
        'services/openaiService.js'
    ];

    files.forEach(file => {
        const exists = fs.existsSync(file);
        log(exists ? 'green' : 'red', `${exists ? '✅' : '❌'} ${file}`);
    });

    // 2. Testes individuais
    console.log(`\n${colors.cyan}🧪 EXECUTANDO TESTES INDIVIDUAIS:${colors.reset}\n`);

    const testResults = [];

    // atsController - Teste crítico
    testResults.push(runTest(
        'atsController',
        'tests/unit/controllers/atsController.test.js',
        'Controlador principal do sistema ATS'
    ));

    // openaiService - Integração externa
    testResults.push(runTest(
        'openaiService',
        'tests/unit/services/openaiService.test.js',
        'Serviço de integração com OpenAI'
    ));

    // emailService - Corrigido
    testResults.push(runTest(
        'emailService',
        'tests/unit/services/emailService.test.js',
        'Serviço de envio de emails'
    ));

    // 3. Resumo final
    console.log(`\n${colors.cyan}📊 RESUMO FINAL:${colors.reset}\n`);

    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;
    let totalErrors = 0;

    testResults.forEach((result, index) => {
        if (result.error) {
            totalErrors++;
        } else {
            totalPassed += result.passed;
            totalFailed += result.failed;
            totalTests += result.total;
        }
    });

    if (totalErrors > 0) {
        log('red', `❌ ERROS DE EXECUÇÃO: ${totalErrors} suites falharam`);
    }

    if (totalTests > 0) {
        const overallSuccess = Math.round((totalPassed / totalTests) * 100);

        console.log(`📈 MÉTRICAS GERAIS:`);
        console.log(`   ✅ Testes Passando: ${totalPassed}`);
        console.log(`   ❌ Testes Falhando: ${totalFailed}`);
        console.log(`   📊 Total: ${totalTests}`);
        console.log(`   🎯 Taxa de Sucesso: ${overallSuccess}%`);

        if (overallSuccess >= 90) {
            log('green', '\n🏆 EXCELENTE! Framework de testes muito sólido!');
        } else if (overallSuccess >= 80) {
            log('yellow', '\n🎯 BOM! Framework funcional, pequenos ajustes restantes.');
        } else if (overallSuccess >= 70) {
            log('yellow', '\n⚠️  ACEITÁVEL! Precisa mais correções mas base sólida.');
        } else {
            log('red', '\n❌ CRÍTICO! Muitos problemas restantes.');
        }
    }

    // 4. Próximos passos
    console.log(`\n${colors.cyan}🎯 PRÓXIMOS PASSOS RECOMENDADOS:${colors.reset}\n`);

    if (totalFailed > 0) {
        console.log('1. 🔧 Corrigir testes restantes individualmente');
        console.log('2. 📊 Executar coverage: npm run test:coverage');
        console.log('3. 🎭 Testar paymentController e outros componentes');
    } else {
        console.log('1. 🎉 Executar suite completa: npm test');
        console.log('2. 📊 Medir coverage: npm run test:coverage');
        console.log('3. 🚀 Implementar testes de integração');
    }

    console.log('\n✨ Validação concluída!\n');
}

// Executar validação
main().catch(error => {
    console.error(`${colors.red}❌ Erro fatal na validação:${colors.reset}`, error.message);
    process.exit(1);
});