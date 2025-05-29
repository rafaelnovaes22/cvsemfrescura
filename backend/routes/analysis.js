const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const verifyToken = require('../utils/authMiddleware');

// Middleware de autenticação para todas as rotas
router.use(verifyToken);

/**
 * @route GET /api/analysis/history
 * @desc Buscar histórico de análises do usuário
 * @access Private
 */
router.get('/history', analysisController.getHistory);

/**
 * @route GET /api/analysis/:id
 * @desc Buscar uma análise específica por ID
 * @access Private
 */
router.get('/:id', analysisController.getAnalysisById);

/**
 * @route POST /api/analysis/:id/reprocess
 * @desc Reprocessar uma análise que falhou na exibição
 * @access Private
 */
router.post('/:id/reprocess', analysisController.reprocessAnalysis);

/**
 * @route DELETE /api/analysis/:id
 * @desc Deletar uma análise específica
 * @access Private
 */
router.delete('/:id', analysisController.deleteAnalysis);

module.exports = router; 