const relevantScraper = require('./relevantJobScraper');
const hybridScraper = require('./hybridJobScraper');
const scrapingConfig = require('../config/scraping');

/**
 * Extração de múltiplas URLs com scraper legacy
 * 
 * Usa apenas o scraper legacy para extrair conteúdo das URLs
 */
exports.extractMultiple = async (links, options = {}) => {
  try {
    console.log(`[URLExtractor] 🚀 Iniciando extração: ${links.length} URLs`);

    // Usar o scraper híbrido (agora simplificado para apenas legacy)
    const result = await hybridScraper.extractMultiple(links, {
      ...options,
      strategy: 'legacy_only'
    });

    // Se o resultado tem estrutura detalhada, processar adequadamente
    if (result && result.results) {
      console.log(`[URLExtractor] ✅ Processadas ${result.successful}/${result.total} URLs`);
      console.log(`[URLExtractor] 📊 Taxa de sucesso: ${result.successRate}%`);

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

        // Fallback para content se não tem estrutura
        if (!combinedText.trim() && item.content) {
          combinedText = item.content;
        }

        return combinedText || item.text || '';
      });

      const finalText = texts.join('\n---\n');

      // Adicionar metadados úteis como propriedades
      finalText.extractionStats = {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        successRate: result.successRate
      };
      finalText.detailedResults = result.results;

      return finalText;

    } else {
      // Resultado em formato simples/texto
      return result || '';
    }

  } catch (error) {
    console.error('[URLExtractor] ❌ Erro no scraping, tentando fallback legacy:', error.message);
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
