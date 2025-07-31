const request = require('supertest');
const express = require('express');
const paymentRoutes = require('../../routes/payment');
const User = require('../../models/user');
const Transaction = require('../../models/Transaction');
const jwt = require('jsonwebtoken');

// Mock das dependências
jest.mock('../../models/user');
jest.mock('../../models/Transaction');
jest.mock('stripe', () => {
  return jest.fn(() => ({
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
  }));
});

describe('Payment Integration Tests', () => {
  let app;
  let authToken;
  let mockStripe;

  beforeAll(() => {
    // Configurar app Express para testes de integração
    app = express();
    app.use(express.json());
    app.use('/api/payment', paymentRoutes);
    
    // Configurar variáveis de ambiente
    process.env.JWT_SECRET = 'test-payment-secret';
    process.env.NODE_ENV = 'test';
    
    // Criar token de autenticação para testes
    authToken = jwt.sign(
      { id: 1, email: 'test@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Mock do Stripe
    const Stripe = require('stripe');
    mockStripe = Stripe();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Silenciar console durante os testes
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('POST /api/payment/create-intent', () => {
    it('deve criar payment intent com sucesso', async () => {
      // Arrange
      const paymentData = {
        amount: 1000, // R$ 10,00 em centavos
        currency: 'brl',
        metadata: { credits: 10 }
      };

      User.findByPk.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      });

      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'pi_test123_secret',
        status: 'requires_payment_method',
        amount: 1000,
        currency: 'brl'
      });

      Transaction.create.mockResolvedValue({
        id: 1,
        userId: 1,
        stripePaymentIntentId: 'pi_test123',
        amount: 1000,
        status: 'pending'
      });

      // Act
      const response = await request(app)
        .post('/api/payment/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('clientSecret');
      expect(response.body.clientSecret).toBe('pi_test123_secret');
      
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1000,
          currency: 'brl',
          metadata: expect.objectContaining({
            userId: '1',
            credits: '10'
          })
        })
      );

      expect(Transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          stripePaymentIntentId: 'pi_test123',
          amount: 1000,
          status: 'pending'
        })
      );
    });

    it('deve retornar 401 sem autenticação', async () => {
      // Act
      const response = await request(app)
        .post('/api/payment/create-intent')
        .send({
          amount: 1000,
          currency: 'brl'
        });

      // Assert
      expect(response.status).toBe(401);
    });

    it('deve retornar 400 para valor inválido', async () => {
      // Arrange
      User.findByPk.mockResolvedValue({
        id: 1,
        email: 'test@example.com'
      });

      // Act
      const response = await request(app)
        .post('/api/payment/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: -100, // Valor negativo
          currency: 'brl'
        });

      // Assert
      expect(response.status).toBe(400);
      expect(mockStripe.paymentIntents.create).not.toHaveBeenCalled();
    });

    it('deve retornar 400 para valor menor que mínimo', async () => {
      // Arrange
      User.findByPk.mockResolvedValue({
        id: 1,
        email: 'test@example.com'
      });

      // Act
      const response = await request(app)
        .post('/api/payment/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 50, // Menor que R$ 1,00
          currency: 'brl'
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('mínimo');
    });

    it('deve retornar 404 quando usuário não existe', async () => {
      // Arrange
      User.findByPk.mockResolvedValue(null);

      // Act
      const response = await request(app)
        .post('/api/payment/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
          currency: 'brl'
        });

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('não encontrado');
    });
  });

  describe('POST /api/payment/confirm', () => {
    it('deve confirmar pagamento com sucesso', async () => {
      // Arrange
      const confirmData = {
        paymentIntentId: 'pi_test123'
      };

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

      const mockUser = {
        id: 1,
        credits: 5,
        update: jest.fn().mockResolvedValue()
      };
      User.findByPk.mockResolvedValue(mockUser);

      // Act
      const response = await request(app)
        .post('/api/payment/confirm')
        .send(confirmData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('sucesso');
      
      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_test123');
      expect(mockTransaction.update).toHaveBeenCalledWith({ status: 'completed' });
      expect(mockUser.update).toHaveBeenCalledWith({ credits: 15 }); // 5 + 10
    });

    it('deve retornar 404 quando payment intent não existe', async () => {
      // Arrange
      mockStripe.paymentIntents.retrieve.mockRejectedValue(
        new Error('No such payment_intent')
      );

      // Act
      const response = await request(app)
        .post('/api/payment/confirm')
        .send({
          paymentIntentId: 'pi_invalido'
        });

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('não encontrado');
    });

    it('deve retornar 400 quando pagamento não foi bem-sucedido', async () => {
      // Arrange
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test123',
        status: 'requires_action', // Não foi completado
        amount: 1000
      });

      // Act
      const response = await request(app)
        .post('/api/payment/confirm')
        .send({
          paymentIntentId: 'pi_test123'
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('não foi confirmado');
    });

    it('deve evitar processar transação já completada', async () => {
      // Arrange
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test123',
        status: 'succeeded',
        metadata: { userId: '1' }
      });

      const mockCompletedTransaction = {
        id: 1,
        status: 'completed',
        update: jest.fn()
      };
      Transaction.findOne.mockResolvedValue(mockCompletedTransaction);

      // Act
      const response = await request(app)
        .post('/api/payment/confirm')
        .send({
          paymentIntentId: 'pi_test123'
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('já foi processada');
      expect(mockCompletedTransaction.update).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/payment/webhook', () => {
    it('deve processar webhook de pagamento bem-sucedido', async () => {
      // Arrange
      const webhookPayload = 'webhook_raw_body';
      const webhookSignature = 'stripe_signature_abc';

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

      const mockUser = {
        id: 1,
        credits: 0,
        update: jest.fn().mockResolvedValue()
      };
      User.findByPk.mockResolvedValue(mockUser);

      // Act
      const response = await request(app)
        .post('/api/payment/webhook')
        .set('stripe-signature', webhookSignature)
        .send(webhookPayload);

      // Assert
      expect(response.status).toBe(200);
      
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        webhookPayload,
        webhookSignature,
        expect.any(String) // webhook secret
      );
      
      expect(mockTransaction.update).toHaveBeenCalledWith({ status: 'completed' });
      expect(mockUser.update).toHaveBeenCalledWith({ credits: 10 });
    });

    it('deve retornar 400 para assinatura inválida', async () => {
      // Arrange
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      // Act
      const response = await request(app)
        .post('/api/payment/webhook')
        .set('stripe-signature', 'invalid_signature')
        .send('webhook_payload');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('signature');
    });

    it('deve ignorar eventos não relacionados a pagamento', async () => {
      // Arrange
      const webhookEvent = {
        type: 'customer.created',
        data: { object: {} }
      };
      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);

      // Act
      const response = await request(app)
        .post('/api/payment/webhook')
        .set('stripe-signature', 'valid_signature')
        .send('webhook_payload');

      // Assert
      expect(response.status).toBe(200);
      expect(Transaction.findOne).not.toHaveBeenCalled();
    });

    it('deve processar webhook de pagamento falhado', async () => {
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
      const response = await request(app)
        .post('/api/payment/webhook')
        .set('stripe-signature', 'valid_signature')
        .send('webhook_payload');

      // Assert
      expect(response.status).toBe(200);
      expect(mockTransaction.update).toHaveBeenCalledWith({ status: 'failed' });
    });
  });

  describe('GET /api/payment/history', () => {
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
      const response = await request(app)
        .get('/api/payment/history')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.transactions).toHaveLength(2);
      expect(response.body.transactions[0].amount).toBe(1000);
      
      expect(Transaction.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1 },
          order: [['createdAt', 'DESC']]
        })
      );
    });

    it('deve retornar 401 sem autenticação', async () => {
      // Act
      const response = await request(app)
        .get('/api/payment/history');

      // Assert
      expect(response.status).toBe(401);
    });

    it('deve retornar lista vazia para usuário sem transações', async () => {
      // Arrange
      Transaction.findAll.mockResolvedValue([]);

      // Act
      const response = await request(app)
        .get('/api/payment/history')
        .set('Authorization', `Bearer ${authToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.transactions).toHaveLength(0);
    });
  });

  describe('Fluxo completo de pagamento', () => {
    it('deve permitir criar intent -> confirmar pagamento -> verificar histórico', async () => {
      // Etapa 1: Criar Payment Intent
      User.findByPk.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        credits: 0
      });

      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_integration_test',
        client_secret: 'pi_integration_test_secret',
        status: 'requires_payment_method',
        amount: 1000
      });

      Transaction.create.mockResolvedValue({
        id: 1,
        userId: 1,
        stripePaymentIntentId: 'pi_integration_test',
        amount: 1000,
        status: 'pending'
      });

      const createResponse = await request(app)
        .post('/api/payment/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
          currency: 'brl',
          metadata: { credits: 10 }
        });

      expect(createResponse.status).toBe(200);

      // Etapa 2: Confirmar Pagamento
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_integration_test',
        status: 'succeeded',
        amount: 1000,
        metadata: { userId: '1', credits: '10' }
      });

      const mockTransaction = {
        id: 1,
        userId: 1,
        status: 'pending',
        update: jest.fn().mockResolvedValue()
      };
      Transaction.findOne.mockResolvedValue(mockTransaction);

      const mockUser = {
        id: 1,
        credits: 0,
        update: jest.fn().mockResolvedValue()
      };
      User.findByPk.mockResolvedValue(mockUser);

      const confirmResponse = await request(app)
        .post('/api/payment/confirm')
        .send({
          paymentIntentId: 'pi_integration_test'
        });

      expect(confirmResponse.status).toBe(200);
      expect(mockUser.update).toHaveBeenCalledWith({ credits: 10 });

      // Etapa 3: Verificar Histórico
      Transaction.findAll.mockResolvedValue([
        {
          id: 1,
          amount: 1000,
          status: 'completed',
          createdAt: new Date(),
          stripePaymentIntentId: 'pi_integration_test'
        }
      ]);

      const historyResponse = await request(app)
        .get('/api/payment/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(historyResponse.status).toBe(200);
      expect(historyResponse.body.transactions).toHaveLength(1);
      expect(historyResponse.body.transactions[0].status).toBe('completed');
    });
  });
});