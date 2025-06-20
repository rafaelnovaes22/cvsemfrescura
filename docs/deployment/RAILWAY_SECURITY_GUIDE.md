# 🚂 Guia de Segurança para Railway - CV Sem Frescura

## 🔐 Como Criptografar Chaves no Railway

### Estratégia 1: Criptografia Local + Deploy (Recomendada)

#### Passo 1: Backup das Chaves Atuais
```bash
# No Railway Dashboard, copie todas as variáveis atuais
# Salve em um arquivo .env.production.backup
STRIPE_SECRET_KEY=sk_live_sua_chave_atual
STRIPE_PUBLISHABLE_KEY=pk_live_sua_chave_atual
OPENAI_API_KEY=sk-sua_chave_openai_atual
# ... outras chaves
```

#### Passo 2: Criptografar Localmente
```bash
# 1. Baixe o código para sua máquina local
git clone seu_repositorio
cd backend

# 2. Crie um arquivo .env.production com as chaves do Railway
# 3. Criptografe o arquivo
node scripts/encrypt-env.js encrypt .env.production

# 4. Isso gerará .env.production.encrypted
```

#### Passo 3: Configurar no Railway
```bash
# 1. No Railway Dashboard, adicione a chave de criptografia
ENCRYPTION_KEY=sua_chave_de_32_caracteres_muito_segura

# 2. Substitua as chaves originais pelos valores criptografados
STRIPE_SECRET_KEY=[valor_criptografado_base64]
STRIPE_PUBLISHABLE_KEY=[valor_criptografado_base64]
OPENAI_API_KEY=[valor_criptografado_base64]
# ... outras chaves criptografadas

# 3. Configure o NODE_ENV
NODE_ENV=production
```

### Estratégia 2: Script de Migração Automática

Vou criar um script que pode ser executado no Railway para migrar as chaves:

```javascript
// scripts/migrate-railway-keys.js
const crypto = require('crypto');

// Chaves que devem ser migradas
const KEYS_TO_MIGRATE = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY', 
    'STRIPE_WEBHOOK_SECRET',
    'OPENAI_API_KEY',
    'JWT_SECRET'
];

async function migrateKeys() {
    console.log('🔄 Iniciando migração de chaves no Railway...');
    
    for (const key of KEYS_TO_MIGRATE) {
        const originalValue = process.env[key];
        
        if (originalValue && !originalValue.startsWith('[ENCRYPTED]')) {
            // Chave ainda não está criptografada
            const encrypted = encrypt(originalValue);
            console.log(`🔒 ${key}: ${maskKey(originalValue)} → [CRIPTOGRAFADO]`);
            console.log(`   Valor criptografado: ${encrypted}`);
            console.log(`   Configure no Railway: ${key}=${encrypted}`);
        } else if (originalValue) {
            console.log(`✅ ${key}: Já está criptografado`);
        } else {
            console.log(`⚠️ ${key}: Não encontrado`);
        }
    }
}

migrateKeys();
```

## 🛡️ Implementação Passo a Passo no Railway

### Opção A: Migração Gradual (Mais Segura)

#### 1. Preparação Local
```bash
# Clone o repositório
git clone seu_repo
cd cv-sem-frescura

# Instale dependências
cd backend
npm install

# Teste o sistema de criptografia
node scripts/encrypt-env.js encrypt env.local.example
```

#### 2. Backup das Chaves Atuais
```bash
# No Railway Dashboard, vá em Variables
# Copie TODAS as variáveis de ambiente atuais
# Salve em .env.railway.backup
```

#### 3. Geração da Chave de Criptografia
```bash
# Gere uma chave segura de 32 caracteres
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 4. Configuração no Railway
```bash
# 1. Adicione a chave de criptografia PRIMEIRO
ENCRYPTION_KEY=sua_chave_gerada_acima

# 2. Adicione a configuração de produção
NODE_ENV=production
LOG_LEVEL=error

# 3. Mantenha as chaves originais por enquanto (backup)
```

#### 5. Deploy e Teste
```bash
# 1. Faça deploy do código atualizado
git push

