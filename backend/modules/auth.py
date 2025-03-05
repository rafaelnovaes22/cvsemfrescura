import os
import json
import secrets
import smtplib
import hashlib
import sqlite3
import traceback
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import request, jsonify
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required
)
import logging
from datetime import datetime, timedelta

# Configurar logger
logger = logging.getLogger(__name__)

# Funções auxiliares para autenticação
def hash_password(password):
    """
    Cria um hash seguro da senha
    
    Args:
        password: Senha em texto plano
        
    Returns:
        str: Hash da senha
    """
    return hashlib.sha256(password.encode()).hexdigest()

def get_db_connection():
    """
    Cria e retorna uma conexão com o banco de dados
    """
    try:
        # Definir o caminho do banco de dados
        db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'database', 'cv_analysis.db')
        
        # Verificar se o diretório existe
        db_dir = os.path.dirname(db_path)
        if not os.path.exists(db_dir):
            logger.info(f"Criando diretório: {db_dir}")
            os.makedirs(db_dir, exist_ok=True)
        
        # Verificar se o banco de dados existe
        db_exists = os.path.exists(db_path)
        logger.info(f"Banco de dados existe: {db_exists}")
        
        # Conectar ao banco de dados
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        
        # Criar tabelas se não existirem
        cursor = conn.cursor()
        
        # Tabela de usuários - verificar se já existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            # Criar tabela de usuários
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            ''')
            logger.info("Tabela 'users' criada com sucesso")
        else:
            # Verificar estrutura da tabela
            cursor.execute("PRAGMA table_info(users)")
            columns = cursor.fetchall()
            column_names = [column[1] for column in columns]
            logger.info(f"Colunas existentes na tabela 'users': {column_names}")
            
            # Verificar se a coluna 'name' existe
            if 'name' not in column_names:
                # Adicionar coluna 'name' se não existir
                try:
                    cursor.execute("ALTER TABLE users ADD COLUMN name TEXT")
                    logger.info("Coluna 'name' adicionada à tabela 'users'")
                except sqlite3.OperationalError as e:
                    logger.error(f"Erro ao adicionar coluna 'name': {str(e)}")
        
        # Tabela de créditos de análise
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS analysis_credits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            credits INTEGER NOT NULL DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        ''')
        
        conn.commit()
        
        return conn
    except Exception as e:
        logger.error(f"Erro ao conectar ao banco de dados: {str(e)}")
        logger.error(traceback.format_exc())
        raise

def get_user_by_email(email):
    """
    Busca um usuário pelo email
    
    Args:
        email: Email do usuário
        
    Returns:
        dict: Dados do usuário ou None se não encontrado
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        
        conn.close()
        
        if user:
            return dict(user)
        return None
    except Exception as e:
        logger.error(f"Erro ao buscar usuário por email: {str(e)}")
        return None

def add_user_credits(user_id, credits_to_add):
    """
    Adiciona créditos de análise para um usuário
    
    Args:
        user_id: ID do usuário
        credits_to_add: Número de créditos a adicionar
        
    Returns:
        int: Novo total de créditos
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verificar se o usuário já tem um registro de créditos
        cursor.execute(
            "SELECT id, credits FROM analysis_credits WHERE user_id = ?",
            (user_id,)
        )
        
        result = cursor.fetchone()
        
        if result:
            # Atualizar créditos existentes
            new_credits = result['credits'] + credits_to_add
            cursor.execute(
                "UPDATE analysis_credits SET credits = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (new_credits, result['id'])
            )
        else:
            # Criar novo registro de créditos
            new_credits = credits_to_add
            cursor.execute(
                "INSERT INTO analysis_credits (user_id, credits) VALUES (?, ?)",
                (user_id, new_credits)
            )
        
        conn.commit()
        conn.close()
        
        logger.info(f"Adicionados {credits_to_add} créditos para o usuário {user_id}. Novo total: {new_credits}")
        return new_credits
        
    except Exception as e:
        logger.error(f"Erro ao adicionar créditos para o usuário: {str(e)}")
        return None

