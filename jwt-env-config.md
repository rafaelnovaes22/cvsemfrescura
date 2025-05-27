# Configuração JWT - Variáveis de Ambiente

## 🔧 Variáveis Obrigatórias

```env
# JWT Secret (OBRIGATÓRIO)
# Gere uma chave forte de 256+ bits
JWT_SECRET=sua-chave-super-secreta-aqui-256-bits-minimo

# Exemplo de secret seguro:
# JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

## ⚙️ Variáveis Opcionais (com valores padrão)

```env
# Tempo de expiração do token (padrão: 24h)
JWT_EXPIRES_IN=24h

# Identificador do emissor (padrão: cv-sem-frescura)
JWT_ISSUER=cv-sem-frescura

# Audiência do token (padrão: api-users)
JWT_AUDIENCE=api-users
```

## 🎯 Configuração Recomendada para Produção

```env
# Produção - CV Sem Frescura
JWT_SECRET=SUA_CHAVE_SUPER_SECRETA_256_BITS_AQUI
JWT_EXPIRES_IN=12h
JWT_ISSUER=cv-sem-frescura
JWT_AUDIENCE=api-users
NODE_ENV=production
```

## 🔨 Configuração para Desenvolvimento

```env
# Desenvolvimento - CV Sem Frescura
JWT_SECRET=dev-secret-cv-sem-frescura-123456789
JWT_EXPIRES_IN=7d
JWT_ISSUER=cv-sem-frescura-dev
JWT_AUDIENCE=api-users-dev
NODE_ENV=development
```

## 🔐 Como Gerar um JWT_SECRET Seguro

### Opção 1: Node.js
```javascript
const crypto = require('crypto');
console.log(crypto.randomBytes(64).toString('hex'));
```

### Opção 2: OpenSSL
```bash
openssl rand -hex 64
```

### Opção 3: Online (use apenas para desenvolvimento)
- https://generate-secret.vercel.app/64

## ✅ Checklist de Segurança

- [ ] JWT_SECRET tem pelo menos 256 bits (64 caracteres hex)
- [ ] JWT_SECRET é diferente entre desenvolvimento e produção
- [ ] JWT_SECRET não está commitado no código
- [ ] JWT_EXPIRES_IN não é muito longo (máximo 24h para produção)
- [ ] Variáveis estão configuradas no Railway/servidor

## 🚀 Deploy no Railway

No Railway, adicione estas variáveis:

```
JWT_SECRET = [sua-chave-secreta-256-bits]
JWT_EXPIRES_IN = 12h
JWT_ISSUER = cv-sem-frescura
JWT_AUDIENCE = api-users
```

## 📝 Exemplo de Uso

```javascript
// Gerar token
const { generateToken } = require('./utils/jwtHelper');
const token = generateToken({ 
  userId: user.id, 
  email: user.email 
});

// Verificar token (automático no middleware)
// req.user conterá { userId, email, iat, exp, iss, aud }
``` 