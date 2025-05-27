# 📊 Sistema de Monitoramento - CV Sem Frescura

## 🎯 Visão Geral

O sistema de monitoramento do CV Sem Frescura fornece observabilidade completa da aplicação, incluindo métricas de sistema, performance, alertas automáticos e dashboards em tempo real.

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dashboard     │    │   Backend API   │    │   Alerting      │
│   (Frontend)    │◄──►│   /monitoring   │◄──►│   System        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │   Métricas      │    │   Notificações  │
                    │   em Memória    │    │   Email/Webhook │
                    └─────────────────┘    └─────────────────┘
```

## 📈 Endpoints de Monitoramento

### 1. Dashboard Principal
```
GET /api/monitoring/dashboard
```

**Resposta:**
```json
{
  "status": "healthy",
  "timestamp": "2025-05-27T17:30:00.000Z",
  "system": {
    "uptime": 3600,
    "uptimeFormatted": "1h 0m",
    "memory": {
      "used": 45,
      "total": 128,
      "external": 5
    },
    "cpu": {
      "user": 12345,
      "system": 6789
    },
    "platform": "linux",
    "nodeVersion": "v18.17.0"
  },
  "requests": {
    "total": 1337,
    "errors": 12,
    "errorRate": "0.90%",
    "lastHour": 156,
    "byEndpoint": {
      "/api/ats/analyze": 45,
      "/api/user/login": 23,
      "/health": 89
    }
  },
  "business": {
    "totalUsers": 1250,
    "totalTransactions": 89,
    "cvAnalyses": 234,
    "newUsers": 12,
    "payments": 45,
    "errors": {
      "auth": 3,
      "payment": 1,
      "analysis": 2
    }
  },
  "health": {
    "database": "connected",
    "memory": "healthy",
    "uptime": "healthy"
  }
}
```

### 2. Métricas Prometheus
```
GET /api/monitoring/metrics
```

**Resposta (Formato Prometheus):**
```
# HELP cv_requests_total Total number of HTTP requests
# TYPE cv_requests_total counter
cv_requests_total 1337

# HELP cv_requests_errors_total Total number of HTTP errors
# TYPE cv_requests_errors_total counter
cv_requests_errors_total 12

# HELP cv_uptime_seconds Application uptime in seconds
# TYPE cv_uptime_seconds gauge
cv_uptime_seconds 3600

# HELP cv_memory_used_bytes Memory usage in bytes
# TYPE cv_memory_used_bytes gauge
cv_memory_used_bytes 47185920
```

### 3. Alertas Ativos
```
GET /api/monitoring/alerts
```

**Resposta:**
```json
{
  "status": "warning",
  "alerts": [
    {
      "severity": "warning",
      "type": "memory",
      "message": "Memory usage is 85.2%",
      "timestamp": "2025-05-27T17:30:00.000Z"
    }
  ],
  "count": 1,
  "timestamp": "2025-05-27T17:30:00.000Z"
}
```

## 📊 Métricas Coletadas

### 🖥️ Sistema
- **Uptime**: Tempo online da aplicação
- **Memória**: Uso de heap, total e external
- **CPU**: Tempo de user e system
- **Plataforma**: SO e versão do Node.js

### 🌐 Requests HTTP
- **Total de requests**: Contador geral
- **Erros**: Requests com status >= 400
- **Taxa de erro**: Percentual de erros
- **Por endpoint**: Distribuição de tráfego
- **Última hora**: Requests recentes

### 💼 Negócio
- **Usuários**: Total cadastrados
- **Transações**: Pagamentos processados
- **Análises de CV**: Total processadas
- **Erros por categoria**: Auth, payment, analysis

## 🚨 Sistema de Alertas

### Tipos de Alertas

#### 1. Memória
- **Warning**: > 80% de uso
- **Critical**: > 90% de uso

#### 2. Taxa de Erro
- **Warning**: > 10% de erros
- **Critical**: > 20% de erros

#### 3. Banco de Dados
- **Warning**: Latência alta
- **Critical**: Desconectado

### Canais de Notificação

#### 📧 Email
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.sua_chave_sendgrid
FROM_EMAIL=alerts@cvsemfrescura.com.br
ALERT_EMAIL=admin@cvsemfrescura.com.br
```

