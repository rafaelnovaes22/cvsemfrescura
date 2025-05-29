/**
 * 🔧 ATS UNIVERSAL HELPERS - MÉTODOS AUXILIARES ESPECÍFICOS
 * 
 * Este arquivo contém todos os métodos auxiliares para análise específica
 * de cada plataforma ATS utilizada no Brasil.
 */

class ATSUniversalHelpers {

    // ================================
    // 💼 LINKEDIN HELPERS
    // ================================

    /**
     * Analisa correspondência de skills para LinkedIn
     */
    static analyzeLinkedInSkills(resumeText, jobDescription) {
        const linkedinSkillsPatterns = [
            // Skills técnicas mais valorizadas no LinkedIn
            'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'aws', 'docker',
            'kubernetes', 'git', 'agile', 'scrum', 'project management', 'leadership',
            'marketing digital', 'vendas', 'excel', 'powerbi', 'tableau', 'salesforce'
        ];

        const resumeLower = resumeText.toLowerCase();
        const jobLower = jobDescription.toLowerCase();

        // Extrair skills mencionadas na vaga
        const jobSkills = linkedinSkillsPatterns.filter(skill =>
            jobLower.includes(skill.toLowerCase())
        );

        // Verificar skills presentes no CV
        const presentSkills = jobSkills.filter(skill =>
            resumeLower.includes(skill.toLowerCase())
        );

        const skillsScore = jobSkills.length > 0 ?
            Math.round((presentSkills.length / jobSkills.length) * 100) : 70;

        return {
            score: skillsScore,
            job_skills: jobSkills,
            present_skills: presentSkills,
            missing_skills: jobSkills.filter(skill => !presentSkills.includes(skill)),
            recommendations: [
                `Adicione ${jobSkills.slice(0, 3).join(', ')} no seu perfil LinkedIn`,
                'Use seção "Skills" do LinkedIn para destacar competências',
                'Peça endorsements para skills relevantes da vaga'
            ]
        };
    }

    /**
     * Analisa peso da experiência para LinkedIn
     */
    static analyzeLinkedInExperience(resumeText, jobDescription) {
        const experiencePatterns = [
            /(\d+)\s*anos?\s*de\s*experiência/gi,
            /experiência\s*de\s*(\d+)\s*anos?/gi,
            /(\d+)\+\s*anos?\s*de/gi
        ];

        const seniorityKeywords = {
            'junior': 1, 'trainee': 1, 'estagiário': 1, 'jr': 1,
            'pleno': 3, 'senior': 5, 'sênior': 5, 'sr': 5,
            'lead': 7, 'principal': 8, 'manager': 6, 'diretor': 9, 'head': 8
        };

        let experienceYears = 0;
        let seniorityLevel = 0;

        // Extrair anos de experiência
        for (const pattern of experiencePatterns) {
            const matches = resumeText.match(pattern);
            if (matches) {
                const years = parseInt(matches[0].match(/\d+/)[0]);
                experienceYears = Math.max(experienceYears, years);
            }
        }

        // Calcular nível de senioridade
        Object.entries(seniorityKeywords).forEach(([keyword, level]) => {
            if (resumeText.toLowerCase().includes(keyword)) {
                seniorityLevel = Math.max(seniorityLevel, level);
            }
        });

        // LinkedIn valoriza progressão de carreira
        const careerProgression = this.analyzeCareerProgression(resumeText);

        const experienceScore = Math.min(100,
            (experienceYears * 8) + (seniorityLevel * 10) + (careerProgression * 20)
        );

        return {
            score: experienceScore,
            experience_years: experienceYears,
            seniority_level: seniorityLevel,
            career_progression: careerProgression,
            recommendations: [
                'Destaque progressão de carreira com títulos crescentes',
                'Use números para quantificar conquistas',
                'Mantenha histórico completo no LinkedIn'
            ]
        };
    }

