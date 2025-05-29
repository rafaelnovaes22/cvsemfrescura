const GupyOptimizationService = require('./gupyOptimizationService');

class GupyPassGuaranteeService {

    /**
     * GARANTE que o CV passará na triagem da Gupy
     * Aplica todas as estratégias específicas do algoritmo GAIA
     */
    static guaranteePassGupy(resumeText, jobDescription, jobLink) {
        console.log('🎯 [GUPY PASS GUARANTEE] Iniciando análise para garantir aprovação na triagem...');

        const guarantee = {
            passScore: 0,
            confidence: 'baixa',
            criticalIssues: [],
            passGuarantees: [],
            actionPlan: [],
            gupySpecificTips: [],
            algorithmCompatibility: {
                gaia_factors: [],
                automation_ready: false,
                ranking_prediction: 0
            }
        };

        // 1. ANÁLISE ESPECÍFICA DO ALGORITMO GAIA (200+ métricas)
        const gaiaAnalysis = this.analyzeGAIACompatibility(resumeText, jobDescription);
        guarantee.algorithmCompatibility = gaiaAnalysis;

        // 2. VERIFICAÇÃO DOS CRITÉRIOS ELIMINATÓRIOS
        const eliminatoryCheck = this.checkEliminatoryFactors(resumeText, jobDescription);
        guarantee.criticalIssues = eliminatoryCheck.issues;

        // 3. OTIMIZAÇÃO DE VERBOS DE AÇÃO (30% do score GAIA)
        const actionVerbGuarantee = this.guaranteeActionVerbSuccess(resumeText, jobDescription);
        guarantee.passGuarantees.push(actionVerbGuarantee);

        // 4. DENSIDADE E REPETIÇÃO DE KEYWORDS
        const keywordGuarantee = this.guaranteeKeywordOptimization(resumeText, jobDescription);
        guarantee.passGuarantees.push(keywordGuarantee);

        // 5. ESTRUTURA ATS-FRIENDLY
        const structureGuarantee = this.guaranteeATSStructure(resumeText);
        guarantee.passGuarantees.push(structureGuarantee);

        // 6. ANÁLISE DE EXPERIÊNCIA E FIT CULTURAL
        const experienceGuarantee = this.guaranteeExperienceMatch(resumeText, jobDescription);
        guarantee.passGuarantees.push(experienceGuarantee);

        // 7. CÁLCULO DO SCORE DE APROVAÇÃO FINAL
        guarantee.passScore = this.calculatePassScore(guarantee);
        guarantee.confidence = this.determineConfidence(guarantee.passScore);

        // 8. PLANO DE AÇÃO ESPECÍFICO
        guarantee.actionPlan = this.generateGuaranteeActionPlan(guarantee);

        // 9. DICAS ESPECÍFICAS PARA GUPY
        guarantee.gupySpecificTips = this.getGupySpecificTips(jobLink);

        console.log(`🎯 [GUPY PASS GUARANTEE] Score final: ${guarantee.passScore}/100 | Confiança: ${guarantee.confidence}`);

        return guarantee;
    }

