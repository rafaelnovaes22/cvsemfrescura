// config/logger.js
const winston = require('winston');
const path = require('path');

// Define o formato de log
const logFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
    return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
});

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        logFormat
    ),
    defaultMeta: { service: 'auth-service' },
    transports: [
        // Escreve todos os logs com nível 'error' ou inferior em 'error.log'
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error'
        }),
        // Escreve todos os logs com nível 'info' ou inferior em 'combined.log'
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/combined.log')
        }),
    ],
    // Tratamento de exceções não capturadas
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/exceptions.log')
        })
    ],
    // Tratamento de rejeições de promessas não tratadas
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/rejections.log')
        })
    ]
});

// Adiciona log no console durante desenvolvimento
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
    }));
}

module.exports = logger;