    /**
     * Analisa alinhamento com indústria
     */
    static analyzeIndustryAlignment(resumeText, jobDescription) {
        const industryKeywords = {
            'tecnologia': ['tech', 'software', 'desenvolvimento', 'programming', 'ti', 'tecnologia'],
            'financeiro': ['banco', 'financial', 'fintech', 'investimento', 'credito'],
            'saude': ['hospital', 'clinica', 'farmaceutica', 'medicina', 'saude'],
            'educacao': ['escola', 'universidade', 'ensino', 'educacao', 'professor'],
            'varejo': ['loja', 'vendas', 'comercio', 'retail', 'consumidor'],
            'consultoria': ['consulting', 'consultoria', 'advisory', 'strategy'],
            'manufatura': ['fabrica', 'producao', 'manufacturing', 'industrial']
        };

        const resumeLower = resumeText.toLowerCase();
        const jobLower = jobDescription.toLowerCase();

        let industryMatch = 0;
        let identifiedIndustry = 'geral';

        Object.entries(industryKeywords).forEach(([industry, keywords]) => {
            const jobMatches = keywords.filter(keyword => jobLower.includes(keyword)).length;
            const resumeMatches = keywords.filter(keyword => resumeLower.includes(keyword)).length;

            if (jobMatches > 0) {
                const match = Math.min(100, (resumeMatches / jobMatches) * 100);
                if (match > industryMatch) {
                    industryMatch = match;
                    identifiedIndustry = industry;
                }
            }
        });

        return {
            score: industryMatch,
            identified_industry: identifiedIndustry,
            recommendations: [
                `Enfatize experiência em ${identifiedIndustry}`,
                'Use jargões específicos da indústria',
                'Conecte-se com profissionais do setor'
            ]
        };
    }

    /**
     * Analisa sinais de rede/networking
     */
    static analyzeNetworkSignals(resumeText) {
        const networkingSignals = [
            'palestrante', 'mentor', 'voluntário', 'comunidade', 'networking',
            'evento', 'conferência', 'meetup', 'workshop', 'treinamento'
        ];

        const resumeLower = resumeText.toLowerCase();
        const signalsFound = networkingSignals.filter(signal =>
            resumeLower.includes(signal)
        ).length;

        const networkScore = Math.min(100, signalsFound * 20);

        return {
            score: networkScore,
            signals_found: signalsFound,
            recommendations: [
                'Participe de eventos da sua área',
                'Seja ativo em grupos LinkedIn',
                'Compartilhe conteúdo relevante'
            ]
        };
    }

    // ================================
    // 🏢 CATHO HELPERS
    // ================================

    /**
     * Analisa keywords específicas do Catho
     */
    static analyzeCathoKeywords(resumeText, jobDescription) {
        // Catho valoriza keywords diretas e densidade moderada
        const extractedKeywords = this.extractBasicKeywords(jobDescription);
        const resumeLower = resumeText.toLowerCase();

        let keywordMatches = 0;
        const presentKeywords = [];
        const missingKeywords = [];

        extractedKeywords.forEach(keyword => {
            if (resumeLower.includes(keyword.toLowerCase())) {
                keywordMatches++;
                presentKeywords.push(keyword);
            } else {
                missingKeywords.push(keyword);
            }
        });

        // Calcular densidade (Catho prefere 2-3% de densidade)
        const wordsCount = resumeText.split(/\s+/).length;
        const keywordDensity = (keywordMatches / wordsCount) * 100;
        const densityScore = keywordDensity >= 2 && keywordDensity <= 4 ? 100 : 60;

        const finalScore = extractedKeywords.length > 0 ?
            Math.round(((keywordMatches / extractedKeywords.length) * 0.7 + (densityScore / 100) * 0.3) * 100) : 70;

        return {
            score: finalScore,
            keyword_density: keywordDensity,
            present_keywords: presentKeywords,
            missing_keywords: missingKeywords,
            recommendations: [
                'Mantenha densidade de keywords entre 2-3%',
                'Use variações das palavras-chave principais',
                'Distribua keywords naturalmente pelo CV'
            ]
        };
    }

