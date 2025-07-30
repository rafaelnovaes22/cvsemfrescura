const request = require('supertest');
const app = require('../../server');

describe('API Integration Tests', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'cv-sem-frescura-api');
    });
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/user/register', () => {
      it('should return 400 when required fields are missing', async () => {
        const response = await request(app)
          .post('/api/user/register')
          .send({ email: 'test@example.com' })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/user/login', () => {
      it('should return 400 when credentials are missing', async () => {
        const response = await request(app)
          .post('/api/user/login')
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Email e senha são obrigatórios.');
      });
    });
  });

  describe('Protected Endpoints', () => {
    it('should return 401 when accessing protected route without token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Token não fornecido.');
    });

    it('should return 401 when accessing with invalid token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Token inválido.');
    });
  });
});