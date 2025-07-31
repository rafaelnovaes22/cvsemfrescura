# 📚 GUIA COMPLETO DE TESTES - CV SEM FRESCURA

## 📋 **ÍNDICE**
1. [Visão Geral](#visão-geral)
2. [Arquitetura de Testes](#arquitetura-de-testes)
3. [Testes Unitários](#testes-unitários)
4. [Testes de Integração](#testes-de-integração)
5. [Testes E2E](#testes-e2e)
6. [Testes de Performance](#testes-de-performance)
7. [Práticas de TDD](#práticas-de-tdd)
8. [Configuração e Setup](#configuração-e-setup)
9. [CI/CD e Automação](#cicd-e-automação)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 **VISÃO GERAL**

### **Filosofia de Testes**
O projeto CV Sem Frescura segue uma abordagem **Test-Driven Development (TDD)** com foco em:
- **Qualidade**: Garantir que o código funciona como esperado
- **Confiabilidade**: Detectar regressões automaticamente
- **Manutenibilidade**: Facilitar refatorações seguras
- **Documentação Viva**: Testes servem como documentação funcional

### **Pirâmide de Testes**
```
        🔺 E2E Tests (Poucos, Lentos, Alto Valor)
       🔺🔺 Integration Tests (Alguns, Médios)
      🔺🔺🔺 Unit Tests (Muitos, Rápidos, Focados)
```

### **Métricas de Qualidade**
- **Cobertura de Código**: Meta de 80%+
- **Tempo de Execução**: Testes unitários < 10s, E2E < 5min
- **Taxa de Sucesso**: 95%+ em CI/CD
- **Flakiness**: < 2% de testes instáveis

---

## 🏗️ **ARQUITETURA DE TESTES**

### **Estrutura de Diretórios**
```
backend/
├── tests/
│   ├── unit/                    # Testes unitários
│   │   ├── controllers/         # Testes de controllers
│   │   ├── services/           # Testes de services
│   │   ├── models/             # Testes de models
│   │   └── utils/              # Testes de utilities
│   ├── integration/            # Testes de integração
│   │   ├── auth.integration.test.js
│   │   └── payment.integration.test.js
│   ├── helpers/                # Utilitários de teste
│   │   └── testHelpers.js
│   ├── mocks/                  # Mocks externos
│   │   └── externalServices.js
│   └── setup.js               # Configuração global
├── cypress/
│   ├── e2e/                   # Testes E2E
│   ├── support/               # Comandos e configurações
│   └── fixtures/              # Dados de teste
├── jest.config.js             # Configuração Jest
├── .nycrc.json               # Configuração cobertura
└── cypress.config.js         # Configuração Cypress
```

### **Tecnologias Utilizadas**
- **Jest**: Framework de testes unitários e integração
- **Supertest**: Testes de API HTTP
- **Cypress**: Testes E2E
- **NYC**: Cobertura de código
- **Sinon**: Mocks e spies avançados

---

## 🧪 **TESTES UNITÁRIOS**

### **Convenções de Nomenclatura**
```javascript
// ✅ CORRETO
describe('UserController', () => {
  describe('register', () => {
    it('deve registrar usuário com dados válidos', () => {
      // teste aqui
    });
    
    it('deve retornar erro para email inválido', () => {
      // teste aqui
    });
  });
});

// ❌ INCORRETO
describe('Tests', () => {
  it('test user', () => {
    // muito vago
  });
});
```

### **Estrutura de Teste (AAA Pattern)**
```javascript
it('deve fazer login com sucesso', async () => {
  // ARRANGE - Configurar dados e mocks
  const loginData = { email: 'test@test.com', password: '123' };
  User.findOne.mockResolvedValue(mockUser);
  bcrypt.compare.mockResolvedValue(true);
  
  // ACT - Executar ação
  await userController.login(req, res);
  
  // ASSERT - Verificar resultados
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({ token: expect.any(String) })
  );
});
```

### **Exemplo Completo - Controller**
```javascript
const userController = require('../../../controllers/userController');
const User = require('../../../models/user');
const { mockRequest, mockResponse } = require('../../helpers/testHelpers');

jest.mock('../../../models/user');

describe('UserController', () => {
  let req, res;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('deve registrar novo usuário com sucesso', async () => {
      // Arrange
      req.body = {
        name: 'João Silva',
        email: 'joao@test.com',
        password: 'senha123'
      };
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({ id: 1, name: 'João Silva' });

      // Act
      await userController.register(req, res);

      // Assert
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'João Silva',
          email: 'joao@test.com'
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});
```

### **Testando Services**
```javascript
const openaiService = require('../../../services/openaiService');
const axios = require('axios');

jest.mock('axios');

describe('OpenAI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve extrair dados do currículo com sucesso', async () => {
    // Arrange
    const mockResponse = {
      data: {
        choices: [{ message: { content: '{"score": 85}' } }]
      }
    };
    axios.post.mockResolvedValue(mockResponse);

    // Act
    const result = await openaiService.extractATSData('jobs', 'resume');

    // Assert
    expect(axios.post).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        model: expect.any(String),
        messages: expect.any(Array)
      }),
      expect.any(Object)
    );
    expect(result).toEqual({ score: 85 });
  });
});
```

### **Comandos para Testes Unitários**
```bash
# Executar todos os testes unitários
npm run test:unit

# Executar testes específicos
npx jest tests/unit/controllers/userController.test.js

# Executar com cobertura
npm run test:coverage

# Modo watch (desenvolvimento)
npm run test:watch

# Executar testes em paralelo
npx jest --maxWorkers=4
```

---

## 🔗 **TESTES DE INTEGRAÇÃO**

### **Propósito e Escopo**
Testes de integração verificam a **comunicação entre componentes** do sistema:
- Controllers + Services + Models
- APIs + Banco de Dados
- Autenticação + Autorização
- Fluxos de negócio completos

### **Exemplo - Integração de Autenticação**
```javascript
const request = require('supertest');
const express = require('express');
const userRoutes = require('../../routes/user');

describe('Auth Integration', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/user', userRoutes);
  });

  it('deve permitir fluxo completo: registro → login → perfil', async () => {
    const userData = {
      name: 'João Silva',
      email: 'joao@integration.test',
      password: 'senha123'
    };

    // 1. Registro
    const registerResponse = await request(app)
      .post('/api/user/register')
      .send(userData);
    
    expect(registerResponse.status).toBe(201);

    // 2. Login
    const loginResponse = await request(app)
      .post('/api/user/login')
      .send({
        email: userData.email,
        password: userData.password
      });
    
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty('token');

    // 3. Perfil
    const profileResponse = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${loginResponse.body.token}`);
    
    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.email).toBe(userData.email);
  });
});
```

### **Testando APIs com Autenticação**
```javascript
describe('Protected Routes Integration', () => {
  let authToken;

  beforeAll(async () => {
    // Setup de autenticação
    const loginResponse = await request(app)
      .post('/api/user/login')
      .send({ email: 'test@test.com', password: 'senha' });
    
    authToken = loginResponse.body.token;
  });

  it('deve criar payment intent autenticado', async () => {
    const response = await request(app)
      .post('/api/payment/create-intent')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 1000,
        currency: 'brl'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('clientSecret');
  });
});
```

---

## 🌐 **TESTES E2E (CYPRESS)**

### **Configuração Básica**
```javascript
// cypress.config.js
module.exports = {
  e2e: {
    baseUrl: 'http://localhost:8080',
    video: false,
    screenshotOnRunFailure: true,
    env: {
      apiUrl: 'http://localhost:3000/api'
    }
  }
};
```

### **Comandos Customizados**
```javascript
// cypress/support/commands.js
Cypress.Commands.add('login', (email, password) => {
  cy.request('POST', `${Cypress.env('apiUrl')}/user/login`, {
    email,
    password
  }).then((response) => {
    localStorage.setItem('token', response.body.token);
    localStorage.setItem('userEmail', email);
  });
});

Cypress.Commands.add('createTestUser', () => {
  const user = {
    name: 'E2E Test User',
    email: `e2e.${Date.now()}@test.com`,
    password: 'Test123!'
  };
  
  cy.request('POST', `${Cypress.env('apiUrl')}/user/register`, user)
    .then(() => cy.wrap(user));
});
```

### **Exemplo - Teste de Fluxo Completo**
```javascript
describe('Complete User Journey', () => {
  it('deve permitir registro, login e análise de currículo', () => {
    // 1. Registro
    cy.visit('/analisar.html?login=false');
    cy.contains('Cadastre-se').click();
    
    cy.get('input[name="name"]').type('João Silva');
    cy.get('input[name="email"]').type('joao@e2e.test');
    cy.get('input[name="password"]').type('Senha123!');
    cy.get('input[name="phone"]').type('11987654321');
    cy.get('button[type="submit"]').click();
    
    cy.contains('Cadastro realizado').should('be.visible');

    // 2. Login automático após registro
    cy.url().should('include', '/analisar.html');
    cy.contains('Carregar Currículo').should('be.visible');

    // 3. Upload de currículo (mock)
    cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-cv.pdf');
    
    // 4. Adicionar vagas
    cy.get('input[placeholder*="vaga"]').type('https://empresa.com/vaga1{enter}');
    cy.get('input[placeholder*="vaga"]').type('https://empresa.com/vaga2{enter}');
    cy.get('input[placeholder*="vaga"]').type('https://empresa.com/vaga3{enter}');

    // 5. Executar análise
    cy.contains('Analisar Currículo').click();

    // 6. Verificar resultados
    cy.contains('Análise Concluída', { timeout: 30000 }).should('be.visible');
    cy.get('[data-testid="score"]').should('be.visible');
    cy.get('[data-testid="feedback"]').should('be.visible');
  });
});
```

### **Testes de Performance E2E**
```javascript
describe('Performance E2E', () => {
  it('deve carregar página principal em menos de 3s', () => {
    const start = Date.now();
    
    cy.visit('/');
    cy.get('main').should('be.visible');
    
    cy.then(() => {
      const loadTime = Date.now() - start;
      expect(loadTime).to.be.lessThan(3000);
    });
  });
});
```

---

## ⚡ **TESTES DE PERFORMANCE**

### **Métricas Importantes**
- **Page Load Time**: < 3s para primeira visita
- **Time to First Byte**: < 1s
- **API Response Time**: < 2s para operações críticas
- **Concurrent Users**: Suportar 50+ usuários simultâneos

### **Teste de Carga de API**
```javascript
describe('Load Testing', () => {
  it('deve suportar 20 requests simultâneos', () => {
    const requests = Array(20).fill().map(() => ({
      method: 'GET',
      url: `${Cypress.env('apiUrl')}/user/profile`,
      headers: { 'Authorization': `Bearer ${token}` }
    }));

    cy.loadTest(requests, {
      concurrency: 10,
      delay: 50
    }).then((results) => {
      expect(results.successRate).to.be.greaterThan(95);
      expect(results.avgResponseTime).to.be.lessThan(1000);
    });
  });
});
```

### **Monitoramento de Recursos**
```javascript
it('deve monitorar uso de memória', () => {
  cy.visit('/analisar.html');
  
  cy.window().then((win) => {
    if (win.performance.memory) {
      const memory = win.performance.memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      
      cy.log(`Memory usage: ${usedMB.toFixed(1)}MB`);
      expect(usedMB).to.be.lessThan(100); // Máximo 100MB
    }
  });
});
```

---

## 🔄 **PRÁTICAS DE TDD**

### **Ciclo Red-Green-Refactor**
```
1. 🔴 RED: Escrever teste que falha
2. 🟢 GREEN: Escrever código mínimo para passar
3. 🔵 REFACTOR: Melhorar código mantendo testes passando
```

### **Exemplo Prático de TDD**
```javascript
// 1. RED - Teste que falha
describe('UserService', () => {
  it('deve validar email único', async () => {
    const result = await userService.isEmailUnique('test@test.com');
    expect(result).toBe(false); // Vai falhar - método não existe
  });
});

// 2. GREEN - Implementação mínima
// userService.js
async function isEmailUnique(email) {
  const user = await User.findOne({ where: { email } });
  return !user;
}

// 3. REFACTOR - Melhorar implementação
async function isEmailUnique(email) {
  if (!email || typeof email !== 'string') {
    throw new Error('Email inválido');
  }
  
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ where: { email: normalizedEmail } });
  return !user;
}
```

### **Diretrizes TDD**
1. **Teste Primeiro**: Sempre escrever teste antes do código
2. **Passos Pequenos**: Incrementos mínimos viáveis
3. **Refatoração Constante**: Melhorar código frequentemente
4. **Testes Limpos**: Testes devem ser simples e claros
5. **Cobertura Natural**: TDD leva naturalmente a alta cobertura

---

## ⚙️ **CONFIGURAÇÃO E SETUP**

### **Instalação Inicial**
```bash
# Instalar dependências
npm install

# Instalar dependências de desenvolvimento
npm install --save-dev jest supertest cypress nyc sinon

# Configurar banco de dados de teste
cp .env.example .env.test
```

### **Configuração do Jest**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'models/**/*.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

### **Configuração do Cypress**
```javascript
// cypress.config.js
module.exports = {
  e2e: {
    baseUrl: 'http://localhost:8080',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: process.env.CI ? true : false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000
  }
};
```

### **Scripts do Package.json**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "nyc jest",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "cypress:open": "cypress open",
    "cypress:run": "cypress run",
    "test:e2e": "cypress run",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

---

## 🚀 **CI/CD E AUTOMAÇÃO**

### **GitHub Actions Pipeline**
```yaml
# .github/workflows/tests.yml
name: Tests & Coverage

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run unit tests
      run: npm run test:unit
      
    - name: Generate coverage
      run: npm run test:coverage
      
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Start server
      run: npm start &
      
    - name: Wait for server
      run: npx wait-on http://localhost:3000
      
    - name: Run E2E tests
      run: npm run cypress:run
```

### **Configuração de Qualidade**
```yaml
# .github/workflows/quality-gates.yml
quality-gates:
  runs-on: ubuntu-latest
  needs: [unit-tests, e2e-tests]
  
  steps:
  - name: Check coverage threshold
    run: |
      COVERAGE=$(npm run test:coverage --silent | grep "All files" | awk '{print $10}' | sed 's/%//')
      if [ "$COVERAGE" -lt "80" ]; then
        echo "Coverage $COVERAGE% is below threshold 80%"
        exit 1
      fi
      
  - name: Check test success rate
    run: |
      # Verificar taxa de sucesso dos testes
      npm run test:all --silent
```

---

## 🔧 **TROUBLESHOOTING**

### **Problemas Comuns**

#### **1. Testes Lentos**
```javascript
// ❌ PROBLEMA
beforeEach(async () => {
  await setupDatabase(); // Muito lento
});

// ✅ SOLUÇÃO
beforeAll(async () => {
  await setupDatabase(); // Uma vez por suíte
});

beforeEach(() => {
  resetMocks(); // Apenas reset de mocks
});
```

#### **2. Testes Flaky**
```javascript
// ❌ PROBLEMA
it('deve atualizar dados', async () => {
  await updateData();
  const result = await getData(); // Race condition
  expect(result).toBe('updated');
});

// ✅ SOLUÇÃO
it('deve atualizar dados', async () => {
  await updateData();
  await waitFor(() => getData());
  const result = await getData();
  expect(result).toBe('updated');
});
```

#### **3. Mocks Não Funcionam**
```javascript
// ❌ PROBLEMA
const service = require('./service');
jest.mock('./dependency'); // Mock após import

// ✅ SOLUÇÃO
jest.mock('./dependency'); // Mock antes de qualquer import
const service = require('./service');
```

#### **4. Timeouts no Cypress**
```javascript
// ❌ PROBLEMA
cy.get('.loading').should('not.exist'); // Pode falhar

// ✅ SOLUÇÃO
cy.get('.loading', { timeout: 10000 }).should('not.exist');
```

### **Debug de Testes**
```javascript
// Para testes unitários
it('deve fazer algo', async () => {
  console.log('Debug info:', debugData); // Usar console.log
  await expect(something()).resolves.toBe(expected);
});

// Para testes E2E
cy.debug(); // Pausar execução
cy.pause(); // Pausar para inspeção manual
```

### **Performance de Testes**
```bash
# Executar testes em paralelo
npm test -- --maxWorkers=4

# Executar apenas testes modificados
npm test -- --onlyChanged

# Usar cache do Jest
npm test -- --cache
```

---

## 📚 **RECURSOS ADICIONAIS**

### **Documentação Oficial**
- [Jest Documentation](https://jestjs.io/docs/)
- [Cypress Documentation](https://docs.cypress.io/)
- [Supertest Documentation](https://github.com/ladjs/supertest)

### **Boas Práticas**
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [TDD Cycle](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

### **Ferramentas Úteis**
- **Test Coverage**: [NYC](https://github.com/istanbuljs/nyc)
- **Mock Server**: [MSW](https://mswjs.io/)
- **Visual Testing**: [Percy](https://percy.io/)

---

## 🎯 **CONCLUSÃO**

Este guia fornece uma base sólida para implementar e manter testes de alta qualidade no projeto CV Sem Frescura. Lembre-se:

1. **Teste Primeiro**: TDD é mais que uma técnica, é uma filosofia
2. **Qualidade sobre Quantidade**: Prefira testes significativos
3. **Manutenção Constante**: Testes também precisam de refatoração
4. **Documentação Viva**: Testes são a melhor documentação do código

**🏆 Com essas práticas, você estará contribuindo para um código mais confiável, maintível e de alta qualidade!**