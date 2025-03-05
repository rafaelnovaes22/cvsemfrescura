// app.js
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');
const path = require('path');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const logger = require('./config/logger');

// Iniciar o app
const app = express();

// Habilitar confiança em proxies se estiver atrás de um
app.enable('trust proxy');

// Implementar CORS
app.use(cors());
app.options('*', cors());

// Configuração de segurança dos cabeçalhos HTTP
app.use(helmet());

// Logging de desenvolvimento
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Limitador de taxa para API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Muitas requisições deste IP, tente novamente em uma hora!'
});
app.use('/api', limiter);

// Body parser, limitar dados a 10kb
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Sanitização de dados contra NoSQL query injection
app.use(mongoSanitize());

// Sanitização de dados contra XSS
app.use(xss());

// Proteção contra poluição de parâmetros HTTP
app.use(hpp({
    whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price'
    ]
}));

// Compressão para diminuir o tamanho da resposta
app.use(compression());

// Rotas
app.use('/api/v1/auth', authRoutes);

// Rota para verificação de saúde da aplicação
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Serviço online' });
});

// Tratar rotas inexistentes
app.all('*', (req, res, next) => {
    next(new AppError(`Não foi possível encontrar ${req.originalUrl} neste servidor!`, 404));
});

// Middleware de tratamento de erros global
app.use(globalErrorHandler);

module.exports = app;