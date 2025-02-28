import json
import re
import logging
import traceback

# Obter logger configurado
logger = logging.getLogger(__name__)

def format_ai_response(ai_response):
    """
    Formata a resposta da IA para o formato esperado pelo frontend

    Args:
        ai_response (str): Texto da resposta da IA

    Returns:
        dict: Dicionário formatado com as informações analisadas
    """
    if not ai_response:
        logger.error("Resposta da IA vazia ou nula")
        return create_fallback_response("Não foi possível obter uma resposta válida da IA")
        
    logger.info(f"Formatando resposta da IA ({len(ai_response)} caracteres)")
    
    try:
        # Tentar extrair JSON da resposta com delimitadores de código
        json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', ai_response, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
            logger.info(f"JSON encontrado com delimitadores de código ({len(json_str)} caracteres)")
            try:
                parsed_json = json.loads(json_str)
                logger.info("JSON decodificado com sucesso (com delimitadores)")
                return validate_and_fix_json(parsed_json)
            except json.JSONDecodeError as e:
                logger.warning(f"Falha ao decodificar JSON da resposta com delimitadores: {str(e)}")
                logger.debug(f"JSON inválido: {json_str[:200]}...")
        
        # Tentar extrair JSON sem delimitadores
        if ai_response.strip().startswith('{') and ai_response.strip().endswith('}'):
            logger.info("Tentando decodificar resposta completa como JSON")
            try:
                parsed_json = json.loads(ai_response)
                logger.info("JSON decodificado com sucesso (sem delimitadores)")
                return validate_and_fix_json(parsed_json)
            except json.JSONDecodeError as e:
                logger.warning(f"Falha ao decodificar JSON da resposta sem delimitadores: {str(e)}")
        
        # Se não conseguir extrair JSON, usar regex para extrair informações
        logger.info("Usando extração por regex como fallback")
        formatted_result = {
            "termos_tecnicos": {},
            "competencias_comportamentais": [],
            "palavras_chave_criticas": [],
            "ajustes_prioritarios": [],
            "job1": None,
            "job2": None,
            "consolidated_keywords": [],
            "recommendations": [],
            "motivational_conclusion": "Continue aprimorando seu currículo para aumentar suas chances de sucesso."
        }

        # Extrair termos técnicos com regex
        logger.debug("Extraindo termos técnicos")
        termos_pattern = r"(?:TERMOS TÉCNICOS|Termos Técnicos)[:\s]+(.*?)(?=\n\s*\n|COMPETÊNCIAS COMPORTAMENTAIS|Competências Comportamentais)"
        termos_match = re.search(termos_pattern, ai_response, re.DOTALL | re.IGNORECASE)

        if termos_match:
            termos_text = termos_match.group(1).strip()
            termo_entries = re.findall(r"[\-\*•]?\s*([A-Za-z0-9\+\#\s]+)(?:\s*[\(\:]\s*(\d+).*?(Alta|Média|Baixa))?", termos_text)
            logger.debug(f"Encontrados {len(termo_entries)} termos técnicos")

            for termo, freq, relevancia in termo_entries:
                termo = termo.strip()
                if termo:
                    if not freq:
                        freq = "1"
                    if not relevancia:
                        relevancia = "Média"

                    # Converter frequência para inteiro com tratamento de erro
                    try:
                        freq_int = int(freq)
                    except ValueError:
                        freq_int = 1

                    formatted_result["termos_tecnicos"][termo] = {
                        "termo": termo,
                        "frequencia": freq_int,
                        "relevancia": relevancia
                    }

        # Extrair competências comportamentais
        logger.debug("Extraindo competências comportamentais")
        comp_pattern = r"(?:COMPETÊNCIAS COMPORTAMENTAIS|Competências Comportamentais)[:\s]+(.*?)(?=\n\s*\n|PALAVRAS-CHAVE CRÍTICAS|Palavras-Chave Críticas)"
        comp_match = re.search(comp_pattern, ai_response, re.DOTALL | re.IGNORECASE)

        if comp_match:
            comp_text = comp_match.group(1).strip()
            comps = re.findall(r"[\-\*•]?\s*([A-Za-zÀ-ÿ\s]+)", comp_text)
            formatted_result["competencias_comportamentais"] = [comp.strip() for comp in comps if comp.strip()]
            logger.debug(f"Encontradas {len(formatted_result['competencias_comportamentais'])} competências comportamentais")

        # Extrair palavras-chave críticas
        logger.debug("Extraindo palavras-chave críticas")
        keywords_pattern = r"(?:PALAVRAS-CHAVE CRÍTICAS|Palavras-Chave Críticas)[:\s]+(.*?)(?=\n\s*\n|AJUSTES PRIORITÁRIOS|Ajustes Prioritários)"
        keywords_match = re.search(keywords_pattern, ai_response, re.DOTALL | re.IGNORECASE)

        if keywords_match:
            keywords_text = keywords_match.group(1).strip()
            keywords = re.findall(r"[\-\*•]?\s*([A-Za-zÀ-ÿ\s\+\#]+)(?:\s*[\(\:]\s*([Pp]resente|[Aa]usente|[Ss]im|[Nn]ão|✓|✗))?", keywords_text)
            logger.debug(f"Encontradas {len(keywords)} palavras-chave críticas")

            for keyword, status in keywords:
                keyword = keyword.strip()
                if keyword:
                    presente = True
                    if status:
                        presente = any(s in status.lower() for s in ['presente', 'sim', '✓'])

                    formatted_result["palavras_chave_criticas"].append({
                        "termo": keyword,
                        "presente": presente
                    })

        # Extrair ajustes prioritários
        logger.debug("Extraindo ajustes prioritários")
        ajustes_pattern = r"(?:AJUSTES PRIORITÁRIOS|Ajustes Prioritários)[:\s]+(.*?)(?=\n\s*\n|$)"
        ajustes_match = re.search(ajustes_pattern, ai_response, re.DOTALL | re.IGNORECASE)

        if ajustes_match:
            ajustes_text = ajustes_match.group(1).strip()
            ajustes = re.findall(r"[\-\*•]?\s*([^\n]+)", ajustes_text)
            formatted_result["ajustes_prioritarios"] = [ajuste.strip() for ajuste in ajustes if ajuste.strip()]
            logger.debug(f"Encontrados {len(formatted_result['ajustes_prioritarios'])} ajustes prioritários")

        # Extrair conclusão motivacional
        logger.debug("Extraindo conclusão motivacional")
        conclusion_pattern = r"(?:CONCLUSÃO|Conclusão)[:\s]+(.*?)(?=\n\s*\n|$)"
        conclusion_match = re.search(conclusion_pattern, ai_response, re.DOTALL | re.IGNORECASE)

        if conclusion_match:
            conclusion_text = conclusion_match.group(1).strip()
            if conclusion_text:
                formatted_result["motivational_conclusion"] = conclusion_text
                logger.debug("Conclusão motivacional encontrada")

        # Verificar se conseguimos extrair informações suficientes
        if (len(formatted_result["termos_tecnicos"]) == 0 and 
            len(formatted_result["competencias_comportamentais"]) == 0 and
            len(formatted_result["palavras_chave_criticas"]) == 0 and
            len(formatted_result["ajustes_prioritarios"]) == 0):
            logger.warning("Não foi possível extrair informações suficientes da resposta")
            return create_fallback_response("Não foi possível extrair informações suficientes da resposta da IA")

        logger.info("Resposta da IA formatada com sucesso usando regex")
        return formatted_result

    except Exception as e:
        logger.error(f"Erro ao formatar resposta da IA: {str(e)}")
        logger.error(traceback.format_exc())
        return create_fallback_response(f"Erro ao processar resposta: {str(e)}")

