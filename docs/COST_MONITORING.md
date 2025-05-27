# 💰 Sistema de Monitoramento de Custos das APIs

## 📋 **Visão Geral**

O sistema de monitoramento de custos do CV Sem Frescura rastreia automaticamente todos os gastos com APIs externas, fornecendo insights em tempo real e alertas proativos para evitar surpresas na fatura.

## 🎯 **Funcionalidades Principais**

### ✅ **Tracking Automático**
- **OpenAI**: GPT-4, GPT-3.5-turbo, embeddings
- **Claude**: Sonnet, Opus, Haiku
- **SendGrid**: Emails transacionais
- **Stripe**: Taxas de transação

### 📊 **Métricas Coletadas**
- Custos diários e mensais
- Tokens consumidos por modelo
- Número de chamadas por API
- Projeções baseadas no uso atual
- Estimativa de esgotamento do orçamento

### 🚨 **Sistema de Alertas**
- Limites diários e mensais configuráveis
- Alertas por email e webhooks
- Notificações visuais no dashboard
- Cooldown para evitar spam

## 🔧 **Configuração**

### **Variáveis de Ambiente**

```bash
# Limites de custo (USD)
DAILY_COST_LIMIT=10.00          # Limite diário ($10)
MONTHLY_COST_LIMIT=200.00       # Limite mensal ($200)

# Alertas por email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
FROM_EMAIL=noreply@cvsemfrescura.com.br
ALERT_EMAIL=admin@cvsemfrescura.com.br

# Webhooks (opcional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### **Preços das APIs (2025)**

```javascript
const API_COSTS = {
  openai: {
    'gpt-4': {
      input: 0.03 / 1000,    // $0.03 per 1K tokens
      output: 0.06 / 1000    // $0.06 per 1K tokens
    },
    'gpt-3.5-turbo': {
      input: 0.0015 / 1000,  // $0.0015 per 1K tokens
      output: 0.002 / 1000   // $0.002 per 1K tokens
    }
  },
  claude: {
    'claude-3-sonnet': {
      input: 0.003 / 1000,   // $0.003 per 1K tokens
      output: 0.015 / 1000   // $0.015 per 1K tokens
    }
  },
  sendgrid: {
    email: 0.0006 // $0.0006 per email
  },
  stripe: {
    transaction: 0.029, // 2.9%
    fixed_fee: 0.30     // $0.30
  }
};
```

## 📡 **Endpoints da API**

### **Dashboard de Custos**
```http
GET /api/monitoring/costs
```

**Resposta:**
```json
{
  "status": "success",
  "timestamp": "2025-01-27T10:30:00Z",
  "costs": {
    "today": {
      "total": 2.45,
      "limit": 10.00,
      "percentage": 24.5,
      "breakdown": {
        "openai": {
          "total": 2.10,
          "services": {
            "gpt-4": { "total": 2.10, "count": 15 }
          }
        },
        "sendgrid": {
          "total": 0.35,
          "services": {
            "password_reset": { "total": 0.35, "count": 5 }
          }
        }
      }
    },
    "thisMonth": {
      "total": 45.20,
      "limit": 200.00,
      "percentage": 22.6,
      "projected": 180.50,
      "avgDaily": 2.26
    },
    "insights": {
      "dailyBudgetRemaining": 7.55,
      "daysRemainingInMonth": 11,
      "isOnTrack": true,
      "burnRate": "normal"
    }
  },
  "estimation": {
    "status": "normal",
    "daysUntilDepletion": 68,
    "depletionDate": "2025-04-05",
    "message": "Créditos estimados para durar 68 dias"
  }
}
```

### **Histórico de uma API**
```http
GET /api/monitoring/costs/openai/gpt-4?days=7
```

### **Métricas Prometheus**
```http
GET /api/monitoring/metrics
```

## 🎨 **Dashboard Web**

Acesse: `https://cvsemfrescura.com.br/costs-dashboard.html`

### **Recursos do Dashboard:**
- 📊 Métricas em tempo real
- 📈 Gráficos interativos (Chart.js)
- 🚨 Alertas visuais
- 📱 Design responsivo
- 🔄 Auto-refresh (5 minutos)

### **Cartões de Métricas:**
1. **Custo Hoje**: Gasto diário vs limite
2. **Custo Mensal**: Gasto mensal vs limite
3. **Projeção Mensal**: Estimativa baseada no uso
4. **Dias Restantes**: Até esgotar o orçamento

### **Gráficos:**
1. **Distribuição por API**: Doughnut chart
2. **Tendência de Gastos**: Line chart (7 dias)

## 🔍 **Como Usar**

### **1. Monitoramento Básico**