    /**
     * Analisa completude do perfil para Catho
     */
    static analyzeCathoCompleteness(resumeText) {
        const essentialSections = {
            'dados_pessoais': /nome|email|telefone|endereço/i,
            'objetivo': /objetivo|meta|busco|pretendo/i,
            'experiencia': /experiência|trabalho|empresa|cargo/i,
            'formacao': /formação|educação|curso|universidade/i,
            'habilidades': /habilidades|competências|skills|conhecimentos/i,
            'idiomas': /inglês|espanhol|francês|idioma|língua/i,
            'certificacoes': /certificação|certificado|curso|treinamento/i
        };

        let completenessScore = 0;
        const presentSections = [];
        const missingSections = [];

        Object.entries(essentialSections).forEach(([section, pattern]) => {
            if (pattern.test(resumeText)) {
                completenessScore += 14.3; // 100/7 seções
                presentSections.push(section);
            } else {
                missingSections.push(section);
            }
        });

        return {
            score: Math.round(completenessScore),
            present_sections: presentSections,
            missing_sections: missingSections,
            recommendations: [
                'Complete todas as seções do perfil Catho',
                'Adicione objetivo profissional claro',
                'Inclua idiomas e certificações'
            ]
        };
    }

    /**
     * Analisa matching regional para Catho
     */
    static analyzeCathoRegional(resumeText, jobDescription) {
        const brazilianStates = [
            'são paulo', 'sp', 'rio de janeiro', 'rj', 'minas gerais', 'mg',
            'brasília', 'df', 'paraná', 'pr', 'santa catarina', 'sc',
            'rio grande do sul', 'rs', 'bahia', 'ba', 'pernambuco', 'pe'
        ];

        const resumeLower = resumeText.toLowerCase();
        const jobLower = jobDescription.toLowerCase();

        let locationMatch = false;
        let identifiedLocation = '';

        // Procurar correspondência de localização
        brazilianStates.forEach(state => {
            if (resumeLower.includes(state) && jobLower.includes(state)) {
                locationMatch = true;
                identifiedLocation = state;
            }
        });

        // Verificar disponibilidade para mudança
        const relocationKeywords = ['mudança', 'relocação', 'disponível para mudar', 'remoto'];
        const flexibleLocation = relocationKeywords.some(keyword =>
            resumeLower.includes(keyword)
        );

        const regionalScore = locationMatch ? 100 : (flexibleLocation ? 70 : 40);

        return {
            score: regionalScore,
            location_match: locationMatch,
            identified_location: identifiedLocation,
            flexible_location: flexibleLocation,
            recommendations: [
                'Especifique disponibilidade geográfica',
                'Mencione se aceita trabalho remoto',
                'Indique se tem disponibilidade para mudança'
            ]
        };
    }

    /**
     * Analisa foco em educação do Catho
     */
    static analyzeCathoEducation(resumeText) {
        const educationLevels = {
            'doutorado': 10, 'phd': 10,
            'mestrado': 8, 'mestre': 8,
            'mba': 7, 'especialização': 6, 'pós-graduação': 6,
            'superior': 5, 'graduação': 5, 'bacharel': 5,
            'tecnólogo': 4, 'técnico': 3,
            'ensino médio': 2, 'segundo grau': 2
        };

        let educationLevel = 0;
        let identifiedEducation = '';

        Object.entries(educationLevels).forEach(([education, level]) => {
            if (resumeText.toLowerCase().includes(education)) {
                if (level > educationLevel) {
                    educationLevel = level;
                    identifiedEducation = education;
                }
            }
        });

        const educationScore = educationLevel * 10;

        return {
            score: educationScore,
            education_level: educationLevel,
            identified_education: identifiedEducation,
            recommendations: [
                'Destaque maior nível de educação primeiro',
                'Inclua cursos complementares relevantes',
                'Mencione instituições reconhecidas'
            ]
        };
    }

    // ================================
    // 🔍 INDEED HELPERS
    // ================================

