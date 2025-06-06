/**
 * file-processor.js
 * Responsável pelo processamento de arquivos e envio para análise
 */

document.addEventListener('DOMContentLoaded', function () {
    // Adicionar campo para link da vaga
    function addJobLinkField() {
        const jobLinksContainer = document.getElementById('jobLinksContainer');
        if (!jobLinksContainer) return;

        const currentCount = jobLinksContainer.querySelectorAll('input.job-link-input').length;
        if (currentCount >= 7) {
            alert('Você atingiu o limite máximo de 7 vagas para análise simultânea.');
            return;
        }

        // Criar novo campo de input padronizado
        const newLinkItem = document.createElement('div');
        newLinkItem.className = 'job-link-item';
        newLinkItem.style.display = 'flex';
        newLinkItem.style.alignItems = 'center';

        const newInput = document.createElement('input');
        newInput.type = 'url';
        newInput.className = 'job-link-input';
        newInput.placeholder = `https://linkdavaga.com`;

        // Adiciona apenas o input, sem estilos inline extras
        newLinkItem.appendChild(newInput);
        jobLinksContainer.appendChild(newLinkItem);

        // Dar foco ao novo campo
        newInput.focus();
    }

    // Inicializar os componentes da interface
    function initializeUI() {
        const addJobLinkBtn = document.getElementById('addJobLinkBtn');
        if (addJobLinkBtn) {
            addJobLinkBtn.addEventListener('click', addJobLinkField);
        }

        // Configurar o botão de análise
        setupAnalyzeButton();
    }



    // Configurar o botão de análise
    function setupAnalyzeButton() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (!analyzeBtn || analyzeBtn.hasAttribute('data-initialized')) return;

        // Marcar como inicializado para não adicionar eventos duplicados
        analyzeBtn.setAttribute('data-initialized', 'true');

        // Comportamento padrão - deixa o analisar.html controlar o estado do botão
        configureDefaultAnalyzeButton();
    }

    // Configurar comportamento padrão do botão de análise
    function configureDefaultAnalyzeButton() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (!analyzeBtn) return;

        analyzeBtn.addEventListener('click', function () {
            // Verificar autenticação
            if (!window.isAuthenticated || !window.isAuthenticated()) {
                const event = new Event('show-auth');
                document.dispatchEvent(event);
                return;
            }

            // Obter arquivo selecionado
            const selectedFile = document.querySelector('#fileInput').files[0];

            // Coletar links das vagas
            let jobLinks = [];
            document.querySelectorAll('.job-link-input').forEach(input => {
                if (input.value.trim()) {
                    jobLinks.push(input.value.trim());
                }
            });

            // Verificar erros e exibir feedback
            let msgDiv = ensureFeedbackElement();

            // Validação
            if (!selectedFile) {
                showErrorMessage('Selecione um currículo para análise.');
                return;
            }

            if (jobLinks.length === 0) {
                showErrorMessage('Informe pelo menos um link de vaga para análise.');
                return;
            }

            // Processar o arquivo selecionado
            processSelectedFile(selectedFile, jobLinks);
        });
    }

    // Garantir que existe um elemento para exibir feedback
    function ensureFeedbackElement() {
        let msgDiv = document.getElementById('stepFeedback');
        if (!msgDiv) {
            msgDiv = document.createElement('div');
            msgDiv.id = 'stepFeedback';
            msgDiv.style.color = '#c62828';
            msgDiv.style.fontWeight = 'bold';
            msgDiv.style.margin = '10px 0 0 0';

            const analyzeBtn = document.getElementById('analyzeBtn');
            if (analyzeBtn) {
                analyzeBtn.parentNode.insertBefore(msgDiv, analyzeBtn.nextSibling);
            }
        }
        msgDiv.textContent = '';
        return msgDiv;
    }

    // Exibir mensagem de erro
    function showErrorMessage(message) {
        const msgDiv = ensureFeedbackElement();
        msgDiv.style.color = '#c62828';
        msgDiv.textContent = message;
    }

    // Processar o arquivo selecionado
    function processSelectedFile(selectedFile, jobLinks) {
        const msgDiv = ensureFeedbackElement();
        msgDiv.style.color = '#583819';
        msgDiv.textContent = 'Lendo arquivo...';

        const reader = new FileReader();

        // Configurar o handler para quando o arquivo for carregado
        reader.onload = function (e) {
            const fileContentBase64 = e.target.result;
            try {
                // Salvar dados na sessionStorage
                sessionStorage.setItem('atsFile', selectedFile.name);
                sessionStorage.setItem('atsFileContent', fileContentBase64);
                sessionStorage.setItem('atsJobLinks', JSON.stringify(jobLinks));

                // Confirmação visual
                msgDiv.style.color = '#2e7d32';
                msgDiv.textContent = 'Dados salvos. Redirecionando para análise...';

                // Redirecionar após um breve atraso
                setTimeout(() => {
                    window.location.href = 'loading.html';
                }, 400);
            } catch (err) {
                console.error('Erro ao salvar dados:', err);
                showErrorMessage('Erro ao salvar dados para análise. Tente novamente.');
            }
        };

        // Configurar handler para erros de leitura
        reader.onerror = function () {
            console.error('Erro ao ler o arquivo');
            showErrorMessage('Erro ao ler o arquivo. Tente outro formato.');
        };

        // Iniciar a leitura do arquivo
        reader.readAsDataURL(selectedFile);
    }

    // Inicializar a interface
    initializeUI();
});
