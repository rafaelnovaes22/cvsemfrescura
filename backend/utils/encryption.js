const crypto = require('crypto');

// Configuração de criptografia
const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || generateDefaultKey();

function generateDefaultKey() {
    // Gera uma chave baseada no NODE_ENV e uma string fixa
    const seed = process.env.NODE_ENV + '_cv_sem_frescura_encryption_2024';
    return crypto.createHash('sha256').update(seed).digest();
}

/**
 * Criptografa uma string sensível
 * @param {string} text - Texto a ser criptografado
 * @returns {string} - Texto criptografado em formato base64
 */
function encrypt(text) {
    if (!text) return null;

    try {
        const iv = crypto.randomBytes(16); // IV para AES-256-CBC
        const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Combina IV + encrypted em base64
        const combined = Buffer.concat([iv, Buffer.from(encrypted, 'hex')]);
        return combined.toString('base64');
    } catch (error) {
        console.error('Erro ao criptografar:', error.message);
        return null;
    }
}

/**
 * Descriptografa uma string criptografada
 * @param {string} encryptedData - Dados criptografados em base64
 * @returns {string} - Texto original
 */
function decrypt(encryptedData) {
    if (!encryptedData) return null;

    try {
        const combined = Buffer.from(encryptedData, 'base64');

        const iv = combined.slice(0, 16);
        const encrypted = combined.slice(16);

        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

        let decrypted = decipher.update(encrypted, null, 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Erro ao descriptografar:', error.message);
        return null;
    }
}

/**
 * Mascara uma chave para logs seguros
 * @param {string} key - Chave a ser mascarada
 * @returns {string} - Chave mascarada
 */
function maskKey(key) {
    if (!key || typeof key !== 'string') return '[CHAVE_INVÁLIDA]';

    if (key.length <= 8) {
        return '*'.repeat(key.length);
    }

    const start = key.substring(0, 4);
    const end = key.substring(key.length - 4);
    const middle = '*'.repeat(Math.max(0, key.length - 8));

    return `${start}${middle}${end}`;
}

/**
 * Verifica se uma string contém dados sensíveis
 * @param {string} text - Texto a ser verificado
 * @returns {boolean} - True se contém dados sensíveis
 */
function containsSensitiveData(text) {
    if (!text || typeof text !== 'string') return false;

    const sensitivePatterns = [
        /sk_[a-zA-Z0-9_]{20,}/,     // Stripe secret keys
        /pk_[a-zA-Z0-9_]{20,}/,     // Stripe publishable keys
        /whsec_[a-zA-Z0-9_]{20,}/,  // Stripe webhook secrets
        /rk_[a-zA-Z0-9_]{20,}/,     // Stripe restricted keys
        /sk-[a-zA-Z0-9]{48,}/,      // OpenAI API keys
        /Bearer\s+[a-zA-Z0-9._-]+/, // Bearer tokens
        /password/i,                // Passwords
        /token/i,                   // Tokens
        /secret/i,                  // Secrets
        /key/i,                     // Keys
        /auth/i                     // Auth tokens
    ];

    return sensitivePatterns.some(pattern => pattern.test(text));
}

/**
 * Sanitiza logs removendo dados sensíveis
 * @param {any} data - Dados a serem sanitizados
 * @returns {any} - Dados sanitizados
 */
function sanitizeForLog(data) {
    if (!data) return data;

    if (typeof data === 'string') {
        if (containsSensitiveData(data)) {
            return '[DADOS_SENSÍVEIS_REMOVIDOS]';
        }
        return data;
    }

    if (typeof data === 'object') {
        const sanitized = Array.isArray(data) ? [] : {};

        for (const [key, value] of Object.entries(data)) {
            const keyLower = key.toLowerCase();

            // Chaves que devem ser sempre mascaradas
            if (keyLower.includes('key') ||
                keyLower.includes('secret') ||
                keyLower.includes('token') ||
                keyLower.includes('password') ||
                keyLower.includes('auth')) {

                if (typeof value === 'string') {
                    sanitized[key] = maskKey(value);
                } else {
                    sanitized[key] = '[DADOS_SENSÍVEIS]';
                }
            } else {
                sanitized[key] = sanitizeForLog(value);
            }
        }

        return sanitized;
    }

    return data;
}

module.exports = {
    encrypt,
    decrypt,
    maskKey,
    containsSensitiveData,
    sanitizeForLog
}; 