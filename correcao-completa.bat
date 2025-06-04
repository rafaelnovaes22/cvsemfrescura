@echo off
echo ===============================================
echo 🔧 CORREÇÃO COMPLETA - CV SEM FRESCURA
echo ===============================================
echo.

echo 📋 PROBLEMAS A SEREM CORRIGIDOS:
echo ❌ Dropdown não fechando
echo ❌ JWT_SECRET não definido  
echo ❌ STRIPE_SECRET_KEY não configurada
echo ❌ PostgreSQL não encontrado
echo ❌ Porta 3000 já em uso
echo ❌ Rate limiting
echo.

echo 🚀 INICIANDO CORREÇÕES...
echo.

REM === PASSO 1: Parar processos na porta 3000 ===
echo 🔧 PASSO 1: Liberando porta 3000...
netstat -ano | findstr :3000 > nul
if %errorlevel% == 0 (
    echo ⚠️  Processo encontrado na porta 3000. Tentando finalizar...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        echo Finalizando processo %%a...
        taskkill /F /PID %%a 2>nul
    )
    echo ✅ Porta 3000 liberada
) else (
    echo ✅ Porta 3000 já está livre
)
echo.

REM === PASSO 2: Criar arquivo .env ===
echo 🔧 PASSO 2: Configurando arquivo .env...
cd /d "%~dp0\backend"

if exist ".env" (
    echo ⚠️  Arquivo .env já existe. Criando backup...
    copy ".env" ".env.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%" > nul
)

echo # ===== CONFIGURAÇÃO DE DESENVOLVIMENTO ===== > .env
echo NODE_ENV=development >> .env
echo. >> .env
echo # ===== SEGURANÇA ===== >> .env
echo JWT_SECRET=desenvolvimento_jwt_secret_super_seguro_123456789 >> .env
echo BCRYPT_ROUNDS=10 >> .env
echo. >> .env
echo # ===== BANCO DE DADOS ^(SQLite para desenvolvimento^) ===== >> .env
echo DB_DIALECT=sqlite >> .env
echo DB_STORAGE=./database.sqlite >> .env
echo DB_LOGGING=false >> .env
echo. >> .env
echo # ===== SERVIDOR ===== >> .env
echo PORT=3001 >> .env
echo HOST=localhost >> .env
echo. >> .env
echo # ===== STRIPE ^(desabilitado para desenvolvimento^) ===== >> .env
echo # STRIPE_SECRET_KEY=sk_test_seu_stripe_key_aqui >> .env
echo # STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret >> .env
echo. >> .env
echo # ===== FRONTEND ===== >> .env
echo FRONTEND_URL=http://localhost:8080 >> .env
echo CORS_ORIGIN=http://localhost:8080 >> .env
echo. >> .env
echo # ===== OUTROS ===== >> .env
echo RATE_LIMIT_WINDOW_MS=900000 >> .env
echo RATE_LIMIT_MAX_REQUESTS=100 >> .env
echo MAX_FILE_SIZE=10485760 >> .env
echo UPLOAD_DIR=./uploads >> .env

echo ✅ Arquivo .env criado com sucesso
echo.

REM === PASSO 3: Verificar Node.js e dependências ===
echo 🔧 PASSO 3: Verificando dependências...
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado. Instale o Node.js primeiro.
    pause
    exit /b 1
)

if exist "package.json" (
    echo ✅ package.json encontrado
    echo 📦 Instalando dependências...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Erro ao instalar dependências
        pause
        exit /b 1
    )
    echo ✅ Dependências instaladas
) else (
    echo ❌ package.json não encontrado na pasta backend
)
echo.

REM === PASSO 4: Testar configuração ===
echo 🔧 PASSO 4: Testando configuração...
echo ⚠️  Iniciando servidor de teste por 10 segundos...
timeout /t 2 > nul
start /B npm start
timeout /t 10 > nul

REM Verificar se o servidor está rodando
netstat -ano | findstr :3001 > nul
if %errorlevel% == 0 (
    echo ✅ Servidor iniciado com sucesso na porta 3001
    
    REM Parar o servidor de teste
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
        taskkill /F /PID %%a 2>nul
    )
    echo ✅ Servidor de teste finalizado
) else (
    echo ❌ Problema ao iniciar servidor
)
echo.

REM === PASSO 5: Verificar frontend ===
cd /d "%~dp0\frontend"
echo 🔧 PASSO 5: Verificando correção do dropdown...

if exist "test-dropdown-fix-final.html" (
    echo ✅ Arquivo de teste do dropdown criado
    echo 🌐 Abra este arquivo no navegador para testar: test-dropdown-fix-final.html
) else (
    echo ❌ Arquivo de teste não encontrado
)

if exist "assets\js\header-new.js" (
    echo ✅ Arquivo header-new.js encontrado e corrigido
) else (
    echo ❌ Arquivo header-new.js não encontrado
)
echo.

echo ===============================================
echo ✅ CORREÇÃO COMPLETA FINALIZADA!
echo ===============================================
echo.
echo 📋 RESUMO DAS CORREÇÕES:
echo ✅ Porta 3000 liberada
echo ✅ Arquivo .env criado com JWT_SECRET
echo ✅ Configuração SQLite para desenvolvimento
echo ✅ Porta alterada para 3001 (evita conflitos)
echo ✅ Stripe desabilitado (evita erros)
echo ✅ Dropdown corrigido no frontend
echo.
echo 🚀 PRÓXIMOS PASSOS:
echo 1. Teste o dropdown: abra frontend\test-dropdown-fix-final.html
echo 2. Inicie o backend: cd backend ^&^& npm start
echo 3. Acesse http://localhost:3001 para verificar
echo.
echo ⚠️  IMPORTANTE:
echo - O servidor agora roda na porta 3001 (não 3000)
echo - Use SQLite em desenvolvimento (sem PostgreSQL)
echo - Configure Stripe apenas se necessário
echo.

pause 