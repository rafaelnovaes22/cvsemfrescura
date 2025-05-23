# ✅ CHECKLIST DE DEPLOY - CV SEM FRESCURA

## 🧪 FASE 1: VALIDAÇÃO COM STRIPE TEST

### Configuração de Ambiente de Teste
- [ ] Criar arquivo `.env` baseado no `env.example`
- [ ] Configurar `JWT_SECRET` (mínimo 32 caracteres aleatórios)
- [ ] Configurar `STRIPE_SECRET_KEY` (chave de TESTE: sk_test_...)
- [ ] Configurar `STRIPE_PUBLISHABLE_KEY` (chave de TESTE: pk_test_...)
- [ ] Configurar `OPENAI_API_KEY`
- [ ] Configurar `DATABASE_URL` (PostgreSQL)
- [ ] Definir `NODE_ENV=development`
- [ ] Definir `FRONTEND_URL=http://localhost:3000`

### Testes de Pagamento
- [ ] Testar cartão de sucesso: `4242 4242 4242 4242`
- [ ] Testar cartão de falha: `4000 0000 0000 0002`
- [ ] Verificar criação de PaymentIntent
- [ ] Verificar adição de créditos após pagamento
- [ ] Testar fluxo completo: registro → análise → pagamento → nova análise

### Validação Funcional
- [ ] Registro de usuário funcionando
- [ ] Login funcionando
- [ ] Upload de currículo funcionando
- [ ] Análise ATS funcionando
- [ ] Sistema de créditos funcionando
- [ ] Health check respondendo (`/health`)

## 🚨 FASE 2: DEPLOY PRODUÇÃO (Apenas após validação completa)

### Configuração de Ambiente de Produção
- [ ] Alterar `STRIPE_SECRET_KEY` para chave de produção (sk_live_...)
- [ ] Alterar `STRIPE_PUBLISHABLE_KEY` para chave de produção (pk_live_...)
- [ ] Configurar `STRIPE_WEBHOOK_SECRET` (se usando webhooks)
- [ ] Definir `NODE_ENV=production`
- [ ] Definir `FRONTEND_URL` com domínio real
- [ ] Configurar banco PostgreSQL de produção

### Stripe Produção
- [ ] Conta Stripe ativa e verificada
- [ ] Chaves de produção configuradas
- [ ] Webhooks configurados (opcional)
- [ ] Teste com cartão real (valor baixo)

## ⚠️ IMPORTANTE - VERIFICAÇÕES

### Segurança
- [ ] JWT_SECRET configurado (sem fallback)
- [ ] Rate limiting ativo
- [ ] Headers de segurança (Helmet)
- [ ] CORS configurado para domínio específico

### Monitoramento
- [ ] Logs funcionando (`/backend/logs/`)
- [ ] Health check acessível (`/health`)
- [ ] Diretório de logs criado

## 🔧 COMANDOS DE VALIDAÇÃO

```bash
# 1. Instalar dependências
cd backend
npm install

# 2. Configurar ambiente de TESTE
cp ../env.example .env
# Editar .env com chaves de TESTE do Stripe

# 3. Testar localmente
npm start

# 4. Verificar health check
curl http://localhost:3000/health

# 5. Testar fluxo completo no navegador
# - Registrar usuário
# - Fazer análise
# - Testar pagamento com cartão teste
```

## 🔧 COMANDOS DE PRODUÇÃO

```bash
# Apenas após validação completa!

# 1. Atualizar .env para produção
# Alterar chaves Stripe para sk_live_ e pk_live_
# Alterar NODE_ENV=production
# Alterar FRONTEND_URL para domínio real

# 2. Deploy com PM2
npm install -g pm2
pm2 start server.js --name "cv-sem-frescura"
pm2 save
pm2 startup
```

## 🧪 TESTES PÓS-DEPLOY

### Cartões de Teste Stripe
- [ ] **Sucesso**: `4242 4242 4242 4242`
- [ ] **Falha**: `4000 0000 0000 0002`
- [ ] **Requer autenticação**: `4000 0025 0000 3155`
- [ ] **CVV**: qualquer 3 dígitos
- [ ] **Data**: qualquer data futura

### Endpoints Críticos
- [ ] `GET /health` → Status 200
- [ ] `POST /api/user/register` → Registro funciona
- [ ] `POST /api/user/login` → Login funciona
- [ ] `POST /api/ats/analyze` → Análise funciona
- [ ] `POST /api/payment/create-payment-intent` → Pagamento funciona

### Fluxo Completo
- [ ] Acessar landing page
- [ ] Registrar usuário
- [ ] Fazer login
- [ ] Upload de currículo
- [ ] Análise ATS completa
- [ ] Compra de créditos (TESTE primeiro!)
- [ ] Histórico de análises

## 🚨 MONITORAMENTO PÓS-DEPLOY

### Primeiras 24h
- [ ] Verificar logs de erro (`tail -f backend/logs/error.log`)
- [ ] Monitorar health check
- [ ] Verificar uso de recursos (CPU/RAM)
- [ ] Testar todos os fluxos principais

### Métricas Importantes
- [ ] Taxa de erro < 1%
- [ ] Tempo de resposta < 5s para análises
- [ ] Uptime > 99%
- [ ] Pagamentos processando corretamente

## 📞 CONTATOS DE EMERGÊNCIA

### Problemas Críticos
1. **Servidor não responde**: Verificar PM2 (`pm2 status`)
2. **Erro de banco**: Verificar conexão PostgreSQL
3. **Pagamentos falhando**: Verificar chaves Stripe
4. **IA não funciona**: Verificar chave OpenAI

### Comandos de Emergência
```bash
# Reiniciar aplicação
pm2 restart cv-sem-frescura

# Ver logs em tempo real
pm2 logs cv-sem-frescura

# Status da aplicação
pm2 status

# Verificar saúde
curl https://seudominio.com/health
```

---

**⏰ Tempo estimado:**
- **Validação (Fase 1)**: 1-2 horas
- **Deploy Produção (Fase 2)**: 1 hora

**🎯 Meta: Validação completa hoje, produção amanhã** 