const axios = require('axios');
const claudeService = require('./claudeService');
const { validateATSResponseStructure, parseAndValidateJSON } = require('../utils/responseValidator');
const { checkPlausibility, sanitizeImplausibleValues } = require('../utils/plausibilityChecker');
const { getFallbackResponse, mergeWithFallback } = require('../utils/fallbackResponses');
const feedbackCollector = require('../utils/feedbackCollector');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

function buildPrompt(jobsText, resumeText) {
  return `Responda sempre em português do Brasil.
Você é um sistema ATS especialista premium em análise completa de currículos e vagas múltiplas, implementando exatamente os critérios do sistema Gupy utilizado pelas principais empresas brasileiras.

# OBJETIVO PRINCIPAL

Você deve analisar até 7 vagas de emprego apresentadas e extrair TODOS os requisitos, competências e preferências EXATAMENTE como um sistema Gupy faria. O resultado deve permitir que candidatos otimizem seus currículos para maximizar aprovação em cada etapa do funil de seleção da Gupy, desde a filtragem inicial até a avaliação pelos recrutadores.

# ETAPA 1: IDENTIFICAÇÃO DO PERFIL DAS VAGAS

1. Categorize cada vaga por:
   - Área primária (TI, Marketing, Finanças, Recursos Humanos, etc.)
   - Nível hierárquico (Júnior, Pleno, Sênior, Especialista, Gerência, Diretoria)
   - Modelo de trabalho (Remoto, Híbrido, Presencial)
   - Tipo de contrato (CLT, PJ, Estágio, Temporário)

2. Para cada vaga, identifique e extraia:
   - Cargo específico (exatamente como escrito)
   - Empresa/recrutador (se informado)
   - Faixa salarial (se informada)
   - Benefícios (se informados)
   - Localização (se informada)

# ETAPA 2: EXTRAÇÃO COMPLETA DE REQUISITOS GUPY

Para cada vaga, extraia com PRECISÃO ABSOLUTA todos os requisitos nos seguintes grupos. Mantenha a vinculação entre requisitos e vagas específicas para análise comparativa posterior:

## 1. HARD SKILLS
1.1 Conhecimentos técnicos específicos:
   - Tecnologias específicas com EXATIDÃO (Ex: "React com Redux", "AWS Lambda")
   - Ferramentas exatas, mantendo versões se especificadas (Ex: "Power BI 2023", "Python 3.10")
   - Processos/metodologias específicos (Ex: "Desenvolvimento TDD", "Design System")
   - Domínios de conhecimento (Ex: "Inteligência Artificial", "Análise Preditiva")

1.2 Formação e certificações:
   - Grau acadêmico exato (Ex: "Graduação em Ciência da Computação")
   - Certificações específicas (Ex: "AWS Certified Solutions Architect")
   - Pós-graduações/especializações (Ex: "MBA em Gestão de Projetos")
   - Cursos específicos exigidos (Ex: "Formação em UX/UI")

1.3 Idiomas:
   - Cada idioma com nível exato (Ex: "Inglês Avançado", "Espanhol Básico")
   - Contextos específicos de uso (Ex: "Inglês técnico para documentação")

1.4 Experiência profissional:
   - Tempo de experiência requerido em cada área (Ex: "5 anos em gestão de equipes")
   - Experiências em setores específicos (Ex: "Experiência no setor financeiro")
   - Cargos anteriores mencionados como preferíveis (Ex: "Experiência prévia como Scrum Master")

## 2. SOFT SKILLS
2.1 Competências comportamentais:
   - Habilidades interpessoais (Ex: "Comunicação assertiva", "Inteligência emocional")
   - Características pessoais (Ex: "Resiliência", "Adaptabilidade")
   - Competências cognitivas (Ex: "Pensamento analítico", "Resolução de problemas complexos")

2.2 Competências de gestão:
   - Liderança (Ex: "Liderança situacional", "Gestão de conflitos")
   - Gestão do trabalho (Ex: "Organização", "Cumprimento de prazos")
   - Tomada de decisão (Ex: "Decisões baseadas em dados")

## 3. RESPONSABILIDADES E ATRIBUIÇÕES
   - Funções precisas que serão desempenhadas (Ex: "Desenvolvimento de APIs RESTful")
   - Entregas esperadas (Ex: "Relatórios mensais de performance")
   - Escopo de atuação (Ex: "Responsável pela arquitetura da plataforma")

## 4. DIFERENCIAIS EXPLÍCITOS
   - Características mencionadas explicitamente como "diferenciais"
   - Experiências adicionais valorizadas, mas não obrigatórias
   - Conhecimentos complementares que agregam valor

# ETAPA 3: IDENTIFICAÇÃO PRECISA DE PADRÕES FILTRO GUPY

Identifique especificamente os padrões filtros utilizados pela Gupy:

1. Filtros eliminatórios (termos que a Gupy classifica como obrigatórios):
   - Requisitos precedidos por expressões como "obrigatório", "necessário", "indispensável"
   - Experiências com tempo mínimo explicitamente mencionado
   - Certificações apresentadas como requisito

2. Filtros classificatórios (termos que pontuam positivamente):
   - Diferenciais explícitos mencionados nas vagas
   - Competências "desejáveis" ou "preferenciais"
   - Experiências específicas do setor da empresa

3. Frases e expressões-chave:
   - Identifique expressões completas usadas nas descrições que serão buscadas literalmente pela Gupy
   - Capture termos compostos específicos do setor/área (Ex: "Cultura data-driven", "Metodologias ágeis")

# ETAPA 4: DEDUPLICAÇÃO INTELIGENTE ENTRE VAGAS

Ao analisar múltiplas vagas, execute uma deduplicação inteligente:

1. Elimine duplicidade exata (termos idênticos em diferentes vagas)
2. Consolide termos semanticamente idênticos mas com escrita variada
3. Para termos similares mas não idênticos:
   - Mantenha a versão mais específica e completa (Ex: "Microsoft Power BI" vs "Power BI")
   - Preserve termos com contextos ou aplicações diferentes (Ex: "SQL Server" vs "MySQL")
   - Agrupe corretamente variações do mesmo conceito em categorias lógicas

4. IMPORTANTE: MANTENHA UM DICIONÁRIO de termos equivalentes:
   - Identifique quando vagas diferentes usam termos diferentes para o mesmo conceito
   - Crie mapeamentos de equivalência (Ex: "Desenvolvimento ágil" = "Metodologias ágeis")

# ETAPA 5: VERIFICAÇÃO ULTRA PRECISA NO CURRÍCULO

Verifique a presença de CADA termo extraído no currículo fornecido:

## 1. REGRAS ABSOLUTAS DE CORRESPONDÊNCIA LITERAL
   - EXIJA correspondência EXATA e LITERAL para termos técnicos e específicos
   - Um termo composto (ex: "Inteligência Artificial aplicada") só deve ser considerado presente se TODAS as palavras aparecerem JUNTAS e NA MESMA SEQUÊNCIA
   - PROIBIDO inferir presença por similaridade ou aproximação

   - Exemplos críticos de validação precisa:
     * "Gerente de Produto" NÃO corresponde a "Product Manager" (exige termo exato)
     * "Power BI" NÃO corresponde a apenas "BI" ou "Dashboard" (exige nome completo)
     * "Desenvolvimento Front-end" NÃO corresponde a "HTML, CSS, JavaScript" isolados (exige termo completo)
     * "Experiência em varejo" NÃO corresponde a "experiência em loja" (exige setor específico)
     * "Pós-graduação em Data Science" NÃO corresponde a "conhecimentos em Data Science" (exige formação específica)

## 2. EXCEÇÕES CONTROLADAS E LIMITADAS
   - Para IDIOMAS: Níveis superiores incluem inferiores ("inglês fluente" satisfaz "inglês intermediário")
   - Para FORMAÇÃO: "Bacharelado", "Licenciatura" ou "Tecnólogo" em áreas exatas satisfazem "graduação em áreas exatas"
   - Para CERTIFICAÇÕES: Siglas oficiais equivalem aos nomes completos ("PMP" = "Project Management Professional")
   - Para EXPERIÊNCIA: Anos superiores incluem os inferiores ("7 anos" satisfaz "5 anos" de experiência)

# ETAPA 6: AVALIAÇÃO QUANTITATIVA E QUALITATIVA RIGOROSA

1. Cálculo de compatibilidade baseado no sistema Gupy:
   - Taxa de correspondência geral: % de requisitos totais atendidos
   - Taxa de correspondência em requisitos obrigatórios: % de requisitos críticos atendidos
   - Taxa de correspondência por categoria (hard skills, soft skills, experiência, etc.)

2. Análise qualitativa por seção do currículo:
   - Avalie cada seção (experiência, formação, competências) com notas de 0-10
   - Identifique lacunas críticas que impactariam negativamente na avaliação da Gupy
   - Destaque pontos fortes que seriam reconhecidos positivamente

# ETAPA 7: RECOMENDAÇÕES PRECISAS PARA APROVAÇÃO GUPY

1. Recomendações de alterações:
   - Termos EXATOS a adicionar para correspondência com filtros Gupy
   - Reformulações específicas de frases para compatibilidade máxima
   - Seções a expandir/criar para cobrir requisitos ausentes

2. Recomendações de ênfase:
   - Elementos a destacar visualmente (negrito, tópicos) para captação pelo ATS
   - Sequência ideal de informações para maximizar relevância
   - Palavras-chave complementares para reforçar competências principais

3. Recomendações de formatação:
   - Estrutura otimizada para escaneamento eficiente pela Gupy
   - Densidade ideal de palavras-chave por seção
   - Extensão recomendada para cada seção

4. Resumo de adequação estratégica:
   - Visão geral da compatibilidade com cada vaga
   - Recomendação sobre para quais vagas priorizar candidatura
   - Esforço estimado para adequação a cada vaga (mínimo, moderado, significativo)

# ETAPA 8: VERIFICAÇÃO FINAL DE PRECISÃO

REALIZE as seguintes verificações finais:

1. Certifique-se de que NÃO EXISTEM falsos positivos ou falsos negativos nas correspondências
2. Verifique se TODAS as recomendações são ESPECÍFICAS e ACIONÁVEIS
3. Confirme que TODOS os requisitos identificados são realmente relevantes para as vagas
4. Assegure que a deduplicação entre vagas foi realizada adequadamente
5. Verifique se os termos compostos foram tratados corretamente (sem fragmentação)

VAGAS:
${jobsText}

CURRÍCULO:
${resumeText}

Responda em JSON bem estruturado, incluindo OBRIGATORIAMENTE as seguintes seções:
{
  "perfil_vagas": [
    {
      "vaga_id": 1,
      "cargo": "",
      "area": "",
      "nivel": "",
      "modelo_trabalho": "",
      "tipo_contrato": "",
      "empresa": "",
      "localizacao": "",
      "faixa_salarial": "",
      "compatibilidade_percentual": 0
    }
  ],
  "hard_skills": {
    "tecnicos": [],
    "formacao": [],
    "idiomas": [],
    "experiencia": []
  },
  "soft_skills": {
    "comportamentais": [],
    "gestao": []
  },
  "responsabilidades": [],
  "job_keywords_present": [],
  "job_keywords_missing": [],
  "recomendacoes": {
    "termos_adicionar": [],
    "secoes_expandir": [],
    "reformulacoes": [],
    "formatacao": []
  },
  "analise_qualitativa": {
    "pontos_fortes": [],
    "lacunas_criticas": [],
    "notas_secao": {
      "experiencia": 0,
      "formacao": 0,
      "skills": 0,
      "geral": 0
    }
  },
  "adequacao_estrategica": {
    "melhores_vagas": [],
    "esforco_adequacao": "",
    "observation": "",
    "conclusion": "",
    "application_priority": ""
  }
}`;
}

