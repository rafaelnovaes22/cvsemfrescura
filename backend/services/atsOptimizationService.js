// Serviço de otimização específica para ATS (Gupy e outros)
// Implementa a fórmula: verbo + tecnologia + resultado + contexto

/**
 * Gera recomendações otimizadas para ATS baseadas nas palavras-chave das vagas
 * e no conteúdo atual do currículo
 */

const verbosATS = [
    'Desenvolvimento', 'Implementação', 'Criação', 'Gestão', 'Coordenação',
    'Análise', 'Execução', 'Operação', 'Administração', 'Configuração',
    'Manutenção', 'Otimização', 'Integração', 'Automatização', 'Monitoramento',
    'Planejamento', 'Modelagem', 'Documentação', 'Liderança', 'Supervisão'
];

const contextosComuns = [
    'em ambiente corporativo',
    'para melhoria de performance',
    'visando otimização de processos',
    'com foco em resultados',
    'em projetos de grande escala',
    'para redução de custos',
    'aumentando produtividade',
    'melhorando eficiência',
    'garantindo qualidade',
    'reduzindo tempo de execução',
    'aumentando satisfação do cliente',
    'otimizando recursos'
];

const resultadosQuantificaveis = [
    'aumentando performance em X%',
    'reduzindo tempo em X%',
    'melhorando eficiência em X%',
    'processando X registros/dia',
    'atendendo X usuários',
    'gerenciando X projetos',
    'reduzindo custos em X%',
    'aumentando conversão em X%'
];

/**
 * Identifica tecnologias presentes no currículo
 */
function extractTechnologiesFromResume(resumeText, jobKeywords) {
    const normalizedResume = resumeText.toLowerCase();
    const technologiesFound = [];

    // Tecnologias comuns para mapear
    const techMap = {
        'javascript': ['javascript', 'js', 'node.js', 'nodejs'],
        'python': ['python', 'django', 'flask', 'pandas'],
        'java': ['java', 'spring', 'hibernate'],
        'sql': ['sql', 'mysql', 'postgresql', 'oracle', 'sql server'],
        'powerbi': ['power bi', 'powerbi', 'dax'],
        'excel': ['excel', 'vba', 'macros'],
        'react': ['react', 'reactjs', 'react.js'],
        'angular': ['angular', 'angularjs'],
        'aws': ['aws', 'amazon web services', 's3', 'ec2'],
        'azure': ['azure', 'microsoft azure'],
        'docker': ['docker', 'containers'],
        'git': ['git', 'github', 'gitlab'],
        'agile': ['agile', 'scrum', 'metodologias ágeis'],
        'api': ['api', 'rest', 'restful', 'webservice']
    };

    // Procurar tecnologias no currículo
    for (const [tech, variations] of Object.entries(techMap)) {
        for (const variation of variations) {
            if (normalizedResume.includes(variation)) {
                technologiesFound.push(tech);
                break;
            }
        }
    }

    // Adicionar tecnologias das palavras-chave das vagas que estão presentes
    jobKeywords.forEach(keyword => {
        const normalizedKeyword = keyword.toLowerCase();
        if (normalizedResume.includes(normalizedKeyword)) {
            technologiesFound.push(keyword);
        }
    });

    return [...new Set(technologiesFound)]; // Remove duplicatas
}

/**
 * Identifica experiências/contextos do currículo
 */
function extractExperienceContext(resumeText) {
    const contexts = [];
    const normalizedResume = resumeText.toLowerCase();

    // Detectar tipos de experiência
    if (normalizedResume.includes('dashboard') || normalizedResume.includes('relatório')) {
        contexts.push('dashboards e relatórios');
    }
    if (normalizedResume.includes('api') || normalizedResume.includes('integração')) {
        contexts.push('integração de sistemas');
    }
    if (normalizedResume.includes('banco de dados') || normalizedResume.includes('sql')) {
        contexts.push('manipulação de dados');
    }
    if (normalizedResume.includes('web') || normalizedResume.includes('frontend')) {
        contexts.push('desenvolvimento web');
    }
    if (normalizedResume.includes('mobile') || normalizedResume.includes('app')) {
        contexts.push('desenvolvimento mobile');
    }
    if (normalizedResume.includes('equipe') || normalizedResume.includes('time')) {
        contexts.push('trabalho em equipe');
    }
    if (normalizedResume.includes('projeto') || normalizedResume.includes('gestão')) {
        contexts.push('gestão de projetos');
    }

    return contexts;
}

