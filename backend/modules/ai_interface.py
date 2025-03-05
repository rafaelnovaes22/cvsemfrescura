import os
import logging
import json
import re
import traceback
import openai
from config import Config

# Obter logger configurado
logger = logging.getLogger(__name__)

# Verificar a chave da API
if not Config.OPENAI_API_KEY:
    logger.critical("OPENAI_API_KEY não está configurada no arquivo .env")
    raise ValueError("OPENAI_API_KEY não está configurada. Verifique o arquivo .env")

# Configurar o cliente da OpenAI
try:
    # Inicializar o cliente OpenAI com a API key
    openai.api_key = Config.OPENAI_API_KEY
    logger.info("Cliente OpenAI inicializado com sucesso")
except Exception as e:
    logger.critical(f"Falha ao inicializar cliente OpenAI: {str(e)}")
    print(f"Falha ao inicializar cliente OpenAI: {str(e)}")
    print("Nota: Este erro não afeta o teste do sistema de pagamentos")
    # Criar um cliente mock para permitir que o servidor inicie mesmo sem OpenAI
    class MockOpenAI:
        @staticmethod
        def ChatCompletion():
            class MockChatCompletion:
                @staticmethod
                def create(**kwargs):
                    return {
                        "choices": [
                            {
                                "message": {
                                    "content": '{"error": "OpenAI API não disponível"}'
                                }
                            }
                        ]
                    }
            return MockChatCompletion
    
    # Substituir o módulo openai pelo mock
    openai = MockOpenAI()
    logger.warning("Usando cliente OpenAI mock devido a erro de inicialização")

