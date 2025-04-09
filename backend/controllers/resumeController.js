const crypto = require('crypto');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth'); // Para .docx
const openaiService = require('../services/openaiService');
const { scrapeJobDetails } = require('../services/scrapingService'); // Importa o serviço de scraping

// Instância do serviço OpenAI
// const openaiService = new OpenAIService(); 

// Armazenamento em memória (será passado como argumento nas funções)
// const analysisStore = {}; 

/**
 * Função para extrair texto de um buffer de arquivo (PDF, DOCX)
 * @param {Buffer} fileBuffer - Buffer do arquivo
 * @param {string} mimetype - Mimetype do arquivo
 * @returns {Promise<string>} - Texto extraído
 */
async function extractTextFromFile(fileBuffer, mimetype) {
    console.log(`[Text Extraction] Iniciando extração para mimetype: ${mimetype}`);
    if (mimetype === 'application/pdf') {
        try {
            const data = await pdfParse(fileBuffer);
            console.log('[Text Extraction] PDF parseado com sucesso.');
            return data.text;
        } catch (error) {
            console.error('[Text Extraction] Erro ao parsear PDF:', error);
            throw new Error('Erro ao processar arquivo PDF.');
        }
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
            const { value } = await mammoth.extractRawText({ buffer: fileBuffer });
            console.log('[Text Extraction] DOCX parseado com sucesso.');
            return value;
        } catch (error) {
            console.error('[Text Extraction] Erro ao processar arquivo DOCX:', error);
            throw new Error('Erro ao processar arquivo DOCX.');
        }
    } else if (mimetype === 'application/msword') {
        // Mammoth pode não suportar .doc diretamente ou requerer configuração adicional.
        // Placeholder - idealmente usar uma lib que suporte .doc ou instruir usuário a usar .docx/.pdf
        console.warn('[Text Extraction] Formato .doc (msword) tem suporte limitado. Preferir .docx ou .pdf.');
        throw new Error('Formato .doc não é totalmente suportado. Use .docx ou .pdf para melhor resultado.');
    } else {
        console.error(`[Text Extraction] Mimetype não suportado: ${mimetype}`);
        throw new Error('Tipo de arquivo não suportado para extração de texto.');
    }
}

/**
 * Controller para iniciar a análise do currículo
 * @param {Object} analysisStore - O objeto para armazenar status/resultados
 */
