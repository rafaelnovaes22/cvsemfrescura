module.exports = {
    // Ambiente mínimo
    testEnvironment: 'node',

    // Apenas testes ultra básicos
    testMatch: [
        '**/tests/simple/*.test.js'
    ],

    // Sem setup, sem mocks, sem complicações
    setupFilesAfterEnv: [],

    // Configuração mínima
    clearMocks: false,
    verbose: true,

    // Sem cobertura
    collectCoverage: false,

    // Timeout baixo
    testTimeout: 3000,

    // Sem cache
    cache: false,

    // Ignora tudo que pode dar problema
    testPathIgnorePatterns: [
        '/node_modules/',
        '/cypress/',
        '/temp-scripts/',
        '/debug/',
        '/frontend/',
        '/unit/',
        '/integration/'
    ],

    modulePathIgnorePatterns: [
        '/node_modules/',
        '/frontend/',
        '/AppData/',
        '/globalStorage/'
    ]
};