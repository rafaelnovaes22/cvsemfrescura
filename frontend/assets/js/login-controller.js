// login-controller.js - Controle de autenticação e onboarding

document.addEventListener('DOMContentLoaded', function() {
    console.log('Login Controller inicializado');
    
    // 1. Configurar o botão de login para abrir o modal
    const loginLink = document.getElementById('loginLink');
    if (loginLink) {
        loginLink.style.display = 'inline-block';
        loginLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Botão de login clicado');
            const authModal = document.getElementById('authModal');
            if (authModal) {
                authModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        });
    }
    
    // 2. Verificar se o usuário está logado
    const user = window.auth && window.auth.getUser();
    
    // Comportamento personalizado baseado no estado de autenticação
    if (user) {
        console.log('Usuário já está logado:', user.name);
        
        // Atualizar interface para usuário logado
        const authButton = document.getElementById('authButton');
        if (authButton) {
            authButton.style.display = 'inline-flex';
        }
        
        if (loginLink) {
            loginLink.style.display = 'none';
        }
        
        // Verificar se o onboarding deve ser exibido
        setTimeout(() => {
            if (typeof initOnboarding === 'function') {
                console.log('Iniciando verificação de onboarding para usuário logado...');
                initOnboarding();
            }
        }, 1000);
    } else {
        console.log('Usuário não logado');
        
        // Esconder conteúdo que requer autenticação
        const authButton = document.getElementById('authButton');
        if (authButton) {
            authButton.style.display = 'none';
        }
        
        if (loginLink) {
            loginLink.style.display = 'inline-block';
        }
    }
    
    // 3. Sobrescrever a função authSuccess para incluir onboarding
    window.originalAuthSuccess = window.authSuccess || function() {};
    
    window.authSuccess = function() {
        console.log('Autenticação bem-sucedida! (versão melhorada)');
        
        // Chamar implementação original
        if (window.originalAuthSuccess !== window.authSuccess) {
            window.originalAuthSuccess();
        }
        
        // Mostrar conteúdo principal
        const mainContent = document.querySelector('.main-content');
        if (mainContent) mainContent.style.display = '';
        
        const footer = document.querySelector('footer');
        if (footer) footer.style.display = '';
        
        const logoContainer = document.querySelector('.logo-container');
        if (logoContainer) logoContainer.style.opacity = 1;
        
        // Esconder modal de autenticação
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.style.display = 'none';
        }
        
        document.body.style.overflow = '';
        
        // Atualizar UI do usuário
        if (typeof updateUserUI === 'function') {
            updateUserUI();
        }
        
        // Iniciar onboarding após login bem-sucedido
        setTimeout(() => {
            if (typeof initOnboarding === 'function') {
                console.log('Iniciando verificação de onboarding após login...');
                initOnboarding();
            }
        }, 500);
    };
    
    // 4. Adicionar botão para forçar exibição do onboarding (apenas para teste)
    const userMenuContainer = document.getElementById('userMenuContainer');
    if (userMenuContainer && window.auth && window.auth.getUser()) {
        const testButton = document.createElement('button');
        testButton.textContent = 'Testar Onboarding';
        testButton.style.marginLeft = '10px';
        testButton.style.padding = '8px 15px';
        testButton.style.background = '#583819';
        testButton.style.color = 'white';
        testButton.style.border = 'none';
        testButton.style.borderRadius = '5px';
        testButton.style.cursor = 'pointer';
        
        testButton.addEventListener('click', function() {
            console.log('Forçando exibição do onboarding para teste');
            const modal = document.getElementById('onboardingModal');
            if (modal) {
                modal.style.display = 'flex';
            } else {
                console.error('Modal de onboarding não encontrado');
            }
        });
        
        userMenuContainer.appendChild(testButton);
    }
});