const { postProcessATSResult } = require('../utils/atsPostProcessing');

// Inicializa o sistema de feedback
feedbackCollector.initializeFeedbackSystem().catch(err => {
  console.error('Erro ao inicializar sistema de feedback:', err);
});

/**
 * Analisa um currículo contra múltiplas vagas
 * @param {string} resumeText Texto do currículo
 * @param {string} jobTexts Texto consolidado das vagas (separado por \n---\n)
 * @param {Array<string>} jobLinks URLs originais das vagas
 * @returns {Object} Análise consolidada
 */
async function analyzeMultipleJobs(resumeText, jobTexts, jobLinks) {
  try {
    console.log(`[OpenAI] Analisando currículo contra ${jobLinks.length} vagas`);
    const prompt = buildMultiJobPrompt(resumeText, jobTexts, jobLinks);
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    };
    
    const requestData = {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Você é um assistente especializado em análise ATS que segue estritamente os padrões da Gupy.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 4000
    };
    
    // Tenta usar o Claude se disponível
    try {
      const claudeResponse = await claudeService.processPrompt(prompt);
      if (claudeResponse) {
        // Validação e parsing do JSON retornado
        const parsedResult = parseAndValidateJSON(claudeResponse);
        if (parsedResult.valid) {
          return parsedResult.data;
        } else {
          console.warn('Erro no parsing da resposta do Claude:', parsedResult.error);
          // Continua para tentar com OpenAI
        }
      }
    } catch (claudeError) {
      console.error('Erro ao processar com Claude, tentando OpenAI:', claudeError);
    }
    
    console.log('[OpenAI] Enviando prompt para análise de múltiplas vagas');
    const response = await axios.post(OPENAI_URL, requestData, { headers });
    const responseText = response.data.choices[0].message.content;
    
    // Usa o utilitário para validar e fazer parse do JSON
    const parsedResult = parseAndValidateJSON(responseText);
    
    if (parsedResult.valid) {
      return parsedResult.data;
    } else {
      // Tentar corrigir JSON mal formatado antes de desistir
      console.warn('Erro no parsing do JSON, tentando corrigir:', parsedResult.error);
      
      // Simplificação do JSON (remove linhas problemáticas)
      const simplifiedResponse = responseText
        .replace(/\n\s*\/\/[^\n]*/g, '') // Remove comentários
        .replace(/[\t ]+/g, ' ') // Normaliza espaços
        .replace(/,\s*[\]\}]/g, '$&'); // Remove vírgulas extras antes de ] ou }
      
      const reattempt = parseAndValidateJSON(simplifiedResponse);
      if (reattempt.valid) {
        return reattempt.data;
      }
      
      // Se ainda falhar, retorna uma resposta de fallback
      throw new Error('Não foi possível processar a resposta do modelo para múltiplas vagas');
    }
  } catch (error) {
    console.error('Erro ao analisar múltiplas vagas:', error);
    
    // Retorna um objeto de erro estruturado que o sistema pode entender
    return {
      perfil_vagas: jobLinks.map((link, index) => ({
        vaga_id: index + 1,
        cargo: "Não foi possível determinar",
        area: "Não identificada",
        nivel: "Não identificado",
        modelo_trabalho: "Não identificado",
        tipo_contrato: "Não identificado",
        empresa: "",
        localizacao: "",
        faixa_salarial: "",
        compatibilidade_percentual: 0
      })),
      hard_skills: {
        tecnicos: ["Erro ao processar análise"],
        formacao: [],
        idiomas: [],
        experiencia: []
      },
      soft_skills: {
        comportamentais: [],
        gestao: []
      },
      responsabilidades: ["Erro ao extrair responsabilidades"],
      job_keywords_present: [],
      job_keywords_missing: [],
      recomendacoes: {
        termos_adicionar: ["Tente novamente com uma descrição mais clara"],
        secoes_expandir: [],
        reformulacoes: [],
        formatacao: []
      },
      analise_qualitativa: {
        pontos_fortes: [],
        lacunas_criticas: ["Análise não concluída devido a um erro técnico"],
        notas_secao: {
          experiencia: 0,
          formacao: 0,
          skills: 0,
          geral: 0
        }
      },
      adequacao_estrategica: {
        melhores_vagas: [],
        esforco_adequacao: "Não determinado",
        observation: "Erro durante o processamento da análise",
        conclusion: "Ocorreu um erro ao processar a resposta.",
        application_priority: ""
      }
    };
  }
}

