#!/bin/bash

# 🚀 Script de inicialização para Railway - CV Sem Frescura

echo "🚀 Iniciando CV Sem Frescura no Railway..."

# Configurar porta padrão se não definida
export PORT=${PORT:-3000}

# Substituir $PORT na configuração do nginx
envsubst '$PORT' < /etc/nginx/nginx.conf > /tmp/nginx.conf
mv /tmp/nginx.conf /etc/nginx/nginx.conf

# Iniciar nginx em background
echo "🌐 Iniciando Nginx na porta $PORT..."
nginx &

# Aguardar nginx inicializar
sleep 2

# Iniciar backend Node.js
echo "⚙️ Iniciando Backend Node.js..."
cd /app/backend

# Aguardar banco de dados (se usando Railway PostgreSQL)
echo "🗄️ Aguardando banco de dados..."
sleep 5

# Executar migrações se necessário
if [ "$NODE_ENV" = "production" ]; then
    echo "📊 Executando migrações do banco..."
    npm run migrate 2>/dev/null || echo "⚠️ Migrações não configuradas"
fi

# Iniciar aplicação
echo "✅ Iniciando aplicação principal..."
exec node server.js 