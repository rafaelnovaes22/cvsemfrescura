// Setup simplificado para testes sem dependências complexas

// Configurações básicas de ambiente
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-simple';

// Mock mínimo do console para testes
const originalConsole = global.console;
global.console = {
    ...console,
    log: () => { }, // Silenciar logs
    debug: () => { },
    info: () => { },
    warn: originalConsole.warn,
    error: originalConsole.error
};

// Cleanup simples após cada teste
afterEach(() => {
    // Restaurar mocks se jest estiver disponível
    if (typeof jest !== 'undefined' && jest.clearAllMocks) {
        jest.clearAllMocks();
    }
});