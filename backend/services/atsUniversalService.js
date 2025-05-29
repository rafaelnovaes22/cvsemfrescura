/**
 * 🌟 ATS UNIVERSAL SERVICE - TODOS OS PRINCIPAIS ATS DO BRASIL
 * 
 * Este serviço detecta automaticamente o tipo de ATS da vaga e aplica
 * as otimizações específicas para cada plataforma:
 * 
 * 🎯 SISTEMAS SUPORTADOS:
 * - Gupy (algoritmo GAIA) - 35% do mercado
 * - LinkedIn Jobs - 25% do mercado  
 * - Catho - 15% do mercado
 * - Indeed - 10% do mercado
 * - InfoJobs - 5% do mercado
 * - Vagas.com - 4% do mercado
 * - 99Jobs - 3% do mercado
 * - Outros ATS - 3% do mercado
 */

const GupyOptimizationService = require('./gupyOptimizationService');
const GupyPassGuaranteeService = require('./gupyPassGuaranteeService');
const ATSUniversalHelpers = require('./atsUniversalHelpers');

class ATSUniversalService {

    /**
     * Detecta automaticamente o tipo de ATS baseado na URL da vaga
     */
    static detectATSType(jobUrl) {
        const url = jobUrl.toLowerCase();

        if (url.includes('gupy.io') || url.includes('gupy.com')) {
            return {
                type: 'GUPY',
                name: 'Gupy',
                algorithm: 'GAIA',
                marketShare: 35,
                complexity: 'ALTA',
                features: ['200+ métricas', 'Verbos de ação críticos', 'Keywords eliminatórias']
            };
        }

        if (url.includes('linkedin.com/jobs')) {
            return {
                type: 'LINKEDIN',
                name: 'LinkedIn Jobs',
                algorithm: 'LinkedIn Recruiter System',
                marketShare: 25,
                complexity: 'ALTA',
                features: ['Skills matching', 'Experience weighting', 'Industry alignment']
            };
        }

        if (url.includes('catho.com')) {
            return {
                type: 'CATHO',
                name: 'Catho',
                algorithm: 'Catho ATS',
                marketShare: 15,
                complexity: 'MÉDIA',
                features: ['Keyword density', 'Profile completeness', 'Regional matching']
            };
        }

        if (url.includes('indeed.com') || url.includes('indeed.com.br')) {
            return {
                type: 'INDEED',
                name: 'Indeed',
                algorithm: 'Indeed ATS',
                marketShare: 10,
                complexity: 'MÉDIA',
                features: ['Simple keyword matching', 'Experience relevance', 'Geographic proximity']
            };
        }

        if (url.includes('infojobs.com.br')) {
            return {
                type: 'INFOJOBS',
                name: 'InfoJobs',
                algorithm: 'InfoJobs Matching',
                marketShare: 5,
                complexity: 'MÉDIA',
                features: ['European standards', 'Education weighting', 'Language skills']
            };
        }

        if (url.includes('vagas.com') || url.includes('vagas.com.br')) {
            return {
                type: 'VAGAS',
                name: 'Vagas.com',
                algorithm: 'Vagas ATS',
                marketShare: 4,
                complexity: 'BAIXA',
                features: ['Basic matching', 'Location priority', 'Simple filtering']
            };
        }

        if (url.includes('99jobs.com') || url.includes('99freelas.com.br')) {
            return {
                type: 'JOBS99',
                name: '99Jobs',
                algorithm: '99Jobs Matching',
                marketShare: 3,
                complexity: 'BAIXA',
                features: ['Tech focus', 'Salary matching', 'Remote work priority']
            };
        }

        // Outros ATS brasileiros
        if (url.includes('trampos.co')) {
            return {
                type: 'TRAMPOS',
                name: 'Trampos.co',
                algorithm: 'Trampos Matching',
                marketShare: 1,
                complexity: 'BAIXA',
                features: ['Tech startups', 'Culture fit', 'Modern approach']
            };
        }

        if (url.includes('workana.com')) {
            return {
                type: 'WORKANA',
                name: 'Workana',
                algorithm: 'Freelancer Matching',
                marketShare: 1,
                complexity: 'BAIXA',
                features: ['Freelancer focus', 'Project matching', 'Rating system']
            };
        }

        if (url.includes('jobs.net.br')) {
            return {
                type: 'JOBSNET',
                name: 'Jobs.net',
                algorithm: 'Jobs.net ATS',
                marketShare: 1,
                complexity: 'BAIXA',
                features: ['Simple matching', 'Regional focus', 'Basic filters']
            };
        }

        // ATS genérico para empresas próprias
        return {
            type: 'GENERIC',
            name: 'ATS Corporativo',
            algorithm: 'Sistema Interno',
            marketShare: 3,
            complexity: 'VARIÁVEL',
            features: ['Custom rules', 'Company specific', 'Variable criteria']
        };
    }

