@echo off
echo ===== CV Sem Frescura - Inicializando Projeto =====

echo.
echo === Verificando ambiente virtual ===
if not exist venv (
    echo Criando ambiente virtual...
    python -m venv venv
    echo Ambiente virtual criado com sucesso!
) else (
    echo Ambiente virtual já existe.
)

echo.
echo === Ativando ambiente virtual ===
call venv\Scripts\activate

echo.
echo === Instalando dependências ===
pip install -r backend\requirements.txt

echo.
echo === Configurando variáveis de ambiente ===
echo Nota: Para usar o Stripe, você precisa substituir as chaves de API no arquivo backend\.env

echo.
echo === Configurando ambiente Python ===
echo Adicionando diretório atual ao PYTHONPATH para resolver problemas de importação...
set PYTHONPATH=%PYTHONPATH%;%CD%

echo.
echo === Iniciando servidor ===
echo O servidor estará disponível em http://localhost:5000
echo Para acessar a página de pagamento, abra http://localhost:5000/payment.html
echo.
echo === Informações sobre Webhooks ===
echo Para que os pagamentos PIX e boleto funcionem corretamente, é necessário configurar webhooks.
echo Consulte o arquivo webhook-events.md para mais informações.
echo.
echo Para testar webhooks localmente, instale a CLI do Stripe e execute:
echo stripe listen --forward-to localhost:5000/api/payment/webhook
echo.
echo Pressione Ctrl+C para encerrar o servidor quando terminar.
echo.

cd backend
python app.py
