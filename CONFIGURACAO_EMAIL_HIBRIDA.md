# 📧 Configuração Email Híbrida - CV Sem Frescura

## 🎯 **ESTRATÉGIA: SendGrid + Zoho**

- **📤 ENVIO**: SendGrid (emails automáticos do sistema)
- **📥 RECEBIMENTO**: Zoho Mail (emails de contato e suporte)

---

## 🚀 **PARTE 1: CONFIGURAÇÃO SENDGRID (ENVIO)**

### **1.1 Configurar SendGrid**

#### **A. Criar Conta SendGrid**
1. Acesse: https://sendgrid.com
2. Crie conta gratuita (100 emails/dia)
3. Verifique seu email

#### **B. Gerar API Key**
1. No painel SendGrid: **Settings** → **API Keys**
2. Clique em **Create API Key**
3. Nome: "CV Sem Frescura - Production"
4. Permissões: **Restricted Access**
5. Marque: **Mail Send** → **Full Access**
6. Clique **Create & View**
7. **COPIE A API KEY** (aparece só uma vez!)

#### **C. Verificar Domínio (Opcional mas Recomendado)**
1. **Settings** → **Sender Authentication**
2. **Authenticate Your Domain**
3. Adicione seu domínio: `cvsemfrescura.com.br`
4. Configure DNS conforme instruções

### **1.2 Variáveis de Ambiente SendGrid**

```env
# SendGrid Configuration (ENVIO)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.sua_api_key_sendgrid_aqui
FROM_EMAIL=noreply@cvsemfrescura.com.br
```

---

## 📬 **PARTE 2: CONFIGURAÇÃO ZOHO (RECEBIMENTO)**

### **2.1 Configurar Zoho Mail**

#### **A. Criar Conta Zoho**
1. Acesse: https://www.zoho.com/mail/
2. Plano gratuito: até 5 usuários
3. Adicione seu domínio: `cvsemfrescura.com.br`

#### **B. Configurar DNS no seu Provedor**
Adicione estes registros DNS:

```dns
# MX Records (Zoho)
MX    @    mx.zoho.com.    10
MX    @    mx2.zoho.com.   20
MX    @    mx3.zoho.com.   50

# TXT Record (Verificação)
TXT   @    zoho-verification=zb12345678.zmverify.zoho.com

# CNAME Records (Zoho)
CNAME mail    business.zoho.com
CNAME imap    business.zoho.com
CNAME smtp    business.zoho.com
CNAME pop     business.zoho.com
```

#### **C. Criar Email de Contato**
1. No painel Zoho: **Users** → **Add User**
2. Email: `contato@cvsemfrescura.com.br`
3. Configure senha forte
4. Ative o usuário

### **2.2 Configurar Redirecionamentos**

#### **A. Emails que devem ir para Zoho:**
- `contato@cvsemfrescura.com.br` ✅
- `suporte@cvsemfrescura.com.br` ✅
- `admin@cvsemfrescura.com.br` ✅

#### **B. Emails que saem pelo SendGrid:**
- `noreply@cvsemfrescura.com.br` (reset de senha)
- `sistema@cvsemfrescura.com.br` (notificações)

---

## ⚙️ **PARTE 3: CONFIGURAÇÃO NO PROJETO**

### **3.1 Atualizar Variáveis de Ambiente**

#### **Para Railway:**
```env
# Email Configuration - HÍBRIDA
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.sua_api_key_sendgrid_real_aqui
FROM_EMAIL=noreply@cvsemfrescura.com.br

# Email de Contato (Zoho)
CONTACT_EMAIL=contato@cvsemfrescura.com.br
SUPPORT_EMAIL=suporte@cvsemfrescura.com.br
```

#### **Para Docker Compose:**
```yaml
backend:
  environment:
    # SendGrid (Envio)
    - SMTP_HOST=smtp.sendgrid.net
    - SMTP_PORT=587
    - SMTP_USER=apikey
    - SMTP_PASS=${SENDGRID_API_KEY}
    - FROM_EMAIL=noreply@cvsemfrescura.com.br
    
    # Zoho (Recebimento)
    - CONTACT_EMAIL=contato@cvsemfrescura.com.br
    - SUPPORT_EMAIL=suporte@cvsemfrescura.com.br
```

### **3.2 Atualizar Código (Já Está Correto!)**

O código atual já está perfeito para esta configuração:

