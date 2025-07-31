const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userController = require('../../../controllers/userController');
const User = require('../../../models/user');
const {
    mockRequest,
    mockResponse,
    mockUser,
    expectSuccessResponse,
    expectErrorResponse
} = require('../../helpers/testHelpers');

// Mock das dependências
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../../models/user');

describe('UserController', () => {
    let req, res;

    beforeEach(() => {
        req = mockRequest();
        res = mockResponse();
        jest.clearAllMocks();
    });

    describe('register', () => {
        const validUserData = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        };

        it('deve registrar um novo usuário com sucesso', async () => {
            // Arrange
            req.body = validUserData;
            User.findOne.mockResolvedValue(null); // Email não existe
            bcrypt.hash.mockResolvedValue('hashedPassword');
            User.create.mockResolvedValue({
                id: 1,
                name: validUserData.name,
                email: validUserData.email
            });

            // Act
            await userController.register(req, res);

            // Assert
            expect(User.findOne).toHaveBeenCalledWith({ where: { email: validUserData.email } });
            expect(bcrypt.hash).toHaveBeenCalledWith(validUserData.password, 10);
            expect(User.create).toHaveBeenCalledWith({
                name: validUserData.name,
                email: validUserData.email,
                password: 'hashedPassword'
            });
            expectSuccessResponse(res, 201);
        });

        it('deve retornar erro quando campos obrigatórios estão faltando', async () => {
            // Arrange
            req.body = { name: 'Test User' }; // Faltando email e password

            // Act
            await userController.register(req, res);

            // Assert
            expectErrorResponse(res, 400, 'Nome, email e senha são obrigatórios');
            expect(User.findOne).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando email já está cadastrado', async () => {
            // Arrange
            req.body = validUserData;
            User.findOne.mockResolvedValue(mockUser); // Email já existe

            // Act
            await userController.register(req, res);

            // Assert
            expect(User.findOne).toHaveBeenCalledWith({ where: { email: validUserData.email } });
            expectErrorResponse(res, 400, 'Email já cadastrado');
            expect(User.create).not.toHaveBeenCalled();
        });

        it('deve tratar erros do banco de dados', async () => {
            // Arrange
            req.body = validUserData;
            User.findOne.mockRejectedValue(new Error('Database error'));

            // Act
            await userController.register(req, res);

            // Assert
            expectErrorResponse(res, 500);
        });
    });

    describe('login', () => {
        const validLoginData = {
            email: 'test@example.com',
            password: 'password123'
        };

        it('deve fazer login com sucesso', async () => {
            // Arrange
            req.body = validLoginData;
            const mockUserWithUpdate = {
                ...mockUser,
                update: jest.fn().mockResolvedValue()
            };
            User.findOne.mockResolvedValue(mockUserWithUpdate);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mock.jwt.token');

            // Act
            await userController.login(req, res);

            // Assert
            expect(User.findOne).toHaveBeenCalledWith({ where: { email: validLoginData.email } });
            expect(bcrypt.compare).toHaveBeenCalledWith(validLoginData.password, mockUser.password);
            expect(mockUserWithUpdate.update).toHaveBeenCalledWith({ last_login: expect.any(Date) });
            expect(jwt.sign).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                token: 'mock.jwt.token',
                user: expect.any(Object)
            }));
        });

        it('deve retornar erro quando campos obrigatórios estão faltando', async () => {
            // Arrange
            req.body = { email: 'test@example.com' }; // Faltando password

            // Act
            await userController.login(req, res);

            // Assert
            expectErrorResponse(res, 400, 'Email e senha são obrigatórios');
            expect(User.findOne).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando usuário não está cadastrado', async () => {
            // Arrange
            req.body = validLoginData;
            User.findOne.mockResolvedValue(null);

            // Act
            await userController.login(req, res);

            // Assert
            expect(User.findOne).toHaveBeenCalledWith({ where: { email: validLoginData.email } });
            expectErrorResponse(res, 400, 'não está cadastrado');
            const jsonCall = res.json.mock.calls[0][0];
            expect(jsonCall.needsRegistration).toBe(true);
        });

        it('deve retornar erro quando senha está incorreta', async () => {
            // Arrange
            req.body = validLoginData;
            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(false);

            // Act
            await userController.login(req, res);

            // Assert
            expect(bcrypt.compare).toHaveBeenCalledWith(validLoginData.password, mockUser.password);
            expectErrorResponse(res, 401, 'Senha incorreta');
        });

        it('deve tratar erros do banco de dados durante login', async () => {
            // Arrange
            req.body = validLoginData;
            User.findOne.mockRejectedValue(new Error('Database error'));

            // Act
            await userController.login(req, res);

            // Assert
            expectErrorResponse(res, 500);
        });
    });

    describe('profile', () => {
        it('deve retornar perfil do usuário com sucesso', async () => {
            // Arrange
            req.user = { id: 1 };
            User.findByPk.mockResolvedValue(mockUser);

            // Act
            await userController.profile(req, res);

            // Assert
            expect(User.findByPk).toHaveBeenCalledWith(1, { attributes: ['id', 'name', 'email'] });
            expect(res.json).toHaveBeenCalledWith(mockUser);
        });

        it('deve retornar erro quando usuário não é encontrado', async () => {
            // Arrange
            req.user = { id: 999 };
            User.findByPk.mockResolvedValue(null);

            // Act
            await userController.profile(req, res);

            // Assert
            expectErrorResponse(res, 404, 'Usuário não encontrado');
        });

        it('deve tratar erros do banco de dados ao buscar perfil', async () => {
            // Arrange
            req.user = { id: 1 };
            User.findByPk.mockRejectedValue(new Error('Database error'));

            // Act
            await userController.profile(req, res);

            // Assert
            expectErrorResponse(res, 500);
        });
    });

    describe('getCredits', () => {
        it('deve retornar créditos do usuário com sucesso', async () => {
            // Arrange
            req.user = { id: 1 };
            User.findByPk.mockResolvedValue({ ...mockUser, credits: 5 });

            // Act
            await userController.getCredits(req, res);

            // Assert
            expect(User.findByPk).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith({ credits: 5 });
        });

        it('deve retornar 0 quando usuário não tem créditos definidos', async () => {
            // Arrange
            req.user = { id: 1 };
            User.findByPk.mockResolvedValue({ ...mockUser, credits: null });

            // Act
            await userController.getCredits(req, res);

            // Assert
            const jsonCall = res.json.mock.calls[0][0];
            expect(jsonCall.credits).toBe(0);
        });

        it('deve retornar erro quando usuário não é encontrado', async () => {
            // Arrange
            req.user = { id: 999 };
            User.findByPk.mockResolvedValue(null);

            // Act
            await userController.getCredits(req, res);

            // Assert
            expectErrorResponse(res, 404, 'Usuário não encontrado');
        });
    });

    describe('completeOnboarding', () => {
        const validOnboardingData = {
            job_area: 'Tecnologia',
            experience_level: 'Senior',
            preferences: { remote: true }
        };

        it('deve completar onboarding com sucesso', async () => {
            // Arrange
            req.user = { id: 1 };
            req.body = validOnboardingData;
            const mockUserInstance = {
                ...mockUser,
                update: jest.fn().mockResolvedValue()
            };
            User.findByPk.mockResolvedValue(mockUserInstance);

            // Act
            await userController.completeOnboarding(req, res);

            // Assert
            expect(mockUserInstance.update).toHaveBeenCalledWith({
                job_area: validOnboardingData.job_area,
                experience_level: validOnboardingData.experience_level,
                preferences: validOnboardingData.preferences,
                onboarding_completed: true
            });
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('concluído com sucesso'),
                user: expect.any(Object)
            }));
        });

        it('deve retornar erro quando campos obrigatórios estão faltando', async () => {
            // Arrange
            req.user = { id: 1 };
            req.body = { job_area: 'Tecnologia' }; // Faltando experience_level

            // Act
            await userController.completeOnboarding(req, res);

            // Assert
            expectErrorResponse(res, 400, 'obrigatórios');
            expect(User.findByPk).not.toHaveBeenCalled();
        });

        it('deve funcionar sem preferences', async () => {
            // Arrange
            req.user = { id: 1 };
            req.body = {
                job_area: 'Tecnologia',
                experience_level: 'Senior'
            };
            const mockUserInstance = {
                ...mockUser,
                update: jest.fn().mockResolvedValue()
            };
            User.findByPk.mockResolvedValue(mockUserInstance);

            // Act
            await userController.completeOnboarding(req, res);

            // Assert
            expect(mockUserInstance.update).toHaveBeenCalledWith({
                job_area: 'Tecnologia',
                experience_level: 'Senior',
                preferences: {},
                onboarding_completed: true
            });
        });
    });

    describe('getOnboardingStatus', () => {
        it('deve retornar status de onboarding', async () => {
            // Arrange
            req.user = { id: 1 };
            User.findByPk.mockResolvedValue({
                ...mockUser,
                onboarding_completed: true,
                job_area: 'Tecnologia',
                experience_level: 'Senior',
                preferences: { remote: true }
            });

            // Act
            await userController.getOnboardingStatus(req, res);

            // Assert
            expect(res.json).toHaveBeenCalledWith({
                onboarding_completed: true,
                job_area: 'Tecnologia',
                experience_level: 'Senior',
                preferences: { remote: true }
            });
        });

        it('deve retornar valores padrão quando onboarding não foi completado', async () => {
            // Arrange
            req.user = { id: 1 };
            User.findByPk.mockResolvedValue({
                ...mockUser,
                onboarding_completed: null,
                job_area: null,
                experience_level: null,
                preferences: null
            });

            // Act
            await userController.getOnboardingStatus(req, res);

            // Assert
            const jsonCall = res.json.mock.calls[0][0];
            expect(jsonCall.onboarding_completed).toBe(false);
            expect(jsonCall.preferences).toEqual({});
        });
    });

    describe('resetOnboardingStatus', () => {
        beforeEach(() => {
            // Reset NODE_ENV para cada teste
            delete process.env.NODE_ENV;
        });

        it('deve resetar onboarding em ambiente de desenvolvimento', async () => {
            // Arrange
            process.env.NODE_ENV = 'development';
            req.user = { id: 1 };
            const mockUserInstance = {
                ...mockUser,
                update: jest.fn().mockResolvedValue()
            };
            User.findByPk.mockResolvedValue(mockUserInstance);

            // Act
            await userController.resetOnboardingStatus(req, res);

            // Assert
            expect(mockUserInstance.update).toHaveBeenCalledWith({
                onboarding_completed: false,
                job_area: null,
                experience_level: null,
                preferences: {}
            });
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Status de onboarding resetado com sucesso'
            });
        });

        it('deve bloquear reset em produção', async () => {
            // Arrange
            process.env.NODE_ENV = 'production';
            req.user = { id: 1 };

            // Act
            await userController.resetOnboardingStatus(req, res);

            // Assert
            expectErrorResponse(res, 403, 'não está disponível em ambiente de produção');
            expect(User.findByPk).not.toHaveBeenCalled();
        });
    });
});