    /**
     * Analisa compatibilidade universal para qualquer ATS
     */
    static async analyzeUniversalCompatibility(resumeText, jobDescription, jobUrl) {
        const ats = this.detectATSType(jobUrl);
        console.log(`🎯 [ATS UNIVERSAL] Detectado: ${ats.name} (${ats.type}) - ${ats.marketShare}% do mercado`);

        const analysis = {
            ats_info: ats,
            platform_specific: {},
            universal_score: 0,
            recommendations: [],
            optimization_level: 'STANDARD'
        };

        switch (ats.type) {
            case 'GUPY':
                analysis.platform_specific = await this.optimizeForGupy(resumeText, jobDescription, jobUrl);
                analysis.optimization_level = 'ADVANCED';
                break;

            case 'LINKEDIN':
                analysis.platform_specific = this.optimizeForLinkedIn(resumeText, jobDescription);
                analysis.optimization_level = 'ADVANCED';
                break;

            case 'CATHO':
                analysis.platform_specific = this.optimizeForCatho(resumeText, jobDescription);
                analysis.optimization_level = 'INTERMEDIATE';
                break;

            case 'INDEED':
                analysis.platform_specific = this.optimizeForIndeed(resumeText, jobDescription);
                analysis.optimization_level = 'INTERMEDIATE';
                break;

            case 'INFOJOBS':
                analysis.platform_specific = this.optimizeForInfoJobs(resumeText, jobDescription);
                analysis.optimization_level = 'INTERMEDIATE';
                break;

            case 'VAGAS':
                analysis.platform_specific = this.optimizeForVagas(resumeText, jobDescription);
                analysis.optimization_level = 'BASIC';
                break;

            case 'JOBS99':
                analysis.platform_specific = this.optimizeFor99Jobs(resumeText, jobDescription);
                analysis.optimization_level = 'BASIC';
                break;

            default:
                analysis.platform_specific = this.optimizeForGeneric(resumeText, jobDescription);
                analysis.optimization_level = 'STANDARD';
                break;
        }

        // Score universal baseado na otimização específica
        analysis.universal_score = this.calculateUniversalScore(analysis.platform_specific, ats);

        // Recomendações específicas da plataforma
        analysis.recommendations = this.generatePlatformRecommendations(analysis.platform_specific, ats);

        return analysis;
    }

    /**
     * 🎯 GUPY - Otimização específica para algoritmo GAIA
     */
    static async optimizeForGupy(resumeText, jobDescription, jobUrl) {
        console.log('🤖 [GUPY] Aplicando otimização específica para algoritmo GAIA...');

        // Usar serviços existentes especializados
        const gupyAnalysis = GupyOptimizationService.analyzeGupyCompatibility(resumeText, jobDescription);
        const gupyGuarantee = GupyPassGuaranteeService.guaranteePassGupy(resumeText, jobDescription, jobUrl);

        return {
            algorithm: 'GAIA',
            gaia_score: gupyAnalysis.score,
            pass_guarantee: gupyGuarantee,
            critical_factors: [
                'Verbos de ação no início (30% do score)',
                'Keywords exatas da vaga (25% do score)',
                'Estrutura padronizada (20% do score)',
                'Experiência relevante (15% do score)',
                'Resultados quantificados (10% do score)'
            ],
            optimization_tips: [
                'Inicie TODAS as experiências com verbos de ação: "Desenvolvi", "Implementei", "Gerenciei"',
                'Repita palavras-chave da vaga 2-3 vezes em contextos diferentes',
                'Use formato: "Empresa | Cargo | Período (MM/AAAA - MM/AAAA)"',
                'Inclua números específicos: "Aumentei vendas em 25%"',
                'Organize em: Experiência → Formação → Habilidades → Certificações'
            ],
            compatibility_factors: gupyAnalysis
        };
    }

