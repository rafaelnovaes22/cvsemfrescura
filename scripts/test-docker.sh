#!/bin/bash

# Script de teste do Docker Compose
# Verifica se tudo está funcionando antes do commit

set -e

echo "🧪 Testando Docker Compose - CV Sem Frescura"
echo "=============================================="

# Verificar se Docker está rodando
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker não está rodando. Inicie o Docker Desktop."
    exit 1
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker compose down -v --remove-orphans 2>/dev/null || true

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "⚙️  Criando arquivo .env..."
    cp docker.env .env
fi

# Build das imagens
echo "🔨 Construindo imagens..."
docker compose build --no-cache

# Iniciar serviços
echo "🚀 Iniciando serviços..."
docker compose up -d

# Aguardar inicialização
echo "⏳ Aguardando serviços (60s)..."
sleep 60

# Testar health checks
echo "🔍 Testando conectividade..."

# Teste MySQL
if docker compose exec mysql mysqladmin ping -h localhost --silent; then
    echo "✅ MySQL funcionando"
else
    echo "❌ MySQL falhou"
    docker compose logs mysql
    exit 1
fi

# Teste Backend
if curl -f http://localhost:3000/health >/dev/null 2>&1; then
    echo "✅ Backend funcionando"
else
    echo "❌ Backend falhou"
    docker compose logs backend
    exit 1
fi

# Teste Frontend
if curl -f http://localhost:8080 >/dev/null 2>&1; then
    echo "✅ Frontend funcionando"
else
    echo "❌ Frontend falhou"
    docker compose logs frontend
    exit 1
fi

# Teste Redis
if docker compose exec redis redis-cli ping >/dev/null 2>&1; then
    echo "✅ Redis funcionando"
else
    echo "❌ Redis falhou"
    docker compose logs redis
    exit 1
fi

echo ""
echo "🎉 Todos os testes passaram!"
echo "✅ Sistema pronto para produção"
echo ""
echo "🌐 Acesse: http://localhost:8080"
echo "🔧 API: http://localhost:3000"
echo ""
echo "📝 Para parar: docker compose down"

# Cleanup opcional
read -p "🛑 Parar containers agora? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker compose down
    echo "✅ Containers parados"
fi 