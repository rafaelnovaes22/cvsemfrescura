// 🌍 Configuração Automática de Ambiente - CV Sem Frescura
require('dotenv').config();
const { maskKey, decrypt } = require('../utils/encryption');

const isProduction = process.env.NODE_ENV === 'production';
const isRailway = !!process.env.RAILWAY_ENVIRONMENT;
const isLocal = !isProduction && !isRailway;

console.log('🌍 Detectando ambiente...');
console.log('📊 NODE_ENV:', process.env.NODE_ENV);
console.log('🚂 RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('🏠 Local:', isLocal);
console.log('🚀 Produção:', isProduction);

// 🔐 Função para descriptografar chaves se necessário
const decryptIfNeeded = (value) => {
    if (!value) return value;

    // Logs de debug apenas em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 [DEBUG] Verificando chave para descriptografia...');
        console.log('🔍 [DEBUG] Tamanho da chave:', value.length);
        console.log('🔍 [DEBUG] Primeiros 10 chars:', value.substring(0, 10));
    }

    // 🚨 PRIMEIRA VERIFICAÇÃO: Se já é uma chave válida do Stripe, usar diretamente
    if (value.match(/^(sk_|pk_|whsec_|rk_)/)) {
        console.log('✅ Chave já está em texto plano e é válida');
        return value;
    }

    // 🔐 SEGUNDA VERIFICAÇÃO: Se parece estar criptografada (não começa com sk_, pk_, etc. e é longa)
    if (value.length > 50) {
        console.log('🔓 Tentando descriptografar chave...');

        try {
            const decrypted = decrypt(value);
            if (decrypted && decrypted.match(/^(sk_|pk_|whsec_|rk_)/)) {
                console.log('✅ Chave descriptografada com sucesso');
                if (process.env.NODE_ENV !== 'production') {
                    console.log('🔍 [DEBUG] Tamanho descriptografado:', decrypted.length);
                    console.log('🔍 [DEBUG] Primeiros 10 chars descriptografados:', decrypted.substring(0, 10));
                }
                return decrypted;
            } else {
                console.warn('⚠️ Descriptografia não resultou em chave válida, usando original');
                return value; // Retorna original se a descriptografia não resultar em chave válida
            }
        } catch (error) {
            console.error('❌ Erro na descriptografia:', error.message);
            console.warn('⚠️ Usando chave original devido ao erro de descriptografia');
            return value; // Retorna original se falhar
        }
    } else {
        console.warn('⚠️ Chave não parece ser válida nem criptografada');
    }

    return value; // Retorna original se não conseguir processar
};

// 🔑 Configuração de Chaves Stripe baseada no ambiente
const getStripeConfig = () => {
    // Sempre usar variáveis de ambiente - NUNCA hardcode!
    let secretKey = process.env.STRIPE_SECRET_KEY;
    let publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    let webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // 🔐 Descriptografar chaves se necessário (Railway ou produção)
    // Só tentar descriptografar se:
    // 1. Está em produção OU Railway
    // 2. Tem ENCRYPTION_KEY configurada
    // 3. NÃO tem DISABLE_ENCRYPTION=true
    const shouldDecrypt = (isProduction || isRailway) &&
        process.env.ENCRYPTION_KEY &&
        !process.env.DISABLE_ENCRYPTION &&
        process.env.DISABLE_ENCRYPTION !== 'true';

    if (shouldDecrypt) {
        console.log('🔐 Iniciando descriptografia das chaves...');
        console.log('🔐 isProduction:', isProduction);
        console.log('🔐 isRailway:', isRailway);
        console.log('🔐 ENCRYPTION_KEY presente:', !!process.env.ENCRYPTION_KEY);
        console.log('🔐 DISABLE_ENCRYPTION:', process.env.DISABLE_ENCRYPTION);

        secretKey = decryptIfNeeded(secretKey);
        publishableKey = decryptIfNeeded(publishableKey);
        webhookSecret = decryptIfNeeded(webhookSecret);
    } else {
        console.log('ℹ️ Descriptografia desabilitada ou não necessária');
        console.log('ℹ️ Usando chaves diretamente do ambiente');
    }

    // 🧹 LIMPEZA FORÇADA DAS VARIÁVEIS (correção para problemas de encoding)
    if (secretKey) {
        // Limpar espaços, quebras de linha e caracteres especiais
        secretKey = secretKey.trim().replace(/[\r\n\t]/g, '');

        if (!isProduction) {
            console.log('🔍 [DEBUG] SecretKey length:', secretKey.length);
            console.log('🔍 [DEBUG] SecretKey masked:', maskKey(secretKey));
            console.log('🔍 [DEBUG] Valid Stripe key:', secretKey.startsWith('sk_') || secretKey.startsWith('rk_'));
        }
    }

    if (publishableKey) {
        publishableKey = publishableKey.trim().replace(/[\r\n\t]/g, '');
    }

    if (isLocal) {
        console.log('🔧 [LOCAL] Configuração para desenvolvimento');

        // Verificar se as chaves de desenvolvimento estão configuradas
        if (!secretKey || !publishableKey) {
            console.warn('⚠️ [LOCAL] Chaves do Stripe não configuradas no .env');
            console.warn('💡 [LOCAL] Configure STRIPE_SECRET_KEY e STRIPE_PUBLISHABLE_KEY no arquivo .env');
            console.warn('🔗 [LOCAL] Use chaves de TESTE (sk_test_ e pk_test_)');
        }

        return {
            secretKey: secretKey,
            publishableKey: publishableKey,
            webhookSecret: webhookSecret || 'whsec_test_development_fallback',
            environment: publishableKey?.startsWith('pk_test_') ? 'test' : 'unknown'
        };
    } else {
        // 🚀 PRODUÇÃO (Railway) - Chaves do .env
        console.log('🚀 [PRODUÇÃO] Usando chaves do Railway (.env)');

        if (!secretKey || !publishableKey) {
            console.error('❌ [PRODUÇÃO] Chaves do Stripe não configuradas no Railway');
            console.error('💡 [PRODUÇÃO] Configure as variáveis no Railway Dashboard');
        } else {
            console.log('✅ [PRODUÇÃO] Chaves do Stripe configuradas');
            console.log('🔑 [PRODUÇÃO] SecretKey válida:', secretKey.startsWith('sk_') || secretKey.startsWith('rk_'));
            console.log('🔑 [PRODUÇÃO] PublishableKey válida:', publishableKey.startsWith('pk_'));
        }

        return {
            secretKey: secretKey,
            publishableKey: publishableKey,
            webhookSecret: webhookSecret,
            environment: publishableKey?.startsWith('pk_test_') ? 'test' : 'live'
        };
    }
};

