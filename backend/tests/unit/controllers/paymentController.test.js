const paymentController = require('../../../controllers/paymentController');
const config = require('../../../config/environment');
const Transaction = require('../../../models/Transaction');
const User = require('../../../models/user');
const {
  mockRequest,
  mockResponse,
  mockUser,
  expectSuccessResponse,
  expectErrorResponse,
  mockStripeCustomer,
  mockStripePaymentIntent
} = require('../../helpers/testHelpers');

// Mock global do Stripe antes de importar o controller
const mockStripeInstance = {
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
    confirm: jest.fn()
  },
  customers: {
    create: jest.fn(),
    retrieve: jest.fn()
  },
  webhooks: {
    constructEvent: jest.fn()
  }
};

// Mock das dependências
jest.mock('stripe', () => {
  return jest.fn(() => mockStripeInstance);
});

// Mock do controller para injetar o Stripe mockado
jest.doMock('../../../controllers/paymentController', () => {
  const originalModule = jest.requireActual('../../../controllers/paymentController');
  // Inject mocked stripe instance
  const controller = { ...originalModule };
  return controller;
});

jest.mock('../../../config/environment', () => ({
  stripe: {
    secretKey: 'sk_test_mockkey123',
    environment: 'test',
    webhookSecret: 'whsec_test_secret'
  },
  environment: {
    name: 'test'
  }
}));

jest.mock('../../../models/Transaction');
jest.mock('../../../models/user');

