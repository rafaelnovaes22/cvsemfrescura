// Pós-processamento avançado para garantir equivalências de ATS compatíveis com Gupy
// Sistema completo de verificação contextual e semântica das palavras-chave
// Implementação unificada e robusta para garantir detecção precisa de palavras-chave

const { normalize } = require('../services/atsKeywordVerifier');

/**
 * Decompõe frases compostas em termos menores e relevantes.
 * DESMEMBRA AGRESSIVAMENTE todos os termos compostos em partes individuais.
 * Exemplo: "Perfil analítico e quantitativo" => ["Perfil", "analítico", "quantitativo", etc.]
 */
function decomposePhrase(phrase) {
  if (!phrase) return [];
  
  // Armazena todos os termos decompostos
  let result = [];
  
  // Adiciona a frase original apenas para referência
  result.push(phrase.trim());
  
  // Extrai termos entre parênteses
  let parenthesesContent = '';
  const parenthesesMatch = phrase.match(/\(([^)]+)\)/);
  if (parenthesesMatch) {
    parenthesesContent = parenthesesMatch[1].trim();
    // Adiciona o conteúdo entre parênteses
    result.push(parenthesesContent);
    
    // Adiciona cada item dentro dos parênteses (separados por vírgula ou espaço)
    const parenthesesItems = parenthesesContent.split(/\s*,\s*|\s+/).filter(Boolean);
    result.push(...parenthesesItems);
    
    // Adiciona a frase sem os parênteses
    const phraseWithoutParentheses = phrase.replace(/\s*\([^)]+\)\s*/, ' ').trim();
    result.push(phraseWithoutParentheses);
  }
  
  // ETAPA 1: Divide por conjunções, vírgulas, barras
  let normalized = phrase.replace(/\s+e\s+/gi, ',')
                        .replace(/\s+ou\s+/gi, ',')
                        .replace(/\//g, ',')
                        .replace(/\s*,\s*/g, ',')
                        .replace(/\s{2,}/g, ' ');
  
  // Divide em partes principais
  let parts = normalized.split(',').map(p => p.trim()).filter(Boolean);
  result.push(...parts);
  
  // ETAPA 2: Divide por TODAS as preposições e conectores
  const allParts = [];
  const prepositions = ['para', 'com', 'de', 'do', 'da', 'na', 'no', 'em', 'a', 'o', 'as', 'os', 'ao', 'aos', 'pelo', 'pela'];
  
  for (let part of parts) {
    // Primeiro, adiciona a parte completa
    allParts.push(part);
    
    // Depois, divide por cada preposição e adiciona os segmentos
    let segments = [part];
    
    for (const prep of prepositions) {
      const regex = new RegExp(`\\s+${prep}\\s+`, 'gi');
      const newSegments = [];
      
      for (const segment of segments) {
        if (regex.test(segment)) {
          // Divide e adiciona cada parte separada
          const splitParts = segment.split(regex).map(s => s.trim()).filter(Boolean);
          newSegments.push(...splitParts);
        } else {
          newSegments.push(segment);
        }
      }
      
      segments = newSegments;
    }
    
    // Adiciona todos os segmentos encontrados
    allParts.push(...segments);
  }
  
  result.push(...allParts);
  
  // ETAPA 3: Divide TODAS as palavras individuais
  const allWords = [];
  for (const part of allParts) {
    if (/\s/.test(part)) {
      const words = part.split(/\s+/).map(w => w.trim()).filter(Boolean);
      allWords.push(...words);
    } else {
      allWords.push(part);
    }
  }
  
  result.push(...allWords);
  
  // ETAPA 4: Adiciona termos técnicos específicos
  const technicalTerms = [
    'aws', 'azure', 'gcp', 'emr', 'athena', 'sagemaker', 'lambda', 's3', 'ec2', 'rds', 'dynamodb',
    'power bi', 'tableau', 'quicksight', 'looker', 'data studio', 'metabase', 'powerbi',
    'python', 'r', 'sql', 'nosql', 'spark', 'hadoop', 'java', 'javascript', 'typescript',
    'scrum', 'kanban', 'agile', 'devops', 'mlops', 'dataops', 'gitops',
    'product owner', 'scrum master', 'data scientist', 'data analyst', 'data engineer',
    'cloud', 'docker', 'kubernetes', 'k8s', 'container', 'microservices'
  ];
  
  for (const term of technicalTerms) {
    if (phrase.toLowerCase().includes(term)) {
      result.push(term);
      
      // Para termos compostos técnicos, adiciona também as partes individuais
      if (term.includes(' ')) {
        const termParts = term.split(/\s+/);
        result.push(...termParts);
      }
    }
  }
  
  // Remove duplicatas, espaços extras e termos muito curtos
  return [...new Set(result)]
    .map(term => term.replace(/\s+/g, ' ').trim())
    .filter(term => term.length > 2);
}



/**
 * Normaliza string para comparação com pré-processamento avançado
 */
