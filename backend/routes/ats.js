const express = require('express');
const multer = require('multer');
const path = require('path');
const atsController = require('../controllers/atsController');
const authMiddleware = require('../utils/authMiddleware');

const router = express.Router();

// Log de debug
console.log('🔧 [DEBUG] Registrando rotas ATS...');

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

// Rota de teste para debug
router.get('/test', (req, res) => {
    console.log('🔧 [DEBUG] Rota de teste ATS chamada');
    res.json({ message: 'ATS routes funcionando!', timestamp: new Date().toISOString() });
});

router.post('/analyze', authMiddleware, upload.single('resume'), atsController.analyze);

console.log('✅ [DEBUG] Rotas ATS registradas com sucesso');

module.exports = router;
