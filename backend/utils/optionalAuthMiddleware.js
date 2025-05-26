const jwt = require('jsonwebtoken');

// JWT_SECRET é obrigatório - sem fallback inseguro
let JWT_SECRET = process.env.JWT_SECRET;

// TEMPORÁRIO: Para desenvolvimento, gerar um secret se não estiver definido
if (!JWT_SECRET && process.env.NODE_ENV !== 'production') {
    console.log('⚠️  JWT_SECRET não definido. Usando secret temporário para desenvolvimento.');
    console.log('⚠️  DEFINA JWT_SECRET no arquivo .env para produção!');
    JWT_SECRET = 'cv-sem-frescura-temp-secret-key-for-development-only-' + Date.now();
}

if (!JWT_SECRET) {
    console.error('ERRO CRÍTICO: JWT_SECRET não configurado. Configure a variável de ambiente JWT_SECRET.');
    process.exit(1);
}

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Se não há header, continua sem usuário
    if (!authHeader) {
        req.user = null;
        return next();
    }

    const token = authHeader.split(' ')[1];

    // Se não há token, continua sem usuário
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        // Tenta decodificar o token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        console.log(`[AUTH] ✅ Usuário autenticado: ${decoded.id}`);
    } catch (err) {
        // Se token inválido, continua sem usuário (não bloqueia)
        console.log('[AUTH] ⚠️ Token inválido - continuando sem autenticação');
        req.user = null;
    }

    next();
}; 