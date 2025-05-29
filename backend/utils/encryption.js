const crypto = require('crypto');

// Configurações de criptografia
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // Para GCM, isto é sempre 16
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

// Gerar uma chave de criptografia baseada na senha e salt
const deriveKey = (password, salt) => {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
};

// Obter chave de criptografia do ambiente
const getEncryptionKey = () => {
    const key = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'default_key_insecure';
    if (key === 'default_key_insecure') {
        console.warn('⚠️ [ENCRYPTION] Usando chave padrão - configure ENCRYPTION_KEY no .env');
    }
    return key;
};

// Criptografar dados
const encrypt = (text) => {
    try {
        if (!text) return null;

        const textString = typeof text === 'object' ? JSON.stringify(text) : String(text);
        const password = getEncryptionKey();

        // Gerar salt e IV aleatórios
        const salt = crypto.randomBytes(SALT_LENGTH);
        const iv = crypto.randomBytes(IV_LENGTH);

        // Derivar chave
        const key = deriveKey(password, salt);

        // Criar cipher
        const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, key, iv);

        // Criptografar
        let encrypted = cipher.update(textString, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Obter authentication tag
        const authTag = cipher.getAuthTag();

        // Combinar salt + iv + authTag + dados criptografados
        const result = salt.toString('hex') + ':' + iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;

        return result;
    } catch (error) {
        console.error('❌ [ENCRYPTION] Erro ao criptografar:', error);
        return null;
    }
};

// Descriptografar dados
const decrypt = (encryptedData) => {
    try {
        if (!encryptedData) return null;

        const password = getEncryptionKey();

        // Separar componentes
        const parts = encryptedData.split(':');
        if (parts.length !== 4) {
            throw new Error('Formato de dados criptografados inválido');
        }

        const salt = Buffer.from(parts[0], 'hex');
        const iv = Buffer.from(parts[1], 'hex');
        const authTag = Buffer.from(parts[2], 'hex');
        const encrypted = parts[3];

        // Derivar chave
        const key = deriveKey(password, salt);

        // Criar decipher
        const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        // Descriptografar
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        // Tentar fazer parse como JSON, se falhar retornar como string
        try {
            return JSON.parse(decrypted);
        } catch {
            return decrypted;
        }
    } catch (error) {
        console.error('❌ [ENCRYPTION] Erro ao descriptografar:', error);
        return null;
    }
};

// Criptografia simples para dados menos sensíveis (usar com cuidado)
const simpleEncrypt = (text) => {
    try {
        const key = crypto.createHash('sha256').update(getEncryptionKey()).digest();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-cbc', key, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
        console.error('❌ [ENCRYPTION] Erro na criptografia simples:', error);
        return text; // Retorna original em caso de erro
    }
};

// Descriptografia simples
const simpleDecrypt = (encryptedData) => {
    try {
        const parts = encryptedData.split(':');
        if (parts.length !== 2) return encryptedData;

        const key = crypto.createHash('sha256').update(getEncryptionKey()).digest();
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];

        const decipher = crypto.createDecipher('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('❌ [ENCRYPTION] Erro na descriptografia simples:', error);
        return encryptedData; // Retorna original em caso de erro
    }
};

// Função para ofuscar dados sensíveis nos logs
const obfuscateForLogs = (data) => {
    if (!data) return data;

    const sensitive = ['password', 'token', 'key', 'secret', 'card', 'cvv', 'cvc'];
    const obfuscated = JSON.parse(JSON.stringify(data));

    const obfuscateObject = (obj) => {
        Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                obfuscateObject(obj[key]);
            } else if (typeof obj[key] === 'string') {
                const keyLower = key.toLowerCase();
                if (sensitive.some(pattern => keyLower.includes(pattern))) {
                    const value = obj[key];
                    if (value.length > 4) {
                        obj[key] = value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
                    } else {
                        obj[key] = '*'.repeat(value.length);
                    }
                }
            }
        });
    };

    if (typeof obfuscated === 'object') {
        obfuscateObject(obfuscated);
    }

    return obfuscated;
};

// Hash seguro para senhas
const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return { salt, hash };
};

// Verificar senha
const verifyPassword = (password, salt, hash) => {
    const hashToVerify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return hash === hashToVerify;
};

module.exports = {
    encrypt,
    decrypt,
    simpleEncrypt,
    simpleDecrypt,
    obfuscateForLogs,
    hashPassword,
    verifyPassword
}; 