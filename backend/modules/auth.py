import os
import json
import requests
from flask import request, jsonify
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required
)
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from oauthlib.oauth2 import WebApplicationClient
from requests_oauthlib import OAuth2Session
import logging

# Configurar logger
logger = logging.getLogger(__name__)

# Configurações do Google OAuth
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')

# Configurações do LinkedIn OAuth
LINKEDIN_API_KEY = os.getenv('LINKEDIN_API_KEY')
LINKEDIN_API_SECRET = os.getenv('LINKEDIN_API_SECRET')

# Cliente para OAuth do Google
google_client = WebApplicationClient(GOOGLE_CLIENT_ID)

def init_auth(app, jwt):
    """
    Inicializa as rotas de autenticação
    
    Args:
        app: Instância do Flask
        jwt: Instância do JWTManager
    """
    # Rota para login com credenciais
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({"error": "Dados não fornecidos"}), 400
                
            email = data.get('email')
            password = data.get('password')
            
            if not email or not password:
                return jsonify({"error": "Email e senha são obrigatórios"}), 400
            
            # Aqui você implementaria a verificação de credenciais no banco de dados
            # Por enquanto, vamos usar credenciais de demonstração
            if email == 'demo@rhsuper.com' and password == 'senha123':
                user_data = {
                    'id': '12345',
                    'email': email,
                    'name': 'Usuário Demo'
                }
                
                # Criar token JWT
                access_token = create_access_token(identity=user_data)
                
                return jsonify({
                    'access_token': access_token,
                    'user': user_data
                }), 200
            else:
                return jsonify({"error": "Credenciais inválidas"}), 401
                
        except Exception as e:
            logger.error(f"Erro no login: {str(e)}")
            return jsonify({"error": "Erro interno do servidor"}), 500
    
    # Rota para verificar token JWT
    @app.route('/api/auth/verify', methods=['GET'])
    @jwt_required()
    def verify_token():
        try:
            current_user = get_jwt_identity()
            return jsonify({"user": current_user, "authenticated": True}), 200
        except Exception as e:
            logger.error(f"Erro ao verificar token: {str(e)}")
            return jsonify({"error": "Token inválido"}), 401
    
    # Rota para login com Google
    @app.route('/api/auth/google', methods=['POST'])
    def google_auth():
        try:
            data = request.get_json()
            
            if not data or 'token' not in data:
                return jsonify({"error": "Token não fornecido"}), 400
                
            token = data.get('token')
            
            try:
                # Verificar o token com o Google
                idinfo = id_token.verify_oauth2_token(
                    token, 
                    google_requests.Request(), 
                    GOOGLE_CLIENT_ID
                )
                
                # Extrair informações do usuário
                user_data = {
                    'id': idinfo['sub'],
                    'email': idinfo['email'],
                    'name': idinfo.get('name', 'Usuário Google'),
                    'picture': idinfo.get('picture', None),
                    'provider': 'google'
                }
                
                # Aqui você verificaria se o usuário já existe no banco de dados
                # e o criaria se necessário
                
                # Criar token JWT
                access_token = create_access_token(identity=user_data)
                
                return jsonify({
                    'access_token': access_token,
                    'user': user_data
                }), 200
                
            except ValueError as e:
                logger.error(f"Token do Google inválido: {str(e)}")
                return jsonify({"error": "Token do Google inválido"}), 401
                
        except Exception as e:
            logger.error(f"Erro na autenticação com Google: {str(e)}")
            return jsonify({"error": "Erro interno do servidor"}), 500
    
    # Rota para login com LinkedIn
    @app.route('/api/auth/linkedin', methods=['POST'])
    def linkedin_auth():
        try:
            data = request.get_json()
            
            if not data or 'code' not in data:
                return jsonify({"error": "Código de autorização não fornecido"}), 400
                
            code = data.get('code')
            redirect_uri = data.get('redirect_uri')
            
            # Obter token de acesso do LinkedIn
            token_url = 'https://www.linkedin.com/oauth/v2/accessToken'
            token_payload = {
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': redirect_uri,
                'client_id': LINKEDIN_API_KEY,
                'client_secret': LINKEDIN_API_SECRET
            }
            
            token_response = requests.post(token_url, data=token_payload)
            
            if token_response.status_code != 200:
                logger.error(f"Erro ao obter token do LinkedIn: {token_response.text}")
                return jsonify({"error": "Falha na autenticação com LinkedIn"}), 401
                
            token_data = token_response.json()
            access_token = token_data.get('access_token')
            
            # Obter informações do perfil do LinkedIn
            profile_url = 'https://api.linkedin.com/v2/me'
            email_url = 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))'
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'cache-control': 'no-cache',
                'X-Restli-Protocol-Version': '2.0.0'
            }
            
            profile_response = requests.get(profile_url, headers=headers)
            email_response = requests.get(email_url, headers=headers)
            
            if profile_response.status_code != 200 or email_response.status_code != 200:
                logger.error(f"Erro ao obter perfil do LinkedIn: {profile_response.text}, {email_response.text}")
                return jsonify({"error": "Falha ao obter informações do perfil do LinkedIn"}), 401
                
            profile_data = profile_response.json()
            email_data = email_response.json()
            
            # Extrair informações do usuário
            user_data = {
                'id': profile_data.get('id'),
                'name': f"{profile_data.get('localizedFirstName', '')} {profile_data.get('localizedLastName', '')}".strip(),
                'email': email_data.get('elements', [{}])[0].get('handle~', {}).get('emailAddress', ''),
                'provider': 'linkedin'
            }
            
            # Aqui você verificaria se o usuário já existe no banco de dados
            # e o criaria se necessário
            
            # Criar token JWT
            access_token = create_access_token(identity=user_data)
            
            return jsonify({
                'access_token': access_token,
                'user': user_data
            }), 200
            
        except Exception as e:
            logger.error(f"Erro na autenticação com LinkedIn: {str(e)}")
            return jsonify({"error": "Erro interno do servidor"}), 500
    
    # Rota para fornecer configurações de autenticação para o frontend
    @app.route('/api/auth/config', methods=['GET'])
    def auth_config():
        try:
            # Retornar apenas as configurações públicas necessárias para o frontend
            config = {
                'googleClientId': GOOGLE_CLIENT_ID,
                'linkedinApiKey': LINKEDIN_API_KEY
            }
            return jsonify(config), 200
        except Exception as e:
            logger.error(f"Erro ao obter configurações de autenticação: {str(e)}")
            return jsonify({"error": "Erro interno do servidor"}), 500
    
    # Rota para logout (opcional, já que os tokens JWT são stateless)
    @app.route('/api/auth/logout', methods=['POST'])
    @jwt_required()
    def logout():
        # Em uma implementação real, você poderia adicionar o token a uma lista de tokens revogados
        return jsonify({"message": "Logout realizado com sucesso"}), 200
