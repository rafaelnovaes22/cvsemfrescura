import PyPDF2
from docx import Document
import os
import logging
import traceback
import mimetypes

# Obter logger configurado
logger = logging.getLogger(__name__)

def extract_text_from_file(file_path):
    """
    Extrai texto de um arquivo PDF ou DOCX

    Args:
        file_path (str): Caminho para o arquivo

    Returns:
        str: Texto extraído do arquivo ou None em caso de erro
    """
    try:
        # Verificar se o arquivo existe
        if not os.path.exists(file_path):
            error_msg = f"Arquivo não encontrado: {file_path}"
            logger.error(error_msg)
            raise FileNotFoundError(error_msg)

        # Verificar tamanho do arquivo
        file_size = os.path.getsize(file_path)
        logger.info(f"Tamanho do arquivo: {file_size / 1024:.2f} KB")
        
        if file_size == 0:
            error_msg = f"Arquivo vazio: {file_path}"
            logger.error(error_msg)
            raise ValueError(error_msg)
            
        if file_size > 10 * 1024 * 1024:  # 10MB
            logger.warning(f"Arquivo muito grande ({file_size / 1024 / 1024:.2f} MB), pode causar problemas")

        # Identificar o tipo de arquivo
        file_extension = file_path.split('.')[-1].lower()
        mime_type, _ = mimetypes.guess_type(file_path)
        
        logger.info(f"Extraindo texto de arquivo {file_extension} (MIME: {mime_type}): {file_path}")

        # Extrair texto baseado no tipo de arquivo
        text = ""
        
        if file_extension == 'pdf':
            try:
                with open(file_path, 'rb') as file:
                    reader = PyPDF2.PdfReader(file)
                    
                    if len(reader.pages) == 0:
                        logger.warning(f"PDF sem páginas: {file_path}")
                        return None
                        
                    logger.info(f"PDF com {len(reader.pages)} páginas")
                    
                    text = ''
                    for i, page in enumerate(reader.pages):
                        try:
                            page_text = page.extract_text()
                            if page_text:
                                text += page_text
                            else:
                                logger.warning(f"Não foi possível extrair texto da página {i+1}")
                        except Exception as page_error:
                            logger.error(f"Erro ao extrair texto da página {i+1}: {str(page_error)}")
                            # Continuar com outras páginas
            except PyPDF2.errors.PdfReadError as pdf_error:
                logger.error(f"Erro ao ler PDF: {str(pdf_error)}")
                logger.error(traceback.format_exc())
                raise ValueError(f"Erro ao ler PDF: {str(pdf_error)}")
                
        elif file_extension == 'docx':
            try:
                doc = Document(file_path)
                paragraphs = [paragraph.text for paragraph in doc.paragraphs]
                logger.info(f"DOCX com {len(paragraphs)} parágrafos")
                text = '\n'.join(paragraphs)
            except Exception as docx_error:
                logger.error(f"Erro ao ler DOCX: {str(docx_error)}")
                logger.error(traceback.format_exc())
                raise ValueError(f"Erro ao ler DOCX: {str(docx_error)}")
        else:
            error_msg = f"Formato de arquivo não suportado: {file_extension}"
            logger.error(error_msg)
            raise ValueError(error_msg)

        # Verificar se o texto foi extraído com sucesso
        if not text or len(text.strip()) == 0:
            logger.warning(f"Texto extraído vazio para {file_path}")
            return None

        # Limitar tamanho do texto para evitar problemas com o prompt
        if len(text) > 50000:
            logger.warning(f"Texto muito longo ({len(text)} caracteres), truncando para 50000")
            text = text[:50000] + "..."

        logger.info(f"Texto extraído com sucesso: {len(text)} caracteres")
        return text
        
    except FileNotFoundError as e:
        logger.error(f"Arquivo não encontrado: {file_path}")
        logger.error(traceback.format_exc())
        raise
    except ValueError as e:
        logger.error(str(e))
        logger.error(traceback.format_exc())
        raise
    except Exception as e:
        logger.error(f"Erro ao extrair texto de {file_path}: {str(e)}")
        logger.error(traceback.format_exc())
        return None
