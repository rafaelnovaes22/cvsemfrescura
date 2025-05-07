/**
 * Sistema de fallback para respostas do modelo
 * Fornece respostas predefinidas quando a análise é considerada alucinada
 */

/**
 * Template de resposta para quando o modelo falha na análise
 * @type {Object}
 */
const defaultFallbackTemplate = {
  perfil_vagas: [{
    vaga_id: 1,
    cargo: "Não foi possível determinar",
    area: "Não identificada",
    nivel: "Não identificado",
    modelo_trabalho: "Não identificado",
    tipo_contrato: "Não identificado",
    empresa: "",
    localizacao: "",
    faixa_salarial: "",
    compatibilidade_percentual: 0
  }],
  hard_skills: {
    tecnicos: [
      "Não foi possível extrair hard skills técnicas",
      "Recomendamos analisar manualmente a descrição da vaga",
      "Você pode tentar novamente com uma descrição mais clara"
    ],
    formacao: [],
    idiomas: [],
    experiencia: [
      "Experiência não identificada automaticamente",
      "Verifique os requisitos de experiência na descrição da vaga"
    ]
  },
  soft_skills: {
    comportamentais: [
      "Não foi possível extrair soft skills comportamentais",
      "Recomendamos analisar manualmente a descrição da vaga"
    ],
    gestao: []
  },
  responsabilidades: [
    "Não foi possível extrair responsabilidades",
    "Recomendamos analisar manualmente a descrição da vaga"
  ],
  recomendacoes: {
    termos_adicionar: [
      "Recomendamos incluir termos específicos da vaga no seu currículo",
      "Adapte seu currículo para refletir os requisitos essenciais da vaga",
      "Destaque suas experiências mais relevantes para esta oportunidade"
    ],
    secoes_expandir: [
      "Experiência profissional",
      "Formação",
      "Habilidades técnicas"
    ],
    reformulacoes: [
      "Ajuste seu currículo para destacar conquistas e resultados quantificáveis",
      "Use os termos exatos da descrição da vaga quando apropriado"
    ],
    formatacao: [
      "Organize seu currículo com seções claras e bem definidas",
      "Use marcadores para maior legibilidade",
      "Mantenha o documento conciso e focado nas informações mais relevantes"
    ]
  },
  erro_analise: {
    codigo: "ANALISE_IMPRECISA",
    mensagem: "Não foi possível completar a análise com precisão. Por favor, tente novamente ou entre em contato com o suporte se o problema persistir.",
    sugestoes: [
      "Verifique se a descrição da vaga está completa",
      "Tente fornecer um currículo mais detalhado",
      "Divida a análise em múltiplas vagas menores se estiver analisando muitas vagas simultaneamente"
    ]
  }
};

/**
 * Template específico para vagas de TI
 * @type {Object}
 */
const tiFallbackTemplate = {
  perfil_vagas: [{
    vaga_id: 1,
    cargo: "Não foi possível determinar com precisão",
    area: "Tecnologia da Informação",
    nivel: "Não identificado",
    modelo_trabalho: "Não identificado",
    tipo_contrato: "Não identificado",
    empresa: "",
    localizacao: "",
    faixa_salarial: "",
    compatibilidade_percentual: 0
  }],
  hard_skills: {
    tecnicos: [
      "Linguagens de programação",
      "Frameworks e bibliotecas",
      "Bancos de dados",
      "Cloud computing",
      "DevOps",
      "Metodologias ágeis",
      "Ferramentas de controle de versão"
    ],
    formacao: [
      "Formação na área de TI (Ciência da Computação, Engenharia de Software, etc.)"
    ],
    idiomas: [
      "Inglês técnico"
    ],
    experiencia: [
      "Experiência em desenvolvimento de software",
      "Participação em projetos de tecnologia"
    ]
  },
  soft_skills: {
    comportamentais: [
      "Resolução de problemas",
      "Trabalho em equipe",
      "Comunicação",
      "Adaptabilidade",
      "Aprendizado contínuo"
    ],
    gestao: [
      "Gestão de tempo",
      "Organização"
    ]
  },
  responsabilidades: [
    "Desenvolvimento e manutenção de software",
    "Documentação técnica",
    "Correção de bugs",
    "Participação em reuniões de equipe",
    "Implementação de novas funcionalidades"
  ],
  recomendacoes: {
    termos_adicionar: [
      "Inclua termos técnicos específicos relacionados à vaga",
      "Mencione projetos relevantes com as tecnologias exigidas",
      "Destaque certificações técnicas",
      "Adicione métricas e resultados quantificáveis"
    ],
    secoes_expandir: [
      "Experiência profissional com tecnologias específicas",
      "Projetos técnicos",
      "Formação e certificações técnicas"
    ],
    reformulacoes: [
      "Destaque experiências com as tecnologias mencionadas na vaga",
      "Use termos técnicos precisos e atualizados"
    ],
    formatacao: [
      "Organize suas habilidades técnicas em categorias",
      "Destaque os projetos mais relevantes para a vaga",
      "Inclua links para portfolio ou GitHub se apropriado"
    ]
  },
  erro_analise: {
    codigo: "ANALISE_IMPRECISA_TI",
    mensagem: "Não foi possível completar a análise de TI com precisão. Sugerimos analisar manualmente a vaga.",
    sugestoes: [
      "Verifique as tecnologias específicas mencionadas na vaga",
      "Identifique requisitos de experiência com frameworks ou linguagens",
      "Observe metodologias de desenvolvimento mencionadas"
    ]
  }
};

