// Verificador de palavras-chave realmente presentes no currículo
// Aceita plural/singular, pequenas variações morfológicas e sinônimos profissionais relevantes
// Utiliza stemming/lemmatização básica e matching semântico moderado

const natural = require('natural');
const stemmer = natural.PorterStemmerPt; // para português

/**
 * Normaliza string para comparação (lowercase, remove acentos)
 */
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/gi, '');
}

function singularPluralForms(word) {
  // Retorna array com singular e plural para português simples
  if (word.endsWith('s')) {
    return [word, word.slice(0, -1)];
  } else {
    return [word, word + 's'];
  }
}

/**
 * Mapas de idiomas e níveis para reconhecimento inteligente
 */
const languageMap = {
  'inglês': ['inglês', 'ingles', 'english'],
  'espanhol': ['espanhol', 'spanish', 'español'],
  'francês': ['francês', 'frances', 'french', 'français'],
  'alemão': ['alemão', 'alemao', 'german', 'deutsch'],
  'italiano': ['italiano', 'italian'],
  'português': ['português', 'portugues', 'portuguese'],
  'mandarim': ['mandarim', 'chinês', 'chines', 'mandarin', 'chinese'],
  'japonês': ['japonês', 'japones', 'japanese'],
  'coreano': ['coreano', 'korean'],
  'russo': ['russo', 'russian']
};

const levelMap = {
  'básico': ['básico', 'basico', 'basic', 'beginner', 'iniciante', 'elementar'],
  'intermediário': ['intermediário', 'intermediario', 'intermediate', 'médio', 'medio'],
  'avançado': ['avançado', 'avancado', 'advanced', 'superior'],
  'fluente': ['fluente', 'fluent', 'nativo', 'native', 'proficiente', 'proficient']
};

/**
 * Verifica se um idioma específico está presente no currículo, considerando níveis
 */
function checkLanguageInResume(requestedLanguage, resumeText) {
  const normResume = normalize(resumeText);
  const requestedLang = normalize(requestedLanguage);

  // Primeiro, verificar se é uma palavra-chave de idioma
  let targetLanguage = null;
  let requestedLevel = null;

  // Identificar se a palavra-chave contém um idioma conhecido
  for (const [lang, variations] of Object.entries(languageMap)) {
    for (const variation of variations) {
      if (requestedLang.includes(normalize(variation))) {
        targetLanguage = lang;
        break;
      }
    }
    if (targetLanguage) break;
  }

  // Se não é um idioma, usar verificação padrão
  if (!targetLanguage) {
    return false;
  }

  // Identificar se há um nível específico na requisição
  for (const [level, variations] of Object.entries(levelMap)) {
    for (const variation of variations) {
      if (requestedLang.includes(normalize(variation))) {
        requestedLevel = level;
        break;
      }
    }
    if (requestedLevel) break;
  }

  // Procurar o idioma no currículo
  const languageVariations = languageMap[targetLanguage];
  let foundLanguage = false;
  let foundLevel = null;

  // Verificar se o idioma está presente
  for (const variation of languageVariations) {
    const regex = new RegExp(`\\b${normalize(variation)}\\b`, 'i');
    if (regex.test(normResume)) {
      foundLanguage = true;
      break;
    }
  }

  if (!foundLanguage) {
    return false;
  }

  // Se não foi solicitado nível específico, idioma presente é suficiente
  if (!requestedLevel) {
    return true;
  }

  // Procurar o nível no currículo (busca em contexto próximo ao idioma)
  for (const variation of languageVariations) {
    // Buscar em um contexto de ~100 caracteres ao redor do idioma
    const langRegex = new RegExp(`(.{0,100}\\b${normalize(variation)}\\b.{0,100})`, 'gi');
    const matches = normResume.match(langRegex);

    if (matches) {
      for (const match of matches) {
        // Verificar se há algum nível mencionado no contexto
        for (const [level, levelVariations] of Object.entries(levelMap)) {
          for (const levelVar of levelVariations) {
            if (match.includes(normalize(levelVar))) {
              foundLevel = level;
              break;
            }
          }
          if (foundLevel) break;
        }
        if (foundLevel) break;
      }
    }
  }

  // Se não encontrou nível específico, considerar que atende qualquer requisição
  if (!foundLevel) {
    return true;
  }

  // Verificar hierarquia de níveis (avançado > intermediário > básico)
  const levelHierarchy = {
    'básico': 1,
    'intermediário': 2,
    'avançado': 3,
    'fluente': 4
  };

  const foundLevelValue = levelHierarchy[foundLevel] || 1;
  const requestedLevelValue = levelHierarchy[requestedLevel] || 1;

  // Retorna true se o nível encontrado é igual ou superior ao solicitado
  return foundLevelValue >= requestedLevelValue;
}

/**
 * Verifica se a palavra-chave está presente no texto do currículo
 * Usa stemmer para aceitar variações simples e lógica especial para idiomas
 */
