from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
import json
import logging
import traceback
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from modules.cv_analysis import analyze_cv
from modules.auth import init_auth
from modules.payment import PaymentService
from database.database import init_db, save_analysis
from utils.file_handlers import allowed_file, verify_file_content, safe_delete_file, ensure_directory_exists
from routes.payment_routes import payment_bp
import config

# Configuração avançada de logging
log_dir = 'logs'
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, f'app_{datetime.now().strftime("%Y%m%d")}.log')

# Configurar formato detalhado para os logs
log_format = logging.Formatter(
    '%(asctime)s [%(levelname)s] %(name)s - %(message)s - [%(filename)s:%(lineno)d]'
)

# Configurar handler para arquivo
file_handler = logging.FileHandler(log_file)
file_handler.setFormatter(log_format)
file_handler.setLevel(logging.DEBUG)

# Configurar handler para console
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_format)
console_handler.setLevel(logging.INFO)

# Configurar logger raiz
root_logger = logging.getLogger()
root_logger.setLevel(logging.DEBUG)
root_logger.addHandler(file_handler)
root_logger.addHandler(console_handler)

# Garantir que todos os logs sejam capturados
logging.getLogger('werkzeug').setLevel(logging.DEBUG)
logging.getLogger('flask_cors').setLevel(logging.DEBUG)
logging.getLogger('flask_jwt_extended').setLevel(logging.DEBUG)

# Criar logger específico para este módulo
logger = logging.getLogger(__name__)
logger.info("Iniciando aplicação...")
logger.info(f"Data e hora atual: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

# Configurar diretório raiz do projeto
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
logger.info(f"Diretório raiz do projeto: {ROOT_DIR}")

# Inicializar Flask com configurações para servir arquivos estáticos
app = Flask(__name__, static_folder=None)

# Configurar CORS para permitir requisições do frontend
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5000", "http://127.0.0.1:5000", "null", "file://"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Adicionar suporte para rotas da API v1
@app.route('/api/v1/auth/login', methods=['POST'])
def api_v1_auth_login():
    """
    Endpoint de compatibilidade para login na API v1
    """
    try:
        logger.info("Recebida requisição de login via API v1")
        data = request.get_json()
        
        if not data:
            logger.warning("Dados não fornecidos na requisição de login")
            return jsonify({"error": "Dados não fornecidos"}), 400
        
        email = data.get('email')
        password = data.get('password')
        
        logger.info(f"Tentativa de login para o email: {email}")
        
        if not email or not password:
            logger.warning("Email ou senha não fornecidos")
            return jsonify({"error": "Email e senha são obrigatórios"}), 400
        
        # Importar as funções necessárias
        from modules.auth import get_user_by_email, hash_password
        from flask_jwt_extended import create_access_token
        from datetime import timedelta
        
        # Verificar credenciais de demonstração
        if email == 'demo@rhsuper.com' and password == 'senha123':
            logger.info("Login com credenciais de demonstração via API v1")
            
            # Criar um identificador único para o usuário demo
            user_id = "demo_12345"
            
            # Dados completos do usuário para retornar na resposta
            user_data = {
                'id': user_id,
                'email': email,
                'name': 'Usuário Demo'
            }
            
            # Criar token JWT
            token_expires_seconds = app.config.get('JWT_ACCESS_TOKEN_EXPIRES')
            expires = timedelta(seconds=token_expires_seconds)
            access_token = create_access_token(
                identity=user_id,
                expires_delta=expires
            )
            
            logger.info("Token JWT criado com sucesso para usuário demo via API v1")
            
            # Retornar resposta de sucesso
            return jsonify({
                'token': access_token,
                'user': user_data
            }), 200
        
        # Verificar credenciais no banco de dados
        user = get_user_by_email(email)
        
        if not user:
            logger.warning(f"Usuário não encontrado: {email}")
            return jsonify({"error": "Credenciais inválidas"}), 401
        
        hashed_input_password = hash_password(password)
        stored_password = user['password']
        
        if hashed_input_password != stored_password:
            logger.warning(f"Senha incorreta para: {email}")
            return jsonify({"error": "Credenciais inválidas"}), 401
        
        # Criar token JWT
        user_id = str(user['id'])
        user_data = {
            'id': user_id,
            'email': user['email'],
            'name': user['name'] or email.split('@')[0]
        }
        
        token_expires_seconds = app.config.get('JWT_ACCESS_TOKEN_EXPIRES')
        expires = timedelta(seconds=token_expires_seconds)
        access_token = create_access_token(
            identity=user_id,
            expires_delta=expires
        )
        
        logger.info(f"Login bem-sucedido para o usuário: {email} via API v1")
        
        # Retornar resposta de sucesso
        return jsonify({
            'token': access_token,
            'user': user_data
        }), 200
        
    except Exception as e:
        logger.error(f"Erro no login via API v1: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": "Erro interno do servidor"}), 500

@app.route('/api/v1/auth/logout', methods=['GET'])
def api_v1_auth_logout():
    """
    Endpoint de compatibilidade para logout na API v1
    """
    from flask import redirect
    return redirect('/api/auth/logout')