# 2. Verifique os logs do Railway
# 3. Teste se a aplicação está funcionando

# 4. Execute migração das chaves uma por vez
```

#### 6. Migração das Chaves (Uma por vez)
```bash
# Para cada chave, faça localmente:
echo "sk_live_sua_chave_real" | node -e "
const { encrypt } = require('./backend/utils/encryption');
const key = require('fs').readFileSync(0, 'utf8').trim();
console.log('Valor criptografado:', encrypt(key));
"

# Depois substitua no Railway Dashboard
STRIPE_SECRET_KEY=[valor_criptografado]
```

### Opção B: Migração Completa (Mais Rápida)

#### Script de Migração Automática:

```bash
# 1. Crie arquivo com chaves atuais
cat > .env.production << EOF
STRIPE_SECRET_KEY=sua_chave_atual
STRIPE_PUBLISHABLE_KEY=sua_chave_atual  
OPENAI_API_KEY=sua_chave_atual
JWT_SECRET=sua_chave_atual
EOF

# 2. Criptografe tudo
cd backend
node scripts/encrypt-env.js encrypt ../.env.production

# 3. O arquivo .env.production.encrypted terá todas as chaves criptografadas
# 4. Copie os valores para o Railway
```

## 🔍 Verificação e Monitoramento

### 1. Verificar Funcionamento

Após a migração, verifique:

```bash
# Logs do Railway devem mostrar:
✅ [PRODUÇÃO] Chaves do Stripe configuradas
🔑 [PRODUÇÃO] SecretKey válida: true
🔑 [PRODUÇÃO] PublishableKey válida: true

# E NÃO devem mostrar:
❌ Chaves em texto plano
❌ Logs detalhados em produção
```

### 2. Script de Verificação

```javascript
// Para executar no Railway (console ou deploy temporário)
console.log('🔍 Verificando segurança...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Encryption Key presente:', !!process.env.ENCRYPTION_KEY);
console.log('Stripe Secret válida:', process.env.STRIPE_SECRET_KEY?.startsWith('sk_') || 'CRIPTOGRAFADO');
console.log('OpenAI Key válida:', process.env.OPENAI_API_KEY?.startsWith('sk-') || 'CRIPTOGRAFADO');
```

## 🚨 Plano de Rollback

Se algo der errado:

### 1. Rollback Imediato
```bash
# No Railway Dashboard:
# 1. Restaure as variáveis do backup
# 2. Remova ENCRYPTION_KEY temporariamente
# 3. Faça redeploy se necessário
```

### 2. Verificação de Integridade
```bash
# Teste todas as funcionalidades:
# - Login de usuários
# - Pagamentos Stripe  
# - Análise de CV (OpenAI)
# - Envio de emails
```

## 📋 Checklist Final

### Antes da Migração
- [ ] Backup de todas as variáveis atuais
- [ ] Código de segurança commitado e testado
- [ ] Chave de criptografia gerada
- [ ] Plano de rollback definido

### Durante a Migração  
- [ ] ENCRYPTION_KEY configurada
- [ ] NODE_ENV=production
- [ ] Chaves criptografadas uma por vez
- [ ] Teste após cada chave migrada

### Após a Migração
- [ ] Todos os serviços funcionando
- [ ] Logs sanitizados
- [ ] Chaves mascaradas nos logs
- [ ] Backup das chaves originais seguro
- [ ] Documentação atualizada

## 🔄 Manutenção Contínua

### Rotina de Segurança
```bash
# Semanal: Verificar logs
railway logs --tail 100 | grep -i error

# Mensal: Limpar logs
railway run node scripts/clean-logs.js

# Trimestral: Rotacionar chaves
# 1. Gerar novas chaves na Stripe/OpenAI
# 2. Criptografar novas chaves
# 3. Atualizar no Railway
# 4. Revogar chaves antigas
```

---

**⚠️ IMPORTANTE:** 
- Mantenha sempre backup das chaves originais em local seguro
- Teste cada etapa em ambiente de desenvolvimento primeiro
- Monitore logs após cada mudança
- Tenha plano de rollback sempre pronto 