exports.startAnalysis = async (req, res, next, analysisStore) => {
    console.log('[API /analyze] Received request body:', JSON.stringify(req.body));
    console.log('[API /analyze] Received file:', req.file ? req.file.originalname : 'No file');
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Nenhum arquivo de currículo enviado.' });
        }

        console.log('[API /analyze] Arquivo recebido:', req.file.originalname, 'Mimetype:', req.file.mimetype);

        let jobLinks = [];
        if (req.body.jobLinks) {
            try {
                jobLinks = JSON.parse(req.body.jobLinks);
                if (!Array.isArray(jobLinks)) throw new Error('jobLinks não é um array');
                // Limitar a 7 links
                jobLinks = jobLinks.slice(0, 7);
                console.log(`[API /analyze] Links de vagas recebidos (limitado a ${jobLinks.length}):`, jobLinks);
            } catch (e) {
                console.error('[API /analyze] Erro ao parsear jobLinks:', e);
                return res.status(400).json({ success: false, message: 'Formato inválido para jobLinks. Deve ser um array JSON de strings.' });
            }
        }

        const analysisId = crypto.randomUUID();
        console.log(`[API /analyze] Gerado Analysis ID: ${analysisId}`);

        analysisStore[analysisId] = { status: 'processing', data: null, error: null, createdAt: new Date() };

        res.status(202).json({ success: true, analysisId: analysisId });

        // --- Processamento assíncrono --- 
        setImmediate(async () => {
            console.log(`[Async Process ${analysisId}] Starting async processing. Initial jobLinks:`, JSON.stringify(jobLinks));
            let resumeText = '';
            const jobsData = [];
            try {
                console.log(`[Async Process ${analysisId}] Iniciando extração de texto...`);
                resumeText = await extractTextFromFile(req.file.buffer, req.file.mimetype);
                console.log(`[Async Process ${analysisId}] Extração de texto concluída (${resumeText.length} caracteres).`);

                // Processar links das vagas com scraping
                if (jobLinks.length > 0) {
                    console.log(`[Async Process ${analysisId}] Iniciando scraping para ${jobLinks.length} vagas...`);
                    // Usar Promise.all para buscar detalhes em paralelo
                    const scrapingPromises = jobLinks.map(url => scrapeJobDetails(url));
                    const scrapedResults = await Promise.all(scrapingPromises);

                    // Adicionar resultados válidos (mesmo os que falharam parcialmente) ao jobsData
                    scrapedResults.forEach(result => {
                        if (result) { // scrapeJobDetails agora sempre retorna um objeto
                            jobsData.push(result);
                        }
                    });
                    console.log(`[Async Process ${analysisId}] Scraping concluído. ${jobsData.length} vagas processadas (algumas podem ter falhado).`);
                }

                console.log(`[Async Process ${analysisId}] Chamando OpenAI Service com currículo e ${jobsData.length} vagas...`);
                const analysisResult = await openaiService.analyzeResume(resumeText, jobsData);
                console.log(`[Async Process ${analysisId}] Análise OpenAI concluída.`);

                if (analysisStore[analysisId]) {
                    analysisStore[analysisId].data = analysisResult;
                    analysisStore[analysisId].status = 'completed';
                    console.log(`[Async Process ${analysisId}] Status atualizado para completed.`);
                } else {
                    console.warn(`[Async Process ${analysisId}] Análise não encontrada no store após conclusão. Pode ter sido limpa.`);
                }

            } catch (error) {
                console.error(`[Async Process ${analysisId}] Erro durante processamento assíncrono:`, error);
                if (analysisStore[analysisId]) {
                    analysisStore[analysisId].status = 'error';
                    // Inclui detalhes do erro, útil para depuração (especialmente erros de scraping ou OpenAI)
                    analysisStore[analysisId].error = `Erro: ${error.message}. Detalhes: ${error.stack ? error.stack.substring(0, 500) + '...' : 'Sem stack disponível'}`;
                    console.log(`[Async Process ${analysisId}] Status atualizado para error.`);
                } else {
                    console.warn(`[Async Process ${analysisId}] Análise não encontrada no store após erro. Pode ter sido limpa.`);
                }
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Controller para obter o status da análise
 * @param {Object} analysisStore - O objeto para armazenar status/resultados
 */
exports.getAnalysisStatus = (req, res, next, analysisStore) => {
    try {
        const { analysisId } = req.params;
        const analysis = analysisStore[analysisId]; // Usa o store passado

        if (!analysis) {
            return res.status(404).json({ success: false, message: 'Análise não encontrada.' });
        }

        console.log(`[API /status/${analysisId}] Status solicitado: ${analysis.status}`);
        // Retorna o erro apenas se o status for 'error'
        const errorResponse = analysis.status === 'error' ? analysis.error : null;
        res.json({ success: true, status: analysis.status, error: errorResponse });

    } catch (error) {
        next(error);
    }
};

/**
 * Controller para obter os resultados da análise
 * @param {Object} analysisStore - O objeto para armazenar status/resultados
 */
exports.getAnalysisResults = (req, res, next, analysisStore) => {
    try {
        const { analysisId } = req.params;
        const analysis = analysisStore[analysisId]; // Usa o store passado

        if (!analysis) {
            return res.status(404).json({ success: false, message: 'Análise não encontrada.' });
        }

        if (analysis.status === 'processing') {
            return res.status(200).json({ success: false, message: 'Análise ainda em processamento.', status: 'processing' });
        } else if (analysis.status === 'error') {
            // Retorna uma mensagem genérica de erro, mas loga o detalhe no backend
            console.error(`[API /analysis/${analysisId}] Erro retornado ao cliente: ${analysis.error}`);
            return res.status(500).json({
                success: false,
                message: 'Ocorreu um erro durante a análise. Verifique os detalhes ou tente novamente.',
                error: 'Analysis failed', // Mensagem genérica
                status: 'error'
            });
        } else if (analysis.status === 'completed') {
            console.log(`[API /analysis/${analysisId}] Resultados solicitados.`);
            res.json({ success: true, data: analysis.data, status: 'completed' });
        } else {
            // Caso inesperado
            return res.status(500).json({ success: false, message: 'Status de análise desconhecido.' });
        }

    } catch (error) {
        next(error);
    }
};

// A função de limpeza pode permanecer aqui ou ser movida para server.js
// Se movida, precisa receber analysisStore como argumento.
function cleanupOldAnalyses(analysisStore) {
    const now = Date.now();
    const MAX_AGE = process.env.ANALYSIS_MAX_AGE_MS || (60 * 60 * 1000); // 1 hora por padrão

    let cleanedCount = 0;
    for (const id in analysisStore) {
        if (analysisStore[id].createdAt && now - analysisStore[id].createdAt.getTime() > MAX_AGE) {
            console.log(`[Cleanup] Removendo análise antiga: ${id}`);
            delete analysisStore[id];
            cleanedCount++;
        }
    }
    if (cleanedCount > 0) {
        console.log(`[Cleanup] ${cleanedCount} análises antigas removidas.`);
    }
}

// Agendar limpeza (precisa do analysisStore, então talvez seja melhor chamá-la de server.js)
// setInterval(() => cleanupOldAnalyses(analysisStore), 60 * 60 * 1000); // Removido daqui 