// models/LoginAttempt.js
const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        lowercase: true
    },
    ip: {
        type: String,
        required: [true, 'IP é obrigatório']
    },
    userAgent: {
        type: String
    },
    successful: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '1h' // Automaticamente exclui registros após 1 hora
    }
});

// Índice para consultas rápidas
loginAttemptSchema.index({ email: 1, ip: 1, createdAt: -1 });

const LoginAttempt = mongoose.model('LoginAttempt', loginAttemptSchema);

module.exports = LoginAttempt;