#### 🔗 Webhooks (Slack/Discord)
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Cooldown de Alertas
- **Período**: 15 minutos
- **Finalidade**: Evitar spam de notificações
- **Tipos**: Por tipo de alerta + severidade

## 🎨 Dashboard Web

### Acesso
```
https://cvsemfrescura.com.br/monitoring.html
```

### Funcionalidades
- **Métricas em tempo real**: Atualização automática a cada 30s
- **Gráficos interativos**: Chart.js para visualizações
- **Status visual**: Cores baseadas na saúde do sistema
- **Alertas ativos**: Lista de problemas detectados
- **Responsivo**: Funciona em desktop e mobile

### Cartões de Métricas
1. **Uptime**: Tempo online formatado
2. **Requests**: Total e últimas horas
3. **Taxa de Erro**: Percentual com indicador visual
4. **Usuários**: Total cadastrados
5. **Análises**: CVs processados
6. **Memória**: Uso atual vs total

## 🔧 Configuração

### 1. Variáveis de Ambiente
```env
# Alertas por Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.sua_chave_sendgrid
FROM_EMAIL=alerts@cvsemfrescura.com.br
ALERT_EMAIL=admin@cvsemfrescura.com.br

# Webhooks (opcional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Logs
LOG_LEVEL=info
```

### 2. Integração no Código

#### Incrementar métricas de negócio:
```javascript
const { incrementMetric } = require('./routes/monitoring');

// Incrementar análises de CV
incrementMetric('cvAnalyses', 1);

// Incrementar erros de autenticação
incrementMetric('errors', 'auth', 1);
```

#### Middleware automático:
```javascript
// Já aplicado automaticamente a todas as rotas
app.use(collectMetrics);
```

## 📱 Uso Prático

### 1. Monitoramento Diário
- Acesse o dashboard pela manhã
- Verifique métricas de uptime e erros
- Analise picos de tráfego

### 2. Resolução de Problemas
- Alertas críticos → Investigação imediata
- Alertas de warning → Monitoramento próximo
- Dashboard → Visualização detalhada

### 3. Otimização de Performance
- Monitore uso de memória
- Analise endpoints mais acessados
- Identifique gargalos

## 🚀 Próximas Melhorias

### 1. Métricas Avançadas
- [ ] Latência por endpoint
- [ ] Throughput por minuto
- [ ] Análise de tendências

### 2. Alertas Inteligentes
- [ ] Machine Learning para anomalias
- [ ] Alertas baseados em tendências
- [ ] Escalação automática

### 3. Integração Externa
- [ ] Grafana dashboard
- [ ] Datadog/New Relic
- [ ] APM tools

### 4. Relatórios
- [ ] Relatórios diários automáticos
- [ ] SLA tracking
- [ ] Performance reports

## 🔍 Troubleshooting

### Dashboard não carrega
1. Verificar se `/api/monitoring/dashboard` responde
2. Verificar configuração CORS
3. Verificar logs do navegador

### Alertas não chegam
1. Verificar configuração SMTP
2. Verificar variáveis de ambiente
3. Verificar logs do servidor

### Métricas incorretas
1. Verificar middleware aplicado
2. Verificar coleta de métricas
3. Reiniciar aplicação se necessário

## 📚 Recursos Externos

- [Prometheus Metrics](https://prometheus.io/docs/concepts/metric_types/)
- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [SendGrid API](https://docs.sendgrid.com/)
- [Slack Webhooks](https://api.slack.com/messaging/webhooks)

---

**💡 Dica**: Mantenha o dashboard aberto em uma aba dedicada para monitoramento contínuo da saúde do sistema! 