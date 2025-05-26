#!/bin/bash

# 🚨 DEPLOY DE EMERGÊNCIA - CV Sem Frescura
# Para produção AMANHÃ com segurança mínima

set -e

echo "🚨 DEPLOY DE EMERGÊNCIA INICIADO..."

# 1. VERIFICAR VARIÁVEIS CRÍTICAS
echo "🔍 Verificando variáveis críticas..."

if [ ! -f .env.production ]; then
    echo "❌ Arquivo .env.production não encontrado!"
    echo "💡 Criando .env.production a partir do exemplo..."
    cp env.production.example .env.production
    echo "⚠️ EDITE .env.production COM SUAS CHAVES REAIS ANTES DE CONTINUAR!"
    echo "⚠️ Pressione ENTER após editar o arquivo..."
    read
fi

# 2. VERIFICAR CHAVES OBRIGATÓRIAS
echo "🔑 Verificando chaves obrigatórias..."
required_vars=("OPENAI_API_KEY" "STRIPE_SECRET_KEY" "JWT_SECRET" "DB_PASSWORD")

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env.production || grep -q "your_.*_here" .env.production; then
        echo "❌ Variável $var não configurada corretamente!"
        echo "⚠️ Configure todas as variáveis em .env.production"
        exit 1
    fi
done

# 3. GERAR JWT SECRET SEGURO SE NECESSÁRIO
if grep -q "your_super_secure_jwt_secret" .env.production; then
    echo "🔐 Gerando JWT secret seguro..."
    JWT_SECRET=$(openssl rand -hex 32)
    sed -i "s/your_super_secure_jwt_secret_256_bits_minimum/$JWT_SECRET/" .env.production
fi

# 4. CONFIGURAR SSL BÁSICO COM CERTBOT
echo "🔒 Configurando SSL básico..."
if ! command -v certbot &> /dev/null; then
    echo "📦 Instalando certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# 5. BACKUP RÁPIDO SE EXISTIR
if docker volume ls | grep -q postgres_data; then
    echo "💾 Backup rápido do banco..."
    mkdir -p emergency-backup
    docker run --rm \
        -v postgres_data:/data \
        -v $(pwd)/emergency-backup:/backup \
        alpine:latest \
        tar czf /backup/emergency-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
fi

# 6. PARAR CONTAINERS ANTIGOS
echo "🛑 Parando containers antigos..."
docker compose down --remove-orphans || true

# 7. BUILD E START COM CONFIGURAÇÃO DE PRODUÇÃO
echo "🔨 Build para produção..."
docker compose -f docker-compose.prod.yml --env-file .env.production build

echo "🚀 Iniciando em produção..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# 8. AGUARDAR INICIALIZAÇÃO
echo "⏳ Aguardando inicialização..."
sleep 30

# 9. HEALTH CHECK BÁSICO
echo "🏥 Verificando saúde da aplicação..."
for i in {1..10}; do
    if curl -sf http://localhost/health > /dev/null 2>&1; then
        echo "✅ Aplicação funcionando!"
        break
    fi
    echo "⏳ Tentativa $i/10..."
    sleep 10
done

# 10. CONFIGURAR SSL AUTOMÁTICO
echo "🔒 Configurando SSL..."
read -p "Digite seu domínio (ex: cvsemfrescura.com): " DOMAIN
if [ ! -z "$DOMAIN" ]; then
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
fi

# 11. VERIFICAÇÃO FINAL
echo "🔍 Verificação final..."
if curl -sf http://localhost/health > /dev/null 2>&1; then
    echo "🎉 DEPLOY DE EMERGÊNCIA CONCLUÍDO!"
    echo "🌐 Acesse: http://localhost (ou https://$DOMAIN se SSL configurado)"
    echo "📊 Logs: docker compose -f docker-compose.prod.yml logs -f"
    echo ""
    echo "⚠️ PRÓXIMOS PASSOS CRÍTICOS:"
    echo "1. Configurar monitoramento (Sentry/Uptime)"
    echo "2. Configurar backup automatizado"
    echo "3. Implementar testes"
else
    echo "❌ Falha no health check!"
    echo "📋 Verificando logs..."
    docker compose -f docker-compose.prod.yml logs --tail=20
    exit 1
fi 