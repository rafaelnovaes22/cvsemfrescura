@echo off
echo ===== INICIANDO DEBUG DE TESTES =====
echo.

echo === Verificando diretorio ===
cd
echo.

echo === Verificando Node.js ===
node --version
echo.

echo === Verificando npm ===
npm --version
echo.

echo === Listando arquivos de teste ===
dir tests\basic.test.js
echo.

echo === Executando teste simples ===
node test-simple.js
echo.

echo === Tentando Jest diretamente ===
npx jest tests/basic.test.js --verbose --no-cache
echo.

echo === Salvando resultado ===
npx jest tests/basic.test.js --verbose --no-cache > test-output.txt 2>&1
echo Resultado salvo em test-output.txt
echo.

echo ===== DEBUG CONCLUIDO =====
pause