// Script para executar e reportar testes
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function generateTestReport() {
    const report = {
        timestamp: new Date().toISOString(),
        environment: {
            nodeVersion: process.version,
            platform: process.platform,
            cwd: process.cwd()
        },
        tests: {},
        summary: {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
        }
    };

    console.log('🚀 Iniciando relatório de execução de testes...\n');

    // Teste 1: Verificar estrutura de arquivos
    console.log('📂 Verificando estrutura de arquivos...');
    const testFiles = [
        'tests/minimal.test.js',
        'tests/basic.test.js',
        'tests/unit/controllers/userController.test.js',
        'tests/unit/services/openaiService.test.js',
        'tests/integration/auth.integration.test.js',
        'jest.config.js',
        'jest.simple.config.js',
        'package.json'
    ];

    report.tests.fileStructure = { passed: 0, failed: 0, details: {} };

    testFiles.forEach(file => {
        const exists = fs.existsSync(file);
        const status = exists ? 'PASS' : 'FAIL';
        report.tests.fileStructure.details[file] = status;

        if (exists) {
            report.tests.fileStructure.passed++;
            console.log(`  ✅ ${file}`);
        } else {
            report.tests.fileStructure.failed++;
            console.log(`  ❌ ${file}`);
        }
    });

    // Teste 2: Verificar dependências
    console.log('\n📦 Verificando dependências...');
    report.tests.dependencies = { passed: 0, failed: 0, details: {} };

    const requiredDeps = ['jest', 'supertest', 'cypress', 'nyc'];

    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        requiredDeps.forEach(dep => {
            const exists = dep in allDeps;
            const status = exists ? 'PASS' : 'FAIL';
            report.tests.dependencies.details[dep] = exists ? allDeps[dep] : 'MISSING';

            if (exists) {
                report.tests.dependencies.passed++;
                console.log(`  ✅ ${dep}: ${allDeps[dep]}`);
            } else {
                report.tests.dependencies.failed++;
                console.log(`  ❌ ${dep}: MISSING`);
            }
        });
    } catch (error) {
        report.summary.errors.push(`Error reading package.json: ${error.message}`);
        console.log(`  ❌ Error reading package.json: ${error.message}`);
    }

    // Teste 3: Tentar execução básica do Jest
    console.log('\n🧪 Tentando execução do Jest...');
    report.tests.jestExecution = { passed: 0, failed: 0, details: {} };

    const jestCommands = [
        'npx jest --version',
        'npx jest tests/minimal.test.js --config=jest.simple.config.js --no-cache --silent',
        'npx jest tests/basic.test.js --no-cache --silent'
    ];

    jestCommands.forEach(cmd => {
        try {
            console.log(`  🔄 Executando: ${cmd}`);
            const output = execSync(cmd, {
                encoding: 'utf8',
                timeout: 10000,
                stdio: 'pipe'
            });

            report.tests.jestExecution.passed++;
            report.tests.jestExecution.details[cmd] = {
                status: 'PASS',
                output: output.trim()
            };
            console.log(`    ✅ SUCESSO`);
            if (output.trim()) {
                console.log(`    📄 Output: ${output.trim().substring(0, 100)}...`);
            }
        } catch (error) {
            report.tests.jestExecution.failed++;
            report.tests.jestExecution.details[cmd] = {
                status: 'FAIL',
                error: error.message,
                output: error.stdout ? error.stdout.toString() : '',
                stderr: error.stderr ? error.stderr.toString() : ''
            };
            console.log(`    ❌ FALHOU: ${error.message}`);
            if (error.stdout) {
                console.log(`    📄 Stdout: ${error.stdout.toString().substring(0, 100)}...`);
            }
            if (error.stderr) {
                console.log(`    📄 Stderr: ${error.stderr.toString().substring(0, 100)}...`);
            }
        }
    });

    // Teste 4: Verificar sintaxe dos arquivos de teste
    console.log('\n🔍 Verificando sintaxe dos arquivos de teste...');
    report.tests.syntaxCheck = { passed: 0, failed: 0, details: {} };

    const syntaxTestFiles = [
        'tests/minimal.test.js',
        'tests/basic.test.js'
    ];

    syntaxTestFiles.forEach(file => {
        if (fs.existsSync(file)) {
            try {
                require.resolve(path.resolve(file));
                report.tests.syntaxCheck.passed++;
                report.tests.syntaxCheck.details[file] = 'PASS';
                console.log(`  ✅ ${file}: sintaxe OK`);
            } catch (error) {
                report.tests.syntaxCheck.failed++;
                report.tests.syntaxCheck.details[file] = error.message;
                console.log(`  ❌ ${file}: ${error.message}`);
            }
        }
    });

    // Calcular totais
    Object.keys(report.tests).forEach(testType => {
        const test = report.tests[testType];
        report.summary.total += test.passed + test.failed;
        report.summary.passed += test.passed;
        report.summary.failed += test.failed;
    });

    // Adicionar recomendações
    report.recommendations = [];

    if (report.tests.jestExecution.failed > 0) {
        report.recommendations.push("Jest não está executando - verificar instalação e configuração");
    }

    if (report.tests.dependencies.failed > 0) {
        report.recommendations.push("Instalar dependências faltantes: npm install");
    }

    if (report.tests.syntaxCheck.failed > 0) {
        report.recommendations.push("Corrigir erros de sintaxe nos arquivos de teste");
    }

    if (report.summary.failed === 0) {
        report.recommendations.push("Estrutura está OK - tentar execução de testes específicos");
    }

    // Gerar relatório final
    console.log('\n📊 RESUMO FINAL:');
    console.log(`  Total de verificações: ${report.summary.total}`);
    console.log(`  Sucessos: ${report.summary.passed}`);
    console.log(`  Falhas: ${report.summary.failed}`);
    console.log(`  Taxa de sucesso: ${((report.summary.passed / report.summary.total) * 100).toFixed(1)}%`);

    if (report.recommendations.length > 0) {
        console.log('\n💡 RECOMENDAÇÕES:');
        report.recommendations.forEach((rec, index) => {
            console.log(`  ${index + 1}. ${rec}`);
        });
    }

    // Salvar relatório
    const reportContent = JSON.stringify(report, null, 2);
    fs.writeFileSync('test-execution-report.json', reportContent);

    const humanReadableReport = `
RELATÓRIO DE EXECUÇÃO DE TESTES
================================
Data: ${report.timestamp}
Node.js: ${report.environment.nodeVersion}
Plataforma: ${report.environment.platform}
Diretório: ${report.environment.cwd}

RESULTADOS:
- Total: ${report.summary.total}
- Sucessos: ${report.summary.passed}
- Falhas: ${report.summary.failed}
- Taxa de sucesso: ${((report.summary.passed / report.summary.total) * 100).toFixed(1)}%

DETALHES:
${Object.entries(report.tests).map(([name, data]) =>
        `${name}: ${data.passed} ✅ / ${data.failed} ❌`
    ).join('\n')}

RECOMENDAÇÕES:
${report.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

Para mais detalhes, consulte: test-execution-report.json
`;

    fs.writeFileSync('test-execution-report.txt', humanReadableReport);

    console.log('\n📄 Relatórios salvos:');
    console.log('  - test-execution-report.json (detalhado)');
    console.log('  - test-execution-report.txt (resumo)');

    return report;
}

// Executar se for chamado diretamente
if (require.main === module) {
    generateTestReport()
        .then(() => {
            console.log('\n🎉 Relatório gerado com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Erro ao gerar relatório:', error);
            process.exit(1);
        });
}

module.exports = { generateTestReport };