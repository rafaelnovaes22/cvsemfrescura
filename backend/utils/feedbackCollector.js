/**
 * Sistema de coleta de feedback para identificação de alucinações
 * Permite que os usuários sinalizem respostas incorretas ou alucinadas
 */

const fs = require('fs').promises;
const path = require('path');

// Caminho para o arquivo de feedback
const FEEDBACK_FILE = path.join(__dirname, '../data/feedback.json');

/**
 * Inicializa o sistema de feedback
 * Cria o arquivo de feedback se não existir
 */
async function initializeFeedbackSystem() {
  try {
    // Verifica se o diretório data existe
    try {
      await fs.mkdir(path.join(__dirname, '../data'), { recursive: true });
    } catch (err) {
      // Ignora erro se o diretório já existir
    }
    
    // Verifica se o arquivo de feedback existe
    try {
      await fs.access(FEEDBACK_FILE);
    } catch (err) {
      // Se não existir, cria um arquivo vazio com estrutura inicial
      await fs.writeFile(FEEDBACK_FILE, JSON.stringify({
        feedbacks: [],
        statistics: {
          total: 0,
          hallucinations: 0,
          incorrect_content: 0,
          other_issues: 0
        }
      }, null, 2));
    }
    
    return true;
  } catch (error) {
    console.error(`Erro ao inicializar sistema de feedback: ${error.message}`);
    return false;
  }
}

/**
 * Registra feedback do usuário sobre uma resposta
 * @param {Object} feedbackData - Dados do feedback
 * @returns {Promise<boolean>} - Sucesso do registro
 */
async function recordFeedback(feedbackData) {
  try {
    // Validação básica dos dados
    if (!feedbackData || !feedbackData.sessionId || !feedbackData.feedbackType) {
      throw new Error('Dados de feedback incompletos');
    }
    
    // Lê o arquivo de feedback atual
    const fileContent = await fs.readFile(FEEDBACK_FILE, 'utf8');
    const feedbackStore = JSON.parse(fileContent);
    
    // Prepara o item de feedback
    const feedbackItem = {
      id: `feedback_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      sessionId: feedbackData.sessionId,
      feedbackType: feedbackData.feedbackType,
      details: feedbackData.details || '',
      problematicContent: feedbackData.problematicContent || '',
      suggestedCorrection: feedbackData.suggestedCorrection || '',
      userAgent: feedbackData.userAgent || '',
      responseId: feedbackData.responseId || ''
    };
    
    // Adiciona o feedback à lista
    feedbackStore.feedbacks.push(feedbackItem);
    
    // Atualiza estatísticas
    feedbackStore.statistics.total += 1;
    
    // Incrementa o contador correspondente ao tipo de feedback
    if (feedbackData.feedbackType === 'hallucination') {
      feedbackStore.statistics.hallucinations += 1;
    } else if (feedbackData.feedbackType === 'incorrect_content') {
      feedbackStore.statistics.incorrect_content += 1;
    } else {
      feedbackStore.statistics.other_issues += 1;
    }
    
    // Salva o arquivo atualizado
    await fs.writeFile(FEEDBACK_FILE, JSON.stringify(feedbackStore, null, 2));
    
    return true;
  } catch (error) {
    console.error(`Erro ao registrar feedback: ${error.message}`);
    return false;
  }
}

/**
 * Recupera as estatísticas de feedback
 * @returns {Promise<Object>} - Estatísticas de feedback
 */
async function getFeedbackStatistics() {
  try {
    const fileContent = await fs.readFile(FEEDBACK_FILE, 'utf8');
    const feedbackStore = JSON.parse(fileContent);
    return feedbackStore.statistics;
  } catch (error) {
    console.error(`Erro ao recuperar estatísticas de feedback: ${error.message}`);
    return {
      total: 0,
      hallucinations: 0,
      incorrect_content: 0,
      other_issues: 0
    };
  }
}

/**
 * Recupera feedbacks recentes para análise
 * @param {number} limit - Número máximo de feedbacks a retornar
 * @returns {Promise<Array>} - Lista de feedbacks
 */
async function getRecentFeedbacks(limit = 50) {
  try {
    const fileContent = await fs.readFile(FEEDBACK_FILE, 'utf8');
    const feedbackStore = JSON.parse(fileContent);
    
    // Retorna os feedbacks mais recentes (ordenados por timestamp)
    return feedbackStore.feedbacks
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  } catch (error) {
    console.error(`Erro ao recuperar feedbacks recentes: ${error.message}`);
    return [];
  }
}

/**
 * Analisa padrões nos feedbacks para identificar problemas sistemáticos
 * @returns {Promise<Object>} - Análise de padrões
 */
async function analyzeFeedbackPatterns() {
  try {
    const fileContent = await fs.readFile(FEEDBACK_FILE, 'utf8');
    const feedbackStore = JSON.parse(fileContent);
    
    // Contagem de tipos de feedback
    const typeCounts = {
      hallucination: 0,
      incorrect_content: 0,
      other_issues: 0
    };
    
    // Análise de palavras comuns em problemas relatados
    const commonWords = {};
    
    // Processa cada feedback
    for (const feedback of feedbackStore.feedbacks) {
      // Contagem de tipos
      if (typeCounts[feedback.feedbackType] !== undefined) {
        typeCounts[feedback.feedbackType]++;
      }
      
      // Análise de palavras comuns no conteúdo problemático
      if (feedback.problematicContent) {
        const words = feedback.problematicContent
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(w => w.length > 3); // ignora palavras muito curtas
        
        for (const word of words) {
          commonWords[word] = (commonWords[word] || 0) + 1;
        }
      }
    }
    
    // Encontra as palavras mais comuns
    const topWords = Object.entries(commonWords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));
    
    return {
      typeCounts,
      topWords,
      totalFeedbacks: feedbackStore.feedbacks.length,
      recentFeedbackRate: feedbackStore.feedbacks
        .filter(f => new Date(f.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .length // feedbacks na última semana
    };
  } catch (error) {
    console.error(`Erro ao analisar padrões de feedback: ${error.message}`);
    return {
      typeCounts: { hallucination: 0, incorrect_content: 0, other_issues: 0 },
      topWords: [],
      totalFeedbacks: 0,
      recentFeedbackRate: 0
    };
  }
}

module.exports = {
  initializeFeedbackSystem,
  recordFeedback,
  getFeedbackStatistics,
  getRecentFeedbacks,
  analyzeFeedbackPatterns
};