/**
 * Constrói o prompt para análise de múltiplas vagas
 */
function buildMultiJobPrompt(resumeText, jobTexts, jobLinks) {
  // Implementação atual do prompt para múltiplas vagas
  return `Responda sempre em português do Brasil.
  
Você é um sistema ATS especialista premium em análise completa de currículos e múltiplas vagas, implementando exatamente os critérios do sistema Gupy utilizado pelas principais empresas brasileiras.

# INSTRUÇÕES PARA ANÁLISE COMBINADA DE MÚLTIPLAS VAGAS (ATÉ 7)

Você deverá analisar o currículo fornecido contra múltiplas vagas simultaneamente, identificando:
1. Compatibilidade do candidato com cada vaga
2. Hard skills e soft skills presentes no currículo e relevantes para as vagas
3. Adequação de experiências às responsabilidades exigidas
4. Recomendações específicas para otimizar o currículo para todas as vagas

# VAGAS A ANALISAR

${jobTexts}

# CURRÍCULO DO CANDIDATO

${resumeText}

# FORMATO DE RESPOSTA

Responda obrigatoriamente em formato JSON estruturado conforme o exemplo abaixo:

{
  "perfil_vagas": [
    {
      "vaga_id": 1,
      "cargo": "Título exato da vaga",
      "area": "Área identificada",
      "nivel": "Nível hierárquico identificado",
      "modelo_trabalho": "Remoto/Híbrido/Presencial",
      "tipo_contrato": "CLT/PJ/Estágio",
      "empresa": "Nome da empresa (se disponível)",
      "localizacao": "Local da vaga (se disponível)",
      "faixa_salarial": "Faixa salarial (se disponível)",
      "compatibilidade_percentual": 75
    }
  ],
  "hard_skills": {
    "tecnicos": ["Python", "Excel", "etc"],
    "formacao": ["Graduação em...", "etc"],
    "idiomas": ["Inglês avançado", "etc"],
    "experiencia": ["5 anos em...", "etc"]
  },
  "soft_skills": {
    "comportamentais": ["Comunicação", "etc"],
    "gestao": ["Liderança", "etc"]
  },
  "responsabilidades": ["Desenvolver...", "etc"],
  "job_keywords_present": ["Palavras-chave presentes no currículo"],
  "job_keywords_missing": ["Palavras-chave ausentes no currículo"],
  "recomendacoes": {
    "termos_adicionar": ["Termos a adicionar"],
    "secoes_expandir": ["Seções a expandir"],
    "reformulacoes": ["Sugestões de reformulação"],
    "formatacao": ["Dicas de formatação"]
  },
  "analise_qualitativa": {
    "pontos_fortes": ["Pontos fortes identificados"],
    "lacunas_criticas": ["Lacunas críticas identificadas"],
    "notas_secao": {
      "experiencia": 8,
      "formacao": 7,
      "skills": 6,
      "geral": 7
    }
  },
  "adequacao_estrategica": {
    "melhores_vagas": [1, 3],
    "esforco_adequacao": "Moderado",
    "observation": "Observação geral sobre a análise",
    "conclusion": "Conclusão sobre adequação geral",
    "application_priority": "Sugestão de priorização de candidatura"
  }
}`;
}

