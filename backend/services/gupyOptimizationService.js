const textExtractor = require('../utils/textExtractor');

class GupyOptimizationService {

    /**
     * Analisa se o currículo está otimizado para o algoritmo GAIA da Gupy
     */
    static analyzeGupyCompatibility(resumeText, jobDescription) {
        const analysis = {
            score: 0,
            recommendations: [],
            keywords: {
                present: [],
                missing: [],
                density: {}
            },
            format: {
                issues: [],
                suggestions: []
            },
            actionVerbs: {
                present: [],
                missing: [],
                score: 0
            }
        };

        // 1. Análise de Keywords específica para Gupy
        const jobKeywords = this.extractGupyKeywords(jobDescription);
        const resumeKeywords = this.extractResumeKeywords(resumeText);

        analysis.keywords.present = jobKeywords.filter(keyword =>
            resumeKeywords.some(rk => this.keywordMatch(keyword, rk))
        );

        analysis.keywords.missing = jobKeywords.filter(keyword =>
            !analysis.keywords.present.includes(keyword)
        );

        // 2. Análise de densidade de palavras-chave
        analysis.keywords.density = this.calculateKeywordDensity(resumeText, jobKeywords);

        // 3. Análise de VERBOS DE AÇÃO (crucial para Gupy)
        const actionVerbAnalysis = this.analyzeActionVerbs(resumeText, jobDescription);
        analysis.actionVerbs = actionVerbAnalysis;

        // 4. Análise de formato para Gupy (com foco em estrutura ATS)
        const formatAnalysis = this.analyzeFormatForGupy(resumeText);
        analysis.format = formatAnalysis;

        // 5. Score geral (ajustado para valorizar verbos de ação)
        analysis.score = this.calculateGupyScore(analysis);

        // 6. Recomendações específicas
        analysis.recommendations = this.generateGupyRecommendations(analysis);

        return analysis;
    }

    /**
     * Analisa verbos de ação no currículo - FUNDAMENTAL para Gupy
     */
    static analyzeActionVerbs(resumeText, jobDescription) {
        // Verbos de ação que a Gupy valoriza
        const powerfulActionVerbs = [
            'desenvolvi', 'criei', 'implementei', 'gerenciei', 'liderei', 'coordenei',
            'otimizei', 'automatizei', 'melhorei', 'estabeleci', 'construí', 'projetei',
            'executei', 'supervisionei', 'organizei', 'planejei', 'alcancei', 'aumentei',
            'reduzi', 'solucionei', 'colaborei', 'participei', 'contribuí', 'trabalhei',
            'atuei', 'responsável', 'realicei', 'administrei', 'controlei', 'monitored',
            'analisei', 'pesquisei', 'estudei', 'treinei', 'ensinei', 'orientei'
        ];

        const presentVerbs = [];
        const verbCounts = {};

        // Contar verbos de ação no currículo
        powerfulActionVerbs.forEach(verb => {
            const regex = new RegExp(`\\b${verb}\\w*\\b`, 'gi');
            const matches = resumeText.match(regex) || [];
            if (matches.length > 0) {
                presentVerbs.push(verb);
                verbCounts[verb] = matches.length;
            }
        });

        // Verificar se experiências começam com verbos de ação
        const experienceSection = this.extractExperienceSection(resumeText);
        const experienceItems = experienceSection.split(/[•\-\*\n]/).filter(item => item.trim().length > 10);

        let itemsWithActionVerbs = 0;
        experienceItems.forEach(item => {
            const firstWords = item.trim().split(' ').slice(0, 2).join(' ').toLowerCase();
            if (powerfulActionVerbs.some(verb => firstWords.includes(verb.toLowerCase()))) {
                itemsWithActionVerbs++;
            }
        });

        const actionVerbUsageRatio = experienceItems.length > 0 ?
            (itemsWithActionVerbs / experienceItems.length) * 100 : 0;

        // Score dos verbos de ação (0-100)
        const verbScore = Math.min(100,
            (presentVerbs.length * 10) + // 10 pontos por verbo único
            (actionVerbUsageRatio * 0.5) + // Até 50 pontos pelo uso consistente
            (Object.values(verbCounts).reduce((a, b) => a + b, 0) * 2) // 2 pontos por uso
        );

        return {
            present: presentVerbs,
            missing: powerfulActionVerbs.filter(verb => !presentVerbs.includes(verb)),
            score: Math.round(verbScore),
            usageRatio: Math.round(actionVerbUsageRatio),
            totalUses: Object.values(verbCounts).reduce((a, b) => a + b, 0),
            details: verbCounts
        };
    }

    /**
     * Extrai seção de experiência do currículo
     */
    static extractExperienceSection(resumeText) {
        const experienceMarkers = [
            'experiência profissional', 'experiência', 'histórico profissional',
            'trajetória profissional', 'atuação profissional', 'carreira'
        ];

        let experienceSection = '';

        experienceMarkers.forEach(marker => {
            const regex = new RegExp(`${marker}[\\s\\S]*?(?=(?:formação|educação|habilidades|competências|$))`, 'gi');
            const match = resumeText.match(regex);
            if (match && match[0].length > experienceSection.length) {
                experienceSection = match[0];
            }
        });

        return experienceSection || resumeText;
    }

