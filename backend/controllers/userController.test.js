const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userController = require('./userController');
const User = require('../models/user');

// Mock dos modelos
jest.mock('../models/user');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('User Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should return 400 if required fields are missing', async () => {
      req.body = { email: 'test@example.com' };

      await userController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Nome, email e senha são obrigatórios.'
      });
    });

    it('should return 400 if email already exists', async () => {
      req.body = { name: 'Test User', email: 'test@example.com', password: '123456' };
      User.findOne.mockResolvedValue({ id: 1, email: 'test@example.com' });

      await userController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Email já cadastrado.'
      });
    });

    it('should create user successfully', async () => {
      req.body = { name: 'Test User', email: 'test@example.com', password: '123456' };
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed-password');
      User.create.mockResolvedValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      });

      await userController.register(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
      expect(User.create).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      });
    });

    it('should handle database errors', async () => {
      req.body = { name: 'Test User', email: 'test@example.com', password: '123456' };
      User.findOne.mockRejectedValue(new Error('Database error'));

      await userController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Database error'
      });
    });
  });

  describe('login', () => {
    it('should return 400 if email or password is missing', async () => {
      req.body = { email: 'test@example.com' };

      await userController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Email e senha são obrigatórios.'
      });
    });

    it('should return 400 if user does not exist', async () => {
      req.body = { email: 'test@example.com', password: '123456' };
      User.findOne.mockResolvedValue(null);

      await userController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Este email ainda não está cadastrado no sistema. Por favor, clique em "Criar Conta" para fazer seu cadastro primeiro.',
        needsRegistration: true
      });
    });

    it('should return 401 if password is incorrect', async () => {
      req.body = { email: 'test@example.com', password: 'wrong-password' };
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed-password',
        update: jest.fn()
      };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await userController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Senha incorreta.'
      });
    });

    it('should login successfully and return token', async () => {
      req.body = { email: 'test@example.com', password: '123456' };
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        onboarding_completed: true,
        job_area: 'IT',
        experience_level: 'Senior',
        preferences: {},
        update: jest.fn()
      };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-token');

      await userController.login(req, res);

      expect(mockUser.update).toHaveBeenCalledWith({ last_login: expect.any(Date) });
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          isAdmin: false
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      expect(res.json).toHaveBeenCalledWith({
        token: 'mock-token',
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          onboarding_completed: true,
          job_area: 'IT',
          experience_level: 'Senior',
          preferences: {}
        }
      });
    });
  });

  describe('profile', () => {
    it('should return user profile successfully', async () => {
      req.user = { id: 1 };
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      };
      User.findByPk.mockResolvedValue(mockUser);

      await userController.profile(req, res);

      expect(User.findByPk).toHaveBeenCalledWith(1, {
        attributes: ['id', 'name', 'email']
      });
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 404 if user not found', async () => {
      req.user = { id: 999 };
      User.findByPk.mockResolvedValue(null);

      await userController.profile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuário não encontrado.'
      });
    });
  });

  describe('getCredits', () => {
    it('should return user credits successfully', async () => {
      req.user = { id: 1 };
      const mockUser = { credits: 10 };
      User.findByPk.mockResolvedValue(mockUser);

      await userController.getCredits(req, res);

      expect(User.findByPk).toHaveBeenCalledWith(1, {
        attributes: ['credits']
      });
      expect(res.json).toHaveBeenCalledWith({ credits: 10 });
    });

    it('should return 404 if user not found', async () => {
      req.user = { id: 999 };
      User.findByPk.mockResolvedValue(null);

      await userController.getCredits(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuário não encontrado.'
      });
    });
  });
});