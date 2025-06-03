#!/bin/bash

# 🚀 Script de inicialização para Railway - CV Sem Frescura

echo "🚀 Iniciando CV Sem Frescura no Railway..."

# Configurar porta padrão do Railway
export PORT=${PORT:-3000}

echo "📁 Listando arquivos do diretório atual:"
ls -la

echo "📁 Verificando estrutura backend:"
ls -la backend/ || echo "❌ Diretório backend não encontrado"

# Navegar para o backend
cd /app/backend || cd backend || {
    echo "❌ Erro: Diretório backend não encontrado!"
    echo "📁 Conteúdo atual:"
    pwd
    ls -la
    exit 1
}

echo "📦 Instalando dependências..."
npm install

echo "✅ Iniciando aplicação na porta $PORT..."
exec node server.js 