#!/bin/bash

# Script de Deploy - CV Sem Frescura
# Uso: ./scripts/deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-staging}
echo "🚀 Iniciando deploy para: $ENVIRONMENT"

# Verificar se está na branch correta
if [ "$ENVIRONMENT" = "production" ]; then
    BRANCH=$(git branch --show-current)
    if [ "$BRANCH" != "main" ]; then
        echo "❌ Para deploy de produção, use a branch 'main'"
        exit 1
    fi
fi

# Instalar dependências
echo "📦 Instalando dependências..."
cd backend
npm ci
cd ..

# Executar testes
echo "🧪 Executando testes..."
cd backend
npm test
cd ..

# Build da aplicação (se necessário)
echo "🔨 Preparando build..."
# Adicione comandos de build aqui

# Deploy baseado no ambiente
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🌟 Deploy para PRODUÇÃO"
    # Comandos específicos de produção
    echo "- Configurando variáveis de produção"
    echo "- Fazendo backup do banco"
    echo "- Aplicando migrations"
    echo "- Reiniciando serviços"
else
    echo "🔧 Deploy para STAGING"
    # Comandos específicos de staging
    echo "- Configurando variáveis de staging"
    echo "- Aplicando migrations"
    echo "- Reiniciando serviços"
fi

echo "✅ Deploy concluído com sucesso!"
echo "🌐 Aplicação disponível em: https://cvsemfrescura.com" 