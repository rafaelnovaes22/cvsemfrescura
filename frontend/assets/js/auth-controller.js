/**
 * auth-controller.js
 * Controlador de autenticação para o CV Sem Frescura
 * Gerencia o fluxo de login, registro e verificação de token
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando controlador de autenticação');
    
    // Elementos do DOM
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');
    const authError = document.getElementById('authError');
    const authModal = document.getElementById('authModal');
    const closeModalBtn = document.getElementById('closeAuthModal');
    
    // Alternar entre formulários de login e registro
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            document.getElementById('authModalTitle').textContent = 'Cadastrar';
            authError.style.display = 'none';
        });
    }
    
    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
            document.getElementById('authModalTitle').textContent = 'Entrar';
            authError.style.display = 'none';
        });
    }
    
    // Fechar modal quando solicitado
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            authModal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }
    
    // Submissão do formulário de login
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            auth.loginUser(email, password)
                .then(function() {
                    authSuccess();
                })
                .catch(function(error) {
                    showAuthError(error.message || 'Erro ao fazer login', '#b22');
                });
        });
    }
    
    // Submissão do formulário de registro
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            
            auth.registerUser(name, email, password)
                .then(function() {
                    registerForm.reset();
                    loginForm.style.display = 'block';
                    document.getElementById('authModalTitle').textContent = 'Entrar';
                    showAuthError('Cadastro realizado! Faça login.', '#2a7a2a');
                })
                .catch(function(error) {
                    showAuthError(error.message || 'Erro ao cadastrar', '#b22');
                });
        });
    }
    
    // Exibir mensagem de erro na autenticação
    function showAuthError(message, color = '#b22') {
        if (authError) {
            authError.textContent = message;
            authError.style.color = color;
            authError.style.display = 'block';
        }
    }
    
    // Função para verificar autenticação e configurar UI adequadamente
    function checkAuthentication() {
        if (!auth.getToken()) {
            // Usuário não autenticado, mas não mostrar o modal automaticamente
            // Apenas configurar o botão de login para ser visível
            const loginLink = document.getElementById('loginLink');
            if (loginLink) {
                loginLink.style.display = 'inline-block';
            }

            const authButton = document.getElementById('authButton');
            if (authButton) {
                authButton.style.display = 'none';
            }
            
            // Não ocultar o conteúdo principal - permitir acesso anônimo
            const mainContent = document.querySelector('.main-content');
            if (mainContent) mainContent.style.display = '';
            
            const footer = document.querySelector('footer');
            if (footer) footer.style.display = '';
            
            // Garantir que o fundo não esteja fosco
            document.body.style.overflow = '';
            
            // Garantir que o modal esteja oculto
            if (authModal) {
                authModal.style.display = 'none';
            }

            // Remover qualquer efeito fosco do fundo
            const logoContainer = document.querySelector('.logo-container');
            if (logoContainer) logoContainer.style.opacity = 1;
        } else {
            // Usuário já autenticado
            authSuccess();
        }
    }
    
    // Função global para liberar a página após login bem-sucedido
    window.authSuccess = function() {
        // Exibir conteúdo principal
        const mainContent = document.querySelector('.main-content');
        if (mainContent) mainContent.style.display = '';
        
        const footer = document.querySelector('footer');
        if (footer) footer.style.display = '';
        
        const logoContainer = document.querySelector('.logo-container');
        if (logoContainer) logoContainer.style.opacity = 1;
        
        // Esconder modal de autenticação
        if (authModal) {
            authModal.style.display = 'none';
        }
        
        document.body.style.overflow = '';
        
        // Atualizar a UI do usuário
        if (typeof updateUserUI === 'function') {
            updateUserUI();
        }
        
        // Iniciar verificação de onboarding
        setTimeout(function() {
            if (typeof initOnboarding === 'function') {
                initOnboarding();
            }
        }, 500);
    };
    
    // Iniciar verificação de autenticação
    checkAuthentication();
    
    // Adicionar listener para evento de requisição de exibição de autenticação
    document.addEventListener('show-auth', function() {
        if (authModal) {
            authModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    });
});
