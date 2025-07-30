const jwt = require('jsonwebtoken');
const authMiddleware = require('./authMiddleware');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      url: '/test'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Validation', () => {
    it('should return 401 if no authorization header is provided', () => {
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token não fornecido.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header is malformed', () => {
      req.headers.authorization = 'InvalidFormat';
      
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', () => {
      req.headers.authorization = 'Bearer invalid-token';
      
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() with valid token', () => {
      const payload = { id: 1, email: 'test@example.com' };
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(payload.id);
      expect(req.user.email).toBe(payload.email);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 if token is expired', () => {
      const payload = { id: 1, email: 'test@example.com' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '-1h' });
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido.' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});