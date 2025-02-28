// Lógica de análise do currículo
document.addEventListener('DOMContentLoaded', function() {
    // Elementos
    const analyzeButton = document.querySelector('.analyze-button');
    const jobLinkInputs = document.querySelectorAll('.job-link-input');
    
    // Estado
    let fileUploaded = false;
    
    // Escutar eventos de upload/remoção de arquivo
    document.addEventListener('fileUploaded', function() {
        fileUploaded = true;
    });
    
    document.addEventListener('fileRemoved', function() {
        fileUploaded = false;
    });
    
    // Botão de análise
    analyzeButton.addEventListener('click', function() {
        // Se não houver arquivo, alerta o usuário
        if (!fileUploaded) {
            alert('Por favor, selecione um currículo antes de continuar.');
            return;
        }
        
        // Coleta os links das vagas
        const jobLinks = Array.from(jobLinkInputs)
            .map(input => input.value)
            .filter(link => link.trim() !== '');
        
        // Aqui seria feita a integração com o backend para análise
        console.log('Links de vagas:', jobLinks);
        
        // Simulação de processamento
        analyzeButton.textContent = 'Analisando...';
        analyzeButton.disabled = true;
        
        // Obter o arquivo do formulário
        const fileInput = document.getElementById('hiddenFileInput');
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            alert('Erro: Arquivo não encontrado');
            analyzeButton.textContent = 'Analisar Currículo';
            analyzeButton.disabled = false;
            return;
        }

        const file = fileInput.files[0];
        
        // Criar FormData para enviar o arquivo e os links
        const formData = new FormData();
        formData.append('file', file);
        
        // Adicionar links de vagas
        jobLinks.forEach(link => {
            formData.append('job_links[]', link);
        });
        
        // Converter o arquivo para base64 e armazenar no localStorage
        const reader = new FileReader();
        reader.onload = function(e) {
            // Armazenar o arquivo e o nome no localStorage
            localStorage.setItem('uploadedFile', e.target.result);
            localStorage.setItem('fileName', file.name);
            
            // Armazenar os links das vagas no localStorage
            localStorage.setItem('jobLinks', JSON.stringify(jobLinks));
            
            // Mostrar tela de carregamento
            window.location.href = 'loading.html';
        };
        reader.readAsDataURL(file);
    });
});