def validate_and_fix_json(json_data):
    """Valida e corrige o JSON para garantir que tenha todos os campos necessários"""
    logger.debug("Validando e corrigindo JSON")
    
    # Campos obrigatórios
    required_fields = {
        "all_job_keywords": [],
        "keywords_found": [],
        "keywords_missing": [],
        "ats_recommendations": [],
        "motivational_conclusion": "",
        "termos_tecnicos": {},
        "competencias_comportamentais": []
    }
    
    # Garantir que todos os campos obrigatórios existam
    for field, default_value in required_fields.items():
        if field not in json_data:
            logger.warning(f"Campo obrigatório '{field}' não encontrado no JSON, adicionando valor padrão")
            json_data[field] = default_value
    
    # Validar e corrigir estrutura de termos_tecnicos
    if not isinstance(json_data["termos_tecnicos"], dict):
        logger.warning("Campo 'termos_tecnicos' não é um dicionário, corrigindo")
        json_data["termos_tecnicos"] = {}
    
    # Validar e corrigir arrays
    for field in ["all_job_keywords", "keywords_found", "keywords_missing", "ats_recommendations", "competencias_comportamentais"]:
        if not isinstance(json_data[field], list):
            logger.warning(f"Campo '{field}' não é uma lista, corrigindo")
            json_data[field] = []
    
    # Validar conclusão motivacional
    if not isinstance(json_data["motivational_conclusion"], str):
        logger.warning("Campo 'motivational_conclusion' não é uma string, corrigindo")
        json_data["motivational_conclusion"] = "Continue aprimorando seu currículo para aumentar suas chances de sucesso."
    
    # Verificar e corrigir núcleos substantivos longos
    long_keywords = []
    for i, keyword in enumerate(json_data["all_job_keywords"]):
        if len(keyword.split()) > 3:
            long_keywords.append(keyword)
            logger.warning(f"Núcleo substantivo muito longo encontrado: '{keyword}'")
            
    # Remover núcleos longos
    for keyword in long_keywords:
        json_data["all_job_keywords"].remove(keyword)
        if keyword in json_data["keywords_found"]:
            json_data["keywords_found"].remove(keyword)
        if keyword in json_data["keywords_missing"]:
            json_data["keywords_missing"].remove(keyword)
    
    # Adicionar campos compatíveis com a versão anterior para manter compatibilidade com o frontend
    json_data["palavras_chave_criticas"] = []
    for keyword in json_data["all_job_keywords"]:
        presente = keyword in json_data["keywords_found"]
        json_data["palavras_chave_criticas"].append({
            "termo": keyword,
            "presente": presente
        })
    
    json_data["ajustes_prioritarios"] = json_data["ats_recommendations"]
    json_data["consolidated_keywords"] = json_data["all_job_keywords"]
    json_data["recommendations"] = json_data["ats_recommendations"]
    
    logger.debug("JSON validado e corrigido com sucesso")
    return json_data

