const relevantScraper = require('./relevantJobScraper');
const hybridScraper = require('./hybridJobScraper');
const scrapingConfig = require('../config/scraping');

/**
 * Extração de múltiplas URLs com estratégia FIRECRAWL FIRST
 * 
 * SEMPRE tenta Firecrawl primeiro para todas as URLs
 * Fallback para legacy apenas se Firecrawl falhar na validação de conteúdo essencial
 */
exports.extractMultiple = async (links, options = {}) => {
  try {
    console.log(`[URLExtractor] 🚀 FIRECRAWL FIRST: ${links.length} URLs`);

    // Usar SEMPRE o scraper híbrido (que implementa FIRECRAWL FIRST)
    const result = await hybridScraper.extractMultiple(links, {
      ...options,
      strategy: 'firecrawl_first'
    });

    // Se o resultado tem estrutura detalhada, processar adequadamente
    if (result && result.results) {
      console.log(`[URLExtractor] ✅ Processadas ${result.summary.successful}/${result.summary.total} URLs`);
      console.log(`[URLExtractor] 📊 Info essencial: ${result.summary.essentialInfo}/${result.summary.successful} (${result.summary.essentialInfoRate})`);

      // Extrair textos para compatibilidade com sistema atual
      const texts = result.results.map(item => {
        // Combinar título, responsabilidades e requisitos se disponível
        let combinedText = '';

        if (item.title) {
          combinedText += `TÍTULO: ${item.title}\n\n`;
        }

        if (item.responsibilities && item.responsibilities.length > 0) {
          combinedText += `RESPONSABILIDADES:\n${item.responsibilities.map(r => `• ${r}`).join('\n')}\n\n`;
        }

        if (item.requirements && item.requirements.length > 0) {
          combinedText += `REQUISITOS:\n${item.requirements.map(r => `• ${r}`).join('\n')}\n\n`;
        }

        if (item.description) {
          combinedText += `DESCRIÇÃO:\n${item.description}\n\n`;
        }

        // Fallback para fullText se não tem estrutura
        if (!combinedText.trim() && item.fullText) {
          combinedText = item.fullText;
        }

        return combinedText || item.text || '';
      });

      const finalText = texts.join('\n---\n');

      // Adicionar metadados úteis como propriedades
      finalText.extractionStats = result.summary;
      finalText.detailedResults = result.results;

      return finalText;

    } else {
      // Resultado em formato simples/texto
      return result || '';
    }

  } catch (error) {
    console.error('[URLExtractor] ❌ Erro no FIRECRAWL FIRST, fallback para legacy:', error.message);
    return await this.extractMultipleLegacy(links);
  }
};

// Manter método legacy como fallback
exports.extractMultipleLegacy = async (links) => {
  const texts = [];
  for (const url of links) {
    try {
      const relevant = await relevantScraper.extractRelevantSections(url);
      texts.push(relevant);
    } catch (e) {
      texts.push('');
    }
  }
  return texts.join('\n---\n');
};