# Carregar configurações
app.config.from_object(config.Config)

# Configurar JWT
app.config['JWT_SECRET_KEY'] = app.config['JWT_SECRET_KEY']
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(seconds=app.config['JWT_ACCESS_TOKEN_EXPIRES'])
jwt = JWTManager(app)
logger.info("JWT configurado")

# Inicializar módulo de autenticação
init_auth(app, jwt)
logger.info("Módulo de autenticação inicializado")

# Registrar blueprint de pagamentos
app.register_blueprint(payment_bp)
logger.info("Blueprint de pagamentos registrado")

# Garantir que o diretório de uploads existe
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
logger.info(f"Diretório de uploads configurado: {app.config['UPLOAD_FOLDER']}")

from flask_jwt_extended import jwt_required, get_jwt_identity
from database.database import get_user_credits, use_analysis_credit

@app.route('/api/analyze', methods=['POST'])
@jwt_required()
def analyze_cv_endpoint():
    logger.info("Recebida requisição para análise de currículo")
    
    # Obter ID do usuário a partir do token JWT
    current_user = get_jwt_identity()
    user_id = current_user.get('id')
    
    if not user_id:
        logger.warning("Usuário não identificado na requisição")
        return jsonify({'error': 'Usuário não autenticado corretamente'}), 401
    
    # Verificar se o usuário tem créditos disponíveis
    credits = get_user_credits(user_id)
    logger.info(f"Usuário {user_id} tem {credits} créditos disponíveis")
    
    if credits <= 0:
        logger.warning(f"Usuário {user_id} não tem créditos suficientes para análise")
        return jsonify({
            'error': 'Créditos insuficientes',
            'message': 'Você não tem créditos suficientes para realizar uma análise. Por favor, adquira um pacote de análises.'
        }), 403
    
    # Verificar se há arquivo na requisição
    if 'file' not in request.files:
        logger.warning("Requisição sem arquivo")
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400

    file = request.files['file']

    if file.filename == '':
        logger.warning("Nome de arquivo vazio")
        return jsonify({'error': 'Nenhum arquivo selecionado'}), 400

    if file and allowed_file(file.filename):
        try:
            # Garantir que o diretório de uploads existe
            if not ensure_directory_exists(app.config['UPLOAD_FOLDER']):
                logger.error("Falha ao criar diretório de uploads")
                return jsonify({'error': 'Erro interno do servidor ao processar o arquivo'}), 500
                
            # Salvar o arquivo com nome seguro
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            logger.info(f"Salvando arquivo: {filename} em {filepath}")
            file.save(filepath)
            
            # Verificar se o arquivo foi salvo corretamente
            if not os.path.exists(filepath):
                logger.error(f"Arquivo não foi salvo corretamente: {filepath}")
                return jsonify({'error': 'Erro ao salvar o arquivo'}), 500
                
            # Verificar o conteúdo do arquivo
            if not verify_file_content(filepath):
                logger.warning(f"Conteúdo do arquivo inválido: {filepath}")
                safe_delete_file(filepath)
                return jsonify({'error': 'O arquivo enviado não é um documento válido'}), 400

            # Obter links das vagas para comparação
            job_links = request.form.getlist('job_links[]')
            logger.info(f"Links de vagas recebidos: {len(job_links)}")
            
            # Validar links
            validated_links = []
            for link in job_links:
                if link and isinstance(link, str) and link.strip():
                    if link.startswith(('http://', 'https://')):
                        validated_links.append(link.strip())
                    else:
                        # Adicionar protocolo se não tiver
                        validated_links.append('https://' + link.strip())
                        logger.info(f"Adicionado protocolo https:// ao link: {link}")
            
            if len(validated_links) != len(job_links):
                logger.warning(f"Alguns links foram filtrados: {len(job_links)} -> {len(validated_links)}")

            # Processar o currículo
            try:
                logger.info(f"Iniciando análise do currículo: {filename}")
                results = analyze_cv(filepath, validated_links)
                logger.info("Análise concluída com sucesso")

                # Decrementar um crédito do usuário
                credit_used = use_analysis_credit(user_id)
                if not credit_used:
                    logger.error(f"Falha ao decrementar crédito do usuário {user_id}")
                else:
                    logger.info(f"Crédito decrementado com sucesso para o usuário {user_id}")
                
                # Salvar a análise no banco de dados
                analysis_id = save_analysis(user_id, filename, json.dumps(results))
                logger.info(f"Análise salva no banco de dados com ID: {analysis_id}")

                # Remover o arquivo após processamento
                safe_delete_file(filepath)
                logger.info(f"Arquivo removido: {filepath}")

                # Adicionar informação de créditos restantes na resposta
                remaining_credits = get_user_credits(user_id)
                results['credits_remaining'] = remaining_credits
                
                # Verificar se os créditos estão baixos (1 ou 2) e enviar email de alerta
                if remaining_credits <= 2:
                    try:
                        # Obter informações do usuário
                        conn = get_db_connection()
                        cursor = conn.cursor()
                        
                        cursor.execute("SELECT email, name FROM users WHERE id = ?", (user_id,))
                        user = cursor.fetchone()
                        conn.close()
                        
                        if user:
                            from modules.email_service import EmailService
                            
                            # Enviar email de alerta de créditos baixos
                            email_sent = EmailService.send_low_credits_email(
                                user_email=user['email'],
                                user_name=user['name'] or "Cliente",
                                credits_remaining=remaining_credits
                            )
                            
                            if email_sent:
                                logger.info(f"Low credits alert email sent to user {user_id}")
                            else:
                                logger.warning(f"Failed to send low credits alert email to user {user_id}")
                    except Exception as e:
                        logger.error(f"Error sending low credits alert email: {str(e)}")
                
                return jsonify(results)
            except ValueError as e:
                # Erros de validação específicos
                error_details = traceback.format_exc()
                logger.error(f"Erro de validação ao processar currículo: {str(e)}")
                logger.error(f"Detalhes do erro:\n{error_details}")
                
                # Limpar o arquivo
                safe_delete_file(filepath)
                
                return jsonify({
                    'error': str(e),
                    'error_type': 'ValidationError',
                    'error_details': 'O arquivo enviado não pôde ser processado corretamente'
                }), 400
            except Exception as e:
                error_details = traceback.format_exc()
                logger.error(f"Erro ao processar currículo: {str(e)}")
                logger.error(f"Detalhes do erro:\n{error_details}")
                
                # Limpar o arquivo
                safe_delete_file(filepath)
                
                return jsonify({
                    'error': str(e),
                    'error_type': type(e).__name__,
                    'error_details': 'Verifique os logs do servidor para mais informações'
                }), 500
        except Exception as e:
            # Erro ao salvar ou processar o arquivo
            error_details = traceback.format_exc()
            logger.error(f"Erro ao manipular arquivo: {str(e)}")
            logger.error(f"Detalhes do erro:\n{error_details}")
            
            return jsonify({
                'error': 'Erro ao processar o arquivo',
                'error_details': str(e)
            }), 500

    logger.warning(f"Formato de arquivo não permitido: {file.filename}")
    return jsonify({'error': 'Formato de arquivo não permitido. Por favor, envie um arquivo PDF ou DOCX.'}), 400

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'}), 200

