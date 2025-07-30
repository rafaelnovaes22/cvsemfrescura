#!/bin/bash

echo "🔧 Corrigindo rotas de autenticação nos testes e2e..."

# Lista de arquivos para corrigir
files=(
  "cypress/e2e/contact.cy.js"
  "cypress/e2e/password-recovery.cy.js"
  "cypress/e2e/terms-privacy.cy.js"
  "cypress/e2e/admin.cy.js"
  "cypress/e2e/history.cy.js"
)

# Corrige cada arquivo
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Corrigindo $file..."
    sed -i 's|/auth/register|/user/register|g' "$file"
    sed -i 's|/auth/login|/user/login|g' "$file"
    sed -i 's|/auth/forgot-password|/password-reset/forgot-password|g' "$file"
  fi
done

echo "✅ Correções aplicadas!"