// 📊 Configuração do Banco de Dados
const getDatabaseConfig = () => {
    if (isLocal) {
        return {
            url: process.env.DATABASE_URL || './database.sqlite',
            type: 'sqlite'
        };
    } else {
        return {
            url: process.env.DATABASE_URL,
            type: 'postgresql'
        };
    }
};

// 🌐 Configuração de CORS
const getCorsConfig = () => {
    if (isLocal) {
        return {
            origin: [
                'http://localhost:8080',
                'http://localhost:3000',
                'http://127.0.0.1:8080',
                process.env.FRONTEND_URL
            ].filter(Boolean), // Remove valores undefined/null
            credentials: true
        };
    } else {
        return {
            origin: [process.env.FRONTEND_URL, process.env.CORS_ORIGIN].filter(Boolean),
            credentials: true
        };
    }
};

// 📡 Configuração da API
const getApiConfig = () => {
    let jwtSecret = process.env.JWT_SECRET || 'cv_sem_frescura_jwt_local_development_CHANGE_IN_PRODUCTION';

    // 🔐 Descriptografar JWT_SECRET se necessário
    if ((isProduction || isRailway) && process.env.ENCRYPTION_KEY && !process.env.DISABLE_ENCRYPTION) {
        jwtSecret = decryptIfNeeded(jwtSecret);
    }

    return {
        port: process.env.PORT || 3000,
        nodeEnv: process.env.NODE_ENV || 'development',
        jwtSecret: jwtSecret,
        jwtExpiry: process.env.JWT_EXPIRY || '7d'
    };
};

const config = {
    environment: {
        isLocal,
        isProduction,
        isRailway,
        name: isLocal ? 'local' : (isProduction ? 'production' : 'development')
    },
    stripe: getStripeConfig(),
    database: getDatabaseConfig(),
    cors: getCorsConfig(),
    api: getApiConfig()
};

console.log('✅ Configuração carregada:');
console.log('🔑 Stripe environment:', config.stripe.environment);
console.log('🔑 Stripe keys configured:', !!config.stripe.secretKey && !!config.stripe.publishableKey);
console.log('🗄️ Database type:', config.database.type);
if (!isProduction) {
    console.log('🌐 CORS origins:', config.cors.origin);
}

// Validações de segurança
if (isProduction && (!config.stripe.secretKey || !config.stripe.publishableKey)) {
    console.error('🚨 ERRO CRÍTICO: Chaves do Stripe não configuradas em produção!');
}

if (isLocal && (!config.stripe.secretKey || !config.stripe.publishableKey)) {
    console.warn('⚠️ ATENÇÃO: Configure as chaves do Stripe no arquivo .env para desenvolvimento');
}

module.exports = config; 