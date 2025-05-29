# 🔧 CONFIGURAÇÃO DO AMBIENTE DE DESENVOLVIMENTO

## 📋 **RESPOSTA: SIM, VOCÊ PRECISA CRIAR UM .env**

### **🎯 QUANDO PRECISA:**

#### **🐳 Com Docker:**
```bash
docker-compose up
# ✅ Não precisa de .env - usa variáveis do docker-compose.yml
```

#### **💻 Desenvolvimento Local:**
```bash
npm run dev
# ❌ PRECISA de .env - Node.js não consegue ler as variáveis
```

#### **🔧 Debug/Teste/IDE:**
```bash
node backend/test-something.js
# ❌ PRECISA de .env - Scripts precisam das variáveis
```

---

## 🚀 **COMO CONFIGURAR**

### **Passo 1: Criar o arquivo .env**

Copie e cole o conteúdo abaixo em um arquivo chamado `.env` na raiz do projeto:

```bash
# ==============================================
# CV SEM FRESCURA - DEVELOPMENT ENVIRONMENT
# ==============================================

# 🗄️ DATABASE CONFIGURATION
# Para desenvolvimento local (sem Docker)
DATABASE_URL=postgresql://cvuser:cvpass123@localhost:5432/cv_sem_frescura
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cv_sem_frescura
DB_USER=cvuser
DB_PASSWORD=cvpass123

# 🚀 SERVER CONFIGURATION
NODE_ENV=development
PORT=3000
BACKEND_PORT=3000
FRONTEND_PORT=8080
REDIS_PORT=6379

# 🌐 APPLICATION URLS
FRONTEND_URL=http://localhost:8080
BACKEND_URL=http://localhost:3000

# 🔐 SECURITY
# ⚠️ ALTERE ESTA CHAVE EM PRODUÇÃO!
JWT_SECRET=2f24d5f16d2d677e9b3fa7e86299fce814e4cf3fc9d75cdcd09a881a484f2e357f983996e3559f53ab646fae167388ee58883cc5e9b0539f5ffeea906bef6448

# 🤖 AI SERVICES
# ⚠️ CONFIGURE COM SUA CHAVE REAL DA OPENAI
OPENAI_API_KEY=sk-your_openai_api_key_here

# Para fallback (opcional)
ANTHROPIC_API_KEY=your_anthropic_key_here

# 💳 STRIPE CONFIGURATION (TESTE)
# ⚠️ CONFIGURE COM SUAS CHAVES REAIS DE TESTE
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# 📧 EMAIL CONFIGURATION
# SendGrid para ENVIO (emails automáticos)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=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
FROM_EMAIL=noreply@cvsemfrescura.com.br

# Zoho para RECEBIMENTO (emails de contato)
CONTACT_EMAIL=contato@cvsemfrescura.com.br
SUPPORT_EMAIL=suporte@cvsemfrescura.com.br

# 🔧 DEVELOPMENT SETTINGS
# Ativar logs detalhados em desenvolvimento
DEBUG=true
VERBOSE_LOGGING=true

# Configurações específicas para desenvolvimento
CORS_ORIGIN=http://localhost:8080
COOKIE_SECURE=false
SESSION_SECURE=false
```

### **Passo 2: Configurar Chaves Reais**

#### **🤖 OpenAI API Key:**
1. Acesse: https://platform.openai.com/api-keys
2. Crie uma nova chave
3. Substitua: `OPENAI_API_KEY=sk-sua_chave_aqui`

#### **💳 Stripe (Para pagamentos):**
1. Acesse: https://dashboard.stripe.com/test/apikeys
2. Copie as chaves de **TESTE**
3. Substitua as variáveis do Stripe

---

## 🎯 **CENÁRIOS DE USO**

### **📦 Opção 1: Apenas Docker (Recomendado)**
```bash
# Usar o Docker para tudo
docker-compose up

# ✅ Vantagens:
# - Não precisa instalar PostgreSQL local
# - Ambiente idêntico ao de produção
# - Configuração automática

# ❌ Desvantagens:
# - Mais lento para restart
# - Logs misturados
```

### **💻 Opção 2: Desenvolvimento Híbrido**
```bash
# Docker só para banco
docker-compose up postgres redis

# Node.js local para backend
cd backend && npm run dev

# ✅ Vantagens:
# - Hot reload mais rápido
# - Logs mais limpos
# - Debug mais fácil

# ❌ Desvantagens:
# - Precisa configurar .env
# - Dependências locais
```

### **🔧 Opção 3: Tudo Local**
```bash
# PostgreSQL local + Node.js local
npm run dev

# ✅ Vantagens:
# - Máximo controle
# - Debug avançado

# ❌ Desvantagens:
# - Mais configuração
# - Diferenças de ambiente
```

---

## 🚨 **COMANDOS PARA CRIAR O .env**

### **Windows:**
```cmd
# Comando direto
echo # CV SEM FRESCURA - DEVELOPMENT > .env
# Depois edite manualmente o arquivo

# Ou copie do exemplo
copy env.example .env
```

### **Linux/Mac:**
```bash
# Copie do exemplo
cp env.example .env

# Ou crie direto
cat > .env << 'EOF'
# Sua configuração aqui...
EOF
```

---

## ✅ **CHECKLIST DE CONFIGURAÇÃO**

### **Para Funcionar COM Docker:**
- [ ] `docker-compose.yml` existe ✅
- [ ] Docker instalado e rodando
- [ ] `docker-compose up` funciona

### **Para Funcionar SEM Docker:**
- [ ] Arquivo `.env` criado ✅
- [ ] PostgreSQL instalado localmente
- [ ] OpenAI API Key configurada
- [ ] `npm run dev` funciona

### **Para Debug/Teste:**
- [ ] Arquivo `.env` criado ✅
- [ ] Variáveis corretas no `.env`
- [ ] Scripts de teste rodando

---

## 🎊 **RECOMENDAÇÃO FINAL**

### **🏆 MELHOR PRÁTICA:**

1. **✅ Criar o `.env`** (sempre útil)
2. **🐳 Usar Docker** para desenvolvimento
3. **💻 Node.js local** apenas para debug
4. **🔧 .env como fallback** para testes

### **📝 Comando Resumido:**
```bash
# 1. Crie o .env (copie o conteúdo acima)
nano .env

# 2. Configure suas chaves reais
# - OpenAI API Key
# - Stripe Test Keys

# 3. Rode com Docker (recomendado)
docker-compose up

# 4. Ou rode local (para debug)
npm run dev
```

**🎯 Resultado: Ambiente flexível que funciona tanto com Docker quanto localmente!** 