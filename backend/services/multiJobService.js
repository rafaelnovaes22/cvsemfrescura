/**
 * Serviço para processar múltiplos links de vagas em paralelo
 * Integra serviços de scraping e extração ATS
 */
const { scrapeJobDetails } = require('./scrapingService');
const gupyJobService = require('./gupyJobService');
const openaiService = require('./openaiService');

class MultiJobService {
  /**
   * Processa múltiplos links de vagas, extrai seus conteúdos e consolida
   * @param {string[]} urls - Lista de URLs de vagas a serem processadas (máx. 7)
   * @returns {Promise<Object>} - Resultado da análise ATS combinada
   */
  async processMultipleJobUrls(urls) {
    try {
      console.log(`[MultiJobService] Iniciando processamento de ${urls.length} URLs`);
      
      // Limitar a 7 URLs no máximo
      const limitedUrls = urls.slice(0, 7);
      
      // Array para armazenar os resultados da extração
      const extractionResults = [];
      
      // Processar URLs em paralelo para maior eficiência
      const extractionPromises = limitedUrls.map(async (url, index) => {
        console.log(`[MultiJobService] Processando URL #${index + 1}: ${url}`);
        
        try {
          let jobDescription;
          
          // Verificar se é uma URL do tipo Gupy e usar o serviço específico se for
          if (gupyJobService.isGupyJob(url)) {
            console.log(`[MultiJobService] URL #${index + 1} identificada como Gupy ou similar`);
            jobDescription = await gupyJobService.processGupyJobUrl(url);
          }
          
          // Se não for Gupy ou falhar, usar o serviço de scraping genérico
          if (!jobDescription) {
            console.log(`[MultiJobService] Usando serviço de scraping genérico para URL #${index + 1}`);
            const scrapedData = await scrapeJobDetails(url);
            
            // Formatar dados do scraping para o formato esperado
            jobDescription = this.formatScrapedDataForATS(scrapedData);
          }
          
          // Se conseguiu extrair descrição, adicionar ao resultado
          if (jobDescription) {
            return {
              url,
              success: true,
              description: jobDescription
            };
          } else {
            return {
              url,
              success: false,
              error: 'Não foi possível extrair a descrição da vaga'
            };
          }
        } catch (error) {
          console.error(`[MultiJobService] Erro ao processar URL #${index + 1}: ${error.message}`);
          return {
            url,
            success: false,
            error: error.message
          };
        }
      });
      
      // Aguardar todas as extrações terminarem
      const results = await Promise.all(extractionPromises);
      
      // Filtrar apenas as extrações bem-sucedidas
      const successfulExtractions = results.filter(result => result.success);
      
      // Se não houver extrações bem-sucedidas, retornar erro
      if (successfulExtractions.length === 0) {
        return {
          success: false,
          message: 'Não foi possível extrair descrições de nenhuma das URLs fornecidas',
          failedUrls: results.map(r => ({ url: r.url, error: r.error }))
        };
      }
      
      // Consolidar as descrições em um único texto para análise ATS
      const consolidatedDescription = this.consolidateDescriptions(successfulExtractions);
      
      // Executar análise ATS usando o serviço OpenAI
      console.log(`[MultiJobService] Executando análise ATS das descrições consolidadas`);
      const atsAnalysis = await openaiService.extractAtsJobKeywords(consolidatedDescription);
      
      // Adicionar metadados ao resultado
      return {
        success: true,
        data: atsAnalysis,
        processedUrls: successfulExtractions.map(r => r.url),
        failedUrls: results.filter(r => !r.success).map(r => ({ url: r.url, error: r.error })),
        totalProcessed: results.length,
        successfullyProcessed: successfulExtractions.length
      };
      
    } catch (error) {
      console.error(`[MultiJobService] Erro durante processamento múltiplo: ${error.message}`);
      return {
        success: false,
        message: `Erro ao processar múltiplas URLs: ${error.message}`
      };
    }
  }
  
  /**
   * Formata dados raspados para análise ATS
   * @param {Object} scrapedData - Dados extraídos pelo serviço de scraping
   * @returns {string} - Descrição formatada para análise ATS
   */
  formatScrapedDataForATS(scrapedData) {
    if (!scrapedData || !scrapedData.description || scrapedData.description === 'Descrição não encontrada') {
      return null;
    }
    
    let formattedDescription = '';
    
    if (scrapedData.title && scrapedData.title !== 'Título não encontrado') {
      formattedDescription += `Vaga: ${scrapedData.title}\n\n`;
    }
    
    if (scrapedData.company && scrapedData.company !== 'Empresa não encontrada') {
      formattedDescription += `Empresa: ${scrapedData.company}\n\n`;
    }
    
    formattedDescription += `Descrição da vaga:\n${scrapedData.description}\n\n`;
    
    return formattedDescription.trim();
  }
  
  /**
   * Consolida múltiplas descrições em um único texto
   * @param {Array} extractions - Lista de extrações bem-sucedidas
   * @returns {string} - Texto consolidado para análise
   */
  consolidateDescriptions(extractions) {
    let consolidated = 'DESCRIÇÕES DE VAGAS CONSOLIDADAS\n\n';
    
    extractions.forEach((extraction, index) => {
      consolidated += `=== VAGA ${index + 1} ===\n\n`;
      consolidated += `${extraction.description}\n\n`;
      consolidated += `--- URL: ${extraction.url} ---\n\n`;
    });
    
    return consolidated;
  }
}

module.exports = new MultiJobService();
