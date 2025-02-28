import sqlite3
import os
import json
from datetime import datetime
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_PATH = 'database/cv_analysis.db'

def get_db_connection():
    """Cria e retorna uma conexão com o banco de dados"""
    # Garantir que o diretório existe
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)

    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Resultados como dicionários
    return conn

def init_db():
    """Inicializa o banco de dados com as tabelas necessárias"""
    logger.info("Inicializando banco de dados...")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Criar tabela de usuários
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        # Criar tabela de análises
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            cv_name TEXT NOT NULL,
            results TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        ''')

        conn.commit()
        conn.close()
        logger.info("Banco de dados inicializado com sucesso")
    except Exception as e:
        logger.error(f"Erro ao inicializar banco de dados: {str(e)}")
        raise

def save_analysis(user_id, cv_name, results):
    """Salva uma análise no banco de dados"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            "INSERT INTO analyses (user_id, cv_name, results) VALUES (?, ?, ?)",
            (user_id, cv_name, results)
        )

        analysis_id = cursor.lastrowid
        conn.commit()
        conn.close()

        logger.info(f"Análise salva com ID: {analysis_id}")
        return analysis_id
    except Exception as e:
        logger.error(f"Erro ao salvar análise: {str(e)}")
        raise

def get_user_analyses(user_id):
    """Recupera todas as análises de um usuário"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT id, cv_name, created_at FROM analyses WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,)
        )

        analyses = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return analyses
    except Exception as e:
        logger.error(f"Erro ao recuperar análises do usuário: {str(e)}")
        return []

def get_analysis_by_id(analysis_id):
    """Recupera uma análise específica pelo ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM analyses WHERE id = ?",
            (analysis_id,)
        )

        analysis = cursor.fetchone()
        conn.close()

        if analysis:
            analysis = dict(analysis)
            analysis['results'] = json.loads(analysis['results'])

        return analysis
    except Exception as e:
        logger.error(f"Erro ao recuperar análise por ID: {str(e)}")
        return None