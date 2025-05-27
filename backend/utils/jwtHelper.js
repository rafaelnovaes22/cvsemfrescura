const jwt = require('jsonwebtoken');

// Configurações JWT
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_ISSUER = process.env.JWT_ISSUER || 'cv-sem-frescura';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'api-users';

/**
 * Gerar token JWT com configurações seguras
 * @param {Object} payload - Dados do usuário (userId, email, etc.)
 * @param {String} expiresIn - Tempo de expiração (opcional)
 * @returns {String} Token JWT
 */
const generateToken = (payload, expiresIn = JWT_EXPIRES_IN) => {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET não configurado');
    }

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        algorithm: 'HS256'
    });
};

/**
 * Verificar token JWT
 * @param {String} token - Token para verificar
 * @returns {Object|null} Payload decodificado ou null se inválido
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE
        });
    } catch (error) {
        return null;
    }
};

/**
 * Decodificar token sem verificar (para debug)
 * @param {String} token - Token para decodificar
 * @returns {Object|null} Payload decodificado
 */
const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        return null;
    }
};

/**
 * Gerar secret seguro para desenvolvimento
 * @returns {String} Secret aleatório
 */
const generateSecureSecret = () => {
    const crypto = require('crypto');
    return crypto.randomBytes(64).toString('hex');
};

module.exports = {
    generateToken,
    verifyToken,
    decodeToken,
    generateSecureSecret
}; 