    /**
     * Analisa formato do currículo para compatibilidade com Gupy (REVISADO)
     */
    static analyzeFormatForGupy(resumeText) {
        const issues = [];
        const suggestions = [];

        // 1. Verifica uso de verbos de ação nas experiências
        const actionVerbPattern = /^(desenvolvi|criei|implementei|gerenciei|liderei|coordenei|otimizei)/im;
        const experienceLines = resumeText.split('\n').filter(line =>
            line.includes('•') || line.includes('-') || line.includes('*')
        );

        const linesWithActionVerbs = experienceLines.filter(line =>
            /^[•\-\*]\s*(desenvolvi|criei|implementei|gerenciei|liderei|coordenei|otimizei|automatizei|melhorei|estabeleci|construí|projetei|executei|supervisionei|organizei|planejei|alcancei|aumentei|reduzi|solucionei|colaborei|participei|contribuí|trabalhei|atuei|realicei|administrei|controlei|monitorei|analisei|pesquisei|estudei|treinei|ensinei|orientei)/i.test(line.trim())
        );

        if (experienceLines.length > 0 && linesWithActionVerbs.length / experienceLines.length < 0.7) {
            issues.push("Poucas experiências começam com verbos de ação");
            suggestions.push("Inicie cada ponto de experiência com verbos como: 'Desenvolvi', 'Implementei', 'Gerenciei', 'Liderei'");
        }

        // 2. Verifica estrutura quantificada (números e resultados)
        const quantifiedPattern = /\b\d+%|\b\d+\s*milhões?|\b\d+\s*mil|\b\d+\s*anos?|\b\d+\s*pessoas?|\b\d+\s*projetos?|\b\d+\s*clientes?/gi;
        const quantifiedMatches = resumeText.match(quantifiedPattern) || [];

        if (quantifiedMatches.length < 3) {
            issues.push("Falta quantificação nos resultados");
            suggestions.push("Adicione números: 'Aumentei vendas em 25%', 'Liderei equipe de 8 pessoas', 'Gerenciei projetos de R$ 2 milhões'");
        }

        // 3. Verifica formato de data e empresa
        const hasStructuredExperience = /\b(empresa|cargo|período|duração|atuação)\b/gi.test(resumeText);
        if (!hasStructuredExperience) {
            issues.push("Estrutura de experiência não padronizada");
            suggestions.push("Use formato: 'Empresa | Cargo | Período (MM/AAAA - MM/AAAA)'");
        }

        // 4. Verifica seções essenciais
        const essentialSections = ['experiência', 'formação', 'habilidades'];
        const missingSections = essentialSections.filter(section =>
            !new RegExp(section, 'i').test(resumeText)
        );

        if (missingSections.length > 0) {
            issues.push(`Seções ausentes: ${missingSections.join(', ')}`);
            suggestions.push("Inclua seções: Experiência Profissional, Formação Acadêmica, Habilidades Técnicas");
        }

        // 5. Verifica uso de bullet points
        const hasBulletPoints = /[•\-\*]/.test(resumeText);
        if (!hasBulletPoints) {
            suggestions.push("Use bullet points (•) para listar responsabilidades e conquistas");
        }

        return { issues, suggestions };
    }

    /**
     * Calcula score de compatibilidade com Gupy (AJUSTADO para verbos de ação)
     */
    static calculateGupyScore(analysis) {
        let score = 0;

        // 30% - Verbos de ação (PESO AUMENTADO)
        score += (analysis.actionVerbs.score * 0.30);

        // 25% - Presença de keywords
        const keywordRatio = analysis.keywords.present.length /
            (analysis.keywords.present.length + analysis.keywords.missing.length);
        score += (keywordRatio * 25);

        // 25% - Formato otimizado
        const formatScore = Math.max(0, 25 - (analysis.format.issues.length * 8));
        score += formatScore;

        // 15% - Densidade adequada de keywords
        const avgDensity = Object.values(analysis.keywords.density).reduce((a, b) => a + b, 0) /
            Object.keys(analysis.keywords.density).length || 0;
        score += Math.min(15, avgDensity * 1500);

        // 5% - Estrutura geral
        score += 5;

        return Math.round(Math.min(100, Math.max(0, score)));
    }

