@echo off
REM 🚨 DEPLOY DE EMERGÊNCIA - CV Sem Frescura (Windows)
REM Para produção AMANHÃ com segurança mínima

echo 🚨 DEPLOY DE EMERGÊNCIA INICIADO...

REM 1. VERIFICAR VARIÁVEIS CRÍTICAS
echo 🔍 Verificando variáveis críticas...

if not exist .env.production (
    echo ❌ Arquivo .env.production não encontrado!
    echo 💡 Criando .env.production a partir do exemplo...
    copy env.production.example .env.production
    echo ⚠️ EDITE .env.production COM SUAS CHAVES REAIS ANTES DE CONTINUAR!
    pause
)

REM 2. VERIFICAR DOCKER
echo 🐳 Verificando Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker não encontrado! Instale o Docker Desktop primeiro.
    pause
    exit /b 1
)

REM 3. BACKUP RÁPIDO SE EXISTIR
echo 💾 Backup rápido do banco...
docker volume ls | findstr postgres_data >nul 2>&1
if not errorlevel 1 (
    if not exist emergency-backup mkdir emergency-backup
    docker run --rm -v postgres_data:/data -v %cd%/emergency-backup:/backup alpine:latest tar czf /backup/emergency-backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%.tar.gz -C /data .
)

REM 4. PARAR CONTAINERS ANTIGOS
echo 🛑 Parando containers antigos...
docker compose down --remove-orphans

REM 5. BUILD E START COM CONFIGURAÇÃO DE PRODUÇÃO
echo 🔨 Build para produção...
docker compose -f docker-compose.prod.yml --env-file .env.production build

echo 🚀 Iniciando em produção...
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

REM 6. AGUARDAR INICIALIZAÇÃO
echo ⏳ Aguardando inicialização...
timeout /t 30 /nobreak >nul

REM 7. HEALTH CHECK BÁSICO
echo 🏥 Verificando saúde da aplicação...
for /l %%i in (1,1,10) do (
    curl -sf http://localhost/health >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Aplicação funcionando!
        goto :success
    )
    echo ⏳ Tentativa %%i/10...
    timeout /t 10 /nobreak >nul
)

echo ❌ Falha no health check!
echo 📋 Verificando logs...
docker compose -f docker-compose.prod.yml logs --tail=20
exit /b 1

:success
echo 🎉 DEPLOY DE EMERGÊNCIA CONCLUÍDO!
echo 🌐 Acesse: http://localhost
echo 📊 Logs: docker compose -f docker-compose.prod.yml logs -f
echo.
echo ⚠️ PRÓXIMOS PASSOS CRÍTICOS:
echo 1. Configurar SSL/HTTPS
echo 2. Configurar monitoramento
echo 3. Configurar backup automatizado
echo 4. Implementar testes

pause 