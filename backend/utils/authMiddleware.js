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
  if (!authHeader) {
    console.log('[AUTH] ❌ Token não fornecido para:', req.url);
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('[AUTH] ❌ Token inválido ou não extraído para:', req.url);
    return res.status(401).json({ error: 'Token inválido.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('[AUTH] ❌ Erro na verificação do token para:', req.url, '- Erro:', err.message);
    res.status(401).json({ error: 'Token inválido.' });
  }
};
