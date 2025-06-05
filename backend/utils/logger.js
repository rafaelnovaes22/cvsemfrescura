const winston = require('winston');
const path = require('path');
const { sanitizeForLog } = require('./encryption');

// Formato customizado que sanitiza dados sensíveis
const sanitizeFormat = winston.format((info) => {
    // Sanitiza todos os dados do log
    const sanitized = { ...info };

    // Sanitiza a mensagem principal
    if (sanitized.message) {
        sanitized.message = typeof sanitized.message === 'string'
            ? sanitized.message
            : JSON.stringify(sanitizeForLog(sanitized.message));
    }

    // Sanitiza todos os metadados
    Object.keys(sanitized).forEach(key => {
        if (key !== 'level' && key !== 'timestamp' && key !== 'service') {
            sanitized[key] = sanitizeForLog(sanitized[key]);
        }
    });

    return sanitized;
});

// Configuração do logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        sanitizeFormat(),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'cv-sem-frescura' },
    transports: []
});

// Em produção, apenas logs de erro críticos
if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
        filename: path.join(__dirname, '../logs/error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 3
    }));
} else {
    // Em desenvolvimento, manter logs completos
    logger.add(new winston.transports.File({
        filename: path.join(__dirname, '../logs/error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }));

    logger.add(new winston.transports.File({
        filename: path.join(__dirname, '../logs/combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }));

    // Console apenas em desenvolvimento
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Middleware para logar requests HTTP
const logRequest = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('HTTP Request', {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    });

    next();
};

// Middleware para capturar erros
const logError = (err, req, res, next) => {
    logger.error('Application Error', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    next(err);
};

module.exports = {
    logger,
    logRequest,
    logError
}; 