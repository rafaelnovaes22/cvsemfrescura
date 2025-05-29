// Módulo de criptografia para frontend
// Usa Web Crypto API para criptografia segura no navegador

console.log('🔐 Carregando módulo de criptografia...');

class FrontendEncryption {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
        this.ivLength = 12; // 96 bits recomendado para GCM
        this.encryptionKey = null;
    }

    // Gerar chave de criptografia baseada em string
    async generateKey(password) {
        try {
            // Usar PBKDF2 para derivar chave criptográfica
            const encoder = new TextEncoder();
            const passwordBuffer = encoder.encode(password);

            // Salt fixo baseado no domínio (em produção, usar salt do servidor)
            const saltString = window.location.hostname + '_cv_sem_frescura_salt';
            const salt = encoder.encode(saltString);

            // Importar senha como material de chave
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                passwordBuffer,
                'PBKDF2',
                false,
                ['deriveKey']
            );

            // Derivar chave AES
            const key = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                {
                    name: 'AES-GCM',
                    length: this.keyLength
                },
                false,
                ['encrypt', 'decrypt']
            );

            this.encryptionKey = key;
            return key;
        } catch (error) {
            console.error('❌ [CRYPTO] Erro ao gerar chave:', error);
            return null;
        }
    }

    // Obter chave de criptografia (gera se não existir)
    async getEncryptionKey() {
        if (this.encryptionKey) {
            return this.encryptionKey;
        }

        // Usar timestamp + user agent como base para chave
        // Em produção, obter do servidor de forma segura
        const keyBase = `${Date.now()}_${navigator.userAgent.substring(0, 50)}`;
        return await this.generateKey(keyBase);
    }

    // Criptografar dados
    async encrypt(data) {
        try {
            if (!data) return null;

            const key = await this.getEncryptionKey();
            if (!key) {
                console.warn('⚠️ [CRYPTO] Chave não disponível, retornando dados originais');
                return data;
            }

            // Converter dados para string se necessário
            const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(dataString);

            // Gerar IV aleatório
            const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));

            // Criptografar
            const encrypted = await crypto.subtle.encrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                key,
                dataBuffer
            );

            // Combinar IV + dados criptografados
            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(encrypted), iv.length);

            // Converter para base64 para transmissão
            return this.arrayBufferToBase64(combined.buffer);
        } catch (error) {
            console.error('❌ [CRYPTO] Erro ao criptografar:', error);
            return data; // Retorna dados originais em caso de erro
        }
    }

    // Descriptografar dados
    async decrypt(encryptedData) {
        try {
            if (!encryptedData) return null;

            const key = await this.getEncryptionKey();
            if (!key) {
                console.warn('⚠️ [CRYPTO] Chave não disponível para descriptografia');
                return encryptedData;
            }

            // Converter de base64
            const combined = this.base64ToArrayBuffer(encryptedData);

            // Separar IV e dados criptografados
            const iv = combined.slice(0, this.ivLength);
            const encrypted = combined.slice(this.ivLength);

            // Descriptografar
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                key,
                encrypted
            );

            // Converter resultado para string
            const decoder = new TextDecoder();
            const decryptedString = decoder.decode(decrypted);

            // Tentar fazer parse como JSON
            try {
                return JSON.parse(decryptedString);
            } catch {
                return decryptedString;
            }
        } catch (error) {
            console.error('❌ [CRYPTO] Erro ao descriptografar:', error);
            return encryptedData; // Retorna dados originais em caso de erro
        }
    }

    // Ofuscar dados sensíveis para logs
    obfuscateForLogs(data) {
        if (!data) return data;

        const sensitive = ['password', 'token', 'key', 'secret', 'card', 'cvv', 'cvc', 'number'];
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
    }

    // Utilitários para conversão
    arrayBufferToBase64(buffer) {
        const binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
        return btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    // Gerar hash simples para verificação de integridade
    async simpleHash(data) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
            return this.arrayBufferToBase64(hashBuffer);
        } catch (error) {
            console.error('❌ [CRYPTO] Erro ao gerar hash:', error);
            return null;
        }
    }

    // Verificar se Web Crypto API está disponível
    isSupported() {
        return typeof crypto !== 'undefined' &&
            typeof crypto.subtle !== 'undefined' &&
            typeof crypto.getRandomValues !== 'undefined';
    }
}

// Instância global
const frontendCrypto = new FrontendEncryption();

// Verificar suporte
if (!frontendCrypto.isSupported()) {
    console.warn('⚠️ [CRYPTO] Web Crypto API não suportada neste navegador');
    console.warn('⚠️ [CRYPTO] Dados serão transmitidos sem criptografia adicional');
}

// Exportar para uso global
window.frontendCrypto = frontendCrypto;

console.log('✅ [CRYPTO] Módulo de criptografia carregado com sucesso');

// Função auxiliar para criptografar dados de pagamento
window.encryptPaymentData = async (paymentData) => {
    try {
        console.log('🔐 [CRYPTO] Criptografando dados de pagamento...');

        if (!frontendCrypto.isSupported()) {
            console.warn('⚠️ [CRYPTO] Criptografia não suportada, enviando dados normalmente');
            return { encrypted: false, data: paymentData };
        }

        const encrypted = await frontendCrypto.encrypt(paymentData);
        console.log('✅ [CRYPTO] Dados criptografados com sucesso');

        return {
            encrypted: true,
            data: encrypted,
            timestamp: Date.now(),
            checksum: await frontendCrypto.simpleHash(paymentData)
        };
    } catch (error) {
        console.error('❌ [CRYPTO] Erro na criptografia de pagamento:', error);
        return { encrypted: false, data: paymentData };
    }
};

// Função para descriptografar resposta do servidor
window.decryptServerResponse = async (encryptedResponse) => {
    try {
        if (!encryptedResponse.encrypted) {
            return encryptedResponse.data;
        }

        console.log('🔓 [CRYPTO] Descriptografando resposta do servidor...');
        const decrypted = await frontendCrypto.decrypt(encryptedResponse.data);
        console.log('✅ [CRYPTO] Resposta descriptografada com sucesso');

        return decrypted;
    } catch (error) {
        console.error('❌ [CRYPTO] Erro na descriptografia:', error);
        return encryptedResponse.data;
    }
}; 