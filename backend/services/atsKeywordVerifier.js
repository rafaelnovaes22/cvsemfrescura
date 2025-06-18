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
 * @param {string[]} keywords - Array de palavras-chave
 * @param {string} jobsText - Texto de todas as vagas concatenadas
 * @returns {Object[]} Array de objetos com keyword e count, ordenado por relevância (count descendente)
 */
function countKeywordOccurrences(keywords, jobsText) {
  const normJobsText = normalize(jobsText);
  const keywordCounts = [];

  keywords.forEach(keyword => {
    const forms = singularPluralForms(normalize(keyword));
    let totalCount = 0;

    forms.forEach(form => {
      const regex = new RegExp(`\\b${form}\\b`, 'gi');
      const matches = normJobsText.match(regex);
      if (matches) {
        totalCount += matches.length;
      }
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

function deduplicateKeywords(keywords) {
  // Remove duplicidades, ignorando caixa e acentos
  const seen = new Set();
  return keywords.filter(kw => {
    const norm = normalize(kw);
    if (seen.has(norm)) return false;
    seen.add(norm);
    return true;
  });
}

module.exports = {
  filterPresentKeywords,
  keywordInResume,
  deduplicateKeywords,
  countKeywordOccurrences,
};
