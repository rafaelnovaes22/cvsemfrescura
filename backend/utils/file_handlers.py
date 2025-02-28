import os
import logging
import traceback
import mimetypes

# Obter logger configurado
logger = logging.getLogger(__name__)

# Extensões de arquivo permitidas
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}

# Tipos MIME permitidos
ALLOWED_MIME_TYPES = {
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
}

def allowed_file(filename):
    """
    Verifica se o arquivo possui uma extensão permitida
    
    Args:
        filename (str): Nome do arquivo a ser verificado
        
    Returns:
        bool: True se o arquivo tem uma extensão permitida, False caso contrário
    """
    if not filename or not isinstance(filename, str):
        logger.warning(f"Nome de arquivo inválido: {filename}")
        return False
        
    if '.' not in filename:
        logger.warning(f"Arquivo sem extensão: {filename}")
        return False
        
    extension = filename.rsplit('.', 1)[1].lower()
    
    # Verificar extensão
    is_allowed = extension in ALLOWED_EXTENSIONS
    
    if is_allowed:
        logger.info(f"Arquivo com extensão permitida: {extension}")
    else:
        logger.warning(f"Arquivo com extensão não permitida: {extension}")
        
    return is_allowed

def verify_file_content(file_path):
    """
    Verifica se o conteúdo do arquivo corresponde ao tipo esperado
    
    Args:
        file_path (str): Caminho para o arquivo
        
    Returns:
        bool: True se o conteúdo do arquivo é válido, False caso contrário
    """
    try:
        if not os.path.exists(file_path):
            logger.warning(f"Arquivo não encontrado: {file_path}")
            return False
            
        # Verificar tamanho do arquivo
        file_size = os.path.getsize(file_path)
        if file_size == 0:
            logger.warning(f"Arquivo vazio: {file_path}")
            return False
            
        if file_size > 10 * 1024 * 1024:  # 10MB
            logger.warning(f"Arquivo muito grande: {file_size / 1024 / 1024:.2f} MB")
            return False
            
        # Verificar tipo MIME
        mime_type, _ = mimetypes.guess_type(file_path)
        
        if mime_type in ALLOWED_MIME_TYPES:
            logger.info(f"Arquivo com tipo MIME permitido: {mime_type}")
            return True
        else:
            logger.warning(f"Arquivo com tipo MIME não permitido: {mime_type}")
            return False
            
    except Exception as e:
        logger.error(f"Erro ao verificar conteúdo do arquivo {file_path}: {str(e)}")
        logger.error(traceback.format_exc())
        return False

def safe_delete_file(file_path):
    """
    Remove um arquivo com tratamento de erros
    
    Args:
        file_path (str): Caminho para o arquivo a ser removido
    """
    if not file_path or not isinstance(file_path, str):
        logger.warning("Caminho de arquivo inválido para remoção")
        return
        
    try:
        if os.path.exists(file_path):
            # Verificar se é um arquivo (não um diretório)
            if not os.path.isfile(file_path):
                logger.warning(f"Tentativa de remover um não-arquivo: {file_path}")
                return
                
            # Verificar permissões
            if not os.access(file_path, os.W_OK):
                logger.warning(f"Sem permissão para remover arquivo: {file_path}")
                return
                
            # Remover o arquivo
            os.remove(file_path)
            logger.info(f"Arquivo removido com sucesso: {file_path}")
        else:
            logger.warning(f"Tentativa de remover arquivo inexistente: {file_path}")
    except PermissionError:
        logger.error(f"Erro de permissão ao remover arquivo {file_path}")
        logger.error(traceback.format_exc())
    except OSError as e:
        logger.error(f"Erro do sistema de arquivos ao remover {file_path}: {str(e)}")
        logger.error(traceback.format_exc())
    except Exception as e:
        logger.error(f"Erro inesperado ao remover arquivo {file_path}: {str(e)}")
        logger.error(traceback.format_exc())

def ensure_directory_exists(directory_path):
    """
    Garante que um diretório existe, criando-o se necessário
    
    Args:
        directory_path (str): Caminho para o diretório
        
    Returns:
        bool: True se o diretório existe ou foi criado com sucesso, False caso contrário
    """
    try:
        if not os.path.exists(directory_path):
            logger.info(f"Criando diretório: {directory_path}")
            os.makedirs(directory_path, exist_ok=True)
            logger.info(f"Diretório criado com sucesso: {directory_path}")
        return True
    except Exception as e:
        logger.error(f"Erro ao criar diretório {directory_path}: {str(e)}")
        logger.error(traceback.format_exc())
        return False
