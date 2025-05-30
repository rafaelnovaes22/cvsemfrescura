# 🚀 CHECKLIST DE DEPLOY PARA PRODUÇÃO

## ✅ STATUS DO DEPLOY
- [x] **Código enviado** para repositório (commit 09e4e30d - Segurança)
- [x] **Correção banco** enviada (commit 3f6c8e1e - Database fix)
- [x] **Push realizado** para branch master
- [ ] **Variáveis de ambiente** configuradas no Railway
- [ ] **Deployment** verificado
- [ ] **Testes de segurança** realizados

---

## 🔧 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

### **CRÍTICAS - DEVEM ESTAR CONFIGURADAS:**

```bash
# 🔑 Criptografia (NOVA - OBRIGATÓRIA)
ENCRYPTION_KEY=474f59b0f51c0027dfd1e09659ac7e9f78c3c5399431e9c23e1b61569e62eb98

# 🔐 JWT (JÁ EXISTENTE)
JWT_SECRET=sua_chave_jwt_segura

# 💳 Stripe (JÁ EXISTENTES)
STRIPE_SECRET_KEY=sk_live_sua_chave_producao
STRIPE_PUBLISHABLE_KEY=pk_live_sua_chave_publica

# 🗄️ Database (OPCIONAL - se não configurada usará SQLite)
DATABASE_URL=postgresql://usuario:senha@host:porta/database

# 📧 E-mail (OPCIONAL)
SMTP_HOST=seu_smtp
SMTP_PORT=587
SMTP_USER=seu_email
SMTP_PASS=sua_senha

# 🌐 Frontend URL (OPCIONAL)
FRONTEND_URL=https://cvsemfrescura.com.br
```

### **⚠️ ATENÇÃO - NOVA VARIÁVEL OBRIGATÓRIA:**
```bash
ENCRYPTION_KEY=474f59b0f51c0027dfd1e09659ac7e9f78c3c5399431e9c23e1b61569e62eb98
```

### **✅ BANCO DE DADOS AGORA É OPCIONAL:**
- 🟢 **Com DATABASE_URL:** Funcionalidade completa (códigos de presente, histórico)
- 🟡 **Sem DATABASE_URL:** Sistema funciona com SQLite em memória (limitado)

---

## 🚦 VERIFICAÇÕES APÓS DEPLOY

### 1. **Teste de Segurança - Chaves Secretas**
```bash
# Tentar enviar chave secreta (DEVE SER BLOQUEADO)
curl -X POST https://cvsemfrescura.com.br/api/payment/create-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "stripe_secret_key": "sk_test_123"}'

# Resposta esperada: 400 Bad Request
{
  "error": "Violação de segurança detectada",
  "code": "SECURITY_VIOLATION_SECRET_IN_PAYLOAD"
}
```

### 2. **Teste de Rate Limiting**
```bash
# Fazer 6+ requisições rápidas (DEVE SER LIMITADO)
# Resposta esperada após 5 tentativas: 429 Too Many Requests
```

### 3. **Teste de Criptografia**
```javascript
// No console do navegador em produção:
const testData = { amount: 1000, planName: 'teste' };
const encrypted = await encryptPaymentData(testData);
console.log('Criptografado:', encrypted.encrypted); // Deve ser true
```

### 4. **Teste de Headers de Segurança**
```bash
# Verificar headers de segurança
curl -I https://cvsemfrescura.com.br/api/payment/create-intent

# Headers esperados:
# X-Security-Level: HIGH
# X-Rate-Limit-Policy: ENFORCED
# Strict-Transport-Security: max-age=31536000
```

### 5. **Teste de Banco de Dados (NOVO)**
```bash
# Verificar logs do Railway para confirmar:
✅ [DATABASE] Conexão estabelecida, sincronizando...
✅ [DATABASE] Banco de dados sincronizado com sucesso

# OU (se não tiver banco):
⚠️ [DATABASE] DATABASE_URL não configurada, usando fallback SQLite
⚠️ [DATABASE] Conexão falhou, sistema funcionará sem persistência
```

---

## 📊 MONITORAMENTO PÓS-DEPLOY

### **Logs Críticos de Segurança:**
```bash
🚨 [SECURITY BREACH] - Tentativas de exposição de chaves
🚨 [RATE-LIMIT] - Tentativas excessivas
🛡️ [SECURITY] - Headers suspeitos
🔓 [DECRYPT] - Problemas de criptografia
```

### **Logs de Banco (NOVO):**
```bash
✅ [DATABASE] Conexão testada com sucesso
✅ [DATABASE] Banco de dados sincronizado com sucesso
⚠️ [DATABASE] DATABASE_URL não configurada, usando fallback SQLite
❌ [DATABASE] Falha no teste de conexão
```

### **Métricas de Sucesso:**
- ✅ **Zero logs** de `[SECURITY BREACH]`
- ✅ **Rate limiting** funcionando (logs `[RATE-LIMIT]`)
- ✅ **Criptografia** funcionando (frontend + backend)
- ✅ **Pagamentos** funcionando normalmente
- ✅ **Banco** conectado OU fallback SQLite funcionando

---

## 🎯 ROLLBACK PLAN

Se houver problemas críticos:

1. **Rollback rápido:**
```bash
git revert 3f6c8e1e  # Correção banco
git revert 09e4e30d  # Proteções segurança
git push origin master
```

2. **Desabilitar middleware específico** (se necessário):
   - Comentar rate limiting no `server.js`
   - Comentar validação de segurança nas rotas
   - Manter criptografia (não causa problemas)

---

## ✅ CHECKLIST FINAL

- [ ] **ENCRYPTION_KEY** configurada no Railway
- [ ] **Deploy automático** realizado
- [ ] **Site** carregando normalmente
- [ ] **Logs de banco** OK (PostgreSQL OU SQLite fallback)
- [ ] **Teste de pagamento** funcionando
- [ ] **Teste de segurança** bloqueando chaves
- [ ] **Rate limiting** ativo
- [ ] **Logs de segurança** aparecendo
- [ ] **Performance** mantida

---

## 🔧 CORREÇÕES IMPLEMENTADAS (NOVO)

### **Banco de Dados Robusto:**
- ✅ **Conexão com fallback** - SQLite se PostgreSQL falhar
- ✅ **Inicialização segura** - Servidor sempre inicia
- ✅ **Logs detalhados** - Facilita diagnóstico
- ✅ **Teste de conexão** - Verifica antes de usar
- ✅ **Sync seguro** - Não trava se banco falhar

### **Funcionalidades por Modo:**
- 🟢 **Com PostgreSQL:** Tudo funciona (códigos, histórico, pagamentos)
- 🟡 **Com SQLite:** Pagamentos funcionam, códigos limitados
- 🔴 **Sem banco:** Apenas análises funcionam

---

## 📞 SUPORTE

**Em caso de problemas:**
1. Verificar logs do Railway (procurar `[DATABASE]` e `[SECURITY]`)
2. Testar endpoints individualmente
3. Verificar variáveis de ambiente
4. Rollback se necessário

**Contato:** Desenvolvedores responsáveis

---

## 🎉 RESULTADO ESPERADO

✅ **Sistema em produção com proteção máxima**
✅ **Vulnerabilidade crítica resolvida**
✅ **5 camadas de segurança ativas**
✅ **Banco robusto com fallback**
✅ **Monitoramento automático funcionando**
✅ **Sistema sempre funcional, mesmo sem banco** 