function normalizeText(str) {
  if (!str) return '';
  
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verifica se um termo aparece em um contexto específico no currículo
 * Para correspondências que precisam considerar a proximidade semântica
 */
function termInContext(term, resumeText, context) {
  const normalizedResume = normalizeText(resumeText);
  const normalizedTerm = normalizeText(term);
  const normalizedContext = normalizeText(context);
  
  // Verifica se o termo e o contexto aparecem próximos (dentro de uma janela de 50 caracteres)
  const termIndex = normalizedResume.indexOf(normalizedTerm);
  if (termIndex === -1) return false;
  
  const windowStart = Math.max(0, termIndex - 50);
  const windowEnd = Math.min(normalizedResume.length, termIndex + normalizedTerm.length + 50);
  const window = normalizedResume.substring(windowStart, windowEnd);
  
  return window.includes(normalizedContext);
}

/**
 * Determina se um termo é uma versão específica de outro termo mais genérico
 * @param {string} specific - O termo potencialmente mais específico
 * @param {string} generic - O termo potencialmente mais genérico
 * @returns {boolean} - Verdadeiro se specific é uma versão específica de generic
 */
function isSpecificVersionOf(specific, generic) {
  const specificNorm = normalizeText(specific);
  const genericNorm = normalizeText(generic);
  
  // Se specific não contém generic, não é uma versão específica
  if (!specificNorm.includes(genericNorm)) {
    return false;
  }
  
  // Se são iguais, não é uma versão específica
  if (specificNorm === genericNorm) {
    return false;
  }
  
  // Padrões comuns: <qualificador> <termo genérico>
  // Ex: "data product owner" é uma versão específica de "product owner"
  if (specificNorm.endsWith(genericNorm) || specificNorm.startsWith(genericNorm)) {
    return true;
  }
  
  // Padrões com termos intermedios: <termo genérico parte 1> <qualificador> <termo genérico parte 2>
  // Ex: "gerente de projetos digitais" é uma versão específica de "gerente de projetos"
  const specificWords = specificNorm.split(' ');
  const genericWords = genericNorm.split(' ');
  
  if (genericWords.length < 2 || specificWords.length <= genericWords.length) {
    return false;
  }
  
  // Verifica se a sequência de palavras genéricas está preservada com inserções
  let genericIndex = 0;
  for (let i = 0; i < specificWords.length && genericIndex < genericWords.length; i++) {
    if (specificWords[i] === genericWords[genericIndex]) {
      genericIndex++;
    }
  }
  
  return genericIndex === genericWords.length;
}

/**
 * Verifica se um termo corresponde a um padrão de termo específico
 * @param {string} term - Termo a verificar
 * @returns {boolean} - Verdadeiro se o termo corresponde a um padrão de termo específico
 */
function matchesSpecificPattern(term) {
  const normalized = normalizeText(term);
  
  // Padrões comuns de termos específicos
  const patterns = [
    // Cargos qualificados
    /^[a-z]+ product owner$/,     // data product owner, tech product owner
    /^[a-z]+ scrum master$/,      // agile scrum master, tech scrum master
    /^[a-z]+ project manager$/,   // digital project manager, tech project manager
    
    // Tecnologias com plataformas específicas
    /^cloud [a-z]+$/,             // cloud aws, cloud azure
    /^banco [a-z]+$/,             // banco oracle, banco postgres
    
    // Produtos ou serviços qualificados
    /^produtos de [a-z]+$/,       // produtos de ia, produtos financeiros
    /^servicos de [a-z]+$/,       // servicos de ia
    
    // Certificados ou formação específicos
    /pos[ -]?graduacao/,          // pos-graduacao, pos graduacao
    
    // Ferramentas com nome comercial
    /^[a-z]+ bi$/,                // power bi, tableau bi
    
    // Tipos específicos de trabalho
    /^testes de [a-z]+$/,         // testes de aceitacao, testes de integracao
    /^analise de [a-z]+$/,        // analise de dados, analise de requisitos
    /^gestao de [a-z]+$/          // gestao de produtos, gestao de projetos
  ];
  
  return patterns.some(pattern => pattern.test(normalized));
}

/**
 * Mapeia termos equivalentes para permitir correspondência semântica avançada
 */
function getEquivalentTerms() {
  return {
    // Cargos
    'product owner': ['po', 'pspo', 'pspo i', 'dono do produto', 'product manager', 'owner de produto'],
    'data product owner': ['product owner de dados', 'po de dados', 'dono do produto de dados'],
    'scrum master': ['scrum master certificado', 'scrum master professional', 'scrum', 'master scrum'],
    'project manager': ['gerente de projetos', 'pm', 'project management'],
    'analista de dados': ['data analyst', 'analista dados', 'analista analytics'],
    'cientista de dados': ['data scientist', 'cientista dados', 'cientista analytics'],
    'engenheiro de dados': ['data engineer', 'engenheiro dados'],
    'engenheiro de software': ['software engineer', 'engenheiro sistemas', 'engenheiro desenvolvimento'],
    'arquiteto de dados': ['data architect', 'arquiteto dados'],
    'product manager': ['gerente de produto', 'pm', 'gestor de produto'],

    // Certificações
    'certificacao em product owner': ['pspo', 'pspo i', 'professional scrum product owner', 'certificado product owner'],
    'certificacao scrum master': ['psm', 'psm i', 'professional scrum master', 'scrum master certificado'],
    'certificacao project management': ['pmp', 'project management professional', 'certificado pmp'],
    'certificacao agile': ['safe', 'certificado agile', 'agile certified'],

    // Formação
    'ensino superior completo': ['tecnologo', 'bacharelado', 'licenciatura', 'graduacao', 'graduação'],
    'pos-graduacao': ['especializacao', 'mba', 'lato sensu', 'pós-graduação', 'pos graduacao'],
    'mestrado': ['master', 'msc'],
    'doutorado': ['phd', 'doctor', 'dr.'],

    // Idiomas
    'ingles intermediario': ['ingles', 'english', 'ingles avancado', 'ingles fluente'],
    'ingles avancado': ['ingles fluente', 'english advanced'],
    'ingles fluente': ['ingles avancado', 'english fluent'],
    'espanhol': ['spanish', 'espanhol fluente', 'espanhol intermediario'],

    // Hard skills / Ferramentas
    'microsoft power bi': ['power bi', 'ms power bi'],
    'tableau': ['tableau software', 'tableau desktop'],
    'amazon quicksight': ['quicksight', 'aws quicksight'],
    'cloud aws': ['aws', 'amazon web services', 'cloud amazon'],
    'cloud azure': ['azure', 'microsoft azure', 'cloud microsoft'],
    'cloud gcp': ['gcp', 'google cloud', 'google cloud platform'],
    'microsoft azure devops': ['azure devops', 'devops', 'azure'],
    'sql': ['mysql', 'postgresql', 'oracle', 'banco de dados relacional'],
    'python': ['programacao python', 'py', 'python3'],
    'r': ['linguagem r', 'programacao r'],
    'excel': ['microsoft excel', 'planilhas excel'],

    // Metodologias
    'metodologia agil': ['scrum', 'kanban', 'agile', 'framework agil', 'metodologias ageis', 'lean', 'xp', 'agilidade'],
    'metodologias ageis': ['scrum', 'kanban', 'agile', 'framework agil', 'metodologia agil', 'lean', 'xp', 'agilidade'],
    'scrum': ['scrum master', 'scrum team'],
    'kanban': ['kanban board', 'gestao visual'],

    // Backlog e Roadmap
    'backlog do produto': ['product backlog', 'backlog', 'criacao de backlog', 'gestao de backlog'],
    'criacao do backlog': ['product backlog', 'backlog', 'criacao de backlog', 'gestao de backlog'],
    'roadmap do produto': ['roadmap', 'product roadmap', 'planejamento de produto'],
    'criar do roadmap': ['roadmap', 'product roadmap', 'planejamento de produto'],

    // Soft skills
    'comunicador eficiente': ['comunicacao', 'comunicacao efetiva', 'storytelling', 'boa comunicacao'],
    'foco no cliente': ['centralidade no cliente', 'customer centric', 'user experience', 'experiencia do cliente'],
    'orientacao para resultados': ['resultados', 'kpi', 'okr', 'metricas', 'entrega de resultados'],
    'lideranca': ['lider', 'gestao de pessoas', 'coordenacao de equipe', 'team lead'],
    'negociacao': ['habilidades de negociacao', 'negociador', 'negociar'],
    'resolucao de problemas': ['solucao de problemas', 'resolver problemas', 'troubleshooting'],
    'trabalho em equipe': ['espirito de equipe', 'colaboracao', 'teamwork'],
    'adaptabilidade': ['flexibilidade', 'adaptacao', 'resiliencia'],

    // Outros exemplos relevantes
    'analise de dados': ['analises de dados', 'data analysis', 'analise dados'],
    'gestao de stakeholders': ['stakeholder management', 'gestao de partes interessadas'],
    'apresentacoes executivas': ['apresentacao executiva', 'executive presentation'],
    'melhoria continua': ['kaizen', 'continuous improvement'],
    'eficiencia operacional': ['operational efficiency', 'eficiencia nos processos'],
    'experiencia do cliente': ['customer experience', 'user experience'],
    'cientistas de dados': ['data scientists', 'cientista de dados']
  };
}

/**
 * Preenche automaticamente as listas job_keywords_present e job_keywords_missing
 * baseado em correspondências inteligentes com o texto do currículo
 */
function processKeywordMatches(atsResult, resumeText) {
  const equivalentTerms = getEquivalentTerms();

  // Nova etapa: garantir equivalências explícitas
  if (atsResult.job_keywords && Array.isArray(atsResult.job_keywords)) {
    let foundEquivalents = [];
    let normalizedResume = normalizeText(resumeText);
    for (const mainTerm of atsResult.job_keywords) {
      const normalizedMain = normalizeText(mainTerm);
      // Se já está presente, segue
      if (normalizedResume.includes(normalizedMain)) continue;
      // Se há equivalentes definidos
      if (equivalentTerms[normalizedMain]) {
        for (const eq of equivalentTerms[normalizedMain]) {
          const normalizedEq = normalizeText(eq);
          if (normalizedResume.includes(normalizedEq)) {
            foundEquivalents.push(mainTerm);
            break;
          }
        }
      }
    }
    // Adiciona termos principais encontrados via equivalência
    atsResult.found_keywords = Array.from(new Set([...(atsResult.found_keywords || []), ...foundEquivalents]));
    // Remove das ausentes se necessário
    atsResult.missing_keywords = (atsResult.missing_keywords || []).filter(kw => !atsResult.found_keywords.includes(kw));
  }
  const foundKeywords = new Set(atsResult.found_keywords.map(normalize));
  const normalizedResume = normalize(resumeText);
  
  // Array para armazenar novos termos encontrados
  const newFoundKeywords = [];
  
  // Para cada palavra-chave que está faltando, verificar equivalências
  for (const missingKeyword of atsResult.missing_keywords) {
    const normalizedKeyword = normalize(missingKeyword);
    
    // 1. Verifica correspondência direta no currículo
    if (normalizedResume.includes(normalizedKeyword)) {
      newFoundKeywords.push(missingKeyword);
      continue;
    }
    
    // 2. Verifica se há equivalências definidas para este termo
    let found = false;
    for (const [mainTerm, equivalents] of Object.entries(equivalentTerms)) {
      // Se o termo principal está na palavra-chave
      if (normalizedKeyword.includes(normalize(mainTerm))) {
        // Verifica se algum equivalente está no currículo
        for (const equivalent of equivalents) {
          if (normalizedResume.includes(normalize(equivalent))) {
            newFoundKeywords.push(missingKeyword);
            found = true;
            break;
          }
        }
      }
      if (found) break;
    }
    
    // 3. Casos especiais para keywords específicas
    if (!found) {
      // Caso especial: Certificações em Product Owner
      if (normalizedKeyword.includes('certificacao product owner') && normalizedResume.includes('pspo')) {
        newFoundKeywords.push(missingKeyword);
      }
      // Caso especial: ISO 9001/14001 podem ser citadas genericamente
      else if ((normalizedKeyword.includes('iso 9001') || normalizedKeyword.includes('iso 14001')) && 
               normalizedResume.includes('iso')) {
        newFoundKeywords.push(missingKeyword);
      }
      // Caso especial: Termos comportamentais (soft skills) que podem estar implícitos
      else if (isImplicitSoftSkill(normalizedKeyword, normalizedResume)) {
        newFoundKeywords.push(missingKeyword);
      }
    }
  }
  
  // Atualiza as listas
  atsResult.found_keywords = [...atsResult.found_keywords, ...newFoundKeywords];
  atsResult.missing_keywords = atsResult.missing_keywords.filter(
    k => !newFoundKeywords.includes(k)
  );
  
  // Adiciona job_keywords_present e job_keywords_missing
  atsResult.job_keywords_present = atsResult.found_keywords;
  atsResult.job_keywords_missing = atsResult.missing_keywords;
  
  return atsResult;
}

/**
 * Verifica se uma soft skill pode estar implícita no currículo
 * baseado em análise contextual e palavras-chave relacionadas
 */
function isImplicitSoftSkill(skillKeyword, resumeText) {
  const softSkillIndicators = {
    'comunicador eficiente': ['comunicacao', 'apresentacao', 'storytelling', 'negociacao'],
    'foco no cliente': ['cliente', 'usuario', 'ux', 'experiencia do usuario', 'design thinking'],
    'orientacao para resultados': ['resultado', 'meta', 'objetivo', 'kpi', 'okr', 'performance'],
    'busca pela qualidade': ['qualidade', 'melhoria continua', 'excelencia', 'otimizacao']
  };
  
  for (const [skill, indicators] of Object.entries(softSkillIndicators)) {
    if (normalize(skillKeyword).includes(normalize(skill))) {
      return indicators.some(indicator => resumeText.includes(indicator));
    }
  }
  
  return false;
}

/**
 * Pós-processamento completo que implementa todos os ajustes necessários
 * para corresponder aos padrões da Gupy
 * @param {Object} atsResult - O resultado da análise do ATS
 * @param {string} resumeText - O texto completo do currículo
 * @returns {Object} - O resultado da análise ATS processado
 */
function postProcessATSResult(atsResult, resumeText) {
  // Inicia o processamento detalhado de verificações avançadas ATS
  // Verifica se estamos trabalhando com o formato antigo ou novo
  const isOldFormat = atsResult.job_keywords && Array.isArray(atsResult.job_keywords);
  const isNewFormat = atsResult.hard_skills && typeof atsResult.hard_skills === 'object';
  
  if (isOldFormat) {
    // Processamento para formato antigo
    const decomposedKeywords = [];
    for (const kw of atsResult.job_keywords) {
      decomposedKeywords.push(kw);
      decomposedKeywords.push(...decomposePhrase(kw));
    }
    atsResult.job_keywords = decomposedKeywords;
    
    // Processamento padrão
    atsResult = processKeywordMatches(atsResult, resumeText);
    
    // Regras de exceção para caso específicos (formato antigo)
    if (atsResult.found_keywords.some(k => normalize(k).includes('ingles avancado'))) {
      for (const keyword of atsResult.missing_keywords) {
        if (normalize(keyword).includes('ingles intermediario')) {
          atsResult.found_keywords.push(keyword);
          atsResult.missing_keywords = atsResult.missing_keywords.filter(k => k !== keyword);
        }
      }
    }
    
    if (resumeText.toLowerCase().includes('superior completo') || resumeText.toLowerCase().includes('bacharelado') || resumeText.toLowerCase().includes('bacharel')) {
      for (const keyword of atsResult.missing_keywords) {
        if (normalize(keyword).includes('graduacao') || normalize(keyword).includes('ensino superior')) {
          atsResult.found_keywords.push(keyword);
          atsResult.missing_keywords = atsResult.missing_keywords.filter(k => k !== keyword);
        }
      }
    }
  } 
  else if (isNewFormat) {
    // Processamento para o novo formato
    // Inicializa os arrays necessários se não existirem
    if (!atsResult.resume_keywords_present) atsResult.resume_keywords_present = [];
    if (!atsResult.resume_keywords_missing) atsResult.resume_keywords_missing = [];
    
    // Coletamos todos os termos técnicos das categorias abaixo
    const allKeywords = [];
    
    // Hard skills
    if (atsResult.hard_skills) {
      if (atsResult.hard_skills.tecnicos && Array.isArray(atsResult.hard_skills.tecnicos)) {
        allKeywords.push(...atsResult.hard_skills.tecnicos);
      }
      if (atsResult.hard_skills.formacao && Array.isArray(atsResult.hard_skills.formacao)) {
        allKeywords.push(...atsResult.hard_skills.formacao);
      }
      if (atsResult.hard_skills.idiomas && Array.isArray(atsResult.hard_skills.idiomas)) {
        allKeywords.push(...atsResult.hard_skills.idiomas);
      }
      if (atsResult.hard_skills.experiencia && Array.isArray(atsResult.hard_skills.experiencia)) {
        allKeywords.push(...atsResult.hard_skills.experiencia);
      }
    }
    
    // Soft skills
    if (atsResult.soft_skills) {
      if (atsResult.soft_skills.comportamental && Array.isArray(atsResult.soft_skills.comportamental)) {
        allKeywords.push(...atsResult.soft_skills.comportamental);
      }
      if (atsResult.soft_skills.gestao && Array.isArray(atsResult.soft_skills.gestao)) {
        allKeywords.push(...atsResult.soft_skills.gestao);
      }
    }
    
    // Responsabilidades
    if (atsResult.responsabilidades && Array.isArray(atsResult.responsabilidades)) {
      allKeywords.push(...atsResult.responsabilidades);
    }
    
    // Diferenciais
    if (atsResult.diferenciais && Array.isArray(atsResult.diferenciais)) {
      allKeywords.push(...atsResult.diferenciais);
    }
    
    // Filtros
    if (atsResult.filtros_eliminatorios && Array.isArray(atsResult.filtros_eliminatorios)) {
      allKeywords.push(...atsResult.filtros_eliminatorios);
    }
    if (atsResult.filtros_classificatorios && Array.isArray(atsResult.filtros_classificatorios)) {
      allKeywords.push(...atsResult.filtros_classificatorios);
    }
    
    // Remove duplicatas
    const uniqueKeywords = [...new Set(allKeywords)];
    
    // Para retrocompatibilidade, preenche o job_keywords também
    atsResult.job_keywords = uniqueKeywords;
    atsResult.found_keywords = [];
    atsResult.missing_keywords = [];
    
    // Processamos as correspondências
    for (const keyword of uniqueKeywords) {
      const allVariations = [keyword, ...decomposePhrase(keyword)];
      let found = false;
      
      for (const variation of allVariations) {
        if (isTermInText(variation, resumeText)) {
          found = true;
          break;
        }
      }
      
      if (found) {
        atsResult.resume_keywords_present.push(keyword);
        atsResult.found_keywords.push(keyword);
      } else {
        atsResult.resume_keywords_missing.push(keyword);
        atsResult.missing_keywords.push(keyword);
      }
    }
    
    // Aplicar regras de exceção para o novo formato
    // Exceção de idiomas
    const resumeHasAdvancedEnglish = resumeText.toLowerCase().includes('inglês avançado') || 
                                    resumeText.toLowerCase().includes('inglês fluente') ||
                                    resumeText.toLowerCase().includes('english advanced') || 
                                    resumeText.toLowerCase().includes('fluent english');
    
    if (resumeHasAdvancedEnglish) {
      const intermediateEnglishKeywords = atsResult.resume_keywords_missing.filter(k => 
        normalize(k).includes('ingles intermediario') || normalize(k).includes('intermediate english'));
      
      for (const keyword of intermediateEnglishKeywords) {
        atsResult.resume_keywords_present.push(keyword);
        atsResult.resume_keywords_missing = atsResult.resume_keywords_missing.filter(k => k !== keyword);
        atsResult.found_keywords.push(keyword);
        atsResult.missing_keywords = atsResult.missing_keywords.filter(k => k !== keyword);
      }
    }
    
    // Exceção de formação acadêmica
    const resumeHasHigherEducation = resumeText.toLowerCase().includes('superior completo') || 
                                    resumeText.toLowerCase().includes('bacharelado') || 
                                    resumeText.toLowerCase().includes('bacharel') ||
                                    resumeText.toLowerCase().includes('tecnólogo') ||
                                    resumeText.toLowerCase().includes('licenciatura');
    
    if (resumeHasHigherEducation) {
      const higherEducationKeywords = atsResult.resume_keywords_missing.filter(k => 
        normalize(k).includes('graduacao') || normalize(k).includes('ensino superior'));
      
      for (const keyword of higherEducationKeywords) {
        atsResult.resume_keywords_present.push(keyword);
        atsResult.resume_keywords_missing = atsResult.resume_keywords_missing.filter(k => k !== keyword);
        atsResult.found_keywords.push(keyword);
        atsResult.missing_keywords = atsResult.missing_keywords.filter(k => k !== keyword);
      }
    }
  }
  
  // Retrocompatibilidade
  if (!atsResult.job_keywords_present && atsResult.found_keywords) {
    atsResult.job_keywords_present = atsResult.found_keywords;
  }
  if (!atsResult.job_keywords_missing && atsResult.missing_keywords) {
    atsResult.job_keywords_missing = atsResult.missing_keywords;
  }
  
  // Para o novo formato, garantir backward compatibility
  if (isNewFormat && (!atsResult.job_keywords_present || !atsResult.job_keywords_present.length)) {
    atsResult.job_keywords_present = atsResult.resume_keywords_present;
  }
  if (isNewFormat && (!atsResult.job_keywords_missing || !atsResult.job_keywords_missing.length)) {
    atsResult.job_keywords_missing = atsResult.resume_keywords_missing;
  }
  
  // 4. Correção para falsos positivos - termos específicos
  // Esta função garante que termos específicos só são considerados presentes se aparecerem EXATAMENTE no currículo
  
  // Função para verificar se um termo exato está presente no texto
  function isExactTermInText(term, text) {
    // Normaliza ambos para comparação
    const normalizedTerm = normalize(term);
    const normalizedText = normalize(text);
    
    // Para termos com múltiplas palavras, verificamos se a expressão exata existe
    if (normalizedTerm.includes(' ')) {
      // Escape caracteres especiais de regex e crie um padrão que permite variações mínimas (espaços extras, etc.)
      const escapedTerm = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = escapedTerm.replace(/\s+/g, '\\s+');
      const regex = new RegExp(`\\b${pattern}\\b`, 'i');
      return regex.test(normalizedText);
    }
    
    // Para termos de palavra única, usamos limites de palavra
    const regex = new RegExp(`\\b${normalizedTerm}\\b`, 'i');
    return regex.test(normalizedText);
  }
  
  // Função para determinar se um termo é composto e exige verificação exata
  function isCompoundTerm(term) {
    const normalizedTerm = normalize(term);
    const words = normalizedTerm.split(/\s+/).filter(word => word.length > 2);
    
    // Termos com múltiplas palavras significativas (desconsiderando preposíções, etc.)
    if (words.length > 1) {
      return true;
    }
    
    // Termos que contêm palavras-chave específicas que geralmente exigem correspondência exata
    const specificKeywords = ['cloud', 'aws', 'azure', 'google', 'data', 'product', 'owner', 'scrum', 'master', 
                              'pos', 'graduacao', 'mestrado', 'doutorado', 'certificacao', 'diploma',
                              'cientista', 'analista', 'engenheiro', 'arquiteto', 'senior', 'pleno', 'junior'];
    
    return specificKeywords.some(keyword => normalizedTerm.includes(keyword));
  }
  
  // Aplicar verificação ultra rigorosa para TODOS os termos, não apenas os compostos
  // Garantindo que somente termos EXATAMENTE presentes sejam considerados
  const foundKeywordsToVerify = [...atsResult.found_keywords];
  
  for (const keyword of foundKeywordsToVerify) {
    // Para TODOS os termos, verificamos se estão EXATAMENTE presentes no texto
    if (!isExactTermInText(keyword, resumeText)) {
      // Se o termo não está exatamente presente, verificamos se alguma parte está presente
      // para determinar se é um falso positivo por correspondência parcial
      const parts = normalize(keyword).split(/\s+/).filter(word => word.length > 2);
      
      // Se o termo tem múltiplas palavras E pelo menos uma parte está presente, consideramos falso positivo
      if (parts.length > 1 && parts.some(part => isExactTermInText(part, resumeText))) {
        // Remover das palavras encontradas (falso positivo confirmado)
        const index = atsResult.found_keywords.indexOf(keyword);
        if (index !== -1) {
          atsResult.found_keywords.splice(index, 1);
          
          // Adicionar às palavras ausentes
          if (!atsResult.missing_keywords.includes(keyword)) {
            atsResult.missing_keywords.push(keyword);
          }
        }
      } 
      // Casos específicos que são freqüentemente falsos positivos
      else if (keyword.toLowerCase().includes('mestrado') || 
               keyword.toLowerCase().includes('pós-graduação') ||
               keyword.toLowerCase().includes('cloud aws') ||
               keyword.toLowerCase().includes('produtos de ia') ||
               keyword.toLowerCase().includes('sólidos conhecimentos') ||
               keyword.toLowerCase().includes('data product owner')) {
        
        // Verificação extra para termos críticos frequentemente mal detectados
        if (!isExactTermInText(keyword, resumeText)) {
          // Remover este termo falso positivo
          const index = atsResult.found_keywords.indexOf(keyword);
          if (index !== -1) {
            atsResult.found_keywords.splice(index, 1);
            
            // Adicionar às palavras ausentes
            if (!atsResult.missing_keywords.includes(keyword)) {
              atsResult.missing_keywords.push(keyword);
            }
          }
        }
      }
    }
  }
  
  // 4.1 Correção para falsos positivos de pós-graduação e mestrado
  const posGradTerms = ['pos-graduacao', 'pos graduacao', 'posgraduacao', 'especializacao', 'mba'];
  const hasMestrado = normalize(resumeText).includes('mestrado');
  const hasPostGrad = posGradTerms.some(term => normalize(resumeText).includes(term));
  
  // Remove mestrado se não houver menção explícita
  if (!hasMestrado) {
    atsResult.found_keywords = atsResult.found_keywords.filter(keyword => {
      const normalizedKeyword = normalize(keyword);
      return !normalizedKeyword.includes('mestrado');
    });
    
    // Adiciona mestrado às palavras ausentes se estava nas palavras-chave da vaga
    for (const keyword of atsResult.job_keywords) {
      if (normalize(keyword).includes('mestrado') && 
          !atsResult.missing_keywords.includes(keyword)) {
        atsResult.missing_keywords.push(keyword);
      }
    }
  }
  
  // Remove pós-graduação se não houver menção explícita
  if (!hasPostGrad) {
    // Remove pós-graduação das palavras encontradas
    atsResult.found_keywords = atsResult.found_keywords.filter(keyword => {
      const normalizedKeyword = normalize(keyword);
      return !normalizedKeyword.includes('pos-graduacao') && 
             !normalizedKeyword.includes('pos graduacao') &&
             !normalizedKeyword.includes('posgraduacao');
    });
    
    // Adiciona pós-graduação às palavras ausentes se estava nas palavras-chave da vaga
    for (const keyword of atsResult.job_keywords) {
      const normalizedKeyword = normalize(keyword);
      if ((normalizedKeyword.includes('pos-graduacao') || 
           normalizedKeyword.includes('pos graduacao') || 
           normalizedKeyword.includes('posgraduacao')) && 
          !atsResult.missing_keywords.includes(keyword)) {
        atsResult.missing_keywords.push(keyword);
      }
    }
  }
  
  // 5. Correção para tecnologias específicas (Cloud AWS, etc.) e cargos específicos
  // A Gupy e outros sistemas ATS tratam termos genéricos e específicos como diferentes
  const specificTermsMap = [
    // Tecnologias
    { generic: 'cloud', specific: ['cloud aws', 'aws cloud', 'amazon web services'] },
    { generic: 'banco de dados', specific: ['sql server', 'oracle', 'mysql', 'postgresql', 'mongodb'] },
    { generic: 'framework', specific: ['react', 'angular', 'vue', 'django', 'spring', 'laravel'] },
    { generic: 'linguagem', specific: ['java', 'python', 'javascript', 'typescript', 'c#', 'php'] },
    { generic: 'devops', specific: ['jenkins', 'gitlab ci', 'github actions', 'azure devops'] },
    
    // Cargos específicos vs genéricos
    { generic: 'product owner', specific: ['data product owner', 'technical product owner', 'digital product owner'] },
    { generic: 'gerente de projetos', specific: ['gerente de projetos digitais', 'gerente de projetos de ti'] },
    { generic: 'analista', specific: ['analista de dados', 'analista de sistemas', 'analista de negócios'] },
    { generic: 'data', specific: ['data product', 'data science', 'data engineer', 'data analyst'] }
  ];
  
  // Verifica cada termo específico nas palavras-chave da vaga
  for (const term of specificTermsMap) {
    for (const keyword of atsResult.job_keywords) {
      const normalizedKeyword = normalize(keyword);
      
      // Se a palavra-chave é um termo específico (ex: Cloud AWS, Data Product Owner)
      if (term.specific.some(specific => normalizedKeyword.includes(specific))) {
        // Verifica se apenas o termo genérico está no currículo, sem o específico
        const hasGeneric = normalize(resumeText).includes(term.generic);
        const hasSpecific = term.specific.some(specific => normalize(resumeText).includes(specific));
        
        // Se tem o genérico mas não o específico, remova dos encontrados e adicione aos ausentes
        if (hasGeneric && !hasSpecific && atsResult.found_keywords.includes(keyword)) {
          // Remove dos encontrados
          atsResult.found_keywords = atsResult.found_keywords.filter(k => k !== keyword);
          
          // Adiciona aos ausentes se ainda não estiver lá
          if (!atsResult.missing_keywords.includes(keyword)) {
            atsResult.missing_keywords.push(keyword);
          }
        }
      }
    }
  }
  
  // 6. Garantir que recomendações e conclusão existam
  if (!atsResult.recommendations || !Array.isArray(atsResult.recommendations) || atsResult.recommendations.length === 0) {
    atsResult.recommendations = [
      "Incluir palavras-chave relevantes da vaga no currículo",
      "Destacar experiências relacionadas às competências exigidas na vaga",
      "Personalizar o currículo para cada vaga específica"
    ];
  }
  
  if (!atsResult.conclusion || atsResult.conclusion.trim() === "") {
    const matchPercentage = Math.round((atsResult.found_keywords.length / atsResult.job_keywords.length) * 100);
    atsResult.conclusion = `O currículo apresenta ${matchPercentage}% de aderência às palavras-chave da vaga. ` + 
                          `Foram encontradas ${atsResult.found_keywords.length} de ${atsResult.job_keywords.length} palavras-chave.`;
  }
  
  // 7. Verificação final rigorosa para termos específicos vs. genéricos
  // Algoritmo inteligente que detecta automaticamente termos específicos vs. genéricos
  
  /**
   * Detecta se um termo é uma versão específica de outro termo mais genérico
   * @param {string} specificCandidate - Termo potencialmente específico
   * @param {string} genericCandidate - Termo potencialmente genérico
   * @returns {boolean} - Verdadeiro se specificCandidate é uma versão específica de genericCandidate
   */
  function isSpecificVersionOf(specificCandidate, genericCandidate) {
    const normSpecific = normalize(specificCandidate);
    const normGeneric = normalize(genericCandidate);
    
    // Se o genérico não está contido no específico, não é uma versão específica
    if (!normSpecific.includes(normGeneric)) {
      return false;
    }
    
    // Se são iguais, não é uma versão específica
    if (normSpecific === normGeneric) {
      return false;
    }
    
    // Verifica se o termo específico tem palavras adicionais que qualificam o genérico
    const specificWords = normSpecific.split(/\s+/);
    const genericWords = normGeneric.split(/\s+/);
    
    // Se o específico tem menos palavras que o genérico, não é uma versão específica
    if (specificWords.length <= genericWords.length) {
      return false;
    }
    
    // Verifica se as palavras do genérico aparecem na mesma ordem no específico
    let genericIndex = 0;
    let matchCount = 0;
    
    for (let i = 0; i < specificWords.length; i++) {
      if (genericIndex < genericWords.length && specificWords[i] === genericWords[genericIndex]) {
        genericIndex++;
        matchCount++;
      }
    }
    
    // Se todas as palavras do genérico foram encontradas na mesma ordem no específico
    if (matchCount === genericWords.length) {
      return true;
    }
    
    // Casos especiais: verificar padrões comuns de especialização
    // 1. Termo com qualificador no início (ex: "data product owner" vs "product owner")
    // 2. Termo com qualificador no final (ex: "cloud aws" vs "cloud")
    // 3. Termo com qualificador no meio (ex: "gerente de projetos digitais" vs "gerente de projetos")
    
    // Verifica se o genérico é um substring contíguo do específico
    if (normSpecific.includes(normGeneric) && 
        (normSpecific.startsWith(normGeneric + ' ') || 
         normSpecific.endsWith(' ' + normGeneric) || 
         normSpecific.includes(' ' + normGeneric + ' '))) {
      return true;
    }
    
    // Verifica produtos/serviços específicos (ex: "produtos de IA" vs "IA")
    const productPatterns = ['produtos de', 'serviços de', 'sistema de', 'plataforma de'];
    for (const pattern of productPatterns) {
      if (normSpecific.includes(pattern) && normSpecific.includes(normGeneric)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Encontra o termo genérico para um termo específico
   * @param {string} specificTerm - Termo específico
   * @param {string[]} allTerms - Lista de todos os termos para comparar
   * @returns {string|null} - Termo genérico encontrado ou null
   */
  function findGenericTermFor(specificTerm, allTerms) {
    // Ordena os termos do mais curto para o mais longo para priorizar termos genéricos mais simples
    const sortedTerms = [...allTerms].sort((a, b) => normalize(a).length - normalize(b).length);
    
    for (const candidate of sortedTerms) {
      // Não compare com ele mesmo
      if (normalize(candidate) === normalize(specificTerm)) {
        continue;
      }
      
      // Verifica se o specificTerm é uma versão específica do candidate
      if (isSpecificVersionOf(specificTerm, candidate)) {
        return candidate;
      }
    }
    
    return null;
  }
  
  // Analisa todas as palavras-chave encontradas para identificar termos específicos
  const allKeywords = [...atsResult.job_keywords]; // Todas as palavras-chave da vaga
  
  for (const keyword of atsResult.found_keywords) {
    // Encontra o termo genérico para este keyword, se existir
    const genericTerm = findGenericTermFor(keyword, allKeywords);
    
    if (genericTerm) {
      // Verifica se o termo específico realmente está no currículo
      const specificInResume = normalize(resumeText).includes(normalize(keyword));
      const genericInResume = normalize(resumeText).includes(normalize(genericTerm));
      
      // Se o termo específico não está no currículo, mas o genérico está, remova o específico
      if (!specificInResume && genericInResume) {
        // Remove dos encontrados
        atsResult.found_keywords = atsResult.found_keywords.filter(k => k !== keyword);
        
        // Adiciona aos ausentes
        if (!atsResult.missing_keywords.includes(keyword)) {
          atsResult.missing_keywords.push(keyword);
        }
      }
    }
  }
  
  // Casos especiais que precisam de verificação adicional
  const specialCases = [
    { term: 'pós-graduação', checkTerms: ['pos-graduacao', 'pos graduacao', 'posgraduacao', 'especializacao', 'mba', 'mestrado', 'doutorado'] },
    { term: 'cloud aws', checkTerms: ['aws', 'amazon web services', 'amazon aws'] }
  ];
  
  for (const { term, checkTerms } of specialCases) {
    // Verifica se alguma palavra-chave encontrada contém este termo especial
    const matchingKeywords = atsResult.found_keywords.filter(kw => 
      normalize(kw).includes(normalize(term)));
    
    if (matchingKeywords.length > 0) {
      // Verifica se algum dos termos de verificação está presente no currículo
      const termPresent = checkTerms.some(checkTerm => 
        normalize(resumeText).includes(normalize(checkTerm)));
      
      // Se nenhum dos termos de verificação estiver presente, remova as palavras-chave correspondentes
      if (!termPresent) {
        for (const keyword of matchingKeywords) {
          // Remove dos encontrados
          atsResult.found_keywords = atsResult.found_keywords.filter(k => k !== keyword);
          
          // Adiciona aos ausentes
          if (!atsResult.missing_keywords.includes(keyword)) {
            atsResult.missing_keywords.push(keyword);
          }
        }
      }
    }
  }
  
  // 8. Elimina duplicidades e atualiza listas finais
  atsResult.found_keywords = [...new Set(atsResult.found_keywords)];
  atsResult.missing_keywords = [...new Set(atsResult.missing_keywords)];
  atsResult.job_keywords_present = atsResult.found_keywords;
  atsResult.job_keywords_missing = atsResult.missing_keywords;

  return atsResult;
}

module.exports = { 
  postProcessATSResult,
  processKeywordMatches,
  isImplicitSoftSkill,
  normalizeText,
  decomposePhrase
};
