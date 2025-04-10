/**
 * Script para analisar vagas da Gupy via API
 * Permite extrair palavras-chave de vagas diretamente da URL
 */
document.addEventListener('DOMContentLoaded', function() {
    // Elementos do formulário de análise Gupy
    const gupyForm = document.getElementById('gupy-job-form');
    const jobUrlInput = document.getElementById('job-url-input');
    const submitButton = document.getElementById('analyze-gupy-btn');
    const resultContainer = document.getElementById('gupy-results-container');
    const loadingIndicator = document.getElementById('gupy-loading');
    
    // Event listener para o formulário
    if (gupyForm) {
        gupyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const jobUrl = jobUrlInput.value.trim();
            
            if (!jobUrl) {
                showError('Por favor, insira a URL da vaga.');
                return;
            }
            
            analyzeGupyJob(jobUrl);
        });
    }
    
    /**
     * Analisa uma vaga da Gupy através da API
     * @param {string} jobUrl - URL da vaga na Gupy
     */
    async function analyzeGupyJob(jobUrl) {
        try {
            // Mostrar indicador de carregamento
            if (loadingIndicator) loadingIndicator.style.display = 'block';
            if (resultContainer) resultContainer.innerHTML = '';
            
            // Desabilitar botão durante requisição
            if (submitButton) submitButton.disabled = true;
            
            // Fazer requisição para API
            const response = await fetch('/api/ats/extract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ jobUrl: jobUrl })
            });
            
            // Processar resposta
            const data = await response.json();
            
            // Ocultar indicador de carregamento
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            
            // Habilitar botão novamente
            if (submitButton) submitButton.disabled = false;
            
            if (!data.success) {
                showError(data.message || 'Erro ao processar a vaga da Gupy.');
                return;
            }
            
            // Redirecionar para a página de resultados com os dados da análise
            redirectToResults(data.data);
            
        } catch (error) {
            console.error('Erro ao analisar vaga da Gupy:', error);
            
            // Ocultar indicador de carregamento
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            
            // Habilitar botão novamente
            if (submitButton) submitButton.disabled = false;
            
            showError('Erro ao conectar com o servidor. Verifique sua conexão e tente novamente.');
        }
    }
    
    /**
     * Exibe uma mensagem de erro
     * @param {string} message - Mensagem de erro a ser exibida
     */
    function showError(message) {
        if (resultContainer) {
            resultContainer.innerHTML = `<div class="error-message">${message}</div>`;
        } else {
            alert(message);
        }
    }
    
    /**
     * Redireciona para a página de resultados com os dados da análise
     * @param {Object} analysisData - Dados da análise ATS
     */
    function redirectToResults(analysisData) {
        // Armazenar dados na sessionStorage
        sessionStorage.setItem('atsAnalysisData', JSON.stringify(analysisData));
        
        // Redirecionar para a página de resultados
        window.location.href = '/results.html?source=gupy_job';
    }
});
