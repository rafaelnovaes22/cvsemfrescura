// 🌍 Configuração Automática de Ambiente - CV Sem Frescura
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const isRailway = !!process.env.RAILWAY_ENVIRONMENT;
const isLocal = !isProduction && !isRailway;

console.log('🌍 Detectando ambiente...');
console.log('📊 NODE_ENV:', process.env.NODE_ENV);
console.log('🚂 RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('🏠 Local:', isLocal);
console.log('🚀 Produção:', isProduction);

// 🔑 Configuração de Chaves Stripe baseada no ambiente
const getStripeConfig = () => {
    // Sempre usar variáveis de ambiente - NUNCA hardcode!
    let secretKey = process.env.STRIPE_SECRET_KEY;
    let publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // 🧹 LIMPEZA FORÇADA DAS VARIÁVEIS (correção para problemas de encoding)
    if (secretKey) {
        console.log('🔍 [DEBUG] Raw secretKey length:', secretKey.length);
        console.log('🔍 [DEBUG] Raw secretKey first 10 chars:', JSON.stringify(secretKey.substring(0, 10)));

        // Limpar espaços, quebras de linha e caracteres especiais
        secretKey = secretKey.trim().replace(/[\r\n\t]/g, '');

        console.log('🔍 [DEBUG] Cleaned secretKey length:', secretKey.length);
        console.log('🔍 [DEBUG] Cleaned secretKey first 10 chars:', JSON.stringify(secretKey.substring(0, 10)));
        console.log('🔍 [DEBUG] Starts with sk_:', secretKey.startsWith('sk_'));
        console.log('🔍 [DEBUG] Starts with rk_:', secretKey.startsWith('rk_'));
        console.log('🔍 [DEBUG] Valid Stripe key:', secretKey.startsWith('sk_') || secretKey.startsWith('rk_'));
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
            console.log('✅ [PRODUÇÃO] Chaves encontradas e limpas');
            console.log('🔑 [PRODUÇÃO] SecretKey válida:', secretKey.startsWith('sk_') || secretKey.startsWith('rk_'));
            console.log('🔑 [PRODUÇÃO] Tipo da chave:', secretKey.startsWith('sk_') ? 'Completa (sk_)' : 'Restrita (rk_) - Mais Segura');
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
    return {
        port: process.env.PORT || 3000,
        nodeEnv: process.env.NODE_ENV || 'development',
        jwtSecret: process.env.JWT_SECRET || 'cv_sem_frescura_jwt_local_development_CHANGE_IN_PRODUCTION',
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
console.log('🌐 CORS origins:', config.cors.origin);

// Validações de segurança
if (isProduction && (!config.stripe.secretKey || !config.stripe.publishableKey)) {
    console.error('🚨 ERRO CRÍTICO: Chaves do Stripe não configuradas em produção!');
}

if (isLocal && (!config.stripe.secretKey || !config.stripe.publishableKey)) {
    console.warn('⚠️ ATENÇÃO: Configure as chaves do Stripe no arquivo .env para desenvolvimento');
}

module.exports = config; 