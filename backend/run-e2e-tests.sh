#!/bin/bash

# Script para executar testes e2e

echo "🚀 Iniciando servidor na porta 3001..."
PORT=3001 node server.js &
SERVER_PID=$!

echo "⏳ Aguardando servidor iniciar (30 segundos)..."
sleep 30

echo "🔍 Verificando se o servidor está respondendo..."
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Servidor respondendo!"
else
    echo "❌ Servidor não está respondendo. Verificando logs..."
    ps aux | grep node
    echo "Tentando continuar mesmo assim..."
fi

echo "🧪 Executando testes e2e..."
npm run test:e2e

# Captura o código de saída dos testes
TEST_EXIT_CODE=$?

echo "🛑 Finalizando servidor..."
kill $SERVER_PID 2>/dev/null

echo "✅ Testes concluídos com código de saída: $TEST_EXIT_CODE"
exit $TEST_EXIT_CODE