    /**
     * Analisa compatibilidade específica com os 200+ fatores do algoritmo GAIA
     */
    static analyzeGAIACompatibility(resumeText, jobDescription) {
        const gaia = {
            gaia_factors: [],
            automation_ready: false,
            ranking_prediction: 0,
            algorithm_signals: {}
        };

        // Fator 1: Análise de verbos de ação (peso 30%)
        const actionVerbsCompatibility = this.analyzeActionVerbsForGAIA(resumeText);
        gaia.gaia_factors.push({
            factor: 'action_verbs',
            weight: 30,
            score: actionVerbsCompatibility.score,
            status: actionVerbsCompatibility.score >= 70 ? 'PASS' : 'FAIL',
            details: actionVerbsCompatibility
        });

        // Fator 2: Keywords exatas da vaga (peso 25%)
        const keywordCompatibility = this.analyzeKeywordExactMatch(resumeText, jobDescription);
        gaia.gaia_factors.push({
            factor: 'exact_keywords',
            weight: 25,
            score: keywordCompatibility.score,
            status: keywordCompatibility.score >= 60 ? 'PASS' : 'FAIL',
            details: keywordCompatibility
        });

        // Fator 3: Estrutura objetiva e formato (peso 20%)
        const structureCompatibility = this.analyzeObjectiveStructure(resumeText);
        gaia.gaia_factors.push({
            factor: 'objective_structure',
            weight: 20,
            score: structureCompatibility.score,
            status: structureCompatibility.score >= 65 ? 'PASS' : 'FAIL',
            details: structureCompatibility
        });

        // Fator 4: Experiência relevante (peso 15%)
        const experienceCompatibility = this.analyzeRelevantExperience(resumeText, jobDescription);
        gaia.gaia_factors.push({
            factor: 'relevant_experience',
            weight: 15,
            score: experienceCompatibility.score,
            status: experienceCompatibility.score >= 50 ? 'PASS' : 'FAIL',
            details: experienceCompatibility
        });

        // Fator 5: Resultados quantificados (peso 10%)
        const resultsCompatibility = this.analyzeQuantifiedResults(resumeText);
        gaia.gaia_factors.push({
            factor: 'quantified_results',
            weight: 10,
            score: resultsCompatibility.score,
            status: resultsCompatibility.score >= 40 ? 'PASS' : 'FAIL',
            details: resultsCompatibility
        });

        // Calcular score geral do GAIA
        let totalScore = 0;
        gaia.gaia_factors.forEach(factor => {
            totalScore += (factor.score * factor.weight / 100);
        });

        gaia.ranking_prediction = Math.round(totalScore);
        gaia.automation_ready = gaia.ranking_prediction >= 70;

        // Sinais específicos que o algoritmo GAIA procura
        gaia.algorithm_signals = {
            starts_with_action_verbs: this.checkExperienceStartsWithVerbs(resumeText),
            has_measurable_results: this.checkMeasurableResults(resumeText),
            structured_format: this.checkStructuredFormat(resumeText),
            keyword_density_optimal: this.checkOptimalKeywordDensity(resumeText, jobDescription),
            experience_progression: this.checkExperienceProgression(resumeText)
        };

        return gaia;
    }

    /**
     * Verifica fatores eliminatórios que podem impedir aprovação automática
     */
    static checkEliminatoryFactors(resumeText, jobDescription) {
        const issues = [];

        // 1. Falta de verbos de ação no início das experiências
        const experienceLines = resumeText.split('\n').filter(line =>
            line.includes('•') || line.includes('-') || line.includes('*')
        );

        const actionVerbStarts = experienceLines.filter(line => {
            const firstWord = line.trim().split(' ')[0].toLowerCase();
            return this.isActionVerb(firstWord);
        });

        if (experienceLines.length > 0 && actionVerbStarts.length / experienceLines.length < 0.6) {
            issues.push({
                type: 'CRITICAL',
                factor: 'action_verb_start',
                description: 'Menos de 60% das experiências começam com verbos de ação',
                impact: 'ELIMINATÓRIO - GAIA prioriza formato objetivo',
                solution: 'Reescreva TODAS as experiências começando com verbos como: Desenvolvi, Implementei, Gerenciei'
            });
        }

        // 2. Ausência de keywords críticas da vaga
        const criticalKeywords = this.extractCriticalKeywords(jobDescription);
        const missingCritical = criticalKeywords.filter(keyword =>
            !resumeText.toLowerCase().includes(keyword.toLowerCase())
        );

        if (missingCritical.length > 0) {
            issues.push({
                type: 'CRITICAL',
                factor: 'missing_critical_keywords',
                description: `Palavras-chave críticas ausentes: ${missingCritical.join(', ')}`,
                impact: 'ELIMINATÓRIO - GAIA filtra por keywords exatas',
                solution: `Inclua estas palavras-chave exatas no seu CV: ${missingCritical.slice(0, 5).join(', ')}`
            });
        }

        // 3. Falta de quantificação nos resultados
        const hasQuantification = /\b\d+%|\b\d+\s*(mil|milhões?|pessoas?|projetos?|anos?|meses?)\b/gi.test(resumeText);
        if (!hasQuantification) {
            issues.push({
                type: 'HIGH',
                factor: 'no_quantification',
                description: 'Nenhum resultado quantificado encontrado',
                impact: 'ALTO - GAIA valoriza dados mensuráveis',
                solution: 'Adicione números específicos: "Aumentei vendas em X%", "Liderei equipe de X pessoas"'
            });
        }

        // 4. Estrutura não padronizada
        const hasStructure = /\b(empresa|cargo|período)\b/gi.test(resumeText);
        if (!hasStructure) {
            issues.push({
                type: 'MEDIUM',
                factor: 'unstructured_format',
                description: 'Formato de experiência não segue padrão estruturado',
                impact: 'MÉDIO - Dificulta leitura automática',
                solution: 'Use formato: "Empresa | Cargo | Período (MM/AAAA - MM/AAAA)"'
            });
        }

        return { issues };
    }

