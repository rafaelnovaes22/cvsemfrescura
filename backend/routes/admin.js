const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../utils/authMiddleware');

// Middleware para verificar se é admin
const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Acesso negado. Token inválido.' });
    }

    // Verificar se o usuário é admin
    if (!req.user.isAdmin) {
        return res.status(403).json({
            error: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.'
        });
    }

    next();
};

// Dashboard com estatísticas
router.get('/dashboard', authMiddleware, adminMiddleware, adminController.getDashboard);

// Gestão de códigos
router.get('/codes', authMiddleware, adminMiddleware, adminController.listCodes);
router.post('/codes/bulk', authMiddleware, adminMiddleware, adminController.createBulkCodes);
router.put('/codes/:id', authMiddleware, adminMiddleware, adminController.updateCode);
router.delete('/codes/:id', authMiddleware, adminMiddleware, adminController.deleteCode);

// Relatórios
router.get('/reports/usage', authMiddleware, adminMiddleware, adminController.getUsageReport);
router.get('/export/codes', authMiddleware, adminMiddleware, adminController.exportCodes);

module.exports = router; 