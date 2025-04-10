/**
 * Controller para processamento de múltiplas URLs de vagas
 */
const multiJobService = require('../services/multiJobService');

/**
 * Processa múltiplas URLs de vagas e retorna análise ATS consolidada
 */
exports.processMultipleUrls = async (req, res, next) => {
    try {
        // Verificar se o body contém um array de URLs
        if (!req.body.jobUrls || !Array.isArray(req.body.jobUrls) || req.body.jobUrls.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'É necessário fornecer um array de URLs no campo "jobUrls".' 
            });
        }

        const jobUrls = req.body.jobUrls;
        
        // Verificar o número máximo de URLs (limite de 7)
        if (jobUrls.length > 7) {
            console.log(`[API /ats/process-multiple] Recebidas ${jobUrls.length} URLs, limitando a 7`);
        }
        
        console.log(`[API /ats/process-multiple] Processando ${Math.min(jobUrls.length, 7)} URLs`);
        
        // Enviar para o serviço processar
        const analysisResult = await multiJobService.processMultipleJobUrls(jobUrls);
        
        // Retornar o resultado
        res.json(analysisResult);

    } catch (error) {
        console.error('[API /ats/process-multiple] Erro durante processamento:', error);
        next(error);
    }
};
