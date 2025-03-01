/**
 * Login Page JavaScript
 * Handles login form submission, validation, and authentication
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const customGoogleLoginBtn = document.getElementById('customGoogleLogin');
    const linkedinLoginBtn = document.getElementById('linkedinLogin');
    
    // Check if user is already logged in
    if (localStorage.getItem('userLoggedIn')) {
        // Redirect to index page or dashboard
        window.location.href = 'index.html';
    }
    
    // Verificar se há um código de autorização do LinkedIn na URL
    checkLinkedInAuthCode();
    
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
        
        // Attempt login
        attemptLogin(email, password);
    });
    
    // Google login handler
    function initGoogleLogin() {
        // Usar o Client ID diretamente do .env
        const googleClientId = '434600326788-i1n2d887lan7q4jrmv7752oj057pkucm.apps.googleusercontent.com';
        
        // Inicializar o Google Sign-In API com configuração simplificada
        google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            // Configurações mínimas para evitar problemas
            auto_select: false,
            cancel_on_tap_outside: true
        });
        
        console.log('Google Sign-In API inicializado com sucesso (configuração simplificada)');
    }
    
    // Função para gerar um nonce para segurança
    function generateNonce() {
        const nonceBytes = new Uint8Array(16);
        window.crypto.getRandomValues(nonceBytes);
        return Array.from(nonceBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    // Callback para resposta do Google
    function handleGoogleCredentialResponse(response) {
        // Mostrar indicador de carregamento
        const loadingIndicator = showLoadingIndicator();
        
        // Enviar o token para o backend para verificação
        fetch('http://localhost:5000/api/auth/google', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: response.credential })
        })
        .then(response => {
            // Remover indicador de carregamento
            loadingIndicator.remove();
            
            if (!response.ok) {
                throw new Error('Falha na autenticação com Google');
            }
            return response.json();
        })
        .then(data => {
            // Login bem-sucedido
            loginSuccess({
                email: data.user.email,
                name: data.user.name,
                id: data.user.id,
                provider: 'google',
                picture: data.user.picture,
                token: data.access_token
            });
        })
        .catch(error => {
            console.error('Erro na autenticação com Google:', error);
            showLoginError('Falha na autenticação com Google. Por favor, tente novamente.');
        });
    }
    
    // Função para decodificar token JWT
    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Erro ao decodificar token JWT:', e);
            return null;
        }
    }
    
    // LinkedIn login handler
    linkedinLoginBtn.addEventListener('click', function() {
        try {
            // Em um ambiente de produção, isso seria substituído pela autenticação real com LinkedIn
            // Para fins de demonstração, vamos mostrar como seria o fluxo de erro
            
            // Mostrar indicador de carregamento
            const loadingIndicator = showLoadingIndicator();
            
            // Simular uma tentativa de autenticação
            setTimeout(() => {
                // Remover indicador de carregamento
                loadingIndicator.remove();
                
                // Decidir aleatoriamente se o login será bem-sucedido ou falhará
                const loginSuccessful = Math.random() > 0.5;
                
                if (loginSuccessful) {
                    // Simular dados do usuário para login bem-sucedido
                    const userData = {
                        email: 'demo.linkedin@rhsuper.com',
                        name: 'Usuário LinkedIn Demo',
                        id: 'linkedin_12345',
                        provider: 'linkedin',
                        picture: null
                    };
                    
                    loginSuccess(userData);
                } else {
                    // Simular falha na autenticação
                    console.log('Simulando falha na autenticação com LinkedIn');
                    showSocialLoginError('linkedin');
                }
            }, 1500);
        } catch (error) {
            console.error('Erro ao iniciar autenticação LinkedIn:', error);
            showSocialLoginError('linkedin');
        }
        
        /* Código original comentado - descomente e configure para uso real
        // URL atual para redirecionamento após autenticação
        const redirectUri = window.location.href;
        
        // Configurar parâmetros de autenticação do LinkedIn
        const authUrl = 'https://www.linkedin.com/oauth/v2/authorization';
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: 'YOUR_LINKEDIN_API_KEY', // Substitua pela sua API Key do LinkedIn
            redirect_uri: redirectUri,
            scope: 'r_liteprofile r_emailaddress',
            state: generateRandomState() // Função para gerar um estado aleatório para segurança
        });
        
        // Armazenar o estado para verificação posterior
        localStorage.setItem('linkedin_auth_state', params.get('state'));
        
        // Redirecionar para a página de autenticação do LinkedIn
        window.location.href = `${authUrl}?${params.toString()}`;
        */
    });
    
    // Função para gerar um estado aleatório para segurança CSRF
    function generateRandomState() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }
    
    // Verificar se há um código de autorização do LinkedIn na URL (após redirecionamento)
    function checkLinkedInAuthCode() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (code && state) {
            // Verificar se o estado corresponde ao armazenado (proteção contra CSRF)
            const storedState = localStorage.getItem('linkedin_auth_state');
            
            if (state !== storedState) {
                showLoginError('Erro de segurança na autenticação com LinkedIn. Por favor, tente novamente.');
                return;
            }
            
            // Limpar o estado armazenado
            localStorage.removeItem('linkedin_auth_state');
            
            // Mostrar indicador de carregamento
            const loadingIndicator = showLoadingIndicator();
            
            // Enviar o código para o backend para troca por um token de acesso
            fetch('http://localhost:5000/api/auth/linkedin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    code: code,
                    redirect_uri: window.location.origin + window.location.pathname
                })
            })
            .then(response => {
                // Remover indicador de carregamento
                loadingIndicator.remove();
                
                if (!response.ok) {
                    throw new Error('Falha na autenticação com LinkedIn');
                }
                return response.json();
            })
            .then(data => {
                // Login bem-sucedido
                loginSuccess({
                    email: data.user.email,
                    name: data.user.name,
                    id: data.user.id,
                    provider: 'linkedin',
                    token: data.access_token
                });
                
                // Limpar os parâmetros da URL
                window.history.replaceState({}, document.title, window.location.pathname);
            })
            .catch(error => {
                console.error('Erro na autenticação com LinkedIn:', error);
                showLoginError('Falha na autenticação com LinkedIn. Por favor, tente novamente.');
                
                // Limpar os parâmetros da URL
                window.history.replaceState({}, document.title, window.location.pathname);
            });
        }
    }
    
    // Event listener para o botão customizado do Google
    customGoogleLoginBtn.addEventListener('click', function() {
        try {
            // Verificar se o Google Sign-In API está carregado
            if (typeof google !== 'undefined' && google.accounts) {
                // Iniciar o fluxo de autenticação do Google
                google.accounts.id.prompt();
                
                // Configurar um timeout para detectar falhas
                setTimeout(() => {
                    // Se após 5 segundos não houver resposta, mostrar erro
                    if (!document.querySelector('.loading-indicator')) {
                        console.log('Erro: Timeout na autenticação com Google');
                        showSocialLoginError('google');
                    }
                }, 5000);
            } else {
                // Erro quando a API do Google não está disponível
                console.log('Erro: API do Google não disponível');
                showSocialLoginError('google');
            }
        } catch (error) {
            console.error('Erro ao iniciar autenticação Google:', error);
            showSocialLoginError('google');
        }
    });
    
    // Função para mostrar erro de login social
    function showSocialLoginError(provider) {
        let providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
        
        // Remover qualquer indicador de carregamento existente
        const existingIndicator = document.querySelector('.loading-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Mostrar mensagem de erro
        showLoginError(`Falha na autenticação com ${providerName}. Por favor, tente novamente ou use outro método de login.`);
    }
    
    // Inicializar login do Google quando o script estiver carregado
    if (typeof google !== 'undefined' && google.accounts) {
        initGoogleLogin();
    } else {
        // Se o script do Google ainda não estiver carregado, aguardar
        window.onGoogleLibraryLoad = initGoogleLogin;
    }
    
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
        } else if (password.length < 6) {
            showInputError(passwordInput, 'A senha deve ter pelo menos 6 caracteres');
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
    
    // Attempt login
    function attemptLogin(email, password) {
        // Mostrar indicador de carregamento
        const loadingIndicator = showLoadingIndicator();
        
        // Fazer requisição para a API de autenticação
        fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => {
            // Remover indicador de carregamento
            loadingIndicator.remove();
            
            if (!response.ok) {
                throw new Error('Falha na autenticação');
            }
            return response.json();
        })
        .then(data => {
            // Login bem-sucedido
            const userData = {
                email: data.user.email,
                name: data.user.name,
                id: data.user.id,
                token: data.access_token
            };
            
            loginSuccess(userData);
        })
        .catch(error => {
            console.error('Erro ao fazer login:', error);
            showLoginError('E-mail ou senha incorretos. Por favor, tente novamente.');
        });
    }
    
    // Mostrar indicador de carregamento
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
    
    // Simulate social login
    function simulateSocialLogin(provider) {
        // In a real application, this would handle the OAuth flow
        // For demo purposes, we'll simulate a successful login
        
        setTimeout(() => {
            loginSuccess({
                email: 'social@rhsuper.com',
                name: 'Usuário ' + provider.charAt(0).toUpperCase() + provider.slice(1),
                id: provider + '_12345',
                provider: provider
            });
        }, 1000);
    }
    
    // Login success handler
    function loginSuccess(userData) {
        // Store user data in localStorage (in a real app, you'd use secure cookies or tokens)
        localStorage.setItem('userLoggedIn', 'true');
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Show success message
        showMessage('Login realizado com sucesso! Redirecionando...', 'success');
        
        // Redirect to index page or dashboard after a short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
    
    // Show login error
    function showLoginError(message) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'login-error';
        errorContainer.textContent = message;
        errorContainer.style.backgroundColor = '#ffebee';
        errorContainer.style.color = '#d32f2f';
        errorContainer.style.padding = '10px';
        errorContainer.style.borderRadius = '5px';
        errorContainer.style.marginBottom = '15px';
        errorContainer.style.textAlign = 'center';
        
        // Insert at the top of the form
        loginForm.insertBefore(errorContainer, loginForm.firstChild);
        
        // Remove after 5 seconds
        setTimeout(() => {
            errorContainer.remove();
        }, 5000);
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
    
    // Handle "Forgot Password" link
    document.querySelector('.forgot-password').addEventListener('click', function(e) {
        e.preventDefault();
        
        // In a real application, this would redirect to a password reset page
        // For now, we'll just show a message
        showMessage('Funcionalidade de recuperação de senha não implementada nesta versão de demonstração.', 'info');
    });
    
    // Handle "Register" link
    document.querySelector('.register-link').addEventListener('click', function(e) {
        e.preventDefault();
        
        // In a real application, this would redirect to a registration page
        // For now, we'll just show a message
        showMessage('Funcionalidade de cadastro não implementada nesta versão de demonstração.', 'info');
    });
});
