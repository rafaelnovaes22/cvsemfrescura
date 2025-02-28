import json
import logging
import traceback
from modules.ai_interface import get_ai_analysis
from modules.job_scraper import get_job_requirements
from utils.text_extraction import extract_text_from_file
from utils.response_formatter import format_ai_response

# Obter logger configurado
logger = logging.getLogger(__name__)

def analyze_cv(cv_path, job_links=[]):
    """Analisa o currículo e compara com requisitos das vagas"""
    logger.info(f"Iniciando análise do currículo: {cv_path}")
    logger.info(f"Links de vagas fornecidos: {job_links}")
    
    try:
        # Extrair texto do currículo
        logger.info(f"Extraindo texto do arquivo: {cv_path}")
        cv_text = extract_text_from_file(cv_path)
        
        if not cv_text:
            error_msg = "Não foi possível extrair texto do currículo"
            logger.error(error_msg)
            raise Exception(error_msg)
            
        logger.info(f"Texto extraído com sucesso: {len(cv_text)} caracteres")

        # Extrair requisitos das vagas (se fornecidos)
        job_requirements = []
        for i, link in enumerate(job_links):
            if link.strip():  # Ignorar links vazios
                logger.info(f"Extraindo requisitos da vaga {i+1}: {link}")
                try:
                    req = get_job_requirements(link)
                    if req:
                        logger.info(f"Requisitos extraídos com sucesso: {len(req)} caracteres")
                        job_requirements.append(req)
                    else:
                        logger.warning(f"Nenhum requisito extraído para o link: {link}")
                except Exception as e:
                    logger.error(f"Erro ao extrair requisitos da vaga {link}: {str(e)}")
                    logger.error(traceback.format_exc())
                    # Continuar com outras vagas mesmo se uma falhar

        # Verificar se temos pelo menos uma vaga
        if not job_requirements and job_links:
            logger.warning("Nenhum requisito de vaga foi extraído com sucesso")

        # Obter análise da IA
        logger.info("Enviando para análise da IA")
        ai_response = get_ai_analysis(cv_text, job_requirements)
        logger.info("Análise da IA concluída com sucesso")
        
        # Logar a resposta da IA para debug
        logger.info("Resposta da IA:")
        logger.info(ai_response)

        # Formatar a resposta para o formato esperado pelo frontend
        logger.info("Formatando resposta da IA")
        formatted_results = format_ai_response(ai_response)
        logger.info("Formatação concluída com sucesso")
        
        # Logar os resultados formatados para debug
        logger.info("Resultados formatados:")
        logger.info(json.dumps(formatted_results, indent=2, ensure_ascii=False))

        return formatted_results
        
    except Exception as e:
        logger.error(f"Erro durante a análise do currículo: {str(e)}")
        logger.error(traceback.format_exc())
        raise Exception(f"Erro durante a análise do currículo: {str(e)}")
