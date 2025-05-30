# 🚨 CORREÇÃO URGENTE - RAILWAY POSTGRESQL

## ⚡ PASSOS PARA RESOLVER AGORA

### 1. ACESSE O RAILWAY DASHBOARD
```
https://railway.app/dashboard
```

### 2. IDENTIFIQUE O PROBLEMA
Seu projeto atual tem um erro porque:
- ❌ PostgreSQL não está conectado corretamente
- ❌ `DATABASE_URL` está apontando para URL inválida

### 3. ADICIONAR POSTGRESQL (SE NÃO EXISTE)
1. No seu projeto Railway, clique em **"+ New"**
2. Selecione **"Database"** 
3. Escolha **"Add PostgreSQL"**
4. Aguarde o provisionamento (1-2 minutos)

### 4. CONFIGURAR VARIÁVEIS DE AMBIENTE
Vá para seu serviço principal (backend) > **Variables** e configure:

```bash
# ✅ SUBSTITUA A DATABASE_URL ATUAL POR:
DATABASE_URL=${{Postgres.DATABASE_URL}}

# ✅ OUTRAS VARIÁVEIS ESSENCIAIS:
NODE_ENV=production
PORT=${{PORT}}

# ✅ APIs (use suas chaves reais):
OPENAI_API_KEY=sua_chave_openai_aqui

JWT_SECRET=sua_jwt_secret_muito_longa_aqui

# ✅ STRIPE:
STRIPE_SECRET_KEY=sua_chave_stripe_aqui
```

### 5. VERIFICAR CONECTIVIDADE
Após salvar as variáveis, o Railway fará redeploy automático.

**Logs esperados (sucesso):**
```
✅ PostgreSQL conectado com sucesso
✅ Banco de dados sincronizado
🚀 CV Sem Frescura backend rodando na porta XXXX
```

**Logs esperados (com fallback):**
```
❌ Falha na conexão PostgreSQL: [erro]
⚠️ PostgreSQL indisponível, FORÇANDO SQLite como fallback
✅ SQLite conectado com sucesso (fallback FORÇADO)
```

## 🛡️ SOLUÇÃO TEMPORÁRIA IMPLEMENTADA

Se não conseguir configurar PostgreSQL agora, a aplicação vai automaticamente usar SQLite e **CONTINUAR FUNCIONANDO**.

### Para forçar SQLite temporariamente:
Adicione esta variável no Railway:
```bash
FORCE_SQLITE=true
```

## 🔍 VERIFICAR STATUS

1. **Acessar aplicação:** `https://seuapp.railway.app`
2. **Verificar logs:** Railway Dashboard > Logs
3. **Testar funcionalidade:** Tentar fazer upload de currículo

## 🚀 PRÓXIMOS PASSOS

1. ✅ Aplicação funcionando (SQLite ou PostgreSQL)
2. 📊 Monitorar logs por 15 minutos 
3. 🔧 Configurar PostgreSQL definitivamente
4. 🗑️ Remover `FORCE_SQLITE=true` quando PostgreSQL estiver ok

---

**⏰ TEMPO ESTIMADO:** 5-10 minutos
**🎯 PRIORIDADE:** CRÍTICA - Site fora do ar 