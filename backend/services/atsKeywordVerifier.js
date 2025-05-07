// Verificador avançado de palavras-chave realmente presentes no currículo
// Implementa correspondência semântica avançada compatível com sistemas ATS como Gupy
// Aceita plural/singular, variações contextuais, expressões equivalentes e sinônimos profissionais relevantes

const natural = require('natural');
const stemmer = natural.PorterStemmerPt; // para português

/**
 * Normaliza string para comparação (lowercase, remove acentos, pontuação)
 */
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/gi, ' ');
}

/**
 * Gera variações de termos para aceitar equivalências comuns
 * @param {string} word - Palavra ou termo a ser expandido
 * @returns {string[]} - Array de variações possíveis
 */
function generateVariations(word) {
  const variations = new Set();
  const normalized = normalize(word);
  
  // Forma original normalizada
  variations.add(normalized);
  
  // Singular/plural simples
  if (normalized.endsWith('s')) {
    variations.add(normalized.slice(0, -1));
  } else {
    variations.add(normalized + 's');
  }
  
  // Variações comuns para cargos
  if (normalized.includes('product owner')) {
    variations.add('po');
    variations.add('product manager');
    variations.add('dono do produto');
  }
  
  // Variações para metodologias
  if (normalized.includes('metodologia agil') || normalized.includes('metodologias ageis')) {
    variations.add('scrum');
    variations.add('kanban');
    variations.add('agile');
  }
  
  // Variações para certificações
  if (normalized.includes('certificacao')) {
    const certPattern = normalized.replace('certificacao', '').trim();
    variations.add(certPattern);
    if (certPattern === 'product owner') {
      variations.add('pspo');
      variations.add('professional scrum product owner');
    }
  }
  
  // Variações para formação
  if (normalized.includes('ensino superior') || normalized.includes('graduacao')) {
    variations.add('tecnologo');
    variations.add('bacharelado');
    variations.add('licenciatura');
    variations.add('formacao superior');
  }
  
  // Variações para idiomas
  if (normalized.includes('ingles intermediario')) {
    variations.add('ingles');
    variations.add('english');
  }
  
  return [...variations];
}

/**
 * Verifica se a palavra-chave está presente no texto do currículo
 * usando correspondência contextual avançada
 * @param {string} keyword - Palavra-chave da vaga
 * @param {string} resumeText - Texto completo do currículo
 * @returns {boolean} - Verdadeiro se encontrada
 */
function keywordInResume(keyword, resumeText) {
  // Ignorar keywords vazias ou muito curtas
  if (!keyword || keyword.trim().length < 3) return false;
  
  const normResume = normalize(resumeText);
  const normKeyword = normalize(keyword).trim();
  
  // DETECTAÇÃO MAIS FLEXÍVEL PARA TERMOS DECOMPOSTOS
  // Lista de termos técnicos comuns que podem ser detectados de forma mais flexível
  const technicalTerms = [
    'scrum', 'kanban', 'agile', 'agil', 'aws', 'azure', 'cloud', 'data', 'python',
    'sql', 'power bi', 'powerbi', 'tableau', 'quicksight', 'product owner', 'po',
    'stakeholder', 'backlog', 'roadmap', 'analise', 'negociacao', 'comunicacao'
  ];
  
  // Se for um termo técnico simples, verificação simplificada
  const lowercaseKeyword = normKeyword.toLowerCase();
  if (technicalTerms.some(term => lowercaseKeyword === term || lowercaseKeyword.includes(term))) {
    // Para termos técnicos, basta que estejam presentes no currículo
    const termRegex = new RegExp(`\\b${normKeyword}\\b`, 'i');
    if (termRegex.test(normResume)) return true;
  }
  
  // 1. Verifica correspondência exata (palavra inteira)
  const exactRegex = new RegExp(`\\b${normKeyword}\\b`, 'i');
  if (exactRegex.test(normResume)) return true;
  
  // 2. Verifica variações e equivalências
  const variations = generateVariations(keyword);
  for (const variation of variations) {
    if (!variation || variation.length < 3) continue;
    
    const exactVariationRegex = new RegExp(`\\b${variation}\\b`, 'i');
    if (exactVariationRegex.test(normResume)) return true;
    
    // Para termos decompostos, verificamos se são palavras individuais significativas
    if (!variation.includes(' ') && variation.length > 3) {
      // Para palavras individuais importantes, verificamos se estão presentes
      if (normResume.includes(variation)) return true;
    } else {
      // Para termos compostos, dividimos em palavras
      const words = variation.split(/\s+/).filter(w => w.length > 2);
      
      // Para termos compostos, verificamos se todas as palavras estão presentes
      if (words.length > 1) {
        // Verifica se a maioria das palavras (>75%) estã presente
        const presentWordCount = words.filter(word => {
          const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
          return wordRegex.test(normResume);
        }).length;
        
        const presentPercentage = presentWordCount / words.length;
        if (presentPercentage >= 0.75) return true;
      }
    }
  }
  
  return false;
}

/**
 * Verifica se um termo é um conceito técnico/skill conhecido
 * para permitir correspondência quando as palavras não estão exatamente juntas
 */
function isKnownConcept(term) {
  const knownConcepts = [
    'product owner', 'metodologia agil', 'backlog produto', 
    'roadmap produto', 'ingles avancado', 'gestao projetos',
    'gestao produtos', 'certificacao product owner'
  ];
  
  return knownConcepts.some(concept => term.includes(concept));
}

/**
 * Filtra o array job_keywords_present para garantir que só palavras realmente presentes estejam lá
 * usando correspondência avançada
 * @param {string[]} jobKeywords - Lista completa de palavras-chave da vaga
 * @param {string} resumeText - Texto completo do currículo
 * @returns {Object} - Objeto com arrays de palavras presentes e ausentes
 */
function analyzeKeywords(jobKeywords, resumeText) {
  const present = [];
  const missing = [];
  
  // Primeiro normaliza e deduplica a lista de entrada
  const uniqueKeywords = deduplicateKeywords(jobKeywords);
  
  for (const keyword of uniqueKeywords) {
    if (keywordInResume(keyword, resumeText)) {
      present.push(keyword);
    } else {
      missing.push(keyword);
    }
  }
  
  return {
    job_keywords_present: present,
    job_keywords_missing: missing
  };
}

/**
 * Remove duplicidades, ignorando caixa e acentos
 */
function deduplicateKeywords(keywords) {
  const seen = new Set();
  return keywords.filter(kw => {
    const norm = normalize(kw);
    if (seen.has(norm)) return false;
    seen.add(norm);
    return true;
  });
}

module.exports = {
  analyzeKeywords,
  keywordInResume,
  deduplicateKeywords,
  normalize
};
