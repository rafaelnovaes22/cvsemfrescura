# 🚂 Guia de Configuração do Railway - CV Sem Frescura

## ⚠️ **PASSO CRÍTICO: Adicionar PostgreSQL**

Seu build funcionou, mas o servidor precisa de um banco de dados PostgreSQL.

### 📋 **Passo a Passo:**

#### **1. Acessar Dashboard do Railway**
1. Acesse: https://railway.app
2. Entre no seu projeto **cvsemfrescura**

#### **2. Adicionar PostgreSQL**
1. No dashboard do projeto, clique em **"+ New"** ou **"Add Service"**
2. Selecione **"Database"**
3. Escolha **"PostgreSQL"**
4. Railway criará automaticamente:
   - ✅ Banco PostgreSQL
   - ✅ Variável `DATABASE_URL` (automática)
   - ✅ Conexão entre serviços

#### **3. Aguardar Criação (1-2 minutos)**
- Railway provisionará o banco automaticamente
- A variável `DATABASE_URL` será injetada no seu app

#### **4. Redeploy do Backend**
Após o PostgreSQL estar pronto:
1. Vá no serviço do **backend** (seu app principal)
2. Clique em **"Redeploy"** no canto superior direito
3. OU aguarde o redeploy automático (detecta mudanças)

### ✅ **Variáveis de Ambiente Necessárias:**

Além do `DATABASE_URL` (criado automaticamente), configure estas no seu serviço:

```env
# Essenciais (OBRIGATÓRIAS)
NODE_ENV=production
PORT=3000
JWT_SECRET=sua_chave_jwt_segura_aqui_256bits
OPENAI_API_KEY=sk-sua_chave_openai_aqui
STRIPE_SECRET_KEY=sk_live_sua_chave_stripe_aqui

# URLs (Railway configura automaticamente)
FRONTEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}
BACKEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}
CORS_ORIGIN=${{RAILWAY_PUBLIC_DOMAIN}}

# Email (opcional mas recomendado)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.sua_chave_sendgrid
FROM_EMAIL=noreply@cvsemfrescura.com.br

# Stripe Webhook (configurar depois)
STRIPE_PUBLISHABLE_KEY=pk_live_sua_chave
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 📊 **Verificar Se Funcionou:**

Após adicionar PostgreSQL e fazer redeploy:

1. **Checar Logs:**
   ```
   ✅ "PostgreSQL configurado para produção"
   ✅ "Banco de dados sincronizado com sucesso"
   ✅ "Servidor rodando na porta 3000"
   ```

2. **Testar Health Check:**
   ```bash
   curl https://seu-app.up.railway.app/health
   ```
   
   Resposta esperada:
   ```json
   {
     "status": "ok",
     "message": "Serviço funcionando corretamente",
     "timestamp": "2025-11-05T...",
     "version": "1.0.0",
     "environment": "production"
   }
   ```

### 🚨 **Se Ainda Der Erro:**

#### **Erro: `read ECONNRESET`**
- PostgreSQL ainda não foi criado
- Aguarde 1-2 minutos após criar o banco
- Force um redeploy do backend

#### **Erro: Variáveis de ambiente ausentes**
O health check retornará quais variáveis estão faltando:
```json
{
  "status": "error",
  "message": "Variáveis de ambiente ausentes",
  "missing": ["JWT_SECRET", "OPENAI_API_KEY", "STRIPE_SECRET_KEY"]
}
```

Configure as variáveis faltantes em:
- Railway Dashboard → Seu Serviço → **Variables**

### 💰 **Custos Railway:**

| Plano | Preço | Recursos |
|-------|-------|----------|
| **Trial** | Grátis | $5 crédito inicial |
| **Hobby** | $5/mês | Suficiente para MVP |
| **Pro** | $20/mês | Recomendado produção |

**PostgreSQL está incluso** em todos os planos! 🎉

### 🎯 **Próximos Passos Após Deploy:**

1. ✅ **Testar funcionalidades**:
   - Upload de CV
   - Análise OpenAI
   - Autenticação
   - Pagamentos Stripe

2. ✅ **Configurar Webhook Stripe**:
   - Stripe Dashboard → Webhooks
   - Endpoint: `https://seu-app.up.railway.app/api/stripe/webhook`
   - Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`

3. ✅ **Domínio Personalizado** (opcional):
   - Railway Dashboard → Settings → Domains
   - Adicionar seu domínio

---

## 📞 **Suporte:**

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Status Railway**: https://status.railway.app

---

**🚀 Seu CV Sem Frescura estará rodando em poucos minutos!** 🎊

