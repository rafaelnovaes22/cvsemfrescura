const express = require('express');
const router = express.Router();
const { sendContact } = require('../controllers/contactController');

// POST /api/contact - Enviar mensagem de contato
router.post('/', sendContact);

module.exports = router; 