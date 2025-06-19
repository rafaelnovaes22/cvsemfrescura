module.exports = {
    firecrawl: {
        apiKey: process.env.FIRECRAWL_API_KEY,
        baseUrl: process.env.FIRECRAWL_BASE_URL || 'https://api.firecrawl.dev',
        timeout: 30000,
        maxRetries: 3,
        formats: ['markdown', 'json'],
        options: {
            onlyMainContent: true,
            includeTags: ['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li', 'div'],
            excludeTags: ['nav', 'footer', 'header', 'aside', 'script', 'style'],
            waitFor: 3000, // aguardar JavaScript carregar
            screenshot: false, // ativar apenas para debug
        }
    },

    // ESTRATÉGIA: FIRECRAWL FIRST - usar sempre que conseguir extrair info essencial
    // Informações OBRIGATÓRIAS para validar sucesso:
    // 1. Título da vaga
    // 2. Responsabilidades e atribuições  
    // 3. Requisitos e qualificações
    requiredFields: ['title', 'responsibilities', 'requirements'],

    // Configurações específicas por plataforma
    platforms: {
        gupy: {
            requiresFirecrawl: true,
            actions: [
                { type: 'wait', milliseconds: 5000 },
                { type: 'scroll', direction: 'down', amount: 3 },
                { type: 'click', selector: '.btn-expandir, .mostrar-mais', optional: true }
            ],
            extractSchema: {
                title: 'string - Título exato da vaga de emprego',
                responsibilities: 'array - Lista detalhada de responsabilidades, atribuições, atividades e funções da vaga. Inclua tudo relacionado ao que o profissional fará no dia a dia',
                requirements: 'array - Lista completa de requisitos, qualificações, competências técnicas, experiência necessária, formação exigida e habilidades',
                description: 'string - Descrição geral completa da vaga',
                benefits: 'array - Benefícios oferecidos pela empresa',
                company: 'string - Nome da empresa que oferece a vaga',
                location: 'string - Localização, cidade, estado da vaga',
                salary: 'string - Salário, faixa salarial ou remuneração',
                workModel: 'string - Modelo de trabalho (presencial, remoto, híbrido)'
            }
        },

        linkedin: {
            requiresFirecrawl: true,
            actions: [
                { type: 'wait', milliseconds: 4000 },
                { type: 'click', selector: '[data-test-modal-close-btn], .artdeco-modal__dismiss', optional: true }
            ],
            extractSchema: {
                title: 'string - Título da posição/vaga no LinkedIn',
                responsibilities: 'array - Responsabilidades e atividades principais descritas na vaga',
                requirements: 'array - Qualificações, requisitos e experiência necessária listada',
                description: 'string - Descrição completa da oportunidade',
                company: 'string - Nome da empresa',
                location: 'string - Localização da vaga',
                workModel: 'string - Remoto, presencial ou híbrido'
            }
        },

        indeed: {
            requiresFirecrawl: true, // Tentar Firecrawl primeiro
            actions: [
                { type: 'wait', milliseconds: 3000 }
            ],
            extractSchema: {
                title: 'string - Título da vaga no Indeed',
                responsibilities: 'array - Descrição das responsabilidades e tarefas',
                requirements: 'array - Requisitos, qualificações e experiência exigida',
                description: 'string - Descrição geral da posição',
                company: 'string - Nome da empresa',
                location: 'string - Cidade e estado da vaga',
                salary: 'string - Salário informado se disponível'
            }
        },

        workday: {
            requiresFirecrawl: true,
            actions: [
                { type: 'wait', milliseconds: 6000 },
                { type: 'scroll', direction: 'down', amount: 2 }
            ],
            extractSchema: {
                title: 'string - Título da posição no Workday',
                responsibilities: 'array - Funções e responsabilidades do cargo',
                requirements: 'array - Qualificações mínimas e preferenciais',
                description: 'string - Descrição detalhada da oportunidade',
                company: 'string - Nome da organização',
                location: 'string - Localização da posição'
            }
        },

        generic: {
            requiresFirecrawl: true, // Tentar sempre primeiro
            extractSchema: {
                title: 'string - Título da vaga ou posição',
                responsibilities: 'array - Lista de responsabilidades, atividades e atribuições',
                requirements: 'array - Requisitos, qualificações e competências necessárias',
                description: 'string - Descrição geral da vaga',
                company: 'string - Nome da empresa se disponível',
                location: 'string - Localização se informada'
            }
        }
    },

    // Configuração da estratégia Firecrawl First
    strategy: {
        mode: 'firecrawl_first', // sempre tentar Firecrawl primeiro
        fallbackToLegacy: true,   // usar legacy apenas se Firecrawl falhar
        requiredFields: ['title', 'responsibilities', 'requirements'],
        maxRetries: 2
    }
}; 