const atsService = require('../services/atsService');
const GupyOptimizationService = require('../services/gupyOptimizationService');
const fs = require('fs');
const User = require('../models/user'); // Importando o modelo de usuário para gerenciar créditos
const AnalysisResults = require('../models/AnalysisResults'); // Importando o modelo para salvar análises
const { generateATSOptimizedRecommendations } = require('../services/atsOptimizationService');

exports.analyze = async (req, res) => {
  try {
    console.log('--- [ATS] Nova requisição recebida ---');

    // Verificar se o usuário tem créditos disponíveis
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Verificar créditos
    const credits = user.credits || 0;
    if (credits <= 0) {
      return res.status(403).json({
        error: 'Você não possui créditos suficientes para realizar uma análise.',
        credits: 0
      });
    }
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

    // Análise padrão do ATS
    let result;
    try {
      result = await atsService.processATS(resumePath, jobLinks);
      // Garantir que result tenha uma estrutura válida
      if (!result) result = {};
      if (!result.jobs) result.jobs = [];
    } catch (error) {
      console.error('[ATS] Erro no processamento ATS:', error);
      return res.status(500).json({
        error: 'Erro ao processar análise ATS. Por favor, tente novamente.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // Extrai o texto do currículo para análises adicionais
    const textExtractor = require('../utils/textExtractor');
    const resumeText = await textExtractor.extract(resumePath);

    // Criar jobsText concatenando todas as descrições das vagas
    let jobsText = '';
    if (result.jobs && Array.isArray(result.jobs)) {
      jobsText = result.jobs
        .map(job => (job.description || job.title || '').trim())
        .filter(text => text.length > 0)
        .join('\n\n---\n\n');
    }
    console.log(`[ATS] jobsText criado com ${jobsText.length} caracteres de ${result.jobs?.length || 0} vagas`);

    // Análise específica para Gupy (se detectarmos vagas da Gupy)
    const gupyJobs = jobLinks.filter(link =>
      link.includes('gupy.io') || link.includes('gupy.com')
    );

    if (gupyJobs.length > 0 && result.jobs && Array.isArray(result.jobs)) {
      console.log('[ATS] Detectadas vagas da Gupy, realizando análise específica...');

      // Para cada vaga da Gupy, fazer análise especializada
      result.gupy_optimization = [];

      // Verificar se result.jobs existe e é um array antes de acessar length
      if (!result.jobs) {
        console.warn('[ATS] Alerta: result.jobs está undefined ou null');
        result.jobs = [];
      }

      for (let i = 0; i < Math.min(gupyJobs.length, result.jobs.length); i++) {
        const jobData = result.jobs.find(job =>
          gupyJobs.some(gupyLink => job && job.link === gupyLink)
        );

        if (jobData && jobData.description) {
          let gupyAnalysis;
          try {
            gupyAnalysis = GupyOptimizationService.analyzeGupyCompatibility(
              resumeText,
              jobData.description
            );
          } catch (error) {
            console.error('[ATS] Erro na análise Gupy:', error);
            gupyAnalysis = { score: 0, suggestions: [], matches: [] };
          }

          result.gupy_optimization.push({
            job_title: jobData.title || 'Vaga sem título',
            job_link: jobData.link,
            compatibility_score: gupyAnalysis.score,
            algorithm_tips: gupyAnalysis.recommendations,
            keyword_analysis: {
              present: gupyAnalysis.keywords.present,
              missing: gupyAnalysis.keywords.missing,
              density: gupyAnalysis.keywords.density
            },
            format_optimization: gupyAnalysis.format
          });
        }
      }

      // Adicionar dicas gerais para Gupy
      result.gupy_tips = {
        general_advice: [
          "Use formato objetivo: 'Experiência com X, Y, Z' ao invés de frases longas",
          "Repita palavras-chave da vaga em contextos diferentes",
          "Organize experiências em formato claro: Empresa | Cargo | Período",
          "Use bullet points para destacar habilidades e responsabilidades",
          "Evite adjetivos excessivos, foque em resultados concretos"
        ],
        algorithm_insights: {
          name: "GAIA - Inteligência Artificial da Gupy",
          factors: [
            "Analisa 200+ métricas diferentes",
            "Prioriza keywords exatas da vaga",
            "Valoriza formato objetivo e estruturado",
            "Considera formação, experiência e fit cultural",
            "Aprende com contratações bem-sucedidas"
          ]
        }
      };
    }

    // Cruzamento real: só palavras da vaga encontradas no currículo
    const { filterPresentKeywords, deduplicateKeywords, countKeywordOccurrences, deduplicateKeywordCounts } = require('../services/atsKeywordVerifier');
    if (result.job_keywords && Array.isArray(result.job_keywords) && result.jobsText) {
      // Extrai as palavras-chave da vaga e remove duplicidades
      let jobKeywords = result.job_keywords;
      jobKeywords = deduplicateKeywords(jobKeywords);

      // Contar ocorrências das palavras-chave nas vagas usando o jobsText do result
      // Conta quantas vezes cada palavra-chave aparece
      const rawKeywordCounts = countKeywordOccurrences(jobKeywords, result.jobsText);

      // Consolida palavras-chave hierárquicas (ex: "escopo" + "definir escopo")
      const keywordCounts = deduplicateKeywordCounts(rawKeywordCounts);

      result.job_keywords_with_count = keywordCounts;

      // Atualizar job_keywords com ordem de relevância (apenas as palavras-chave, sem contagem)
      result.job_keywords = keywordCounts.map(item => item.keyword);

      const presentes = filterPresentKeywords(jobKeywords, result.resumeText);
      const ausentes = jobKeywords.filter(k => !presentes.includes(k));

      // Adicionar contagem para palavras presentes
      result.job_keywords_present_with_count = keywordCounts.filter(item =>
        presentes.includes(item.keyword)
      );

      // Adicionar contagem para palavras ausentes
      result.job_keywords_missing_with_count = keywordCounts.filter(item =>
        ausentes.includes(item.keyword)
      );

      // Manter compatibilidade com versões anteriores
      result.job_keywords_present = presentes;
      result.job_keywords_missing = ausentes;

      // Criar estatísticas de relevância
      result.keyword_statistics = {
        total_identified: keywordCounts.length,
        total_occurrences: keywordCounts.reduce((sum, item) => sum + item.count, 0),
        present_in_resume: presentes.length,
        missing_in_resume: ausentes.length,
        match_percentage: keywordCounts.length > 0 ? Math.round((presentes.length / keywordCounts.length) * 100) : 0
      };

      // Limpar dados internos antes de enviar ao frontend
      delete result.jobsText;
      delete result.resumeText;
    }

    // Gerar recomendações otimizadas para ATS com a fórmula específica
    if (result.job_keywords && result.missing_keywords) {
      const atsOptimizedRecommendations = generateATSOptimizedRecommendations(
        result.job_keywords,
        result.resumeText || '',
        result.missing_keywords
      );

      // Adicionar às recomendações existentes
      if (result.recommendations && Array.isArray(result.recommendations)) {
        result.recommendations.push(...atsOptimizedRecommendations);
      } else {
        result.recommendations = atsOptimizedRecommendations;
      }

      // Criar uma seção específica para recomendações ATS
      result.ats_optimization_tips = atsOptimizedRecommendations;
    }

    // Decrementar créditos do usuário após análise bem-sucedida
    try {
      // Decrementar crédito do usuário
      const newCredits = (user.credits || 0) - 1;
      await user.update({ credits: newCredits });
      console.log(`[ATS] Crédito decrementado para o usuário ${userId}. Créditos restantes: ${newCredits}`);

      // Adicionar informação de créditos na resposta
      result.credits_remaining = newCredits;
    } catch (creditErr) {
      console.error('[ATS] Erro ao decrementar créditos:', creditErr);
      // Não interromper o fluxo se houver erro ao atualizar créditos
    }

    // Salvar a análise no banco de dados
    try {
      const fileName = req.file?.originalname || 'arquivo.pdf';
      await AnalysisResults.create({
        userId: userId,
        resumeFileName: fileName,
        resumeContent: resumeText,
        jobUrls: jobLinks,
        result: result
      });
      console.log(`[ATS] Análise salva no histórico para o usuário ${userId}`);
    } catch (saveErr) {
      console.error('[ATS] Erro ao salvar análise no histórico:', saveErr);
      // Não interromper o fluxo se houver erro ao salvar
    }

    fs.unlink(resumePath, () => { }); // Limpa upload temporário

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

// Nova função para buscar análises anteriores sem consumir créditos
exports.getAnalysisHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const analyses = await AnalysisResults.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 50 // Limitar a 50 análises mais recentes
    });

    const formattedAnalyses = analyses.map(analysis => ({
      id: analysis.id,
      fileName: analysis.resumeFileName,
      jobUrls: analysis.jobUrls,
      createdAt: analysis.createdAt,
      jobCount: Array.isArray(analysis.jobUrls) ? analysis.jobUrls.length : 0,
      // Resumo básico sem enviar todo o resultado
      summary: {
        hasCompatibilityScores: !!(analysis.result && analysis.result.jobs),
        hasKeywords: !!(analysis.result && analysis.result.job_keywords),
        hasEvaluations: !!(analysis.result && (analysis.result.resumo || analysis.result.idiomas))
      }
    }));

    res.json(formattedAnalyses);
  } catch (err) {
    console.error('[ATS] Erro ao buscar histórico:', err);
    res.status(500).json({ error: 'Erro ao buscar histórico de análises.' });
  }
};

// Nova função para buscar uma análise específica sem consumir créditos
exports.getAnalysisById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const analysisId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const analysis = await AnalysisResults.findOne({
      where: {
        id: analysisId,
        userId: userId // Garantir que o usuário só acesse suas próprias análises
      }
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Análise não encontrada.' });
    }

    // Retornar a análise completa sem decrementar créditos
    const result = analysis.result;

    // Adicionar informação de que é uma consulta histórica
    result.isHistoricalView = true;
    result.originalDate = analysis.createdAt;

    res.json(result);
  } catch (err) {
    console.error('[ATS] Erro ao buscar análise:', err);
    res.status(500).json({ error: 'Erro ao buscar análise.' });
  }
};
