import requests
from bs4 import BeautifulSoup
import re
import logging
import traceback
from requests.exceptions import RequestException, Timeout, ConnectionError

# Obter logger configurado
logger = logging.getLogger(__name__)

def get_job_requirements(url):
    """
    Extrai requisitos da vaga a partir da URL
    """
    if not url or not url.strip():
        logger.warning("URL vazia fornecida para extração de requisitos")
        return None
        
    logger.info(f"Extraindo requisitos da vaga: {url}")
    
    try:
        # Validar URL
        if not url.startswith(('http://', 'https://')):
            logger.warning(f"URL inválida: {url}")
            return None
            
        # Headers para simular um navegador
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }

        # Fazendo requisição para a página
        logger.info(f"Iniciando requisição HTTP para: {url}")
        response = requests.get(url, headers=headers, timeout=15)
        
        # Verificar status da resposta
        if response.status_code != 200:
            logger.warning(f"Status code inesperado: {response.status_code} para URL: {url}")
            response.raise_for_status()
            
        logger.info(f"Requisição bem-sucedida: {len(response.text)} bytes recebidos")

        # Analisar o HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Identificar o site da vaga com base na URL
        job_description = None
        
        if 'linkedin.com' in url:
            logger.info("Detectado site LinkedIn")
            job_description = extract_from_linkedin(soup)
        elif 'glassdoor.com' in url:
            logger.info("Detectado site Glassdoor")
            job_description = extract_from_glassdoor(soup)
        elif 'indeed.com' in url:
            logger.info("Detectado site Indeed")
            job_description = extract_from_indeed(soup)
        else:
            logger.info("Site não reconhecido, usando extrator genérico")
            job_description = extract_generic(soup)
            
        # Verificar se conseguimos extrair algum conteúdo
        if job_description:
            logger.info(f"Extração bem-sucedida: {len(job_description)} caracteres")
            
            # Limitar tamanho para evitar problemas com o prompt
            if len(job_description) > 10000:
                logger.warning(f"Descrição muito longa ({len(job_description)} caracteres), truncando para 10000")
                job_description = job_description[:10000] + "..."
                
            return job_description
        else:
            logger.warning(f"Nenhum conteúdo extraído da URL: {url}")
            return None

    except Timeout:
        logger.error(f"Timeout ao acessar a URL: {url}")
        logger.error(traceback.format_exc())
        return None
    except ConnectionError:
        logger.error(f"Erro de conexão ao acessar a URL: {url}")
        logger.error(traceback.format_exc())
        return None
    except RequestException as e:
        logger.error(f"Erro de requisição HTTP para URL {url}: {str(e)}")
        logger.error(traceback.format_exc())
        return None
    except Exception as e:
        logger.error(f"Erro ao extrair requisitos da vaga {url}: {str(e)}")
        logger.error(traceback.format_exc())
        return None

def extract_from_linkedin(soup):
    """Extrai requisitos de uma vaga do LinkedIn"""
    try:
        job_description = ""

        # Tentar encontrar a descrição da vaga
        description_div = soup.find('div', {'class': 'description__text'})
        if description_div:
            job_description = description_div.get_text(separator=' ', strip=True)
            logger.info("Descrição extraída do elemento 'description__text'")
        else:
            # Tentar seletores alternativos
            description_div = soup.find('div', {'class': 'show-more-less-html__markup'})
            if description_div:
                job_description = description_div.get_text(separator=' ', strip=True)
                logger.info("Descrição extraída do elemento 'show-more-less-html__markup'")
            else:
                logger.warning("Não foi possível encontrar a descrição da vaga no LinkedIn")

        return job_description
    except Exception as e:
        logger.error(f"Erro ao extrair do LinkedIn: {str(e)}")
        logger.error(traceback.format_exc())
        return ""

