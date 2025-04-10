const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet'); // Importa helmet
const resumeController = require('./controllers/resumeController'); // Importa o controller
const atsController = require('./controllers/atsController'); // Importa o controller ATS
const multiJobController = require('./controllers/multiJobController'); // Importa o controller para múltiplas vagas

// Carrega variáveis de ambiente do .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Armazenamento em memória para status e resultados ---
// Em produção, usar um banco de dados (Redis, PostgreSQL, etc.)
const analysisStore = {}; // { analysisId: { status: 'processing' | 'completed' | 'error', data: {}, error: null, createdAt: Date } }

// Importa a função de limpeza (se exportada) ou a redefine aqui
// Vamos redefinir aqui para simplicidade
function cleanupOldAnalyses(store) {
    const now = Date.now();
    const MAX_AGE = process.env.ANALYSIS_MAX_AGE_MS || (60 * 60 * 1000); // 1 hora por padrão

    let cleanedCount = 0;
    for (const id in store) {
        if (store[id].createdAt && now - store[id].createdAt.getTime() > MAX_AGE) {
            console.log(`[Cleanup] Removendo análise antiga: ${id}`);
            delete store[id];
            cleanedCount++;
        }
    }
    if (cleanedCount > 0) {
        console.log(`[Cleanup] ${cleanedCount} análises antigas removidas.`);
    }
}

// Agendar limpeza periódica do analysisStore
const CLEANUP_INTERVAL = process.env.CLEANUP_INTERVAL_MS || (30 * 60 * 1000); // A cada 30 minutos por padrão
setInterval(() => cleanupOldAnalyses(analysisStore), CLEANUP_INTERVAL);
console.log(`[Server] Limpeza de análises agendada a cada ${CLEANUP_INTERVAL / 60000} minutos.`);

// Middlewares

// Helmet para segurança e CSP
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                "default-src": ["'self'"],
                "script-src": ["'self'", "'unsafe-inline'"], // Permite scripts inline (verificar se necessário)
                "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                "img-src": ["'self'", "data:", "blob:"], // Permite imagens do servidor, data: URIs e blob:
                "font-src": ["'self'", "https://fonts.gstatic.com"],
                "connect-src": ["'self'"], // Permite conexões (API calls) para o próprio servidor
            },
        },
        crossOriginEmbedderPolicy: false, // Pode ser necessário ajustar dependendo dos embeds
        crossOriginResourcePolicy: { policy: "cross-origin" } // Permite carregar recursos cross-origin se necessário
    })
);

app.use(cors()); // Permite requisições de diferentes origens (frontend)
app.use(express.json()); // Para parsear JSON bodies
app.use(express.urlencoded({ extended: true })); // Para parsear URL-encoded bodies

// Configuração do Multer para upload de arquivos em memória
const storage = multer.memoryStorage(); // Armazena o arquivo como um Buffer na memória
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB para o arquivo
    fileFilter: (req, file, cb) => {
        // Aceitar apenas PDF, DOC, DOCX
        const allowedTypes = /pdf|doc|docx|msword|vnd.openxmlformats-officedocument.wordprocessingml.document/;
        // Verificar mimetype
        const mimetypeCheck = allowedTypes.test(file.mimetype);
        // Verificar extensão (como fallback)
        const extnameCheck = allowedTypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetypeCheck || extnameCheck) { // Permitir se mimetype OU extensão baterem
            cb(null, true);
        } else {
            console.warn(`Upload rejeitado - Tipo inválido: ${file.mimetype}, Extensão: ${path.extname(file.originalname)}`);
            cb(new Error(`Erro: Apenas arquivos PDF, DOC e DOCX são permitidos! Tipo recebido: ${file.mimetype}`));
        }
    }
});

// Servir arquivos estáticos
// Servir arquivos da pasta 'frontend' (ex: /assets/js/script.js)
app.use(express.static(path.join(__dirname, '..', 'frontend')));
// Servir arquivos da raiz do projeto (ex: /index.html)
// Nota: Isso pode conflitar se houver nomes iguais na raiz e em /frontend
// Considerar mover os HTMLs para dentro de /frontend
app.use(express.static(path.join(__dirname, '..')));

// --- Rotas da API ---
const apiRouter = express.Router();

// Endpoint de teste
apiRouter.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend CV Sem Frescura está rodando!' });
});

// Rota para iniciar a análise (POST /api/resume/analyze)
// Usa o middleware do multer para processar um único arquivo chamado 'resumeFile'
apiRouter.post(
    '/resume/analyze',
    upload.single('resumeFile'), // Nome do campo esperado no FormData
    (req, res, next) => resumeController.startAnalysis(req, res, next, analysisStore) // Passa o store
);

// Rota para verificar o status da análise (GET /api/resume/analysis/status/:analysisId)
apiRouter.get(
    '/resume/analysis/status/:analysisId',
    (req, res, next) => resumeController.getAnalysisStatus(req, res, next, analysisStore) // Passa o store
);

// Rota para obter os resultados da análise (GET /api/resume/analysis/:analysisId)
apiRouter.get(
    '/resume/analysis/:analysisId',
    (req, res, next) => resumeController.getAnalysisResults(req, res, next, analysisStore) // Passa o store
);

// Rota para extrair palavras-chave ATS de uma descrição de vaga (POST /api/ats/extract)
apiRouter.post(
    '/ats/extract',
    atsController.extractAtsKeywords
);

// Rota para processar múltiplas URLs de vagas e extrair análise ATS consolidada (POST /api/ats/process-multiple)
apiRouter.post(
    '/ats/process-multiple',
    multiJobController.processMultipleUrls
);

app.use('/api', apiRouter); // Prefixo /api para todas as rotas

// Tratamento de erro para Multer (ex: tipo de arquivo inválido)
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.warn("Erro do Multer:", err);
        return res.status(400).json({ success: false, message: `Erro no upload: ${err.message}` });
    } else if (err.message.includes('Apenas arquivos PDF, DOC e DOCX são permitidos')) {
        console.warn("Erro de tipo de arquivo:", err.message);
        return res.status(400).json({ success: false, message: err.message });
    }
    // Passa para o próximo handler de erro se não for erro do Multer ou de tipo
    next(err);
});

// Tratamento de erro global (final)
app.use((err, req, res, next) => {
    console.error("Erro não tratado:", err.stack || err);
    // Evitar vazar detalhes do erro em produção
    const message = process.env.NODE_ENV === 'production' ? 'Ocorreu um erro interno no servidor.' : err.message;
    res.status(err.status || 500).json({ success: false, message });
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});

module.exports = app; // Exportar para possíveis testes futuros 