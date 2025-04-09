/**
 * API Integration - Módulo responsável por integrar o serviço de API com a interface do usuário
 * Fornece funções de alto nível para interação entre frontend e backend
 */

// Namespace para funções de integração
const apiIntegration = {
    /**
     * Inicia o processo de análise de currículo e redireciona para a página de carregamento
     * @param {HTMLFormElement} form - Formulário de upload com campos para currículo e links de vagas
     */
    submitResumeForm: async function (form) {
        try {
            // Mostrar indicador de carregamento no botão ou página
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                const originalText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.textContent = 'Enviando...';
            }

            // Preparar os dados do formulário
            const formData = new FormData(form);

            // --- Processar jobLinks a partir dos inputs dinâmicos ---
            const jobLinksContainer = form.querySelector('#jobLinksContainer');
            const links = [];
            if (jobLinksContainer) {
                const linkInputs = jobLinksContainer.querySelectorAll('input[type="url"], input[type="text"]'); // Pega inputs de url ou text
                linkInputs.forEach(input => {
                    const linkValue = input.value.trim();
                    if (linkValue) { // Adiciona apenas se não estiver vazio
                        links.push(linkValue);
                    }
                });
            }

            // Se houver links coletados, adiciona ao FormData como JSON string
            if (links.length > 0) {
                // Garante que não haja um campo 'jobLinks' pré-existente (embora improvável agora)
                formData.delete('jobLinks');
                formData.set('jobLinks', JSON.stringify(links));
            } else {
                // Se nenhum link foi adicionado/preenchido, podemos opcionalmente remover
                // qualquer campo 'jobLinks' vazio que possa ter sido criado por engano.
                formData.delete('jobLinks');
            }
            // --- Fim do processamento de jobLinks ---

            // Enviar para o backend usando o serviço de API
            const response = await window.apiService.analyzeResume(formData);

            // Verificar se a resposta tem o ID esperado
            if (response && response.success && response.analysisId) {
                // Redirecionar para a página de carregamento com o ID
                window.location.href = `loading.html?id=${response.analysisId}`;
            } else {
                throw new Error('Resposta inválida do servidor. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro ao enviar currículo:', error);

            // Exibir erro para o usuário
            const errorContainer = document.getElementById('errorContainer');
            if (errorContainer) {
                errorContainer.textContent = error.message || 'Ocorreu um erro ao iniciar a análise.';
                errorContainer.style.display = 'block';
            } else {
                alert(error.message || 'Ocorreu um erro ao iniciar a análise.');
            }

            // Restaurar botão de envio
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Analisar Currículo';
            }
        }
    },

    /**
     * Inicializa eventos de formulário em todas as páginas
     */
    initFormHandlers: function () {
        // Procurar formulário de análise de currículo na página atual
        const resumeForm = document.getElementById('resumeForm');
        if (resumeForm) {
            resumeForm.addEventListener('submit', function (event) {
                event.preventDefault();
                apiIntegration.submitResumeForm(this);
            });
        }
    },

    /**
     * Monitora o status de análise e redireciona para resultados quando disponíveis
     * Função principal utilizada na página loading.html
     * @param {String} analysisId - ID da análise a ser monitorada
     */
    monitorAnalysisStatus: function (analysisId) {
        if (!analysisId) {
            console.error('ID de análise não fornecido');
            return;
        }

        // Elementos de status que podem existir na página de carregamento
        const statusElement = document.getElementById('statusText');
        const progressBarElement = document.getElementById('progressBar');
        const errorElement = document.getElementById('errorMessage');

        // Variáveis para controle do polling
        let pollInterval;
        let retries = 0;
        const MAX_RETRIES = 50; // Aproximadamente 5 minutos com intervalo de 6s

        // Função interna para verificar status periodicamente
        const checkStatus = async () => {
            try {
                retries++;
                const statusData = await window.apiService.getAnalysisStatus(analysisId);

                // Atualizar elementos visuais conforme o status
                if (statusElement) {
                    if (statusData.status === 'processing') {
                        statusElement.textContent = 'Analisando seu currículo...';
                        // Atualizar barra de progresso se disponível
                        if (progressBarElement) {
                            // Simula progresso baseado no número de tentativas
                            // Máximo de 90% para evitar falsa impressão de conclusão
                            const simulatedProgress = Math.min(90, (retries / MAX_RETRIES) * 100);
                            progressBarElement.style.width = `${simulatedProgress}%`;
                        }
                    } else if (statusData.status === 'completed') {
                        statusElement.textContent = 'Análise concluída! Redirecionando...';
                        // Atualizar barra para 100%
                        if (progressBarElement) {
                            progressBarElement.style.width = '100%';
                        }

                        // Limpar intervalo para parar de verificar
                        clearInterval(pollInterval);

                        // Pequeno atraso para mostrar a mensagem de conclusão antes do redirecionamento
                        setTimeout(() => {
                            window.location.href = `results.html?id=${analysisId}`;
                        }, 1500);
                    } else if (statusData.status === 'error') {
                        // Exibir mensagem de erro
                        if (errorElement) {
                            errorElement.textContent = statusData.error || 'Ocorreu um erro durante a análise.';
                            errorElement.style.display = 'block';
                        }
                        statusElement.textContent = 'Erro na análise';

                        // Limpar intervalo para parar de verificar
                        clearInterval(pollInterval);
                    }
                }

                // Verificar limite de tentativas
                if (retries >= MAX_RETRIES && statusData.status === 'processing') {
                    // Muitas tentativas sem conclusão
                    clearInterval(pollInterval);
                    if (errorElement) {
                        errorElement.textContent = 'A análise está demorando mais do que o esperado. Por favor, tente novamente mais tarde.';
                        errorElement.style.display = 'block';
                    }
                    if (statusElement) {
                        statusElement.textContent = 'Tempo limite excedido';
                    }
                }

            } catch (error) {
                console.error('Erro ao verificar status:', error);

                // Exibir erro
                if (errorElement) {
                    errorElement.textContent = error.message || 'Falha ao verificar o status da análise.';
                    errorElement.style.display = 'block';
                }

                // Limitar tentativas em caso de erro
                if (retries >= 5) {
                    clearInterval(pollInterval);
                    if (statusElement) {
                        statusElement.textContent = 'Falha ao verificar status';
                    }
                }
            }
        };

        // Verificar imediatamente ao carregar a página
        checkStatus();

        // Configurar verificação periódica a cada 6 segundos
        pollInterval = setInterval(checkStatus, 6000);
    },

    /**
     * Carrega os resultados de análise para exibição na página
     * Função principal utilizada na página results.html
     * @param {String} analysisId - ID da análise a exibir
     */
    loadAnalysisResults: async function (analysisId) {
        if (!analysisId) {
            console.error('ID de análise não fornecido');
            return;
        }

        // Elementos que podem estar na página de resultados
        const loadingElement = document.getElementById('loadingResults');
        const resultsContainer = document.getElementById('resultsContainer');
        const errorElement = document.getElementById('errorMessage');

        // Mostrar indicador de carregamento
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }

        try {
            // Buscar dados de análise do backend
            const response = await window.apiService.getAnalysisResults(analysisId);

            // Verificar se a resposta tem os dados esperados
            if (response && response.success && response.data) {
                // Ocultar carregamento e mostrar container de resultados
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
                if (resultsContainer) {
                    resultsContainer.style.display = 'block';
                }

                // Renderizar resultados (implementação depende da estrutura da sua página)
                this.renderAnalysisResults(response.data);
            } else {
                throw new Error('Dados de análise não encontrados ou incompletos.');
            }
        } catch (error) {
            console.error('Erro ao carregar resultados:', error);

            // Ocultar carregamento
            if (loadingElement) {
                loadingElement.style.display = 'none';
            }

            // Exibir mensagem de erro
            if (errorElement) {
                errorElement.textContent = error.message || 'Ocorreu um erro ao carregar os resultados.';
                errorElement.style.display = 'block';
            } else {
                alert(error.message || 'Ocorreu um erro ao carregar os resultados.');
            }
        }
    },

    /**
     * Renderiza os resultados da análise na página
     * @param {Object} data - Dados de análise do backend
     */
    renderAnalysisResults: function (data) {
        // Mapeamento de elementos que podem existir na página de resultados
        const elements = {
            summary: document.getElementById('summarySection'),
            matchScore: document.getElementById('matchScoreValue'),
            matchScoreDisplay: document.getElementById('matchScoreDisplay'),
            keywordsList: document.getElementById('keywordsList'),
            recommendationsList: document.getElementById('recommendationsList'),
            jobMatchDetails: document.getElementById('jobMatchDetails'),
            structuralScore: document.getElementById('structuralScoreValue'),
            structuralFeedback: document.getElementById('structuralFeedback'),
            keywordsByCategory: document.getElementById('keywordsByCategory'),
            fullAnalysis: document.getElementById('fullAnalysisText'),
            conclusion: document.getElementById('conclusion-container'),
            atsStructure: document.getElementById('ats-structure'),
            allJobKeywords: document.getElementById('all-job-keywords-container'),
            matchingKeywords: document.getElementById('keywords-found-container'),
            missingKeywords: document.getElementById('keywords-missing-container')
        };

        // Compatibilidade com o novo formato de dados
        // Verifica se estamos usando o novo formato (all_job_keywords, matching_keywords, etc.) ou o antigo
        const isNewFormat = !!data.all_job_keywords || !!data.matching_keywords || !!data.ats_structure_evaluation;

        // Preencher conclusão ou resumo
        if (elements.conclusion) {
            if (data.conclusion) {
                elements.conclusion.innerHTML = data.conclusion;
            } else if (data.summary) {
                elements.conclusion.innerHTML = data.summary;
            }
        }

        // Preencher resumo geral (se elemento existir)
        if (elements.summary && data.summary) {
            elements.summary.textContent = data.summary;
        }

        // Preencher avaliação ATS (novo formato)
        if (elements.atsStructure && data.ats_structure_evaluation) {
            const ats = data.ats_structure_evaluation;
            elements.atsStructure.innerHTML = `
                <strong>Pontuação Geral:</strong> ${ats.overall_score}/10<br>
                <strong>Clareza e Organização:</strong> ${ats.clarity_organization}<br>
                <strong>Compatibilidade com ATS:</strong> ${ats.ats_compatibility}<br>
                <strong>Seções Essenciais:</strong> ${ats.essential_sections}<br>
                ${ats.comments ? `<strong>Comentários:</strong> ${ats.comments}` : ''}
            `;
        }

        // Preencher pontuação de correspondência
        if (elements.matchScore) {
            let score = 0;

            if (isNewFormat && data.ats_structure_evaluation) {
                // No novo formato, usamos a pontuação da avaliação ATS
                score = data.ats_structure_evaluation.overall_score * 10; // Convertendo escala 0-10 para 0-100
            } else if (data.matchScore) {
                // Verificar se matchScore é objeto ou número
                score = typeof data.matchScore === 'object' ?
                    (data.matchScore.overall || data.matchScore.score || 0) :
                    data.matchScore;
            } else if (data.structuralAnalysis && data.structuralAnalysis.overallScore) {
                score = data.structuralAnalysis.overallScore * 10; // Convertendo 0-10 para percentual
            }

            elements.matchScore.textContent = `${score}%`;

            // Atualizar classes de cor baseado na pontuação
            if (elements.matchScoreDisplay) {
                elements.matchScoreDisplay.className = 'match-score';
                if (score >= 80) {
                    elements.matchScoreDisplay.classList.add('excellent');
                } else if (score >= 60) {
                    elements.matchScoreDisplay.classList.add('good');
                } else if (score >= 40) {
                    elements.matchScoreDisplay.classList.add('average');
                } else {
                    elements.matchScoreDisplay.classList.add('poor');
                }
            }
        }

        // Preencher lista de keywords
        // O novo formato é tratado diretamente na página results.html
        if (elements.keywordsList && !isNewFormat && data.keywords && data.keywords.length) {
            elements.keywordsList.innerHTML = '';
            data.keywords.forEach(keyword => {
                const li = document.createElement('li');
                li.textContent = keyword;
                elements.keywordsList.appendChild(li);
            });
        }

        // Preencher recomendações
        if (elements.recommendationsList && data.recommendations) {
            elements.recommendationsList.innerHTML = '';

            // Verificar se recommendations é array ou string
            const recommendations = Array.isArray(data.recommendations) ?
                data.recommendations :
                [data.recommendations];

            recommendations.forEach(recommendation => {
                if (recommendation && recommendation.trim()) {
                    const li = document.createElement('li');
                    li.textContent = recommendation;
                    elements.recommendationsList.appendChild(li);
                }
            });
        }

        // Carregar keywords categorizadas (apenas no formato antigo - o novo formato é tratado em results.html)
        if (elements.keywordsByCategory && !isNewFormat && data.keywordsByCategory) {
            elements.keywordsByCategory.innerHTML = '';

            // Iterar sobre as categorias
            Object.entries(data.keywordsByCategory).forEach(([category, keywords]) => {
                if (Array.isArray(keywords) && keywords.length) {
                    const categorySection = document.createElement('div');
                    categorySection.className = 'keyword-category';

                    const categoryTitle = document.createElement('h4');
                    // Capitalizar primeira letra da categoria
                    const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
                    categoryTitle.textContent = formattedCategory;

                    const keywordsList = document.createElement('ul');
                    keywords.forEach(keyword => {
                        const item = document.createElement('li');
                        item.textContent = keyword;
                        keywordsList.appendChild(item);
                    });

                    categorySection.appendChild(categoryTitle);
                    categorySection.appendChild(keywordsList);
                    elements.keywordsByCategory.appendChild(categorySection);
                }
            });
        }

        // Elementos de análise antiga que não existem no novo formato
        if (!isNewFormat) {
            // Preencher detalhes de correspondência com vagas
            if (elements.jobMatchDetails && data.jobMatchDetails && data.jobMatchDetails.length) {
                elements.jobMatchDetails.innerHTML = '';

                data.jobMatchDetails.forEach(job => {
                    // Criar elemento de vaga
                    const jobElement = document.createElement('div');
                    jobElement.className = 'job-match-item';

                    // Título e URL
                    const jobHeader = document.createElement('div');
                    jobHeader.className = 'job-header';

                    const jobTitle = document.createElement('h4');
                    jobTitle.textContent = job.title || 'Vaga sem título';

                    const jobScore = document.createElement('span');
                    jobScore.className = 'job-score';
                    jobScore.textContent = `${job.score || 0}%`;

                    jobHeader.appendChild(jobTitle);
                    jobHeader.appendChild(jobScore);

                    // URL da vaga
                    if (job.url) {
                        const jobUrl = document.createElement('a');
                        jobUrl.href = job.url;
                        jobUrl.target = '_blank';
                        jobUrl.className = 'job-url';
                        jobUrl.textContent = 'Ver vaga original';
                        jobHeader.appendChild(jobUrl);
                    }

                    // Detalhes de correspondência
                    const jobDetails = document.createElement('div');
                    jobDetails.className = 'job-details';

                    // Adicionar habilidades correspondentes e faltantes
                    if (job.matchingSkills && job.matchingSkills.length) {
                        const matchingSkills = document.createElement('div');
                        matchingSkills.className = 'matching-skills';
                        matchingSkills.innerHTML = '<h5>Habilidades correspondentes:</h5>';

                        const skillsList = document.createElement('ul');
                        job.matchingSkills.forEach(skill => {
                            const skillItem = document.createElement('li');
                            skillItem.textContent = skill;
                            skillsList.appendChild(skillItem);
                        });

                        matchingSkills.appendChild(skillsList);
                        jobDetails.appendChild(matchingSkills);
                    }

                    if (job.missingSkills && job.missingSkills.length) {
                        const missingSkills = document.createElement('div');
                        missingSkills.className = 'missing-skills';
                        missingSkills.innerHTML = '<h5>Habilidades faltantes:</h5>';

                        const skillsList = document.createElement('ul');
                        job.missingSkills.forEach(skill => {
                            const skillItem = document.createElement('li');
                            skillItem.textContent = skill;
                            skillsList.appendChild(skillItem);
                        });

                        missingSkills.appendChild(skillsList);
                        jobDetails.appendChild(missingSkills);
                    }

                    // Feedback específico para esta vaga
                    if (job.feedback) {
                        const feedback = document.createElement('div');
                        feedback.className = 'job-feedback';
                        feedback.innerHTML = '<h5>Feedback:</h5>';
                        feedback.innerHTML += `<p>${job.feedback}</p>`;
                        jobDetails.appendChild(feedback);
                    }

                    // Adicionar elementos à vaga
                    jobElement.appendChild(jobHeader);
                    jobElement.appendChild(jobDetails);

                    // Adicionar vaga ao container
                    elements.jobMatchDetails.appendChild(jobElement);
                });
            }

            // Preencher análise estrutural
            if (elements.structuralScore && data.structuralAnalysis) {
                elements.structuralScore.textContent = `${data.structuralAnalysis.score || 0}%`;

                if (elements.structuralFeedback && data.structuralAnalysis.feedback) {
                    elements.structuralFeedback.textContent = data.structuralAnalysis.feedback;
                }
            }
        }

        // Preencher análise completa
        if (elements.fullAnalysis && data.fullAnalysis) {
            elements.fullAnalysis.textContent = data.fullAnalysis;
        }
    }
};

// Inicializar manipuladores de evento quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function () {
    // Inicializar manipuladores de formulário para todas as páginas
    apiIntegration.initFormHandlers();

    // Verificar se estamos na página de carregamento e iniciar monitoramento
    const urlParams = new URLSearchParams(window.location.search);
    const analysisId = urlParams.get('id');

    // Na página de carregamento, iniciar monitoramento
    if (window.location.pathname.includes('loading.html') && analysisId) {
        apiIntegration.monitorAnalysisStatus(analysisId);
    }

    // Na página de resultados, carregar resultados
    if (window.location.pathname.includes('results.html') && analysisId) {
        apiIntegration.loadAnalysisResults(analysisId);
    }
});
