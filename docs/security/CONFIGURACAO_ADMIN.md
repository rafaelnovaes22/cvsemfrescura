# 🔐 Configuração do Sistema Administrativo

## 📋 Visão Geral

O sistema agora possui controle de acesso administrativo adequado para gerenciar códigos de presente. Apenas usuários com permissões administrativas podem acessar o painel de administração.

## 🚀 Configuração Inicial

### 1. Aplicar Migração do Banco de Dados

```bash
# Executar a migração SQL para adicionar o campo isAdmin
psql -d seu_banco_de_dados -f backend/migrations/add-admin-field.sql
```

### 2. Criar Usuário Administrador

#### Opção A: Promover usuário existente
```bash
cd backend
node create-admin-user.js usuario@email.com
```

#### Opção B: Criar novo usuário admin
```bash
cd backend
node create-admin-user.js admin@empresa.com --create
```

#### Opção C: Listar usuários atuais
```bash
cd backend
node create-admin-user.js
```

## 🔧 Funcionalidades do Painel Admin

### Dashboard Estatístico
- ✅ Total de códigos criados
- ✅ Códigos ativos/inativos
- ✅ Códigos esgotados
- ✅ Usos realizados hoje
- ✅ Códigos que expiram em 7 dias

### Gestão de Códigos
- ✅ **Criar códigos em lote** com prefixos personalizados
- ✅ **Listar e filtrar** códigos por status
- ✅ **Buscar códigos específicos**
- ✅ **Ativar/Desativar** códigos individualmente
- ✅ **Excluir códigos**
- ✅ **Exportar relatórios** em CSV

### Segurança Implementada
- ✅ **Autenticação obrigatória** via JWT token
- ✅ **Verificação de permissão admin** em todas as rotas
- ✅ **Mensagens de erro específicas** (401 vs 403)
- ✅ **Interface bloqueada** para usuários não-admin

## 🌐 Acessando o Painel

### URL de Acesso
```
https://www.cvsemfrescura.com.br/admin.html
```

### Fluxo de Acesso
1. **Login obrigatório** - Usuário deve estar autenticado
2. **Verificação admin** - Sistema verifica se usuário é admin
3. **Acesso liberado** - Painel carrega para administradores
4. **Acesso negado** - Mensagem clara para usuários comuns

## 📊 APIs Administrativas

Todas as rotas requerem **token JWT válido** e **permissão de admin**:

```javascript
// Headers obrigatórios
{
  'Authorization': 'Bearer [JWT_TOKEN]',
  'Content-Type': 'application/json'
}
```

### Rotas Disponíveis
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/admin/dashboard` | Estatísticas gerais |
| `GET` | `/api/admin/codes` | Listar códigos |
| `POST` | `/api/admin/codes/bulk` | Criar códigos em lote |
| `PUT` | `/api/admin/codes/:id` | Atualizar código |
| `DELETE` | `/api/admin/codes/:id` | Excluir código |
| `GET` | `/api/admin/reports/usage` | Relatório de uso |
| `GET` | `/api/admin/export/codes` | Exportar CSV |

## 🔒 Códigos de Resposta

| Código | Significado | Ação |
|--------|-------------|------|
| `200` | ✅ Sucesso | Operação realizada |
| `401` | 🔐 Token inválido | Fazer login novamente |
| `403` | 🚫 Sem permissão | Usuário não é admin |
| `404` | ❓ Não encontrado | Recurso inexistente |
| `500` | ⚠️ Erro interno | Verificar logs |

## 💡 Exemplos de Uso

### Criar Códigos em Lote
```javascript
const response = await fetch('/api/admin/codes/bulk', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prefix: 'NATAL',
    quantity: 50,
    maxUses: 1,
    description: 'Promoção Natal 2024',
    expiresAt: '2024-12-31T23:59:59'
  })
});
```

### Filtrar Códigos
```javascript
const params = new URLSearchParams({
  status: 'active',
  search: 'NATAL',
  page: 1,
  limit: 10
});

const response = await fetch(`/api/admin/codes?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🛡️ Segurança em Produção

### Verificações Implementadas
1. **Middleware de autenticação** - Valida JWT token
2. **Middleware de admin** - Verifica campo `isAdmin`
3. **Validação de entrada** - Sanitiza dados recebidos
4. **Controle de acesso** - Interface bloqueada para não-admin

### Recomendações Adicionais
- ✅ **Logs de auditoria** - Registrar ações administrativas
- ✅ **Rate limiting** - Limitar requisições por IP
- ✅ **HTTPS obrigatório** - Criptografar comunicação
- ✅ **Tokens com expiração** - Renovar periodicamente

## 🚨 Troubleshooting

### Erro 401 (Unauthorized)
```
Possíveis causas:
- Token JWT inválido ou expirado
- Usuário não está logado
- Headers de autorização ausentes

Solução: Fazer login novamente
```

### Erro 403 (Forbidden)
```
Possíveis causas:
- Usuário não possui permissão admin
- Campo isAdmin = false no banco

Solução: Promover usuário com o script create-admin-user.js
```

### Painel não carrega
```
Verificar:
1. Conexão com banco de dados
2. Campo isAdmin existe na tabela users
3. Token JWT válido no localStorage
4. Permissões do usuário atual

Debug: Abrir DevTools > Console para ver erros
```

## 📞 Suporte

Para questões técnicas ou problemas de acesso:

1. **Verificar logs** do backend
2. **Testar APIs** diretamente via Postman
3. **Validar banco** se campo isAdmin existe
4. **Conferir token** JWT no localStorage

---

✅ **Sistema administrativo configurado e seguro para produção!** 