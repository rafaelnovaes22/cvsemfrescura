# 🚀 Configuração para Produção - CV Sem Frescura

## 📧 Sistema de Email - Configuração Obrigatória

Para que o sistema de recuperação de senha funcione em produção, você **DEVE** configurar um provedor de email SMTP.

### 🔧 Variáveis de Ambiente Obrigatórias

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
FROM_EMAIL=noreply@seudominio.com.br
FRONTEND_URL=https://seudominio.com.br
```

## 📮 Provedores de Email Recomendados

### 1. Gmail (Mais Simples)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app-do-gmail
```

**Como configurar:**
1. Ative a verificação em 2 etapas na sua conta Google
2. Gere uma "Senha de app" em: https://myaccount.google.com/apppasswords
3. Use essa senha de app no `SMTP_PASS`

### 2. SendGrid (Profissional)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.sua-api-key-aqui
```

**Como configurar:**
1. Crie conta em: https://sendgrid.com
2. Gere uma API Key
3. Use "apikey" como usuário e a API Key como senha

### 3. Mailgun (Alternativa)
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.seudominio.com
SMTP_PASS=sua-senha-do-mailgun
```

### 4. AWS SES (Escalável)
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=sua-access-key-id
SMTP_PASS=sua-secret-access-key
```

## 🔐 Arquivo .env Completo para Produção

Crie um arquivo `.env` na raiz do projeto backend:

```env
# ===========================================
# AMBIENTE
# ===========================================
NODE_ENV=production

# ===========================================
# BANCO DE DADOS
# ===========================================
DATABASE_URL=postgresql://cvuser:cvpass123@localhost:5432/cv_sem_frescura
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cv_sem_frescura
DB_USER=cvuser
DB_PASS=cvpass123

# ===========================================
# SEGURANÇA
# ===========================================
JWT_SECRET=seu_jwt_secret_super_seguro_com_pelo_menos_32_caracteres_aqui

# ===========================================
# URLs
# ===========================================
FRONTEND_URL=https://seudominio.com.br
BACKEND_URL=https://api.seudominio.com.br

# ===========================================
# EMAIL (OBRIGATÓRIO PARA RECUPERAÇÃO DE SENHA)
# ===========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app-do-gmail
FROM_EMAIL=noreply@seudominio.com.br

# ===========================================
# LOGS
# ===========================================
LOG_LEVEL=info
```

## 🧪 Testando a Configuração

### 1. Teste Local
```bash
# No backend
npm install
npm start

# Teste o endpoint
curl -X POST http://localhost:3000/api/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"seu-email@teste.com"}'
```

### 2. Verificar Logs
```bash
# Verificar se o email foi enviado
docker logs cv_backend --tail 20
```

### 3. Teste de Produção
```bash
# Teste no servidor de produção
curl -X POST https://api.seudominio.com.br/api/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"email-existente@teste.com"}'
```

## 🔍 Troubleshooting

### Problema: "Email não está sendo enviado"
**Solução:**
1. Verifique se as variáveis SMTP estão definidas
2. Teste as credenciais SMTP
3. Verifique os logs do container

### Problema: "Authentication failed"
**Solução:**
1. Gmail: Use senha de app, não a senha normal
2. SendGrid: Certifique-se que a API Key está correta
3. Verifique se o usuário/senha estão corretos

### Problema: "Connection timeout"
**Solução:**
1. Verifique se a porta 587 está aberta
2. Teste com porta 465 (SSL) se necessário
3. Verifique firewall do servidor

## 📊 Monitoramento

### Logs Importantes
```bash
# Ver logs de email
docker logs cv_backend | grep "Email"

# Ver erros de email
docker logs cv_backend | grep "Erro ao enviar email"

# Ver tentativas de reset
docker logs cv_backend | grep "password-reset"
```

### Métricas para Acompanhar
- Taxa de entrega de emails
- Tempo de resposta do SMTP
- Número de tentativas de reset por dia
- Emails que falharam

## 🛡️ Segurança em Produção

### 1. Rate Limiting
O sistema já inclui rate limiting para:
- 100 requests por IP por 15 minutos (geral)
- Proteção específica para endpoints de reset

### 2. Validações
- Email obrigatório
- Token único e temporário (1 hora)
- Uso único por token
- Limpeza automática de tokens expirados

### 3. Logs de Segurança
- Todas as tentativas são logadas
- IPs são registrados
- Timestamps para auditoria

## 🚀 Deploy

### 1. Docker Compose (Recomendado)
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - FROM_EMAIL=${FROM_EMAIL}
      - FRONTEND_URL=${FRONTEND_URL}
    ports:
      - "3000:3000"
```

### 2. Variáveis no Servidor
```bash
# Definir variáveis no servidor
export SMTP_HOST=smtp.gmail.com
export SMTP_USER=seu-email@gmail.com
export SMTP_PASS=sua-senha-de-app
export FROM_EMAIL=noreply@seudominio.com.br
export FRONTEND_URL=https://seudominio.com.br
```

### 3. Verificação Pós-Deploy
```bash
# 1. Verificar se o serviço está rodando
curl https://api.seudominio.com.br/health

# 2. Testar recuperação de senha
curl -X POST https://api.seudominio.com.br/api/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"email-teste@seudominio.com"}'

# 3. Verificar logs
docker logs cv_backend --tail 50
```

## ✅ Checklist de Produção

- [ ] Variáveis SMTP configuradas
- [ ] Provedor de email testado
- [ ] FROM_EMAIL configurado com domínio próprio
- [ ] FRONTEND_URL apontando para domínio correto
- [ ] SSL/TLS configurado no servidor
- [ ] Rate limiting ativo
- [ ] Logs funcionando
- [ ] Backup do banco configurado
- [ ] Monitoramento ativo

## 🆘 Suporte

Se encontrar problemas:

1. **Verifique os logs primeiro**
2. **Teste as credenciais SMTP manualmente**
3. **Confirme que todas as variáveis estão definidas**
4. **Teste em ambiente local primeiro**

---

**⚠️ IMPORTANTE:** Sem a configuração SMTP, o sistema funcionará em modo de desenvolvimento (apenas logs), mas os emails não serão enviados aos usuários! 