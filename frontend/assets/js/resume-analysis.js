/**
 * Resume Analysis - Script para manipulação da interface de upload e análise de currículo
 */
document.addEventListener('DOMContentLoaded', function () {
    // Elementos do formulário
    const fileUploadContainer = document.getElementById('fileUploadContainer');
    const resumeFileInput = document.getElementById('resumeFile');
    const selectedFileContainer = document.getElementById('selectedFile');
    const selectedFileName = document.getElementById('selectedFileName');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const uploadButton = document.querySelector('.upload-button');
    const resumeForm = document.getElementById('resumeForm');
    const submitBtn = document.getElementById('submitBtn');
    const progressContainer = document.getElementById('progressContainer');
    const jobLinksContainer = document.getElementById('jobLinksContainer');

    // Flag para controlar se há um arquivo selecionado
    let fileSelected = false;

    // Inicializar o formulário
    function init() {
        // Event listeners para drag and drop
        if (fileUploadContainer) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                fileUploadContainer.addEventListener(eventName, preventDefaults, false);
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                fileUploadContainer.addEventListener(eventName, highlight, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                fileUploadContainer.addEventListener(eventName, unhighlight, false);
            });

            fileUploadContainer.addEventListener('drop', handleDrop, false);
        }

        // Event listener para selecionar arquivo via clique
        if (uploadButton && resumeFileInput) {
            uploadButton.addEventListener('click', () => {
                resumeFileInput.click();
            });
        }

        // Event listener para mudança no input de arquivo
        if (resumeFileInput) {
            resumeFileInput.addEventListener('change', handleFileSelect);
        }

        // Event listener para remover arquivo
        if (removeFileBtn) {
            removeFileBtn.addEventListener('click', removeFile);
        }
    }

    // Funções auxiliares para drag and drop
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        fileUploadContainer.classList.add('highlight');
    }

    function unhighlight() {
        fileUploadContainer.classList.remove('highlight');
    }

    // Manipulador para quando um arquivo é arrastado e solto
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            resumeFileInput.files = files;
            handleFileSelect();
        }
    }

    // Manipulador para quando um arquivo é selecionado
    function handleFileSelect() {
        if (resumeFileInput.files.length > 0) {
            const file = resumeFileInput.files[0];

            // Verificar o tipo de arquivo
            const validTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            if (!validTypes.includes(file.type)) {
                alert('Por favor, selecione um arquivo PDF, DOC ou DOCX.');
                resumeFileInput.value = '';
                return;
            }

            // Mostrar o nome do arquivo selecionado
            selectedFileName.textContent = file.name;
            selectedFileContainer.style.display = 'flex';
            fileSelected = true;

            // Habilitar botão de submissão
            if (submitBtn) {
                submitBtn.disabled = false;
            }
        }
    }

    // Função para remover o arquivo selecionado
    function removeFile(e) {
        e.preventDefault();
        resumeFileInput.value = '';
        selectedFileName.textContent = '';
        selectedFileContainer.style.display = 'none';
        fileUploadContainer.style.display = 'flex';
        fileSelected = false;

        // Desabilitar botão de submissão se nenhum arquivo estiver selecionado
        if (submitBtn) {
            submitBtn.disabled = true;
        }
    }

    // Inicializar
    init();
});
