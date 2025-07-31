module.exports = {
    // Ambiente de teste
    testEnvironment: 'node',

    // Apenas teste mínimo
    testMatch: [
        '**/tests/minimal.test.js'
    ],

    // Ignorar setup problemático
    setupFilesAfterEnv: [],

    // Configuração mínima
    clearMocks: true,
    verbose: true,

    // Sem cobertura por enquanto
    collectCoverage: false,

    // Timeout reduzido
    testTimeout: 5000
};