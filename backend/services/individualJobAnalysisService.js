const textExtractor = require('../utils/textExtractor');
const urlExtractor = require('../utils/urlExtractor');
const openaiService = require('./openaiService');
const relevantScraper = require('../utils/relevantJobScraper');

/**
 * Serviço para análise individual de vagas
 * Processa cada vaga separadamente e retorna feedback específico
 */

function buildIndividualJobPrompt(jobText, resumeText, jobTitle = '', jobLink = '') {
    return `Responda sempre em português do Brasil.
Você é um sistema ATS especialista em análise de currículos comparando com UMA VAGA ESPECÍFICA.

VAGA ANALISADA: ${jobTitle || 'Vaga sem título'}
LINK: ${jobLink || 'Link não informado'}

INSTRUÇÕES PARA ANÁLISE INDIVIDUAL:

1. Extraia APENAS as palavras-chave e requisitos desta vaga específica:
   - Liste em "job_keywords" todos os termos relevantes DESTA vaga
   - Remova duplicidades e mantenha apenas termos únicos
   - Inclua: tecnologias, ferramentas, competências, requisitos, qualificações específicas

2. Compare o currículo especificamente com ESTA vaga:
   - "job_keywords_present": palavras-chave desta vaga que estão no currículo
   - "job_keywords_missing": palavras-chave desta vaga que faltam no currículo
   - Seja literal: só marque como presente se aparecer explicitamente no currículo

3. Calcule um SCORE DE COMPATIBILIDADE (0-100) para esta vaga específica:
   - Base: (palavras presentes / total palavras) * 100
   - Ajuste considerando: relevância da experiência, formação adequada, fit cultural
   - Seja criterioso: score alto apenas se realmente compatível

4. Avalie o currículo especificamente para ESTA vaga:
   - Resumo: Como se apresenta para esta oportunidade específica?
   - Experiência: Quanto da experiência é relevante para esta vaga?
   - Habilidades: Quais habilidades desta vaga o candidato possui/falta?
   - Formação: A formação é adequada para esta posição?
   - Idiomas: Esta vaga exige idiomas específicos? O candidato atende?
   - Info Pessoais: Localização, disponibilidade são compatíveis?

Para cada seção, forneça:
- NOTA (0-10) específica para esta vaga
- AVALIAÇÃO focada na compatibilidade com esta oportunidade
- SUGESTÕES direcionadas para aumentar as chances nesta vaga específica

5. Recomendações específicas para esta vaga:
   - O que adicionar/remover do currículo para esta oportunidade
   - Como destacar experiências relevantes para esta posição
   - Palavras-chave importantes para incluir
   - Ajustes de formatação se necessário

6. Conclusão sobre fit com esta vaga específica:
   - Nível de aderência (Alto/Médio/Baixo)
   - Principais pontos fortes para esta vaga
   - Principais gaps para esta oportunidade
   - Probabilidade de aprovação no ATS

VAGA:
${jobText}

CURRÍCULO:
${resumeText}

Responda em JSON:
{
  "job_title": "${jobTitle || 'Vaga analisada'}",
  "job_link": "${jobLink || ''}",
  "compatibility_score": 0,
  "job_keywords": [],
  "job_keywords_present": [],
  "job_keywords_missing": [],
  "fit_level": "Alto|Médio|Baixo",
  "strengths_for_this_job": [],
  "gaps_for_this_job": [],
  "ats_probability": 0,
  "resumo": { "nota": 0, "avaliacao": "", "sugestoes": [] },
  "experiencia_profissional": { "nota": 0, "avaliacao": "", "sugestoes": [] },
  "habilidades": { "nota": 0, "avaliacao": "", "sugestoes": [] },
  "formacao": { "nota": 0, "avaliacao": "", "sugestoes": [] },
  "idiomas": { "nota": 0, "avaliacao": "", "sugestoes": [] },
  "informacoes_pessoais": { "nota": 0, "avaliacao": "", "sugestoes": [] },
  "recommendations_for_this_job": [],
  "conclusion": ""
}`;
}

/**
 * Analisa uma vaga individual
 */
