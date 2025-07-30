const paymentController = require('./paymentController');
const { User, Transaction } = require('../models');
const stripe = require('stripe');

// Mock do Stripe
jest.mock('stripe', () => {
  const mockStripe = {
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn()
    }
  };
  return jest.fn(() => mockStripe);
});

// Mock do config
jest.mock('../config/environment', () => ({
  stripe: {
    secretKey: 'sk_test_123456789',
    environment: 'test'
  },
  environment: {
    name: 'test'
  }
}));

describe('Payment Controller', () => {
  let req, res, mockStripe;

  beforeEach(() => {
    req = {
      body: {},
      user: { id: 1, email: 'test@example.com' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Reinicializar mocks do Stripe
    jest.clearAllMocks();
    mockStripe = stripe();
  });

  describe('createPaymentIntent', () => {
    it('should return 400 if required fields are missing', async () => {
      req.body = { amount: 10 }; // Faltando planName, credits e paymentMethod

      await paymentController.createPaymentIntent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Informações de pagamento incompletas'
      });
    });

    it('should return 400 if payment method is not supported', async () => {
      req.body = { 
        amount: 10, 
        planName: 'basic', 
        credits: 5, 
        paymentMethod: 'crypto' 
      };

      await paymentController.createPaymentIntent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Método de pagamento não suportado'
      });
    });

    it('should create payment intent successfully for card', async () => {
      req.body = { 
        amount: 10, 
        planName: 'basic', 
        credits: 5, 
        paymentMethod: 'card' 
      };
      
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret'
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);
      User.findByPk.mockResolvedValue({ id: 1, credits: 5 });
      Transaction.create.mockResolvedValue({ id: 1 });

      await paymentController.createPaymentIntent(req, res);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'brl',
        metadata: {
          userId: 1,
          planName: 'basic',
          credits: '5',
          guestEmail: null,
          guestName: null
        },
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        }
      });
      expect(res.json).toHaveBeenCalledWith({
        clientSecret: 'pi_test123_secret'
      });
    });

    it('should create payment intent successfully for boleto', async () => {
      req.body = { 
        amount: 10, 
        planName: 'basic', 
        credits: 5, 
        paymentMethod: 'boleto',
        taxId: '12345678901',
        name: 'Test User',
        email: 'test@example.com'
      };
      
      const mockPaymentIntent = {
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        next_action: {
          boleto_display_details: {
            number: 'BOLETO123',
            pdf: 'http://boleto.pdf',
            expires_at: 1234567890
          }
        }
      };

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);
      Transaction.create.mockResolvedValue({ id: 1 });

      await paymentController.createPaymentIntent(req, res);

      expect(res.json).toHaveBeenCalledWith({
        clientSecret: 'pi_test123_secret',
        boletoData: {
          code: 'BOLETO123',
          pdf_url: 'http://boleto.pdf',
          expires_at: 1234567890
        }
      });
    });

    it('should handle Stripe errors', async () => {
      req.body = { 
        amount: 10, 
        planName: 'basic', 
        credits: 5, 
        paymentMethod: 'card' 
      };

      mockStripe.paymentIntents.create.mockRejectedValue(new Error('Stripe error'));

      await paymentController.createPaymentIntent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Erro ao processar pagamento',
        details: expect.any(String)
      });
    });
  });

  describe('confirmPayment', () => {
    it('should return 400 if paymentIntentId is missing', async () => {
      req.body = {};

      await paymentController.confirmPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'PaymentIntent ID é obrigatório'
      });
    });

    it('should confirm payment successfully', async () => {
      req.body = { paymentIntentId: 'pi_test123' };
      
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        metadata: {
          userId: '1',
          credits: '5'
        }
      };

      const mockTransaction = {
        id: 1,
        update: jest.fn()
      };

      const mockUser = {
        id: 1,
        credits: 5,
        update: jest.fn()
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      Transaction.findOne.mockResolvedValue(mockTransaction);
      User.findByPk.mockResolvedValue(mockUser);

      await paymentController.confirmPayment(req, res);

      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_test123');
      expect(mockTransaction.update).toHaveBeenCalledWith({
        status: 'completed'
      });
      expect(mockUser.update).toHaveBeenCalledWith({
        credits: 10
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        newCredits: 10
      });
    });

    it('should handle payment failure', async () => {
      req.body = { paymentIntentId: 'pi_test123' };
      
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'failed'
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
        error: 'Pagamento falhou'
      });
    });

    it('should handle when transaction not found', async () => {
      req.body = { paymentIntentId: 'pi_test123' };
      
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        metadata: {
          userId: '1',
          credits: '5'
        }
      };

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent);
      Transaction.findOne.mockResolvedValue(null);

      // Quando não encontra a transação, ainda tenta atualizar o usuário diretamente
      const mockUser = {
        id: 1,
        credits: 5,
        update: jest.fn()
      };
      User.findByPk.mockResolvedValue(mockUser);

      await paymentController.confirmPayment(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        newCredits: 10
      });
    });
  });
});