    /**
     * Analisa keywords simples para Indeed
     */
    static analyzeIndeedKeywords(resumeText, jobDescription) {
        // Indeed usa matching mais simples
        const keywords = this.extractBasicKeywords(jobDescription);
        const resumeLower = resumeText.toLowerCase();

        const presentKeywords = keywords.filter(keyword =>
            resumeLower.includes(keyword.toLowerCase())
        );

        const keywordScore = keywords.length > 0 ?
            Math.round((presentKeywords.length / keywords.length) * 100) : 70;

        return {
            score: keywordScore,
            total_keywords: keywords.length,
            present_keywords: presentKeywords,
            missing_keywords: keywords.filter(k => !presentKeywords.includes(k)),
            recommendations: [
                'Use palavras-chave exatas da vaga',
                'Repita termos importantes 2-3 vezes',
                'Mantenha linguagem simples e direta'
            ]
        };
    }

    /**
     * Analisa relevância da experiência para Indeed
     */
    static analyzeIndeedExperience(resumeText, jobDescription) {
        // Indeed valoriza experiência diretamente relacionada
        const jobTitlePatterns = this.extractJobTitles(jobDescription);
        const resumeExperience = this.extractExperienceInfo(resumeText);

        let relevanceScore = 0;
        const relevantExperience = [];

        jobTitlePatterns.forEach(title => {
            resumeExperience.forEach(exp => {
                const similarity = this.calculateStringSimilarity(title, exp);
                if (similarity > 0.6) {
                    relevanceScore += 25;
                    relevantExperience.push({ title, experience: exp, similarity });
                }
            });
        });

        return {
            score: Math.min(100, relevanceScore),
            relevant_experience: relevantExperience,
            recommendations: [
                'Destaque experiência similar ao cargo',
                'Use títulos de cargos parecidos',
                'Enfatize responsabilidades similares'
            ]
        };
    }

    /**
     * Analisa proximidade geográfica para Indeed
     */
    static analyzeIndeedLocation(resumeText, jobDescription) {
        // Indeed prioriza candidatos próximos
        const cities = [
            'são paulo', 'rio de janeiro', 'belo horizonte', 'brasília',
            'curitiba', 'porto alegre', 'salvador', 'fortaleza', 'recife'
        ];

        const resumeLower = resumeText.toLowerCase();
        const jobLower = jobDescription.toLowerCase();

        let locationScore = 50; // Score base para casos sem info

        cities.forEach(city => {
            if (resumeLower.includes(city) && jobLower.includes(city)) {
                locationScore = 100; // Match perfeito de cidade
            }
        });

        // Verificar trabalho remoto
        if (jobLower.includes('remoto') || jobLower.includes('home office')) {
            locationScore = 90; // Score alto para vagas remotas
        }

        return {
            score: locationScore,
            recommendations: [
                'Especifique sua localização atual',
                'Mencione disponibilidade para trabalho remoto',
                'Indique flexibilidade geográfica se aplicável'
            ]
        };
    }

    /**
     * Analisa matching de títulos para Indeed
     */
    static analyzeIndeedTitles(resumeText, jobDescription) {
        const jobTitles = this.extractJobTitles(jobDescription);
        const resumeTitles = this.extractJobTitles(resumeText);

        let titleMatch = 0;
        const matchingTitles = [];

        jobTitles.forEach(jobTitle => {
            resumeTitles.forEach(resumeTitle => {
                const similarity = this.calculateStringSimilarity(jobTitle, resumeTitle);
                if (similarity > 0.7) {
                    titleMatch += 33;
                    matchingTitles.push({ job: jobTitle, resume: resumeTitle, similarity });
                }
            });
        });

        return {
            score: Math.min(100, titleMatch),
            matching_titles: matchingTitles,
            recommendations: [
                'Use títulos similares aos da vaga',
                'Adapte nomenclatura de cargos',
                'Destaque progressão hierárquica'
            ]
        };
    }

    // ================================
    // 🇪🇺 INFOJOBS HELPERS
    // ================================