    /**
     * 💼 LINKEDIN - Otimização para LinkedIn Recruiter System
     */
    static optimizeForLinkedIn(resumeText, jobDescription) {
        console.log('💼 [LINKEDIN] Aplicando otimização para LinkedIn Recruiter System...');

        const analysis = {
            algorithm: 'LinkedIn Recruiter System',
            score: 0,
            skills_matching: this.analyzeLinkedInSkills(resumeText, jobDescription),
            experience_weighting: this.analyzeLinkedInExperience(resumeText, jobDescription),
            industry_alignment: this.analyzeIndustryAlignment(resumeText, jobDescription),
            network_signals: this.analyzeNetworkSignals(resumeText)
        };

        // LinkedIn prioriza: Skills (40%) + Experience (30%) + Industry (20%) + Network (10%)
        analysis.score = Math.round(
            (analysis.skills_matching.score * 0.4) +
            (analysis.experience_weighting.score * 0.3) +
            (analysis.industry_alignment.score * 0.2) +
            (analysis.network_signals.score * 0.1)
        );

        return analysis;
    }

    /**
     * 🏢 CATHO - Otimização para Catho ATS
     */
    static optimizeForCatho(resumeText, jobDescription) {
        console.log('🏢 [CATHO] Aplicando otimização para Catho ATS...');

        const analysis = {
            algorithm: 'Catho ATS',
            score: 0,
            keyword_density: this.analyzeCathoKeywords(resumeText, jobDescription),
            profile_completeness: this.analyzeCathoCompleteness(resumeText),
            regional_matching: this.analyzeCathoRegional(resumeText, jobDescription),
            education_focus: this.analyzeCathoEducation(resumeText)
        };

        // Catho prioriza: Keywords (35%) + Completeness (25%) + Regional (25%) + Education (15%)
        analysis.score = Math.round(
            (analysis.keyword_density.score * 0.35) +
            (analysis.profile_completeness.score * 0.25) +
            (analysis.regional_matching.score * 0.25) +
            (analysis.education_focus.score * 0.15)
        );

        return analysis;
    }

    /**
     * 🔍 INDEED - Otimização para Indeed ATS
     */
    static optimizeForIndeed(resumeText, jobDescription) {
        console.log('🔍 [INDEED] Aplicando otimização para Indeed ATS...');

        const analysis = {
            algorithm: 'Indeed ATS',
            score: 0,
            simple_matching: this.analyzeIndeedKeywords(resumeText, jobDescription),
            experience_relevance: this.analyzeIndeedExperience(resumeText, jobDescription),
            geographic_proximity: this.analyzeIndeedLocation(resumeText, jobDescription),
            title_matching: this.analyzeIndeedTitles(resumeText, jobDescription)
        };

        // Indeed prioriza: Keywords (40%) + Experience (30%) + Geography (20%) + Titles (10%)
        analysis.score = Math.round(
            (analysis.simple_matching.score * 0.4) +
            (analysis.experience_relevance.score * 0.3) +
            (analysis.geographic_proximity.score * 0.2) +
            (analysis.title_matching.score * 0.1)
        );

        return analysis;
    }

    /**
     * 🇪🇺 INFOJOBS - Otimização para InfoJobs (padrões europeus)
     */
    static optimizeForInfoJobs(resumeText, jobDescription) {
        console.log('🇪🇺 [INFOJOBS] Aplicando otimização para InfoJobs...');

        const analysis = {
            algorithm: 'InfoJobs European Standard',
            score: 0,
            european_format: this.analyzeInfoJobsFormat(resumeText),
            education_weight: this.analyzeInfoJobsEducation(resumeText, jobDescription),
            language_skills: this.analyzeInfoJobsLanguages(resumeText),
            certification_focus: this.analyzeInfoJobsCertifications(resumeText)
        };

        // InfoJobs prioriza: Format (25%) + Education (30%) + Languages (25%) + Certifications (20%)
        analysis.score = Math.round(
            (analysis.european_format.score * 0.25) +
            (analysis.education_weight.score * 0.3) +
            (analysis.language_skills.score * 0.25) +
            (analysis.certification_focus.score * 0.2)
        );

        return analysis;
    }

    /**
     * 📋 VAGAS.COM - Otimização para Vagas.com
     */
    static optimizeForVagas(resumeText, jobDescription) {
        console.log('📋 [VAGAS] Aplicando otimização para Vagas.com...');

        const analysis = {
            algorithm: 'Vagas Basic Matching',
            score: 0,
            basic_keywords: this.analyzeVagasKeywords(resumeText, jobDescription),
            location_priority: this.analyzeVagasLocation(resumeText, jobDescription),
            simple_filters: this.analyzeVagasFilters(resumeText, jobDescription)
        };

        // Vagas.com: Keywords (50%) + Location (30%) + Filters (20%)
        analysis.score = Math.round(
            (analysis.basic_keywords.score * 0.5) +
            (analysis.location_priority.score * 0.3) +
            (analysis.simple_filters.score * 0.2)
        );

        return analysis;
    }

