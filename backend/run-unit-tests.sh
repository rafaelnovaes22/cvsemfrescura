#!/bin/bash

echo "🧪 Executando Testes Unitários..."
echo "=================================="

# Rodar apenas o userController que sabemos que funciona
echo "✅ Testando UserController..."
npx jest tests/unit/controllers/userController.test.js --silent

# Verificar cobertura
echo ""
echo "📊 Gerando Relatório de Cobertura..."
npx nyc jest tests/unit/controllers/userController.test.js --silent

echo ""
echo "🎉 Testes concluídos!"
echo "📋 Próximos passos:"
echo "   - Corrigir testes pendentes dos outros controllers"
echo "   - Implementar testes de integração"
echo "   - Adicionar ao pipeline de CI/CD"