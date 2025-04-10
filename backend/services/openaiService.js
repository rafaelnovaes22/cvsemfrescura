const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Serviço para integração com a API OpenAI
 * Responsável por analisar currículos e vagas de emprego
 */
class OpenAIService {
  /**
   * Extrai palavras-chave otimizadas para ATS de uma descrição de vaga
   * @param {string} jobDescription - Texto da descrição da vaga
   * @returns {Promise<Object>} - Análise ATS com palavras-chave e recomendações
   */
  async extractAtsJobKeywords(jobDescription) {
    try {
      console.log('[OpenAI] Iniciando extração ATS de palavras-chave da vaga');

      // Executamos uma análise profunda da descrição da vaga com um prompt unificado
      const extractionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Você é um sistema especializado em extrair TODAS as palavras-chave de descrições de vagas para ATS. Sua missão é capturar 100% das palavras-chave importantes, sem deixar passar NENHUM termo relevante. Você deve categorizar todas as palavras-chave e apresentar os resultados no formato JSON solicitado. IMPORTANTE: Preserve os termos EXATAMENTE como aparecem, incluindo expressões compostas, frases com preposições (como 'com equipes técnicas', 'em ambiente ágil', etc.), e não separe termos técnicos que devem permanecer juntos."
          },
          {
            role: "user",
            content: `IMPORTANTE: Extraia ABSOLUTAMENTE TODAS as palavras-chave desta descrição de vaga. Extraia cada elemento EXATAMENTE como aparece no texto original, sem nenhuma modificação.

ATENÇÃO ESPECIAL: Preserve expressões completas que incluem preposições, como 'trabalho com equipes técnicas', 'experiência em ambientes ágeis', 'comunicação com stakeholders'. NÃO separe estas expressões em palavras individuais - mantenha-as intactas como aparecem no texto original.

Extraia e categorize:
- Título da vaga e suas variações → campo "job_title"
- Habilidades técnicas (gestão de projetos, frameworks, linguagens, etc.) → campo "technical"
- Competências comportamentais (proatividade, comunicação, etc.) → campo "soft"
- Experiências profissionais exigidas (anos de experiência, cargos anteriores) → campo "experience"
- Requisitos educacionais (formação, graduação, etc.) → campo "education"
- Idiomas mencionados → campo "language"
- Ferramentas, sistemas e metodologias → campo "tools"
- Responsabilidades da função → campo "responsibilities"
- Requisitos obrigatórios → campo "mandatory"
- Requisitos desejáveis → campo "desirable"

Retorne a análise no seguinte formato JSON:

{
  "all_job_keywords": {
    "job_title": ["Título principal da vaga", "Variações do título"],
    "technical": ["Lista detalhada de todas as habilidades técnicas"],
    "soft": ["Lista detalhada de todas as competências comportamentais"],
    "experience": ["Lista detalhada de experiências profissionais exigidas"],
    "education": ["Lista de requisitos educacionais"],
    "language": ["Lista de idiomas mencionados"],
    "tools": ["Lista de ferramentas, sistemas e metodologias"],
    "responsibilities": ["Lista completa e detalhada de todas as responsabilidades"],
    "mandatory": ["Lista de requisitos obrigatórios"],
    "desirable": ["Lista de requisitos desejáveis"]
  },
  "matching_keywords": {
    "technical": [], "soft": [], "experience": [], "education": [], 
    "language": [], "tools": [], "mandatory": [], "desirable": []
  },
  "missing_keywords": {
    "technical": [], "soft": [], "experience": [], "education": [], 
    "language": [], "tools": [], "mandatory": [], "desirable": []
  },
  "ats_structure_evaluation": {
    "clarity_organization": "Avaliação da clareza e organização da vaga.",
    "ats_compatibility": "Avaliação da compatibilidade com sistemas ATS.",
    "essential_sections": "Verificação das seções essenciais.",
    "overall_score": 8,
    "comments": "Comentários gerais sobre a estrutura ATS da vaga."
  },
  "recommendations": [
    "Correspondência exata de termos-chave: Lista precisa dos termos que devem aparecer exatamente como na descrição",
    "Foco em área principal: Recomendação específica para destaque de experiências relacionadas",
    "Destaque habilidades críticas: Lista das 3-5 habilidades mais críticas para a função",
    "Competências importantes: Lista das 3-5 competências mais importantes para a função",
    "Experiência relevante: Elementos de experiência mais valorizados na vaga",
    "Competência fundamental: Uma competência absolutamente fundamental para a função",
    "Diferencial competitivo: Um diferencial competitivo específico valorizado na vaga"
  ],
  "conclusion": "Conclusão geral sobre o perfil ideal de candidato para esta vaga, com orientações práticas para otimização ATS."
}

Descrição da vaga:
${jobDescription}`
          }
        ],
        temperature: 0.5,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      });

      const atsAnalysisText = extractionResponse.choices[0].message.content;
      console.log('[OpenAI] Resposta de análise ATS recebida - Etapa 1 (extração)');

      try {
        const atsAnalysis = JSON.parse(atsAnalysisText);
        
        // Estrutura base da resposta seguindo o layout da página
        const completeAnalysis = {
          // Manter todas as keywords das vagas em formato compatível com a página
          all_job_keywords: {
            technical: atsAnalysis.all_job_keywords?.technical || [],
            soft: atsAnalysis.all_job_keywords?.soft || [],
            experience: atsAnalysis.all_job_keywords?.experience || [],
            education: atsAnalysis.all_job_keywords?.education || [],
            language: atsAnalysis.all_job_keywords?.language || [],
            tools: atsAnalysis.all_job_keywords?.tools || [],
            mandatory: atsAnalysis.all_job_keywords?.mandatory || [],
            desirable: atsAnalysis.all_job_keywords?.desirable || [],
            responsibilities: atsAnalysis.all_job_keywords?.responsibilities || atsAnalysis.responsibilities || []
          },
          // Manter o formato para compatibilidade com a exibição de palavras presentes
          matching_keywords: {
            technical: [],
            soft: [],
            experience: [],
            education: [],
            language: [],
            tools: [],
            mandatory: [],
            desirable: [],
            responsibilities: []
          },
          // Manter o formato para compatibilidade com a exibição de palavras ausentes
          missing_keywords: {
            technical: [],
            soft: [],
            experience: [],
            education: [],
            language: [],
            tools: [],
            mandatory: [],
            desirable: []
          },
          // Avaliação da estrutura ATS
          ats_structure_evaluation: atsAnalysis.ats_structure_evaluation || {
            clarity_organization: "Avaliação indisponível.",
            ats_compatibility: "Avaliação indisponível.",
            essential_sections: "Verificação indisponível.",
            overall_score: 0,
            comments: "N/A"
          },
          // Recomendações
          recommendations: atsAnalysis.recommendations || [
            "Nenhuma recomendação específica gerada."
          ],
          // Conclusão
          conclusion: atsAnalysis.conclusion || "Sem conclusão disponível."
        };
        
        return completeAnalysis;
      } catch (parseError) {
        console.error('[OpenAI] Erro ao parsear JSON da análise ATS:', parseError);
        return {
          all_job_keywords: {
            technical: [],
            soft: [],
            experience: [],
            education: [],
            language: [],
            tools: [],
            mandatory: [],
            desirable: [],
            responsibilities: []
          },
          matching_keywords: {
            technical: [],
            soft: [],
            experience: [],
            education: [],
            language: [], 
            tools: [],
            mandatory: [],
            desirable: []
          },
          missing_keywords: {
            technical: [],
            soft: [],
            experience: [],
            education: [],
            language: [],
            tools: [],
            mandatory: [],
            desirable: []
          },
          ats_structure_evaluation: {
            clarity_organization: "Avaliação indisponível.",
            ats_compatibility: "Avaliação indisponível.",
            essential_sections: "Verificação indisponível.",
            overall_score: 0,
            comments: "Erro ao processar a análise."
          },
          recommendations: ["Erro ao processar as recomendações."],
          conclusion: "Erro ao processar a conclusão."
        };
      }
    } catch (error) {
      console.error('Erro ao extrair análise ATS com OpenAI:', error);
      return {
        all_job_keywords: {
          technical: [],
          soft: [],
          experience: [],
          education: [],
          language: [],
          tools: [],
          mandatory: [],
          desirable: []
        },
        matching_keywords: {
          technical: [],
          soft: [],
          experience: [],
          education: [],
          language: [],
          tools: [],
          mandatory: [],
          desirable: []
        },
        missing_keywords: {
          technical: [],
          soft: [],
          experience: [],
          education: [],
          language: [],
          tools: [],
          mandatory: [],
          desirable: []
        },
        ats_structure_evaluation: {
          clarity_organization: "Avaliação indisponível.",
          ats_compatibility: "Avaliação indisponível.",
          essential_sections: "Verificação indisponível.",
          overall_score: 0,
          comments: "Erro ao conectar com o serviço de análise."
        },
        recommendations: ["Erro ao conectar com o serviço de análise."],
        conclusion: "Erro ao conectar com o serviço de análise."
      };
    }
  }

  /**
   * Analisa um currículo em relação a uma ou mais vagas
   * @param {string} resumeText - Texto extraído do currículo
   * @param {Array<{title: string, company: string, description: string, url: string}>} jobs - Lista de vagas
   * @returns {Promise<Object>} - Resultado da análise
   */
  async analyzeResume(resumeText, jobs = []) {
    try {
      console.log(`[OpenAI] Iniciando análise de currículo (${resumeText.length} caracteres) com ${jobs.length} vagas.`);

      // Extrair palavras-chave das vagas, se existirem
      // Esta extração ainda é útil para passar ao prompt, mesmo que peçamos a consolidação na resposta final
      const jobKeywordsData = [];
      if (jobs && jobs.length > 0) {
        for (const job of jobs) {
          if (job.description) {
            // Não aguarda a extração aqui, pois o prompt precisa ser construído rapidamente.
            // A extração real acontece no backend da OpenAI com base na descrição completa.
            // No entanto, podemos tentar uma extração rápida aqui para referência, se necessário,
            // mas o foco é passar a descrição completa para a análise principal.
            // Por simplicidade, vamos confiar que a OpenAI fará a extração a partir da descrição no prompt.
          }
        }
      }

      // Construir o prompt com a nova estrutura solicitada
      const prompt = this._buildPrompt(resumeText, jobs, []); // Passa array vazio por enquanto, a IA consolida

      console.log("[OpenAI] Enviando solicitação para a API...");
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Usar o modelo mais recente ou o configurado
        messages: [
          {
            role: "system",
            content: "Você é um especialista em RH e análise de currículos. Responda SEMPRE E APENAS com o objeto JSON solicitado, seguindo ESTRITAMENTE o formato definido pelo usuário. Não adicione nenhum texto antes ou depois do JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5, // Temperatura mais baixa para respostas mais consistentes e determinísticas
        max_tokens: 3500, // Aumentar ligeiramente se necessário para a estrutura complexa
        response_format: { type: "json_object" }
      });

      const analysisText = response.choices[0].message.content;
      console.log('[OpenAI] Resposta JSON bruta recebida:', analysisText);

      // Tentar parsear a resposta JSON
      try {
        let analysis = JSON.parse(analysisText);

        // Validar e preencher a estrutura esperada
        const validatedAnalysis = {
          all_job_keywords: analysis.all_job_keywords || { technical: [], soft: [], experience: [], education: [], language: [], tools: [], mandatory: [], desirable: [] },
          matching_keywords: analysis.matching_keywords || { technical: [], soft: [], experience: [], education: [], language: [], tools: [], mandatory: [], desirable: [] },
          missing_keywords: analysis.missing_keywords || { technical: [], soft: [], experience: [], education: [], language: [], tools: [], mandatory: [], desirable: [] },
          ats_structure_evaluation: analysis.ats_structure_evaluation || {
            clarity_organization: "Avaliação indisponível.",
            ats_compatibility: "Avaliação indisponível.",
            essential_sections: "Verificação indisponível.",
            overall_score: 0,
            comments: "N/A"
          },
          recommendations: analysis.recommendations || ["Nenhuma recomendação gerada."],
          conclusion: analysis.conclusion || "Não foi possível gerar uma conclusão."
        };

        // Garantir que todas as categorias de keywords existam nos objetos, mesmo que vazias
        const keywordCategories = ["technical", "soft", "experience", "education", "language", "tools", "mandatory", "desirable"];
        for (const key of ['all_job_keywords', 'matching_keywords', 'missing_keywords']) {
          for (const category of keywordCategories) {
            if (!validatedAnalysis[key][category]) {
              validatedAnalysis[key][category] = [];
            }
          }
        }

        console.log('[OpenAI] Análise JSON parseada e validada com sucesso.');
        return validatedAnalysis;

      } catch (parseError) {
        console.error('[OpenAI] Falha ao parsear a resposta JSON da API:', parseError);
        console.error('[OpenAI] Resposta recebida que causou o erro:', analysisText); // Logar a resposta problemática
        // Retornar uma estrutura de erro ou fallback
        return this._createFallbackAnalysis("Falha ao processar a resposta da análise. A resposta não estava no formato JSON esperado.");
      }

    } catch (error) {
      console.error('[OpenAI] Erro durante a chamada da API OpenAI ou processamento:', error);
      // Diferenciar erros de API (ex: chave inválida) de outros erros
      const errorMessage = error.response ? `Erro da API OpenAI: ${error.response.status} ${error.response.data?.error?.message}` : `Erro inesperado: ${error.message}`;
      return this._createFallbackAnalysis(errorMessage);
    }
  }

  /**
   * Normaliza keywords para remover duplicidades semânticas
   * @param {Object} keywords - Objeto com categorias de keywords
   * @returns {Promise<Object>} - Keywords normalizadas
   */
  async normalizeKeywords(keywords) {
    try {
      // Aplicar normalização local para casos comuns antes de enviar para a OpenAI
      const preNormalizedKeywords = this._preNormalizeKeywords(keywords);
      
      // Preparar dados para normalização avançada pelo OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em recrutamento e seleção que identifica sinônimos e variações de palavras-chave em currículos e vagas. Sua tarefa é normalizar listas de palavras-chave, removendo sinônimos e mantendo apenas a melhor versão de cada conceito. Você deve identificar com precisão siglas/acrônimos e seus significados completos como equivalentes. Você DEVE responder em formato JSON válido."
          },
          {
            role: "user",
            content: `Normalize as seguintes listas de palavras-chave, identificando e agrupando sinônimos ou conceitos muito similares. 
            
EXEMPLOS DE CONCEITOS SIMILARES QUE DEVEM SER NORMALIZADOS:
1. "metodologias ágeis", "Metodologias ágeis", "práticas ágeis", "metodologia ágil" devem se tornar apenas "metodologias ágeis"
2. "resolver problemas", "habilidade para resolver problemas", "resolução de problemas", "foco na resolução de problemas" devem se tornar apenas "resolver problemas"
3. "cerimônias do time ágil", "condução de cerimônias", "cerimônias ágeis" devem se tornar apenas "cerimônias ágeis"
4. "PO" e "Product Owner" devem se tornar apenas "Product Owner (PO)"
5. "SM" e "Scrum Master" devem se tornar apenas "Scrum Master (SM)"

DIRETRIZES:
- REMOVA PREFIXOS DESNECESSÁRIOS como "habilidade para", "capacidade de", "orientado a", "sensibilidade para", "gerenciar", "foco em"
- IDENTIFIQUE SINÔNIMOS e CONCEITOS SIMILARES em toda e qualquer área profissional
- IDENTIFIQUE TODAS AS SIGLAS e seus significados completos como equivalentes (ex: "PO" = "Product Owner", "PM" = "Project Manager", "RH" = "Recursos Humanos")
- NÃO remova termos únicos e específicos mesmo que pareçam similares a outros (ex: manter "CSS" e "HTML" separados)
- MANTENHA ferramentas, tecnologias, linguagens de programação e acrônimos técnicos específicos (NÃO combine "Java" com "JavaScript", etc.)
- REMOVA palavras duplicadas mesmo que estejam em diferentes categorias
- NORMALIZE plural/singular e uso de letras maiúsculas/minúsculas
- COMBINE siglas/acrônimos com seus significados completos mantendo ambos (ex: "Product Owner (PO)")

ATENÇÃO ESPECIAL: Verifique palavras exatamente iguais mesmo que variem em:
- Acentuação (e.g., "metodologias ageis" e "metodologias ágeis")
- Plural/singular (e.g., "metodologia ágil" e "metodologias ágeis")
- Maiúsculas/minúsculas (e.g., "Metodologia Ágil" e "metodologia ágil")

Por favor, retorne apenas um objeto JSON com as mesmas categorias, mas com as palavras-chave normalizadas:

${JSON.stringify(preNormalizedKeywords, null, 2)}`
          }
        ],
        temperature: 0.3, // Temperatura mais baixa para normalização mais consistente e determinística
        max_tokens: 3000,
        response_format: { type: "json_object" }
      });

      const normalizedKeywordsText = response.choices[0].message.content;
      console.log('[OpenAI] Normalização de keywords:', normalizedKeywordsText);

      try {
        const normalizedKeywords = JSON.parse(normalizedKeywordsText);
        return normalizedKeywords;
      } catch (parseError) {
        console.error('[OpenAI] Erro ao parsear JSON de keywords normalizadas:', parseError);
        return this._preNormalizeKeywords(keywords); // Retorna pelo menos as keywords pré-normalizadas
      }
    } catch (error) {
      console.error('Erro ao normalizar keywords com OpenAI:', error);
      return this._preNormalizeKeywords(keywords); // Retorna pelo menos as keywords pré-normalizadas
    }
  }

  /**
   * Pré-normaliza keywords para tratar casos comuns sem precisar da OpenAI
   * @param {Object} keywords - Objeto com categorias de keywords
   * @returns {Object} - Keywords pré-normalizadas localmente
   * @private
   */
  _preNormalizeKeywords(keywords) {
    const result = {};
    
    // Dicionário de termos equivalentes conhecidos (sem traduções entre idiomas)
    // Formato: [termo normalizado sem acentos] -> termo padronizado com acentos
    const knownEquivalents = {
      'metodologia agil': 'metodologias ágeis',
      'metodologias ageis': 'metodologias ágeis',
      'metodologias agil': 'metodologias ágeis',
      'metodologia ageis': 'metodologias ágeis',
      'praticas ageis': 'metodologias ágeis',
      'gestao de stakeholders': 'gestão de stakeholders',
      'gerenciamento de stakeholders': 'gestão de stakeholders',
      'gerenciar stakeholders': 'gestão de stakeholders',
      'trabalhar com stakeholders': 'gestão de stakeholders',
      'analise de dados': 'análise de dados',
      'analitica de dados': 'análise de dados',
      'resolver problemas': 'resolução de problemas',
      'resolucao de problemas': 'resolução de problemas',
      'capacidade de resolucao de problemas': 'resolução de problemas',
      'habilidade de resolucao de problemas': 'resolução de problemas',
      'superior completo': 'superior completo',
      'graduacao completa': 'superior completo',
      'ensino superior completo': 'superior completo'
    };

    // Para cada categoria de keywords
    for (const category in keywords) {
      if (!keywords[category] || !Array.isArray(keywords[category])) {
        result[category] = keywords[category];
        continue;
      }
      
      // Mapa para rastrear termos já normalizados (versão normalizada -> termo original preferido)
      const normalizedMap = new Map();
      
      // Função para normalizar um termo para comparação
      const normalizeForComparison = (term) => {
        if (!term) return '';
        return term
          .toLowerCase()                   // Converte para minúsculas
          .normalize('NFD')               // Normaliza caracteres acentuados
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/\s+/g, ' ')           // Padroniza espaços
          .trim();                        // Remove espaços extras
      };
      
      // Normalizar e agrupar termos similares
      for (const term of keywords[category]) {
        if (!term) continue;
        
        const normalizedTerm = normalizeForComparison(term);
        
        // Verificar se é um caso conhecido de equivalentes
        if (knownEquivalents[normalizedTerm]) {
          normalizedMap.set(normalizedTerm, knownEquivalents[normalizedTerm]);
          continue;
        }
        
        // Verificar se alguma palavra-chave conhecida está contida no termo
        let matchedKnownTerm = false;
        for (const [knownKey, knownValue] of Object.entries(knownEquivalents)) {
          // Se o termo normalizado contém um termo conhecido como palavra completa
          if (normalizedTerm.includes(knownKey) && 
              (normalizedTerm === knownKey || 
               normalizedTerm.startsWith(knownKey + ' ') || 
               normalizedTerm.endsWith(' ' + knownKey) || 
               normalizedTerm.includes(' ' + knownKey + ' '))) {
            // Podemos substituir apenas a parte equivalente, preservando o resto
            // Mas por simplicidade, vamos usar a substituição completa por enquanto
            normalizedMap.set(normalizedTerm, term);
            matchedKnownTerm = true;
            break;
          }
        }
        
        if (matchedKnownTerm) continue;
        
        // Para outros termos, verificar se já existe um equivalente
        let found = false;
        for (const [existingKey, existingValue] of normalizedMap.entries()) {
          // Verificar similaridade de tokens (palavras individuais)
          const existingTokens = existingKey.split(' ');
          const currentTokens = normalizedTerm.split(' ');
          
          // Se compartilham a maioria das palavras, podem ser considerados equivalentes
          if (existingTokens.length === currentTokens.length) {
            // Calcular quantas palavras são iguais
            const commonTokens = existingTokens.filter(t => currentTokens.includes(t));
            if (commonTokens.length / existingTokens.length > 0.8) {
              // Preferir a versão com acentos corretamente
              if (term.includes('á') || term.includes('é') || term.includes('í') || 
                  term.includes('ó') || term.includes('ú') || term.includes('ã') || 
                  term.includes('õ') || term.includes('ç')) {
                normalizedMap.set(existingKey, term);
              }
              found = true;
              break;
            }
          }
        }
        
        // Se não for encontrado, adicionar como novo termo
        if (!found && !normalizedMap.has(normalizedTerm)) {
          normalizedMap.set(normalizedTerm, term);
        }
      }
      
      // Converter mapa de volta para array, usando o termo original preferido
      result[category] = Array.from(normalizedMap.values());
    }
    
    return result;
  }

  /**
   * Extrai keywords de uma descrição de vaga
   * @param {string} jobDescription - Texto da descrição da vaga
   * @returns {Promise<Object>} - Keywords extraídas da vaga
   */
  async extractJobKeywords(jobDescription) {
    console.log('[OpenAI] Texto recebido para extração de keywords da vaga:', JSON.stringify(jobDescription.substring(0, 500)) + '...');
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em recrutamento e seleção brasileiro, com profundo conhecimento em análise de requisitos de vagas. Sua tarefa é extrair TODAS as palavras-chave e requisitos relevantes da descrição da vaga fornecida, em um nível EXTREMAMENTE detalhado e granular. Você deve identificar todas as siglas/acrônimos e seus significados completos. Você DEVE responder em formato JSON válido."
          },
          {
            role: "user",
            content: `ATENÇÃO: EXTRAIA COM GRANULARIDADE EXTREMA TODAS as palavras-chave da seguinte descrição de vaga. Sua tarefa é identificar CADA TERMO individual, mesmo os mais básicos, seguindo exatamente o modelo de extração manual fornecido como exemplo.

Categorias para extração:
1. "technical": habilidades técnicas, ferramentas, tecnologias, metodologias, linguagens
2. "soft": habilidades comportamentais, competências interpessoais
3. "experience": experiências profissionais desejadas, conhecimento prático, cargo anterior
4. "education": formação acadêmica, cursos, certificações, especializações
5. "language": idiomas requeridos ou desejáveis
6. "mandatory": requisitos obrigatórios explicitamente mencionados como essenciais ou com termos como "necessário", "imprescindível"
7. "desirable": requisitos mencionados como "desejáveis", "diferenciais" ou "plus"
8. "tools": ferramentas específicas como Jira, Confluence, Miro, Trello, SAP, Salesforce, etc.

IMPORTANTE - MÉTODO DE EXTRAÇÃO MANUAL:
Observe este exemplo exato de extração manual para uma vaga de Product Owner. VOCÊ DEVE SEGUIR EXATAMENTE ESTE NÍVEL DE GRANULARIDADE:
- métricas de desempenho de produto
- feedback de usuário
- informações do mercado
- orientar o direcionamento
- próximas entregas
- requisitos funcionais
- requisitos não funcionais
- características do produto
- restrições
- segurança
- confiabilidade
- maior qualidade
- confiança de dados
- testes de aceitação
- padrões e métodos
- aprovação do produto
- melhorias
- efetividade
- atualizações
- funcionalidades
- produção
- relatórios
- usabilidade
- indicadores
- melhores resultados
- métricas de entrega
- time de tecnologia
- burn down
- tempo
- entrega do time
- período estabelecido
- cerimônias do time ágil
- documentação
- reuniões diárias
- planejamento
- cliente
- feedback geral
- entender as melhorias
- histórico de desenvolvimento
- graduação em Administração
- graduação em Tecnologia da Informação
- Product Owner
- metodologias ágeis
- Scrum
- Kanban
- Atlassian
- Jira
- Confluence
- Pacote Office
- produtos financeiros
- Gestão de Projetos
- desenvolvimento de produtos digitais

OBSERVE como a extração acima é EXTREMAMENTE GRANULAR e captura CADA TERMO individual. Você deve seguir exatamente este padrão.

MÉTODO DE EXTRAÇÃO PASSO A PASSO:

1. LEIA CADA LINHA DO TEXTO como uma fonte independente de termos

2. EXTRAIA TODOS OS TERMOS INDIVIDUAIS:
   - SEPARE CADA SUBSTANTIVO: "análise de métricas de desempenho" → "análise", "métricas", "desempenho"
   - MANTENHA TERMOS COMPOSTOS SIGNIFICATIVOS: "métricas de desempenho", "feedback de usuário"
   - CAPTURE CADA ELEMENTO de listas e enumerações
   - EXTRAIA CADA VERBO RELEVANTE como termo independente

3. TERMOS ESPECÍFICOS A CAPTURAR:
   - CAPTURE TODOS OS SUBSTANTIVOS E SUBSTANTIVOS COMPOSTOS
   - CAPTURE CADA FERRAMENTA mencionada (ex: Excel, Jira, PowerPoint)
   - CAPTURE CADA METODOLOGIA mencionada (ex: Scrum, Kanban, Ágil)
   - CAPTURE CADA TÉCNICA ou PROCESSO (ex: burn down, dailies, retrospectivas)
   - CAPTURE CADA CARGO e FUNÇÃO mencionados
   - CAPTURE CADA REQUISITO EDUCACIONAL (ex: formação, graduação, especialização)
   - CAPTURE CADA HABILIDADE TÉCNICA
   - CAPTURE CADA HABILIDADE INTERPESSOAL

4. NÍVEL DE DETALHAMENTO EXTREMO:
   - DECOMPONHA frases em seus componentes fundamentais
   - EXTRAIA TODOS OS TERMOS, mesmo os mais básicos e elementares
   - NÃO IGNORE NENHUM TERMO POTENCIALMENTE RELEVANTE
   - MANTENHA TERMOS CURTOS E DIRETOS (máximo 3-4 palavras)

5. PROCESSO MECÂNICO:
   - ANALISE CADA SENTENÇA palavra por palavra
   - PERGUNTE-SE: "Este termo ou combinação é relevante por si só?"
   - EXTRAIA TODOS os termos relevantes, mesmo se parecerem redundantes

Retorne um objeto JSON no seguinte formato, garantindo máxima granularidade em cada categoria:
{
  "technical": ["skill1", "skill2"...],
  "soft": ["skill1", "skill2"...],
  "experience": ["exp1", "exp2"...],
  "education": ["formação1", "certificação1"...],
  "language": ["idioma nível"...],
  "mandatory": ["requisito1", "requisito2"...],
  "desirable": ["diferencial1", "diferencial2"...],
  "tools": ["ferramenta1", "ferramenta2"...]
}

Descrição da vaga:
${jobDescription}`
          }
        ],
        temperature: 0.5, // Temperatura mais baixa para extração mais consistente
        max_tokens: 2500,
        response_format: { type: "json_object" }
      });

      const keywordsText = response.choices[0].message.content;
      console.log('[OpenAI] Resposta de keywords da vaga:', keywordsText);

      try {
        const keywords = JSON.parse(keywordsText);

        // Garantir que todas as categorias existam no objeto de retorno
        const completeKeywords = {
          technical: keywords.technical || [],
          soft: keywords.soft || [],
          experience: keywords.experience || [],
          education: keywords.education || [],
          language: keywords.language || [],
          mandatory: keywords.mandatory || [],
          desirable: keywords.desirable || [],
          tools: keywords.tools || []
        };

        // Normalizar keywords usando OpenAI para detectar sinônimos em todas as áreas profissionais
        const normalizedKeywords = await this.normalizeKeywords(completeKeywords);

        return normalizedKeywords;
      } catch (parseError) {
        console.error('[OpenAI] Erro ao parsear JSON de keywords da vaga:', parseError);
        return {
          technical: [],
          soft: [],
          experience: [],
          education: [],
          language: [],
          mandatory: [],
          desirable: [],
          tools: []
        };
      }
    } catch (error) {
      console.error('Erro ao extrair keywords da vaga com OpenAI:', error);
      return {
        technical: [],
        soft: [],
        experience: [],
        education: [],
        language: [],
        mandatory: [],
        desirable: [],
        tools: []
      };
    }
  }

  /**
   * Extrai keywords de um currículo
   * @param {string} resumeText - Texto extraído do currículo
   * @returns {Promise<Object>} - Keywords extraídas
   */
  async extractKeywords(resumeText) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em análise minuciosa e ultra-detalhada de currículos. Sua especialidade é extrair ABSOLUTAMENTE TODAS as palavras-chave e expressões relevantes, até mesmo as mais sutis e implícitas. Você consegue identificar não apenas palavras isoladas, mas expressões completas, conceitos compostos e terminologias específicas com o MÁXIMO GRAU DE DETALHE possível. Um humano experiente normalmente identifica 2-3 vezes mais termos e expressões que um sistema comum - seu objetivo é igualar ou superar esse nível de detalhamento. Você DEVE responder APENAS em formato JSON válido."
          },
          {
            role: "user",
            content: `Extraia ABSOLUTAMENTE TODAS as palavras-chave e expressões relevantes do seguinte currículo com um NÍVEL DE DETALHE ULTRA-APROFUNDADO. Sua análise deve ser EXTREMAMENTE MINUCIOSA, capturando até os termos mais sutis. Categorize-os em:

1. "technical": habilidades técnicas, ferramentas, tecnologias, metodologias, sistemas, processos, frameworks, conceitos técnicos, métricas
2. "soft": habilidades comportamentais, competências interpessoais, características pessoais, comunicação, liderança
3. "experience": cargos, responsabilidades, áreas de atuação, atividades específicas, funções, projetos
4. "education": formação acadêmica, cursos, certificações, especializações, treinamentos
5. "language": idiomas e níveis de proficiência
6. "sector": setores, indústrias, mercados, segmentos específicos
7. "tools": ferramentas, softwares, plataformas, sistemas específicos
8. "responsibilities": responsabilidades detalhadas, atribuições, funções específicas, entregas, resultados
9. "processes": processos, fluxos, metodologias, práticas, cerimônias, reuniões
10. "product": termos relacionados a produto, características, requisitos, qualidade, usabilidade

NOTA CRÍTICA: Uma análise manual humana do mesmo currículo identificou os seguintes termos que VOCÊ ABSOLUTAMENTE DEVE IDENTIFICAR além de quaisquer outros que encontrar:

- métricas de desempenho de produto (não apenas "métricas de desempenho")
- feedback de usuário
- feedback geral
- informações do mercado
- orientar o direcionamento
- próximas entregas
- requisitos funcionais (separadamente)
- requisitos não funcionais (separadamente)
- características do produto
- restrições
- segurança
- confiabilidade
- maior qualidade
- confiança de dados
- testes de aceitação
- padrões e métodos
- aprovação do produto
- melhorias
- efetividade
- atualizações
- funcionalidades
- produção
- relatórios
- usabilidade
- indicadores
- melhores resultados
- métricas de entrega
- time de tecnologia
- burn down
- tempo
- entrega do time
- período estabelecido
- cerimônias do time ágil
- documentação
- reuniões diárias
- planejamento
- cliente
- entender as melhorias
- histórico de desenvolvimento
- Graduação completa em Administração
- Graduação completa em Tecnologia da Informação
- cursos correlatos
- Product Owner
- metodologias ágeis
- Scrum
- Kanban
- Atlassian
- Jira
- Confluence
- Pacote Office
- produtos financeiros
- Gestão de Projetos
- desenvolvimento de produtos digitais

INSTRUÇÕES OBRIGATÓRIAS PARA EXTRAÇÃO ULTRA-DETALHADA:

1. NÃO SIMPLIFIQUE OU GENERALIZE. SEMPRE opte pela expressão mais específica e detalhada possível:
   - "métricas de desempenho de produto" (correto) vs. "métricas de desempenho" (incompleto)
   - "requisitos funcionais" e "requisitos não funcionais" (correto) vs. "requisitos" (incompleto)
   - "graduação completa em Administração" (correto) vs. "graduação" ou "administração" (incompleto)

2. PRESERVE TODAS AS QUALIFICAÇÕES E MODIFICADORES importantes:
   - "maior qualidade" (não apenas "qualidade")
   - "melhores resultados" (não apenas "resultados")
   - "próximas entregas" (não apenas "entregas")
   - "reuniões diárias" (não apenas "reuniões")

3. IDENTIFIQUE TERMOS RELACIONADOS MAS DISTINTOS:
   - "feedback de usuário" e "feedback geral" são conceitos diferentes
   - "métricas de desempenho" e "métricas de entrega" são distintos
   - "requisitos funcionais" e "requisitos não funcionais" são separados

4. NUNCA IGNORE DETALHES SUTIS que mudam o significado:
   - "graduação completa" vs. apenas "graduação"
   - "desenvolvimento de produtos digitais" vs. apenas "desenvolvimento de produtos"
   - "cerimônias do time ágil" vs. apenas "cerimônias ágeis"
   - "entrega do time" vs. apenas "entrega"

5. CAPTURE CADA EXPRESSÃO RELEVANTE, mesmo que pareça:  
   - Muito específica: "confiança de dados", "aprovação do produto"
   - Redundante: "melhorias" e "entender as melhorias" são diferentes
   - Incomum: "histórico de desenvolvimento", "orientar o direcionamento"
   - Composta: "período estabelecido", "características do produto"

6. EXTRAIA EXPRESSÕES COMPLETAS SEMPRE QUE FORMAREM UM CONCEITO COESO:
   - "testes de aceitação" (não apenas "testes")
   - "metodologias ágeis" (não apenas "metodologias" ou "ágeis")
   - "padrões e métodos" (como uma expressão completa)
   - "histórico de desenvolvimento" (como conceito único)

7. CAPTURE ABSOLUTAMENTE TODAS AS FERRAMENTAS E TECNOLOGIAS:
   - Sempre inclua plataformas específicas: "Jira", "Confluence", "Atlassian"
   - Software e pacotes: "Pacote Office"
   - Frameworks e metodologias: "Scrum", "Kanban"

ESTRATÉGIAS ADICIONAIS PARA MÁXIMO DETALHAMENTO:
- Examine cada frase várias vezes para extrair todos os termos significativos
- Considere tanto o significado literal quanto implícito
- Identifique conceitos mesmo quando eles não são mencionados diretamente
- Capture termos em seus contextos completos
- Preserve expressões compostas significativas
- Extraia termos relacionados a responsabilidades, processos e atividades específicas
- Não descarte termos por serem muito específicos ou detalhados

Retorne um objeto JSON completo no seguinte formato:
{
  "technical": ["skill1", "skill2", ...],
  "soft": ["skill1", "skill2", ...],
  "experience": ["exp1", "exp2", ...],
  "education": ["education1", "certification1", ...],
  "language": ["language1 level", "language2 level", ...],
  "sector": ["sector1", "sector2", ...],
  "tools": ["tool1", "tool2", ...],
  "responsibilities": ["responsibility1", "responsibility2", ...],
  "processes": ["process1", "process2", ...],
  "product": ["product1", "product2", ...]
}

Aqui está o texto do currículo para análise ultra-detalhada:

${resumeText}`
          }
        ],
        temperature: 0.5,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      });

      const keywordsText = response.choices[0].message.content;
      console.log('[OpenAI] Resposta de keywords do currículo:', keywordsText);

      try {
        const keywords = JSON.parse(keywordsText);

        // Garantir que todas as categorias existam no objeto de retorno
        const completeKeywords = {
          technical: keywords.technical || [],
          soft: keywords.soft || [],
          experience: keywords.experience || [],
          education: keywords.education || [],
          language: keywords.language || [],
          sector: keywords.sector || [],
          tools: keywords.tools || [],
          responsibilities: keywords.responsibilities || [],
          processes: keywords.processes || [],
          product: keywords.product || []
        };

        // Normalizar keywords usando OpenAI para detectar sinônimos em todas as áreas profissionais
        const normalizedKeywords = await this.normalizeKeywords(completeKeywords);

        return normalizedKeywords;
      } catch (parseError) {
        console.error('[OpenAI] Erro ao parsear JSON de keywords do currículo:', parseError);
        return {
          technical: [],
          soft: [],
          experience: [],
          education: [],
          language: [],
          sector: [],
          tools: []
        };
      }
    } catch (error) {
      console.error('Erro ao extrair keywords do currículo com OpenAI:', error);
      return {
        technical: [],
        soft: [],
        experience: [],
        education: [],
        language: [],
        sector: [],
        tools: [],
        responsibilities: [],
        processes: [],
        product: []
      };
    }
  }

  /**
   * Analisa a estrutura do currículo
   * @param {string} resumeText - Texto extraído do currículo
   * @returns {Promise<Object>} - Análise estrutural
   */
  async analyzeStructure(resumeText) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em recrutamento e seleção brasileiro, com experiência na análise de currículos. Sua tarefa é fornecer um feedback construtivo, preciso e útil sobre a estrutura do currículo fornecido. Avalie cada seção de forma justa, considerando as melhores práticas do mercado de trabalho brasileiro atual."
          },
          {
            role: "user",
            content: `Analise a estrutura deste currículo e avalie cada seção presente (como Resumo/Objetivo, Informações Pessoais, Formação, Experiência Profissional, Habilidades, Idiomas, etc.).

Para cada seção identificada no currículo, forneça:
1. Uma nota de 0 a 10
2. Um feedback específico e construtivo, explicando os pontos fortes e o que poderia ser melhorado
3. Sugestões práticas de melhorias

Ao final, dê uma nota geral para a estrutura completa do currículo.

Retorne um objeto JSON com o seguinte formato:
{
  "overallScore": número de 0 a 10,
  "sections": {
    "resumo": {"score": número, "feedback": "Feedback detalhado e construtivo", "suggestions": ["Sugestão 1", "Sugestão 2"]},
    "informacoespessoais": {"score": número, "feedback": "Feedback detalhado e construtivo", "suggestions": ["Sugestão 1", "Sugestão 2"]},
    "formacao": {"score": número, "feedback": "Feedback detalhado e construtivo", "suggestions": ["Sugestão 1", "Sugestão 2"]},
    "experienciaprofissional": {"score": número, "feedback": "Feedback detalhado e construtivo", "suggestions": ["Sugestão 1", "Sugestão 2"]},
    "habilidades": {"score": número, "feedback": "Feedback detalhado e construtivo", "suggestions": ["Sugestão 1", "Sugestão 2"]},
    "idiomas": {"score": número, "feedback": "Feedback detalhado e construtivo", "suggestions": ["Sugestão 1", "Sugestão 2"]}
  }
}

IMPORTANTE: Use os nomes de seções exatamente como mostrado acima: "resumo", "informacoespessoais", "formacao", "experienciaprofissional", "habilidades", "idiomas". 
Não use camelCase (como "informacoesPessoais" ou "experienciaProfissional") nos nomes das seções.

Inclua apenas as seções que realmente existem no currículo. Se uma seção não estiver presente, não a inclua no JSON.

Aqui está o texto do currículo para análise:

${resumeText}`
          }
        ],
        temperature: 0.5, // Temperatura mais baixa para análise estrutural mais consistente
        max_tokens: 2500,
        response_format: { type: "json_object" }
      });

      const structureAnalysisText = response.choices[0].message.content;
      console.log('[OpenAI] Resposta de análise estrutural:', structureAnalysisText);

      try {
        const structureAnalysis = JSON.parse(structureAnalysisText);
        return structureAnalysis;
      } catch (parseError) {
        console.error('[OpenAI] Erro ao parsear JSON de análise estrutural:', parseError);
        return {
          overallScore: 5,
          sections: {
            geral: {
              score: 5,
              feedback: "Não foi possível analisar completamente a estrutura do currículo",
              suggestions: ["Verifique se o formato do currículo está correto", "Tente fazer upload novamente"]
            }
          }
        };
      }
    } catch (error) {
      console.error('Erro ao analisar estrutura com OpenAI:', error);
      return {
        overallScore: 5,
        sections: {
          geral: {
            score: 5,
            feedback: "Ocorreu um erro ao analisar a estrutura do currículo",
            suggestions: ["Tente novamente mais tarde", "Verifique se o seu currículo está em formato PDF legível"]
          }
        }
      };
    }
  }

  /**
   * Analisa compatibilidade com ATS e extrai informações críticas para triagem
   * @param {string} resumeText - Texto extraído do currículo
   * @param {Array} jobDescriptions - Descrições das vagas para comparação
   * @returns {Promise<Object>} - Análise detalhada de compatibilidade com ATS
   */
  async analyzeATSCompatibility(resumeText, jobDescriptions = []) {
    try {
      const combinedJobText = jobDescriptions.map(job => job.description || '').join('\n\n');

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em otimização de currículos para sistemas ATS (Applicant Tracking Systems). Sua tarefa é analisar um currículo e identificar elementos críticos para passar pelos filtros automáticos de triagem, especialmente considerando as descrições de vagas fornecidas."
          },
          {
            role: "user",
            content: `Analise o currículo abaixo em relação aos critérios de triagem de sistemas ATS (sistemas de rastreamento de candidatos) frequentemente usados por empresas. 

${jobDescriptions.length > 0 ? 'Considere também as seguintes descrições de vagas para sua análise:' : ''}

${combinedJobText}

Forneça uma análise detalhada nos seguintes aspectos:

1. Formato e estrutura:
   - Verificar se o formato é compatível com ATS
   - Identificar problemas com formatação, tabelas, cabeçalhos ou gráficos
   - Analisar uso de templates que podem ser incompatíveis com ATS

2. Palavras-chave críticas:
   - Identificar palavras-chave cruciais para ATS que estão ausentes no currículo
   - Verificar termos técnicos, ferramentas, tecnologias e certificações relevantes
   - Sugerir sinônimos e variações para melhorar reconhecimento por ATS

3. Informações essenciais:
   - Verificar se todas as informações de contato necessárias estão presentes
   - Confirmar presença de datas e durações em experiências profissionais
   - Certificar-se de que há detalhes específicos sobre formação acadêmica

4. Taxa de compatibilidade:
   - Estimar a taxa de aprovação por sistemas ATS comuns (porcentagem)
   - Identificar possíveis filtros automáticos que poderiam rejeitar o currículo
   - Sugerir melhorias específicas para aumentar a taxa de aprovação

5. Recomendações de otimização:
   - Listar alterações específicas para melhorar compatibilidade com ATS
   - Sugerir reformulações de seções problemáticas
   - Recomendar inclusão de termos específicos da vaga

Responda em formato JSON seguindo esta estrutura:
{
  "atsCompatibilityScore": número de 0 a 100,
  "formatIssues": {
    "score": número de 0 a 100,
    "issues": ["problema 1", "problema 2"],
    "recommendations": ["recomendação 1", "recomendação 2"]
  },
  "keywordAnalysis": {
    "presentKeywords": ["keyword1", "keyword2"],
    "missingKeywords": ["keyword3", "keyword4"],
    "recommendedKeywords": ["keyword5", "keyword6"]
  },
  "missingEssentialInfo": ["informação 1", "informação 2"],
  "filterRisks": ["potencial filtro 1", "potencial filtro 2"],
  "optimizationRecommendations": ["recomendação 1", "recomendação 2"]
}

Aqui está o currículo para análise:

${resumeText}`
          }
        ],
        temperature: 0.5, // Temperatura mais baixa para análise ATS mais consistente e determinística
        max_tokens: 3000,
        response_format: { type: "json_object" }
      });

      const analysisText = response.choices[0].message.content;
      console.log('[OpenAI] Resposta da análise de compatibilidade ATS:', analysisText);

      try {
        const atsAnalysis = JSON.parse(analysisText);
        return atsAnalysis;
      } catch (parseError) {
        console.error('[OpenAI] Erro ao parsear JSON de análise ATS:', parseError);
        return {
          atsCompatibilityScore: 50,
          formatIssues: {
            score: 50,
            issues: ["Não foi possível analisar completamente a formatação do currículo"],
            recommendations: ["Verifique se o formato é legível por sistemas ATS"]
          },
          keywordAnalysis: {
            presentKeywords: [],
            missingKeywords: [],
            recommendedKeywords: ["Considere incluir palavras-chave relevantes para a vaga"]
          },
          missingEssentialInfo: ["Não foi possível identificar informações essenciais"],
          filterRisks: ["Risco de filtro por falta de análise completa"],
          optimizationRecommendations: ["Tente novamente a análise ou consulte um especialista para otimização ATS"]
        };
      }
    } catch (error) {
      console.error('[OpenAI] Erro na análise de compatibilidade ATS:', error);
      return {
        atsCompatibilityScore: 50,
        formatIssues: {
          score: 50,
          issues: ["Ocorreu um erro ao analisar a formatação do currículo"],
          recommendations: ["Verifique se o formato é legível por sistemas ATS"]
        },
        keywordAnalysis: {
          presentKeywords: [],
          missingKeywords: [],
          recommendedKeywords: ["Considere incluir palavras-chave relevantes para a vaga"]
        },
        missingEssentialInfo: ["Não foi possível identificar informações essenciais devido a um erro"],
        filterRisks: ["Risco de filtro por falta de análise completa"],
        optimizationRecommendations: ["Tente novamente a análise ou consulte um especialista para otimização ATS"]
      };
    }
  }

  /**
   * Cria uma análise de fallback em caso de erro
   * @param {string} [errorMessage="Ocorreu um erro inesperado durante a análise."] - Mensagem de erro específica.
   * @returns {Object} - Objeto de análise de fallback.
   */
  _createFallbackAnalysis(errorMessage = "Ocorreu um erro inesperado durante a análise.") {
    console.warn(`[OpenAI] Criando resposta de fallback. Erro: ${errorMessage}`);
    return {
      all_job_keywords: { technical: [], soft: [], experience: [], education: [], language: [], tools: [], mandatory: [], desirable: [] },
      matching_keywords: { technical: [], soft: [], experience: [], education: [], language: [], tools: [], mandatory: [], desirable: [] },
      missing_keywords: { technical: [], soft: [], experience: [], education: [], language: [], tools: [], mandatory: [], desirable: [] },
      ats_structure_evaluation: {
        clarity_organization: "Indisponível (Erro)",
        ats_compatibility: "Indisponível (Erro)",
        essential_sections: "Indisponível (Erro)",
        overall_score: 0,
        comments: `Erro na análise: ${errorMessage}`
      },
      recommendations: ["Não foi possível gerar recomendações devido a um erro."],
      conclusion: `Falha na análise: ${errorMessage}`,
      error: errorMessage // Campo adicional para indicar explicitamente o erro
    };
  }

  /**
   * Constrói o prompt para análise do currículo e vagas.
   * @param {string} resumeText - Texto do currículo.
   * @param {Array<Object>} jobs - Lista de vagas.
   * @param {Array<Object>} jobKeywords - Keywords já extraídas das vagas (pode ser usado como referência).
   * @returns {string} - Prompt formatado.
   * @private
   */
  _buildPrompt(resumeText, jobs, jobKeywords = []) {
    // Verifica se jobKeywords foi fornecido e tem conteúdo (informativo, a IA fará a consolidação)
    const hasKeywords = jobKeywords && jobKeywords.length > 0 && jobKeywords.some(job => job.keywords && Object.values(job.keywords).some(cat => cat.length > 0));

    let jobSection = "Nenhuma vaga fornecida para comparação.\n";
    if (jobs && jobs.length > 0) {
      jobSection = `Analise o currículo em relação às seguintes ${jobs.length} vagas:\n\n`;
      jobs.forEach((job, index) => {
        jobSection += `--- Vaga ${index + 1} ---\n`;
        jobSection += `Título: ${job.title || 'N/A'}\n`;
        jobSection += `Empresa: ${job.company || 'N/A'}\n`;
        if (job.url) jobSection += `URL: ${job.url}\n`;
        // Limita a descrição para evitar prompts excessivamente longos, mas fornece o suficiente para análise
        jobSection += `Descrição:\n${job.description ? job.description.substring(0, 2000) + (job.description.length > 2000 ? '...' : '') : 'Descrição não disponível'}\n`;

        // Adiciona as keywords extraídas PREVIAMENTE para esta vaga, se disponíveis, apenas como CONTEXTO ADICIONAL para a IA.
        // A IA ainda é instruída a fazer a própria consolidação final a partir das descrições completas.
        const keywordsForJob = jobKeywords.find(kwJob => kwJob.url === job.url || (kwJob.title === job.title && kwJob.company === job.company));
        if (keywordsForJob && keywordsForJob.keywords && Object.values(keywordsForJob.keywords).some(cat => cat.length > 0)) {
          // jobSection += `Contexto (Keywords pré-extraídas):\n${JSON.stringify(keywordsForJob.keywords, null, 2)}\n`; // Opcional: Descomentar se útil
        }
        jobSection += `\n`;
      });
    } else {
      jobSection = "Nenhuma vaga fornecida. Faça uma análise geral do currículo e da estrutura ATS.\n";
    }

    // Construção do prompt final
    const prompt = `
Atue como um especialista em sistemas ATS (Applicant Tracking Systems), otimização de currículos e análise de mercado de trabalho. Você tem 20 anos de experiência ajudando profissionais a otimizar seus currículos para melhorar sua performance em sistemas ATS e aumentar suas chances de conseguir entrevistas. Você entende profundamente como os ATS analisam descrições de vagas, extraem palavras-chave, avaliam estrutura de currículos e detectam lacunas.

--- Currículo ---
${resumeText}
--- Fim do Currículo ---

${jobSection}

Siga as 6 etapas abaixo cuidadosamente:

**Etapa 1: Extração de palavras-chave das vagas**
- Acesse cada uma das descrições de vagas fornecidas.
- Extraia palavras-chave relevantes, competências técnicas, habilidades interpessoais, qualificações, certificações, ferramentas e tecnologias mencionadas.
- Agrupe por categoria: habilidades técnicas, comportamentais, experiência, educação, idiomas, ferramentas, requisitos obrigatórios e desejáveis.
- Elimine duplicatas e indique a frequência de repetição de cada termo entre as vagas.
- Consolide uma lista com as palavras-chave mais recorrentes. Todas estas informações devem ser agrupadas em (all_job_keywords).

**Etapa 2: Análise do currículo**
- Leia todo o conteúdo do currículo fornecido.
- Identifique todas as palavras-chave presentes que também aparecem nas descrições das vagas (matching_keywords).
- Detecte quais palavras-chave importantes estão ausentes no currículo (missing_keywords).

**Etapa 3: Comparação de palavras-chave**
- Classifique as palavras-chave em três tipos:
  1. Palavras-chave encontradas no currículo (matching_keywords)
  2. Palavras-chave ausentes no currículo (missing_keywords)
  3. Termos parcialmente correspondentes (sinônimos ou variações)

**Etapa 4: Avaliação da estrutura do currículo conforme critérios ATS**
- Avalie os seguintes pontos (ats_structure_evaluation):
  - Uso adequado de seções (Experiência, Formação, Habilidades)
  - Formatação consistente e simples
  - Evita o uso de tabelas, gráficos ou caixas de texto
  - Tipo de arquivo compatível (preferencialmente PDF ou DOCX sem elementos gráficos)
  - Distribuição e contextualização das palavras-chave (não apenas listas soltas)

**Etapa 5: Recomendações**
- Forneça sugestões práticas para (recommendations):
  - Adicionar palavras-chave ausentes de forma natural
  - Reestruturar o currículo para maior compatibilidade com ATS
  - Melhorar a correspondência de palavras semelhantes
  - Indicar com quais das vagas o currículo tem maior alinhamento

**Etapa 6: Conclusão**
- Dê um resumo final com (conclusion):
  - Percentual de alinhamento do currículo com as vagas
  - Indicação das vagas mais compatíveis
  - Recomendações gerais para melhorar a performance do currículo em sistemas ATS

**Formato de Saída OBRIGATÓRIO (JSON):**

Responda **ESTRITAMENTE** com um objeto JSON válido contendo EXATAMENTE os seguintes campos e estrutura. NÃO inclua nenhum texto ou explicação fora do JSON.

{
  "all_job_keywords": {
    "technical": ["keyword1", "keyword2"],
    "soft": ["keyword1"],
    "experience": [],
    "education": [],
    "language": [],
    "tools": [],
    "mandatory": [],
    "desirable": []
  },
  "matching_keywords": {
    "technical": ["keyword1"],
    "soft": [],
    "experience": [],
    "education": [],
    "language": [],
    "tools": [],
    "mandatory": [],
    "desirable": []
  },
  "missing_keywords": {
    "technical": ["keyword1"],
    "soft": [],
    "experience": [],
    "education": [],
    "language": [],
    "tools": [],
    "mandatory": [],
    "desirable": []
  },
  "ats_structure_evaluation": {
    "clarity_organization": "Avaliação da clareza e organização (Ex: Boa, Média, Precisa Melhorar). Justificativa concisa.",
    "ats_compatibility": "Avaliação da compatibilidade com ATS (Ex: Alta, Média, Baixa). Justificativa sobre formatação, fontes, parseabilidade.",
    "essential_sections": "Verificação de seções essenciais (Ex: Contato: OK, Experiência: OK, Educação: OK, Habilidades: Ausente).",
    "overall_score": 8,
    "comments": "Comentários adicionais sobre a estrutura ou pontos específicos de ATS."
  },
  "recommendations": [
    "Recomendação 1: Sugestão específica e acionável.",
    "Recomendação 2: Focada em keywords ausentes ou alinhamento com vagas.",
    "Recomendação 3: Focada em melhoria da estrutura ou ATS."
  ],
  "conclusion": "Resumo final conciso da análise, destacando a adequação geral (se houver vagas) e os próximos passos mais importantes."
}

**REGRAS IMPORTANTES:**
- Responda APENAS com o objeto JSON.
- Preencha todas as categorias de keywords mesmo que vazias (use []).
- Se não houver vagas, os campos all_job_keywords, matching_keywords, missing_keywords devem conter arrays vazios em suas categorias.
- A avaliação ATS, recomendações e conclusão devem focar no currículo geral se não houver vagas.
`;

    // console.log("[OpenAI] Prompt construído:", prompt.substring(0, 500) + "..."); // Log do início do prompt para debug
    return prompt;
  }

  /**
   * Analisa a compatibilidade de um currículo com sistemas ATS (Applicant Tracking Systems)
   * @param {string} resumeText - Texto extraído do currículo
   * @param {string} jobDescription - Descrição da vaga para comparação (opcional)
   * @returns {Promise<Object>} - Análise detalhada de compatibilidade ATS
   */
  async analyzeATSCompatibility(resumeText, jobDescription = '') {
    try {
      console.log(`[OpenAI] Iniciando análise de compatibilidade ATS (${resumeText.length} caracteres)`);

      const prompt = this._buildATSPrompt(resumeText, jobDescription);

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em sistemas ATS (Applicant Tracking Systems) com ampla experiência em otimização de currículos para passar por filtros automatizados. Forneça uma análise detalhada e objetiva da compatibilidade ATS do currículo, destacando problemas e oportunidades de melhoria."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5, // Temperatura mais baixa para análise ATS mais consistente e determinística
        max_tokens: 3000,
        response_format: { type: "json_object" }
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error('Resposta inválida da API OpenAI');
      }

      let data;
      try {
        data = JSON.parse(response.choices[0].message.content);
      } catch (e) {
        console.error('Erro ao fazer parse do JSON retornado pela OpenAI:', e);
        console.log('Conteúdo recebido:', response.choices[0].message.content);
        throw new Error('Erro ao processar resposta do modelo de IA');
      }

      return data;
    } catch (error) {
      console.error(`[OpenAI] Erro na análise ATS: ${error.message}`);
      throw error;
    }
  }

  /**
   * Constrói o prompt para análise de compatibilidade ATS
   * @param {string} resumeText - Texto do currículo
   * @param {string} jobDescription - Descrição da vaga (opcional)
   * @returns {string} - Prompt formatado
   * @private
   */
  _buildATSPrompt(resumeText, jobDescription = '') {
    let prompt = `# ANÁLISE DE COMPATIBILIDADE ATS

## CURRÍCULO PARA ANÁLISE:

${resumeText}

`;

    if (jobDescription && jobDescription.trim() !== '') {
      prompt += `## DESCRIÇÃO DA VAGA PARA REFERÊNCIA:

${jobDescription}

`;
    }

    prompt += `## INSTRUÇÕES PARA ANÁLISE ATS:

Analise detalhadamente o currículo acima e avalie sua compatibilidade com sistemas ATS (Applicant Tracking Systems) que são usados por recrutadores para triagem automatizada de candidatos. Forneça uma análise detalhada em formato JSON com as seguintes seções:

`;

    // Instruções para o formato de resposta
    prompt += `{
  "atsCompatibilityScore": 75, // Nota de 0-100 estimando a compatibilidade com sistemas ATS
  "summary": "Um resumo geral da análise de compatibilidade ATS, destacando os principais problemas e pontos fortes",
  "issues": [
    {
      "category": "formatting", // Uma das categorias: formatting, keywords, information, readability
      "severity": "high", // high, medium, low
      "description": "Descrição do problema",
      "recommendation": "Recomendação para correção"
    }
  ],
  "formattingAnalysis": {
    "score": 70, // Nota de 0-100 para formatação
    "strengths": ["Lista de pontos fortes na formatação"],
    "weaknesses": ["Lista de problemas de formatação"],
    "recommendations": ["Lista de recomendações para formatação"]
  },
  "keywordAnalysis": {
    "score": 80, // Nota de 0-100 para uso de palavras-chave
    "presentKeywords": ["Lista de palavras-chave importantes presentes"],
    "missingKeywords": ["Lista de palavras-chave importantes ausentes ou mal posicionadas"],
    "recommendations": ["Lista de recomendações para otimização de palavras-chave"]
  },
  "contentAnalysis": {
    "score": 75, // Nota de 0-100 para conteúdo
    "strengths": ["Lista de pontos fortes no conteúdo"],
    "weaknesses": ["Lista de problemas no conteúdo"],
    "missingInformation": ["Lista de informações importantes ausentes que podem prejudicar a triagem"]
  },
  "readabilityAnalysis": {
    "score": 85, // Nota de 0-100 para legibilidade por sistemas ATS
    "issues": ["Lista de problemas de legibilidade para sistemas ATS"],
    "recommendations": ["Lista de recomendações para melhorar a legibilidade"]
  },
  "overallRecommendations": ["Lista de recomendações gerais para melhorar a compatibilidade com ATS"],
  "riskAssessment": {
    "rejectionRisk": "medium", // high, medium, low
    "riskFactors": ["Lista de fatores que aumentam o risco de rejeição automática"],
    "criticalIssues": ["Lista de problemas críticos que precisam ser corrigidos com urgência"]
  }
}

É OBRIGATÓRIO responder APENAS em formato JSON válido, seguindo exatamente a estrutura acima.`;

    return prompt;
  }
}

module.exports = new OpenAIService();