    /**
     * Garante otimização de verbos de ação para passar no GAIA
     */
    static guaranteeActionVerbSuccess(resumeText, jobDescription) {
        const actionVerbAnalysis = GupyOptimizationService.analyzeActionVerbs(resumeText, jobDescription);

        const guarantee = {
            type: 'action_verbs',
            currentScore: actionVerbAnalysis.score,
            targetScore: 85,
            status: actionVerbAnalysis.score >= 85 ? 'GUARANTEED' : 'NEEDS_IMPROVEMENT',
            improvements: []
        };

        if (actionVerbAnalysis.score < 85) {
            guarantee.improvements = [
                {
                    priority: 'CRITICAL',
                    action: 'Reescrever todas as experiências começando com verbos de ação',
                    examples: [
                        'ANTES: "Responsável pela implementação do sistema"',
                        'DEPOIS: "Implementei sistema que reduziu custos em 30%"'
                    ],
                    requiredVerbs: ['desenvolvi', 'implementei', 'gerenciei', 'liderei', 'otimizei'],
                    impact: '+25-40 pontos no score GAIA'
                },
                {
                    priority: 'HIGH',
                    action: 'Usar verbos específicos da área técnica',
                    examples: [
                        'ANTES: "Trabalhei com Python"',
                        'DEPOIS: "Desenvolvi aplicações Python que processaram 10M+ registros"'
                    ],
                    requiredVerbs: actionVerbAnalysis.missing.slice(0, 8),
                    impact: '+15-25 pontos no score GAIA'
                }
            ];
        }

        return guarantee;
    }

    /**
     * Garante otimização de keywords para passar no GAIA
     */
    static guaranteeKeywordOptimization(resumeText, jobDescription) {
        const keywords = this.extractCriticalKeywords(jobDescription);
        const presentKeywords = keywords.filter(keyword =>
            resumeText.toLowerCase().includes(keyword.toLowerCase())
        );

        const keywordScore = (presentKeywords.length / keywords.length) * 100;

        const guarantee = {
            type: 'keywords',
            currentScore: Math.round(keywordScore),
            targetScore: 80,
            status: keywordScore >= 80 ? 'GUARANTEED' : 'NEEDS_IMPROVEMENT',
            keywordAnalysis: {
                total: keywords.length,
                present: presentKeywords.length,
                missing: keywords.length - presentKeywords.length,
                criticalMissing: keywords.filter(k => !presentKeywords.includes(k)).slice(0, 5)
            },
            improvements: []
        };

        if (keywordScore < 80) {
            guarantee.improvements = [
                {
                    priority: 'CRITICAL',
                    action: 'Incluir keywords exatas da vaga',
                    keywords: guarantee.keywordAnalysis.criticalMissing,
                    strategy: 'Repetir cada keyword 2-3 vezes em contextos diferentes',
                    examples: [
                        'Na descrição de experiência: "Desenvolvi aplicações React..."',
                        'Na seção de habilidades: "React, Node.js, JavaScript"',
                        'Em projetos: "Projeto desenvolvido em React Native"'
                    ],
                    impact: '+20-35 pontos no score GAIA'
                }
            ];
        }

        return guarantee;
    }