    /**
     * 💻 99JOBS - Otimização para 99Jobs (foco tech)
     */
    static optimizeFor99Jobs(resumeText, jobDescription) {
        console.log('💻 [99JOBS] Aplicando otimização para 99Jobs...');

        const analysis = {
            algorithm: '99Jobs Tech Matching',
            score: 0,
            tech_focus: this.analyze99JobsTech(resumeText, jobDescription),
            salary_matching: this.analyze99JobsSalary(resumeText, jobDescription),
            remote_priority: this.analyze99JobsRemote(resumeText, jobDescription),
            stack_alignment: this.analyze99JobsStack(resumeText, jobDescription)
        };

        // 99Jobs: Tech (40%) + Stack (30%) + Remote (20%) + Salary (10%)
        analysis.score = Math.round(
            (analysis.tech_focus.score * 0.4) +
            (analysis.stack_alignment.score * 0.3) +
            (analysis.remote_priority.score * 0.2) +
            (analysis.salary_matching.score * 0.1)
        );

        return analysis;
    }

    /**
     * ⚙️ GENERIC - Otimização genérica para ATS corporativos
     */
    static optimizeForGeneric(resumeText, jobDescription) {
        console.log('⚙️ [GENERIC] Aplicando otimização genérica para ATS corporativo...');

        const analysis = {
            algorithm: 'Generic ATS',
            score: 0,
            keyword_matching: this.analyzeGenericKeywords(resumeText, jobDescription),
            format_compliance: this.analyzeGenericFormat(resumeText),
            experience_match: this.analyzeGenericExperience(resumeText, jobDescription),
            completeness: this.analyzeGenericCompleteness(resumeText)
        };

        // Generic: Keywords (40%) + Experience (30%) + Format (20%) + Completeness (10%)
        analysis.score = Math.round(
            (analysis.keyword_matching.score * 0.4) +
            (analysis.experience_match.score * 0.3) +
            (analysis.format_compliance.score * 0.2) +
            (analysis.completeness.score * 0.1)
        );

        return analysis;
    }

    // ================================
    // 🔗 DELEGAÇÃO PARA MÉTODOS AUXILIARES
    // ================================

    // LinkedIn methods
    static analyzeLinkedInSkills(resumeText, jobDescription) {
        return ATSUniversalHelpers.analyzeLinkedInSkills(resumeText, jobDescription);
    }

    static analyzeLinkedInExperience(resumeText, jobDescription) {
        return ATSUniversalHelpers.analyzeLinkedInExperience(resumeText, jobDescription);
    }

    static analyzeIndustryAlignment(resumeText, jobDescription) {
        return ATSUniversalHelpers.analyzeIndustryAlignment(resumeText, jobDescription);
    }

    static analyzeNetworkSignals(resumeText) {
        return ATSUniversalHelpers.analyzeNetworkSignals(resumeText);
    }

    // Catho methods
    static analyzeCathoKeywords(resumeText, jobDescription) {
        return ATSUniversalHelpers.analyzeCathoKeywords(resumeText, jobDescription);
    }

    static analyzeCathoCompleteness(resumeText) {
        return ATSUniversalHelpers.analyzeCathoCompleteness(resumeText);
    }

    static analyzeCathoRegional(resumeText, jobDescription) {
        return ATSUniversalHelpers.analyzeCathoRegional(resumeText, jobDescription);
    }

    static analyzeCathoEducation(resumeText) {
        return ATSUniversalHelpers.analyzeCathoEducation(resumeText);
    }

    // Indeed methods
    static analyzeIndeedKeywords(resumeText, jobDescription) {
        return ATSUniversalHelpers.analyzeIndeedKeywords(resumeText, jobDescription);
    }

    static analyzeIndeedExperience(resumeText, jobDescription) {
        return ATSUniversalHelpers.analyzeIndeedExperience(resumeText, jobDescription);
    }

    static analyzeIndeedLocation(resumeText, jobDescription) {
        return ATSUniversalHelpers.analyzeIndeedLocation(resumeText, jobDescription);
    }

    static analyzeIndeedTitles(resumeText, jobDescription) {
        return ATSUniversalHelpers.analyzeIndeedTitles(resumeText, jobDescription);
    }

    // InfoJobs methods
    static analyzeInfoJobsFormat(resumeText) {
        return ATSUniversalHelpers.analyzeInfoJobsFormat(resumeText);
    }

