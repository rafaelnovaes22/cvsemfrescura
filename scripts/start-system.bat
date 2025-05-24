@echo off
echo.
echo ========================================
echo   CV SEM FRESCURA - SISTEMA INTEGRADO
echo ========================================
echo.

echo [1/4] Verificando dependencias...
cd backend
if not exist node_modules (
    echo Instalando dependencias do backend...
    npm install
)

echo.
echo [2/4] Testando integracao Stripe...
node test-stripe-integration.js

echo.
echo [3/4] Iniciando backend...
start "Backend - CV Sem Frescura" cmd /k "npm run dev"

echo.
echo [4/4] Aguardando backend inicializar...
timeout /t 3 /nobreak > nul

echo.
echo [5/5] Iniciando frontend...
cd ..\frontend
start "Frontend - CV Sem Frescura" cmd /k "python -m http.server 8000"

echo.
echo ========================================
echo   SISTEMA INICIADO COM SUCESSO!
echo ========================================
echo.
echo Frontend: http://localhost:8000
echo Backend:  http://localhost:3000
echo.
echo Pressione qualquer tecla para continuar...
pause > nul 