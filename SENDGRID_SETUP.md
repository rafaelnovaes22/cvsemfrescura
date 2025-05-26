# 📧 Configuração SendGrid - CV Sem Frescura

## 🔑 Configuração da API Key

### 1. Obter API Key do SendGrid
1. Acesse: https://app.sendgrid.com
2. Vá em **Settings** → **API Keys**
3. Clique em **Create API Key**
4. Escolha **Restricted Access**
5. Nome: "CV Sem Frescura - Password Reset"
6. Permissões: **Mail Send** → **Full Access**
7. Clique em **Create & View**
8. **COPIE a API Key** (aparece só uma vez!)

### 2. Configurar Variáveis de Ambiente

Crie/edite o arquivo `.env` no backend com:

```env
# ===========================================
# SENDGRID CONFIGURATION
# ===========================================
NODE_ENV=production
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.sua-api-key-real-aqui
FROM_EMAIL=noreply@seudominio.com.br
FRONTEND_URL=https://seudominio.com.br

# ===========================================
# OUTRAS CONFIGURAÇÕES
# ===========================================
DATABASE_URL=postgresql://cvuser:cvpass123@localhost:5432/cv_sem_frescura
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
LOG_LEVEL=info
```

## 🧪 Testando a Configuração

### 1. Teste Local com SendGrid

```bash
# 1. Definir variáveis temporariamente
export SMTP_HOST=smtp.sendgrid.net
export SMTP_PORT=587
export SMTP_USER=apikey
export SMTP_PASS=SG.sua-api-key-real
export FROM_EMAIL=noreply@seudominio.com.br
export FRONTEND_URL=http://localhost:8080

# 2. Reiniciar o backend
docker-compose restart backend

# 3. Testar envio
curl -X POST http://localhost:3001/api/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"seu-email-real@gmail.com"}'
```

### 2. Verificar Logs

```bash
# Ver se o email foi enviado
docker logs cv_backend --tail 20

# Procurar por erros
docker logs cv_backend | grep -i error
```

### 3. Verificar no SendGrid

1. Acesse **Activity** no painel do SendGrid
2. Veja se o email aparece como "Delivered"
3. Verifique sua caixa de entrada

## 🔧 Configuração no Docker

### docker-compose.yml (Produção)

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - SMTP_HOST=smtp.sendgrid.net
      - SMTP_PORT=587
      - SMTP_USER=apikey
      - SMTP_PASS=${SENDGRID_API_KEY}
      - FROM_EMAIL=${FROM_EMAIL}
      - FRONTEND_URL=${FRONTEND_URL}
    ports:
      - "3000:3000"
```

### Arquivo .env para Docker

```env
SENDGRID_API_KEY=SG.sua-api-key-real-aqui
FROM_EMAIL=noreply@seudominio.com.br
FRONTEND_URL=https://seudominio.com.br
```

## 🛡️ Segurança

### ⚠️ IMPORTANTE - Proteção da API Key

1. **NUNCA** commite a API Key no Git
2. Use variáveis de ambiente
3. Adicione `.env` no `.gitignore`
4. Use secrets no servidor de produção

### Exemplo .gitignore

```gitignore
# Environment variables
.env
.env.local
.env.production
.env.sendgrid

# SendGrid
sendgrid.env
```

## 📊 Monitoramento SendGrid

### Dashboard SendGrid
- **Activity**: Ver emails enviados
- **Statistics**: Métricas de entrega
- **Suppressions**: Emails bloqueados
- **Alerts**: Configurar alertas

### Logs Importantes
```bash
# Ver tentativas de envio
docker logs cv_backend | grep "Email de reset"

# Ver erros de SMTP
docker logs cv_backend | grep "SMTP"

# Ver tokens gerados
docker logs cv_backend | grep "Token:"
```

## 🚀 Deploy em Produção

### 1. Servidor Linux
```bash
# Definir variáveis no servidor
export SMTP_HOST=smtp.sendgrid.net
export SMTP_USER=apikey
export SMTP_PASS=SG.sua-api-key-real
export FROM_EMAIL=noreply@seudominio.com.br

# Reiniciar serviço
systemctl restart cv-backend
```

### 2. Heroku
```bash
heroku config:set SMTP_HOST=smtp.sendgrid.net
heroku config:set SMTP_USER=apikey
heroku config:set SMTP_PASS=SG.sua-api-key-real
heroku config:set FROM_EMAIL=noreply@seudominio.com.br
```

### 3. AWS/DigitalOcean
Use secrets manager ou variáveis de ambiente seguras.

## ✅ Checklist SendGrid

- [ ] Conta SendGrid criada
- [ ] API Key gerada com permissão Mail Send
- [ ] Variáveis de ambiente configuradas
- [ ] FROM_EMAIL com domínio verificado
- [ ] Teste local realizado
- [ ] Email recebido na caixa de entrada
- [ ] Logs verificados sem erros
- [ ] Deploy em produção configurado

## 🔍 Troubleshooting

### Erro: "Authentication failed"
- Verifique se a API Key está correta
- Confirme que SMTP_USER=apikey (literal)
- Verifique se a API Key tem permissão Mail Send

### Erro: "From email not verified"
- Verifique o domínio no SendGrid
- Configure SPF/DKIM records
- Use email verificado temporariamente

### Email não chega
- Verifique spam/lixo eletrônico
- Veja Activity no painel SendGrid
- Confirme se o email de destino existe

## 📞 Suporte

- **SendGrid Docs**: https://docs.sendgrid.com
- **Status Page**: https://status.sendgrid.com
- **Support**: Através do painel SendGrid

---

**🎯 Próximo Passo**: Configure sua API Key real e teste o envio! 