```javascript
// O tracking é automático, mas você pode verificar manualmente:
const { costTracker } = require('./utils/costTracker');

// Obter resumo atual
const summary = costTracker.getCostSummary();
console.log('Custo hoje:', summary.today.total);
console.log('Custo mensal:', summary.thisMonth.total);

// Verificar estimativa
const estimation = costTracker.estimateCreditDepletion();
console.log('Dias restantes:', estimation.daysUntilDepletion);
```

### **2. Tracking Manual**

```javascript
// Rastrear uso do OpenAI
const cost = costTracker.trackOpenAI('gpt-4', 1500, 800);
console.log('Custo da chamada:', cost);

// Rastrear email
costTracker.trackSendGrid(1, 'welcome_email');

// Rastrear pagamento
costTracker.trackStripe(29.90, 'BRL');
```

### **3. Configurar Alertas**

```javascript
// Os alertas são automáticos, mas você pode configurar:
const { alertingSystem } = require('./utils/alerting');

// Processar alerta customizado
alertingSystem.processAlert({
  type: 'custom_warning',
  severity: 'warning',
  message: 'Uso alto detectado',
  timestamp: new Date().toISOString()
});
```

## 🚨 **Sistema de Alertas**

### **Tipos de Alertas:**

1. **Limite Diário (80%)**: ⚠️ Warning
2. **Limite Diário (100%)**: 🚨 Critical
3. **Limite Mensal (80%)**: ⚠️ Warning
4. **Limite Mensal (100%)**: 🚨 Critical
5. **Projeção Acima do Orçamento**: 📈 Warning
6. **Taxa de Consumo Alta**: 🔥 Info

### **Canais de Notificação:**

1. **Email**: HTML profissional com ações recomendadas
2. **Slack**: Webhook com formatação rica
3. **Discord**: Webhook com embeds coloridos
4. **Dashboard**: Alertas visuais em tempo real

### **Exemplo de Email de Alerta:**

```html
🚨 ALERTA DE CUSTO - CV Sem Frescura

Limite mensal próximo (85%)
Custo atual: $170.00 / $200.00

📊 Detalhes:
- OpenAI: $145.20 (85%)
- SendGrid: $24.80 (15%)

🔧 Ações Recomendadas:
1. Revisar uso das APIs
2. Otimizar prompts
3. Considerar aumentar limite
4. Monitorar próximos dias

Dashboard: https://cvsemfrescura.com.br/costs-dashboard.html
```

## 📈 **Otimização de Custos**

### **Dicas para Reduzir Gastos:**

1. **OpenAI/Claude:**
   - Use modelos menores quando possível
   - Otimize prompts para ser mais concisos
   - Implemente cache para respostas similares
   - Use fallback entre modelos

2. **SendGrid:**
   - Agrupe emails quando possível
   - Use templates para reduzir tamanho
   - Implemente rate limiting

3. **Stripe:**
   - Agrupe transações pequenas
   - Negocie taxas para volume alto

### **Monitoramento Proativo:**

```javascript
// Verificar se está no caminho certo
const summary = costTracker.getCostSummary();

if (!summary.insights.isOnTrack) {
  console.log('⚠️ Projeção acima do orçamento!');
  console.log('Ação necessária para otimizar custos');
}

if (summary.insights.burnRate === 'high') {
  console.log('🔥 Taxa de consumo alta detectada');
  console.log('Considere revisar o uso das APIs');
}
```

## 🔧 **Manutenção**

### **Limpeza Automática:**
- Dados antigos são removidos automaticamente
- Mantém últimos 3 meses de dados mensais
- Mantém último mês de dados diários

### **Backup de Dados:**
```javascript
// Em produção, considere salvar em banco de dados
const summary = costTracker.getCostSummary();
await saveCostSummaryToDatabase(summary);
```

### **Monitoramento da Saúde:**
```javascript
// Verificar se o sistema está funcionando
const healthCheck = {
  costTracking: costTracker ? 'healthy' : 'error',
  alerting: alertingSystem ? 'healthy' : 'error',
  lastUpdate: new Date().toISOString()
};
```

## 🎯 **Próximos Passos**

### **Melhorias Planejadas:**
1. **Persistência**: Salvar dados em Redis/PostgreSQL
2. **Histórico**: Gráficos de tendência mais detalhados
3. **Previsões**: ML para prever gastos futuros
4. **Otimização**: Sugestões automáticas de economia
5. **Integração**: Webhooks para sistemas externos

### **Métricas Avançadas:**
1. **ROI por Feature**: Custo vs valor gerado
2. **Eficiência por Modelo**: Tokens/resultado
3. **Padrões de Uso**: Horários de pico
4. **Comparação**: Benchmarks da indústria

---

## 📞 **Suporte**

Para dúvidas sobre o sistema de custos:
- 📧 Email: tech@cvsemfrescura.com.br
- 📱 Dashboard: `/costs-dashboard.html`
- 📊 API: `/api/monitoring/costs`

**Monitoramento ativo = Controle financeiro = Sucesso do projeto! 💰✅** 