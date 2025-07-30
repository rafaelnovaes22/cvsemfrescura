#!/bin/bash

echo "🚀 Iniciando testes e2e..."

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

# Executa um teste simples primeiro
echo "🧪 Executando teste de autenticação..."
npm run test:e2e -- --spec "cypress/e2e/auth.cy.js"

# Salva o código de saída
EXIT_CODE=$?

# Para o servidor
echo "🛑 Parando servidor..."
kill $SERVER_PID 2>/dev/null

echo "✅ Teste finalizado com código: $EXIT_CODE"

# Mostra últimas linhas do log do servidor se houver erro
if [ $EXIT_CODE -ne 0 ]; then
    echo "📋 Últimas linhas do log do servidor:"
    tail -20 server.log
fi

exit $EXIT_CODE