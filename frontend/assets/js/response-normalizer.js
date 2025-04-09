/**
 * Response Normalizer
 * Garante compatibilidade entre diferentes formatos de resposta do backend
 * e o formato esperado no frontend
 */

const responseNormalizer = {
    /**
     * Normaliza o formato da estrutura de análise
     * @param {Object} analysisData - Dados brutos da análise
     * @returns {Object} - Dados normalizados
     */
    normalizeAnalysisData: function(analysisData) {
        // Se não houver dados ou já estiver no formato esperado (sem a propriedade data), retornar como está
        if (!analysisData || !analysisData.data) {
            return analysisData;
        }
        
        // Caso a resposta tenha uma propriedade "data", extrair e normalizar esse conteúdo
        const data = analysisData.data;
        
        // Garantir que a propriedade matchScore seja um objeto
        if (typeof data.matchScore === 'number') {
            data.matchScore = {
                overall: data.matchScore,
                technical: data.matchScore,
                experience: data.matchScore
            };
        } else if (!data.matchScore) {
            data.matchScore = { overall: 0, technical: 0, experience: 0 };
        }
        
        // Garantir que keywords seja um array
        if (!Array.isArray(data.keywords)) {
            data.keywords = data.keywords ? [data.keywords] : [];
        }
        
        // Garantir que recommendations seja um array
        if (!Array.isArray(data.recommendations)) {
            data.recommendations = data.recommendations ? [data.recommendations] : [];
        }
        
        // Garantir que jobMatchDetails seja um array
        if (!Array.isArray(data.jobMatchDetails)) {
            data.jobMatchDetails = data.jobMatchDetails ? [data.jobMatchDetails] : [];
        }
        
        // Garantir que a estrutura de análise estrutural esteja completa
        if (!data.structuralAnalysis) {
            data.structuralAnalysis = { score: 0, feedback: '', sections: [] };
        } else if (typeof data.structuralAnalysis === 'object') {
            if (!('score' in data.structuralAnalysis)) {
                data.structuralAnalysis.score = 0;
            }
            if (!('feedback' in data.structuralAnalysis)) {
                data.structuralAnalysis.feedback = '';
            }
            if (!('sections' in data.structuralAnalysis)) {
                data.structuralAnalysis.sections = [];
            }
        }
        
        // Garantir que keywordsByCategory exista e seja um objeto
        if (!data.keywordsByCategory || typeof data.keywordsByCategory !== 'object') {
            data.keywordsByCategory = {
                technical: [],
                soft: [],
                experience: []
            };
        }
        
        return data;
    },
    
    /**
     * Hook que intercepta respostas de APIs e as normaliza antes do uso
     * Pode ser usado diretamente no código da API
     * @param {Function} apiFetchFunction - Função assíncrona que faz a chamada à API
     * @returns {Function} - Função wrapper que normaliza o resultado
     */
    withNormalization: function(apiFetchFunction) {
        return async function(...args) {
            const result = await apiFetchFunction(...args);
            return responseNormalizer.normalizeAnalysisData(result);
        };
    }
};

// Adicionar ao escopo global para uso em outros módulos
window.responseNormalizer = responseNormalizer;

// Estender o APIService com normalização automática se já existir
document.addEventListener('DOMContentLoaded', function() {
    if (window.apiService) {
        // Método original
        const originalGetAnalysisResults = window.apiService.getAnalysisResults;
        
        // Substituir com versão normalizada
        window.apiService.getAnalysisResults = async function(analysisId) {
            const result = await originalGetAnalysisResults.call(window.apiService, analysisId);
            // Se houver um resultado válido com dados, normalizar
            if (result && result.success && result.data) {
                // Normalizar dados dentro da resposta
                result.data = responseNormalizer.normalizeAnalysisData(result.data);
            }
            return result;
        };
    }
});
