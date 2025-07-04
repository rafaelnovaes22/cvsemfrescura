const textExtractor = require('../utils/textExtractor');
const urlExtractor = require('../utils/urlExtractor');
const openaiService = require('./openaiService');

function normalizeTerm(term) {
  // Remove acentos, caixa baixa, singular/plural simples, espaços extras
  return term
    .normalize('NFD').replace(/[ -]/g, '')
    .toLowerCase()
    .replace(/s\b/, '') // remove plural simples
    .trim();
}

function cleanKeywords(keywords) {
  // Remove frases longas (>3 palavras), normaliza caixa, remove apenas duplicatas exatas
  const cleanSet = new Set();
  const normalizedSet = new Set();
  for (let kw of keywords) {
    if (typeof kw !== 'string') continue;
    const trimmed = kw.trim();
    if (!trimmed) continue;
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount > 3) continue; // remove frases longas
    const normalized = normalizeTerm(trimmed);
    if (normalizedSet.has(normalized)) continue; // remove duplicatas exatas
    cleanSet.add(trimmed);
    normalizedSet.add(normalized);
  }
  return Array.from(cleanSet);
}

function normalizeKeywords(keywords) {
  // Não aplicar nenhum filtro, retornar exatamente o que veio da OpenAI
  return keywords;
}

function extractKeywordsFromOpenAI(openAIResponse) {
  return normalizeKeywords(openAIResponse.job_keywords || openAIResponse.keywords || []);
}

function compareKeywords(jobKeywords, resumeKeywords) {
  // Garante que ambos são arrays
  if (!Array.isArray(jobKeywords)) {
    if (typeof jobKeywords === 'string') jobKeywords = jobKeywords.split(',').map(s => s.trim()).filter(Boolean);
    else if (jobKeywords && typeof jobKeywords === 'object') jobKeywords = Object.values(jobKeywords);
    else jobKeywords = [];
  }
  if (!Array.isArray(resumeKeywords)) {
    if (typeof resumeKeywords === 'string') resumeKeywords = resumeKeywords.split(',').map(s => s.trim()).filter(Boolean);
    else if (resumeKeywords && typeof resumeKeywords === 'object') resumeKeywords = Object.values(resumeKeywords);
    else resumeKeywords = [];
  }
  const found = jobKeywords.filter(k => resumeKeywords.includes(k));
  const missing = jobKeywords.filter(k => !resumeKeywords.includes(k));
  return { found, missing };
}

exports.processATS = async (resumePath, jobLinks) => {
  // 1. Extrair texto do currículo
  const resumeText = await textExtractor.extract(resumePath);

  // 2. Extrair textos das vagas
  const jobsText = await urlExtractor.extractMultiple(jobLinks);

  // 3. Gerar prompt e consultar OpenAI
  const openAIResponse = await openaiService.extractATSData(jobsText, resumeText);
  const jobKeywords = extractKeywordsFromOpenAI(openAIResponse);
  const resumeKeywords = openAIResponse.resume_keywords || [];

  // 4. Comparar palavras-chave
  const { found, missing } = compareKeywords(jobKeywords, resumeKeywords);

  return {
    ...openAIResponse,
    job_keywords: jobKeywords,
    resume_keywords: resumeKeywords,
    missing_keywords: Array.isArray(openAIResponse.missing_keywords) && openAIResponse.missing_keywords.length > 0 ? openAIResponse.missing_keywords : missing,
    found_keywords: Array.isArray(openAIResponse.found_keywords) && openAIResponse.found_keywords.length > 0 ? openAIResponse.found_keywords : found,
    jobsText: jobsText,
    resumeText: resumeText
  };
};