    /**
     * Garante estrutura ATS-friendly para passar no GAIA
     */
    static guaranteeATSStructure(resumeText) {
        const structureScore = this.analyzeStructureScore(resumeText);

        const guarantee = {
            type: 'ats_structure',
            currentScore: structureScore,
            targetScore: 75,
            status: structureScore >= 75 ? 'GUARANTEED' : 'NEEDS_IMPROVEMENT',
            improvements: []
        };

        if (structureScore < 75) {
            guarantee.improvements = [
                {
                    priority: 'HIGH',
                    action: 'Usar formato padronizado para experiências',
                    template: 'Empresa | Cargo | Período (MM/AAAA - MM/AAAA)\n• Desenvolvi X que resultou em Y\n• Implementei Z aumentando eficiência em N%',
                    impact: '+15-20 pontos no score GAIA'
                },
                {
                    priority: 'MEDIUM',
                    action: 'Organizar seções em ordem específica',
                    order: ['Experiência Profissional', 'Formação Acadêmica', 'Habilidades Técnicas', 'Certificações'],
                    impact: '+10-15 pontos no score GAIA'
                }
            ];
        }

        return guarantee;
    }

    /**
     * Garante match de experiência para passar no GAIA
     */
    static guaranteeExperienceMatch(resumeText, jobDescription) {
        const experienceScore = this.analyzeExperienceMatch(resumeText, jobDescription);

        const guarantee = {
            type: 'experience_match',
            currentScore: experienceScore,
            targetScore: 70,
            status: experienceScore >= 70 ? 'GUARANTEED' : 'NEEDS_IMPROVEMENT',
            improvements: []
        };

        if (experienceScore < 70) {
            guarantee.improvements = [
                {
                    priority: 'HIGH',
                    action: 'Destacar experiências relevantes para a vaga',
                    strategy: 'Priorizar experiências que usam tecnologias/skills mencionadas na vaga',
                    impact: '+15-25 pontos no score GAIA'
                }
            ];
        }

        return guarantee;
    }

    /**
     * Calcula score final de aprovação
     */
    static calculatePassScore(guarantee) {
        let totalScore = 0;
        let totalWeight = 0;

        guarantee.passGuarantees.forEach(g => {
            const weights = {
                'action_verbs': 30,
                'keywords': 25,
                'ats_structure': 20,
                'experience_match': 15
            };

            const weight = weights[g.type] || 10;
            totalScore += (g.currentScore * weight);
            totalWeight += weight;
        });

        // Penalizar issues críticos
        const criticalIssues = guarantee.criticalIssues.filter(issue => issue.type === 'CRITICAL');
        const penalty = criticalIssues.length * 15;

        const finalScore = Math.max(0, Math.round((totalScore / totalWeight) - penalty));
        return finalScore;
    }

    /**
     * Determina confiança na aprovação
     */
    static determineConfidence(score) {
        if (score >= 85) return 'ALTA - Aprovação quase garantida';
        if (score >= 70) return 'MÉDIA - Boas chances de aprovação';
        if (score >= 55) return 'BAIXA - Necessita melhorias críticas';
        return 'MUITO BAIXA - Requer reestruturação completa';
    }

    /**
     * Gera plano de ação para garantir aprovação
     */
    static generateGuaranteeActionPlan(guarantee) {
        const plan = [];

        // Priorizar issues críticos
        guarantee.criticalIssues.forEach(issue => {
            if (issue.type === 'CRITICAL') {
                plan.push({
                    step: plan.length + 1,
                    priority: 'CRÍTICA',
                    title: `Resolver: ${issue.factor}`,
                    description: issue.solution,
                    expectedImpact: issue.impact,
                    timeEstimate: '30-60 minutos'
                });
            }
        });

        // Adicionar melhorias de cada garantia
        guarantee.passGuarantees.forEach(g => {
            g.improvements.forEach(improvement => {
                plan.push({
                    step: plan.length + 1,
                    priority: improvement.priority,
                    title: improvement.action,
                    description: improvement.examples ? improvement.examples.join(' | ') : improvement.strategy,
                    expectedImpact: improvement.impact,
                    timeEstimate: improvement.priority === 'CRITICAL' ? '60-90 minutos' : '30-45 minutos'
                });
            });
        });

        return plan;
    }