function keywordInResume(keyword, resumeText) {
  const normResume = normalize(resumeText);

  // Verificação especial para idiomas
  if (checkLanguageInResume(keyword, resumeText)) {
    return true;
  }

  // Verificação padrão para outras palavras-chave
  const forms = singularPluralForms(normalize(keyword));
  for (const form of forms) {
    // Regex para palavra inteira (\b) ignorando caixa
    const regex = new RegExp(`\\b${form}\\b`, 'i');
    if (regex.test(normResume)) return true;
  }
  return false;
}

/**
 * Conta quantas vezes cada palavra-chave aparece no texto das vagas
 * INCLUINDO todas as variações preposicionais para calcular relevância real
 * @param {string[]} keywords - Array de palavras-chave
 * @param {string} jobsText - Texto de todas as vagas concatenadas
 * @returns {Object[]} Array de objetos com keyword e count, ordenado por relevância (count descendente)
 */
function countKeywordOccurrences(keywords, jobsText) {
  const normJobsText = normalize(jobsText);
  const keywordCounts = [];

  keywords.forEach(keyword => {
    let totalCount = 0;

    // 1. Contar variações de singular/plural
    const forms = singularPluralForms(normalize(keyword));
    forms.forEach(form => {
      const regex = new RegExp(`\\b${form}\\b`, 'gi');
      const matches = normJobsText.match(regex);
      if (matches) {
        totalCount += matches.length;
      }
    });

    // 2. Contar variações preposicionais (se existirem)
    const prepositionVariations = generatePrepositionVariations(keyword);

    // Para cada variação preposicional
    prepositionVariations.forEach(variation => {
      // Pular a versão já contada acima
      const normalizedKeyword = normalize(keyword);
      if (variation === normalizedKeyword) return;

      // Contar esta variação preposicional (singular/plural também)
      const variationForms = singularPluralForms(variation);
      variationForms.forEach(form => {
        const regex = new RegExp(`\\b${form}\\b`, 'gi');
        const matches = normJobsText.match(regex);
        if (matches) {
          totalCount += matches.length;
        }
      });
    });

    keywordCounts.push({
      keyword: keyword,
      count: totalCount
    });
  });

  // Ordenar por relevância (count descendente), depois alfabeticamente para empates
  return keywordCounts.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.keyword.localeCompare(b.keyword, 'pt-BR');
  });
}

/**
 * Filtra o array job_keywords_present para garantir que só palavras realmente presentes estejam lá
 * @param {string[]} jobKeywordsPresent
 * @param {string} resumeText
 * @returns {string[]} Palavras realmente presentes
 */
function filterPresentKeywords(jobKeywordsPresent, resumeText) {
  return jobKeywordsPresent.filter(keyword => keywordInResume(keyword, resumeText));
}

/**
 * Normaliza palavras-chave para deduplicação, tratando variações preposicionais
 */
function normalizeForDeduplication(keyword) {
  let normalized = normalize(keyword);

  // Tratar variações preposicionais comuns
  // "gestão do backlog" -> "gestão de backlog"
  // "análise da performance" -> "análise de performance"
  // "desenvolvimento dos sistemas" -> "desenvolvimento de sistemas"

  const prepositionMap = {
    ' do ': ' de ',     // gestão do -> gestão de
    ' da ': ' de ',     // análise da -> análise de  
    ' dos ': ' de ',    // gestão dos -> gestão de
    ' das ': ' de ',    // análise das -> análise de
    ' no ': ' em ',     // trabalho no -> trabalho em
    ' na ': ' em ',     // experiência na -> experiência em
    ' nos ': ' em ',    // experiência nos -> experiência em
    ' nas ': ' em ',    // trabalho nas -> trabalho em
    ' ao ': ' a ',      // relacionado ao -> relacionado a
    ' aos ': ' a ',     // relacionado aos -> relacionado a
    ' às ': ' a ',      // relacionado às -> relacionado a
    ' à ': ' a '        // relacionado à -> relacionado a
  };

  // Aplicar mapeamento de preposições
  for (const [from, to] of Object.entries(prepositionMap)) {
    normalized = normalized.replace(new RegExp(from, 'g'), to);
  }

  // Remover espaços extras que podem ter sido criados
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

function deduplicateKeywords(keywords) {
  // Remove duplicidades, ignorando caixa, acentos E variações preposicionais
  const seen = new Set();
  const result = [];

  keywords.forEach(kw => {
    const norm = normalizeForDeduplication(kw);
    if (!seen.has(norm)) {
      seen.add(norm);
      result.push(kw); // Manter a palavra-chave original, não a normalizada
    }
  });

  return result;
}

/**
 * Remove duplicatas de palavras-chave similares com consolidação hierárquica
 * @param {Object[]} keywordCounts - Array com {keyword, count}
 * @returns {Object[]} Array dedupe e consolidado
 */
function deduplicateKeywordCounts(keywordCounts) {
  // Primeiro, consolidar palavras-chave hierárquicas
  const hierarchicallyConsolidated = consolidateHierarchicalKeywords(keywordCounts);

  // Depois, remover duplicatas por normalização de preposições
  const groups = new Map();

  hierarchicallyConsolidated.forEach(item => {
    const normalizedKey = normalizeForDeduplication(item.keyword);

    if (groups.has(normalizedKey)) {
      // Se já existe, manter o que tem maior count ou alfabeticamente primeiro
      const existing = groups.get(normalizedKey);
      if (item.count > existing.count ||
        (item.count === existing.count && item.keyword < existing.keyword)) {
        groups.set(normalizedKey, item);
      }
    } else {
      groups.set(normalizedKey, item);
    }
  });

  return Array.from(groups.values()).sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.keyword.localeCompare(b.keyword, 'pt-BR');
  });
}

