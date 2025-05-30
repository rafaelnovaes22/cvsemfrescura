# 🚀 Configuração do Banco PostgreSQL no Railway

## ⚡ Solução Rápida para Produção

### 1. Acessar Railway Dashboard
1. Acesse [railway.app](https://railway.app)
2. Vá para seu projeto CV Sem Frescura
3. No dashboard, você verá seu serviço principal

### 2. Adicionar PostgreSQL ao Projeto
1. Clique em **"+ New"** no dashboard
2. Selecione **"Database"**
3. Escolha **"Add PostgreSQL"**
4. O Railway irá provisionar automaticamente um banco PostgreSQL

### 3. Configurar Variáveis de Ambiente
Após criar o PostgreSQL, vá para as **variáveis de ambiente** do seu serviço principal e adicione:

```bash
# ✅ CONFIGURAÇÃO CORRETA RAILWAY
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production

# ✅ Outras variáveis importantes
OPENAI_API_KEY=sua_chave_openai_aqui
JWT_SECRET=sua_jwt_secret_muito_longa_aqui
STRIPE_SECRET_KEY=sua_chave_stripe_aqui
FRONTEND_URL=https://seuapp.railway.app
BACKEND_URL=https://seuapp.railway.app
```

### 4. Verificar Conectividade
O Railway automaticamente conecta os serviços. A variável `${{Postgres.DATABASE_URL}}` será automaticamente preenchida com a URL de conexão correta.

### 5. Verificar Logs
Após o deploy, verifique os logs para confirmar:
```
✅ PostgreSQL conectado com sucesso
✅ Banco de dados sincronizado
🚀 CV Sem Frescura backend rodando na porta XXXX
```

## 🛡️ Solução de Emergência Implementada

### Fallback Automático para SQLite
Se o PostgreSQL falhar, a aplicação automaticamente:
1. Detecta falha na conexão PostgreSQL
2. Ativa fallback para SQLite
3. Mantém o serviço funcionando
4. Registra logs detalhados

### Logs Esperados com Fallback:
```
🔄 Tentando conectar ao PostgreSQL...
❌ Falha na conexão PostgreSQL: [erro]
⚠️ PostgreSQL indisponível, usando SQLite como fallback
✅ SQLite conectado com sucesso (fallback)
📊 Banco de dados: SQLITE
```

## 🔧 Troubleshooting

### Problema: Connection Refused IPv6
**Erro:** `connect ECONNREFUSED fd12:b9a0:cb3a:0:a000:3b:8aa7:477b:5432`

**Solução:**
1. Verifique se o PostgreSQL está corretamente conectado no Railway
2. Confirme que `DATABASE_URL` está configurada como `${{Postgres.DATABASE_URL}}`
3. Reinicie o deploy

### Problema: SSL Certificate
Se houver erro de SSL, a configuração já inclui:
```javascript
dialectOptions: {
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false,
}
```

### Problema: Timeout
Se a conexão demorar muito:
1. O sistema tentará PostgreSQL por 30 segundos
2. Automaticamente fará fallback para SQLite
3. Aplicação continuará funcionando

## 📊 Status da Aplicação

### ✅ Implementado
- [x] Fallback automático PostgreSQL → SQLite
- [x] Logs detalhados de conexão
- [x] SSL configurado para produção
- [x] Timeout handling
- [x] Modo emergência em produção

### 🚀 Próximos Passos
1. Configurar PostgreSQL no Railway
2. Atualizar variáveis de ambiente
3. Fazer deploy
4. Monitorar logs
5. Verificar funcionamento

## 🔗 Links Úteis
- [Railway PostgreSQL Guide](https://docs.railway.app/databases/postgresql)
- [Railway Environment Variables](https://docs.railway.app/deploy/variables)
- [Dashboard do Projeto](https://railway.app/dashboard) 