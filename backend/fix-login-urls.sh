#!/bin/bash

echo "🔧 Corrigindo URLs de login nos testes..."

# Corrige em todos os arquivos de teste
find cypress/e2e -name "*.cy.js" -type f -exec sed -i "s|cy\.visit('/login')|cy.visit('/analisar.html?login=true')|g" {} \;
find cypress/e2e -name "*.cy.js" -type f -exec sed -i "s|\.should('contain', '/login')|.should('contain', 'login=true')|g" {} \;
find cypress/e2e -name "*.cy.js" -type f -exec sed -i "s|\.should('not\.contain', '/login')|.should('not.contain', 'login=true')|g" {} \;
find cypress/e2e -name "*.cy.js" -type f -exec sed -i "s|url.*include.*'/login'|url().should('include', 'login=true'|g" {} \;

echo "✅ URLs corrigidas!"