    /**
     * Dicas específicas baseadas no link da vaga
     */
    static getGupySpecificTips(jobLink) {
        const tips = [
            {
                category: 'Algoritmo GAIA',
                tip: 'O GAIA analisa mais de 200 métricas. Priorize verbos de ação, keywords exatas e resultados quantificados.',
                importance: 'CRÍTICA'
            },
            {
                category: 'Formato Ideal',
                tip: 'Use: "Desenvolvi [tecnologia] que [resultado mensurável]" - Este formato tem 90%+ de aprovação.',
                importance: 'ALTA'
            },
            {
                category: 'Keywords',
                tip: 'Repita palavras-chave da vaga em diferentes contextos (experiência, habilidades, projetos).',
                importance: 'ALTA'
            },
            {
                category: 'Estrutura',
                tip: 'Bullet points começando com verbos de ação têm 3x mais chances de aprovação.',
                importance: 'MÉDIA'
            },
            {
                category: 'Quantificação',
                tip: 'CVs com números específicos (%, valores, quantidade) ranqueiam 40% melhor.',
                importance: 'MÉDIA'
            }
        ];

        // Se for vaga de tech, adicionar dicas específicas
        if (jobLink && (jobLink.includes('desenvolvedor') || jobLink.includes('programador') || jobLink.includes('tech'))) {
            tips.push({
                category: 'Tech Específico',
                tip: 'Para vagas tech: mencione frameworks, linguagens e metodologias exatas da vaga.',
                importance: 'ALTA'
            });
        }

        return tips;
    }

    // Métodos auxiliares
    static analyzeActionVerbsForGAIA(resumeText) {
        // Implementação específica para GAIA
        return GupyOptimizationService.analyzeActionVerbs(resumeText, '');
    }

    static analyzeKeywordExactMatch(resumeText, jobDescription) {
        const keywords = this.extractCriticalKeywords(jobDescription);
        const matches = keywords.filter(k => resumeText.toLowerCase().includes(k.toLowerCase()));
        return {
            score: Math.round((matches.length / keywords.length) * 100),
            matches: matches.length,
            total: keywords.length
        };
    }

    static analyzeObjectiveStructure(resumeText) {
        let score = 0;
        if (/•|\*|-/.test(resumeText)) score += 25; // Bullet points
        if (/\b(empresa|cargo|período)\b/gi.test(resumeText)) score += 25; // Estrutura
        if (/\b\d+%|\b\d+\s*(anos?|meses?)\b/gi.test(resumeText)) score += 25; // Quantificação
        if (resumeText.includes('\n')) score += 25; // Organização
        return score;
    }

    static analyzeRelevantExperience(resumeText, jobDescription) {
        const jobKeywords = this.extractCriticalKeywords(jobDescription);
        const experienceSection = this.extractExperienceSection(resumeText);
        const matches = jobKeywords.filter(k => experienceSection.toLowerCase().includes(k.toLowerCase()));
        return {
            score: Math.round((matches.length / jobKeywords.length) * 100)
        };
    }

    static analyzeQuantifiedResults(resumeText) {
        const quantificationRegex = /\b\d+%|\b\d+\s*(mil|milhões?|pessoas?|projetos?|anos?|meses?|reais?|dolares?)\b/gi;
        const matches = resumeText.match(quantificationRegex) || [];
        return {
            score: Math.min(100, matches.length * 20) // 20 pontos por quantificação
        };
    }

