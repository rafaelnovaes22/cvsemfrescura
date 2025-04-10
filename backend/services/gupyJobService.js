/**
 * Serviço para processar vagas da plataforma Gupy
 * Especializado em extrair as seções relevantes para análise ATS
 */
const axios = require('axios');
const cheerio = require('cheerio');

class GupyJobService {
  /**
   * Verifica se a URL pertence a uma vaga da Gupy
   * @param {string} url - URL da vaga
   * @returns {boolean} - Se é uma URL da Gupy
   */
  isGupyJob(url) {
    return url && (
      url.includes('gupy.io') || 
      url.includes('boards.greenhouse.io') ||
      url.includes('kenoby.com') ||
      url.includes('vagas.com.br')
    );
  }

  /**
   * Extrai as seções relevantes de uma vaga da Gupy
   * @param {string} url - URL da vaga na Gupy
   * @returns {Promise<Object>} - Descrição da vaga com seções estruturadas
   */
  async extractGupyJobSections(url) {
    try {
      console.log(`[GupyJobService] Extraindo informações da vaga: ${url}`);
      
      // Fazer request para a página da vaga
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      });
      
      // Carregar HTML
      const $ = cheerio.load(response.data);
      
      // Estrutura para armazenar as seções extraídas
      const sections = {
        responsibilities: null,
        requirements: null,
        fullDescription: null
      };
      
      // Extrair a descrição completa da vaga
      const fullDescription = $('.job-description, .job-details, .job__description, #section-job-description')
        .text()
        .trim();
      
      sections.fullDescription = fullDescription;
      
      // Extrair seções específicas
      
      // Método 1: Procurar por cabeçalhos específicos
      const headings = $('h1, h2, h3, h4, strong, b');
      
      headings.each((i, el) => {
        const headingText = $(el).text().trim().toLowerCase();
        
        if (headingText.includes('responsabilidades') || 
            headingText.includes('atribuições') || 
            headingText.includes('o que você vai fazer')) {
          
          let responsibilitiesText = '';
          let currentNode = $(el).next();
          
          while (currentNode.length && !currentNode.is('h1, h2, h3, h4, strong, b')) {
            responsibilitiesText += currentNode.text().trim() + ' ';
            currentNode = currentNode.next();
          }
          
          if (responsibilitiesText.trim()) {
            sections.responsibilities = responsibilitiesText.trim();
          }
        }
        
        if (headingText.includes('requisitos') || 
            headingText.includes('qualificações') || 
            headingText.includes('o que buscamos') ||
            headingText.includes('o que esperamos')) {
          
          let requirementsText = '';
          let currentNode = $(el).next();
          
          while (currentNode.length && !currentNode.is('h1, h2, h3, h4, strong, b')) {
            requirementsText += currentNode.text().trim() + ' ';
            currentNode = currentNode.next();
          }
          
          if (requirementsText.trim()) {
            sections.requirements = requirementsText.trim();
          }
        }
      });
      
      // Método 2: Tentar encontrar seções baseadas em divisões de texto
      if (!sections.responsibilities && !sections.requirements) {
        const paragraphs = $('p, li, div');
        
        paragraphs.each((i, el) => {
          const text = $(el).text().trim().toLowerCase();
          
          if (text.includes('responsabilidades') || text.includes('atribuições')) {
            sections.responsibilities = $(el).text().trim();
          }
          
          if (text.includes('requisitos') || text.includes('qualificações')) {
            sections.requirements = $(el).text().trim();
          }
        });
      }
      
      // Se não encontrou usando métodos específicos, tentar extração por regex
      if (!sections.responsibilities || !sections.requirements) {
        const respMatch = fullDescription.match(/(?:Responsabilidades|Atribuições|O que você vai fazer)[:\s]*([\s\S]*?)(?=(?:Requisitos|Qualificações|O que buscamos|Benefícios|Sobre a empresa|$))/i);
        
        if (respMatch && respMatch[1]) {
          sections.responsibilities = respMatch[1].trim();
        }
        
        const reqMatch = fullDescription.match(/(?:Requisitos|Qualificações|O que buscamos|O que esperamos)[:\s]*([\s\S]*?)(?=(?:Benefícios|Sobre a empresa|Local|$))/i);
        
        if (reqMatch && reqMatch[1]) {
          sections.requirements = reqMatch[1].trim();
        }
      }
      
      console.log(`[GupyJobService] Extração concluída para: ${url}`);
      
      return {
        title: $('title').text().trim(),
        responsibilities: sections.responsibilities,
        requirements: sections.requirements,
        fullDescription: sections.fullDescription,
        url: url
      };
    } catch (error) {
      console.error(`[GupyJobService] Erro ao extrair vaga da Gupy: ${error.message}`);
      return {
        title: null,
        responsibilities: null,
        requirements: null,
        fullDescription: null,
        url: url,
        error: error.message
      };
    }
  }
  
  /**
   * Formata a descrição de vaga da Gupy para análise ATS
   * @param {Object} gupyJobData - Dados extraídos da vaga da Gupy
   * @returns {string} - Descrição formatada para análise ATS
   */
  formatJobDescriptionForATS(gupyJobData) {
    let formattedDescription = '';
    
    if (gupyJobData.title) {
      formattedDescription += `Vaga: ${gupyJobData.title}\n\n`;
    }
    
    // Priorizar as seções específicas se disponíveis
    if (gupyJobData.responsibilities) {
      formattedDescription += `Responsabilidades e atribuições:\n${gupyJobData.responsibilities}\n\n`;
    }
    
    if (gupyJobData.requirements) {
      formattedDescription += `Requisitos e qualificações:\n${gupyJobData.requirements}\n\n`;
    }
    
    // Se nenhuma seção específica foi encontrada, usar a descrição completa
    if (!gupyJobData.responsibilities && !gupyJobData.requirements && gupyJobData.fullDescription) {
      formattedDescription += `Descrição da vaga:\n${gupyJobData.fullDescription}\n\n`;
    }
    
    return formattedDescription.trim();
  }
  
  /**
   * Processa uma URL de vaga da Gupy para análise ATS
   * @param {string} url - URL da vaga na Gupy
   * @returns {Promise<string>} - Descrição formatada para análise ATS
   */
  async processGupyJobUrl(url) {
    try {
      // Verificar se é uma URL da Gupy
      if (!this.isGupyJob(url)) {
        console.log(`[GupyJobService] URL não reconhecida como Gupy: ${url}`);
        return null;
      }
      
      // Extrair seções da vaga
      const jobData = await this.extractGupyJobSections(url);
      
      // Formatar para análise ATS
      return this.formatJobDescriptionForATS(jobData);
    } catch (error) {
      console.error(`[GupyJobService] Erro ao processar URL da Gupy: ${error.message}`);
      return null;
    }
  }
}

module.exports = new GupyJobService();
