/**
 * Controlador para gerenciar o feedback dos usuários
 * sobre possíveis alucinações ou erros do modelo
 */

const feedbackCollector = require('../utils/feedbackCollector');
const openaiService = require('../services/openaiService');

/**
 * Registra um novo feedback sobre uma resposta do modelo
 * @param {Object} req Objeto de requisição
 * @param {Object} res Objeto de resposta
 */
async function recordFeedback(req, res) {
  try {
    const feedbackData = req.body;
    
    // Validação básica
    if (!feedbackData || !feedbackData.sessionId || !feedbackData.feedbackType) {
      return res.status(400).json({
        success: false,
        error: 'Dados de feedback inválidos ou incompletos'
      });
    }
    
    // Grava o feedback usando o serviço
    const result = await openaiService.recordModelFeedback(feedbackData);
    
    if (result) {
      res.status(201).json({
        success: true,
        message: 'Feedback registrado com sucesso'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erro ao registrar feedback'
      });
    }
  } catch (error) {
    console.error('Erro no controlador de feedback:', error);
    res.status(500).json({
      success: false,
      error: `Erro interno: ${error.message}`
    });
  }
}

/**
 * Obtém estatísticas sobre os feedbacks recebidos
 * @param {Object} req Objeto de requisição
 * @param {Object} res Objeto de resposta
 */
async function getFeedbackStats(req, res) {
  try {
    // Verifica autenticação administrativa (implementação básica)
    const authToken = req.headers['x-admin-token'];
    
    if (!authToken || authToken !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({
        success: false,
        error: 'Não autorizado'
      });
    }
    
    const stats = await openaiService.getFeedbackStats();
    const patterns = await feedbackCollector.analyzeFeedbackPatterns();
    
    res.status(200).json({
      success: true,
      statistics: stats,
      patterns
    });
  } catch (error) {
    console.error('Erro ao recuperar estatísticas de feedback:', error);
    res.status(500).json({
      success: false,
      error: `Erro interno: ${error.message}`
    });
  }
}

/**
 * Obtém os feedbacks recentes para análise
 * @param {Object} req Objeto de requisição
 * @param {Object} res Objeto de resposta
 */
async function getRecentFeedbacks(req, res) {
  try {
    // Verifica autenticação administrativa (implementação básica)
    const authToken = req.headers['x-admin-token'];
    
    if (!authToken || authToken !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({
        success: false,
        error: 'Não autorizado'
      });
    }
    
    const limit = parseInt(req.query.limit) || 50;
    const feedbacks = await feedbackCollector.getRecentFeedbacks(limit);
    
    res.status(200).json({
      success: true,
      count: feedbacks.length,
      feedbacks
    });
  } catch (error) {
    console.error('Erro ao recuperar feedbacks recentes:', error);
    res.status(500).json({
      success: false,
      error: `Erro interno: ${error.message}`
    });
  }
}

module.exports = {
  recordFeedback,
  getFeedbackStats,
  getRecentFeedbacks
};
