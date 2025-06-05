// 🛡️ Logger Seguro - Frontend
// Remove automaticamente logs em produção

const isProduction = window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    !window.location.hostname.includes('local');

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
 * Mascara dados sensíveis para logs
 * @param {string} text - Texto a ser mascarado
 * @returns {string} - Texto mascarado
 */
function maskSensitiveData(text) {
    if (!text || typeof text !== 'string') return text;

    if (containsSensitiveData(text)) {
        return '[DADOS_SENSÍVEIS_REMOVIDOS]';
    }

    return text;
}

/**
 * Sanitiza argumentos para log
 * @param {Array} args - Argumentos do console.log
 * @returns {Array} - Argumentos sanitizados
 */
function sanitizeArgs(args) {
    return args.map(arg => {
        if (typeof arg === 'string') {
            return maskSensitiveData(arg);
        } else if (typeof arg === 'object' && arg !== null) {
            try {
                const sanitized = {};
                for (const [key, value] of Object.entries(arg)) {
                    const keyLower = key.toLowerCase();

                    if (keyLower.includes('key') ||
                        keyLower.includes('secret') ||
                        keyLower.includes('token') ||
                        keyLower.includes('password') ||
                        keyLower.includes('auth')) {
                        sanitized[key] = '[DADOS_SENSÍVEIS]';
                    } else if (typeof value === 'string') {
                        sanitized[key] = maskSensitiveData(value);
                    } else {
                        sanitized[key] = value;
                    }
                }
                return sanitized;
            } catch (e) {
                return '[OBJETO_COMPLEXO]';
            }
        }
        return arg;
    });
}

// Logger seguro
const secureLogger = {
    log: function (...args) {
        if (!isProduction) {
            const sanitizedArgs = sanitizeArgs(args);
            console.log(...sanitizedArgs);
        }
    },

    info: function (...args) {
        if (!isProduction) {
            const sanitizedArgs = sanitizeArgs(args);
            console.info(...sanitizedArgs);
        }
    },

    warn: function (...args) {
        if (!isProduction) {
            const sanitizedArgs = sanitizeArgs(args);
            console.warn(...sanitizedArgs);
        }
    },

    error: function (...args) {
        // Erros são importantes mesmo em produção, mas sanitizados
        const sanitizedArgs = sanitizeArgs(args);
        console.error(...sanitizedArgs);
    },

    debug: function (...args) {
        if (!isProduction) {
            const sanitizedArgs = sanitizeArgs(args);
            console.debug(...sanitizedArgs);
        }
    }
};

// Substitui console em produção
if (isProduction) {
    window.console.log = secureLogger.log;
    window.console.info = secureLogger.info;
    window.console.warn = secureLogger.warn;
    window.console.debug = secureLogger.debug;
    // Mantém console.error mas sanitizado
    const originalError = window.console.error;
    window.console.error = function (...args) {
        const sanitizedArgs = sanitizeArgs(args);
        originalError.apply(console, sanitizedArgs);
    };
}

// Exporta o logger para uso explícito
window.secureLogger = secureLogger; 