def get_ai_analysis(cv_text, job_requirements=[], max_retries=3):
    """
    Obter análise da IA para o currículo usando GPT da OpenAI

    Args:
        cv_text (str): Texto extraído do currículo
        job_requirements (list): Lista de textos com requisitos das vagas
        max_retries (int): Número máximo de tentativas para obter uma resposta válida

    Returns:
        str: Resposta da API da OpenAI em formato texto
    """
    # Verificar se o texto do currículo é válido
    if not cv_text or len(cv_text.strip()) < 50:
        error_msg = "Texto do currículo muito curto ou vazio"
        logger.error(error_msg)
        raise ValueError(error_msg)
    
    logger.info(f"Preparando análise de currículo com {len(cv_text)} caracteres e {len(job_requirements)} links de vagas")
    
    # Preparar os textos das vagas
    job_text_1 = job_requirements[0] if job_requirements and len(job_requirements) > 0 else ""
    job_text_2 = job_requirements[1] if job_requirements and len(job_requirements) > 1 else ""

    job_url_1 = job_requirements[0] if job_requirements and len(job_requirements) > 0 else ""
    job_url_2 = job_requirements[1] if job_requirements and len(job_requirements) > 1 else ""
    
    logger.debug(f"Job URL 1: {job_url_1}")
    logger.debug(f"Job URL 2: {job_url_2}")
    logger.debug(f"Tamanho do texto da vaga 1: {len(job_text_1)} caracteres")
    logger.debug(f"Tamanho do texto da vaga 2: {len(job_text_2)} caracteres")

    # Prompt base especializado para o GPT
    base_prompt = f"""
    Você é especializado em análise de currículos com extrema precisão. Sua tarefa é extrair EXCLUSIVAMENTE núcleos substantivos concisos das descrições de vagas e verificar sua presença no currículo:

    1. **Entrada**:
       - Currículo: "{cv_text}"
       - Vaga 1 ({job_url_1}): "{job_text_1}"
       - Vaga 2 ({job_url_2 or 'não fornecida'}): "{job_text_2}"

    2. **Extração de Núcleos**:
       - Extraia EXCLUSIVAMENTE núcleos substantivos concisos (máximo 3 palavras) das vagas
       - Exemplos corretos: "Python", "gestão de projetos", "SQL", "adquirência", "liderança"
       - Exemplos incorretos: "experiência com gestão de projetos", "conhecimento em Python e SQL", "habilidade de liderança e comunicação"
       - SEMPRE divida frases longas em núcleos individuais:
         * "experiência em Python e SQL" → "Python", "SQL"
         * "conhecimento em gestão de projetos e metodologias ágeis" → "gestão de projetos", "metodologias ágeis"
         * "habilidade de liderança e comunicação" → "liderança", "comunicação"
       - Extraia de todas as seções das vagas (requisitos, responsabilidades, etc.)
       - Priorize termos técnicos, habilidades, certificações e competências
       - Ignore palavras genéricas (artigos, preposições, etc.)
       - NUNCA inclua verbos ou frases verbais nos núcleos (ex: "ter experiência", "desenvolver soluções")

    3. **Correspondência**:
       - Verifique a presença exata de cada núcleo no currículo (case-insensitive)
       - Sem inferências: o termo deve estar presente literalmente

    4. **Saída**:
       - Retorne JSON com:
         - "all_job_keywords": [array com todos os núcleos substantivos identificados nas vagas]
         - "keywords_found": [array com núcleos encontrados no currículo]
         - "keywords_missing": [array com núcleos ausentes no currículo]
         - "ats_recommendations": [array com recomendações de melhorias para o currículo]
         - "termos_tecnicos": objeto com termos técnicos encontrados no currículo, frequência e relevância
         - "competencias_comportamentais": [array de competências comportamentais identificadas]
         - "motivational_conclusion": string detalhada com análise do estado atual do currículo, como ficará após os ajustes e mensagem motivadora

    REGRAS CRÍTICAS:
    1. Extraia EXCLUSIVAMENTE núcleos substantivos concisos (máximo 3 palavras)
    2. SEMPRE divida frases longas em núcleos individuais
    3. Cada núcleo deve ser específico, direto e substantivo
    4. NUNCA inclua verbos, advérbios ou frases verbais nos núcleos
    5. NUNCA inclua frases como "experiência em X" - extraia apenas "X"
    6. NUNCA inclua frases como "conhecimento de Y" - extraia apenas "Y"
    7. NUNCA inclua frases como "habilidade com Z" - extraia apenas "Z"

    Retorne sua resposta APENAS como um objeto JSON válido dentro de blocos de código ```json e ```.
    """

    logger.info(f"Tamanho do prompt base: {len(base_prompt)} caracteres")
    
    # Verificar se o prompt não é muito grande
    if len(base_prompt) > 100000:
        logger.warning("Prompt muito grande, pode causar problemas com a API")

    # Sistema de retry
    for attempt in range(max_retries):
        try:
            logger.info(f"Tentativa {attempt+1}/{max_retries} de análise pelo GPT")
            
            # Ajustar o prompt com base na tentativa
            current_prompt = base_prompt
            if attempt > 0:
                # Adicionar instruções mais enfáticas para tentativas subsequentes
                current_prompt += f"""
                
                ATENÇÃO: Sua resposta anterior falhou. Lembre-se:
                1. Extraia EXCLUSIVAMENTE núcleos substantivos CONCISOS (máximo 3 palavras)
                2. SEMPRE divida frases como "experiência em Python" em núcleos como "Python"
                3. Retorne APENAS JSON válido no formato especificado
                4. Não inclua texto fora do bloco JSON
                
                Exemplos de núcleos concisos corretos:
                - "Python"
                - "SQL"
                - "gestão de projetos"
                - "adquirência"
                - "liderança"
                
                Exemplos de núcleos incorretos (muito longos):
                - "experiência com gestão de projetos" (deve ser apenas "gestão de projetos")
                - "conhecimento em Python e SQL" (deve ser separado em "Python" e "SQL")
                - "habilidade de liderança e comunicação" (deve ser separado em "liderança" e "comunicação")
                - "capacidade de trabalhar em equipe" (deve ser apenas "trabalho em equipe")
                - "proficiência em análise de dados" (deve ser apenas "análise de dados")
                """
            
            # Verificar modelo disponível
            model = "gpt-4-turbo"  # Modelo com maior limite de tokens (128K)
            
            try:
                # Temperatura reduzida para maior consistência
                response = openai.ChatCompletion.create(
                    model=model,
                    max_tokens=4000,
                    temperature=0.1,
                    messages=[
                        {"role": "system", "content": "Extraia EXCLUSIVAMENTE núcleos substantivos concisos (máximo 3 palavras) das vagas, verifique sua presença no currículo e forneça uma conclusão detalhada e motivadora."},
                        {"role": "user", "content": current_prompt}
                    ]
                )
            except Exception as model_error:
                logger.error(f"Erro com o modelo {model}: {str(model_error)}")
                
                # Tentar com modelo alternativo
                model = "gpt-3.5-turbo"
                logger.info(f"Tentando modelo alternativo: {model}")
                
                response = openai.ChatCompletion.create(
                    model=model,
                    max_tokens=4000,
                    temperature=0.1,
                    messages=[
                        {"role": "system", "content": "Extraia EXCLUSIVAMENTE núcleos substantivos concisos (máximo 3 palavras) das vagas, verifique sua presença no currículo e forneça uma conclusão detalhada e motivadora."},
                        {"role": "user", "content": current_prompt}
                    ]
                )

            logger.info(f"Resposta recebida do GPT com sucesso usando modelo {model}")
            response_text = response['choices'][0]['message']['content']
            logger.debug(f"Tamanho da resposta: {len(response_text)} caracteres")
            
            # Verificar se a resposta contém JSON válido
            try:
                # Tentar extrair JSON da resposta
                json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
                if json_match:
                    json_str = json_match.group(1)
                    parsed_json = json.loads(json_str)  # Validar JSON
                    
                    # Verificar se os núcleos são concisos
                    long_keywords = [k for k in parsed_json.get("all_job_keywords", []) if len(k.split()) > 3]
                    
                    if long_keywords and attempt < max_retries - 1:
                        logger.warning(f"Encontrados {len(long_keywords)} núcleos longos. Tentando novamente.")
                        continue
                    
                    logger.info("Resposta contém JSON válido com núcleos concisos")
                    return response_text
                else:
                    # Verificar se a resposta inteira é um JSON válido
                    if response_text.strip().startswith('{') and response_text.strip().endswith('}'):
                        parsed_json = json.loads(response_text)  # Validar JSON
                        
                        # Verificar se os núcleos são concisos
                        long_keywords = [k for k in parsed_json.get("all_job_keywords", []) if len(k.split()) > 3]
                        
                        if long_keywords and attempt < max_retries - 1:
                            logger.warning(f"Encontrados {len(long_keywords)} núcleos longos. Tentando novamente.")
                            continue
                        
                        logger.info("Resposta é um JSON válido com núcleos concisos")
                        return response_text
                    else:
                        logger.warning("Resposta não contém JSON válido")
                        if attempt < max_retries - 1:
                            continue
            except json.JSONDecodeError as json_error:
                logger.warning(f"Resposta não contém JSON válido: {str(json_error)}")
                if attempt < max_retries - 1:
                    continue
            
            # Se chegamos aqui na última tentativa, retornamos a resposta mesmo que não seja ideal
            return response_text
            
        except openai.error.Timeout as e:
            error_msg = f"Timeout na API da OpenAI: {str(e)}"
            logger.error(error_msg)
            logger.error(traceback.format_exc())
            if attempt == max_retries - 1:
                raise Exception(f"Timeout na análise do currículo. Por favor, tente novamente mais tarde.")
            
        except openai.error.RateLimitError as e:
            error_msg = f"Limite de requisições excedido na API da OpenAI: {str(e)}"
            logger.error(error_msg)
            logger.error(traceback.format_exc())
            if attempt == max_retries - 1:
                raise Exception(f"Limite de requisições excedido. Por favor, tente novamente em alguns minutos.")
            
        except openai.error.APIConnectionError as e:
            error_msg = f"Erro de conexão com a API da OpenAI: {str(e)}"
            logger.error(error_msg)
            logger.error(traceback.format_exc())
            if attempt == max_retries - 1:
                raise Exception(f"Erro de conexão com o serviço de análise. Verifique sua conexão com a internet.")
            
        except openai.error.APIError as e:
            error_msg = f"Erro na API da OpenAI: {str(e)}"
            logger.error(error_msg)
            logger.error(traceback.format_exc())
            if attempt == max_retries - 1:
                raise Exception(f"Erro na análise do currículo: {str(e)}")
            
        except Exception as e:
            error_msg = f"Erro inesperado na análise do currículo: {str(e)}"
            logger.error(error_msg)
            logger.error(traceback.format_exc())
            if attempt == max_retries - 1:
                raise Exception(f"Erro inesperado na análise do currículo. Por favor, tente novamente ou contate o suporte.")
    
    # Se chegamos aqui, todas as tentativas falharam
    raise Exception("Falha em todas as tentativas de análise do currículo. Por favor, tente novamente mais tarde.")