/**
 * Gera uma frase otimizada para ATS
 */
function generateATSOptimizedSentence(verbo, tecnologia, resultado, contexto) {
    const templates = [
        `${verbo} de soluções em ${tecnologia} ${resultado}, ${contexto}.`,
        `${verbo} ${tecnologia} para ${resultado} ${contexto}.`,
        `${verbo} de sistemas utilizando ${tecnologia}, ${resultado} ${contexto}.`,
        `${verbo} e manutenção de ${tecnologia} ${resultado}, ${contexto}.`
    ];

    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    return randomTemplate;
}

/**
 * Função principal que gera recomendações otimizadas
 */
function generateATSOptimizedRecommendations(jobKeywords, resumeText, missingKeywords) {
    const recommendations = [];

    // Extrair tecnologias presentes no currículo
    const presentTechnologies = extractTechnologiesFromResume(resumeText, jobKeywords);

    // Extrair contextos de experiência
    const experienceContexts = extractExperienceContext(resumeText);

    // Recomendação principal sobre o problema
    recommendations.push(
        "💡 ESTRATÉGIA OTIMIZADA: 92% dos candidatos são rejeitados automaticamente pelo ATS. Seus próximos ajustes podem ser o diferencial entre passar ou ser filtrado antes mesmo de um recrutador ver seu currículo."
    );

    // Gerar exemplos práticos para tecnologias presentes
    if (presentTechnologies.length > 0) {
        const techExamples = generateSpecificTechExamples(presentTechnologies, resumeText);
        if (techExamples.length > 0) {
            recommendations.push(
                `🔧 OTIMIZE SUAS EXPERIÊNCIAS ATUAIS:\n${techExamples.join('\n\n')}`
            );
        }
    }

    // Recomendações específicas para palavras-chave ausentes mais importantes
    if (missingKeywords && missingKeywords.length > 0) {
        const missingExamples = generateMissingKeywordExamples(missingKeywords.slice(0, 3), experienceContexts);
        if (missingExamples.length > 0) {
            recommendations.push(
                `⚠️ INCLUA PALAVRAS-CHAVE CRÍTICAS:\n${missingExamples.join('\n\n')}`
            );
        }
    }

    // Exemplos de densidade inteligente baseados no currículo
    const densityExamples = generateDensityExamples(presentTechnologies, resumeText);
    if (densityExamples.length > 0) {
        recommendations.push(
            `🎯 AUMENTE SUA RELEVÂNCIA:\n${densityExamples.join('\n\n')}`
        );
    }

    // Estrutura prática
    recommendations.push(
        "📋 FORMATO OTIMIZADO: Transforme cada linha de experiência em: ação específica → tecnologia exata → resultado quantificado → contexto de aplicação. Evite descrições vagas como 'responsável por' ou 'conhecimento em'."
    );

    return recommendations;
}

/**
 * Gera exemplos específicos para tecnologias presentes no currículo
 */
