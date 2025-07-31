/**
 * Mocks para serviços externos
 */

// Mock do OpenAI Service
const mockOpenAIService = {
    analyzeResume: jest.fn().mockResolvedValue({
        success: true,
        analysis: {
            score: 85,
            feedback: 'Excelente análise do currículo',
            recommendations: ['Adicionar mais projetos', 'Melhorar descrição de experiências'],
            technical_skills: ['JavaScript', 'Node.js', 'React'],
            experience_level: 'Senior',
            missing_sections: []
        }
    }),

    verifyJobCompatibility: jest.fn().mockResolvedValue({
        success: true,
        compatibility: {
            match_percentage: 78,
            matched_skills: ['JavaScript', 'React'],
            missing_skills: ['Python', 'AWS'],
            recommendations: ['Estudar Python', 'Conseguir certificação AWS']
        }
    })
};

// Mock do Claude Service
const mockClaudeService = {
    analyzeResume: jest.fn().mockResolvedValue({
        success: true,
        analysis: {
            score: 82,
            feedback: 'Boa estrutura de currículo',
            suggestions: ['Melhorar formatação', 'Adicionar métricas de resultado']
        }
    })
};

// Mock do Email Service
const mockEmailService = {
    sendEmail: jest.fn().mockResolvedValue({ success: true }),
    sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
    sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
    sendAnalysisCompleteEmail: jest.fn().mockResolvedValue({ success: true })
};

// Mock do Stripe
const mockStripe = {
    customers: {
        create: jest.fn().mockResolvedValue({
            id: 'cus_test123',
            email: 'test@example.com'
        }),
        retrieve: jest.fn().mockResolvedValue({
            id: 'cus_test123',
            email: 'test@example.com'
        })
    },
    paymentIntents: {
        create: jest.fn().mockResolvedValue({
            id: 'pi_test123',
            client_secret: 'pi_test123_secret',
            status: 'requires_payment_method'
        }),
        retrieve: jest.fn().mockResolvedValue({
            id: 'pi_test123',
            status: 'succeeded',
            amount: 1000
        })
    },
    webhooks: {
        constructEvent: jest.fn().mockReturnValue({
            type: 'payment_intent.succeeded',
            data: {
                object: {
                    id: 'pi_test123',
                    status: 'succeeded',
                    amount: 1000,
                    metadata: { userId: '1' }
                }
            }
        })
    }
};

// Mock do Axios para requisições HTTP
const mockAxios = {
    post: jest.fn().mockResolvedValue({
        data: { success: true },
        status: 200
    }),
    get: jest.fn().mockResolvedValue({
        data: { success: true },
        status: 200
    }),
    put: jest.fn().mockResolvedValue({
        data: { success: true },
        status: 200
    }),
    delete: jest.fn().mockResolvedValue({
        data: { success: true },
        status: 200
    })
};

// Mock do Rate Limit Monitor
const mockRateLimitMonitor = {
    checkRateLimit: jest.fn().mockResolvedValue({
        allowed: true,
        remaining: 10,
        resetTime: Date.now() + 3600000
    }),
    updateRateLimit: jest.fn().mockResolvedValue(true),
    getRateLimitStatus: jest.fn().mockResolvedValue({
        requests: 5,
        limit: 100,
        remaining: 95
    })
};

// Mock do BCrypt
const mockBcrypt = {
    hash: jest.fn().mockResolvedValue('$2b$10$mockhashedpassword'),
    compare: jest.fn().mockResolvedValue(true)
};

// Mock do JWT
const mockJWT = {
    sign: jest.fn().mockReturnValue('mock.jwt.token'),
    verify: jest.fn().mockReturnValue({
        id: 1,
        email: 'test@example.com',
        is_admin: false
    })
};

// Mock do Multer (upload de arquivos)
const mockMulter = {
    single: jest.fn().mockReturnValue((req, res, next) => {
        req.file = {
            originalname: 'test.pdf',
            mimetype: 'application/pdf',
            buffer: Buffer.from('mock pdf content'),
            size: 1024
        };
        next();
    })
};

module.exports = {
    mockOpenAIService,
    mockClaudeService,
    mockEmailService,
    mockStripe,
    mockAxios,
    mockRateLimitMonitor,
    mockBcrypt,
    mockJWT,
    mockMulter
};