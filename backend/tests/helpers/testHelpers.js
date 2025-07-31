const jwt = require('jsonwebtoken');

/**
 * Helpers para testes unitários
 */

// Mock de usuário para testes
const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: '$2b$10$mockhashedpassword',
    email_verified: true,
    credits: 10,
    is_admin: false,
    last_login: new Date(),
    onboarding_completed: true,
    onboarding_step: 'completed'
};

// Mock de admin para testes
const mockAdmin = {
    ...mockUser,
    id: 2,
    email: 'admin@example.com',
    is_admin: true
};

// Gerar token JWT para testes
const generateTestToken = (user = mockUser) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            is_admin: user.is_admin
        },
        process.env.JWT_SECRET || 'test-jwt-secret',
        { expiresIn: '1h' }
    );
};

// Mock de request do Express
const mockRequest = (body = {}, headers = {}, params = {}, query = {}, user = null) => ({
    body,
    headers,
    params,
    query,
    user,
    file: null,
    files: null
});

// Mock de response do Express
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
};

// Mock de next function
const mockNext = jest.fn();

// Mock de modelo Sequelize
const mockSequelizeModel = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    findAndCountAll: jest.fn()
};

// Mock de instância de modelo Sequelize
const mockModelInstance = {
    update: jest.fn(),
    destroy: jest.fn(),
    save: jest.fn(),
    reload: jest.fn(),
    toJSON: jest.fn()
};

// Mock de transação Sequelize
const mockTransaction = {
    commit: jest.fn(),
    rollback: jest.fn()
};

// Helper para testar status codes e responses
const expectSuccessResponse = (res, expectedStatus = 200) => {
    expect(res.status).toHaveBeenCalledWith(expectedStatus);
    expect(res.json).toHaveBeenCalled();
};

const expectErrorResponse = (res, expectedStatus, expectedMessage = null) => {
    expect(res.status).toHaveBeenCalledWith(expectedStatus);
    expect(res.json).toHaveBeenCalled();

    if (expectedMessage) {
        const jsonCall = res.json.mock.calls[0][0];
        expect(jsonCall.error).toBeDefined();
        if (typeof expectedMessage === 'string') {
            expect(jsonCall.error).toContain(expectedMessage);
        }
    }
};

// Mock de OpenAI response
const mockOpenAIResponse = {
    data: {
        choices: [{
            message: {
                content: JSON.stringify({
                    score: 85,
                    feedback: 'Excelente currículo!',
                    recommendations: ['Adicionar mais detalhes técnicos']
                })
            }
        }]
    }
};

// Mock de Stripe
const mockStripeCustomer = {
    id: 'cus_test123',
    email: 'test@example.com'
};

const mockStripePaymentIntent = {
    id: 'pi_test123',
    status: 'succeeded',
    amount: 1000,
    currency: 'brl'
};

module.exports = {
    mockUser,
    mockAdmin,
    generateTestToken,
    mockRequest,
    mockResponse,
    mockNext,
    mockSequelizeModel,
    mockModelInstance,
    mockTransaction,
    expectSuccessResponse,
    expectErrorResponse,
    mockOpenAIResponse,
    mockStripeCustomer,
    mockStripePaymentIntent
};