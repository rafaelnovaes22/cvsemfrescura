const openaiService = require('../services/openaiService');
const gupyJobService = require('../services/gupyJobService');

/**
 * Controller para extrair palavras-chave ATS de uma descrição de vaga
 */
exports.extractAtsKeywords = async (req, res, next) => {
    try {
        // Checagem inicial se temos uma URL da Gupy ou uma descrição direta
        if (req.body.jobUrl) {
            console.log('[API /ats/extract] Recebida URL para análise ATS:', req.body.jobUrl);
            
            // Verificar se é uma URL da Gupy
            if (gupyJobService.isGupyJob(req.body.jobUrl)) {
                console.log('[API /ats/extract] URL identificada como Gupy, extraindo detalhes...');
                const processedDescription = await gupyJobService.processGupyJobUrl(req.body.jobUrl);
                
                if (processedDescription) {
                    // Chamando o serviço de extração ATS com a descrição processada
                    const atsAnalysis = await openaiService.extractAtsJobKeywords(processedDescription);
                    
                    // Retornando o resultado
                    return res.json({
                        success: true,
                        data: atsAnalysis,
                        source: 'gupy',
                        processedUrl: req.body.jobUrl
                    });
                } else {
                    return res.status(422).json({
                        success: false,
                        message: 'Não foi possível processar a URL da Gupy. Tente fornecer a descrição diretamente.'
                    });
                }
            } else {
                return res.status(422).json({
                    success: false,
                    message: 'URL não reconhecida como Gupy ou plataforma suportada. Tente fornecer a descrição diretamente.'
                });
            }
        } else if (!req.body.jobDescription) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nenhuma descrição de vaga ou URL fornecida.' 
            });
        }

        console.log('[API /ats/extract] Recebida descrição de vaga para análise ATS');
        
        const jobDescription = req.body.jobDescription;
        
        // Chamando o serviço de extração ATS
        const atsAnalysis = await openaiService.extractAtsJobKeywords(jobDescription);
        
        // Retornando o resultado
        res.json({ 
            success: true, 
            data: atsAnalysis,
            source: 'direct_input'
        });

    } catch (error) {
        console.error('[API /ats/extract] Erro durante processamento:', error);
        next(error);
    }
};
