# Configuração Stripe - Produção

## Variáveis de Ambiente Necessárias

```env
# Stripe Production Keys
STRIPE_SECRET_KEY=rk_live_xxxxxxxxxxxxxxxxx    # Chave restrita de produção
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxx      # Chave pública para frontend
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxx         # Secret do webhook de produção

# Configurações Regionais
STRIPE_CURRENCY=BRL                            # Moeda brasileira
STRIPE_COUNTRY=BR                              # País Brasil

# Webhook Endpoints
STRIPE_WEBHOOK_PAYMENT_SUCCESS=/api/webhooks/stripe/payment-success
STRIPE_WEBHOOK_PAYMENT_FAILED=/api/webhooks/stripe/payment-failed
STRIPE_WEBHOOK_SUBSCRIPTION_UPDATED=/api/webhooks/stripe/subscription-updated

# Configurações de Pagamento
STRIPE_CAPTURE_METHOD=automatic                # Captura automática
STRIPE_CONFIRMATION_METHOD=automatic           # Confirmação automática
STRIPE_API_VERSION=2023-10-16                  # Versão da API fixa
```

## Permissões da Chave Restrita

### Essenciais para Pagamentos:
- ✅ Charges (Read & Write)
- ✅ Payment Intents (Read & Write)  
- ✅ Payment Methods (Read & Write)
- ✅ Customers (Read & Write)
- ✅ Refunds (Read & Write)

### Para Recursos Avançados:
- ✅ Subscriptions (Read & Write) - Se usar assinaturas
- ✅ Setup Intents (Read & Write) - Para salvar cartões
- ✅ Invoices (Read & Write) - Para faturas
- ✅ Products/Prices (Read) - Para catálogo
- ✅ Coupons (Read) - Para descontos

### Para Monitoramento:
- ✅ Balance (Read)
- ✅ Balance Transactions (Read)
- ✅ Events (Read)
- ✅ Disputes (Read)

## Configurações de Segurança

1. **IP Whitelist**: Adicionar IP do servidor Railway
2. **Rate Limits**: Aceitar padrão (1000 req/sec)
3. **Webhook Signature**: Sempre validar assinatura
4. **HTTPS Only**: Certificar que todos endpoints usam HTTPS 