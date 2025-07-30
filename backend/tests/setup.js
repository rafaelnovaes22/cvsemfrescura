// Configuração global para os testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'sqlite::memory:';

// Mock do console.log em testes para reduzir ruído
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Timeout global para testes assíncronos
jest.setTimeout(10000);

// Mock manual dos modelos para evitar problemas com o banco de dados
jest.mock('../models/user', () => ({
  findByPk: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  findAll: jest.fn()
}));

jest.mock('../models/Transaction', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  findAll: jest.fn()
}));

jest.mock('../models/AnalysisResults', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findAll: jest.fn()
}));

jest.mock('../models/giftCode', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn()
}));