```javascript
// ✅ Emails de SISTEMA (SendGrid)
// - Reset de senha
// - Confirmação de alteração
// FROM: noreply@cvsemfrescura.com.br

// ✅ Emails de CONTATO (para Zoho)
// - Formulário de contato
// TO: contato@cvsemfrescura.com.br
```

---

## 🧪 **PARTE 4: TESTES**

### **4.1 Testar SendGrid (Envio)**

```bash
# Teste reset de senha
curl -X POST https://seu-app.up.railway.app/api/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"seu-email@gmail.com"}'

# Verificar logs
railway logs | grep "Email de reset"
```

### **4.2 Testar Zoho (Recebimento)**

```bash
# Teste formulário de contato
curl -X POST https://seu-app.up.railway.app/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste",
    "email": "teste@gmail.com",
    "subject": "suporte",
    "message": "Teste de recebimento no Zoho"
  }'

# Verificar se chegou em contato@cvsemfrescura.com.br
```

---

## 📊 **PARTE 5: MONITORAMENTO**

### **5.1 SendGrid Dashboard**
- **Activity**: Ver emails enviados
- **Statistics**: Taxa de entrega
- **Suppressions**: Emails bloqueados

### **5.2 Zoho Mail**
- **Admin Console**: Gerenciar usuários
- **Reports**: Estatísticas de email
- **Security**: Logs de acesso

---

## 🔧 **PARTE 6: CONFIGURAÇÃO AVANÇADA**

### **6.1 SPF Record (Segurança)**
```dns
TXT   @   "v=spf1 include:sendgrid.net include:zoho.com ~all"
```

### **6.2 DKIM (SendGrid)**
1. SendGrid: **Settings** → **Sender Authentication**
2. **Authenticate Your Domain**
3. Adicione registros CNAME conforme instruído

### **6.3 DMARC (Opcional)**
```dns
TXT   _dmarc   "v=DMARC1; p=quarantine; rua=mailto:admin@cvsemfrescura.com.br"
```

---

## ✅ **CHECKLIST COMPLETO**

### **SendGrid (Envio)**
- [ ] ✅ Conta SendGrid criada
- [ ] ✅ API Key gerada
- [ ] ✅ Domínio verificado (opcional)
- [ ] ✅ Variáveis configuradas no Railway
- [ ] ✅ Teste de reset de senha funcionando

### **Zoho (Recebimento)**
- [ ] ✅ Conta Zoho criada
- [ ] ✅ Domínio adicionado
- [ ] ✅ DNS configurado (MX, TXT, CNAME)
- [ ] ✅ Email contato@cvsemfrescura.com.br criado
- [ ] ✅ Teste de formulário funcionando

### **Integração**
- [ ] ✅ SPF record configurado
- [ ] ✅ DKIM configurado (SendGrid)
- [ ] ✅ Emails chegando no Zoho
- [ ] ✅ Emails saindo pelo SendGrid

---

## 🚨 **TROUBLESHOOTING**

### **Problema: Emails não chegam no Zoho**
**Solução:**
1. Verificar registros MX no DNS
2. Aguardar propagação DNS (até 48h)
3. Testar com ferramenta: https://mxtoolbox.com

### **Problema: SendGrid não envia**
**Solução:**
1. Verificar API Key
2. Confirmar domínio verificado
3. Checar Activity no painel SendGrid

### **Problema: Emails vão para spam**
**Solução:**
1. Configurar SPF + DKIM
2. Verificar domínio no SendGrid
3. Usar FROM_EMAIL com domínio próprio

---

## 💰 **CUSTOS**

### **SendGrid**
- **Gratuito**: 100 emails/dia
- **Essentials**: $14.95/mês (40.000 emails)

### **Zoho Mail**
- **Gratuito**: 5 usuários, 5GB/usuário
- **Mail Lite**: $1/usuário/mês

### **Total Estimado**
- **Início**: $0/mês (planos gratuitos)
- **Crescimento**: ~$15-20/mês

---

## 🎯 **RESULTADO FINAL**

✅ **Sistema Híbrido Funcionando:**
- 📤 **Envios automáticos**: SendGrid (confiável, rápido)
- 📥 **Recebimento profissional**: Zoho (interface completa)
- 🔒 **Segurança**: SPF + DKIM configurados
- 📊 **Monitoramento**: Dashboards separados
- 💰 **Custo baixo**: Planos gratuitos iniciais

**🚀 Agora você tem o melhor dos dois mundos!** 