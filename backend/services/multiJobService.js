const urlExtractor = require('../utils/urlExtractor');
const openaiService = require('./openaiService');
const textExtractor = require('../utils/textExtractor');

/**
 * Processa múltiplas vagas em paralelo e retorna um resultado consolidado
 * @param {string} resumePath Caminho do arquivo de currículo
 * @param {Array<string>} jobLinks Links para as vagas
 * @returns {Object} Resultado consolidado da análise
 */
exports.processMultipleJobs = async (resumePath, jobLinks) => {
  try {
    console.log('[MultiJob] Iniciando processamento de múltiplas vagas:', jobLinks.length);
    
    // Extrai o texto do currículo
    const resumeText = await textExtractor.extract(resumePath);
    console.log('[MultiJob] Currículo extraído, tamanho:', resumeText.length);
    
    // Extrai o conteúdo de todas as vagas em paralelo
    console.log('[MultiJob] Extraindo conteúdo de todas as vagas');
    const jobTexts = await urlExtractor.extractMultiple(jobLinks);
    
    // Processa análise combinada via OpenAI
    console.log('[MultiJob] Enviando para análise combinada');
    const result = await openaiService.analyzeMultipleJobs(resumeText, jobTexts, jobLinks);
    
    return result;
  } catch (error) {
    console.error('[MultiJob] Erro ao processar múltiplas vagas:', error);
    throw error;
  }
};
