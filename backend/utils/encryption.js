const crypto = require('crypto');

// Configuração de criptografia
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey() {
    const envKey = process.env.ENCRYPTION_KEY;

    if (!envKey) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('ERRO CRÍTICO: ENCRYPTION_KEY não configurada em produção!');
        }
        // Em desenvolvimento, avisa mas permite continuar
        console.warn('⚠️ ENCRYPTION_KEY não configurada. Usando chave temporária para desenvolvimento.');
        // Gera chave temporária APENAS para desenvolvimento
        return crypto.createHash('sha256')
            .update('dev_temp_key_' + Date.now())
            .digest();
    }

    // Validar formato da chave
    if (typeof envKey === 'string' && envKey.length === 64) {
        return Buffer.from(envKey, 'hex');
    } else {
        throw new Error('ENCRYPTION_KEY deve ter 64 caracteres hexadecimais');
    }
}

const ENCRYPTION_KEY = getEncryptionKey();

/**
 * Criptografa uma string sensível usando AES-256-GCM
 * @param {string} text - Texto a ser criptografado
 * @returns {string} - Texto criptografado em formato base64 com IV e tag
 */
function encrypt(text) {
    if (!text) return null;

    try {
        // Gerar IV aleatório
        const iv = crypto.randomBytes(IV_LENGTH);

        // Criar cipher com GCM
        const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

        // Criptografar dados
        const encrypted = Buffer.concat([
            cipher.update(text, 'utf8'),
            cipher.final()
        ]);

        // Obter tag de autenticação (IMPORTANTE para GCM)
        const tag = cipher.getAuthTag();

        // Combinar IV + tag + encrypted em base64
        const combined = Buffer.concat([iv, tag, encrypted]);

        return combined.toString('base64');
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Erro ao criptografar:', error.message);
        }
        return null;
    }
}

/**
 * Descriptografa uma string criptografada com verificação de autenticidade
 * @param {string} encryptedData - Dados criptografados em base64
 * @returns {string} - Texto original ou null se falhar
 */
function decrypt(encryptedData) {
    if (!encryptedData) return null;

    try {
        // Decodificar de base64
        const combined = Buffer.from(encryptedData, 'base64');

        // Verificar tamanho mínimo (IV + TAG)
        if (combined.length < IV_LENGTH + TAG_LENGTH) {
            // Pode ser dado antigo em CBC, tentar fallback
            return decryptLegacy(encryptedData);
        }

        // Extrair componentes
        const iv = combined.slice(0, IV_LENGTH);
        const tag = combined.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
        const encrypted = combined.slice(IV_LENGTH + TAG_LENGTH);

        // Criar decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        decipher.setAuthTag(tag);

        // Descriptografar e verificar autenticidade
        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);

        return decrypted.toString('utf8');
    } catch (error) {
        // Tentar descriptografar com método antigo (fallback)
        try {
            return decryptLegacy(encryptedData);
        } catch (legacyError) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('Erro ao descriptografar:', error.message);
            }
            return null;
        }
    }
}

/**
 * Descriptografa dados usando o método antigo (CBC) - apenas para compatibilidade
 * @param {string} encryptedData - Dados criptografados em base64
 * @returns {string} - Texto original
 */
function decryptLegacy(encryptedData) {
    try {
        const combined = Buffer.from(encryptedData, 'base64');
        const iv = combined.slice(0, 16);
        const encrypted = combined.slice(16);

        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encrypted, null, 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        throw error;
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

    // Em produção, mostrar menos caracteres
    const visibleChars = process.env.NODE_ENV === 'production' ? 3 : 4;
    const start = key.substring(0, visibleChars);
    const end = key.substring(key.length - visibleChars);
    const middle = '*'.repeat(Math.max(0, key.length - (visibleChars * 2)));

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
 * @param {Set} seen - Set para rastrear objetos já visitados (evitar ciclos)
 * @returns {any} - Dados sanitizados
 */
function sanitizeForLog(data, seen = new Set()) {
    if (!data) return data;

    if (typeof data === 'string') {
        if (containsSensitiveData(data)) {
            return '[DADOS_SENSÍVEIS_REMOVIDOS]';
        }
        return data;
    }

    if (typeof data === 'object') {
        // Verifica se já processamos este objeto (evita ciclos)
        if (seen.has(data)) {
            return '[REFERÊNCIA_CIRCULAR]';
        }
        seen.add(data);

        const sanitized = Array.isArray(data) ? [] : {};

        try {
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
                    sanitized[key] = sanitizeForLog(value, seen);
                }
            }
        } catch (e) {
            return '[ERRO_AO_SANITIZAR]';
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