async function analyzeIndividualJob(resumeText, jobLink, jobTitle = '') {
    try {
        console.log(`[Individual] Analisando vaga: ${jobTitle || jobLink}`);

        // Extrair conteúdo da vaga
        const jobText = await relevantScraper.extractRelevantSections(jobLink);

        if (!jobText || jobText.trim().length === 0) {
            throw new Error(`Não foi possível extrair conteúdo da vaga: ${jobLink}`);
        }

        // Criar prompt específico para esta vaga
        const prompt = buildIndividualJobPrompt(jobText, resumeText, jobTitle, jobLink);

        // Analisar com IA
        const result = await openaiService.extractATSDataRaw(prompt);

        console.log(`[Individual] ✅ Análise concluída para: ${jobTitle || jobLink}`);
        return result;

    } catch (error) {
        console.error(`[Individual] ❌ Erro ao analisar vaga ${jobLink}:`, error.message);
        return {
            job_title: jobTitle || 'Erro na análise',
            job_link: jobLink,
            compatibility_score: 0,
            error: error.message,
            fit_level: "Erro",
            strengths_for_this_job: [],
            gaps_for_this_job: [],
            ats_probability: 0,
            conclusion: `Erro ao analisar esta vaga: ${error.message}`
        };
    }
}

/**
 * Processa múltiplas vagas individualmente
 */
async function processIndividualJobs(resumePath, jobLinks) {
    console.log(`[Individual] Iniciando análise individual de ${jobLinks.length} vagas`);

    // Extrair texto do currículo
    const resumeText = await textExtractor.extract(resumePath);

    const results = [];

    // Processar cada vaga separadamente
    for (let i = 0; i < jobLinks.length; i++) {
        const jobLink = jobLinks[i];
        const jobTitle = `Vaga ${i + 1}`;

        console.log(`[Individual] Processando ${i + 1}/${jobLinks.length}: ${jobLink}`);

        try {
            const analysis = await analyzeIndividualJob(resumeText, jobLink, jobTitle);
            results.push(analysis);

            // Pequeno delay para não sobrecarregar APIs
            if (i < jobLinks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

        } catch (error) {
            console.error(`[Individual] Erro na vaga ${jobLink}:`, error);
            results.push({
                job_title: jobTitle,
                job_link: jobLink,
                error: error.message,
                compatibility_score: 0,
                fit_level: "Erro"
            });
        }
    }

    console.log(`[Individual] ✅ Análise individual concluída: ${results.length} vagas processadas`);

    return {
        individual_jobs: results,
        summary: generateSummary(results),
        total_jobs: results.length,
        successful_analyses: results.filter(r => !r.error).length,
        failed_analyses: results.filter(r => r.error).length
    };
}

/**
 * Gera resumo das análises individuais
 */
function generateSummary(results) {
    const validResults = results.filter(r => !r.error && r.compatibility_score !== undefined);

    if (validResults.length === 0) {
        return {
            average_compatibility: 0,
            best_fit_job: null,
            worst_fit_job: null,
            total_keywords_missing: 0,
            overall_recommendation: "Não foi possível analisar nenhuma vaga com sucesso."
        };
    }

    const scores = validResults.map(r => r.compatibility_score || 0);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    const bestFit = validResults.reduce((best, current) =>
        (current.compatibility_score || 0) > (best.compatibility_score || 0) ? current : best
    );

    const worstFit = validResults.reduce((worst, current) =>
        (current.compatibility_score || 0) < (worst.compatibility_score || 0) ? current : worst
    );

    const allMissingKeywords = validResults.flatMap(r => r.job_keywords_missing || []);
    const uniqueMissingKeywords = [...new Set(allMissingKeywords)];

    return {
        average_compatibility: Math.round(avgScore),
        best_fit_job: {
            title: bestFit.job_title,
            link: bestFit.job_link,
            score: bestFit.compatibility_score
        },
        worst_fit_job: {
            title: worstFit.job_title,
            link: worstFit.job_link,
            score: worstFit.compatibility_score
        },
        total_keywords_missing: uniqueMissingKeywords.length,
        most_common_missing_keywords: getMostCommonKeywords(allMissingKeywords).slice(0, 10),
        overall_recommendation: avgScore >= 70 ?
            "Seu currículo tem boa compatibilidade geral com as vagas analisadas." :
            avgScore >= 50 ?
                "Seu currículo tem compatibilidade moderada. Algumas melhorias podem aumentar suas chances." :
                "Recomendamos ajustes significativos no currículo para melhor aderência às vagas."
    };
}

/**
 * Encontra as palavras-chave mais comuns que estão faltando
 */
function getMostCommonKeywords(keywords) {
    const frequency = {};
    keywords.forEach(keyword => {
        frequency[keyword] = (frequency[keyword] || 0) + 1;
    });

    return Object.entries(frequency)
        .sort(([, a], [, b]) => b - a)
        .map(([keyword]) => keyword);
}

module.exports = {
    processIndividualJobs,
    analyzeIndividualJob,
    generateSummary
}; 