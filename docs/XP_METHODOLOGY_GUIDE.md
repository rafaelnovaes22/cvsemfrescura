# 🚀 Guia de Metodologia XP - destravaCV

## 📋 Índice
- [Introdução](#introdução)
- [Práticas XP Implementadas](#práticas-xp-implementadas)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Fluxo de Desenvolvimento](#fluxo-de-desenvolvimento)
- [Testes E2E com Cypress](#testes-e2e-com-cypress)
- [Integração Contínua](#integração-contínua)
- [Métricas e Monitoramento](#métricas-e-monitoramento)

## 🎯 Introdução

Este documento descreve a implementação da metodologia Extreme Programming (XP) no projeto destravaCV, focando em qualidade de código, testes automatizados e entrega contínua.

## 🛠️ Práticas XP Implementadas

### 1. Test-Driven Development (TDD)
```bash
# Fluxo TDD
1. Escrever teste que falha
2. Implementar código mínimo para passar
3. Refatorar mantendo testes verdes
```

### 2. Pair Programming
- **Rotação de Pares**: Trocar parceiros a cada 2 horas
- **Driver/Navigator**: Alternar papéis a cada 30 minutos
- **Remote Pairing**: Usar VS Code Live Share ou similar

### 3. Integração Contínua
- **Commits Frequentes**: Pelo menos 3x ao dia
- **Build Automatizado**: GitHub Actions
- **Testes em Cada Push**: Suite completa

### 4. Small Releases
- **Deploy Diário**: Features pequenas e incrementais
- **Feature Flags**: Controle de funcionalidades
- **Rollback Rápido**: Máximo 5 minutos

## 🔧 Configuração do Ambiente

### Instalação das Dependências
```bash
# Backend
cd backend
npm install

# Instalar Cypress
npm install --save-dev cypress@latest
```

### Configuração dos Testes E2E
```javascript
// cypress.config.js
module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3001',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true
  }
});
```

## 📈 Fluxo de Desenvolvimento

### 1. Planning Game
```markdown
## Sprint Planning
- Duração: 1 semana
- Pontos por Sprint: 20-30
- Daily Standup: 15 minutos
```

### 2. User Stories
```markdown
## Template de User Story
Como [tipo de usuário]
Quero [funcionalidade]
Para [benefício]

### Critérios de Aceite:
- [ ] Critério 1
- [ ] Critério 2
- [ ] Testes E2E passando
```

### 3. Desenvolvimento
```bash
# 1. Criar branch da feature
git checkout -b feature/nova-funcionalidade

# 2. Escrever teste E2E
npm run cypress:open

# 3. Implementar código
# ... desenvolvimento ...

# 4. Rodar testes
npm run test:e2e

# 5. Commit e Push
git add .
git commit -m "feat: implementa nova funcionalidade"
git push origin feature/nova-funcionalidade
```

## 🧪 Testes E2E com Cypress

### Estrutura de Testes
```
backend/cypress/
├── e2e/
│   ├── auth.cy.js              ✅ Implementado
│   ├── payment.cy.js           ✅ Implementado
│   ├── gift-code.cy.js         ✅ Implementado
│   ├── cv-generation.cy.js     ✅ Implementado
│   ├── cv-analysis-complete.cy.js  ✅ Implementado
│   ├── history.cy.js           ✅ Implementado
│   ├── password-reset.cy.js   ✅ Implementado
│   └── admin-panel.cy.js      🚧 Pendente
├── fixtures/
│   ├── sample-cv.pdf          ✅ Criado
│   ├── sample-cv.docx         ✅ Criado
│   ├── invalid-file.txt       ✅ Criado
│   ├── large-cv.pdf           ✅ Criado
│   └── cv-data.json           ✅ Existente
└── support/
    └── commands.js            ✅ Atualizado
```

### Comandos de Teste
```bash
# Rodar todos os testes
npm run test:e2e

# Abrir Cypress UI
npm run cypress:open

# Rodar testes específicos
npm run cypress:run -- --spec "cypress/e2e/auth.cy.js"

# Rodar com gravação de vídeo
npm run cypress:run -- --record
```

### Exemplo de Teste E2E
```javascript
describe('CV Analysis Flow', () => {
  beforeEach(() => {
    cy.login('user@example.com', 'password');
    cy.visit('/analisar');
  });

  it('should complete full analysis', () => {
    // Upload CV
    cy.uploadCV('fixtures/sample-cv.pdf');
    
    // Add job description
    cy.fillJobDescription('Full Stack Developer...');
    
    // Start analysis
    cy.get('[data-cy="analyze-button"]').click();
    
    // Check results
    cy.checkAnalysisResults();
  });
});
```

## 🚀 Integração Contínua

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd backend
        npm ci
    
    - name: Run unit tests
      run: |
        cd backend
        npm test
    
    - name: Run E2E tests
      run: |
        cd backend
        npm run test:e2e:ci
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      with:
        name: cypress-results
        path: backend/cypress/videos
```

### Deploy Automatizado
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to Railway
      run: |
        curl -X POST ${{ secrets.RAILWAY_WEBHOOK_URL }}
```

## 📊 Métricas e Monitoramento

### Cobertura de Testes
```bash
# Gerar relatório de cobertura
npm run test:coverage

# Métricas alvo:
- Cobertura de código: > 80%
- Cobertura E2E: 100% dos fluxos críticos
- Tempo de execução: < 5 minutos
```

### Dashboard de Qualidade
```markdown
## Métricas XP
- ✅ Frequência de Deploy: 1-3x/dia
- ✅ Lead Time: < 2 horas
- ✅ MTTR: < 30 minutos
- ✅ Taxa de Sucesso: > 95%
```

### Monitoramento de Produção
```javascript
// Integração com Winston para logs
const logger = require('./utils/logger');

// Log de eventos importantes
logger.info('Análise de CV iniciada', {
  userId: req.user.id,
  fileSize: file.size,
  timestamp: new Date()
});
```

## 🎯 Próximos Passos

### Sprint Atual
- [x] Implementar teste E2E completo de análise
- [ ] Criar testes para histórico
- [ ] Implementar testes de recuperação de senha
- [ ] Adicionar testes do painel admin
- [ ] Configurar pipeline CI/CD completo

### Melhorias Futuras
1. **Testes de Performance**
   - Load testing com Artillery
   - Stress testing com K6
   
2. **Testes de Segurança**
   - OWASP ZAP integration
   - Dependency scanning
   
3. **Testes de Acessibilidade**
   - Cypress-axe integration
   - WCAG compliance

## 📚 Recursos Úteis

- [Cypress Documentation](https://docs.cypress.io)
- [XP Practices Guide](http://www.extremeprogramming.org)
- [TDD by Example - Kent Beck](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)
- [Continuous Delivery - Jez Humble](https://continuousdelivery.com)

## 🤝 Contribuindo

1. Sempre escreva testes antes do código
2. Faça pair programming para features complexas
3. Mantenha commits pequenos e frequentes
4. Revise código antes de fazer merge
5. Mantenha a documentação atualizada

---

**Última atualização**: Janeiro 2025
**Mantido por**: Time de Desenvolvimento destravaCV