def create_user(email, password, name=None):
    """
    Cria um novo usuário no banco de dados
    
    Args:
        email: Email do usuário
        password: Senha em texto plano (será hasheada)
        name: Nome do usuário (opcional)
        
    Returns:
        dict: Dados do usuário criado ou None se falhar
    """
    try:
        # Verificar se o usuário já existe
        existing_user = get_user_by_email(email)
        if existing_user:
            logger.warning(f"Tentativa de criar usuário com email já existente: {email}")
            return None
        
        # Usar a função get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Hash da senha
        hashed_password = hash_password(password)
        
        # Inserir usuário
        cursor.execute(
            "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
            (email, hashed_password, name or email.split('@')[0])
        )
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        logger.info(f"Usuário criado com sucesso: {email}, ID: {user_id}")
        
        # Inicializar créditos do usuário
        try:
            add_user_credits(user_id, 0)
            logger.info(f"Créditos inicializados para o usuário {user_id}")
        except Exception as credit_error:
            logger.error(f"Erro ao inicializar créditos para o usuário {user_id}: {str(credit_error)}")
            # Não falhar o registro se a inicialização de créditos falhar
        
        # Retornar dados do usuário
        return {
            'id': user_id,
            'email': email,
            'name': name or email.split('@')[0]
        }
    except Exception as e:
        logger.error(f"Erro ao criar usuário: {str(e)}")
        logger.error(traceback.format_exc())
        return None