/**
 * Retorna um modelo de resposta adequado com base nas informações disponíveis
 * @param {string} jobText - Texto da vaga 
 * @param {string} resumeText - Texto do currículo
 * @returns {Object} - Template de resposta
 */
function getFallbackResponse(jobText, resumeText) {
  // Detecta se parece ser uma vaga de TI com verificação simples de palavras-chave
  const isTechJob = [
    'programa', 'desenvolve', 'software', 'system', 'código', 'código',
    'java', 'python', 'javascript', 'react', 'angular', 'vue', 'node',
    'cloud', 'aws', 'azure', 'devops', 'agile', 'scrum', 'kanban',
    'front-end', 'frontend', 'back-end', 'backend', 'fullstack', 'full-stack',
    'developer', 'desenvolvedor', 'programador', 'engineer', 'engenheiro de software'
  ].some(keyword => 
    jobText.toLowerCase().includes(keyword.toLowerCase())
  );
  
  // Se parece ser uma vaga de TI, usa o template específico
  if (isTechJob) {
    return { ...tiFallbackTemplate };
  }
  
  // Caso contrário, retorna o template padrão
  return { ...defaultFallbackTemplate };
}

/**
 * Mescla resultados parciais com um template de fallback
 * para garantir uma resposta completa
 * @param {Object} partialResult - Resultado parcial da análise
 * @param {Object} fallbackTemplate - Template de fallback
 * @returns {Object} - Resultado mesclado
 */
function mergeWithFallback(partialResult, fallbackTemplate) {
  // Cria uma cópia do template para não modificar o original
  const result = JSON.parse(JSON.stringify(fallbackTemplate));
  
  try {
    // Se partialResult não existe, retorna apenas o template
    if (!partialResult) return result;
    
    // Função para mesclar recursivamente objetos e arrays
    const merge = (target, source) => {
      if (!source) return target;
      
      // Para cada propriedade no source
      for (const key of Object.keys(source)) {
        // Se a propriedade existir no target e ambas forem objetos (não arrays)
        if (target[key] && typeof target[key] === 'object' && 
            typeof source[key] === 'object' && 
            !Array.isArray(target[key]) && !Array.isArray(source[key])) {
          // Mescla recursivamente os objetos
          merge(target[key], source[key]);
        } 
        // Se ambas forem arrays, concatena os elementos únicos
        else if (Array.isArray(target[key]) && Array.isArray(source[key])) {
          // Adiciona apenas elementos únicos do source ao target
          for (const item of source[key]) {
            if (!target[key].includes(item)) {
              target[key].push(item);
            }
          }
        } 
        // Caso contrário, prefere o valor do source
        else if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
          target[key] = source[key];
        }
      }
      
      return target;
    };
    
    // Mescla o resultado parcial com o template
    return merge(result, partialResult);
  } catch (error) {
    console.error(`Erro ao mesclar com fallback: ${error.message}`);
    return result;
  }
}

module.exports = {
  defaultFallbackTemplate,
  tiFallbackTemplate,
  getFallbackResponse,
  mergeWithFallback
};