/**
 * Gera todas as variações preposicionais possíveis de uma palavra-chave
 * para contagem mais precisa de relevância
 */
function generatePrepositionVariations(keyword) {
  const normalized = normalize(keyword);
  const variations = new Set([normalized]); // Começar com a versão normalizada

  // Mapas de variações bidirecionais
  const prepositionVariations = [
    [' de ', ' do ', ' da ', ' dos ', ' das '],
    [' em ', ' no ', ' na ', ' nos ', ' nas '],
    [' a ', ' ao ', ' aos ', ' às ', ' à '],
    [' com ', ' com o ', ' com a ', ' com os ', ' com as ']
  ];

  // Para cada grupo de preposições
  prepositionVariations.forEach(group => {
    // Se a palavra-chave contém alguma preposição do grupo
    group.forEach(prep => {
      if (normalized.includes(prep)) {
        // Gerar variações com todas as outras preposições do grupo
        group.forEach(altPrep => {
          if (prep !== altPrep) {
            const variation = normalized.replace(new RegExp(prep, 'g'), altPrep);
            variations.add(variation);
          }
        });
      }
    });
  });

  return Array.from(variations);
}

/**
 * Consolida palavras-chave hierárquicas APENAS quando há certeza semântica
 * Ex: "escopo" + "definir escopo" → "escopo" (verbo + substantivo = mesmo conceito)
 * NÃO consolida: "gestão" + "gestão de projetos" (conceitos diferentes!)
 * @param {Object[]} keywordCounts - Array com {keyword, count}
 * @returns {Object[]} Array consolidado
 */
function consolidateHierarchicalKeywords(keywordCounts) {
  // Ordenar por comprimento (palavras mais curtas primeiro)
  const sorted = [...keywordCounts].sort((a, b) => a.keyword.length - b.keyword.length);
  const consolidated = [];
  const processed = new Set();

  // Padrões seguros para consolidação (verbo + substantivo)
  const safeConsolidationPatterns = [
    // Verbos de ação + substantivo = mesmo conceito
    /^(definir|elaborar|criar|desenvolver|implementar|executar|realizar|fazer|construir|estabelecer|determinar|especificar)\s+(.+)$/i,
    // Adjetivos modificadores simples + substantivo = mesmo conceito  
    /^(novo|nova|novos|novas|atual|atuais|principal|principais|básico|básica|básicos|básicas)\s+(.+)$/i,
    // Artigos + substantivo = mesmo conceito
    /^(o|a|os|as|um|uma|uns|umas)\s+(.+)$/i
  ];

  sorted.forEach(parentItem => {
    if (processed.has(parentItem.keyword)) return;

    let totalCount = parentItem.count;
    const children = [];

    // Procurar palavras-chave que contêm a palavra atual
    sorted.forEach(childItem => {
      if (childItem.keyword === parentItem.keyword || processed.has(childItem.keyword)) return;

      const parentNorm = normalize(parentItem.keyword);
      const childNorm = normalize(childItem.keyword);

      // Verificar se é uma consolidação segura
      let shouldConsolidate = false;

      // 1. Verificar padrões seguros (verbo + substantivo, etc.)
      for (const pattern of safeConsolidationPatterns) {
        const match = childNorm.match(pattern);
        if (match) {
          const extractedConcept = normalize(match[2]); // O substantivo/conceito principal

          // Se o conceito extraído é igual ao pai, é seguro consolidar
          if (extractedConcept === parentNorm) {
            shouldConsolidate = true;
            break;
          }
        }
      }

      // 2. Casos especiais: plural/singular exato
      if (!shouldConsolidate) {
        const parentForms = singularPluralForms(parentNorm);
        if (parentForms.includes(childNorm) || parentForms.some(pf => childNorm === pf)) {
          shouldConsolidate = true;
        }
      }

      if (shouldConsolidate) {
        totalCount += childItem.count;
        children.push(childItem.keyword);
        processed.add(childItem.keyword);
      }
    });

    // Adicionar o item consolidado
    consolidated.push({
      keyword: parentItem.keyword,
      count: totalCount,
      ...(children.length > 0 && { consolidatedFrom: children })
    });

    processed.add(parentItem.keyword);
  });

  // Re-ordenar por relevância (count descendente)
  return consolidated.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.keyword.localeCompare(b.keyword, 'pt-BR');
  });
}

module.exports = {
  filterPresentKeywords,
  keywordInResume,
  deduplicateKeywords,
  deduplicateKeywordCounts,
  countKeywordOccurrences,
  generatePrepositionVariations,
  consolidateHierarchicalKeywords,
};
