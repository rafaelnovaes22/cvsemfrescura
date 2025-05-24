# 🔑 CONFIGURAR CHAVES STRIPE - GUIA RÁPIDO

## 📍 Onde Configurar

### 1. **Backend** (arquivo `.env`)
```env
# Chaves de TESTE (para validação)
STRIPE_SECRET_KEY=sk_test_sua_chave_secreta_aqui
STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_publica_aqui
```

### 2. **Frontend** (arquivo `frontend/assets/js/config.js`)
```javascript
stripe: {
  // CHAVES DE TESTE (para validação)
  test: {
    publishableKey: 'pk_test_sua_chave_publica_aqui'
  },
  // CHAVES DE PRODUÇÃO (apenas após validação)
  production: {
    publishableKey: 'pk_live_sua_chave_publica_aqui'
  }
}
```

## 🎯 Passos para Configurar

### 1. **Obter Chaves do Stripe**
1. Acesse: https://dashboard.stripe.com/
2. Vá em **Developers > API keys**
3. Copie as chaves de **TEST** (não as de produção ainda!)

### 2. **Configurar Backend**
Edite o arquivo `backend/.env`:
```env
STRIPE_SECRET_KEY=sk_test_SUA_CHAVE_SECRETA_AQUI
STRIPE_PUBLISHABLE_KEY=pk_test_SUA_CHAVE_PUBLICA_AQUI
```

### 3. **Configurar Frontend**
Edite o arquivo `frontend/assets/js/config.js`:
```javascript
test: {
  publishableKey: 'pk_test_SUA_CHAVE_PUBLICA_AQUI'
}
```

### 4. **Verificar Configuração**
```bash
# Reiniciar servidor
cd backend
npm start

# Testar health check
curl http://localhost:3000/health
```

## ✅ **Nomenclatura Correta**

| Tipo | Formato | Onde Usar |
|------|---------|-----------|
| **Secret Key** | `sk_test_...` | Backend (.env) |
| **Publishable Key** | `pk_test_...` | Frontend (config.js) |

## 🚨 **Importante**

- ✅ Use **SEMPRE** chaves de teste primeiro (`sk_test_` e `pk_test_`)
- ✅ As chaves devem ser **iguais** no backend e frontend
- ✅ Só mude para produção após validação completa
- ❌ **NUNCA** commite chaves reais no Git

## 🧪 **Testar Configuração**

Após configurar, teste com cartão de teste:
- **Número**: `4242 4242 4242 4242`
- **CVV**: `123`
- **Data**: `12/25`

---

**🎯 Próximo passo**: Configurar suas chaves e testar o pagamento! 