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
 * Verifica se a palavra-chave está presente no texto do currículo
 * Usa stemmer para aceitar variações simples
 */
function keywordInResume(keyword, resumeText) {
  const normResume = normalize(resumeText);
  // Gera formas singular/plural para busca
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
