#!/bin/bash

echo "🚀 Executando suite completa de testes E2E..."

# Mata processos anteriores
pkill -f "node server.js" || true

# Inicia o servidor em background
echo "📦 Iniciando servidor..."
PORT=3001 node server.js > server.log 2>&1 &
SERVER_PID=$!

# Aguarda o servidor iniciar
echo "⏳ Aguardando servidor iniciar..."
for i in {1..30}; do
    if curl -s http://localhost:3001/api/health > /dev/null; then
        echo "✅ Servidor respondendo!"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# Executa todos os testes
echo "🧪 Executando todos os testes E2E..."
npm run test:e2e

# Salva o código de saída
EXIT_CODE=$?

# Para o servidor
echo "🛑 Parando servidor..."
kill $SERVER_PID 2>/dev/null

# Gera relatório
echo ""
echo "📊 RELATÓRIO DOS TESTES E2E"
echo "=========================="
echo ""

# Lista arquivos de teste
echo "📁 Arquivos de teste executados:"
ls cypress/e2e/*.cy.js | wc -l | xargs echo "Total de arquivos:"
echo ""

# Mostra resumo dos resultados
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Todos os testes passaram!"
else
    echo "❌ Alguns testes falharam. Código de saída: $EXIT_CODE"
    echo ""
    echo "📋 Últimas linhas do log do servidor:"
    tail -20 server.log
fi

echo ""
echo "🎥 Vídeos dos testes salvos em: cypress/videos/"
echo "📸 Screenshots de falhas salvos em: cypress/screenshots/"

exit $EXIT_CODE