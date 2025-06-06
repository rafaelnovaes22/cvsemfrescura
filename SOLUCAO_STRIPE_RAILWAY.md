# 🚀 Solução para Problema do Stripe no Railway

## 📋 Situação Atual
- ✅ Chaves funcionam localmente 
- ❌ Erro de acesso ao Stripe no Railway
- 🔍 **Causa**: Chaves estão em texto plano no Railway, mas o código tenta descriptografá-las

## 🎯 Solução Rápida (Recomendada)

### Passo 1: Desabilitar Criptografia no Railway
1. Acesse o [Railway Dashboard](https://railway.app/)
2. Vá para o seu projeto
3. Clique em **"Variables"**
4. Adicione uma nova variável:
   ```
   DISABLE_ENCRYPTION=true
   ```
5. Clique em **"Deploy"**

### Passo 2: Verificar Outras Variáveis
Certifique-se que estas variáveis estão configuradas no Railway:
```
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_sua_chave_aqui
STRIPE_PUBLISHABLE_KEY=pk_live_sua_chave_aqui
STRIPE_WEBHOOK_SECRET=whsec_sua_chave_aqui
DISABLE_ENCRYPTION=true
```

## 🔐 Solução Alternativa (Criptografia)

Se preferir manter as chaves criptografadas:

### Passo 1: Criptografar as Chaves
```bash
cd backend
node encrypt-single.js
```

### Passo 2: Atualizar Railway
1. Substitua as chaves no Railway pelas versões criptografadas
2. **Remova** ou defina `DISABLE_ENCRYPTION=false`
3. Certifique-se que `ENCRYPTION_KEY` está configurada

## 🧪 Como Testar

### Teste Local
```bash
cd backend
node debug-stripe-railway.js
```

### Teste no Railway
1. Verifique os logs do deployment
2. Procure por mensagens como:
   - ✅ "Stripe inicializado com sucesso"
   - ✅ "Chave já está em texto plano e é válida"
   - ❌ "Invalid API Key" = problema persiste

## 🔍 Debug no Railway

### Ver Logs em Tempo Real
```bash
railway logs --follow
```

### Procurar por Estas Mensagens
```
✅ [PRODUÇÃO] Chaves do Stripe configuradas
🔑 [PRODUÇÃO] SecretKey válida: true
🔑 [PRODUÇÃO] PublishableKey válida: true
✅ Stripe inicializado com sucesso
```

## ⚠️ Troubleshooting

### Problema: "Invalid API Key"
**Causa**: Chave corrompida ou formato incorreto
**Solução**: 
1. Verifique se as chaves no Railway estão completas
2. Não há espaços ou quebras de linha
3. Use `DISABLE_ENCRYPTION=true`

### Problema: "Stripe não configurado"
**Causa**: Variáveis de ambiente não encontradas
**Solução**:
1. Verifique se todas as variáveis estão no Railway
2. Redeploy após adicionar variáveis

### Problema: Criptografia falhando
**Causa**: `ENCRYPTION_KEY` incorreta ou chaves já em texto plano
**Solução**:
1. Use `DISABLE_ENCRYPTION=true`
2. Ou recriptografe as chaves com a ENCRYPTION_KEY correta

## 📞 Próximos Passos

1. **Imediato**: Adicione `DISABLE_ENCRYPTION=true` no Railway
2. **Teste**: Verifique se pagamentos funcionam
3. **Opcional**: Implemente criptografia depois se desejar

## 🎯 Comando Rápido para Resolver

Se você tem acesso ao Railway CLI:
```bash
railway variables set DISABLE_ENCRYPTION=true
railway deploy
```

---

✅ **Esta solução deve resolver 99% dos problemas com Stripe no Railway** 