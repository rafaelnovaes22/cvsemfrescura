const atsService = require('../services/atsService');
const GupyOptimizationService = require('../services/gupyOptimizationService');
const fs = require('fs');
const User = require('../models/user'); // Importando o modelo de usuário para gerenciar créditos
const AnalysisResults = require('../models/AnalysisResults'); // Importando o modelo para salvar análises

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
    if (jobLinks.length < 3) {
      console.warn('[ATS] Limite de vagas insuficiente:', jobLinks.length);
      return res.status(400).json({ error: 'É necessário incluir pelo menos 3 vagas para uma análise completa.' });
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

      // Atualizar a conclusão para refletir os dados reais processados pelo backend
      const matchPercentage = result.keyword_statistics.match_percentage;
      const totalKeywords = keywordCounts.length;
      const presentCount = presentes.length;
      const missingCount = ausentes.length;

      // Gerar conclusão consistente com os dados reais
      let matchQuality;
      if (matchPercentage >= 80) {
        matchQuality = "excelente aderência";
      } else if (matchPercentage >= 60) {
        matchQuality = "boa aderência";
      } else if (matchPercentage >= 40) {
        matchQuality = "aderência moderada";
      } else if (matchPercentage >= 20) {
        matchQuality = "aderência básica";
      } else {
        matchQuality = "aderência limitada";
      }

      result.conclusion = `O currículo apresenta ${matchQuality} às vagas analisadas, com ${matchPercentage}% das palavras-chave presentes (${presentCount} de ${totalKeywords} palavras-chave identificadas). ${matchPercentage >= 60
        ? `O perfil demonstra boa compatibilidade com os requisitos identificados.`
        : `Há oportunidades significativas de melhoria para aumentar a compatibilidade.`
        } ${missingCount > 0
          ? `As principais áreas de desenvolvimento incluem as ${missingCount} palavras-chave ausentes identificadas na análise.`
          : 'O currículo atende bem aos requisitos técnicos das vagas.'
        } ${matchPercentage >= 80
          ? 'Com pequenos ajustes, o currículo tem excelente potencial para se destacar.'
          : matchPercentage >= 40
            ? 'Com ajustes focados nas palavras-chave ausentes, o currículo pode se tornar mais competitivo.'
            : 'É recomendado revisar e incluir mais palavras-chave relevantes para melhorar significativamente a compatibilidade.'
        }`;



      // Limpar dados internos antes de enviar ao frontend
      delete result.jobsText;
      delete result.resumeText;
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

      // Preparar dados para salvamento
      const analysisData = {
        userId: userId,
        resumeFileName: fileName,
        resumeContent: resumeText,
        jobUrls: jobLinks,
        result: result
      };

      console.log(`[ATS] Salvando análise no histórico para usuário ${userId}...`);
      console.log(`[ATS] Dados a salvar:`, {
        userId: analysisData.userId,
        fileName: analysisData.resumeFileName,
        jobUrlsCount: Array.isArray(analysisData.jobUrls) ? analysisData.jobUrls.length : 0,
        resultKeys: Object.keys(analysisData.result || {}),
        hasConclusion: !!(analysisData.result && analysisData.result.conclusion),
        hasResumo: !!(analysisData.result && analysisData.result.resumo),
        hasKeywords: !!(analysisData.result && analysisData.result.job_keywords_present)
      });

      const savedAnalysis = await AnalysisResults.create(analysisData);

      console.log(`[ATS] ✅ Análise salva com sucesso! ID: ${savedAnalysis.id}`);

      // Adicionar ID da análise ao resultado para referência
      result.savedAnalysisId = savedAnalysis.id;

    } catch (saveErr) {
      console.error('[ATS] ❌ Erro ao salvar análise no histórico:', saveErr);
      console.error('[ATS] Stack trace:', saveErr.stack);

      // Log detalhado do erro para debug
      if (saveErr.name === 'SequelizeValidationError') {
        console.error('[ATS] Erros de validação:', saveErr.errors.map(e => e.message));
      } else if (saveErr.name === 'SequelizeDatabaseError') {
        console.error('[ATS] Erro de banco de dados:', saveErr.message);
      }

      // Não interromper o fluxo se houver erro ao salvar
      // Mas adicionar flag no resultado para indicar que não foi salvo
      result.historySaveError = true;
      result.historySaveErrorMessage = saveErr.message;
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
    console.log('[ATS] 📋 Buscando histórico de análises...');

    const userId = req.user?.id;
    if (!userId) {
      console.log('[ATS] ❌ Usuário não autenticado');
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    console.log(`[ATS] 🔍 Buscando análises para usuário ${userId}...`);

    // Usar método personalizado do modelo
    const formattedAnalyses = await AnalysisResults.findUserAnalyses(userId, 50);

    console.log(`[ATS] ✅ Encontradas ${formattedAnalyses.length} análises para o usuário ${userId}`);

    // Log detalhado das análises encontradas
    if (formattedAnalyses.length > 0) {
      console.log('[ATS] 📊 Resumo das análises:');
      formattedAnalyses.slice(0, 3).forEach((analysis, index) => {
        console.log(`  ${index + 1}. ID: ${analysis.id}, Arquivo: ${analysis.fileName}, Vagas: ${analysis.jobCount}, Data: ${analysis.createdAt}`);
      });
    } else {
      console.log('[ATS] ⚠️ Nenhuma análise encontrada para este usuário');
    }

    res.json(formattedAnalyses);
  } catch (err) {
    console.error('[ATS] ❌ Erro ao buscar histórico:', err);
    console.error('[ATS] Stack trace:', err.stack);
    res.status(500).json({ error: 'Erro ao buscar histórico de análises.' });
  }
};

// Nova função para buscar uma análise específica sem consumir créditos
exports.getAnalysisById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const analysisId = req.params.id;

    console.log(`[ATS] 🔍 Buscando análise específica: ${analysisId} para usuário ${userId}`);

    if (!userId) {
      console.log('[ATS] ❌ Usuário não autenticado');
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    if (!analysisId) {
      console.log('[ATS] ❌ ID da análise não fornecido');
      return res.status(400).json({ error: 'ID da análise é obrigatório.' });
    }

    // Usar método personalizado do modelo
    const result = await AnalysisResults.findUserAnalysis(analysisId, userId);

    if (!result) {
      console.log(`[ATS] ❌ Análise ${analysisId} não encontrada para usuário ${userId}`);
      return res.status(404).json({ error: 'Análise não encontrada.' });
    }

    console.log(`[ATS] ✅ Análise histórica encontrada e retornada para usuário ${userId}: ${analysisId}`);
    console.log(`[ATS] 📊 Dados da análise:`, {
      hasConclusion: !!result.conclusion,
      hasResumo: !!result.resumo,
      hasKeywords: !!(result.job_keywords_present && result.job_keywords_present.length > 0),
      hasJobs: !!(result.jobs && result.jobs.length > 0),
      fileName: result.fileName,
      isHistoricalView: result.isHistoricalView
    });

    res.json(result);
  } catch (err) {
    console.error('[ATS] ❌ Erro ao buscar análise:', err);
    console.error('[ATS] Stack trace:', err.stack);
    res.status(500).json({ error: 'Erro ao buscar análise.' });
  }
};
