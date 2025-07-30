# 🚨 AÇÕES DE SEGURANÇA URGENTES

## ⚠️ AVISO: CHAVE SENDGRID COMPROMETIDA

Uma chave API do SendGrid foi exposta no repositório. **AÇÃO IMEDIATA NECESSÁRIA:**

### 1. ROTACIONAR CHAVE SENDGRID AGORA

1. Acesse sua conta SendGrid: https://app.sendgrid.com/
2. Vá em Settings → API Keys
3. **REVOGUE** a chave comprometida: `SG.QWjjUWZ_RIunLAQEwOCtcQ...`
4. Crie uma **NOVA** chave API
5. Configure a nova chave como variável de ambiente: `SMTP_PASS`

### 2. CONFIGURAR VARIÁVEIS DE AMBIENTE

Crie um arquivo `.env` na pasta `backend/` com as seguintes variáveis:

```bash
# Banco de Dados
DATABASE_URL=postgresql://seu_usuario:sua_senha@localhost:5432/seu_banco

# Segurança
JWT_SECRET=gere_32_caracteres_aleatorios_aqui

# APIs
OPENAI_API_KEY=sua_chave_openai
SMTP_PASS=sua_NOVA_chave_sendgrid

# Stripe (use chaves de teste primeiro)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. GERAR JWT SECRET SEGURO

Execute este comando para gerar um JWT secret seguro:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. ATUALIZAR PRODUÇÃO

Se o sistema está em produção:

1. **Railway/Heroku**: Atualize as variáveis de ambiente IMEDIATAMENTE
2. **Docker**: Reconstrua as imagens após atualizar as variáveis
3. **Servidor**: Reinicie todos os serviços

### 5. VERIFICAR LOGS

Verifique se a chave comprometida foi usada:

1. Check logs do SendGrid para atividade suspeita
2. Verifique logs do servidor para acessos não autorizados
3. Monitore tentativas de uso da chave antiga

### 6. IMPLEMENTAR BOAS PRÁTICAS

Para evitar futuros problemas:

1. **NUNCA** commite credenciais no código
2. Use **sempre** variáveis de ambiente
3. Adicione `.env` ao `.gitignore`
4. Use ferramentas como `git-secrets` para prevenir commits acidentais
5. Revise todos os PRs para verificar secrets

### 7. USAR O SANITIZADOR

Para prevenir XSS, use o novo sanitizador em todo innerHTML:

```javascript
// Incluir o sanitizador
<script src="/assets/js/utils/sanitizer.js"></script>

// Usar para conteúdo dinâmico
element.innerHTML = Sanitizer.sanitizeHtml(conteudoDinamico);

// Para texto simples
element.textContent = conteudo; // Sempre seguro
```

## 📋 Checklist de Segurança

- [ ] Chave SendGrid revogada e nova criada
- [ ] Variáveis de ambiente configuradas
- [ ] JWT Secret forte gerado
- [ ] Produção atualizada com novas credenciais
- [ ] Logs verificados para atividade suspeita
- [ ] `.env` adicionado ao `.gitignore`
- [ ] Equipe notificada sobre o incidente
- [ ] Sanitizador implementado em todo o código

## 🔒 Próximos Passos

1. Implementar auditoria de segurança regular
2. Configurar scanning automático de secrets
3. Treinar equipe em segurança
4. Implementar 2FA para serviços críticos
5. Configurar alertas de segurança

---

**LEMBRE-SE**: A segurança é responsabilidade de todos. Sempre revise seu código antes de commitar!