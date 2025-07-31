const giftCodeController = require('../../../controllers/giftCodeController');
const GiftCode = require('../../../models/giftCode');
const User = require('../../../models/user');
const GiftCodeUsage = require('../../../models/giftCodeUsage');
const {
    mockRequest,
    mockResponse,
    mockUser,
    mockAdmin,
    expectSuccessResponse,
    expectErrorResponse
} = require('../../helpers/testHelpers');

// Mock das dependências
jest.mock('../../../models/giftCode');
jest.mock('../../../models/user');
jest.mock('../../../models/giftCodeUsage');

describe('GiftCodeController', () => {
    let req, res;

    beforeEach(() => {
        req = mockRequest();
        res = mockResponse();
        jest.clearAllMocks();
        // Silenciar console.log para os testes
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        console.log.mockRestore();
        console.error.mockRestore();
    });

    describe('validateCode', () => {
        const validGiftCode = {
            id: 1,
            code: 'GIFT123',
            isActive: true,
            maxUses: 10,
            usedCount: 5,
            expiresAt: new Date(Date.now() + 86400000), // +1 dia
            creditsToAdd: 1
        };

        it('deve validar código com sucesso', async () => {
            // Arrange
            req.body = { code: 'GIFT123' };
            GiftCode.findOne.mockResolvedValue(validGiftCode);

            // Act
            await giftCodeController.validateCode(req, res);

            // Assert
            expect(GiftCode.findOne).toHaveBeenCalledWith({ where: { code: 'GIFT123' } });
            expect(res.json).toHaveBeenCalledWith({
                valid: true,
                credits: 1,
                remainingUses: 5
            });
        });

        it('deve retornar erro quando código não é fornecido', async () => {
            // Arrange
            req.body = {};

            // Act
            await giftCodeController.validateCode(req, res);

            // Assert
            expectErrorResponse(res, 400, 'obrigatório');
            expect(GiftCode.findOne).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando código não existe', async () => {
            // Arrange
            req.body = { code: 'INVALID' };
            GiftCode.findOne.mockResolvedValue(null);

            // Act
            await giftCodeController.validateCode(req, res);

            // Assert
            expectErrorResponse(res, 400, 'inválido');
            const jsonCall = res.json.mock.calls[0][0];
            expect(jsonCall.valid).toBe(false);
        });

        it('deve retornar erro quando código está inativo', async () => {
            // Arrange
            req.body = { code: 'GIFT123' };
            GiftCode.findOne.mockResolvedValue({ ...validGiftCode, isActive: false });

            // Act
            await giftCodeController.validateCode(req, res);

            // Assert
            expectErrorResponse(res, 400, 'inativo');
            const jsonCall = res.json.mock.calls[0][0];
            expect(jsonCall.valid).toBe(false);
        });

        it('deve retornar erro quando código está esgotado', async () => {
            // Arrange
            req.body = { code: 'GIFT123' };
            GiftCode.findOne.mockResolvedValue({
                ...validGiftCode,
                usedCount: 10,
                maxUses: 10
            });

            // Act
            await giftCodeController.validateCode(req, res);

            // Assert
            expectErrorResponse(res, 400, 'esgotado');
            const jsonCall = res.json.mock.calls[0][0];
            expect(jsonCall.valid).toBe(false);
        });

        it('deve retornar erro quando código está expirado', async () => {
            // Arrange
            req.body = { code: 'GIFT123' };
            GiftCode.findOne.mockResolvedValue({
                ...validGiftCode,
                expiresAt: new Date(Date.now() - 86400000) // -1 dia
            });

            // Act
            await giftCodeController.validateCode(req, res);

            // Assert
            expectErrorResponse(res, 400, 'expirado');
            const jsonCall = res.json.mock.calls[0][0];
            expect(jsonCall.valid).toBe(false);
        });

        it('deve tratar erros do banco de dados', async () => {
            // Arrange
            req.body = { code: 'GIFT123' };
            GiftCode.findOne.mockRejectedValue(new Error('Database error'));

            // Act
            await giftCodeController.validateCode(req, res);

            // Assert
            expectErrorResponse(res, 500);
        });
    });

    describe('applyCode', () => {
        const validGiftCode = {
            id: 1,
            code: 'GIFT123',
            isActive: true,
            maxUses: 10,
            usedCount: 5,
            expiresAt: new Date(Date.now() + 86400000),
            update: jest.fn().mockResolvedValue()
        };

        const mockUserInstance = {
            ...mockUser,
            credits: 5,
            update: jest.fn().mockResolvedValue()
        };

        beforeEach(() => {
            req.user = { id: 1 };
        });

        it('deve aplicar código com sucesso', async () => {
            // Arrange
            req.body = { code: 'GIFT123' };
            GiftCode.findOne.mockResolvedValue(validGiftCode);
            User.findByPk.mockResolvedValue(mockUserInstance);
            GiftCodeUsage.findOne.mockResolvedValue(null); // Usuário não usou antes
            GiftCodeUsage.create.mockResolvedValue({});

            // Act
            await giftCodeController.applyCode(req, res);

            // Assert
            expect(mockUserInstance.update).toHaveBeenCalledWith({ credits: 6 }); // 5 + 1
            expect(validGiftCode.update).toHaveBeenCalledWith({ usedCount: 6 }); // 5 + 1
            expect(GiftCodeUsage.create).toHaveBeenCalledWith({
                giftCodeId: 1,
                userId: 1
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: expect.stringContaining('sucesso'),
                credits: 6
            }));
        });

        it('deve retornar erro quando usuário já usou o código', async () => {
            // Arrange
            req.body = { code: 'GIFT123' };
            GiftCode.findOne.mockResolvedValue(validGiftCode);
            GiftCodeUsage.findOne.mockResolvedValue({ id: 1 }); // Já foi usado

            // Act
            await giftCodeController.applyCode(req, res);

            // Assert
            expectErrorResponse(res, 400, 'já utilizou');
            expect(User.findByPk).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando código não é válido', async () => {
            // Arrange
            req.body = { code: 'INVALID' };
            GiftCode.findOne.mockResolvedValue(null);

            // Act
            await giftCodeController.applyCode(req, res);

            // Assert
            expectErrorResponse(res, 400, 'não encontrado');
        });

        it('deve retornar erro quando usuário não é encontrado', async () => {
            // Arrange
            req.body = { code: 'GIFT123' };
            GiftCode.findOne.mockResolvedValue(validGiftCode);
            User.findByPk.mockResolvedValue(null);
            GiftCodeUsage.findOne.mockResolvedValue(null);

            // Act
            await giftCodeController.applyCode(req, res);

            // Assert
            expectErrorResponse(res, 404, 'Usuário não encontrado');
        });

        it('deve lidar com usuário sem créditos definidos', async () => {
            // Arrange
            req.body = { code: 'GIFT123' };
            GiftCode.findOne.mockResolvedValue(validGiftCode);
            const userWithoutCredits = {
                ...mockUserInstance,
                credits: null,
                update: jest.fn().mockResolvedValue()
            };
            User.findByPk.mockResolvedValue(userWithoutCredits);
            GiftCodeUsage.findOne.mockResolvedValue(null);
            GiftCodeUsage.create.mockResolvedValue({});

            // Act
            await giftCodeController.applyCode(req, res);

            // Assert
            expect(userWithoutCredits.update).toHaveBeenCalledWith({ credits: 1 }); // 0 + 1
        });
    });

    describe('createCode', () => {
        beforeEach(() => {
            req.user = { id: 1 };
        });

        it('deve criar código com sucesso', async () => {
            // Arrange
            req.body = {
                code: 'NEWGIFT',
                maxUses: 100,
                expiresAt: '2024-12-31'
            };
            GiftCode.findOne.mockResolvedValue(null); // Código não existe
            GiftCode.create.mockResolvedValue({
                id: 1,
                code: 'NEWGIFT',
                maxUses: 100,
                isActive: true,
                createdById: 1
            });

            // Act
            await giftCodeController.createCode(req, res);

            // Assert
            expect(GiftCode.findOne).toHaveBeenCalledWith({ where: { code: 'NEWGIFT' } });
            expect(GiftCode.create).toHaveBeenCalledWith({
                code: 'NEWGIFT',
                maxUses: 100,
                expiresAt: '2024-12-31',
                isActive: true,
                usedCount: 0,
                createdById: 1
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: expect.stringContaining('sucesso')
            }));
        });

        it('deve retornar erro quando código já existe', async () => {
            // Arrange
            req.body = { code: 'EXISTING' };
            GiftCode.findOne.mockResolvedValue({ id: 1, code: 'EXISTING' });

            // Act
            await giftCodeController.createCode(req, res);

            // Assert
            expectErrorResponse(res, 400, 'já existe');
            expect(GiftCode.create).not.toHaveBeenCalled();
        });

        it('deve usar valores padrão quando parâmetros opcionais não são fornecidos', async () => {
            // Arrange
            req.body = { code: 'SIMPLE' };
            GiftCode.findOne.mockResolvedValue(null);
            GiftCode.create.mockResolvedValue({});

            // Act
            await giftCodeController.createCode(req, res);

            // Assert
            expect(GiftCode.create).toHaveBeenCalledWith({
                code: 'SIMPLE',
                maxUses: 1, // Valor padrão
                expiresAt: null,
                isActive: true,
                usedCount: 0,
                createdById: 1
            });
        });
    });
});