def extract_from_glassdoor(soup):
    """Extrai requisitos de uma vaga do Glassdoor"""
    try:
        job_description = ""

        # Tentar encontrar a descrição da vaga
        description_div = soup.find('div', {'class': 'jobDescriptionContent'})
        if description_div:
            job_description = description_div.get_text(separator=' ', strip=True)
            logger.info("Descrição extraída do elemento 'jobDescriptionContent'")
        else:
            # Tentar seletores alternativos
            description_div = soup.find('div', {'id': 'JobDesc'})
            if description_div:
                job_description = description_div.get_text(separator=' ', strip=True)
                logger.info("Descrição extraída do elemento 'JobDesc'")
            else:
                logger.warning("Não foi possível encontrar a descrição da vaga no Glassdoor")

        return job_description
    except Exception as e:
        logger.error(f"Erro ao extrair do Glassdoor: {str(e)}")
        logger.error(traceback.format_exc())
        return ""

def extract_from_indeed(soup):
    """Extrai requisitos de uma vaga do Indeed"""
    try:
        job_description = ""

        # Tentar encontrar a descrição da vaga
        description_div = soup.find('div', {'id': 'jobDescriptionText'})
        if description_div:
            job_description = description_div.get_text(separator=' ', strip=True)
            logger.info("Descrição extraída do elemento 'jobDescriptionText'")
        else:
            # Tentar seletores alternativos
            description_div = soup.find('div', {'class': 'job-description'})
            if description_div:
                job_description = description_div.get_text(separator=' ', strip=True)
                logger.info("Descrição extraída do elemento 'job-description'")
            else:
                logger.warning("Não foi possível encontrar a descrição da vaga no Indeed")

        return job_description
    except Exception as e:
        logger.error(f"Erro ao extrair do Indeed: {str(e)}")
        logger.error(traceback.format_exc())
        return ""

def extract_generic(soup):
    """Método genérico para extrair texto de uma página de vaga"""
    try:
        logger.info("Usando extrator genérico")
        
        # Remover elementos irrelevantes
        for tag in soup(['script', 'style', 'header', 'footer', 'nav']):
            tag.decompose()

        # Tentar encontrar divs com termos comuns em descrições de vagas
        job_description = ""
        
        # Procurar por elementos que possam conter a descrição da vaga
        potential_elements = []
        
        # Procurar por divs com classes ou IDs que sugerem descrição de vaga
        for div in soup.find_all('div'):
            div_id = div.get('id', '').lower()
            div_class = ' '.join(div.get('class', [])).lower()
            
            if any(term in div_id or term in div_class for term in ['job', 'description', 'vacancy', 'requisites', 'requirements']):
                potential_elements.append(div)
                
        if potential_elements:
            # Usar o elemento com mais texto
            potential_elements.sort(key=lambda x: len(x.get_text()), reverse=True)
            job_description = potential_elements[0].get_text(separator=' ', strip=True)
            logger.info(f"Descrição extraída de elemento potencial: {len(job_description)} caracteres")
        else:
            # Se não encontrar elementos específicos, usar o body
            body = soup.find('body')
            if body:
                job_description = body.get_text(separator=' ', strip=True)
                logger.info(f"Descrição extraída do body: {len(job_description)} caracteres")
            else:
                job_description = soup.get_text(separator=' ', strip=True)
                logger.info(f"Descrição extraída do documento inteiro: {len(job_description)} caracteres")

        # Limpar texto
        job_description = re.sub(r'\s+', ' ', job_description).strip()
        
        # Tentar identificar a seção de requisitos
        requirements_section = None
        
        # Padrões comuns para seções de requisitos
        patterns = [
            r'(?:Requisitos|Requirements|Qualifications)[\s\:]+(.+?)(?=\n\s*\n|\Z)',
            r'(?:Experiência|Experience|Skills)[\s\:]+(.+?)(?=\n\s*\n|\Z)',
            r'(?:O que buscamos|We are looking for|Perfil)[\s\:]+(.+?)(?=\n\s*\n|\Z)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, job_description, re.IGNORECASE | re.DOTALL)
            if match:
                requirements_section = match.group(1)
                logger.info(f"Seção de requisitos identificada: {len(requirements_section)} caracteres")
                break
                
        # Se encontrou uma seção específica de requisitos, usar ela
        if requirements_section and len(requirements_section) > 100:
            return requirements_section
            
        return job_description
    except Exception as e:
        logger.error(f"Erro no extrator genérico: {str(e)}")
        logger.error(traceback.format_exc())
        return ""