    /**
     * Gera recomendações específicas para melhorar compatibilidade com Gupy (ATUALIZADO)
     */
    static generateGupyRecommendations(analysis) {
        const recommendations = [];

        // Recomendações de verbos de ação (PRIORIDADE ALTA)
        if (analysis.actionVerbs.score < 60) {
            recommendations.push({
                type: "action_verbs",
                priority: "high",
                title: "Use mais verbos de ação",
                description: `Inicie cada experiência com verbos como: ${analysis.actionVerbs.missing.slice(0, 5).join(', ')}. Exemplo: "Desenvolvi sistema que aumentou eficiência em 30%"`,
                impact: "CRÍTICO para algoritmo GAIA da Gupy"
            });
        }

        // Keywords faltantes
        if (analysis.keywords.missing.length > 0) {
            recommendations.push({
                type: "keywords",
                priority: "high",
                title: "Adicione palavras-chave da vaga",
                description: `Inclua: ${analysis.keywords.missing.slice(0, 5).join(', ')}`,
                impact: "Alto impacto no ranking da Gupy"
            });
        }

        // Quantificação de resultados
        if (analysis.format.issues.includes("Falta quantificação nos resultados")) {
            recommendations.push({
                type: "quantification",
                priority: "high",
                title: "Quantifique seus resultados",
                description: "Use números: 'Aumentei vendas em X%', 'Liderei equipe de X pessoas', 'Reduzi custos em R$ X'",
                impact: "Demonstra impacto mensurável"
            });
        }

        // Estrutura de formato
        if (analysis.format.issues.length > 0) {
            recommendations.push({
                type: "structure",
                priority: "medium",
                title: "Melhore a estrutura",
                description: analysis.format.suggestions[0] || "Use formato padronizado para experiências",
                impact: "Facilita leitura pelo algoritmo GAIA"
            });
        }

        // Uso consistente de verbos
        if (analysis.actionVerbs.usageRatio < 80) {
            recommendations.push({
                type: "consistency",
                priority: "medium",
                title: "Seja consistente com verbos de ação",
                description: `${analysis.actionVerbs.usageRatio}% das suas experiências começam com verbos de ação. Meta: 90%+`,
                impact: "Padrão valorizado pela Gupy"
            });
        }

        return recommendations;
    }

    /**
     * Extrai keywords que a Gupy valoriza especificamente
     */
    static extractGupyKeywords(jobDescription) {
        const keywords = [];

        // Keywords técnicas
        const techPatterns = [
            /\b(JavaScript|Python|Java|React|Node\.js|SQL|AWS|Docker|Kubernetes)\b/gi,
            /\b(Scrum|Agile|DevOps|CI\/CD|Git|Jenkins|MongoDB|PostgreSQL)\b/gi,
            /\b(Excel|Power BI|Tableau|SAP|Salesforce|HubSpot|Google Analytics)\b/gi
        ];

        // Skills comportamentais que a Gupy valoriza
        const softSkillsPatterns = [
            /\b(liderança|comunicação|trabalho em equipe|proatividade)\b/gi,
            /\b(resolução de problemas|adaptabilidade|criatividade|organização)\b/gi
        ];

        // Certificações
        const certificationPatterns = [
            /\b(certificação|certificado|curso|treinamento|especialização)\b/gi
        ];

        // Experiência específica
        const experiencePatterns = [
            /\b(\d+\s*anos?\s*de\s*experiência)\b/gi,
            /\b(experiência\s*com|conhecimento\s*em|atuação\s*em)\b/gi
        ];

        [
            ...techPatterns,
            ...softSkillsPatterns,
            ...certificationPatterns,
            ...experiencePatterns
        ].forEach(pattern => {
            const matches = jobDescription.match(pattern) || [];
            keywords.push(...matches.map(m => m.toLowerCase().trim()));
        });

        return [...new Set(keywords)];
    }

    /**
     * Calcula densidade de cada palavra-chave no texto
     */
    static calculateKeywordDensity(text, keywords) {
        const wordCount = text.split(/\s+/).length;
        const density = {};

        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const matches = text.match(regex) || [];
            density[keyword] = matches.length / wordCount;
        });

        return density;
    }

    /**
     * Verifica match entre palavras-chave (com variações)
     */
    static keywordMatch(jobKeyword, resumeKeyword) {
        const normalize = (str) => str.toLowerCase().trim()
            .replace(/[áàâã]/g, 'a')
            .replace(/[éêë]/g, 'e')
            .replace(/[íîï]/g, 'i')
            .replace(/[óôõ]/g, 'o')
            .replace(/[úûü]/g, 'u');

        const normalizedJob = normalize(jobKeyword);
        const normalizedResume = normalize(resumeKeyword);

        return normalizedResume.includes(normalizedJob) ||
            normalizedJob.includes(normalizedResume);
    }

    /**
     * Extrai palavras-chave do currículo
     */
    static extractResumeKeywords(resumeText) {
        // Extrai tecnologias, ferramentas, skills
        const keywords = [];

        const patterns = [
            /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, // Nomes próprios (tecnologias)
            /\b\w+\.js\b/gi, // Frameworks JS
            /\b[A-Z]{2,}\b/g, // Siglas
            /\b\d+\s*anos?\b/gi // Anos de experiência
        ];

        patterns.forEach(pattern => {
            const matches = resumeText.match(pattern) || [];
            keywords.push(...matches);
        });

        return [...new Set(keywords.map(k => k.toLowerCase().trim()))];
    }
}

module.exports = GupyOptimizationService; 