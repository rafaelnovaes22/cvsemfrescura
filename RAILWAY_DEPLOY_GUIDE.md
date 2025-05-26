# 🚀 Guia de Deploy no Railway - CV Sem Frescura

## ⚡ **DEPLOY EM 5 MINUTOS**

### **1. Preparar Repositório Git**
```bash
# Adicionar todos os arquivos
git add .
git commit -m "🚀 Preparado para deploy no Railway"
git push origin main
```

### **2. Configurar no Railway**

#### **A. Criar Novo Projeto**
1. Acesse [railway.app](https://railway.app)
2. Clique em "New Project"
3. Selecione "Deploy from GitHub repo"
4. Escolha o repositório `cv-sem-frescura`

#### **B. Adicionar PostgreSQL**
1. No dashboard do projeto, clique em "New Service"
2. Selecione "Database" → "PostgreSQL"
3. Railway irá configurar automaticamente

#### **C. Configurar Variáveis de Ambiente**
No dashboard do Railway, vá em "Variables" e adicione:

```env
# Copie do arquivo railway.env.example
NODE_ENV=production
PORT=3000

# JWT Configuration
JWT_SECRET=cv_sem_frescura_jwt_secret_2024_production_railway_secure_key_256bits
JWT_EXPIRY=7d

# Stripe Configuration - SUAS CHAVES REAIS
STRIPE_SECRET_KEY=sk_live_SUA_CHAVE_STRIPE_AQUI
STRIPE_PUBLISHABLE_KEY=pk_live_SUA_CHAVE_STRIPE_AQUI
STRIPE_WEBHOOK_SECRET=whsec_SUA_CHAVE_WEBHOOK_AQUI

# OpenAI Configuration - SUA CHAVE REAL
OPENAI_API_KEY=sk-SUA_CHAVE_OPENAI_AQUI

# URLs (Railway configura automaticamente)
FRONTEND_URL=${{RAILWAY_STATIC_URL}}
BACKEND_URL=${{RAILWAY_STATIC_URL}}
CORS_ORIGIN=${{RAILWAY_STATIC_URL}}

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration - HÍBRIDA (SendGrid + Zoho)
# SendGrid para ENVIO (emails automáticos)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.SUA_CHAVE_SENDGRID_AQUI
FROM_EMAIL=noreply@cvsemfrescura.com.br

# Zoho para RECEBIMENTO (emails de contato)
CONTACT_EMAIL=contato@cvsemfrescura.com.br
SUPPORT_EMAIL=suporte@cvsemfrescura.com.br
```

### **3. Deploy Automático**
- Railway detectará o `railway.json` e `Dockerfile.railway`
- O deploy iniciará automaticamente
- Aguarde 3-5 minutos para conclusão

### **4. Verificar Deploy**
```bash
# Testar health check
curl https://seu-app.up.railway.app/health

# Testar frontend (landing page)
curl https://seu-app.up.railway.app/
curl https://seu-app.up.railway.app/landing.html
```

---

## 🔧 **CONFIGURAÇÕES AVANÇADAS**

### **Custom Domain (Opcional)**
1. No Railway dashboard, vá em "Settings"
2. Clique em "Domains"
3. Adicione seu domínio personalizado
4. Configure DNS conforme instruções

### **Webhook Stripe**
1. No Stripe Dashboard, vá em "Webhooks"
2. Adicione endpoint: `https://seu-app.up.railway.app/api/stripe/webhook`
3. Selecione eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copie o webhook secret para as variáveis do Railway

---

## 📊 **MONITORAMENTO**

### **Logs do Railway**
```bash
# Ver logs em tempo real
railway logs --follow

# Ver logs específicos
railway logs --service=cv-sem-frescura
```

### **Health Checks**
- **Endpoint**: `https://seu-app.up.railway.app/health`
- **Status esperado**: `200 OK`
- **Resposta**: `{"status": "ok", "message": "Serviço funcionando corretamente"}`

### **Métricas**
- Railway fornece métricas automáticas de CPU, RAM e rede
- Acesse no dashboard em "Metrics"

---

## 🚨 **TROUBLESHOOTING**

### **Deploy Falha**
```bash
# Ver logs de build
railway logs --deployment

# Verificar variáveis
railway variables

# Redeploy manual
railway up
```

### **Aplicação não responde**
1. Verificar logs: `railway logs`
2. Verificar variáveis de ambiente
3. Testar health check: `/health`
4. Verificar se PostgreSQL está conectado

### **Erro 500**
1. Verificar logs de erro
2. Confirmar todas as variáveis configuradas
3. Testar conexão com banco
4. Verificar chaves API (OpenAI, Stripe)

---

## 💰 **CUSTOS ESTIMADOS**

### **Railway Pricing**
- **Hobby Plan**: $5/mês (suficiente para MVP)
- **Pro Plan**: $20/mês (recomendado para produção)

### **Recursos Inclusos**
- **CPU**: 1 vCPU
- **RAM**: 512MB - 1GB
- **Storage**: 1GB
- **Bandwidth**: 100GB/mês
- **PostgreSQL**: Incluído

---

## ✅ **CHECKLIST PÓS-DEPLOY**

### **Imediato (5 min)**
- [ ] ✅ Aplicação acessível
- [ ] ✅ Health check respondendo
- [ ] ✅ Frontend carregando
- [ ] ✅ Banco conectado

### **Funcionalidades (15 min)**
- [ ] ✅ Upload de CV funcionando
- [ ] ✅ Análise OpenAI funcionando
- [ ] ✅ Pagamentos Stripe funcionando
- [ ] ✅ Autenticação funcionando
- [ ] ✅ Recuperação de senha funcionando

### **Configurações (30 min)**
- [ ] ✅ Webhook Stripe configurado
- [ ] ✅ Domínio personalizado (opcional)
- [ ] ✅ Monitoramento ativo
- [ ] ✅ Backup configurado

---

## 🎯 **PRÓXIMOS PASSOS**

### **Semana 1**
- [ ] Monitorar performance
- [ ] Configurar alertas
- [ ] Otimizar queries
- [ ] Implementar cache

### **Semana 2**
- [ ] Adicionar testes automatizados
- [ ] Configurar CI/CD
- [ ] Implementar métricas de negócio
- [ ] Documentar APIs

---

## 📞 **SUPORTE**

### **Railway**
- **Docs**: https://docs.railway.app
- **Discord**: https://discord.gg/railway
- **Status**: https://status.railway.app

### **Projeto**
- **Health Check**: `/health`
- **Logs**: `railway logs`
- **Métricas**: Railway Dashboard

---

**🚀 RESULTADO: CV Sem Frescura funcionando em produção no Railway!** 🎯 