#!/bin/bash

# 🚨 Setup de Monitoramento de Emergência
# Para produção AMANHÃ

echo "📊 Configurando monitoramento básico..."

# 1. INSTALAR FERRAMENTAS BÁSICAS
echo "📦 Instalando ferramentas de monitoramento..."
sudo apt-get update
sudo apt-get install -y htop iotop nethogs curl jq

# 2. CONFIGURAR SENTRY (Error Tracking)
echo "🐛 Configurando Sentry para error tracking..."
read -p "Digite sua DSN do Sentry (ou ENTER para pular): " SENTRY_DSN

if [ ! -z "$SENTRY_DSN" ]; then
    echo "SENTRY_DSN=$SENTRY_DSN" >> .env.production
    echo "✅ Sentry configurado!"
else
    echo "⚠️ Sentry pulado - configure depois!"
fi

# 3. SCRIPT DE HEALTH CHECK
echo "🏥 Criando script de health check..."
cat > scripts/health-check.sh << 'EOF'
#!/bin/bash

# Health check básico para CV Sem Frescura
echo "🏥 Verificando saúde da aplicação..."

# Verificar containers
echo "📦 Status dos containers:"
docker compose -f docker-compose.prod.yml ps

# Verificar endpoints
echo "🌐 Verificando endpoints:"

# Frontend
if curl -sf http://localhost > /dev/null; then
    echo "✅ Frontend: OK"
else
    echo "❌ Frontend: FALHA"
fi

# Backend API
if curl -sf http://localhost/health > /dev/null; then
    echo "✅ Backend: OK"
else
    echo "❌ Backend: FALHA"
fi

# Banco de dados
if docker exec cv_postgres_prod pg_isready -U cvuser_prod > /dev/null 2>&1; then
    echo "✅ Database: OK"
else
    echo "❌ Database: FALHA"
fi

# Redis
if docker exec cv_redis_prod redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: OK"
else
    echo "❌ Redis: FALHA"
fi

# Verificar uso de recursos
echo "💻 Uso de recursos:"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')"
echo "RAM: $(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}')"
echo "Disk: $(df -h / | awk 'NR==2{printf "%s", $5}')"

# Logs recentes
echo "📋 Logs recentes (últimas 5 linhas):"
docker compose -f docker-compose.prod.yml logs --tail=5 backend
EOF

chmod +x scripts/health-check.sh

# 4. CRON JOB PARA HEALTH CHECK
echo "⏰ Configurando cron job para health check..."
(crontab -l 2>/dev/null; echo "*/5 * * * * $(pwd)/scripts/health-check.sh >> $(pwd)/logs/health-check.log 2>&1") | crontab -

# 5. SCRIPT DE ALERTAS BÁSICOS
echo "🚨 Criando script de alertas..."
cat > scripts/alert-check.sh << 'EOF'
#!/bin/bash

# Alertas básicos para CV Sem Frescura
LOG_FILE="logs/alerts.log"
mkdir -p logs

# Verificar se aplicação está respondendo
if ! curl -sf http://localhost/health > /dev/null; then
    echo "$(date): ❌ ALERTA: Aplicação não está respondendo!" >> $LOG_FILE
    # Aqui você pode adicionar notificação por email/Slack
fi

# Verificar uso de CPU
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}' | awk -F'us' '{print $1}')
if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo "$(date): ⚠️ ALERTA: CPU alta: ${CPU_USAGE}%" >> $LOG_FILE
fi

# Verificar uso de RAM
RAM_USAGE=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
if (( $(echo "$RAM_USAGE > 85" | bc -l) )); then
    echo "$(date): ⚠️ ALERTA: RAM alta: ${RAM_USAGE}%" >> $LOG_FILE
fi

# Verificar espaço em disco
DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    echo "$(date): ⚠️ ALERTA: Disco cheio: ${DISK_USAGE}%" >> $LOG_FILE
fi
EOF

chmod +x scripts/alert-check.sh

# 6. CRON JOB PARA ALERTAS
echo "⏰ Configurando cron job para alertas..."
(crontab -l 2>/dev/null; echo "*/10 * * * * $(pwd)/scripts/alert-check.sh") | crontab -

# 7. CONFIGURAR LOGROTATE
echo "📝 Configurando rotação de logs..."
sudo tee /etc/logrotate.d/cv-sem-frescura << EOF
$(pwd)/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF

# 8. CRIAR DASHBOARD SIMPLES
echo "📊 Criando dashboard simples..."
cat > scripts/dashboard.sh << 'EOF'
#!/bin/bash

# Dashboard simples para CV Sem Frescura
clear
echo "🎯 CV Sem Frescura - Dashboard de Produção"
echo "=========================================="
echo ""

# Status geral
echo "📊 STATUS GERAL:"
./scripts/health-check.sh
echo ""

# Métricas de negócio (se disponível)
echo "💰 MÉTRICAS DE NEGÓCIO:"
echo "Usuários online: $(docker exec cv_backend_prod node -e "console.log('N/A')" 2>/dev/null || echo 'N/A')"
echo "Análises hoje: $(docker exec cv_backend_prod node -e "console.log('N/A')" 2>/dev/null || echo 'N/A')"
echo ""

# Logs recentes
echo "📋 LOGS RECENTES:"
tail -10 logs/health-check.log 2>/dev/null || echo "Nenhum log ainda"
echo ""

echo "🔄 Atualizado em: $(date)"
echo "💡 Execute: watch -n 30 ./scripts/dashboard.sh"
EOF

chmod +x scripts/dashboard.sh

echo "✅ Monitoramento básico configurado!"
echo ""
echo "📊 Para ver o dashboard: ./scripts/dashboard.sh"
echo "🏥 Para health check manual: ./scripts/health-check.sh"
echo "📋 Logs em: logs/" 