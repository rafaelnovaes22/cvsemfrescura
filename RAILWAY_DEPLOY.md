# 🚀 Deploy Seguro no Railway

## ⚠️ ATENÇÃO: CHAVES API FORAM COMPROMETIDAS

As chaves API estavam expostas no git. Siga estes passos **NA ORDEM**:

## 1. 🔒 REGENERAR TODAS AS CHAVES (OBRIGATÓRIO)

### OpenAI
1. Acesse: https://platform.openai.com/api-keys
2. Revogue a chave antiga
3. Gere uma nova chave
4. Salve em local seguro

### Claude/Anthropic
1. Acesse: https://console.anthropic.com
2. Revogue a chave antiga
3. Gere uma nova chave
4. Salve em local seguro

### SendGrid
1. Acesse: https://app.sendgrid.com/settings/api_keys
2. Revogue a chave antiga
3. Gere uma nova chave com permissões de "Mail Send"
4. Salve em local seguro

### Stripe
1. Acesse: https://dashboard.stripe.com/test/apikeys (para teste) ou live (para produção)
2. Revogue as chaves antigas
3. Gere novas chaves (secret, publishable e webhook)
4. Salve em local seguro

## 2. 🛠️ CONFIGURAR RAILWAY

### Criar Projeto
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Criar projeto
railway create cv-sem-frescura
```

### Adicionar PostgreSQL
```bash
# Adicionar banco PostgreSQL
railway add postgres
```

### Configurar Variáveis de Ambiente
No painel do Railway ou via CLI:

```bash
# Copie as variáveis do arquivo railway.env.template
# e substitua pelos valores reais das chaves regeneradas

railway variables set OPENAI_API_KEY=sk-proj-SUA_NOVA_CHAVE_AQUI
railway variables set CLAUDE_API_KEY=sk-ant-api03-SUA_NOVA_CHAVE_AQUI
railway variables set JWT_SECRET=sua_jwt_secret_muito_longa_aqui
railway variables set STRIPE_SECRET_KEY=sk_live_SUA_CHAVE_AQUI
railway variables set SMTP_PASS=SG.SUA_NOVA_CHAVE_SENDGRID_AQUI
railway variables set NODE_ENV=production
railway variables set FROM_EMAIL=contato@cvsemfrescura.com.br
```

## 3. 📁 ESTRUTURA DE DEPLOY

O Railway irá detectar automaticamente:
- `package.json` no backend
- Script de build e start
- Porta via variável PORT

## 4. 🚀 FAZER DEPLOY

```bash
# Conectar ao projeto
railway link

# Deploy
railway up
```

## 5. ✅ VERIFICAÇÕES PÓS-DEPLOY

1. Testar endpoints de saúde: `/health`
2. Verificar logs: `railway logs`
3. Testar geração de CV
4. Verificar envio de emails

## 6. 🔒 SEGURANÇA CONTÍNUA

- ✅ Arquivos .env removidos do git
- ✅ .gitignore protegendo variáveis
- ✅ Chaves regeneradas
- ✅ Deploy sem exposição de chaves

## 7. 📝 MONITORAMENTO

```bash
# Ver logs em tempo real
railway logs --follow

# Status dos serviços
railway status
```

## 🆘 PROBLEMAS COMUNS

### Erro de Database
```bash
# Verificar URL do banco
railway variables get DATABASE_URL
```

### Erro de API Keys
```bash
# Verificar se variáveis estão configuradas
railway variables
```

### Erro de Build
```bash
# Ver logs detalhados
railway logs
```

---

**IMPORTANTE**: Nunca mais commite arquivos `.env` com chaves reais! Use sempre variáveis de ambiente do Railway. 