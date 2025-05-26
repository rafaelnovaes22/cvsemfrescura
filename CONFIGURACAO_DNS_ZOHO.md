# 🌐 Configuração DNS para Zoho Mail - CV Sem Frescura

## 🎯 **OBJETIVO**
Configurar DNS para receber emails no Zoho Mail (`contato@cvsemfrescura.com.br`)

---

## 📋 **REGISTROS DNS NECESSÁRIOS**

### **1. MX Records (Obrigatórios)**
```dns
Tipo: MX
Nome: @
Valor: mx.zoho.com.
Prioridade: 10

Tipo: MX
Nome: @
Valor: mx2.zoho.com.
Prioridade: 20

Tipo: MX
Nome: @
Valor: mx3.zoho.com.
Prioridade: 50
```

### **2. TXT Record (Verificação)**
```dns
Tipo: TXT
Nome: @
Valor: zoho-verification=zb12345678.zmverify.zoho.com
```
> ⚠️ **Importante**: O valor real será fornecido pelo Zoho durante a configuração

### **3. CNAME Records (Opcionais mas Recomendados)**
```dns
Tipo: CNAME
Nome: mail
Valor: business.zoho.com

Tipo: CNAME
Nome: imap
Valor: business.zoho.com

Tipo: CNAME
Nome: smtp
Valor: business.zoho.com

Tipo: CNAME
Nome: pop
Valor: business.zoho.com
```

### **4. SPF Record (Segurança)**
```dns
Tipo: TXT
Nome: @
Valor: v=spf1 include:sendgrid.net include:zoho.com ~all
```

---

## 🔧 **CONFIGURAÇÃO POR PROVEDOR**

### **Cloudflare**
1. Acesse o painel Cloudflare
2. Selecione seu domínio `cvsemfrescura.com.br`
3. Vá em **DNS** → **Records**
4. Adicione os registros acima

### **GoDaddy**
1. Acesse **My Products** → **DNS**
2. Clique em **Manage** no seu domínio
3. Adicione os registros na seção **Records**

### **Registro.br**
1. Acesse o painel do Registro.br
2. Vá em **DNS** → **Zona DNS**
3. Adicione os registros necessários

### **Hostinger**
1. Acesse **Hosting** → **Manage**
2. Vá em **DNS Zone**
3. Adicione os registros

---

## ✅ **PASSO A PASSO COMPLETO**

### **1. Configurar Zoho Mail**
1. Acesse: https://www.zoho.com/mail/
2. Clique em **Get Started Free**
3. Adicione seu domínio: `cvsemfrescura.com.br`
4. Escolha plano gratuito (5 usuários)

### **2. Verificar Domínio**
1. Zoho fornecerá um código de verificação
2. Adicione como TXT record no DNS
3. Aguarde verificação (até 24h)

### **3. Configurar MX Records**
1. Adicione os 3 MX records listados acima
2. Remova MX records antigos (se houver)
3. Aguarde propagação (até 48h)

### **4. Criar Usuários**
1. No painel Zoho: **Users** → **Add User**
2. Crie: `contato@cvsemfrescura.com.br`
3. Crie: `suporte@cvsemfrescura.com.br`
4. Configure senhas fortes

### **5. Testar Configuração**
```bash
# Testar MX records
nslookup -type=mx cvsemfrescura.com.br

# Testar com ferramenta online
# https://mxtoolbox.com/mx/cvsemfrescura.com.br
```

---

## 🧪 **TESTES**

### **1. Teste de Envio (SendGrid)**
```bash
curl -X POST https://seu-app.up.railway.app/api/password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"seu-email@gmail.com"}'
```

### **2. Teste de Recebimento (Zoho)**
```bash
curl -X POST https://seu-app.up.railway.app/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste DNS",
    "email": "teste@gmail.com",
    "subject": "suporte",
    "message": "Testando recebimento no Zoho"
  }'
```

### **3. Verificar Recebimento**
1. Acesse: https://mail.zoho.com
2. Login: `contato@cvsemfrescura.com.br`
3. Verifique se o email chegou

---

## 🚨 **TROUBLESHOOTING**

### **Problema: MX records não funcionam**
**Soluções:**
1. Aguardar propagação DNS (até 48h)
2. Verificar se removeu MX records antigos
3. Testar com: `nslookup -type=mx cvsemfrescura.com.br`

### **Problema: Verificação falha**
**Soluções:**
1. Verificar TXT record de verificação
2. Aguardar até 24h para propagação
3. Tentar verificação novamente no Zoho

### **Problema: Emails não chegam**
**Soluções:**
1. Verificar se MX records estão corretos
2. Testar com ferramenta: https://mxtoolbox.com
3. Verificar spam/lixo eletrônico

---

## 📊 **FERRAMENTAS DE VERIFICAÇÃO**

### **Online**
- **MX Toolbox**: https://mxtoolbox.com
- **DNS Checker**: https://dnschecker.org
- **Zoho Mail Tester**: https://www.zoho.com/mail/help/mx-record-test.html

### **Linha de Comando**
```bash
# Verificar MX records
nslookup -type=mx cvsemfrescura.com.br

# Verificar TXT records
nslookup -type=txt cvsemfrescura.com.br

# Verificar propagação
dig mx cvsemfrescura.com.br
```

---

## ⏱️ **CRONOGRAMA**

### **Dia 1**
- [ ] Criar conta Zoho
- [ ] Adicionar domínio
- [ ] Configurar TXT de verificação
- [ ] Aguardar verificação

### **Dia 2-3**
- [ ] Adicionar MX records
- [ ] Configurar SPF record
- [ ] Aguardar propagação DNS

### **Dia 3-4**
- [ ] Criar usuários de email
- [ ] Testar envio/recebimento
- [ ] Configurar aliases (opcional)

---

## 🎯 **RESULTADO ESPERADO**

✅ **Após configuração completa:**
- Emails automáticos saem pelo SendGrid
- Emails de contato chegam no Zoho
- Interface profissional para gerenciar emails
- Backup e segurança do Zoho
- Custo baixo (plano gratuito inicial)

**🚀 Sistema híbrido funcionando perfeitamente!** 