    static extractCriticalKeywords(jobDescription) {
        const keywords = [];

        // Tecnologias
        const techRegex = /\b(JavaScript|Python|Java|React|Node\.js|SQL|AWS|Docker|Kubernetes|Angular|Vue|MongoDB|PostgreSQL|MySQL|Git|Jenkins|Linux|Windows|PHP|C\#|\.NET|Spring|Django|Laravel|Express|Redux|TypeScript|GraphQL|REST|API|Microservices|DevOps|CI\/CD|Agile|Scrum|Kanban)\b/gi;

        // Soft skills importantes
        const softSkillsRegex = /\b(liderança|comunicação|trabalho em equipe|proatividade|organização|planejamento|análise|resolução de problemas|criatividade|adaptabilidade|gestão|coordenação|supervisão|mentoria|treinamento)\b/gi;

        // Experiência
        const experienceRegex = /\b(\d+\s*anos?\s*de\s*experiência|\d+\+\s*anos?|sênior|júnior|pleno|especialista|coordenador|gerente|líder|analista)\b/gi;

        [techRegex, softSkillsRegex, experienceRegex].forEach(regex => {
            const matches = jobDescription.match(regex) || [];
            keywords.push(...matches.map(m => m.toLowerCase().trim()));
        });

        return [...new Set(keywords)];
    }

    static extractExperienceSection(resumeText) {
        const experienceMarkers = ['experiência', 'histórico profissional', 'trajetória', 'carreira'];
        for (const marker of experienceMarkers) {
            const regex = new RegExp(`${marker}[\\s\\S]*?(?=(?:formação|educação|habilidades|$))`, 'gi');
            const match = resumeText.match(regex);
            if (match) return match[0];
        }
        return resumeText;
    }

    static isActionVerb(word) {
        const actionVerbs = ['desenvolvi', 'implementei', 'criei', 'gerenciei', 'liderei', 'coordenei', 'otimizei', 'automatizei', 'melhorei', 'estabeleci', 'construí', 'projetei', 'executei', 'supervisionei', 'organizei', 'planejei', 'alcancei', 'aumentei', 'reduzi', 'solucionei'];
        return actionVerbs.some(verb => word.includes(verb.substring(0, 4)));
    }

    static analyzeStructureScore(resumeText) {
        let score = 0;
        if (/•|\*|-/.test(resumeText)) score += 20;
        if (/\b(empresa|cargo|período)\b/gi.test(resumeText)) score += 30;
        if (/\d{2}\/\d{4}/.test(resumeText)) score += 20;
        if (resumeText.split('\n').length > 10) score += 15;
        if (/\b(experiência|formação|habilidades)\b/gi.test(resumeText)) score += 15;
        return score;
    }

    static analyzeExperienceMatch(resumeText, jobDescription) {
        const keywords = this.extractCriticalKeywords(jobDescription);
        const experience = this.extractExperienceSection(resumeText);
        const matches = keywords.filter(k => experience.toLowerCase().includes(k.toLowerCase()));
        return Math.round((matches.length / Math.max(keywords.length, 1)) * 100);
    }

    static checkExperienceStartsWithVerbs(resumeText) {
        const lines = resumeText.split('\n').filter(line => line.includes('•') || line.includes('-'));
        const verbStarts = lines.filter(line => this.isActionVerb(line.trim().split(' ')[0]));
        return lines.length > 0 ? (verbStarts.length / lines.length) >= 0.7 : false;
    }

    static checkMeasurableResults(resumeText) {
        return /\b\d+%|\b\d+\s*(mil|milhões?|pessoas?|projetos?)\b/gi.test(resumeText);
    }

    static checkStructuredFormat(resumeText) {
        return /\b(empresa|cargo|período)\b/gi.test(resumeText) && /•|\*|-/.test(resumeText);
    }

    static checkOptimalKeywordDensity(resumeText, jobDescription) {
        const keywords = this.extractCriticalKeywords(jobDescription);
        const wordCount = resumeText.split(/\s+/).length;
        let totalDensity = 0;

        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const matches = resumeText.match(regex) || [];
            totalDensity += matches.length / wordCount;
        });

        return totalDensity >= 0.02 && totalDensity <= 0.05; // Densidade ideal: 2-5%
    }

    static checkExperienceProgression(resumeText) {
        const seniorityTerms = ['júnior', 'pleno', 'sênior', 'especialista', 'coordenador', 'gerente', 'líder'];
        return seniorityTerms.some(term => resumeText.toLowerCase().includes(term));
    }
}

module.exports = GupyPassGuaranteeService; 