def create_fallback_response(error_message):
    """Cria uma resposta padrão em caso de erro"""
    logger.info(f"Criando resposta padrão devido a erro: {error_message}")
    
    # Palavras-chave de exemplo (núcleos substantivos concisos)
    all_keywords = ["Python", "SQL", "gestão de projetos", "liderança", "comunicação", "análise de dados"]
    found_keywords = ["Python", "liderança", "comunicação"]
    missing_keywords = ["SQL", "gestão de projetos", "análise de dados"]
    
    response = {
        "all_job_keywords": all_keywords,
        "keywords_found": found_keywords,
        "keywords_missing": missing_keywords,
        "ats_recommendations": [
            "Adicionar mais detalhes sobre experiências profissionais",
            "Incluir resultados quantificáveis",
            "Adicionar certificações relevantes",
            "Utilizar palavras-chave específicas da área"
        ],
        "termos_tecnicos": {
            "Python": {"termo": "Python", "frequencia": 1, "relevancia": "Média"},
            "Análise de Dados": {"termo": "Análise de Dados", "frequencia": 1, "relevancia": "Alta"}
        },
        "competencias_comportamentais": [
            "Comunicação", "Trabalho em equipe", "Resolução de problemas"
        ],
        "motivational_conclusion": "Seu currículo tem potencial! Com alguns ajustes, você aumentará significativamente suas chances de sucesso nas vagas desejadas.",
        "error": error_message
    }
    
    # Adicionar campos compatíveis com a versão anterior para manter compatibilidade com o frontend
    response["palavras_chave_criticas"] = []
    for keyword in all_keywords:
        presente = keyword in found_keywords
        response["palavras_chave_criticas"].append({
            "termo": keyword,
            "presente": presente
        })
    
    response["ajustes_prioritarios"] = response["ats_recommendations"]
    response["consolidated_keywords"] = all_keywords
    response["recommendations"] = response["ats_recommendations"]
    
    return response
