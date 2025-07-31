const request = require('supertest');
const express = require('express');
const userRoutes = require('../../routes/user');
const User = require('../../models/user');
const bcrypt = require('bcrypt');

// Mock do banco de dados para integração
jest.mock('../../models/user');

describe('Auth Integration Tests', () => {
  let app;

  beforeAll(() => {
    // Configurar app Express para testes de integração
    app = express();
    app.use(express.json());
    app.use('/api/user', userRoutes);
    
    // Configurar variáveis de ambiente para teste
    process.env.JWT_SECRET = 'test-integration-secret';
    process.env.NODE_ENV = 'test';
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

  describe('POST /api/user/register', () => {
    it('deve registrar novo usuário e retornar 201', async () => {
      // Arrange
      const newUser = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password123'
      };

      User.findOne.mockResolvedValue(null); // Email não existe
      User.create.mockResolvedValue({
        id: 1,
        name: newUser.name,
        email: newUser.email
      });

      // Act
      const response = await request(app)
        .post('/api/user/register')
        .send(newUser);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: 1,
        name: newUser.name,
        email: newUser.email
      });
      expect(User.create).toHaveBeenCalledWith({
        name: newUser.name,
        email: newUser.email,
        password: expect.any(String) // Hash da senha
      });
    });

    it('deve retornar 400 quando email já existe', async () => {
      // Arrange
      const existingUser = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password123'
      };

      User.findOne.mockResolvedValue({ id: 1, email: existingUser.email });

      // Act
      const response = await request(app)
        .post('/api/user/register')
        .send(existingUser);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('já cadastrado');
    });

    it('deve validar campos obrigatórios', async () => {
      // Act
      const response = await request(app)
        .post('/api/user/register')
        .send({
          name: 'João Silva'
          // email e password faltando
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('obrigatórios');
    });

    it('deve validar formato de email', async () => {
      // Act
      const response = await request(app)
        .post('/api/user/register')
        .send({
          name: 'João Silva',
          email: 'email-invalido',
          password: 'password123'
        });

      // Assert
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/user/login', () => {
    it('deve fazer login com credenciais válidas e retornar token', async () => {
      // Arrange
      const loginData = {
        email: 'joao@example.com',
        password: 'password123'
      };

      const mockUserInstance = {
        id: 1,
        name: 'João Silva',
        email: loginData.email,
        password: await bcrypt.hash(loginData.password, 10),
        onboarding_completed: true,
        job_area: 'Tecnologia',
        experience_level: 'Senior',
        preferences: {},
        update: jest.fn().mockResolvedValue()
      };

      User.findOne.mockResolvedValue(mockUserInstance);

      // Act
      const response = await request(app)
        .post('/api/user/login')
        .send(loginData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user).not.toHaveProperty('password'); // Não deve retornar senha
      expect(mockUserInstance.update).toHaveBeenCalledWith({ 
        last_login: expect.any(Date) 
      });
    });

    it('deve retornar 401 para senha incorreta', async () => {
      // Arrange
      const loginData = {
        email: 'joao@example.com',
        password: 'senha-incorreta'
      };

      User.findOne.mockResolvedValue({
        id: 1,
        email: loginData.email,
        password: await bcrypt.hash('senha-correta', 10)
      });

      // Act
      const response = await request(app)
        .post('/api/user/login')
        .send(loginData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.error).toContain('incorreta');
    });

    it('deve retornar 400 para email não cadastrado', async () => {
      // Arrange
      const loginData = {
        email: 'nao-existe@example.com',
        password: 'password123'
      };

      User.findOne.mockResolvedValue(null);

      // Act
      const response = await request(app)
        .post('/api/user/login')
        .send(loginData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('não está cadastrado');
      expect(response.body.needsRegistration).toBe(true);
    });

    it('deve validar campos obrigatórios no login', async () => {
      // Act
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: 'joao@example.com'
          // password faltando
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('obrigatórios');
    });
  });

  describe('GET /api/user/profile', () => {
    it('deve retornar perfil do usuário autenticado', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        name: 'João Silva',
        email: 'joao@example.com'
      };

      User.findByPk.mockResolvedValue(mockUser);

      // Criar token válido
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { id: mockUser.id, email: mockUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Act
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
    });

    it('deve retornar 401 sem token de autorização', async () => {
      // Act
      const response = await request(app)
        .get('/api/user/profile');

      // Assert
      expect(response.status).toBe(401);
    });

    it('deve retornar 401 com token inválido', async () => {
      // Act
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer token-invalido');

      // Assert
      expect(response.status).toBe(401);
    });

    it('deve retornar 404 quando usuário não existe', async () => {
      // Arrange
      User.findByPk.mockResolvedValue(null);

      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { id: 999, email: 'nao-existe@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Act
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('não encontrado');
    });
  });

  describe('Fluxo completo de autenticação', () => {
    it('deve permitir registro -> login -> acesso ao perfil', async () => {
      // Etapa 1: Registro
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password123'
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        id: 1,
        name: userData.name,
        email: userData.email
      });

      const registerResponse = await request(app)
        .post('/api/user/register')
        .send(userData);

      expect(registerResponse.status).toBe(201);

      // Etapa 2: Login
      const mockUserInstance = {
        id: 1,
        name: userData.name,
        email: userData.email,
        password: await bcrypt.hash(userData.password, 10),
        onboarding_completed: false,
        update: jest.fn().mockResolvedValue()
      };

      User.findOne.mockResolvedValue(mockUserInstance);

      const loginResponse = await request(app)
        .post('/api/user/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');

      // Etapa 3: Acesso ao perfil
      User.findByPk.mockResolvedValue({
        id: 1,
        name: userData.name,
        email: userData.email
      });

      const profileResponse = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${loginResponse.body.token}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.email).toBe(userData.email);
    });
  });
});