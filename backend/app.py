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
from database.database import init_db, save_analysis
from utils.file_handlers import allowed_file, verify_file_content, safe_delete_file, ensure_directory_exists
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

# Criar logger específico para este módulo
logger = logging.getLogger(__name__)
logger.info("Iniciando aplicação...")

app = Flask(__name__)
# Configurar CORS para permitir requisições de qualquer origem durante o desenvolvimento
CORS(app, resources={r"/*": {"origins": "*"}})

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

# Garantir que o diretório de uploads existe
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
logger.info(f"Diretório de uploads configurado: {app.config['UPLOAD_FOLDER']}")

@app.route('/api/analyze', methods=['POST'])
def analyze_cv_endpoint():
    logger.info("Recebida requisição para análise de currículo")
    
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

                # Opcionalmente, salvar a análise no banco de dados
                user_id = None  # Implementar autenticação posteriormente
                analysis_id = save_analysis(user_id, filename, json.dumps(results))
                logger.info(f"Análise salva no banco de dados com ID: {analysis_id}")

                # Remover o arquivo após processamento
                safe_delete_file(filepath)
                logger.info(f"Arquivo removido: {filepath}")

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

# Configurar diretório raiz do projeto
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
logger.info(f"Diretório raiz do projeto: {ROOT_DIR}")

# Rota para a raiz (/) - serve index.html
@app.route('/')
def serve_index():
    logger.info("Servindo página inicial (index.html)")
    return send_from_directory(ROOT_DIR, 'index.html')

# Rota para servir arquivos estáticos do diretório raiz
@app.route('/<path:path>')
def serve_static(path):
    logger.info(f"Servindo arquivo estático: {path}")
    return send_from_directory(ROOT_DIR, path)

if __name__ == '__main__':
    init_db()  # Inicializar banco de dados
    app.run(debug=app.config['DEBUG'], host='0.0.0.0', port=app.config['PORT'])
