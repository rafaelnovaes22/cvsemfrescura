const paymentController = require('./paymentController');
const Transaction = require('../models/Transaction');
const User = require('../models/user');
const stripe = require('stripe');

// Mock dos modelos e bibliotecas
jest.mock('../models/Transaction');
jest.mock('../models/user');
jest.mock('stripe');

// Mock do config
jest.mock('../config/environment', () => ({
  stripe: {
    secretKey: 'sk_test_mock_key',
    environment: 'test'
  },
  environment: {
    name: 'test'
  }
}));

describe('Payment Controller', () => {
  let req, res;
  let mockStripe;

  beforeEach(() => {
    req = {
      body: {},
      user: { id: 1 }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Mock do Stripe
    mockStripe = {
      paymentIntents: {
        create: jest.fn(),
        retrieve: jest.fn()
      }
    };
    stripe.mockReturnValue(mockStripe);

    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should return 503 if Stripe is not configured', async () => {
      // Force stripe to be null
      stripe.mockReturnValue(null);
      
      await paymentController.createPaymentIntent(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Serviço de pagamento temporariamente indisponível. Entre em contato com o suporte.'
      });
    });

    it('should return 400 if amount is missing', async () => {
      req.body = {};

      await paymentController.createPaymentIntent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Valor do pagamento é obrigatório.'
      });
    });

    it('should return 400 if amount is invalid', async () => {
      req.body = { amount: -100 };

      await paymentController.createPaymentIntent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Valor inválido.'
      });
    });

    it('should create payment intent successfully', async () => {
      req.body = { amount: 1000 };
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        amount: 1000
      };

      User.findByPk.mockResolvedValue(mockUser);
      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);
      Transaction.create.mockResolvedValue({ id: 1 });

      await paymentController.createPaymentIntent(req, res);

      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'brl',
        payment_method_types: ['card'],
        metadata: {
          userId: '1',
          userEmail: 'test@example.com'
        }
      });
      expect(Transaction.create).toHaveBeenCalledWith({
        userId: 1,
        stripePaymentIntentId: 'pi_test123',
        amount: 1000,
        status: 'pending',
        metadata: {
          paymentIntentId: 'pi_test123',
          clientSecret: 'pi_test123_secret'
        }
      });
      expect(res.json).toHaveBeenCalledWith({
        clientSecret: 'pi_test123_secret',
        paymentIntentId: 'pi_test123'
      });
    });

    it('should handle Stripe errors', async () => {
      req.body = { amount: 1000 };
      const mockUser = { id: 1, email: 'test@example.com' };

      User.findByPk.mockResolvedValue(mockUser);
      mockStripe.paymentIntents.create.mockRejectedValue(new Error('Stripe error'));

      await paymentController.createPaymentIntent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Erro ao processar pagamento: Stripe error'
      });
    });
  });

  describe('confirmPayment', () => {
    it('should return 400 if paymentIntentId is missing', async () => {
      req.body = {};

      await paymentController.confirmPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'ID do pagamento é obrigatório.'
      });
    });

    it('should confirm payment successfully', async () => {
      req.body = { paymentIntentId: 'pi_test123' };
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        amount: 1000
      };
      const mockTransaction = {
        id: 1,
        userId: 1,
        update: jest.fn()
      };
      const mockUser = {
        id: 1,
        credits: 0,
        update: jest.fn()
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      Transaction.findOne.mockResolvedValue(mockTransaction);
      User.findByPk.mockResolvedValue(mockUser);

      await paymentController.confirmPayment(req, res);

      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_test123');
      expect(Transaction.findOne).toHaveBeenCalledWith({
        where: { stripePaymentIntentId: 'pi_test123' }
      });
      expect(mockTransaction.update).toHaveBeenCalledWith({
        status: 'succeeded',
        metadata: expect.objectContaining({
          confirmedAt: expect.any(String)
        })
      });
      expect(mockUser.update).toHaveBeenCalledWith({
        credits: 1
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        credits: 1,
        transaction: mockTransaction
      });
    });

    it('should handle payment failure', async () => {
      req.body = { paymentIntentId: 'pi_test123' };
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'failed',
        amount: 1000
      };
      const mockTransaction = {
        id: 1,
        update: jest.fn()
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      Transaction.findOne.mockResolvedValue(mockTransaction);

      await paymentController.confirmPayment(req, res);

      expect(mockTransaction.update).toHaveBeenCalledWith({
        status: 'failed'
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Pagamento não foi concluído com sucesso.'
      });
    });

    it('should return 404 if transaction not found', async () => {
      req.body = { paymentIntentId: 'pi_test123' };
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded'
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      Transaction.findOne.mockResolvedValue(null);

      await paymentController.confirmPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Transação não encontrada.'
      });
    });
  });
});