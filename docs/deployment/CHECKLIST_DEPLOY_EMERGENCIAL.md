# 🚨 CHECKLIST DEPLOY EMERGENCIAL - AMANHÃ

## ⏰ **CRONOGRAMA DE HOJE (8 horas)**

### 🌅 **MANHÃ (4 horas)**

#### **1. PREPARAÇÃO (1 hora)**
- [ ] **Verificar servidor de produção**
  - [ ] Acesso SSH funcionando
  - [ ] Docker e Docker Compose instalados
  - [ ] Portas 80 e 443 abertas
  - [ ] Domínio apontando para o servidor

- [ ] **Configurar variáveis de ambiente**
  ```bash
  cp env.production.example .env.production
  # Editar .env.production com:
  # - OPENAI_API_KEY (real)
  # - STRIPE_SECRET_KEY (live)
  # - STRIPE_PUBLISHABLE_KEY (live)
  # - JWT_SECRET (gerar novo)
  # - DB_PASSWORD (segura)
  # - FRONTEND_URL (domínio real)
  ```

#### **2. SEGURANÇA BÁSICA (2 horas)**
- [ ] **Executar script de deploy emergencial**
  ```bash
  chmod +x scripts/deploy-emergency.sh
  ./scripts/deploy-emergency.sh
  ```

- [ ] **Configurar SSL com Let's Encrypt**
  ```bash
  sudo certbot --nginx -d seudominio.com
  ```

- [ ] **Testar HTTPS**
  - [ ] Redirecionamento HTTP → HTTPS
  - [ ] Certificado válido
  - [ ] Security headers funcionando

#### **3. MONITORAMENTO (1 hora)**
- [ ] **Configurar monitoramento básico**
  ```bash
  chmod +x scripts/setup-monitoring.sh
  ./scripts/setup-monitoring.sh
  ```

- [ ] **Configurar Sentry (opcional)**
  - [ ] Criar conta no Sentry
  - [ ] Adicionar DSN ao .env.production
  - [ ] Testar error tracking

### 🌞 **TARDE (4 horas)**

#### **4. BACKUP (1 hora)**
- [ ] **Configurar backup automatizado**
  ```bash
  chmod +x scripts/setup-backup.sh
  ./scripts/setup-backup.sh
  ```

- [ ] **Testar backup e restore**
  ```bash
  ./scripts/backup.sh
  ./scripts/restore.sh
  ```

#### **5. TESTES DE PRODUÇÃO (2 horas)**
- [ ] **Verificar funcionalidades críticas**
  - [ ] Landing page carregando
  - [ ] Upload de CV funcionando
  - [ ] Análise OpenAI funcionando
  - [ ] Sistema de pagamento Stripe
  - [ ] Autenticação de usuários
  - [ ] Recuperação de senha

- [ ] **Testes de carga básicos**
  ```bash
  # Teste simples com curl
  for i in {1..10}; do curl -s http://seudominio.com/health; done
  ```

#### **6. DOCUMENTAÇÃO E HANDOVER (1 hora)**
- [ ] **Documentar configurações específicas**
- [ ] **Criar runbook de operação**
- [ ] **Configurar alertas críticos**

---

## 🎯 **COMANDOS ESSENCIAIS PARA AMANHÃ**

### **Deploy Completo (1 comando)**
```bash
./scripts/deploy-emergency.sh
```

### **Verificação Rápida**
```bash
# Status geral
./scripts/dashboard.sh

# Health check
./scripts/health-check.sh

# Logs em tempo real
docker compose -f docker-compose.prod.yml logs -f
```

### **Backup de Emergência**
```bash
# Backup manual
./scripts/backup.sh

# Restore se necessário
./scripts/restore.sh
```

---

## ⚠️ **RISCOS E MITIGAÇÕES**

### **RISCO ALTO**
| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **SSL não funcionar** | Médio | Alto | Usar HTTP temporariamente + configurar SSL depois |
| **Chaves API inválidas** | Baixo | Crítico | Testar todas as integrações antes do deploy |
| **Banco corrompido** | Baixo | Crítico | Backup antes de qualquer mudança |

### **RISCO MÉDIO**
| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Performance baixa** | Médio | Médio | Monitorar recursos + otimizar depois |
| **Logs não funcionando** | Baixo | Médio | Configurar logs básicos primeiro |

---

## 🚀 **PLANO B (Se algo der errado)**

### **Se SSL falhar:**
1. Usar HTTP temporariamente
2. Configurar SSL depois do deploy
3. Comunicar usuários sobre HTTP temporário

### **Se banco falhar:**
1. Usar backup mais recente
2. Recriar banco do zero se necessário
3. Importar dados essenciais manualmente

### **Se aplicação não subir:**
1. Verificar logs: `docker compose logs`
2. Verificar variáveis de ambiente
3. Usar versão de desenvolvimento temporariamente

---

## ✅ **CRITÉRIOS DE SUCESSO**

### **MÍNIMO VIÁVEL (MVP)**
- [ ] ✅ Aplicação acessível via HTTPS
- [ ] ✅ Funcionalidades principais funcionando
- [ ] ✅ Backup configurado
- [ ] ✅ Monitoramento básico ativo

### **IDEAL**
- [ ] ✅ SSL A+ rating
- [ ] ✅ Todos os testes passando
- [ ] ✅ Alertas configurados
- [ ] ✅ Performance < 2s

---

## 📞 **CONTATOS DE EMERGÊNCIA**

### **Serviços Críticos**
- **Domínio/DNS**: [Provedor do domínio]
- **Servidor**: [Provedor do servidor]
- **OpenAI**: support@openai.com
- **Stripe**: support@stripe.com

### **Ferramentas de Suporte**
- **SSL Test**: https://www.ssllabs.com/ssltest/
- **Uptime Check**: https://uptimerobot.com
- **Speed Test**: https://pagespeed.web.dev

---

## 🎉 **PÓS-DEPLOY**

### **Primeiras 24 horas**
- [ ] Monitorar logs continuamente
- [ ] Verificar métricas de performance
- [ ] Testar todas as funcionalidades
- [ ] Comunicar sucesso do deploy

### **Primeira semana**
- [ ] Implementar testes automatizados
- [ ] Otimizar performance
- [ ] Configurar alertas avançados
- [ ] Documentar lições aprendidas

---

## 🚨 **LEMBRETE FINAL**

**ANTES DE COMEÇAR:**
1. ☕ Café forte
2. 📱 Telefone carregado
3. 💻 Backup do código local
4. 🧘 Respirar fundo

**DURANTE O DEPLOY:**
- 📝 Documentar tudo
- 🔍 Testar cada passo
- 💾 Backup antes de mudanças
- 🆘 Pedir ajuda se necessário

**APÓS O DEPLOY:**
- 🎉 Comemorar (mas não muito)
- 📊 Monitorar por 24h
- 📋 Documentar melhorias
- 🔄 Planejar próximas iterações

---

**🎯 OBJETIVO: Aplicação funcionando em produção até o final do dia!** 