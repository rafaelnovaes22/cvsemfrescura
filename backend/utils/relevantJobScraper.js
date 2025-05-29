const axios = require('axios');
const cheerio = require('cheerio');

// 🔧 VERSÃO MELHORADA V2.1 - Taxa de sucesso alvo: 85%
const SECTION_TITLES = [
  // Português
  'atribuições', 'responsabilidades', 'atividades', 'requisitos', 'qualificações',
  'perfil', 'o que esperamos', 'o que buscamos', 'descrição da vaga', 'descrição',
  'principais atividades', 'escopo', 'função', 'cargo', 'posição', 'oportunidade',
  'missão', 'desafios', 'competências', 'habilidades', 'conhecimentos',
  'experiência', 'formação', 'benefícios', 'oferecemos', 'sobre a vaga',
  'sobre o cargo', 'detalhes', 'informações', 'vaga', 'job description',

  // Inglês  
  'responsibility', 'requirement', 'qualification', 'activities', 'profile',
  'what we expect', 'what we are looking for', 'job description', 'description',
  'main activities', 'scope', 'role', 'position', 'opportunity', 'mission',
  'challenges', 'skills', 'knowledge', 'experience', 'education', 'benefits',
  'we offer', 'about the role', 'about the position', 'details', 'information'
];

// Seletores CSS comuns para vagas em diferentes plataformas
const PLATFORM_SELECTORS = {
  'gupy.io': [
    '.job-description',
    '.description-content',
    '.content-description',
    '[data-testid="job-description"]',
    '.sc-job-description'
  ],
  'linkedin.com': [
    '.show-more-less-html__markup',
    '.jobs-description__content',
    '.jobs-box__html-content',
    '.description__text'
  ],
  'catho.com': [
    '.job-description',
    '.vagas-description',
    '.description-content'
  ],
  'indeed.com': [
    '.jobsearch-jobDescriptionText',
    '#jobDescriptionText',
    '.jobDescriptionContent'
  ],
  'infojobs.com.br': [
    '.ij-offerdetails-description',
    '.offer-description',
    '.description-content'
  ],
  'vagas.com': [
    '.job-description',
    '.vaga-descricao',
    '.description'
  ],
  '99jobs.com': [
    '.job-description',
    '.description-content',
    '.job-content'
  ]
};

function isRelevantTitle(text) {
  const cleanText = text.toLowerCase().trim();
  return SECTION_TITLES.some(title =>
    cleanText.includes(title) ||
    title.includes(cleanText) ||
    // Fuzzy matching para capturar variações
    calculateStringSimilarity(cleanText, title) > 0.7
  );
}

// Função para calcular similaridade entre strings
function calculateStringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

// Detecta plataforma baseada na URL
function detectPlatform(url) {
  for (const platform of Object.keys(PLATFORM_SELECTORS)) {
    if (url.includes(platform)) {
      return platform;
    }
  }
  return null;
}

// Estratégia 1: Extração por seletores específicos da plataforma
function extractByPlatformSelectors($, platform) {
  const selectors = PLATFORM_SELECTORS[platform] || [];

  for (const selector of selectors) {
    const content = $(selector);
    if (content.length > 0) {
      const text = content.text().replace(/\s+/g, ' ').trim();
      if (text.length > 100) { // Mínimo de conteúdo
        console.log(`✅ [SCRAPER V2.1] Extraído via seletor ${selector}: ${text.length} chars`);
        return text;
      }
    }
  }

  return null;
}

// Estratégia 2: Extração por títulos de seção (método original melhorado)
function extractByRelevantSections($) {
  let result = [];
  let foundSection = false;

  // Procurar em mais elementos de título
  $('h1, h2, h3, h4, h5, h6, b, strong, .title, .heading, [class*="title"], [class*="heading"]').each((_, elem) => {
    const title = $(elem).text().trim();
    if (title.length > 3 && isRelevantTitle(title)) {
      foundSection = true;
      let sectionText = '';
      let next = $(elem).next();
      let count = 0;

      // Captura conteúdo após o título
      while (next.length && count < 25) {
        const tagName = next[0].tagName?.toLowerCase();

        // Parar se encontrar outro título
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
          break;
        }

        // Capturar conteúdo de diferentes tipos de elementos
        if (['ul', 'ol', 'p', 'div', 'span', 'li', 'section', 'article'].includes(tagName)) {
          const text = next.text().trim();
          if (text.length > 10) { // Filtrar textos muito curtos
            sectionText += text + ' ';
          }
        }

        next = next.next();
        count++;
      }

      if (sectionText.trim().length > 50) {
        result.push(`${title}: ${sectionText.trim()}`);
      }
    }
  });

  return foundSection ? result.join('\n\n') : null;
}

