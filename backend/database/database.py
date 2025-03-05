import sqlite3
import os
import json
from datetime import datetime
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Usar caminho absoluto para o banco de dados
DATABASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'database', 'cv_analysis.db')

def get_db_connection():
    """Cria e retorna uma conexão com o banco de dados"""
    # Garantir que o diretório existe
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)

    logger.info(f"Conectando ao banco de dados: {DATABASE_PATH}")
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
            name TEXT,
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
        
        # Criar tabela de créditos de análise
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS analysis_credits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            credits INTEGER NOT NULL DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        ''')
        
        # Criar tabela de pagamentos
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            payment_intent_id TEXT UNIQUE NOT NULL,
            amount REAL NOT NULL,
            status TEXT NOT NULL,
            payment_method TEXT NOT NULL,
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

def get_user_credits(user_id):
    """
    Recupera o número de créditos de análise disponíveis para um usuário
    
    Args:
        user_id: ID do usuário
        
    Returns:
        int: Número de créditos disponíveis
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verificar se o usuário já tem um registro de créditos
        cursor.execute(
            "SELECT credits FROM analysis_credits WHERE user_id = ?",
            (user_id,)
        )
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return result['credits']
        else:
            # Se não existir, criar um registro com 0 créditos
            add_user_credits(user_id, 0)
            return 0
            
    except Exception as e:
        logger.error(f"Erro ao recuperar créditos do usuário: {str(e)}")
        return 0

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

def use_analysis_credit(user_id):
    """
    Utiliza um crédito de análise do usuário
    
    Args:
        user_id: ID do usuário
        
    Returns:
        bool: True se o crédito foi utilizado com sucesso, False caso contrário
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verificar se o usuário tem créditos suficientes
        cursor.execute(
            "SELECT id, credits FROM analysis_credits WHERE user_id = ?",
            (user_id,)
        )
        
        result = cursor.fetchone()
        
        if not result or result['credits'] <= 0:
            conn.close()
            logger.warning(f"Usuário {user_id} não tem créditos suficientes para análise")
            return False
            
        # Decrementar crédito
        new_credits = result['credits'] - 1
        cursor.execute(
            "UPDATE analysis_credits SET credits = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (new_credits, result['id'])
        )
        
        conn.commit()
        conn.close()
        
        logger.info(f"Crédito utilizado pelo usuário {user_id}. Créditos restantes: {new_credits}")
        return True
        
    except Exception as e:
        logger.error(f"Erro ao utilizar crédito de análise: {str(e)}")
        return False

def register_payment(user_id, payment_intent_id, amount, status, payment_method):
    """
    Registra um pagamento no banco de dados
    
    Args:
        user_id: ID do usuário
        payment_intent_id: ID do PaymentIntent do Stripe
        amount: Valor do pagamento
        status: Status do pagamento
        payment_method: Método de pagamento (pix, boleto, card)
        
    Returns:
        int: ID do pagamento registrado
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """
            INSERT INTO payments (user_id, payment_intent_id, amount, status, payment_method)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, payment_intent_id, amount, status, payment_method)
        )
        
        payment_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        logger.info(f"Pagamento registrado: ID {payment_id}, usuário {user_id}, valor {amount}")
        return payment_id
        
    except Exception as e:
        logger.error(f"Erro ao registrar pagamento: {str(e)}")
        return None
