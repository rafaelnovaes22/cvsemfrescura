// Middleware para descriptografar dados criptografados vindos do frontend
const { decrypt, obfuscateForLogs } = require('../utils/encryption');

const decryptPayload = (req, res, next) => {
    console.log('🔓 [DECRYPT] Verificando se payload está criptografado...');

    try {
        const body = req.body;

        // Verificar se os dados estão marcados como criptografados
        if (body && body.encrypted === true && body.data) {
            console.log('🔓 [DECRYPT] Dados criptografados detectados, descriptografando...');

            const decryptedData = decrypt(body.data);

            if (decryptedData) {
                // Substituir body pelos dados descriptografados
                req.body = decryptedData;

                // Adicionar metadados da criptografia ao request
                req.encryptionMeta = {
                    wasEncrypted: true,
                    timestamp: body.timestamp,
                    checksum: body.checksum,
                    decryptedAt: new Date().toISOString()
                };

                console.log('✅ [DECRYPT] Dados descriptografados com sucesso');
                console.log('🔍 [DECRYPT] Campos descriptografados:', Object.keys(req.body));

                // Log ofuscado para auditoria
                const obfuscated = obfuscateForLogs(req.body);
                console.log('📋 [DECRYPT] Dados ofuscados:', obfuscated);

            } else {
                console.error('❌ [DECRYPT] Falha na descriptografia');
                return res.status(400).json({
                    error: 'Erro na descriptografia',
                    message: 'Não foi possível descriptografar os dados enviados',
                    code: 'DECRYPTION_FAILED'
                });
            }
        } else {
            console.log('📝 [DECRYPT] Dados não criptografados, prosseguindo normalmente');
            req.encryptionMeta = {
                wasEncrypted: false,
                receivedAt: new Date().toISOString()
            };
        }

        next();

    } catch (error) {
        console.error('❌ [DECRYPT] Erro no middleware de descriptografia:', error);

        // Em caso de erro, prosseguir sem descriptografar
        console.warn('⚠️ [DECRYPT] Prosseguindo sem descriptografia devido ao erro');
        req.encryptionMeta = {
            wasEncrypted: false,
            error: error.message,
            errorAt: new Date().toISOString()
        };

        next();
    }
};

// Middleware para criptografar resposta (opcional)
const encryptResponse = (req, res, next) => {
    // Só criptografar se o cliente enviou dados criptografados
    if (req.encryptionMeta && req.encryptionMeta.wasEncrypted) {
        console.log('🔐 [ENCRYPT] Cliente suporta criptografia, preparando resposta criptografada...');

        // Interceptar res.json para criptografar antes de enviar
        const originalJson = res.json;

        res.json = function (data) {
            try {
                const { encrypt } = require('../utils/encryption');
                const encryptedData = encrypt(data);

                if (encryptedData) {
                    console.log('✅ [ENCRYPT] Resposta criptografada com sucesso');
                    return originalJson.call(this, {
                        encrypted: true,
                        data: encryptedData,
                        timestamp: Date.now()
                    });
                } else {
                    console.warn('⚠️ [ENCRYPT] Falha na criptografia, enviando resposta normal');
                    return originalJson.call(this, data);
                }
            } catch (error) {
                console.error('❌ [ENCRYPT] Erro ao criptografar resposta:', error);
                return originalJson.call(this, data);
            }
        };
    }

    next();
};

// Middleware para validar integridade dos dados criptografados
const validateEncryptedData = (req, res, next) => {
    if (req.encryptionMeta && req.encryptionMeta.wasEncrypted) {
        console.log('🔍 [INTEGRITY] Validando integridade dos dados descriptografados...');

        try {
            // Verificar timestamp (não deve ser muito antigo)
            if (req.encryptionMeta.timestamp) {
                const now = Date.now();
                const maxAge = 5 * 60 * 1000; // 5 minutos
                const age = now - req.encryptionMeta.timestamp;

                if (age > maxAge) {
                    console.warn('⚠️ [INTEGRITY] Dados criptografados muito antigos:', age, 'ms');
                    return res.status(400).json({
                        error: 'Dados expirados',
                        message: 'Os dados criptografados são muito antigos',
                        code: 'ENCRYPTED_DATA_EXPIRED'
                    });
                }

                console.log('✅ [INTEGRITY] Timestamp válido:', age, 'ms de idade');
            }

            // Verificar se os dados fazem sentido
            if (req.body && typeof req.body === 'object') {
                const requiredFields = ['amount', 'planName', 'credits', 'paymentMethod'];
                const hasRequiredFields = requiredFields.some(field => req.body.hasOwnProperty(field));

                if (!hasRequiredFields && req.path.includes('payment')) {
                    console.warn('⚠️ [INTEGRITY] Dados descriptografados não contêm campos esperados');
                    console.warn('⚠️ [INTEGRITY] Campos recebidos:', Object.keys(req.body));
                } else {
                    console.log('✅ [INTEGRITY] Estrutura dos dados válida');
                }
            }

        } catch (error) {
            console.error('❌ [INTEGRITY] Erro na validação de integridade:', error);
            // Não bloquear, apenas logar
        }
    }

    next();
};

module.exports = {
    decryptPayload,
    encryptResponse,
    validateEncryptedData
}; 