@app.route('/api/user/credits', methods=['GET'])
@jwt_required()
def get_user_credits_endpoint():
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('id')
        
        if not user_id:
            return jsonify({
                'error': 'Usuário não autenticado corretamente'
            }), 401
        
        credits = get_user_credits(user_id)
        
        return jsonify({
            'user_id': user_id,
            'credits': credits,
            'needs_credits': credits <= 0,
            'message': 'Você precisa adquirir créditos para realizar análises.' if credits <= 0 else None,
            'package_url': '/payment.html' if credits <= 0 else None
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter créditos do usuário: {str(e)}")
        return jsonify({
            'error': 'Erro ao obter créditos do usuário'
        }), 500

# Rota para a raiz (/) - redireciona para login.html
@app.route('/')
def serve_root():
    logger.info("Redirecionando para página de login")
    from flask import redirect
    return redirect('/login.html')

# Rota para index.html - verifica se há parâmetro de autenticação
@app.route('/index.html')
def serve_index():
    logger.info("Verificando autenticação para index.html")
    from flask import redirect, request
    
    # Verificar se há um parâmetro auth=true na URL
    auth_param = request.args.get('auth')
    redirect_param = request.args.get('redirect')
    
    # Se tiver parâmetro auth=true ou redirect=true, serve index.html
    if auth_param == 'true' or redirect_param == 'true':
        logger.info("Parâmetro auth=true ou redirect=true encontrado, servindo index.html")
        return send_from_directory(ROOT_DIR, 'index.html')
    else:
        # Se não tiver parâmetro auth=true, redireciona para login com parâmetro redirect
        logger.info("Parâmetros de autenticação não encontrados, redirecionando para login.html")
        return redirect('/login.html?redirect=index')

# Rota especial para usuários logados
@app.route('/dashboard')
def serve_dashboard():
    logger.info("Servindo dashboard (index.html)")
    return send_from_directory(ROOT_DIR, 'index.html')

# Rota para servir arquivos estáticos
@app.route('/<path:path>')
def serve_static(path):
    # Verificar se o arquivo está no diretório raiz
    root_path = os.path.join(ROOT_DIR, path)
    if os.path.exists(root_path) and os.path.isfile(root_path):
        return send_from_directory(ROOT_DIR, path)
    
    # Verificar se o arquivo está no diretório frontend
    frontend_path = os.path.join(ROOT_DIR, 'frontend', path.replace('frontend/', '', 1))
    if os.path.exists(frontend_path) and os.path.isfile(frontend_path):
        return send_from_directory(os.path.join(ROOT_DIR, 'frontend'), path.replace('frontend/', '', 1))
    
    # Se não encontrar o arquivo, retornar 404
    return "Arquivo não encontrado", 404

if __name__ == '__main__':
    init_db()  # Inicializar banco de dados
    app.run(debug=app.config['DEBUG'], host='0.0.0.0', port=app.config['PORT'])