function generateSpecificTechExamples(technologies, resumeText) {
    const examples = [];
    const normalizedResume = resumeText.toLowerCase();

    // JavaScript/React
    if (technologies.includes('javascript') || technologies.includes('react')) {
        if (normalizedResume.includes('aplicação') || normalizedResume.includes('sistema') || normalizedResume.includes('web')) {
            examples.push(
                "❌ Evite: 'Desenvolvimento de aplicações web'\n✅ Melhore para: 'Desenvolvimento de aplicações web responsivas em React.js com JavaScript ES6+, aumentando performance de carregamento em 40%, para sistemas de gestão corporativa'"
            );
        }
    }

    // SQL/Banco de dados
    if (technologies.includes('sql') || normalizedResume.includes('banco') || normalizedResume.includes('dados')) {
        examples.push(
            "❌ Evite: 'Trabalho com banco de dados'\n✅ Melhore para: 'Desenvolvimento de consultas SQL otimizadas para análise de dados, reduzindo tempo de relatórios em 60%, utilizando PostgreSQL em ambiente de produção'"
        );
    }

    // Power BI/Relatórios
    if (technologies.includes('powerbi') || normalizedResume.includes('relatório') || normalizedResume.includes('dashboard')) {
        examples.push(
            "❌ Evite: 'Criação de relatórios'\n✅ Melhore para: 'Criação de dashboards interativos no Power BI com DAX e medidas calculadas, automatizando análises e reduzindo tempo de tomada de decisão em 50%'"
        );
    }

    // Python/Análise
    if (technologies.includes('python') || normalizedResume.includes('análise') || normalizedResume.includes('automação')) {
        examples.push(
            "❌ Evite: 'Automação de processos'\n✅ Melhore para: 'Automação de processos repetitivos com Python e pandas, eliminando 15 horas semanais de trabalho manual, processando datasets de 50k+ registros'"
        );
    }

    return examples.slice(0, 2); // Máximo 2 exemplos para não sobrecarregar
}

/**
 * Gera exemplos para palavras-chave ausentes
 */
function generateMissingKeywordExamples(missingKeywords, contexts) {
    const examples = [];

    missingKeywords.forEach((keyword, index) => {
        if (index >= 2) return; // Máximo 2 exemplos

        let example = "";
        const keywordLower = keyword.toLowerCase();

        // Contextos específicos baseados na palavra-chave
        if (keywordLower.includes('git') || keywordLower.includes('controle')) {
            example = `💼 ${keyword}: "Controle de versão com Git e GitHub, gerenciando repositórios colaborativos de 5+ desenvolvedores, implementando workflow de code review que reduziu bugs em 30%"`;
        } else if (keywordLower.includes('agile') || keywordLower.includes('scrum')) {
            example = `💼 ${keyword}: "Aplicação de metodologias ágeis Scrum em projetos de desenvolvimento, coordenando sprints de 2 semanas e reduzindo time-to-market em 25%"`;
        } else if (keywordLower.includes('api') || keywordLower.includes('rest')) {
            example = `💼 ${keyword}: "Desenvolvimento de APIs REST seguras com autenticação JWT, servindo 10k+ requisições diárias com tempo de resposta inferior a 200ms"`;
        } else if (keywordLower.includes('docker') || keywordLower.includes('container')) {
            example = `💼 ${keyword}: "Containerização de aplicações com Docker, reduzindo tempo de deploy em 70% e garantindo consistência entre ambientes de desenvolvimento e produção"`;
        } else {
            // Exemplo genérico mas específico
            example = `💼 ${keyword}: "Implementação de ${keyword} em projetos corporativos, otimizando processos e aumentando eficiência operacional em X%, com foco em resultados mensuráveis"`;
        }

        examples.push(example);
    });

    return examples;
}

/**
 * Gera exemplos de densidade inteligente
 */
function generateDensityExamples(technologies, resumeText) {
    const examples = [];
    const normalizedResume = resumeText.toLowerCase();

    // Se há JavaScript no currículo
    if (technologies.includes('javascript')) {
        examples.push(
            "🔄 Varie as menções: Use 'JavaScript', 'JS', 'JavaScript ES6+', 'ECMAScript' em diferentes contextos. Cada variação é contada pelo algoritmo como relevância adicional."
        );
    }

    // Se há React
    if (technologies.includes('react')) {
        examples.push(
            "🔄 Maximize relevância: Mencione 'React', 'React.js', 'ReactJS', 'React Hooks', 'React Components' quando aplicável. O ATS conta cada menção específica."
        );
    }

    return examples.slice(0, 1); // Apenas 1 exemplo para não sobrecarregar
}

module.exports = {
    generateATSOptimizedRecommendations,
    extractTechnologiesFromResume,
    extractExperienceContext
}; 