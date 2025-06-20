# 🚀 Deploy em Produção - CV Sem Frescura

## ⚠️ PROBLEMA IDENTIFICADO

O erro `column "isAdmin" does not exist` indica que a migração do banco de dados não foi aplicada em produção.

## 🔧 SOLUÇÃO - PASSOS PARA DEPLOY

### 1. **Aplicar Migração em Produção**

```bash
# Na servidor de produção, execute:
cd backend
node migrate-production.js
```

Este script irá:
- ✅ Detectar automaticamente se é PostgreSQL (produção) ou SQLite (dev)
- ✅ Adicionar a coluna `isAdmin` se não existir
- ✅ Configurar valores padrão
- ✅ Verificar a estrutura resultante

### 2. **Promover Usuário a Admin**

```bash
# Promover seu usuário a administrador:
node promote-user-admin.js rafaeldenovaes@gmail.com
```

### 3. **Verificar se Funcionou**

```bash
# Testar login e verificar token:
node test-login-token.js
```

## 📋 CHECKLIST DE DEPLOY

### ✅ **Antes do Deploy:**
- [ ] Código commitado e pushado para git
- [ ] Variáveis de ambiente configuradas
- [ ] Backup do banco de dados atual

### ⚡ **Durante o Deploy:**
- [ ] Deploy do código mais recente
- [ ] Executar `node migrate-production.js`
- [ ] Executar `node promote-user-admin.js <email>`
- [ ] Verificar se servidor reiniciou

### 🧪 **Após o Deploy:**
- [ ] Testar login no sistema
- [ ] Acessar `/admin.html` sem erro 500
- [ ] Verificar se códigos de presente carregam
- [ ] Testar funcionalidades administrativas

## 🐛 RESOLUÇÃO DE PROBLEMAS

### **Erro: "column isAdmin does not exist"**
```bash
node migrate-production.js
```

### **Erro 403: "Acesso negado - não é admin"**
```bash
node promote-user-admin.js seu@email.com
```

### **Erro 500 no login**
1. Verificar logs do servidor
2. Verificar se migração foi aplicada
3. Reiniciar aplicação

### **Erro de conexão com banco**
1. Verificar `DATABASE_URL` nas variáveis de ambiente
2. Verificar se banco está acessível
3. Verificar credenciais

## 🌍 AMBIENTES

### **Desenvolvimento (SQLite)**
```bash
cd backend
npm start
```

### **Produção (PostgreSQL)**
- Railway/Heroku: Deploy automático via git
- Manual: `NODE_ENV=production npm start`

## 📊 MONITORAMENTO

### **Verificar Status dos Admins:**
```bash
node list-users.js
```

### **Logs do Sistema:**
- Acessar logs da plataforma (Railway/Heroku)
- Verificar erros de autenticação
- Monitorar uso de códigos de presente

## 🎯 FUNCIONALIDADES ADMINISTRATIVAS

Após o deploy bem-sucedido, você poderá:

- 📊 **Dashboard** - Estatísticas e métricas
- 🎁 **Códigos de Presente** - Criar, editar, desativar
- 👥 **Usuários** - Ver lista e gerenciar
- 📈 **Relatórios** - Uso de códigos e análises
- ⚙️ **Configurações** - Parâmetros do sistema

## 🚨 BACKUP E SEGURANÇA

### **Antes de Qualquer Alteração:**
```bash
# Backup do banco (PostgreSQL)
pg_dump DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup do banco (SQLite)
cp database/dev.sqlite backup_$(date +%Y%m%d_%H%M%S).sqlite
```

### **Restaurar Backup:**
```bash
# PostgreSQL
psql DATABASE_URL < backup_file.sql

# SQLite
cp backup_file.sqlite database/dev.sqlite
```

## 📞 SUPORTE

Se algo der errado:

1. **Verifique os logs** da aplicação
2. **Execute os scripts de diagnóstico**
3. **Faça backup** antes de tentar corrigir
4. **Documente** o problema para próximas vezes

---

**⚠️ IMPORTANTE:** Sempre faça backup antes de executar migrações em produção!

**✅ SUCESSO:** Após seguir esses passos, o painel administrativo estará funcionando completamente em produção. 