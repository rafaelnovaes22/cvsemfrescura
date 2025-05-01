const atsService = require('../services/atsService');
const fs = require('fs');

exports.analyze = async (req, res) => {
  try {
    console.log('--- [ATS] Nova requisição recebida ---');
    const resumePath = req.file?.path;
    const jobLinks = JSON.parse(req.body.jobLinks || '[]');
    if (resumePath) {
      const path = require('path');
      console.log('[ATS] Arquivo recebido:', resumePath);
      console.log('[ATS] Extensão detectada:', path.extname(resumePath));
    }
    console.log('[ATS] Links recebidos:', jobLinks);
    if (!resumePath || !jobLinks.length) {
      console.warn('[ATS] Dados insuficientes: arquivo ou links ausentes.');
      return res.status(400).json({ error: 'Arquivo de currículo ou links de vagas ausentes.' });
    }
    if (jobLinks.length > 7) {
      console.warn('[ATS] Limite de vagas excedido:', jobLinks.length);
      return res.status(400).json({ error: 'O limite máximo é de 7 vagas por análise. Remova alguns links e tente novamente.' });
    }
    const result = await atsService.processATS(resumePath, jobLinks);
    // Extrai o texto do currículo para o filtro
    const textExtractor = require('../utils/textExtractor');
    const resumeText = await textExtractor.extract(resumePath);
    // Cruzamento real: só palavras da vaga encontradas no currículo
    const { filterPresentKeywords, deduplicateKeywords } = require('../services/atsKeywordVerifier');
    if (result.job_keywords && Array.isArray(result.job_keywords)) {
      // Extrai as palavras-chave da vaga e remove duplicidades
      let jobKeywords = result.job_keywords;
      jobKeywords = deduplicateKeywords(jobKeywords);
      const presentes = filterPresentKeywords(jobKeywords, resumeText);
      const ausentes = jobKeywords.filter(k => !presentes.includes(k));
      result.job_keywords_present = presentes;
      result.job_keywords_missing = ausentes;
    }
    fs.unlink(resumePath, () => {}); // Limpa upload temporário
    console.log('[ATS] Análise concluída. Resultado:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (err) {
    if (err.response) {
      // Erro vindo da OpenAI ou de outro serviço HTTP
      console.error('[ATS] Erro na análise:', err.response.status, err.response.data);
      res.status(err.response.status).json({ error: err.response.data });
    } else {
      console.error('[ATS] Erro na análise:', err.message, err);
      res.status(500).json({ error: err.message || 'Erro interno no ATS.' });
    }
  }
};
