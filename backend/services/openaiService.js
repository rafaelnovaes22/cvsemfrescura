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
        temperature: 0.1, // Temperatura mais baixa para respostas mais consistentes e determinísticas
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
      // Preparar dados para normalização pelo OpenAI
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

Por favor, retorne apenas um objeto JSON com as mesmas categorias, mas com as palavras-chave normalizadas:

${JSON.stringify(keywords, null, 2)}`
          }
        ],
        temperature: 0.1, // Temperatura mais baixa para normalização mais consistente
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
        return keywords; // Em caso de erro, retorna as keywords originais
      }
    } catch (error) {
      console.error('Erro ao normalizar keywords com OpenAI:', error);
      return keywords; // Em caso de erro, retorna as keywords originais
    }
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
            content: "Você é um especialista em recrutamento e seleção brasileiro, com profundo conhecimento em análise de requisitos de vagas. Sua tarefa é extrair todas as palavras-chave e requisitos relevantes da descrição da vaga fornecida, categorizada por tipo. Você deve identificar todas as siglas/acrônimos e seus significados completos. Você DEVE responder em formato JSON válido."
          },
          {
            role: "user",
            content: `Extraia com precisão TODAS as palavras-chave relevantes da seguinte descrição de vaga, separando-as nas seguintes categorias:

1. "technical": habilidades técnicas, ferramentas, tecnologias, metodologias, linguagens
2. "soft": habilidades comportamentais, competências interpessoais
3. "experience": experiências profissionais desejadas, conhecimento prático, cargo anterior
4. "education": formação acadêmica, cursos, certificações, especializações
5. "language": idiomas requeridos ou desejáveis
6. "mandatory": requisitos obrigatórios explicitamente mencionados como essenciais ou com termos como "necessário", "imprescindível"
7. "desirable": requisitos mencionados como "desejáveis", "diferenciais" ou "plus"
8. "tools": ferramentas específicas como Jira, Confluence, Miro, Trello, SAP, Salesforce, etc.

DIRETRIZES:
- NUNCA extraia frases completas como palavras-chave. Por exemplo, ao invés de "experiência em gerenciar relacionamentos com equipes técnicas e de negócios", extraia separadamente: "gerenciar relacionamentos", "equipes técnicas", "equipes de negócios"
- NUNCA extraia palavras genéricas e vagas como "vivência", "experiência", "conhecimento", mesmo quando associadas a uma habilidade ou área específica. Remova estas palavras genéricas e mantenha apenas os termos específicos
- REMOVA PREFIXOS DESNECESSÁRIOS como "habilidade para", "capacidade de", "orientado a", "sensibilidade para", "gerenciar", "foco em". Ex: use "resolver problemas" em vez de "habilidade para resolver problemas" ou "foco na resolução de problemas"
- ELIMINE DUPLICAÇÕES SEMÂNTICAS: Não inclua a mesma competência de formas diferentes. Ex: "resolver problemas", "resolução de problemas" e "habilidade para resolver problemas" devem aparecer uma única vez como "resolver problemas"
- NORMALIZE SINÔNIMOS E VARIAÇÕES: Padronize termos que significam a mesma coisa. Ex: "metodologias ágeis", "Metodologias ágeis", "práticas ágeis", "metodologia ágil" devem aparecer apenas uma vez como "metodologias ágeis". Considere também variações de singular/plural e capitalização
- IDENTIFIQUE SIGLAS/ACRÔNIMOS e seus significados completos como equivalentes. Ex: "PO" = "Product Owner", "SM" = "Scrum Master", "RH" = "Recursos Humanos", "TI" = "Tecnologia da Informação". Combine-os no formato completo seguido da sigla: ex: "Product Owner (PO)"
- ATENÇÃO: NÃO generalize cargos com especialidades específicas como equivalentes aos cargos base. Ex: "Data Product Owner" NÃO é igual a "Product Owner", "Tech Product Owner" NÃO é igual a "Product Owner", "Financial Analyst" NÃO é igual a "Analyst". Mantenha esses cargos específicos separados
- ATENTE-SE ESPECIALMENTE a siglas utilizadas nas áreas de tecnologia, gestão, agile, negócios e recursos humanos (por exemplo: PO, DPO, PM, TPO, SM, RH, TI, UX, UI, CRM, ERP, etc.) e suas especializações. Ex: "DPO" = "Data Product Owner", "TPO" = "Tech Product Owner", "CPTO" = "Chief Product & Technology Officer"
- Divida frases longas em segmentos menores e significativos
- NÃO CONFUNDA termos relacionados mas distintos: "KRs" (Key Results) e "OKRs" (Objectives and Key Results) são conceitos diferentes na mesma metodologia. Da mesma forma, diferencie "BI" (Business Intelligence) de "PowerBI" (ferramenta específica de BI da Microsoft)
- Certifique-se de capturar siglas e acrônimos exatamente como aparecem (ex: "SEO", "OKRs", "KPIs")
- Identifique termos específicos, nunca frases longas
- Padronize termos similares para evitar redundância (por exemplo, escolha apenas "gestão" ou "gerenciamento", não ambos)
- Unifique variações de capitalização, singular/plural e sinônimos próximos (ex: escolha apenas "metodologias ágeis" entre "metodologias ágeis", "Metodologias ágeis", "práticas ágeis", "metodologia ágil")
- Inclua variações importantes (ex: "Administração" e "Administração de Empresas")
- Capture diferentes níveis quando mencionados (ex: "inglês avançado", "inglês intermediário")
- Preste atenção especial nos requisitos de formação - capture área, nível e especializações
- Identifique palavras-chave do setor/indústria específica
- Diferencie requisitos obrigatórios de desejáveis
- IMPORTANTE: Identifique TODAS as ferramentas mencionadas (como Jira, Confluence, etc.) e coloque-as tanto na categoria "technical" quanto na categoria "tools"
- EVITE DUPLICAÇÕES: Não repita a mesma palavra-chave múltiplas vezes na mesma categoria

