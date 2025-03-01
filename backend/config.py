import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

class Config:
    # Configurações do Servidor
    DEBUG = os.getenv('DEBUG', 'False') == 'True'
    PORT = int(os.getenv('PORT', 5000))
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    DATABASE_URI = os.getenv('DATABASE_URI', 'sqlite:///database/cv_analysis.db')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload
    
    # Chaves de API
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
    
    # Configurações de Autenticação Social
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
    LINKEDIN_API_KEY = os.getenv('LINKEDIN_API_KEY')
    LINKEDIN_API_SECRET = os.getenv('LINKEDIN_API_SECRET')
    
    # Configurações de Segurança
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600))  # 1 hora em segundos
