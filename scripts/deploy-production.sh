#!/bin/bash

# 🚀 Deploy Script para Produção - CV Sem Frescura
# Este script automatiza o deploy para produção

set -e

echo "🚀 Iniciando deploy para PRODUÇÃO..."

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "💡 Copie env.production.example para .env e configure as variáveis"
    exit 1
fi

# Verificar se NODE_ENV está configurado para produção
if ! grep -q "NODE_ENV=production" .env; then
    echo "⚠️ NODE_ENV não está configurado para 'production' no .env"
    read -p "Continuar mesmo assim? (y/N): " confirm
    if [[ $confirm != [yY] ]]; then
        exit 1
    fi
fi

# Parar containers antigos
echo "🛑 Parando containers antigos..."
docker compose -f docker-compose.prod.yml down --remove-orphans

# Fazer backup do banco se existir
echo "💾 Fazendo backup do banco de dados..."
if docker volume ls | grep -q postgres_data_prod; then
    mkdir -p backups
    docker run --rm \
        -v postgres_data_prod:/data \
        -v $(pwd)/backups:/backup \
        alpine:latest \
        tar czf /backup/backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
    echo "✅ Backup criado em backups/"
fi

# Build das imagens
echo "🔨 Construindo imagens Docker..."
docker compose -f docker-compose.prod.yml build --no-cache

# Subir serviços
echo "🚁 Subindo serviços em produção..."
docker compose -f docker-compose.prod.yml up -d

# Aguardar containers iniciarem
echo "⏳ Aguardando containers iniciarem..."
sleep 30

# Verificar status
echo "🔍 Verificando status dos containers..."
docker compose -f docker-compose.prod.yml ps

# Health check
echo "🏥 Fazendo health check..."
for i in {1..10}; do
    if curl -sf http://localhost/health > /dev/null; then
        echo "✅ Aplicação funcionando!"
        break
    fi
    echo "⏳ Tentativa $i/10 - aguardando aplicação..."
    sleep 10
done

# Verificar logs se houver problema
if ! curl -sf http://localhost/health > /dev/null; then
    echo "❌ Health check falhou! Verificando logs..."
    docker compose -f docker-compose.prod.yml logs --tail=50 backend
    exit 1
fi

echo "🎉 Deploy concluído com sucesso!"
echo "🌐 Acesse: https://cvsemfrescura.com.br"
echo "🔍 Logs: docker compose -f docker-compose.prod.yml logs -f" 