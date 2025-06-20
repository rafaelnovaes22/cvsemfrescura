# Plano de Recriação do Banco de Dados CV Sem Frescura

## Fase 1: Preparação

### 1.1. Verificar configuração atual
- Configurações no arquivo `.env`
- Confirmar informações de conexão

### 1.2. Fazer backup (Opcional)
- Se houver dados importantes, exportar para CSV

## Fase 2: Remover Banco Atual

### 2.1. Desconectar todas as aplicações
- Parar servidor Node.js
- Fechar quaisquer ferramentas administrativas conectadas

### 2.2. Apagar estruturas existentes
- Criar e executar script para remover todas as tabelas
- Limpar tipos personalizados (ENUMs)

## Fase 3: Criar Nova Estrutura

### 3.1. Criar script SQL principal
- Definir todos os tipos personalizados (ENUMs)
- Criar tabelas na ordem correta de dependências:
  1. Users
  2. VerificationTokens
  3. PasswordResets
  4. AnalysisResults
  5. Transactions
  6. SequelizeMeta

### 3.2. Definir esquema de cada tabela
- **Users**:
  - id: INTEGER (PK, SERIAL)
  - name: VARCHAR(255)
  - email: VARCHAR(255) UNIQUE
  - password: VARCHAR(255)
  - email_verified: BOOLEAN
  - onboarding_completed: BOOLEAN
  - job_area: VARCHAR(255)
  - experience_level: VARCHAR(255)
  - preferences: JSONB
  - credits: INTEGER
  - stripeCustomerId: VARCHAR(255)
  - createdAt/updatedAt: TIMESTAMP

- **VerificationTokens**:
  - id: UUID (PK)
  - userId: INTEGER (FK → Users.id)
  - token: VARCHAR(255)
  - type: VARCHAR(50)
  - expiresAt: TIMESTAMP
  - createdAt/updatedAt: TIMESTAMP

- **PasswordResets**:
  - id: UUID (PK)
  - userId: INTEGER (FK → Users.id)
  - token: VARCHAR(255)
  - expiresAt: TIMESTAMP
  - createdAt/updatedAt: TIMESTAMP

- **AnalysisResults**:
  - id: UUID (PK)
  - userId: INTEGER (FK → Users.id)
  - resumeFileName: VARCHAR(255)
  - resumeContent: TEXT
  - jobUrls: JSONB
  - result: JSONB
  - createdAt/updatedAt: TIMESTAMP

- **Transactions**:
  - id: UUID (PK)
  - userId: INTEGER (FK → Users.id)
  - amount: FLOAT
  - credits: INTEGER
  - status: ENUM('pending', 'completed', 'failed', 'refunded')
  - paymentMethod: VARCHAR(255)
  - paymentIntentId: VARCHAR(255)
  - stripeCustomerId: VARCHAR(255)
  - metadata: JSONB
  - createdAt/updatedAt: TIMESTAMP

### 3.3. Criar índices
- Índices para campos frequentemente consultados
- Índices para chaves estrangeiras

### 3.4. Configurar SequelizeMeta
- Inserir registro para migrações já aplicadas

## Fase 4: Verificar Modelos Sequelize

### 4.1. Verificar alinhamento
- Confirmar que todos os modelos Sequelize correspondem às tabelas criadas
- Verificar tipos de dados em cada modelo

### 4.2. Testar sincronização
- Executar sincronização sem forçar alterações (sync({ force: false }))
- Verificar logs de erros

## Fase 5: Testes de Integração

### 5.1. Testar registro e autenticação
- Criar usuário de teste
- Verificar processo de login

### 5.2. Testar sistema de pagamento
- Verificar integração com Stripe
- Testar compra de créditos

### 5.3. Testar funcionalidade principal
- Upload e análise de currículo
- Verificar decremento de créditos
