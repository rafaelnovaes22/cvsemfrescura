# 🚀 Guia de Integração Stripe - CV Sem Frescura

## 📋 Visão Geral

Este documento descreve a integração completa do sistema de pagamentos utilizando o Stripe, incluindo suporte para:
- 💳 **Cartão de Crédito/Débito**
- 🔲 **PIX** (Pagamento instantâneo brasileiro)  
- 🧾 **Boleto Bancário**

## 🔧 Configuração

### 1. Variáveis de Ambiente

Certifique-se de que seu arquivo `.env` contém:

```bash
# Stripe - Chaves de Teste
STRIPE_SECRET_KEY=sk_test_sua_chave_aqui
STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_aqui
STRIPE_WEBHOOK_SECRET=whsec_sua_chave_aqui

# Outras configurações necessárias
NODE_ENV=development
PORT=3000
```

### 2. Frontend - Configuração

O arquivo `frontend/assets/js/config.js` já está configurado para usar as chaves do Stripe:

```javascript
// A chave pública está configurada no config.js
const stripeKey = getStripeKey(); // Retorna a chave baseada no ambiente
```

### 3. Backend - Configuração

O backend já está integrado com Stripe no `backend/controllers/paymentController.js`:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

## 🧪 Teste da Integração

### Executar Teste Automático

```bash
# No diretório raiz do projeto
node test-stripe-integration.js
```

Este script irá:
- ✅ Verificar se as chaves estão configuradas
- ✅ Testar conexão com a API do Stripe
- ✅ Criar PaymentIntents para todos os métodos de pagamento
- ✅ Validar funcionalidade de PIX e Boleto

### Iniciar os Serviços

1. **Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend:**
   ```bash
   cd frontend
   python -m http.server 8000
   ```

3. **Acessar:**
   - Frontend: http://localhost:8000
   - Backend API: http://localhost:3000

## 💳 Cartões de Teste

Use estes cartões para testar no ambiente de desenvolvimento:

| Resultado | Número do Cartão | CVV | Data |
|-----------|------------------|-----|------|
| ✅ Sucesso | 4242 4242 4242 4242 | Qualquer | Futura |
| ❌ Falha | 4000 0000 0000 0002 | Qualquer | Futura |
| 🔍 Requer SCA | 4000 0025 0000 3155 | Qualquer | Futura |

## 🔲 PIX - Funcionamento

### Como Funciona
1. Cliente seleciona PIX como método de pagamento
2. Backend cria PaymentIntent com `payment_method_types: ['pix']`
3. Stripe gera QR Code e código PIX
4. Frontend exibe QR Code para escaneamento
5. Cliente paga via app do banco
6. Webhook confirma pagamento automaticamente

### Dados Retornados
```javascript
{
  clientSecret: "pi_xxx_secret_xxx",
  pixData: {
    qr_code: "00020126....", // Código PIX para copiar
    qr_code_url: "https://...", // URL da imagem QR Code
    expires_at: 1645123456 // Timestamp de expiração
  }
}
```

## 🧾 Boleto - Funcionamento

### Como Funciona
1. Cliente preenche dados pessoais e endereço
2. Backend cria PaymentIntent com `payment_method_types: ['boleto']`
3. Stripe gera boleto bancário
4. Frontend exibe código de barras e link para PDF
5. Cliente paga no banco/app bancário
6. Webhook confirma pagamento (pode levar até 3 dias úteis)

### Dados Necessários
```javascript
{
  taxId: "12345678909", // CPF/CNPJ
  name: "Nome Completo",
  email: "email@exemplo.com",
  address: "Rua das Flores, 123",
  city: "São Paulo",
  state: "SP",
  postalCode: "01234567"
}
```

## 🔄 Fluxo de Pagamento

### 1. Criação do Pagamento
```
Frontend → POST /api/payment/create-intent
├── Dados do plano (preço, créditos)
├── Método de pagamento (card/pix/boleto)
└── Dados adicionais (para PIX/Boleto)
```

