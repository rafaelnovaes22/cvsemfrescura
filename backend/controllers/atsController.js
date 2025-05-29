const atsService = require('../services/atsService');
const GupyOptimizationService = require('../services/gupyOptimizationService');
const GupyPassGuaranteeService = require('../services/gupyPassGuaranteeService');
const ATSUniversalService = require('../services/atsUniversalService');
const fs = require('fs');
const User = require('../models/user'); // Importando o modelo de usuário para gerenciar créditos
const { costTracker } = require('../utils/costTracker'); // Sistema de tracking de custos

exports.analyze = async (req, res) => {
  try {
    console.log('--- [ATS UNIVERSAL] Nova requisição recebida ---');

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

    // Análise padrão do ATS (para manter compatibilidade)
    let result;
    try {
      result = await atsService.processATS(resumePath, jobLinks);
      if (!result) result = {};
      if (!result.jobs) result.jobs = [];
    } catch (error) {
      console.error('[ATS] Erro no processamento ATS:', error);
      return res.status(500).json({
        error: 'Erro ao processar análise ATS. Por favor, tente novamente.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // Extrair texto do currículo
    const textExtractor = require('../utils/textExtractor');
    const resumeText = await textExtractor.extract(resumePath);

    // ===================================================
    // 🚀 SISTEMA UNIVERSAL ATS - ANÁLISE PRINCIPAL
    // ===================================================
    console.log('🚀 [ATS UNIVERSAL] Iniciando análise de compatibilidade universal...');

    const universalAnalyses = [];
    let totalScore = 0;
    let gupyAnalysisFound = false;

    for (const jobLink of jobLinks) {
      try {
        const jobData = result.jobs?.find(job => job.link === jobLink);
        if (jobData && jobData.description) {
          console.log(`🎯 [ATS UNIVERSAL] Analisando: ${jobLink}`);

          // ANÁLISE UNIVERSAL - CORE DO SISTEMA
          const universalAnalysis = await ATSUniversalService.analyzeUniversalCompatibility(
            resumeText,
            jobData.description,
            jobLink
          );

          // Enriquecer com informações da vaga
          universalAnalysis.job_info = {
            title: jobData.title || 'Vaga sem título',
            link: jobLink,
            platform: universalAnalysis.ats_info.name,
            market_share: universalAnalysis.ats_info.marketShare,
            complexity: universalAnalysis.ats_info.complexity
          };

          universalAnalyses.push(universalAnalysis);
          totalScore += universalAnalysis.universal_score;

          // Marcar se encontramos análise Gupy
          if (universalAnalysis.ats_info.type === 'GUPY') {
            gupyAnalysisFound = true;
          }

          console.log(`✅ [ATS UNIVERSAL] ${universalAnalysis.ats_info.name} - Score: ${universalAnalysis.universal_score}/100 (${universalAnalysis.optimization_level})`);
        }
      } catch (error) {
        console.error(`❌ [ATS UNIVERSAL] Erro analisando ${jobLink}:`, error.message);
        // Adicionar análise de fallback em caso de erro
        universalAnalyses.push({
          job_info: {
            title: 'Erro na análise',
            link: jobLink,
            platform: 'Desconhecido'
          },
          ats_info: { type: 'ERROR', name: 'Erro', complexity: 'DESCONHECIDO' },
          universal_score: 0,
          platform_specific: {},
          recommendations: [{
            priority: 'HIGH',
            title: 'Erro na Análise',
            description: 'Não foi possível analisar esta vaga. Verifique o link.',
            impact: 'Análise incompleta'
          }],
          optimization_level: 'ERROR'
        });
      }
    }

    // Calcular estatísticas gerais
    const avgScore = jobLinks.length > 0 ? Math.round(totalScore / jobLinks.length) : 0;
    const platformCoverage = {};

    universalAnalyses.forEach(analysis => {
      const platform = analysis.ats_info.name;
      if (!platformCoverage[platform]) {
        platformCoverage[platform] = { count: 0, total_score: 0 };
      }
      platformCoverage[platform].count++;
      platformCoverage[platform].total_score += analysis.universal_score;
    });

    // ===================================================
    // 📊 ESTRUTURA DE RESPOSTA UNIFICADA
    // ===================================================
    const unifiedResult = {
      // Estatísticas gerais
      analysis_summary: {
        total_jobs: jobLinks.length,
        average_compatibility: avgScore,
        analysis_timestamp: new Date().toISOString(),
        platforms_detected: Object.keys(platformCoverage).length,
        credits_used: 1
      },

      // Análises universais (PRINCIPAL)
      universal_ats_analysis: universalAnalyses,

      // Cobertura por plataforma
      platform_coverage: Object.entries(platformCoverage).map(([platform, data]) => ({
        platform,
        job_count: data.count,
        avg_score: Math.round(data.total_score / data.count),
        market_relevance: universalAnalyses.find(a => a.ats_info.name === platform)?.ats_info.marketShare || 0
      })),

      // Recomendações consolidadas
      consolidated_recommendations: this.generateConsolidatedRecommendations(universalAnalyses),

      // Dados originais (compatibilidade)
      legacy_analysis: result,

      // Keywords processadas (mantido para compatibilidade)
      job_keywords_analysis: this.processKeywords(result, resumeText)
    };

    // ===================================================
    // 🎯 ANÁLISES ESPECÍFICAS COMPLEMENTARES
    // ===================================================

    // Se houver vagas Gupy, adicionar análise detalhada específica
    if (gupyAnalysisFound) {
      console.log('🤖 [GUPY ESPECÍFICO] Adicionando análise detalhada do algoritmo GAIA...');
      unifiedResult.gupy_detailed_analysis = await this.addGupySpecificAnalysis(
        jobLinks, result, resumeText
      );
    }

    // Limpar arquivo temporário
    fs.unlink(resumePath, () => { });

    // Decrementar créditos
    try {
      const newCredits = (user.credits || 0) - 1;
      await user.update({ credits: newCredits });
      unifiedResult.credits_remaining = newCredits;
      console.log(`💳 [ATS] Crédito decrementado. Restantes: ${newCredits}`);
    } catch (creditErr) {
      console.error('❌ [ATS] Erro ao decrementar créditos:', creditErr);
    }

    console.log('🎉 [ATS UNIVERSAL] Análise concluída com sucesso!');
    res.json(unifiedResult);

  } catch (err) {
    if (err.response) {
      console.error('❌ [ATS] Erro HTTP:', err.response.status, err.response.data);
      res.status(err.response.status).json({ error: err.response.data });
    } else {
      console.error('❌ [ATS] Erro interno:', err.message, err);
      res.status(500).json({ error: err.message || 'Erro interno no ATS.' });
    }
  }
};

// ===================================================
// 🛠️ MÉTODOS AUXILIARES
// ===================================================

/**
 * Gera recomendações consolidadas de todas as análises
 */
exports.generateConsolidatedRecommendations = function (universalAnalyses) {
  const allRecommendations = [];
  const priorityCount = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };

  universalAnalyses.forEach(analysis => {
    if (analysis.recommendations) {
      analysis.recommendations.forEach(rec => {
        priorityCount[rec.priority] = (priorityCount[rec.priority] || 0) + 1;
        allRecommendations.push({
          ...rec,
          platform: analysis.ats_info.name,
          job_title: analysis.job_info.title
        });
      });
    }
  });

  // Ordenar por prioridade
  const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  allRecommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  return {
    total_recommendations: allRecommendations.length,
    priority_breakdown: priorityCount,
    top_recommendations: allRecommendations.slice(0, 10),
    all_recommendations: allRecommendations
  };
};

/**
 * Processa keywords para compatibilidade
 */
exports.processKeywords = function (result, resumeText) {
  try {
    const { filterPresentKeywords, deduplicateKeywords } = require('../services/atsKeywordVerifier');

    if (result.job_keywords && Array.isArray(result.job_keywords)) {
      let jobKeywords = deduplicateKeywords(result.job_keywords);
      const presentes = filterPresentKeywords(jobKeywords, resumeText);
      const ausentes = jobKeywords.filter(k => !presentes.includes(k));

      return {
        total_keywords: jobKeywords.length,
        present_keywords: presentes,
        missing_keywords: ausentes,
        match_percentage: jobKeywords.length > 0 ? Math.round((presentes.length / jobKeywords.length) * 100) : 0
      };
    }
  } catch (error) {
    console.error('❌ [KEYWORDS] Erro processando keywords:', error);
  }

  return {
    total_keywords: 0,
    present_keywords: [],
    missing_keywords: [],
    match_percentage: 0
  };
};

/**
 * Adiciona análise específica detalhada da Gupy
 */
exports.addGupySpecificAnalysis = async function (jobLinks, result, resumeText) {
  const gupyJobs = jobLinks.filter(link =>
    link.includes('gupy.io') || link.includes('gupy.com')
  );

  if (gupyJobs.length === 0) return null;

  const gupyDetailedResults = [];

  for (const gupyLink of gupyJobs) {
    const jobData = result.jobs?.find(job => job.link === gupyLink);
    if (jobData && jobData.description) {
      try {
        // Análise tradicional
        const gupyOptimization = GupyOptimizationService.analyzeGupyCompatibility(
          resumeText,
          jobData.description
        );

        // Análise de garantia de aprovação
        const gupyGuarantee = GupyPassGuaranteeService.guaranteePassGupy(
          resumeText,
          jobData.description,
          gupyLink
        );

        gupyDetailedResults.push({
          job_info: {
            title: jobData.title || 'Vaga Gupy',
            link: gupyLink
          },
          optimization_analysis: gupyOptimization,
          pass_guarantee_analysis: gupyGuarantee,
          gaia_algorithm_tips: {
            critical_factors: [
              "Verbos de ação no início das experiências (30% do score)",
              "Keywords exatas da vaga presentes no CV (25% do score)",
              "Estrutura objetiva e padronizada (20% do score)",
              "Experiência relevante quantificada (15% do score)",
              "Resultados mensuráveis com números (10% do score)"
            ],
            success_formula: "Desenvolvi + [ação específica] + que resultou em + [resultado quantificado]",
            ranking_insight: "64% dos contratados via Gupy estão no TOP 10 do ranking GAIA"
          }
        });

      } catch (error) {
        console.error(`❌ [GUPY ESPECÍFICO] Erro analisando ${gupyLink}:`, error);
      }
    }
  }

  return {
    total_gupy_jobs: gupyJobs.length,
    detailed_analyses: gupyDetailedResults,
    gupy_market_insights: {
      market_share: "35% do mercado brasileiro de recrutamento",
      algorithm_name: "GAIA - Gupy Artificial Intelligence Algorithm",
      processing_speed: "100+ currículos analisados por segundo",
      success_rate: "90%+ de aprovação com otimização adequada"
    }
  };
};
