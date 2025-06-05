# 🛡️ Migração Segura - Railway (SEM sobrepor)

## ⚠️ IMPORTANTE: Este processo NÃO quebra a produção

### 📋 Status Atual
- ✅ Chaves de produção funcionando no Railway
- ✅ Sistema em funcionamento normal
- 🎯 **Objetivo**: Adicionar criptografia SEM interromper serviço

## 🔄 Processo de Migração Passo a Passo

### FASE 1: Preparação (SEM tocar nas chaves)

#### 1.1 Backup Completo
```bash
# No Railway Dashboard > Variables, copie:
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
OPENAI_API_KEY=sk-xxxxx
JWT_SECRET=xxxxx
# ... todas as outras

# Salve em arquivo local: backup-railway-keys.txt
```

#### 1.2 Gerar Chave de Criptografia
```bash
cd backend
node scripts/migrate-railway-keys.js generate-key

# Resultado: ENCRYPTION_KEY=abc123def456...
```

#### 1.3 Adicionar Variáveis de Configuração (SEM mexer nas chaves)
```bash
# No Railway, ADICIONE apenas estas novas variáveis:
ENCRYPTION_KEY=sua_chave_gerada_acima
NODE_ENV=production
LOG_LEVEL=error

# ⚠️ NÃO altere as chaves existentes ainda!
```

#### 1.4 Deploy do Código de Segurança
```bash
git add .
git commit -m "feat: sistema de segurança"
git push

# Aguardar deploy e verificar se tudo continua funcionando
```

### FASE 2: Teste de Funcionamento

#### 2.1 Verificar Status
```bash
# Execute no Railway:
railway run node scripts/migrate-railway-keys.js status

# Deve mostrar:
# ✅ ENCRYPTION_KEY: Configurada
# ⚠️ STRIPE_SECRET_KEY: Texto plano (sk_l****xxxx)
# ⚠️ OPENAI_API_KEY: Texto plano (sk-****xxxx)
```

#### 2.2 Teste Básico
```bash
# Verifique se aplicação funciona:
# - Fazer login
# - Testar pagamento
# - Analisar CV
# - Verificar logs

# Se algo não funcionar: PARAR e fazer rollback
```

### FASE 3: Migração das Chaves (Uma por vez)

#### 3.1 Migração Assistida
```bash
# Execute no Railway para ver valores criptografados:
railway run node scripts/migrate-railway-keys.js migrate

# Isso mostra os valores criptografados SEM alterar nada
```

#### 3.2 Migração Manual (RECOMENDADO)

**Para cada chave, faça individualmente:**

```bash
# Exemplo: STRIPE_SECRET_KEY

# 1. Criptografar localmente
echo "sk_live_sua_chave_real" | node -e "
const { encrypt } = require('./backend/utils/encryption');
process.env.ENCRYPTION_KEY = 'sua_chave_de_criptografia';
const key = require('fs').readFileSync(0, 'utf8').trim();
console.log('Valor criptografado:', encrypt(key));
"

# 2. No Railway Dashboard:
#    - Renomear STRIPE_SECRET_KEY para STRIPE_SECRET_KEY_BACKUP
#    - Criar nova STRIPE_SECRET_KEY com valor criptografado

# 3. Testar imediatamente:
#    - Fazer um pagamento teste
#    - Verificar logs de erro

# 4. Se funcionar: continuar próxima chave
# 5. Se NÃO funcionar: restaurar backup imediatamente
```

#### 3.3 Ordem Recomendada de Migração

1. **JWT_SECRET** (menos crítico para testes)
2. **SMTP_PASS** (emails não são críticos)
3. **OPENAI_API_KEY** (testar análise de CV)
4. **STRIPE_SECRET_KEY** (mais crítico - por último)
5. **DATABASE_URL** (NÃO migrar se PostgreSQL managed)

### FASE 4: Verificação e Limpeza

#### 4.1 Teste Completo
```bash
# Testar TODAS as funcionalidades:
# ✅ Login/logout
# ✅ Pagamentos Stripe
# ✅ Análise de CV (OpenAI)
# ✅ Envio de emails
# ✅ Histórico de análises
```

#### 4.2 Verificar Logs
```bash
railway logs --tail 100

# Deve mostrar:
# ✅ Chaves mascaradas nos logs
# ✅ Sem erros de descriptografia
# ✅ Funcionamento normal
```

#### 4.3 Limpeza (Apenas após tudo funcionar)
```bash
# No Railway, remover variáveis de backup:
# - STRIPE_SECRET_KEY_BACKUP
# - OPENAI_API_KEY_BACKUP
# - etc.

# ⚠️ Só faça isso após 24h de funcionamento estável!
```

## 🚨 Plano de Rollback Imediato

Se QUALQUER coisa der errado:

### Rollback de Chave Individual
```bash
# No Railway Dashboard:
# 1. Deletar chave criptografada problemática
# 2. Renomear chave_BACKUP para nome original
# 3. Aguardar propagação (1-2 minutos)
# 4. Testar funcionamento
```

### Rollback Completo
```bash
# No Railway Dashboard:
# 1. Restaurar TODAS as chaves do backup
# 2. Remover ENCRYPTION_KEY temporariamente
# 3. Aguardar estabilização
# 4. Fazer redeploy se necessário
```

## 📊 Monitoramento Durante Migração

### Comandos Úteis
```bash
# Verificar status das chaves
railway run node scripts/migrate-railway-keys.js status

# Monitorar logs em tempo real
railway logs --tail

# Verificar se app responde
curl https://seu-app.railway.app/health

# Testar endpoint específico
curl https://seu-app.railway.app/api/stripe/publishable-key
```

### Sinais de Alerta
- ❌ Erro 500 nas páginas
- ❌ "Invalid API key" do Stripe
- ❌ "OpenAI API error"
- ❌ Usuários não conseguem logar
- ❌ Logs com erros de descriptografia

## ✅ Checklist de Migração

### Antes de Começar
- [ ] Backup completo das variáveis
- [ ] Sistema funcionando normalmente
- [ ] Plano de rollback definido
- [ ] Horário de baixo tráfego escolhido

### Durante a Migração
- [ ] Uma chave por vez
- [ ] Teste após cada migração
- [ ] Monitoramento contínuo de logs
- [ ] Backup de cada chave antes de alterar

### Após Migração
- [ ] Todas as funcionalidades testadas
- [ ] Logs sem erros
- [ ] Performance normal
- [ ] Chaves originais guardadas (backup)

## 💡 Dicas Importantes

1. **Nunca migre tudo de uma vez**
2. **Sempre teste em horário de baixo tráfego**
3. **Mantenha backup por pelo menos 1 semana**
4. **Monitor logs continuamente**
5. **Tenha alguém de prontidão para rollback**

---

**🎯 RESULTADO FINAL:**
- ✅ Chaves criptografadas e seguras
- ✅ Logs sanitizados
- ✅ Zero downtime durante migração
- ✅ Sistema mais seguro em produção 