def init_auth(app, jwt):
    """
    Inicializa as rotas de autenticação
    
    Args:
        app: Instância do Flask
        jwt: Instância do JWTManager
    """
    try:
        # Rota para registro de usuário
        @app.route('/api/auth/register', methods=['POST'])
        def register():
            try:
                data = request.get_json()
                
                if not data:
                    return jsonify({"error": "Dados não fornecidos"}), 400
                    
                email = data.get('email')
                password = data.get('password')
                name = data.get('name')
                
                if not email or not password:
                    return jsonify({"error": "Email e senha são obrigatórios"}), 400
                    
                # Verificar se o email já está em uso
                existing_user = get_user_by_email(email)
                if existing_user:
                    return jsonify({"error": "Este email já está em uso"}), 400
                    
                # Criar usuário
                user = create_user(email, password, name)
                if not user:
                    return jsonify({"error": "Falha ao criar usuário"}), 500
                
                # Converter o ID para string para garantir consistência
                user_id = str(user['id'])
                
                # Usar apenas o ID como identidade para o JWT
                jwt_identity = user_id
                
                try:
                    # Criar token JWT
                    logger.info(f"Criando token JWT para o novo usuário {user_id} com identidade: {jwt_identity}")
                    access_token = create_access_token(identity=jwt_identity)
                    
                    logger.info("Token JWT criado com sucesso para o novo usuário")
                    
                    return jsonify({
                        "success": True,
                        "message": "Usuário registrado com sucesso",
                        "token": access_token,  # Usando 'token' em vez de 'access_token' para consistência
                        "user": user
                    }), 201
                except Exception as token_error:
                    logger.error(f"Erro ao criar token JWT para o novo usuário: {str(token_error)}")
                    logger.error(f"Tipo de erro: {type(token_error).__name__}")
                    logger.error(traceback.format_exc())
                    
                    # Mesmo que falhe ao criar o token, o usuário já foi criado
                    # Retornar sucesso parcial
                    return jsonify({
                        "success": True,
                        "message": "Usuário registrado com sucesso, mas houve um erro ao gerar o token de autenticação. Por favor, faça login manualmente.",
                        "user": user
                    }), 201
                
            except Exception as e:
                logger.error(f"Erro no registro: {str(e)}")
                logger.error(traceback.format_exc())
                return jsonify({"error": "Erro interno do servidor"}), 500
        
        # Rota para login com credenciais
        @app.route('/api/auth/login', methods=['POST'])
        def login():
            try:
                logger.info("Recebida requisição de login")
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
                
                # Verificar credenciais de demonstração
                if email == 'demo@rhsuper.com' and password == 'senha123':
                    logger.info("Login com credenciais de demonstração")
                    
                    # Criar um identificador único para o usuário demo
                    user_id = "demo_12345"
                    
                    # Criar um objeto de identidade simplificado para o JWT
                    # Usando apenas o ID como identidade para evitar problemas de serialização
                    jwt_identity = user_id
                    
                    # Dados completos do usuário para retornar na resposta
                    user_data = {
                        'id': user_id,
                        'email': email,
                        'name': 'Usuário Demo'
                    }
                    
                    # Criar token JWT com tempo de expiração
                    try:
                        # Verificar se a configuração JWT_ACCESS_TOKEN_EXPIRES existe
                        if 'JWT_ACCESS_TOKEN_EXPIRES' not in app.config:
                            logger.error("Configuração JWT_ACCESS_TOKEN_EXPIRES não encontrada")
                            return jsonify({"error": "Erro de configuração do servidor"}), 500
                        
                        # Obter o tempo de expiração da configuração
                        expires = app.config.get('JWT_ACCESS_TOKEN_EXPIRES')
                        
                        # Verificar se já é um objeto timedelta
                        if not isinstance(expires, timedelta):
                            logger.info(f"Convertendo segundos para timedelta: {expires} segundos")
                            expires = timedelta(seconds=int(expires))
                        else:
                            logger.info(f"Usando timedelta existente: {expires}")
                        
                        expiry = datetime.utcnow() + expires
                        
                        # Criar o token JWT
                        logger.info(f"Criando token JWT para o usuário demo com identidade: {jwt_identity}")
                        access_token = create_access_token(
                            identity=jwt_identity,
                            expires_delta=expires
                        )
                        
                        logger.info("Token JWT criado com sucesso para usuário demo")
                        
                        # Retornar resposta de sucesso
                        return jsonify({
                            'token': access_token,
                            'user': user_data,
                            'expiry': expiry.isoformat()
                        }), 200
                    except Exception as token_error:
                        logger.error(f"Erro ao criar token JWT: {str(token_error)}")
                        logger.error(f"Tipo de erro: {type(token_error).__name__}")
                        logger.error(traceback.format_exc())
                        return jsonify({"error": "Erro ao gerar token de autenticação"}), 500
                
                # Verificar credenciais no banco de dados
                try:
                    logger.info(f"Verificando credenciais no banco de dados para: {email}")
                    user = get_user_by_email(email)
                    
                    if not user:
                        logger.warning(f"Usuário não encontrado: {email}")
                        return jsonify({"error": "Credenciais inválidas"}), 401
                    
                    logger.info("Usuário encontrado, verificando senha")
                    hashed_input_password = hash_password(password)
                    stored_password = user['password']
                    
                    if hashed_input_password == stored_password:
                        logger.info("Senha válida, gerando token")
                        
                        # Converter o ID para string para garantir consistência
                        user_id = str(user['id'])
                        
                        # Usar apenas o ID como identidade para o JWT
                        jwt_identity = user_id
                        
                        # Dados completos do usuário para retornar na resposta
                        user_data = {
                            'id': user_id,
                            'email': user['email'],
                            'name': user['name'] or email.split('@')[0]
                        }
                        
                        # Criar token JWT com tempo de expiração
                        try:
                            # Verificar se a configuração JWT_ACCESS_TOKEN_EXPIRES existe
                            if 'JWT_ACCESS_TOKEN_EXPIRES' not in app.config:
                                logger.error("Configuração JWT_ACCESS_TOKEN_EXPIRES não encontrada")
                                return jsonify({"error": "Erro de configuração do servidor"}), 500
                            
                            # Obter o tempo de expiração da configuração
                            expires = app.config.get('JWT_ACCESS_TOKEN_EXPIRES')
                            
                            # Verificar se já é um objeto timedelta
                            if not isinstance(expires, timedelta):
                                logger.info(f"Convertendo segundos para timedelta: {expires} segundos")
                                expires = timedelta(seconds=int(expires))
                            else:
                                logger.info(f"Usando timedelta existente: {expires}")
                            
                            expiry = datetime.utcnow() + expires
                            
                            # Criar o token JWT
                            logger.info(f"Criando token JWT para o usuário {user_id} com identidade: {jwt_identity}")
                            access_token = create_access_token(
                                identity=jwt_identity,
                                expires_delta=expires
                            )
                            
                            logger.info("Token JWT criado com sucesso para usuário do banco de dados")
                            
                            # Retornar resposta de sucesso
                            return jsonify({
                                'token': access_token,
                                'user': user_data,
                                'expiry': expiry.isoformat()
                            }), 200
                        except Exception as token_error:
                            logger.error(f"Erro ao criar token JWT para usuário do banco: {str(token_error)}")
                            logger.error(f"Tipo de erro: {type(token_error).__name__}")
                            logger.error(traceback.format_exc())
                            return jsonify({"error": "Erro ao gerar token de autenticação"}), 500
                    else:
                        logger.warning("Senha inválida")
                        return jsonify({"error": "Credenciais inválidas"}), 401
                except Exception as db_error:
                    logger.error(f"Erro ao verificar credenciais no banco: {str(db_error)}")
                    logger.error(traceback.format_exc())
                    return jsonify({"error": "Erro ao verificar credenciais"}), 500
                
            except Exception as e:
                logger.error(f"Erro no login: {str(e)}")
                logger.error(traceback.format_exc())
                return jsonify({"error": "Erro interno do servidor"}), 500
        
        # Rota para verificar token JWT
        @app.route('/api/auth/verify', methods=['GET'])
        @jwt_required()
        def verify_token():
            try:
                # Obter a identidade do token JWT (que agora é apenas o ID do usuário)
                user_id = get_jwt_identity()
                logger.info(f"Token verificado para o usuário com ID: {user_id}")
                
                # Verificar se é um usuário demo
                if user_id == "demo_12345":
                    # Para usuário demo, retornar dados fixos
                    user_data = {
                        'id': user_id,
                        'email': 'demo@rhsuper.com',
                        'name': 'Usuário Demo'
                    }
                    return jsonify({
                        "authenticated": True,
                        "user": user_data
                    }), 200
                
                # Para usuários regulares, buscar dados no banco de dados
                try:
                    # Converter para inteiro se for um usuário regular
                    db_user_id = int(user_id)
                    
                    # Conectar ao banco de dados
                    conn = get_db_connection()
                    cursor = conn.cursor()
                    
                    # Buscar dados do usuário
                    cursor.execute("SELECT id, email, name FROM users WHERE id = ?", (db_user_id,))
                    user = cursor.fetchone()
                    conn.close()
                    
                    if not user:
                        logger.warning(f"Usuário com ID {db_user_id} não encontrado no banco de dados")
                        return jsonify({"error": "Usuário não encontrado"}), 404
                    
                    # Converter para dicionário e garantir que o ID seja string
                    user_data = dict(user)
                    user_data['id'] = str(user_data['id'])
                    
                    return jsonify({
                        "authenticated": True,
                        "user": user_data
                    }), 200
                    
                except ValueError:
                    # Se não conseguir converter para inteiro, é um formato de ID inválido
                    logger.error(f"Formato de ID inválido: {user_id}")
                    return jsonify({"error": "Token inválido"}), 401
                except Exception as db_error:
                    logger.error(f"Erro ao buscar dados do usuário: {str(db_error)}")
                    logger.error(traceback.format_exc())
                    return jsonify({"error": "Erro ao verificar usuário"}), 500
                
            except Exception as e:
                logger.error(f"Erro ao verificar token: {str(e)}")
                logger.error(traceback.format_exc())
                return jsonify({"error": "Token inválido"}), 401
                
    except Exception as e:
        logger.error(f"Erro ao inicializar módulo de autenticação: {str(e)}")
        logger.error(traceback.format_exc())
        raise