Retorne um objeto JSON no seguinte formato:
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
        temperature: 0.1, // Temperatura mais baixa para extração mais consistente
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
            content: "Você é um especialista em análise de currículos brasileiros e sistemas ATS (Applicant Tracking Systems). Sua tarefa é extrair TODAS as palavras-chave relevantes do currículo fornecido, mesmo aquelas que estejam implícitas ou em diferentes variações (singular/plural, verbos/substantivos). Considere termos técnicos, habilidades, experiências, formações e certificações. Você DEVE responder em formato JSON válido."
          },
          {
            role: "user",
            content: `Extraia TODAS as palavras-chave relevantes do seguinte currículo, categorizando-as em:

1. "technical": habilidades técnicas, ferramentas, tecnologias, metodologias, sistemas, conhecimentos específicos
2. "soft": habilidades comportamentais, competências interpessoais
3. "experience": cargos, responsabilidades, projetos, experiências profissionais, áreas de atuação
4. "education": formação acadêmica, cursos, certificações, especializações, graus acadêmicos
5. "language": idiomas e níveis de proficiência
6. "sector": setores ou indústrias específicas de experiência
7. "tools": ferramentas específicas como Jira, Confluence, Miro, Trello, SAP, Salesforce, etc.

DIRETRIZES IMPORTANTES:
- NUNCA extraia frases completas como palavras-chave. Por exemplo, ao invés de "experiência em gerenciar relacionamentos com equipes técnicas e de negócios", extraia separadamente: "gerenciar relacionamentos", "equipes técnicas", "equipes de negócios"
- NUNCA extraia palavras genéricas e vagas como "vivência", "experiência", "conhecimento", mesmo quando associadas a uma habilidade ou área específica. Remova estas palavras genéricas e mantenha apenas os termos específicos
- REMOVA PREFIXOS DESNECESSÁRIOS como "habilidade para", "capacidade de", "orientado a", "sensibilidade para", "gerenciar", "foco em". Ex: use "resolver problemas" em vez de "habilidade para resolver problemas" ou "foco na resolução de problemas"
- ELIMINE DUPLICAÇÕES SEMÂNTICAS: Não inclua a mesma competência de formas diferentes. Ex: "resolver problemas", "resolução de problemas" e "habilidade para resolver problemas" devem aparecer uma única vez como "resolver problemas"
- NORMALIZE SINÔNIMOS E VARIAÇÕES: Padronize termos que significam a mesma coisa. Ex: "metodologias ágeis", "Metodologias ágeis", "práticas ágeis", "metodologia ágil" devem aparecer apenas uma vez como "metodologias ágeis". Considere também variações de singular/plural e capitalização
- IDENTIFIQUE SIGLAS/ACRÔNIMOS e seus significados completos como equivalentes. Ex: "PO" = "Product Owner", "SM" = "Scrum Master", "RH" = "Recursos Humanos", "TI" = "Tecnologia da Informação". Combine-os no formato completo seguido da sigla: ex: "Product Owner (PO)"
- ATENÇÃO: NÃO generalize cargos com especialidades específicas como equivalentes aos cargos base. Ex: "Data Product Owner" NÃO é igual a "Product Owner", "Tech Product Owner" NÃO é igual a "Product Owner", "Financial Analyst" NÃO é igual a "Analyst". Mantenha esses cargos específicos separados
- ATENTE-SE ESPECIALMENTE a siglas utilizadas nas áreas de tecnologia, gestão, agile, negócios e recursos humanos (por exemplo: PO, DPO, PM, TPO, SM, RH, TI, UX, UI, CRM, ERP, etc.) e suas especializações. Ex: "DPO" = "Data Product Owner", "TPO" = "Tech Product Owner", "CPTO" = "Chief Product & Technology Officer"
- Divida frases longas em segmentos menores e significativos
- Capture TODAS as palavras-chave importantes, mesmo as menos óbvias
- Padronize termos similares para evitar redundância (por exemplo, escolha apenas "gestão" ou "gerenciamento", não ambos)
- Unifique variações de capitalização, singular/plural e sinônimos próximos (ex: escolha apenas "metodologias ágeis" entre "metodologias ágeis", "Metodologias ágeis", "práticas ágeis", "metodologia ágil")
- Extraia termos técnicos e acrônimos mesmo se forem mencionados rapidamente
- NÃO CONFUNDA termos relacionados mas distintos: "KRs" (Key Results) e "OKRs" (Objectives and Key Results) são conceitos diferentes na mesma metodologia. Da mesma forma, diferencie "BI" (Business Intelligence) de "PowerBI" (ferramenta específica de BI da Microsoft)
- Identifique termos implícitos derivados das responsabilidades descritas
- Inclua especialidades derivadas da descrição de projetos ou atividades
- Considere sinônimos comumente usados em processos seletivos
- Preste atenção especial em termos técnicos, ferramentas e metodologias
- IMPORTANTE: Identifique TODAS as ferramentas mencionadas (Jira, Confluence, etc.) e coloque-as tanto na categoria "technical" quanto na categoria "tools"
- EVITE DUPLICAÇÕES: Não repita a mesma palavra-chave múltiplas vezes na mesma categoria

Retorne um objeto JSON completo no seguinte formato:
{
  "technical": ["skill1", "skill2", ...],
  "soft": ["skill1", "skill2", ...],
  "experience": ["exp1", "exp2", ...],
  "education": ["education1", "certification1", ...],
  "language": ["language1 level", "language2 level", ...],
  "sector": ["sector1", "sector2", ...],
  "tools": ["tool1", "tool2", ...]
}

Aqui está o texto do currículo para análise:

${resumeText}`
          }
        ],
        temperature: 0.1,
        max_tokens: 2500,
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
          tools: keywords.tools || []
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
        tools: []
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
        temperature: 0.1, // Temperatura mais baixa para análise estrutural mais consistente
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
        temperature: 0.1, // Temperatura mais baixa para análise ATS mais consistente e determinística
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
Por favor, analise o seguinte currículo:
--- Currículo ---
${resumeText}
--- Fim do Currículo ---