### 2. Processamento
```
Backend → Stripe API
├── Cria PaymentIntent
├── Configura método específico
└── Retorna client_secret + dados extras
```

### 3. Confirmação
```
Frontend → Stripe Elements (cartão)
Frontend → QR Code/Boleto (PIX/Boleto)
Webhook → Backend → Atualiza créditos
```

## 🪝 Webhooks

### Configuração
1. No painel do Stripe, configure webhook para: `https://seudominio.com/api/payment/webhook`
2. Eventos importantes:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

### Processamento Automático
O webhook automaticamente:
- ✅ Confirma pagamentos bem-sucedidos
- ✅ Adiciona créditos ao usuário
- ✅ Atualiza status da transação
- ❌ Marca pagamentos falhados

## 🛠️ Estrutura de Arquivos

```
├── frontend/
│   ├── assets/js/
│   │   ├── config.js          # Configuração Stripe frontend
│   │   └── payment.js         # Lógica de pagamento
│   └── payment.html           # Interface de pagamento
├── backend/
│   ├── controllers/
│   │   └── paymentController.js  # Controller de pagamentos
│   ├── routes/
│   │   └── payment.js            # Rotas de pagamento
│   └── models/
│       └── Transaction.js        # Modelo de transação
├── test-stripe-integration.js    # Script de teste
└── .env                          # Variáveis de ambiente
```

## 🚨 Segurança

### ✅ Boas Práticas Implementadas
- Chaves secretas apenas no backend
- Validação de webhooks com assinatura
- HTTPS obrigatório em produção
- Sanitização de dados de entrada
- Rate limiting nas APIs

### ⚠️ Importante
- Nunca expor chaves secretas no frontend
- Sempre validar dados no backend
- Usar HTTPS em produção
- Configurar webhooks corretamente
- Monitorar transações suspeitas

## 🐛 Solução de Problemas

### Erro: "Stripe not initialized"
- Verificar se `getStripeKey()` retorna uma chave válida
- Confirmar se a chave está no formato correto (`pk_test_...`)

### Erro: "PaymentIntent creation failed"
- Verificar se a chave secreta está configurada no backend
- Confirmar se a conta Stripe está ativa

### PIX/Boleto não funciona
- Verificar se a conta Stripe suporta métodos brasileiros
- Confirmar configuração da conta para BRL

### Webhook não recebe eventos
- Verificar URL do webhook no painel Stripe
- Confirmar se o endpoint está acessível publicamente
- Verificar logs do servidor para erros de processamento

## 📊 Monitoramento

### Logs Importantes
```bash
# Backend - Pagamentos
[PAYMENT] 🎯 Criando pagamento: pix - R$ 20.00 - 1 créditos
[PAYMENT] ✅ PaymentIntent criado: pi_xxx
[PAYMENT] 💾 Transação salva no banco: 123

# Stripe - Webhooks  
[WEBHOOK] payment_intent.succeeded: pi_xxx
[WEBHOOK] Créditos atualizados: usuário 456 → 10 créditos
```

### Dashboard Stripe
- Monitore transações em: https://dashboard.stripe.com/payments
- Configure alertas para falhas de pagamento
- Acompanhe métricas de conversão

## 🎯 Próximos Passos

1. ✅ **Teste em Desenvolvimento**
   - Execute `node test-stripe-integration.js`
   - Teste todos os métodos de pagamento
   - Valide webhook com ngrok ou similar

2. 🚀 **Preparação para Produção**
   - Ative conta Stripe para produção
   - Configure chaves de produção
   - Configure webhooks de produção
   - Teste em ambiente de staging

3. 📈 **Otimizações**
   - Implementar retry automático para falhas
   - Adicionar analytics de pagamento
   - Configurar alertas de monitoramento
   - Otimizar UX do fluxo de pagamento

---

**✨ Sistema de pagamentos integrado e pronto para uso!** 