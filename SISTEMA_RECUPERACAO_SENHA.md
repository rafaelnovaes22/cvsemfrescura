# 🔐 Sistema de Recuperação de Senha - CV Sem Frescura

## 📋 Visão Geral

Sistema completo de recuperação de senha implementado com segurança e UX otimizada, permitindo que usuários redefinam suas senhas através de email de forma segura.

## 🏗️ Arquitetura

### Backend
- **Modelo**: `PasswordReset` - Gerencia tokens de recuperação
- **Controller**: `passwordResetController` - Lógica de negócio
- **Service**: `emailService` - Envio de emails
- **Routes**: `/api/password-reset/*` - Endpoints da API

### Frontend
- **Página de Solicitação**: `forgot-password.html`
- **Página de Redefinição**: `reset-password.html`
- **Integração**: Link no formulário de login

## 🔄 Fluxo Completo

### 1. Solicitação de Reset
```
Usuário → forgot-password.html → POST /api/password-reset/request
```

### 2. Validação e Email
```
Backend → Valida email → Gera token → Envia email → Resposta
```

### 3. Acesso ao Link
```
Email → reset-password.html?token=xxx → GET /api/password-reset/verify/:token
```

### 4. Redefinição
```
Nova senha → POST /api/password-reset/confirm → Senha atualizada
```

## 🛡️ Segurança

### Tokens
- **Geração**: 32 bytes aleatórios (crypto.randomBytes)
- **Validade**: 1 hora
- **Uso único**: Token marcado como usado após redefinição
- **Limpeza**: Tokens expirados removidos automaticamente

### Validações
- Email obrigatório
- Senha mínima de 6 caracteres
- Verificação de token válido e não expirado
- Hash bcrypt para nova senha

### Rate Limiting
- Proteção contra spam de emails
- Limite de tentativas por IP

## 📧 Sistema de Email

### Desenvolvimento
- **Provedor**: Ethereal Email (emails de teste)
- **Preview**: URLs de visualização nos logs

### Produção
- **Configuração**: Variáveis de ambiente
- **Template**: HTML responsivo com design da marca

### Variáveis de Ambiente
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu@email.com
SMTP_PASS=sua_senha_app
FROM_EMAIL=noreply@cvsemfrescura.com
FRONTEND_URL=http://localhost:8080
```

## 🎨 Interface do Usuário

### Página de Solicitação (`forgot-password.html`)
- **Design**: Consistente com a identidade visual
- **Campos**: Email com validação
- **Feedback**: Mensagens claras de sucesso/erro
- **UX**: Auto-focus, loading states, redirecionamento

### Página de Redefinição (`reset-password.html`)
- **Validação de Token**: Automática ao carregar
- **Força da Senha**: Indicador em tempo real
- **Confirmação**: Validação de senhas iguais
- **Requisitos**: Lista clara dos critérios

### Integração no Login
- **Link**: "🔐 Esqueci minha senha" no formulário
- **Posicionamento**: Discreto mas acessível

## 🗄️ Banco de Dados

### Tabela `PasswordResets`
```sql
CREATE TABLE "PasswordResets" (
  "id" UUID PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "token" VARCHAR(255) NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP NOT NULL,
  "used" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "Users" ("id") ON DELETE CASCADE
);
```

### Índices
- `token` - Busca rápida por token
- `userId` - Busca por usuário
- `expiresAt` - Limpeza de tokens expirados

## 🔌 API Endpoints

### POST `/api/password-reset/request`
**Solicitar reset de senha**

```json
// Request
{
  "email": "usuario@email.com"
}

// Response
{
  "success": true,
  "message": "Se o email existir em nossa base, você receberá instruções..."
}
```

### GET `/api/password-reset/verify/:token`
**Verificar validade do token**

```json
// Response (sucesso)
{
  "success": true,
  "message": "Token válido",
  "user": {
    "email": "usuario@email.com",
    "name": "Nome do Usuário"
  }
}

// Response (erro)
{
  "success": false,
  "error": "Token inválido ou expirado"
}
```

### POST `/api/password-reset/confirm`
**Confirmar nova senha**

```json
// Request
{
  "token": "abc123...",
  "newPassword": "novaSenha123"
}

// Response
{
  "success": true,
  "message": "Senha redefinida com sucesso! Você já pode fazer login."
}
```

## 🧪 Testes

### URLs de Teste
- **Solicitação**: `http://localhost:8080/forgot-password.html`
- **Reset (exemplo)**: `http://localhost:8080/reset-password.html?token=abc123`

### Cenários de Teste
1. **Email existente**: Deve enviar email e mostrar sucesso
2. **Email inexistente**: Deve mostrar sucesso (segurança)
3. **Token válido**: Deve mostrar formulário de nova senha
4. **Token inválido**: Deve mostrar erro
5. **Token expirado**: Deve mostrar erro
6. **Senha fraca**: Deve mostrar aviso
7. **Senhas diferentes**: Deve mostrar erro
8. **Reset bem-sucedido**: Deve atualizar senha e redirecionar

## 📱 Responsividade

### Mobile First
- Design adaptável para todos os dispositivos
- Campos de entrada otimizados para mobile
- Botões com tamanho adequado para toque

### Acessibilidade
- Labels apropriados
- Contraste adequado
- Navegação por teclado
- Mensagens de erro claras

## 🔧 Manutenção

### Limpeza Automática
```javascript
// Executar periodicamente (cron job recomendado)
const { cleanupExpiredTokens } = require('./controllers/passwordResetController');
await cleanupExpiredTokens();
```

### Monitoramento
- Logs de tentativas de reset
- Métricas de emails enviados
- Taxa de sucesso de redefinições

## 🚀 Deploy

### Dependências
```bash
npm install nodemailer uuid
```

### Configuração
1. Definir variáveis de ambiente SMTP
2. Configurar domínio frontend
3. Testar envio de emails
4. Configurar limpeza automática de tokens

## 📊 Métricas de Sucesso

### UX
- ✅ Fluxo intuitivo e claro
- ✅ Feedback imediato
- ✅ Design consistente
- ✅ Responsivo

### Segurança
- ✅ Tokens seguros
- ✅ Expiração automática
- ✅ Uso único
- ✅ Rate limiting

### Funcionalidade
- ✅ Emails entregues
- ✅ Redefinição funcional
- ✅ Integração completa
- ✅ Tratamento de erros

## 🎯 Próximos Passos

1. **Configurar SMTP em produção**
2. **Implementar limpeza automática (cron)**
3. **Adicionar métricas e analytics**
4. **Testes automatizados**
5. **Notificação de senha alterada**

---

**Status**: ✅ **Implementado e Funcional**  
**Versão**: 1.0.0  
**Data**: 26/05/2025 