/**
 * Analisa um currículo contra uma vaga usando o sistema ATS
 * @param {string} resumeText Texto do currículo
 * @param {string} jobsText Texto da vaga
 * @param {number} jobCount Número de vagas (default: 1)
 * @param {Array<string>} jobLinks URLs das vagas (default: [])
 * @returns {Object} Análise ATS
 */
async function analyzeATS(resumeText, jobsText, jobCount = 1, jobLinks = []) {
  try {
    // Seleciona o prompt adequado
    let atsResult;
    if (jobCount > 1) {
      atsResult = await analyzeMultipleJobs(resumeText, jobsText, jobLinks);
    } else {
      atsResult = await extractATSData(jobsText, resumeText);
    }

    // Validação estrutural do JSON
    const validationResult = validateATSResponseStructure(atsResult);
    if (!validationResult.valid) {
      console.warn('Resposta com estrutura inválida:', validationResult.errors);
      
      // Sinalizar alucinação em vez de usar fallback
      throw new Error('HALLUCINATION_DETECTED: Estrutura de resposta inválida');
    }

    // Verificação de plausibilidade
    const plausibilityCheck = checkPlausibility(atsResult);
    if (!plausibilityCheck.plausible) {
      console.warn('Resposta implausível detectada:', plausibilityCheck.issues);
      
      // Se for implausível, sinalizar alucinação em vez de sanitizar
      throw new Error(`HALLUCINATION_DETECTED: Resposta implausível detectada: ${plausibilityCheck.issues.join(', ')}`);
    }
    
    // Aplicar pós-processamento final
    const processedResult = postProcessATSResult(atsResult, resumeText);
    
    // Adicionar metadados de qualidade
    processedResult._meta = {
      validation: validationResult,
      plausibility: plausibilityCheck,
      responseId: `ats_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };
    
    return processedResult;
  } catch (error) {
    console.error('Erro ao analisar ATS:', error);
    
    // Verificar se é um erro de alucinação
    if (error.message && error.message.includes('HALLUCINATION_DETECTED')) {
      // Para alucinações, propagar o erro com flag especial
      throw {
        isHallucination: true,
        error: error.message.replace('HALLUCINATION_DETECTED: ', ''),
        message: error.message
      };
    }
    
    // Para outros erros, propagar normalmente
    throw error;
  }
}

/**
 * Extrai dados ATS de um currículo e uma vaga
 * @param {string} jobsText Texto da vaga
 * @param {string} resumeText Texto do currículo
 * @returns {Object} Dados da análise ATS
 */
async function extractATSData(jobsText, resumeText) {
  try {
    const prompt = buildPrompt(jobsText, resumeText);
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    };
    
    const requestData = {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Você é um assistente de análise de currículos ATS especializado.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 4000
    };

    // Tenta usar o Claude se disponível
    try {
      const claudeResponse = await claudeService.processPrompt(prompt);
      if (claudeResponse) {
        // Validação e parsing do JSON retornado
        const parsedResult = parseAndValidateJSON(claudeResponse);
        if (parsedResult.valid) {
          return parsedResult.data;
        } else {
          console.warn('Erro no parsing da resposta do Claude:', parsedResult.error);
          // Continua para tentar com OpenAI
        }
      }
    } catch (claudeError) {
      console.error('Erro ao processar com Claude, tentando OpenAI:', claudeError);
    }
    
    const response = await axios.post(OPENAI_URL, requestData, { headers });
    const responseText = response.data.choices[0].message.content;
    
    // Usa o utilitário para validar e fazer parse do JSON
    const parsedResult = parseAndValidateJSON(responseText);
    
    if (parsedResult.valid) {
      return parsedResult.data;
    } else {
      // Tentar corrigir JSON mal formatado antes de desistir
      console.warn('Erro no parsing do JSON, tentando corrigir:', parsedResult.error);
      
      // Simplificação do JSON (remove linhas problemáticas)
      const simplifiedResponse = responseText
        .replace(/\n\s*\/\/[^\n]*/g, '') // Remove comentários
        .replace(/[\t ]+/g, ' ') // Normaliza espaços
        .replace(/,\s*[\]\}]/g, '$&'); // Remove vírgulas extras antes de ] ou }
      
      const reattempt = parseAndValidateJSON(simplifiedResponse);
      if (reattempt.valid) {
        return reattempt.data;
      }
      
      // Se ainda falhar, retorna uma resposta de fallback
      throw new Error('Não foi possível processar a resposta do modelo');
    }
  } catch (error) {
    console.error('Erro ao extrair dados ATS:', error);
    throw error;
  }
}

/**
 * Registra feedback sobre uma resposta do modelo
 * @param {Object} feedbackData - Dados do feedback
 * @returns {Promise<boolean>} - Sucesso do registro
 */
async function recordModelFeedback(feedbackData) {
  try {
    return await feedbackCollector.recordFeedback(feedbackData);
  } catch (error) {
    console.error('Erro ao registrar feedback:', error);
    return false;
  }
}

/**
 * Obtém estatísticas de feedback
 * @returns {Promise<Object>} - Estatísticas de feedback
 */
async function getFeedbackStats() {
  try {
    return await feedbackCollector.getFeedbackStatistics();
  } catch (error) {
    console.error('Erro ao obter estatísticas de feedback:', error);
    return { total: 0, hallucinations: 0, incorrect_content: 0, other_issues: 0 };
  }
}

module.exports = {
  analyzeMultipleJobs,
  buildMultiJobPrompt,
  analyzeATS,
  extractATSData,
  recordModelFeedback,
  getFeedbackStats
};
