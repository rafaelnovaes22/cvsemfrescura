#!/bin/bash

# Quick Start Script - CV Sem Frescura
# Este script configura e executa o projeto em 30 segundos

set -e

echo "🚀 CV Sem Frescura - Quick Start"
echo "================================="

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale Docker primeiro:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar se Docker Compose está disponível
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Atualize seu Docker:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

# Copiar arquivo de configuração se não existir
if [ ! -f .env ]; then
    echo "⚙️  Criando arquivo de configuração..."
    cp docker.env .env
    echo "✅ Arquivo .env criado. Configure suas chaves de API:"
    echo "   - OPENAI_API_KEY"
    echo "   - STRIPE_SECRET_KEY"
    echo "   - STRIPE_WEBHOOK_SECRET"
fi

# Verificar se as chaves foram configuradas
if grep -q "your_openai_key_here" .env; then
    echo "⚠️  ATENÇÃO: Configure suas chaves de API no arquivo .env"
    echo "   Algumas funcionalidades não funcionarão sem as chaves corretas."
    read -p "   Continuar mesmo assim? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Configure o arquivo .env e execute novamente."
        exit 1
    fi
fi

# Baixar imagens Docker
echo "📦 Baixando dependências..."
docker compose pull

# Construir imagens personalizadas
echo "🔨 Construindo aplicação..."
docker compose build

# Iniciar serviços
echo "🚀 Iniciando CV Sem Frescura..."
docker compose up -d

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços..."
sleep 10

# Verificar se serviços estão funcionando
echo "🔍 Verificando serviços..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Backend funcionando"
else
    echo "❌ Backend não está respondendo"
fi

if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ Frontend funcionando"
else
    echo "❌ Frontend não está respondendo"
fi

echo ""
echo "🎉 CV Sem Frescura está pronto!"
echo "================================="
echo "🌐 Frontend: http://localhost:8080"
echo "🔧 Backend:  http://localhost:3000"
echo "📊 Logs:     docker compose logs -f"
echo "🛑 Parar:    docker compose down"
echo ""
echo "📝 Próximos passos:"
echo "   1. Configure as chaves de API no arquivo .env"
echo "   2. Acesse http://localhost:8080 para testar"
echo "   3. Leia a documentação em docs/"
echo ""
echo "🔗 Repositório: https://github.com/seu-usuario/cv-sem-frescura" 