${jobSection}

**Instruções de Análise:**

1. Consolide Todas As Palavras-chave das Vagas: Leia TODAS as descrições de vagas fornecidas. Extraia e consolide TODAS as palavras-chave, requisitos e habilidades importantes em um único conjunto categorizado (all_job_keywords). Se nenhuma vaga foi fornecida, retorne objetos/arrays vazios para os campos relacionados a keywords.
2. Identifique Palavras-chave Correspondentes: Compare as habilidades e termos do currículo com a lista consolidada de palavras-chave das vagas (all_job_keywords). Liste as palavras-chave que aparecem em AMBOS (matching_keywords).
3. Identifique Palavras-chave Ausentes: Liste as palavras-chave importantes de all_job_keywords que NÃO foram encontradas no currículo (missing_keywords). Destaque as mais críticas.
4. Avalie a Estrutura e ATS: Analise a clareza, organização e compatibilidade do currículo com sistemas de rastreamento de candidatos (ATS). Avalie seções essenciais, formatação, fontes e facilidade de parseamento (ats_structure_evaluation).
5. Forneça Recomendações: Dê sugestões concretas para melhorar o currículo, focando em alinhar com as vagas (se houver) e otimizar para ATS (recommendations).
6. Escreva uma Conclusão: Apresente um resumo final da análise, adequação geral e próximos passos (conclusion).

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
        temperature: 0.1, // Temperatura mais baixa para análise ATS mais consistente e determinística
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
