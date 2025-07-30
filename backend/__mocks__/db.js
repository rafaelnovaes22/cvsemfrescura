// Mock do banco de dados para testes
const SequelizeMock = require('sequelize-mock');

const dbMock = new SequelizeMock();

// Mock para sync
dbMock.sync = jest.fn().mockResolvedValue(true);

// Mock para authenticate
dbMock.authenticate = jest.fn().mockResolvedValue(true);

module.exports = dbMock;