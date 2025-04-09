/**
 * API Service - Módulo responsável pela comunicação com o backend
 * Centraliza todas as chamadas à API para facilitar a manutenção
 */
class APIService {
    constructor() {
        // Determina a base URL da API baseado no ambiente
        this.baseUrl = '/api'; // Usando rota relativa uma vez que backend e frontend estão servidos juntos
    }

    /**
     * Método para envio de análise de currículo
     * @param {FormData} formData - Dados do formulário com arquivo de currículo e links
     * @returns {Promise<Object>} - Promessa que resolve com o objeto de resposta
     */
    async analyzeResume(formData) {
        try {
            const response = await fetch(`${this.baseUrl}/resume/analyze`, {
                method: 'POST',
                body: formData,
                // Não definir Content-Type quando usando FormData - o navegador fará isso automaticamente
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao enviar currículo para análise');
            }
            
            return data;
        } catch (error) {
            console.error('Erro na API de análise:', error);
            throw error;
        }
    }

    /**
     * Consulta o status de uma análise em andamento
     * @param {String} analysisId - ID da análise
     * @returns {Promise<Object>} - Promessa que resolve com o status da análise
     */
    async getAnalysisStatus(analysisId) {
        try {
            const response = await fetch(`${this.baseUrl}/resume/analysis/status/${analysisId}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao consultar status da análise');
            }
            
            return data;
        } catch (error) {
            console.error('Erro ao consultar status:', error);
            throw error;
        }
    }

    /**
     * Obtém os resultados completos de uma análise
     * @param {String} analysisId - ID da análise
     * @returns {Promise<Object>} - Promessa que resolve com os resultados da análise
     */
    async getAnalysisResults(analysisId) {
        try {
            const response = await fetch(`${this.baseUrl}/resume/analysis/${analysisId}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao obter resultados da análise');
            }
            
            return data;
        } catch (error) {
            console.error('Erro ao obter resultados:', error);
            throw error;
        }
    }

    /**
     * Obtém resultados formatados para a página de resultados
     * @param {String} analysisId - ID da análise
     * @returns {Promise<Object>} - Promessa que resolve com os resultados formatados
     */
    async getFormattedAnalysis(analysisId) {
        try {
            const response = await fetch(`${this.baseUrl}/resume/analysis/${analysisId}/formatted`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao obter análise formatada');
            }
            
            return data;
        } catch (error) {
            console.error('Erro ao obter análise formatada:', error);
            throw error;
        }
    }

    /**
     * Analisa a compatibilidade do currículo com sistemas ATS
     * @param {FormData} formData - Dados do formulário com arquivo de currículo
     * @returns {Promise<Object>} - Promessa que resolve com análise de ATS
     */
    async analyzeATSCompatibility(formData) {
        try {
            const response = await fetch(`${this.baseUrl}/resume/analyze-ats`, {
                method: 'POST',
                body: formData,
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao analisar compatibilidade ATS');
            }
            
            return data;
        } catch (error) {
            console.error('Erro na API de análise ATS:', error);
            throw error;
        }
    }

    /**
     * Calcula estimativa de tokens para currículo e vagas
     * @param {FormData} formData - Dados do formulário com arquivo de currículo e links
     * @returns {Promise<Object>} - Promessa que resolve com estimativa de tokens
     */
    async calculateTokens(formData) {
        try {
            const response = await fetch(`${this.baseUrl}/resume/calculate-tokens`, {
                method: 'POST',
                body: formData,
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao calcular tokens');
            }
            
            return data;
        } catch (error) {
            console.error('Erro ao calcular tokens:', error);
            throw error;
        }
    }

    /**
     * Obtém o histórico de análises do usuário (requer autenticação)
     * @returns {Promise<Object>} - Promessa que resolve com o histórico de análises
     */
    async getAnalysisHistory() {
        try {
            // Obtém o token de autenticação do serviço de autenticação 
            const token = window.authService?.getToken();
            
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`${this.baseUrl}/resume/history`, {
                headers
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao obter histórico de análises');
            }
            
            return data;
        } catch (error) {
            console.error('Erro ao obter histórico:', error);
            throw error;
        }
    }
}

// Exporta uma instância global da classe APIService
window.apiService = new APIService();