    static analyzeInfoJobsEducation(resumeText, jobDescription) {
        return ATSUniversalHelpers.analyzeInfoJobsEducation(resumeText, jobDescription);
    }

    static analyzeInfoJobsLanguages(resumeText) {
        return ATSUniversalHelpers.analyzeInfoJobsLanguages(resumeText);
    }

    static analyzeInfoJobsCertifications(resumeText) {
        return ATSUniversalHelpers.analyzeInfoJobsCertifications(resumeText);
    }

    // Vagas.com methods
    static analyzeVagasKeywords(resumeText, jobDescription) {
        return ATSUniversalHelpers.analyzeVagasKeywords(resumeText, jobDescription);
    }

    static analyzeVagasLocation(resumeText, jobDescription) {
        return ATSUniversalHelpers.analyzeVagasLocation(resumeText, jobDescription);
    }

    static analyzeVagasFilters(resumeText, jobDescription) {
        return ATSUniversalHelpers.analyzeVagasFilters(resumeText, jobDescription);
    }

    // 99Jobs methods
    static analyze99JobsTech(resumeText, jobDescription) {
        return ATSUniversalHelpers.analyze99JobsTech(resumeText, jobDescription);
    }

    static analyze99JobsSalary(resumeText, jobDescription) {
        return ATSUniversalHelpers.analyze99JobsSalary(resumeText, jobDescription);
    }

    static analyze99JobsRemote(resumeText, jobDescription) {
        return ATSUniversalHelpers.analyze99JobsRemote(resumeText, jobDescription);
    }

    static analyze99JobsStack(resumeText, jobDescription) {
        return ATSUniversalHelpers.analyze99JobsStack(resumeText, jobDescription);
    }

    // Generic methods
    static analyzeGenericKeywords(resumeText, jobDescription) {
        return ATSUniversalHelpers.analyzeGenericKeywords(resumeText, jobDescription);
    }

    static analyzeGenericFormat(resumeText) {
        return ATSUniversalHelpers.analyzeGenericFormat(resumeText);
    }

    static analyzeGenericExperience(resumeText, jobDescription) {
        return ATSUniversalHelpers.analyzeGenericExperience(resumeText, jobDescription);
    }

    static analyzeGenericCompleteness(resumeText) {
        return ATSUniversalHelpers.analyzeGenericCompleteness(resumeText);
    }

    /**
     * Calcula score universal baseado na otimização específica
     */
    static calculateUniversalScore(platformAnalysis, atsInfo) {
        // Para Gupy, usar gaia_score ao invés de score
        let baseScore = 0;
        if (atsInfo.type === 'GUPY') {
            baseScore = platformAnalysis.gaia_score || 0;
        } else {
            baseScore = platformAnalysis.score || 0;
        }

        // Ajuste baseado na complexidade do ATS
        if (atsInfo.complexity === 'ALTA') {
            baseScore = baseScore * 0.95; // ATS mais rigorosos
        } else if (atsInfo.complexity === 'BAIXA') {
            baseScore = baseScore * 1.05; // ATS mais simples
        }

        return Math.min(100, Math.max(0, Math.round(baseScore)));
    }

    /**
     * Gera recomendações específicas da plataforma
     */
    static generatePlatformRecommendations(platformAnalysis, atsInfo) {
        const recommendations = [];

        // Recomendações específicas por tipo de ATS
        switch (atsInfo.type) {
            case 'GUPY':
                recommendations.push({
                    priority: 'CRITICAL',
                    title: 'Otimização GAIA Obrigatória',
                    description: 'Use verbos de ação no início de TODAS as experiências para garantir aprovação',
                    impact: '+30% no score final'
                });
                break;

            case 'LINKEDIN':
                recommendations.push({
                    priority: 'HIGH',
                    title: 'Skills LinkedIn Optimized',
                    description: 'Adicione skills que aparecem nas "hard skills" da vaga',
                    impact: '+25% no score final'
                });
                break;

            case 'CATHO':
                recommendations.push({
                    priority: 'MEDIUM',
                    title: 'Completude do Perfil Catho',
                    description: 'Preencha todos os campos: idiomas, cursos, certificações',
                    impact: '+20% no score final'
                });
                break;

            default:
                recommendations.push({
                    priority: 'MEDIUM',
                    title: 'Otimização Genérica ATS',
                    description: 'Use palavras-chave da vaga e mantenha formato limpo',
                    impact: '+15% no score final'
                });
        }

        return recommendations;
    }
}

module.exports = ATSUniversalService; 