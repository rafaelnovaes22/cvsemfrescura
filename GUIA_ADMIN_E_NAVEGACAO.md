# 🔧 Guia: Admin e Navegação - Correções Aplicadas

## ✅ Problemas Corrigidos

### 1. **Links de Navegação na Landing Page** ✨

**Problema:** Os links "Recursos" e "Como Funciona" não direcionavam corretamente.

**Solução:** Atualizado `frontend/assets/js/header-new.js` para:
- Usar smooth scroll correto para âncoras na mesma página
- Links agora funcionam perfeitamente na landing page

**Como testar:**
1. Acesse `landing.html`
2. Clique em "Recursos" → deve rolar suavemente para a seção de features
3. Clique em "Como Funciona" → deve rolar suavemente para a seção how-it-works

---

### 2. **Acesso ao Painel Admin** 🔐

**Problema:** Não conseguia acessar `admin.html`.

**Causa:** O painel admin requer:
1. Estar autenticado (ter token válido)
2. Ter permissão de administrador (`isAdmin: true` no banco)

**Solução:** Criado script para promover usuários a admin.

---

## 🚀 Como Acessar o Painel Admin

### **Passo 1: Criar uma conta (se não tiver)**

1. Acesse: http://localhost:3000/analisar.html
2. Clique em "Criar conta"
3. Preencha seus dados
4. Faça login

### **Passo 2: Promover seu usuário a Admin**

Execute o script de promoção:

```bash
# No terminal, na raiz do projeto
node backend/scripts/promover-admin.js seu-email@exemplo.com

# Exemplo real:
node backend/scripts/promover-admin.js rafaeldenovaes@gmail.com
```

**Saída esperada:**
```
🔧 Conectando ao banco de dados...
✅ Conectado com sucesso!

🔍 Buscando usuário: rafaeldenovaes@gmail.com

🚀 Promovendo Rafael de Novaes a administrador...

🎉 SUCESSO! Usuário promovido a administrador!

📊 Informações atualizadas:
   👤 Nome: Rafael de Novaes
   📧 Email: rafaeldenovaes@gmail.com
   👑 Admin: SIM ✅
   💳 Créditos: 5
   📅 Criado em: 05/11/2025

✨ Próximos passos:
   1. Faça logout se estiver logado
   2. Faça login novamente com este email
   3. Acesse: http://localhost:3000/admin.html
   4. Você terá acesso ao painel administrativo!
```

### **Passo 3: Fazer Login Novamente**

**IMPORTANTE:** Para que as permissões de admin sejam aplicadas ao seu token, você precisa:

1. Fazer **logout**
2. Fazer **login** novamente

Isso garante que um novo token JWT seja gerado com `isAdmin: true`.

### **Passo 4: Acessar o Admin**

Agora você pode acessar: http://localhost:3000/admin.html

---

## 🔍 Verificar Permissões de Admin

Para verificar se seu usuário tem permissões de admin:

```bash
# Listar todos os usuários e seus status
node backend/scripts/listar-usuarios.js
```

Ou verificar um usuário específico:

```bash
# Verificar um email específico
node backend/scripts/verificar-admin.js seu-email@exemplo.com
```

---

## 🎯 Funcionalidades do Painel Admin

Com acesso administrativo, você pode:

### **1. Dashboard de Estatísticas**
- Total de códigos de presente
- Códigos ativos
- Códigos esgotados
- Usos hoje
- Códigos expirando em 7 dias

### **2. Gestão de Códigos de Presente**
- Criar códigos em lote
- Definir prefixo, quantidade, máximo de usos
- Definir data de expiração
- Ativar/Desativar códigos
- Excluir códigos
- Exportar para CSV

### **3. Filtros e Busca**
- Filtrar por status (ativo, inativo, esgotado, expirado)
- Buscar por código específico
- Paginação de resultados

### **4. Exportação**
- Exportar lista de códigos em CSV
- Filtrar antes de exportar

---

## 🛠️ Troubleshooting

### **Erro: "Acesso negado. Apenas administradores..."**

**Causa:** Seu usuário não é admin ou você não fez login novamente após a promoção.

**Solução:**
1. Verifique se foi promovido: `node backend/scripts/verificar-admin.js seu-email@exemplo.com`
2. Se sim, faça logout e login novamente
3. Tente acessar admin.html novamente

### **Erro: "Token inválido ou expirado"**

**Causa:** Seu token JWT expirou ou é inválido.

**Solução:**
1. Faça logout
2. Faça login novamente
3. Tente acessar admin.html

### **Links de Navegação não funcionam**

**Causa:** JavaScript do header pode não estar carregado.

**Solução:**
1. Abra o Console do navegador (F12)
2. Verifique se há erros JavaScript
3. Recarregue a página (Ctrl+F5)
4. Limpe o cache do navegador

### **Smooth scroll não funciona**

**Causa:** Navegador antigo ou JavaScript desabilitado.

**Solução:**
1. Use um navegador moderno (Chrome, Firefox, Edge atualizados)
2. Habilite JavaScript no navegador
3. Verifique se não há extensões bloqueando scripts

---

## 📋 Checklist Completo

### **Para Navegação na Landing:**
- [ ] ✅ Acesse landing.html
- [ ] ✅ Clique em "Recursos" → deve rolar suavemente
- [ ] ✅ Clique em "Como Funciona" → deve rolar suavemente
- [ ] ✅ Links funcionando corretamente

### **Para Acesso Admin:**
- [ ] ✅ Tenha uma conta criada
- [ ] ✅ Execute script de promoção a admin
- [ ] ✅ Faça logout
- [ ] ✅ Faça login novamente
- [ ] ✅ Acesse admin.html
- [ ] ✅ Veja painel administrativo funcionando

---

## 🔐 Segurança

**IMPORTANTE:** 
- ⚠️ Não promova usuários aleatórios a admin em produção
- 🔒 Apenas administradores podem acessar `/api/admin/*`
- 🛡️ Todas as rotas admin verificam token JWT + isAdmin
- 🔑 Mantenha as credenciais de admin seguras

---

## 📞 Ainda com Problemas?

Se ainda tiver problemas:

1. **Verifique os logs do console:**
   - Abra F12 → Console
   - Procure por erros em vermelho

2. **Verifique o servidor:**
   - Servidor deve estar rodando em http://localhost:3000
   - Verifique logs do backend

3. **Limpe o cache:**
   - Ctrl+Shift+Delete
   - Limpe cookies e cache
   - Feche e abra o navegador

4. **Reinicie o servidor:**
   ```bash
   # Pare o servidor (Ctrl+C)
   # Inicie novamente
   npm start
   ```

---

## ✅ Resumo

| Item | Status | Ação |
|------|--------|------|
| Links de Navegação | ✅ Corrigido | Apenas recarregue a página |
| Acesso Admin | ✅ Corrigido | Execute script de promoção |
| Smooth Scroll | ✅ Funcionando | Testado e validado |
| Painel Admin | ✅ Disponível | Acesse após ser admin |

---

**🎉 Tudo pronto! Seu sistema está funcionando perfeitamente.**