    /**
     * Analisa formato europeu para InfoJobs
     */
    static analyzeInfoJobsFormat(resumeText) {
        const europeanFormatElements = [
            /foto|fotografia/i,
            /data\s*de\s*nascimento|nascimento/i,
            /estado\s*civil|solteiro|casado/i,
            /nacionalidade|brasileiro/i,
            /objetivos?\s*profissionais?/i
        ];

        let formatScore = 0;
        const presentElements = [];

        europeanFormatElements.forEach((element, index) => {
            if (element.test(resumeText)) {
                formatScore += 20;
                presentElements.push(`elemento_${index}`);
            }
        });

        return {
            score: formatScore,
            present_elements: presentElements,
            recommendations: [
                'Use formato Europass se possível',
                'Inclua dados pessoais completos',
                'Organize cronologicamente (mais recente primeiro)'
            ]
        };
    }

    /**
     * Analisa peso da educação para InfoJobs
     */
    static analyzeInfoJobsEducation(resumeText, jobDescription) {
        const educationKeywords = [
            'universidade', 'faculdade', 'instituto', 'escola',
            'graduação', 'pós-graduação', 'mestrado', 'doutorado',
            'certificação', 'diploma', 'curso'
        ];

        const resumeLower = resumeText.toLowerCase();
        const jobLower = jobDescription.toLowerCase();

        // InfoJobs valoriza muito educação formal
        const educationMentions = educationKeywords.filter(keyword =>
            resumeLower.includes(keyword)
        ).length;

        const educationScore = Math.min(100, educationMentions * 15);

        return {
            score: educationScore,
            education_mentions: educationMentions,
            recommendations: [
                'Detalhe formação acadêmica completa',
                'Inclua média/notas se relevantes',
                'Mencione projetos acadêmicos importantes'
            ]
        };
    }

