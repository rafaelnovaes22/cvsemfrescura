import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

class Config:
    DEBUG = os.getenv('DEBUG', 'False') == 'True'
    PORT = int(os.getenv('PORT', 5000))
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    DATABASE_URI = os.getenv('DATABASE_URI', 'sqlite:///database/cv_analysis.db')
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')  # Add this line
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload