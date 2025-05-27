const jwt = require('jsonwebtoken');

// Configurações JWT
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER || 'cv-sem-frescura';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'api-users';

// Validação do JWT_SECRET
if (!JWT_SECRET) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️  JWT_SECRET não definido. Configure no arquivo .env');
    console.log('⚠️  Exemplo: JWT_SECRET=sua-chave-super-secreta-256-bits');
  } else {
    console.error('ERRO CRÍTICO: JWT_SECRET não configurado em produção.');
    process.exit(1);
  }
}

// Middleware de autenticação melhorado
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Token de acesso requerido',
      code: 'MISSING_TOKEN'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Formato de token inválido. Use: Bearer <token>',
      code: 'INVALID_TOKEN_FORMAT'
    });
  }

  try {
    // Verificação com validações extras
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });

    req.user = decoded;
    next();

  } catch (err) {
    // Tratamento específico de erros
    let errorResponse = { error: 'Token inválido', code: 'TOKEN_ERROR' };

    switch (err.name) {
      case 'TokenExpiredError':
        errorResponse = { error: 'Token expirado', code: 'TOKEN_EXPIRED' };
        break;
      case 'JsonWebTokenError':
        errorResponse = { error: 'Token malformado', code: 'MALFORMED_TOKEN' };
        break;
      case 'NotBeforeError':
        errorResponse = { error: 'Token ainda não é válido', code: 'TOKEN_NOT_ACTIVE' };
        break;
    }

    // Log de segurança (apenas em desenvolvimento)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔒 Auth Error: ${err.name} - ${err.message}`);
    }

    res.status(401).json(errorResponse);
  }
};