    /**
     * Analisa habilidades linguísticas para InfoJobs
     */
    static analyzeInfoJobsLanguages(resumeText) {
        const languagePatterns = [
            /inglês?\s*(fluente|avançado|intermediário|básico)/gi,
            /espanhol\s*(fluente|avançado|intermediário|básico)/gi,
            /francês\s*(fluente|avançado|intermediário|básico)/gi,
            /(fluente|avançado|intermediário|básico)\s*em\s*(inglês|espanhol|francês)/gi
        ];

        let languageScore = 0;
        const languages = [];

        languagePatterns.forEach(pattern => {
            const matches = resumeText.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    languages.push(match);
                    if (match.includes('fluente') || match.includes('avançado')) {
                        languageScore += 30;
                    } else if (match.includes('intermediário')) {
                        languageScore += 20;
                    } else {
                        languageScore += 10;
                    }
                });
            }
        });

        return {
            score: Math.min(100, languageScore),
            languages_found: languages,
            recommendations: [
                'Especifique nível de cada idioma claramente',
                'Use escala europeia (A1-C2) se possível',
                'Inclua certificações de idiomas'
            ]
        };
    }

    /**
     * Analisa foco em certificações para InfoJobs
     */
    static analyzeInfoJobsCertifications(resumeText) {
        const certificationKeywords = [
            'certificação', 'certificado', 'pmp', 'itil', 'cisco',
            'microsoft', 'aws', 'google', 'adobe', 'oracle',
            'scrum master', 'prince2', 'six sigma'
        ];

        const resumeLower = resumeText.toLowerCase();
        const certifications = certificationKeywords.filter(cert =>
            resumeLower.includes(cert)
        );

        const certificationScore = Math.min(100, certifications.length * 20);

        return {
            score: certificationScore,
            certifications_found: certifications,
            recommendations: [
                'Liste todas certificações relevantes',
                'Inclua datas de validade',
                'Organize por relevância para a vaga'
            ]
        };
    }

    // ================================
    // 📋 VAGAS.COM HELPERS
    // ================================

    /**
     * Analisa keywords básicas para Vagas.com
     */
    static analyzeVagasKeywords(resumeText, jobDescription) {
        // Vagas.com tem matching muito simples
        const basicKeywords = this.extractSimpleKeywords(jobDescription);
        const resumeLower = resumeText.toLowerCase();

        const foundKeywords = basicKeywords.filter(keyword =>
            resumeLower.includes(keyword.toLowerCase())
        );

        const keywordScore = basicKeywords.length > 0 ?
            Math.round((foundKeywords.length / basicKeywords.length) * 100) : 75;

        return {
            score: keywordScore,
            found_keywords: foundKeywords,
            recommendations: [
                'Use palavras-chave básicas da vaga',
                'Mantenha linguagem simples',
                'Evite termos muito técnicos'
            ]
        };
    }

    /**
     * Analisa prioridade de localização para Vagas.com
     */
    static analyzeVagasLocation(resumeText, jobDescription) {
        // Vagas.com prioriza muito localização
        const resumeHasLocation = /são paulo|rio|belo horizonte|brasília/i.test(resumeText);
        const jobHasLocation = /são paulo|rio|belo horizonte|brasília/i.test(jobDescription);

        let locationScore = 60; // Score base

        if (resumeHasLocation && jobHasLocation) {
            locationScore = 95;
        } else if (!jobHasLocation) {
            locationScore = 80; // Sem restrição específica
        }

        return {
            score: locationScore,
            recommendations: [
                'Mencione cidade atual claramente',
                'Indique se tem carro próprio',
                'Especifique disponibilidade de horário'
            ]
        };
    }

    /**
     * Analisa filtros simples para Vagas.com
     */
    static analyzeVagasFilters(resumeText, jobDescription) {
        const basicFilters = {
            'experiencia': /\d+\s*anos?\s*de\s*experiência/i,
            'escolaridade': /superior|técnico|médio/i,
            'idioma': /inglês|espanhol/i,
            'cnh': /cnh|carteira|habilitação/i
        };

        let filterScore = 0;
        const passedFilters = [];

        Object.entries(basicFilters).forEach(([filter, pattern]) => {
            if (pattern.test(resumeText)) {
                filterScore += 25;
                passedFilters.push(filter);
            }
        });

        return {
            score: filterScore,
            passed_filters: passedFilters,
            recommendations: [
                'Atenda aos filtros básicos da vaga',
                'Seja direto sobre requisitos',
                'Mencione CNH se necessário'
            ]
        };
    }

    // ================================
    // 💻 99JOBS HELPERS
    // ================================

    /**
     * Analisa foco tech para 99Jobs
     */
    static analyze99JobsTech(resumeText, jobDescription) {
        const techKeywords = [
            'javascript', 'python', 'java', 'react', 'angular', 'vue',
            'node.js', 'php', 'ruby', 'go', 'rust', 'kotlin',
            'docker', 'kubernetes', 'aws', 'azure', 'gcp',
            'mongodb', 'postgresql', 'redis', 'elasticsearch'
        ];

        const resumeLower = resumeText.toLowerCase();
        const jobLower = jobDescription.toLowerCase();

        const jobTechStack = techKeywords.filter(tech =>
            jobLower.includes(tech.toLowerCase())
        );

        const resumeTechStack = techKeywords.filter(tech =>
            resumeLower.includes(tech.toLowerCase())
        );

        const techMatch = jobTechStack.length > 0 ?
            jobTechStack.filter(tech => resumeTechStack.includes(tech)).length / jobTechStack.length : 0.7;

        return {
            score: Math.round(techMatch * 100),
            job_tech_stack: jobTechStack,
            resume_tech_stack: resumeTechStack,
            recommendations: [
                'Destaque stack técnico específico',
                'Mencione projetos com tecnologias da vaga',
                'Inclua links para GitHub/portfólio'
            ]
        };
    }

    /**
     * Analisa correspondência salarial para 99Jobs
     */
    static analyze99JobsSalary(resumeText, jobDescription) {
        const salaryPatterns = [
            /r\$\s*\d+/gi,
            /salário/gi,
            /remuneração/gi,
            /pretensão\s*salarial/gi
        ];

        let salaryScore = 70; // Score neutro se não houver informação

        const hasSalaryInfo = salaryPatterns.some(pattern =>
            resumeText.match(pattern) || jobDescription.match(pattern)
        );

        if (hasSalaryInfo) {
            salaryScore = 85; // Bonus por transparência salarial
        }

        return {
            score: salaryScore,
            has_salary_info: hasSalaryInfo,
            recommendations: [
                'Seja transparente sobre pretensão salarial',
                'Pesquise faixas salariais do mercado',
                'Considere benefícios além do salário'
            ]
        };
    }

    /**
     * Analisa prioridade de trabalho remoto para 99Jobs
     */
    static analyze99JobsRemote(resumeText, jobDescription) {
        const remoteKeywords = [
            'remoto', 'home office', 'home-office', 'trabalho remoto',
            'à distância', 'online', 'teletrabalho'
        ];

        const resumeLower = resumeText.toLowerCase();
        const jobLower = jobDescription.toLowerCase();

        const jobIsRemote = remoteKeywords.some(keyword =>
            jobLower.includes(keyword)
        );

        const resumeMentionsRemote = remoteKeywords.some(keyword =>
            resumeLower.includes(keyword)
        );

        let remoteScore = 70;

        if (jobIsRemote && resumeMentionsRemote) {
            remoteScore = 95;
        } else if (jobIsRemote) {
            remoteScore = 85;
        }

        return {
            score: remoteScore,
            job_is_remote: jobIsRemote,
            resume_mentions_remote: resumeMentionsRemote,
            recommendations: [
                'Mencione experiência com trabalho remoto',
                'Destaque habilidades de comunicação digital',
                'Inclua ferramentas de colaboração que domina'
            ]
        };
    }

    /**
     * Analisa alinhamento de stack para 99Jobs
     */
    static analyze99JobsStack(resumeText, jobDescription) {
        const stackCategories = {
            'frontend': ['react', 'angular', 'vue', 'html', 'css', 'javascript'],
            'backend': ['node.js', 'python', 'java', 'php', 'ruby', 'go'],
            'mobile': ['react native', 'flutter', 'swift', 'kotlin', 'ionic'],
            'devops': ['docker', 'kubernetes', 'aws', 'jenkins', 'terraform'],
            'data': ['python', 'r', 'sql', 'spark', 'hadoop', 'tensorflow']
        };

        const resumeLower = resumeText.toLowerCase();
        const jobLower = jobDescription.toLowerCase();

        let bestStackMatch = 0;
        let identifiedStack = '';

        Object.entries(stackCategories).forEach(([stack, technologies]) => {
            const jobTechs = technologies.filter(tech => jobLower.includes(tech));
            const resumeTechs = technologies.filter(tech => resumeLower.includes(tech));

            if (jobTechs.length > 0) {
                const match = resumeTechs.filter(tech => jobTechs.includes(tech)).length / jobTechs.length;
                if (match > bestStackMatch) {
                    bestStackMatch = match;
                    identifiedStack = stack;
                }
            }
        });

        return {
            score: Math.round(bestStackMatch * 100),
            identified_stack: identifiedStack,
            recommendations: [
                `Destaque experiência em ${identifiedStack}`,
                'Organize tecnologias por categoria',
                'Mencione projetos práticos com as tecnologias'
            ]
        };
    }

    // ================================
    // ⚙️ GENERIC HELPERS
    // ================================

    /**
     * Analisa keywords genéricas
     */
    static analyzeGenericKeywords(resumeText, jobDescription) {
        const keywords = this.extractBasicKeywords(jobDescription);
        const resumeLower = resumeText.toLowerCase();

        const foundKeywords = keywords.filter(keyword =>
            resumeLower.includes(keyword.toLowerCase())
        );

        const score = keywords.length > 0 ?
            Math.round((foundKeywords.length / keywords.length) * 100) : 70;

        return {
            score,
            found_keywords: foundKeywords,
            total_keywords: keywords.length
        };
    }

    /**
     * Analisa conformidade de formato genérico
     */
    static analyzeGenericFormat(resumeText) {
        const formatElements = [
            /experiência\s*profissional/i,
            /formação/i,
            /habilidades/i,
            /contato/i
        ];

        const elementsFound = formatElements.filter(element =>
            element.test(resumeText)
        ).length;

        return {
            score: (elementsFound / formatElements.length) * 100,
            elements_found: elementsFound
        };
    }

    /**
     * Analisa correspondência de experiência genérica
     */
    static analyzeGenericExperience(resumeText, jobDescription) {
        const experienceKeywords = this.extractBasicKeywords(jobDescription);
        const resumeLower = resumeText.toLowerCase();

        const relevantExp = experienceKeywords.filter(keyword =>
            resumeLower.includes(keyword.toLowerCase())
        ).length;

        return {
            score: experienceKeywords.length > 0 ?
                Math.round((relevantExp / experienceKeywords.length) * 100) : 70,
            relevant_experience: relevantExp
        };
    }

    /**
     * Analisa completude genérica
     */
    static analyzeGenericCompleteness(resumeText) {
        const essentialInfo = [
            /@/,  // Email
            /\d{4,5}-?\d{4}/,  // Telefone
            /experiência|trabalho/i,
            /formação|educação/i
        ];

        const completeness = essentialInfo.filter(info =>
            info.test(resumeText)
        ).length;

        return {
            score: (completeness / essentialInfo.length) * 100,
            completeness_level: completeness
        };
    }

    // ================================
    // 🛠️ UTILITY METHODS
    // ================================

    /**
     * Extrai keywords básicas de uma descrição de vaga
     */
    static extractBasicKeywords(text) {
        const commonWords = ['o', 'a', 'de', 'da', 'do', 'para', 'com', 'em', 'e', 'ou', 'que', 'se'];
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !commonWords.includes(word))
            .slice(0, 20); // Primeiras 20 palavras relevantes

        return [...new Set(words)]; // Remove duplicatas
    }

    /**
     * Extrai keywords simples (versão mais básica)
     */
    static extractSimpleKeywords(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3)
            .slice(0, 10);
    }

    /**
     * Extrai títulos de cargos de um texto
     */
    static extractJobTitles(text) {
        const titlePatterns = [
            /analista/gi, /desenvolvedor/gi, /gerente/gi, /coordenador/gi,
            /especialista/gi, /consultor/gi, /assistente/gi, /supervisor/gi,
            /diretor/gi, /manager/gi, /lead/gi, /senior/gi, /junior/gi
        ];

        const titles = [];
        titlePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                titles.push(...matches.map(m => m.toLowerCase()));
            }
        });

        return [...new Set(titles)];
    }

    /**
     * Extrai informações de experiência
     */
    static extractExperienceInfo(text) {
        const experiencePatterns = [
            /experiência\s+em\s+([^.]+)/gi,
            /trabalho\s+com\s+([^.]+)/gi,
            /atuação\s+em\s+([^.]+)/gi
        ];

        const experiences = [];
        experiencePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                experiences.push(...matches);
            }
        });

        return experiences;
    }

    /**
     * Calcula similaridade entre duas strings
     */
    static calculateStringSimilarity(str1, str2) {
        const words1 = str1.toLowerCase().split(/\s+/);
        const words2 = str2.toLowerCase().split(/\s+/);

        const commonWords = words1.filter(word => words2.includes(word));
        const totalWords = [...new Set([...words1, ...words2])].length;

        return totalWords > 0 ? commonWords.length / totalWords : 0;
    }

    /**
     * Analisa progressão de carreira
     */
    static analyzeCareerProgression(resumeText) {
        const seniorityOrder = ['estagiário', 'trainee', 'junior', 'pleno', 'senior', 'lead', 'manager', 'diretor'];
        const levels = [];

        seniorityOrder.forEach((level, index) => {
            if (resumeText.toLowerCase().includes(level)) {
                levels.push(index);
            }
        });

        // Verificar se há progressão (níveis crescentes)
        if (levels.length <= 1) return 0.5;

        const hasProgression = levels.some((level, index) =>
            index > 0 && level > levels[index - 1]
        );

        return hasProgression ? 1 : 0.3;
    }
}

module.exports = ATSUniversalHelpers; 