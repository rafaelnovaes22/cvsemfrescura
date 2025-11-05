# Script PowerShell para executar testes

Write-Host "🚀 Iniciando execução de testes via PowerShell..." -ForegroundColor Green
Write-Host ""

# Verificar ambiente
Write-Host "=== VERIFICAÇÃO DE AMBIENTE ===" -ForegroundColor Yellow
Write-Host "Node.js version:" -NoNewline
node --version
Write-Host "npm version:" -NoNewline  
npm --version
Write-Host "Diretório atual:" -NoNewline
Get-Location
Write-Host ""

# Teste 1: Básico
Write-Host "=== TESTE 1: BÁSICO ===" -ForegroundColor Yellow
try {
    $output = npx jest tests/basic.test.js --verbose 2>&1
    Write-Host $output
} catch {
    Write-Host "Erro no teste básico: $_" -ForegroundColor Red
}
Write-Host ""

# Teste 2: Minimal
Write-Host "=== TESTE 2: MINIMAL ===" -ForegroundColor Yellow
try {
    $output = npx jest tests/minimal.test.js --verbose 2>&1
    Write-Host $output
} catch {
    Write-Host "Erro no teste minimal: $_" -ForegroundColor Red
}
Write-Host ""

# Teste 3: UserController
Write-Host "=== TESTE 3: USER CONTROLLER ===" -ForegroundColor Yellow
try {
    $output = npx jest tests/unit/controllers/userController.test.js --verbose 2>&1
    Write-Host $output
} catch {
    Write-Host "Erro no UserController: $_" -ForegroundColor Red
}
Write-Host ""

# Teste 4: Todos os testes unitários
Write-Host "=== TESTE 4: TODOS UNITÁRIOS ===" -ForegroundColor Yellow
try {
    $output = npx jest tests/unit/ --verbose 2>&1
    Write-Host $output
} catch {
    Write-Host "Erro nos testes unitários: $_" -ForegroundColor Red
}
Write-Host ""

# Teste 5: Cobertura
Write-Host "=== TESTE 5: COBERTURA ===" -ForegroundColor Yellow
try {
    $output = npx jest --coverage 2>&1
    Write-Host $output
} catch {
    Write-Host "Erro na cobertura: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🏁 Execução concluída!" -ForegroundColor Green