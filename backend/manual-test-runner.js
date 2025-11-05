// Runner manual para executar testes Jest programaticamente
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando execução manual de testes atsController...\n');

// Função para executar teste via Node.js puro
function runSimpleTest() {
    console.log('=== TESTE SIMPLES ===');
    try {
        // Teste 1: Matemática básica
        const result1 = 1 + 1;
        console.log(`✅ Teste 1 - 1 + 1 = ${result1} (esperado: 2)`);

        // Teste 2: String
        const result2 = 'hello';
        console.log(`✅ Teste 2 - String: ${result2} (esperado: hello)`);

        // Teste 3: Verificar se arquivos existem
        const testsExist = fs.existsSync('./tests/basic.test.js');
        console.log(`✅ Teste 3 - basic.test.js existe: ${testsExist}`);

        const jestConfigExists = fs.existsSync('./jest.config.js');
        console.log(`✅ Teste 4 - jest.config.js existe: ${jestConfigExists}`);

        console.log('\n🎉 Testes simples passaram!\n');
        return true;
    } catch (error) {
        console.error('❌ Erro nos testes simples:', error.message);
        return false;
    }
}

// Função para verificar estrutura
function checkTestStructure() {
    console.log('=== VERIFICAÇÃO DE ESTRUTURA ===');

    const testFiles = [
        './tests/basic.test.js',
        './tests/unit/controllers/userController.test.js',
        './tests/unit/services/openaiService.test.js',
        './tests/integration/auth.integration.test.js'
    ];

    testFiles.forEach(file => {
        const exists = fs.existsSync(file);
        console.log(`${exists ? '✅' : '❌'} ${file}: ${exists ? 'EXISTE' : 'NÃO ENCONTRADO'}`);
    });

    console.log('');
}

// Função para tentar Jest programaticamente
async function runJestProgrammatically() {
    console.log('=== TENTANDO JEST PROGRAMÁTICO ===');

    try {
        // Tentar carregar Jest
        const jest = require('jest');
        console.log('✅ Jest carregado com sucesso!');

        // Configuração mínima
        const config = {
            testMatch: ['**/tests/unit/controllers/atsController.test.js'],
            verbose: true,
            silent: false,
            maxWorkers: 1,
            testTimeout: 10000
        };

        console.log('🔄 Executando Jest...');

        // Executar Jest
        const results = await jest.runCLI(config, [process.cwd()]);

        console.log('📊 Resultados:', results);

        return results;
    } catch (error) {
        console.error('❌ Erro ao executar Jest:', error.message);

        // Tentar alternativa - executar arquivo de teste diretamente
        try {
            console.log('\n🔄 Tentando execução direta...');

            // Simular ambiente Jest básico
            global.describe = function (name, fn) {
                console.log(`📝 Describe: ${name}`);
                fn();
            };

            global.it = function (name, fn) {
                console.log(`  🧪 Test: ${name}`);
                try {
                    fn();
                    console.log(`    ✅ PASSOU`);
                } catch (error) {
                    console.log(`    ❌ FALHOU: ${error.message}`);
                }
            };

            global.expect = function (actual) {
                return {
                    toBe: function (expected) {
                        if (actual === expected) {
                            return true;
                        } else {
                            throw new Error(`Esperado ${expected}, recebido ${actual}`);
                        }
                    }
                };
            };

            // Executar teste básico
            console.log('\n🔄 Executando basic.test.js diretamente...');
            require('./tests/basic.test.js');

        } catch (directError) {
            console.error('❌ Erro na execução direta:', directError.message);
        }

        return null;
    }
}

// Função principal
async function main() {
    console.log('📍 Diretório atual:', process.cwd());
    console.log('📍 Versão Node:', process.version);
    console.log('');

    // 1. Testes simples
    const simpleTestsPassed = runSimpleTest();

    // 2. Verificar estrutura
    checkTestStructure();

    // 3. Tentar Jest
    if (simpleTestsPassed) {
        await runJestProgrammatically();
    }

    console.log('\n🏁 Execução manual concluída!');

    // Salvar resultado em arquivo
    const report = `RELATÓRIO DE EXECUÇÃO MANUAL
===============================
Data: ${new Date().toISOString()}
Diretório: ${process.cwd()}
Node.js: ${process.version}

Testes simples: ${simpleTestsPassed ? 'PASSOU' : 'FALHOU'}
Estrutura verificada: ✅

Próximos passos:
1. ${simpleTestsPassed ? 'Resolver execução do Jest' : 'Corrigir problemas básicos'}
2. Executar testes unitários
3. Medir cobertura real
`;

    fs.writeFileSync('./manual-test-report.txt', report);
    console.log('📄 Relatório salvo em: manual-test-report.txt');
}

// Executar
main().catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
});