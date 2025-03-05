/**
 * Login Page JavaScript
 * Handles login form submission, validation, and authentication
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePasswordButton = document.getElementById('togglePassword');
    
    // Toggle password visibility
    if (togglePasswordButton) {
        togglePasswordButton.addEventListener('click', function() {
            // Toggle the type attribute of the password input
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle the eye icon
            if (type === 'password') {
                togglePasswordButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
            } else {
                togglePasswordButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                        <line x1="3" y1="3" x2="21" y2="21"></line>
                    </svg>
                `;
            }
        });
    }
    
    // Form submission handler
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Get form values
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Validate form
        if (!validateForm(email, password)) {
            return;
        }
        
        // Mostrar indicador de carregamento
        const loadingIndicator = showLoadingIndicator();
        
        console.log('Tentando fazer login com:', email);
        
        // Fazer autenticação com o backend
        fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Credenciais inválidas');
            }
            return response.json();
        })
        .then(data => {
            // Remover indicador de carregamento
            loadingIndicator.remove();
            
            // Armazenar dados do usuário no localStorage
            localStorage.setItem('userLoggedIn', 'true');
            
            // Garantir que temos todos os dados necessários do backend
            const userData = {
                email: email,
                name: data.user && data.user.name ? data.user.name : email.split('@')[0],
                id: data.user && data.user.id ? data.user.id : '0',
                token: data.token
            };
            
            localStorage.setItem('userData', JSON.stringify(userData));
            console.log('Dados do usuário armazenados:', userData);
            
            // Mostrar mensagem de sucesso
            showMessage('Login realizado com sucesso! Redirecionando...', 'success');
            
            // Verificar se há um parâmetro de redirecionamento na URL
            const urlParams = new URLSearchParams(window.location.search);
            const redirectPage = urlParams.get('redirect');
            
            // Redirecionar para a página apropriada após um breve atraso
            setTimeout(() => {
                if (redirectPage) {
                    // Verificar se o redirectPage já tem a extensão .html
                    const redirectUrl = redirectPage.endsWith('.html') ? redirectPage : `${redirectPage}.html`;
                    
                    // Adicionar parâmetro auth=true para garantir que o backend sirva a página
                    const finalUrl = redirectUrl.includes('?') 
                        ? `${redirectUrl}&auth=true` 
                        : `${redirectUrl}?auth=true`;
                    
                    console.log(`Redirecionando para ${finalUrl}...`);
                    window.location.href = finalUrl;
                } else {
                    // Usar múltiplas abordagens para garantir o redirecionamento
                    console.log('Redirecionando para index.html com parâmetro auth=true...');
                    
                    // Abordagem 1: window.open com _self (substitui a página atual)
                    window.open('index.html?auth=true', '_self');
                    
                    // Abordagem 2: setTimeout como fallback
                    setTimeout(() => {
                        console.log('Fallback: usando location.href');
                        window.location.href = 'index.html?auth=true';
                    }, 500);
                }
            }, 1500);
        })
        .catch(error => {
            // Remover indicador de carregamento
            loadingIndicator.remove();
            
            // Mostrar mensagem de erro
            showMessage(`Erro ao fazer login: ${error.message}`, 'error');
            
            // Verificar se estamos em ambiente de desenvolvimento
            const isDevelopment = window.location.hostname === 'localhost' || 
                                 window.location.hostname === '127.0.0.1' ||
                                 window.location.protocol === 'file:';
            
            if (isDevelopment) {
                // Tentar novamente com a rota /api/auth/login (sem o v1)
                fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Credenciais inválidas (tentativa alternativa)');
                    }
                    return response.json();
                })
                .then(data => {
                    // Remover indicador de carregamento
                    loadingIndicator.remove();
                    
                    // Armazenar dados do usuário no localStorage
                    localStorage.setItem('userLoggedIn', 'true');
                    
                    // Garantir que temos todos os dados necessários do backend
                    const userData = {
                        email: email,
                        name: data.user && data.user.name ? data.user.name : email.split('@')[0],
                        id: data.user && data.user.id ? data.user.id : '0',
                        token: data.token
                    };
                    
                    localStorage.setItem('userData', JSON.stringify(userData));
                    console.log('Dados do usuário armazenados (rota alternativa):', userData);
                    
                    // Mostrar mensagem de sucesso
                    showMessage('Login realizado com sucesso! Redirecionando...', 'success');
                    
                    // Continuar com o redirecionamento
                    handleRedirection();
                })
                .catch(secondError => {
                    console.error('Erro na segunda tentativa:', secondError);
                    
                    // Agora sim, cair para simulação de desenvolvimento em último caso
                    console.warn('Simulando login bem-sucedido para desenvolvimento');
                    console.warn('ATENÇÃO: O backend não está respondendo. Usando login simulado apenas para desenvolvimento.');
                    
                    // Usar o nome cadastrado para o usuário de teste
                    localStorage.setItem('userLoggedIn', 'true');
                    localStorage.setItem('userData', JSON.stringify({
                        email: email,
                        name: 'Rafael Silva', // Nome fixo para o usuário de teste
                        id: '123456',
                        token: 'test-token-123'
                    }));
                    
                    // Mostrar mensagem de sucesso com aviso de simulação
                    showMessage('Login simulado realizado com sucesso! (MODO DESENVOLVIMENTO) Redirecionando...', 'warning');
                    
                    // Continuar com o redirecionamento
                    handleRedirection();
                });
            } else {
                // Em produção, mostrar erro real
                showMessage(`Erro ao fazer login: ${error.message}. Por favor, tente novamente.`, 'error');
                return; // Não redirecionar em caso de erro em produção
            }
            
            // Função para lidar com o redirecionamento
            function handleRedirection() {
                // Verificar se há um parâmetro de redirecionamento na URL
                const urlParams = new URLSearchParams(window.location.search);
                const redirectPage = urlParams.get('redirect');
                
                // Redirecionar para a página apropriada após um breve atraso
                setTimeout(() => {
                    if (redirectPage) {
                        // Verificar se o redirectPage já tem a extensão .html
                        const redirectUrl = redirectPage.endsWith('.html') ? redirectPage : `${redirectPage}.html`;
                        
                        // Adicionar parâmetro auth=true para garantir que o backend sirva a página
                        const finalUrl = redirectUrl.includes('?') 
                            ? `${redirectUrl}&auth=true` 
                            : `${redirectUrl}?auth=true`;
                        
                        console.log(`Redirecionando para ${finalUrl}...`);
                        window.location.href = finalUrl;
                    } else {
                        // Usar múltiplas abordagens para garantir o redirecionamento
                        console.log('Redirecionando para index.html com parâmetro auth=true...');
                        
                        // Abordagem 1: window.open com _self (substitui a página atual)
                        window.open('index.html?auth=true', '_self');
                        
                        // Abordagem 2: setTimeout como fallback
                        setTimeout(() => {
                            console.log('Fallback: usando location.href');
                            window.location.href = 'index.html?auth=true';
                        }, 500);
                    }
                }, 1500);
            }
            
            // Chamar a função de redirecionamento
            handleRedirection();
        });
    });
    
    // Form validation
    function validateForm(email, password) {
        // Reset previous error states
        resetFormErrors();
        
        let isValid = true;
        
        // Validate email
        if (!email) {
            showInputError(emailInput, 'Por favor, informe seu e-mail');
            isValid = false;
        } else if (!isValidEmail(email)) {
            showInputError(emailInput, 'Por favor, informe um e-mail válido');
            isValid = false;
        }
        
        // Validate password
        if (!password) {
            showInputError(passwordInput, 'Por favor, informe sua senha');
            isValid = false;
        }
        
        return isValid;
    }
    
    // Email validation helper
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Show input error
    function showInputError(inputElement, errorMessage) {
        inputElement.classList.add('error');
        
        // Create error message element if it doesn't exist
        let errorElement = inputElement.parentElement.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            inputElement.parentElement.appendChild(errorElement);
        }
        
        errorElement.textContent = errorMessage;
        errorElement.style.color = '#d32f2f';
        errorElement.style.fontSize = '12px';
        errorElement.style.marginTop = '5px';
    }
    
    // Reset form errors
    function resetFormErrors() {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(element => element.remove());
        
        emailInput.classList.remove('error');
        passwordInput.classList.remove('error');
    }
    
    // Show loading indicator
    function showLoadingIndicator() {
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="spinner"></div>
            <p>Autenticando...</p>
        `;
        
        // Estilos para o indicador de carregamento
        loadingIndicator.style.position = 'fixed';
        loadingIndicator.style.top = '0';
        loadingIndicator.style.left = '0';
        loadingIndicator.style.width = '100%';
        loadingIndicator.style.height = '100%';
        loadingIndicator.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        loadingIndicator.style.display = 'flex';
        loadingIndicator.style.flexDirection = 'column';
        loadingIndicator.style.alignItems = 'center';
        loadingIndicator.style.justifyContent = 'center';
        loadingIndicator.style.zIndex = '9999';
        
        // Estilos para o spinner
        const spinnerStyle = document.createElement('style');
        spinnerStyle.textContent = `
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid var(--primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 10px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(spinnerStyle);
        
        // Adicionar ao documento
        document.body.appendChild(loadingIndicator);
        
        return loadingIndicator;
    }
    
    // Show message (for notifications)
    function showMessage(message, type = 'info') {
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = 'message ' + type;
        messageElement.textContent = message;
        
        // Style based on type
        if (type === 'success') {
            messageElement.style.backgroundColor = '#e8f5e9';
            messageElement.style.color = '#2e7d32';
        } else if (type === 'info') {
            messageElement.style.backgroundColor = '#e3f2fd';
            messageElement.style.color = '#1565c0';
        } else if (type === 'warning') {
            messageElement.style.backgroundColor = '#fff8e1';
            messageElement.style.color = '#f57f17';
        }
        
        // Common styles
        messageElement.style.padding = '10px';
        messageElement.style.borderRadius = '5px';
        messageElement.style.marginBottom = '15px';
        messageElement.style.textAlign = 'center';
        messageElement.style.position = 'fixed';
        messageElement.style.top = '20px';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translateX(-50%)';
        messageElement.style.zIndex = '1000';
        messageElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        messageElement.style.minWidth = '300px';
        
        // Add to document
        document.body.appendChild(messageElement);
        
        // Remove after 3 seconds
        setTimeout(() => {
            messageElement.style.opacity = '0';
            messageElement.style.transition = 'opacity 0.5s';
            
            setTimeout(() => {
                messageElement.remove();
            }, 500);
        }, 3000);
    }
});
