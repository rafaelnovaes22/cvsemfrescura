// Middleware de validação de segurança
// Impede que chaves secretas ou tokens sensíveis sejam enviados nos payloads

const validatePayloadSecurity = (req, res, next) => {
    console.log('🔒 [SECURITY] Validando payload para chaves sensíveis...');

    try {
        // Converter body para string para facilitar a busca
        const bodyString = JSON.stringify(req.body).toLowerCase();

        // Lista de patterns perigosos que não devem estar no payload
        const dangerousPatterns = [
            'sk_test_',           // Stripe secret key (test)
            'sk_live_',           // Stripe secret key (live)
            'stripe_secret',      // Variações do nome
            'secret_key',         // Chaves secretas genéricas
            'api_secret',         // Segredos de API
            'private_key',        // Chaves privadas
            'access_token',       // Tokens de acesso (exceto Authorization header)
            'refresh_token',      // Tokens de refresh
            process.env.JWT_SECRET?.toLowerCase() || 'jwt_secret_not_set', // JWT secret
        ];

        // Verificar se algum pattern perigoso está presente
        const foundDangerousPattern = dangerousPatterns.find(pattern =>
            bodyString.includes(pattern)
        );

        if (foundDangerousPattern) {
            console.error('🚨 [SECURITY BREACH] Chave secreta detectada no payload!');
            console.error('🚨 [SECURITY] Pattern encontrado:', foundDangerousPattern);
            console.error('🚨 [SECURITY] IP:', req.ip || req.connection.remoteAddress);
            console.error('🚨 [SECURITY] User-Agent:', req.get('User-Agent'));
            console.error('🚨 [SECURITY] Endpoint:', req.path);

            // Log completo para auditoria (censurado)
            const censoredBody = JSON.stringify(req.body).replace(
                /sk_[a-zA-Z0-9_]+/g,
                '[CHAVE_SECRETA_CENSURADA]'
            );
            console.error('🚨 [SECURITY] Body censurado:', censoredBody);

            return res.status(400).json({
                error: 'Violação de segurança detectada',
                message: 'Chaves secretas não devem ser enviadas no payload da requisição',
                details: 'Entre em contato com o suporte se isso foi um engano',
                code: 'SECURITY_VIOLATION_SECRET_IN_PAYLOAD'
            });
        }

        // Verificar se há patterns suspeitos que podem indicar tentativa de exposição
        const suspiciousPatterns = [
            'password',
            'token',
            'key',
            'secret',
            'credential'
        ];

        const suspiciousFields = [];
        if (req.body && typeof req.body === 'object') {
            Object.keys(req.body).forEach(key => {
                if (suspiciousPatterns.some(pattern => key.toLowerCase().includes(pattern))) {
                    // Não bloquear, mas logar para monitoramento
                    suspiciousFields.push(key);
                }
            });
        }

        if (suspiciousFields.length > 0) {
            console.warn('⚠️ [SECURITY] Campos suspeitos detectados:', suspiciousFields);
            console.warn('⚠️ [SECURITY] Monitorar para possíveis tentativas de exposição');
        }

        console.log('✅ [SECURITY] Payload validado - sem chaves secretas detectadas');
        next();

    } catch (error) {
        console.error('❌ [SECURITY] Erro na validação de segurança:', error);
        // Em caso de erro, prosseguir mas logar o problema
        console.warn('⚠️ [SECURITY] Prosseguindo devido ao erro na validação');
        next();
    }
};

// Middleware específico para validação de pagamentos
const validatePaymentSecurity = (req, res, next) => {
    console.log('💳 [PAYMENT-SECURITY] Validando dados de pagamento...');

    try {
        const body = req.body;

        // Verificações específicas para pagamentos
        const paymentSecurityChecks = [
            {
                name: 'Chave secreta do Stripe',
                check: () => {
                    const bodyStr = JSON.stringify(body).toLowerCase();
                    return !bodyStr.includes('sk_test_') && !bodyStr.includes('sk_live_');
                },
                message: 'Chave secreta do Stripe detectada no payload'
            },
            {
                name: 'Dados de cartão completos',
                check: () => {
                    // Verificar se não estão sendo enviados dados de cartão raw
                    return !(body.cardNumber || body.card_number || body.cvv || body.cvc);
                },
                message: 'Dados de cartão não devem ser enviados diretamente'
            },
            {
                name: 'Tokens de autenticação no body',
                check: () => {
                    return !(body.access_token || body.bearer_token || body.auth_token);
                },
                message: 'Tokens de autenticação devem estar no header Authorization'
            }
        ];

        // Executar todas as verificações
        for (const check of paymentSecurityChecks) {
            if (!check.check()) {
                console.error(`🚨 [PAYMENT-SECURITY] Violação: ${check.name}`);
                return res.status(400).json({
                    error: 'Violação de segurança em pagamento',
                    message: check.message,
                    code: 'PAYMENT_SECURITY_VIOLATION'
                });
            }
        }

        console.log('✅ [PAYMENT-SECURITY] Dados de pagamento validados com sucesso');
        next();

    } catch (error) {
        console.error('❌ [PAYMENT-SECURITY] Erro na validação:', error);
        next();
    }
};

// Middleware para logs de auditoria
const auditPaymentRequest = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const endpoint = req.path;

    console.log(`📋 [AUDIT] ${timestamp} - Payment request`);
    console.log(`📋 [AUDIT] IP: ${ip}`);
    console.log(`📋 [AUDIT] Endpoint: ${endpoint}`);
    console.log(`📋 [AUDIT] Method: ${req.method}`);
    console.log(`📋 [AUDIT] User-Agent: ${userAgent}`);

    // Log dos campos enviados (sem valores sensíveis)
    if (req.body && typeof req.body === 'object') {
        const fields = Object.keys(req.body);
        console.log(`📋 [AUDIT] Campos enviados: ${fields.join(', ')}`);
    }

    next();
};

module.exports = {
    validatePayloadSecurity,
    validatePaymentSecurity,
    auditPaymentRequest
}; 