// Estratégia 3: Extração por palavras-chave no texto
function extractByKeywordDensity($) {
  const keywordPatterns = [
    /requisitos?[:\-\s][\s\S]{50,500}/gi,
    /responsabilidades?[:\-\s][\s\S]{50,500}/gi,
    /atividades?[:\-\s][\s\S]{50,500}/gi,
    /qualificações?[:\-\s][\s\S]{50,500}/gi,
    /habilidades?[:\-\s][\s\S]{50,500}/gi,
    /experiência[:\-\s][\s\S]{50,500}/gi,
    /formação[:\-\s][\s\S]{50,500}/gi
  ];

  const bodyText = $('body').text();
  const matches = [];

  keywordPatterns.forEach(pattern => {
    const found = bodyText.match(pattern);
    if (found) {
      matches.push(...found);
    }
  });

  return matches.length > 0 ? matches.join('\n\n').replace(/\s+/g, ' ').trim() : null;
}

// Estratégia 4: Fallback inteligente - seleciona o melhor conteúdo
function extractIntelligentFallback($) {
  // Elementos que provavelmente contêm descrição da vaga
  const candidateSelectors = [
    'main', '[role="main"]', '.main-content', '.content', '.container',
    '.job-content', '.vacancy-content', '.position-content', '.description',
    'article', 'section', '.text-content', '.job-info', '.details'
  ];

  const candidates = [];

  candidateSelectors.forEach(selector => {
    $(selector).each((_, elem) => {
      const text = $(elem).text().replace(/\s+/g, ' ').trim();
      const wordCount = text.split(' ').length;

      // Filtrar conteúdo com tamanho razoável
      if (wordCount >= 50 && wordCount <= 2000) {
        const keywords = SECTION_TITLES.filter(keyword =>
          text.toLowerCase().includes(keyword)
        ).length;

        candidates.push({
          text,
          wordCount,
          keywords,
          score: wordCount * 0.1 + keywords * 10
        });
      }
    });
  });

  // Retornar o candidato com melhor score
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].text;
  }

  return null;
}

exports.extractRelevantSections = async (url) => {
  try {
    console.log(`🔍 [SCRAPER V2.1] Iniciando extração melhorada: ${url}`);

    // Configuração de headers para evitar bloqueios
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };

    const { data } = await axios.get(url, {
      headers,
      timeout: 10000, // 10s timeout
      maxRedirects: 5
    });

    const $ = cheerio.load(data);
    const platform = detectPlatform(url);

    let extractedContent = null;
    let extractionMethod = '';

    // Estratégia 1: Seletores específicos da plataforma
    if (platform) {
      extractedContent = extractByPlatformSelectors($, platform);
      if (extractedContent) {
        extractionMethod = `platform_${platform}`;
      }
    }

    // Estratégia 2: Títulos de seção relevantes
    if (!extractedContent) {
      extractedContent = extractByRelevantSections($);
      if (extractedContent) {
        extractionMethod = 'relevant_sections';
      }
    }

    // Estratégia 3: Padrões de palavras-chave
    if (!extractedContent) {
      extractedContent = extractByKeywordDensity($);
      if (extractedContent) {
        extractionMethod = 'keyword_patterns';
      }
    }

    // Estratégia 4: Fallback inteligente
    if (!extractedContent) {
      extractedContent = extractIntelligentFallback($);
      if (extractedContent) {
        extractionMethod = 'intelligent_fallback';
      }
    }

    // Estratégia 5: Último recurso - todo o body
    if (!extractedContent) {
      extractedContent = $('body').text().replace(/\s+/g, ' ').trim();
      extractionMethod = 'full_body';
    }

    // Limpeza final do conteúdo
    if (extractedContent) {
      extractedContent = extractedContent
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
    }

    const success = extractedContent && extractedContent.length > 50;
    console.log(`${success ? '✅' : '❌'} [SCRAPER V2.1] ${extractionMethod}: ${extractedContent?.length || 0} chars extraídos`);

    return extractedContent || '';

  } catch (error) {
    console.error(`❌ [SCRAPER V2.1] Erro ao extrair ${url}:`, error.message);
    return '';
  }
};
