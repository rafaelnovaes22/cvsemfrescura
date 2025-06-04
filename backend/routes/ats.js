const express = require('express');
const multer = require('multer');
const path = require('path');
const atsController = require('../controllers/atsController');
const authMiddleware = require('../utils/authMiddleware');

const router = express.Router();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve(__dirname, '../uploads/'));
    },
    filename: function (req, file, cb) {
        // Extrai a extensão do arquivo original
        const ext = path.extname(file.originalname);
        // Usa nome único + extensão original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + ext);
    }
});
const upload = multer({ storage });

router.post('/analyze', authMiddleware, upload.single('resume'), atsController.analyze);

// Novas rotas para histórico de análises
router.get('/history', authMiddleware, atsController.getAnalysisHistory);
router.get('/analysis/:id', authMiddleware, atsController.getAnalysisById);

module.exports = router;
