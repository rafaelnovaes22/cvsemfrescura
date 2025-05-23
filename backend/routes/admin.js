const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../utils/authMiddleware');

// Middleware para verificar se é admin (você pode implementar conforme sua lógica)
const adminMiddleware = (req, res, next) => {
    // Por enquanto, qualquer usuário autenticado pode acessar
    // Você pode implementar uma verificação de role/permission aqui
    if (!req.user) {
        return res.status(401).json({ error: 'Acesso negado.' });
    }

    // TODO: Implementar verificação de admin
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ error: 'Apenas administradores podem acessar.' });
    // }

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