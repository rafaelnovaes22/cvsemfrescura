# 🚀 VALIDAÇÃO HOJE - GUIA RÁPIDO

## ⚡ Objetivo: Validar fluxo completo com Stripe Test em 2 horas

### 🎯 Checklist Rápido (30 min)

1. **Configurar .env**
```bash
cd backend
cp ../env.example .env
```

2. **Editar .env com suas chaves reais:**
```env
# Banco (seu PostgreSQL local ou remoto)
DATABASE_URL=postgresql://seu_usuario:sua_senha@localhost:5432/cvsemfrescura

# JWT (gerar uma chave aleatória)
JWT_SECRET=sua_chave_jwt_super_secreta_minimo_32_caracteres_aqui

# OpenAI (sua chave real)
OPENAI_API_KEY=sk-sua_chave_openai_real

# Stripe - CHAVES DE TESTE
STRIPE_SECRET_KEY=sk_test_sua_chave_stripe_teste
STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_stripe_teste

# Desenvolvimento
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000
```

3. **Instalar e rodar**
```bash
npm install
npm start
```

### 🧪 Testes Obrigatórios (1h)

#### 1. Health Check (2 min)
```bash
curl http://localhost:3000/health
# Deve retornar: {"status":"ok",...}
```

#### 2. Fluxo Completo (30 min)
1. Abrir `http://localhost:3000`
2. Registrar novo usuário
3. Fazer login
4. Upload de um currículo (PDF)
5. Adicionar link de vaga
6. Executar análise ATS
7. Ver resultados

#### 3. Teste de Pagamento (30 min)
1. Tentar fazer nova análise (deve pedir créditos)
2. Ir para página de pagamento
3. Usar cartão de teste: `4242 4242 4242 4242`
4. CVV: `123`, Data: `12/25`
5. Confirmar pagamento
6. Verificar se créditos foram adicionados
7. Fazer nova análise com os créditos

### 🎯 Cartões de Teste Stripe

| Cenário | Número do Cartão | Resultado |
|---------|------------------|-----------|
| ✅ Sucesso | `4242 4242 4242 4242` | Pagamento aprovado |
| ❌ Falha | `4000 0000 0000 0002` | Cartão recusado |
| 🔐 Autenticação | `4000 0025 0000 3155` | Requer 3D Secure |

**CVV**: Qualquer 3 dígitos  
**Data**: Qualquer data futura

### 🚨 Problemas Comuns

#### "JWT_SECRET não configurado"
- Adicione uma chave aleatória de 32+ caracteres no .env

#### "STRIPE_SECRET_KEY não configurada"
- Verifique se colocou a chave de teste (sk_test_...)

#### "Erro de conexão com banco"
- Verifique se PostgreSQL está rodando
- Teste: `psql postgresql://usuario:senha@host:5432/database`

#### "OpenAI API error"
- Verifique se a chave OpenAI está correta
- Verifique se tem créditos na conta OpenAI

### ✅ Critérios de Sucesso

- [ ] Health check responde OK
- [ ] Usuário consegue se registrar e logar
- [ ] Upload de currículo funciona
- [ ] Análise ATS retorna resultados
- [ ] Pagamento com cartão teste funciona
- [ ] Créditos são adicionados após pagamento
- [ ] Nova análise funciona com créditos

### 🎯 Próximos Passos (Amanhã)

Após validação completa:
1. Alterar chaves Stripe para produção (sk_live_...)
2. Configurar domínio real
3. Deploy em servidor
4. Testes finais em produção

---

**⏰ Meta: Validação completa até o final do dia**  
**🚀 Produção: Amanhã pela manhã** 