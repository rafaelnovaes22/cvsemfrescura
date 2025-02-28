// Gerenciamento de upload de arquivos
document.addEventListener('DOMContentLoaded', function() {
    // Elementos
    const dropzone = document.getElementById('dropzone');
    const uploadButton = document.querySelector('.upload-button');
    const selectedFile = document.getElementById('selectedFile');
    const fileName = document.querySelector('.file-name');
    const removeFileButton = document.querySelector('.remove-file');
    
    // Inicialmente esconde a seção de arquivo selecionado
    selectedFile.style.display = 'none';
    
    // Manipuladores de eventos para upload de arquivo
    uploadButton.addEventListener('click', function() {
        // Cria um input de arquivo invisível
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.pdf,.doc,.docx';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });
        
        // Aciona o clique no input
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    });
    
    // Também permite clicar na área inteira do dropzone
    dropzone.addEventListener('click', function(e) {
        if (e.target !== uploadButton) {
            uploadButton.click();
        }
    });
    
    // Eventos de arrastar e soltar
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropzone.classList.add('highlighted');
    }
    
    function unhighlight() {
        dropzone.classList.remove('highlighted');
    }
    
    // Manipular o drop de arquivo
    dropzone.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    
    // Função para processar o arquivo carregado
    function handleFileUpload(file) {
        // Verifica se o arquivo é PDF ou DOCX
        const fileType = file.name.split('.').pop().toLowerCase();
        if (!['pdf', 'doc', 'docx'].includes(fileType)) {
            alert('Por favor, carregue um arquivo PDF ou DOCX.');
            return;
        }
        
        // Atualiza o nome do arquivo na UI
        fileName.textContent = file.name;
        
        // Mostra a seção de arquivo selecionado
        selectedFile.style.display = 'flex';
        
        // Criar um input de arquivo oculto para o formulário
        let hiddenFileInput = document.getElementById('hiddenFileInput');
        if (!hiddenFileInput) {
            hiddenFileInput = document.createElement('input');
            hiddenFileInput.type = 'file';
            hiddenFileInput.id = 'hiddenFileInput';
            hiddenFileInput.style.display = 'none';
            document.body.appendChild(hiddenFileInput);
        }
        
        // Criar um objeto DataTransfer para definir o arquivo no input
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        hiddenFileInput.files = dataTransfer.files;
        
        console.log('Arquivo carregado:', file);
        
        // Dispara evento customizado para informar que um arquivo foi carregado
        const fileUploadedEvent = new CustomEvent('fileUploaded', { detail: file });
        document.dispatchEvent(fileUploadedEvent);
    }
    
    // Remover arquivo
    removeFileButton.addEventListener('click', function() {
        selectedFile.style.display = 'none';
        fileName.textContent = '';
        
        // Dispara evento customizado para informar que o arquivo foi removido
        const fileRemovedEvent = new CustomEvent('fileRemoved');
        document.dispatchEvent(fileRemovedEvent);
    });
});
