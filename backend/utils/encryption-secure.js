const crypto = require('crypto');

// 🔐 Versão Segura do Módulo de Criptografia
// Corrige vulnerabilidades identificadas na avaliação

// Configuração de criptografia - AES-256-GCM com autenticação
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Obtém a chave de criptografia do ambiente
 * Sem fallback inseguro!
 */
function getEncryptionKey() {
    const envKey = process.env.ENCRYPTION_KEY;

    if (!envKey) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('ERRO CRÍTICO: ENCRYPTION_KEY não configurada em produção!');
        }
        // Apenas em desenvolvimento, avisa mas não falha
        console.warn('⚠️ ENCRYPTION_KEY não configurada. Criptografia desabilitada em desenvolvimento.');
        return null;
    }

    // Validar formato da chave
    if (typeof envKey !== 'string' || envKey.length !== 64) {
        throw new Error('ENCRYPTION_KEY deve ter exatamente 64 caracteres hexadecimais');
    }

    // Validar se é hexadecimal válido
    if (!/^[0-9a-fA-F]{64}$/.test(envKey)) {
        throw new Error('ENCRYPTION_KEY deve conter apenas caracteres hexadecimais');
    }

    return Buffer.from(envKey, 'hex');
}

// Carrega a chave uma vez na inicialização
let ENCRYPTION_KEY;
try {
    ENCRYPTION_KEY = getEncryptionKey();
} catch (error) {
    console.error('❌ Erro ao carregar ENCRYPTION_KEY:', error.message);
    if (process.env.NODE_ENV === 'production') {
        process.exit(1); // Falha fatal em produção
    }
}

/**
 * Criptografa uma string sensível usando AES-256-GCM
 * @param {string} text - Texto a ser criptografado
 * @returns {string|null} - Texto criptografado em formato base64 com IV e tag
 */
function encrypt(text) {
    if (!text) return null;

    if (!ENCRYPTION_KEY) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Tentativa de criptografar sem ENCRYPTION_KEY em produção');
        }
        return null; // Em desenvolvimento, retorna null
    }

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

        // Obter tag de autenticação
        const tag = cipher.getAuthTag();

        // Combinar IV + tag + encrypted
        const combined = Buffer.concat([iv, tag, encrypted]);

        // Retornar em base64
        return combined.toString('base64');
    } catch (error) {
        console.error('Erro ao criptografar:', error.message);
        return null;
    }
}

/**
 * Descriptografa uma string criptografada com verificação de autenticidade
 * @param {string} encryptedData - Dados criptografados em base64
 * @returns {string|null} - Texto original ou null se falhar
 */
function decrypt(encryptedData) {
    if (!encryptedData) return null;

    if (!ENCRYPTION_KEY) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Tentativa de descriptografar sem ENCRYPTION_KEY em produção');
        }
        return null;
    }

    try {
        // Decodificar de base64
        const combined = Buffer.from(encryptedData, 'base64');

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
        // Em produção, log sem detalhes sensíveis
        if (process.env.NODE_ENV === 'production') {
            console.error('Falha na descriptografia');
        } else {
            console.error('Erro ao descriptografar:', error.message);
        }
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

    const visibleChars = process.env.NODE_ENV === 'production' ? 4 : 6;
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
        /password[:=]/i,            // Passwords com delimitadores
        /api[_-]?key[:=]/i,         // API keys
        /secret[:=]/i,              // Secrets
        /token[:=]/i,               // Tokens
        /[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}/, // Credit cards
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

            // Lista expandida de chaves sensíveis
            const sensitiveKeys = [
                'key', 'secret', 'token', 'password', 'auth',
                'credential', 'private', 'api', 'access', 'refresh',
                'bearer', 'session', 'cookie', 'jwt', 'oauth'
            ];

            const isSensitiveKey = sensitiveKeys.some(sensitive =>
                keyLower.includes(sensitive)
            );

            if (isSensitiveKey) {
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

/**
 * Cria hash seguro de uma string (para comparações)
 * @param {string} text - Texto para hash
 * @returns {string} - Hash SHA-256 em hex
 */
function secureHash(text) {
    if (!text) return null;
    return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Verifica se o módulo está configurado corretamente
 * @returns {boolean} - True se configurado
 */
function isConfigured() {
    return !!ENCRYPTION_KEY;
}

module.exports = {
    encrypt,
    decrypt,
    maskKey,
    containsSensitiveData,
    sanitizeForLog,
    secureHash,
    isConfigured
}; 