describe('PaymentController', () => {
  let req, res;
  let mockStripe;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
    
    // Mock do console para silenciar logs
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();

    // Usar a instância global mockada
    mockStripe = mockStripeInstance;
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
    console.warn.mockRestore();
  });

  describe('createPaymentIntent', () => {
    beforeEach(() => {
      req.user = { id: 1, email: 'test@example.com' };
      req.body = {
        amount: 10, // R$ 10,00 em reais (controller converte para centavos)
        planName: 'premium',
        credits: 10,
        paymentMethod: 'card'
      };
    });

    it('deve criar payment intent com sucesso', async () => {
      // Arrange
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'pi_test123_secret_abc',
        status: 'requires_payment_method',
        amount: 1000,
        currency: 'brl'
      });
      Transaction.create.mockResolvedValue({
        id: 1,
        paymentIntentId: 'pi_test123',
        amount: 10,
        status: 'pending'
      });

      // Act
      await paymentController.createPaymentIntent(req, res);

      // Assert
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1000, // Controller converte 10 reais para 1000 centavos
          currency: 'brl',
          metadata: expect.objectContaining({
            userId: 1,
            planName: 'premium',
            credits: '10'
          })
        })
      );
      expect(Transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          paymentIntentId: 'pi_test123',
          amount: 10,
          status: 'pending'
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          clientSecret: 'pi_test123_secret_abc'
        })
      );
    });

    it('deve retornar erro quando campos obrigatórios estão faltando', async () => {
      // Arrange
      req.body = { amount: 10 }; // Faltando planName, credits, paymentMethod

      // Act
      await paymentController.createPaymentIntent(req, res);

      // Assert
      expectErrorResponse(res, 400, 'Informações de pagamento incompletas');
      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando método de pagamento não é suportado', async () => {
      // Arrange
      req.body = {
        amount: 10,
        planName: 'premium',
        credits: 10,
        paymentMethod: 'bitcoin' // Método não suportado
      };

      // Act
      await paymentController.createPaymentIntent(req, res);

      // Assert
      expectErrorResponse(res, 400, 'Método de pagamento não suportado');
      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
    });

    it('deve continuar mesmo com falha no banco de dados', async () => {
      // Arrange
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'pi_test123_secret_abc'
      });
      Transaction.create.mockRejectedValue(new Error('Database error'));

      // Act  
      await paymentController.createPaymentIntent(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          clientSecret: 'pi_test123_secret_abc'
        })
      );
    });

    it('deve tratar erros do Stripe', async () => {
      // Arrange
      mockStripe.paymentIntents.create.mockRejectedValue(
        new Error('Stripe API Error')
      );

      // Act
      await paymentController.createPaymentIntent(req, res);

      // Assert
      expectErrorResponse(res, 500, 'Erro ao processar pagamento');
    });

    it('deve incluir metadados corretos no payment intent', async () => {
      // Arrange
      req.body = {
        amount: 25,
        planName: 'enterprise',
        credits: 50,
        paymentMethod: 'card'
      };
      mockStripe.paymentIntents.create.mockResolvedValue(mockStripePaymentIntent);
      Transaction.create.mockResolvedValue({});

      // Act
      await paymentController.createPaymentIntent(req, res);

      // Assert
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            userId: 1,
            planName: 'enterprise',
            credits: '50'
          })
        })
      );
    });
  });

  describe('confirmPayment', () => {
    beforeEach(() => {
      req.body = {
        paymentIntentId: 'pi_test123'
      };
    });

    it('deve confirmar pagamento com sucesso', async () => {
      // Arrange
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test123',
        status: 'succeeded',
        amount: 1000,
        metadata: { userId: '1', credits: '10' }
      });

      const mockTransaction = {
        id: 1,
        userId: 1,
        amount: 1000,
        status: 'pending',
        update: jest.fn().mockResolvedValue()
      };
      Transaction.findOne.mockResolvedValue(mockTransaction);

      const mockUserInstance = {
        ...mockUser,
        credits: 5,
        update: jest.fn().mockResolvedValue()
      };
      User.findByPk.mockResolvedValue(mockUserInstance);

      // Act
      await paymentController.confirmPayment(req, res);

      // Assert
      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_test123');
      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          metadata: expect.objectContaining({
            paymentStatus: 'succeeded'
          })
        })
      );
      expect(mockUserInstance.update).toHaveBeenCalledWith({ credits: 15 }); // 5 + 10
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('sucesso')
        })
      );
    });

    it('deve retornar erro quando payment intent não é encontrado', async () => {
      // Arrange
      mockStripe.paymentIntents.retrieve.mockRejectedValue(
        new Error('No such payment_intent')
      );

      // Act
      await paymentController.confirmPayment(req, res);

      // Assert
      expectErrorResponse(res, 500, 'Erro ao confirmar pagamento');
    });

    it('deve retornar erro quando pagamento não foi bem-sucedido', async () => {
      // Arrange
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test123',
        status: 'requires_action',
        amount: 1000
      });

      // Act
      await paymentController.confirmPayment(req, res);

      // Assert
      expectErrorResponse(res, 400, 'Pagamento não foi concluído com sucesso');
    });

    it('deve tratar transação que não existe no banco', async () => {
      // Arrange
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test123',
        status: 'succeeded',
        amount: 1000,
        metadata: { 
          userId: 'anonymous',
          credits: '10'
        }
      });
      Transaction.findOne.mockResolvedValue(null);

      // Act
      await paymentController.confirmPayment(req, res);

      // Assert
      expectErrorResponse(res, 404, 'Transação não encontrada e dados insuficientes para criar');
    });

    it('deve criar transação quando não existe mas tem dados válidos', async () => {
      // Arrange
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test123',
        status: 'succeeded',
        amount: 1000,
        metadata: { 
          userId: '1',
          credits: '10',
          planName: 'premium'
        }
      });

      Transaction.findOne.mockResolvedValue(null);
      const mockCreatedTransaction = {
        id: 2,
        userId: 1,
        credits: 10,
        update: jest.fn().mockResolvedValue()
      };
      Transaction.create.mockResolvedValue(mockCreatedTransaction);
      
      const mockUserInstance = {
        ...mockUser,
        credits: 5,
        update: jest.fn().mockResolvedValue()
      };
      User.findByPk.mockResolvedValue(mockUserInstance);

      // Act
      await paymentController.confirmPayment(req, res);

      // Assert
      expect(Transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          amount: 10,
          credits: 10,
          status: 'completed',
          paymentIntentId: 'pi_test123'
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('sucesso')
        })
      );
    });
  });

  describe('handleWebhook', () => {
    beforeEach(() => {
      req.rawBody = 'webhook_payload';
      req.headers = {
        'stripe-signature': 'stripe_signature_abc'
      };
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
    });

    it('deve processar webhook de pagamento bem-sucedido', async () => {
      // Arrange
      const webhookEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            status: 'succeeded',
            amount: 1000,
            metadata: { userId: '1', credits: '10' }
          }
        }
      };
      
      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);

      const mockTransaction = {
        id: 1,
        status: 'pending',
        update: jest.fn().mockResolvedValue()
      };
      Transaction.findOne.mockResolvedValue(mockTransaction);

      const mockUserInstance = {
        ...mockUser,
        credits: 0,
        update: jest.fn().mockResolvedValue()
      };
      User.findByPk.mockResolvedValue(mockUserInstance);

      // Act
      await paymentController.handleWebhook(req, res);

      // Assert
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        'webhook_payload',
        'stripe_signature_abc',
        'whsec_test_secret'
      );
      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          metadata: expect.objectContaining({
            paymentStatus: 'succeeded',
            processedByWebhook: true
          })
        })
      );
      expect(mockUserInstance.update).toHaveBeenCalledWith({ credits: 10 });
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it('deve retornar erro quando assinatura é inválida', async () => {
      // Arrange
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      // Act
      await paymentController.handleWebhook(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.stringContaining('Webhook Error: Invalid signature')
      );
    });

    it('deve ignorar eventos não relacionados a pagamento', async () => {
      // Arrange
      const webhookEvent = {
        type: 'customer.created',
        data: { object: {} }
      };
      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);

      // Act
      await paymentController.handleWebhook(req, res);

      // Assert
      expect(Transaction.findOne).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it('deve lidar com webhook de pagamento falho', async () => {
      // Arrange
      const webhookEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test123',
            status: 'failed'
          }
        }
      };
      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);

      const mockTransaction = {
        id: 1,
        status: 'pending',
        update: jest.fn().mockResolvedValue()
      };
      Transaction.findOne.mockResolvedValue(mockTransaction);

      // Act
      await paymentController.handleWebhook(req, res);

      // Assert
      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          metadata: expect.objectContaining({
            paymentStatus: 'failed'
          })
        })
      );
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });
  });

  describe('getTransactionHistory', () => {
    beforeEach(() => {
      req.user = { id: 1 };
    });

    it('deve retornar histórico de transações do usuário', async () => {
      // Arrange
      const mockTransactions = [
        {
          id: 1,
          amount: 1000,
          status: 'completed',
          createdAt: new Date(),
          stripePaymentIntentId: 'pi_test123'
        },
        {
          id: 2,
          amount: 2000,
          status: 'pending',
          createdAt: new Date(),
          stripePaymentIntentId: 'pi_test456'
        }
      ];

      Transaction.findAll.mockResolvedValue(mockTransactions);

      // Act
      await paymentController.getTransactionHistory(req, res);

      // Assert
      expect(Transaction.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 1,
            status: {
              [require('sequelize').Op.in]: ['completed', 'failed', 'refunded']
            }
          },
          order: [['createdAt', 'DESC']]
        })
      );
      expect(res.json).toHaveBeenCalledWith(mockTransactions);
    });

    it('deve retornar lista vazia quando usuário não tem transações', async () => {
      // Arrange
      Transaction.findAll.mockResolvedValue([]);

      // Act
      await paymentController.getTransactionHistory(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('deve tratar erros ao buscar histórico', async () => {
      // Arrange
      Transaction.findAll.mockRejectedValue(new Error('Database error'));

      // Act
      await paymentController.getTransactionHistory(req, res);

      // Assert
      expectErrorResponse(res, 500, 'Erro ao obter histórico de transações');
    });
  });
});