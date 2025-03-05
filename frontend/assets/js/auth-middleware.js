(function() {
    const publicPages = [
        'login.html',
        'password-recovery.html',
        'password-reset.html',
        'terms.html',
        'privacy.html',
        'register.html'
    ];
    
    window.isAuthenticated = function() {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        return !!userData.token;
    };
    
    window.getUserData = function() {
        return JSON.parse(localStorage.getItem('userData') || '{}');
    };
    
    // Função para verificar token com o backend
    window.verifyTokenWithBackend = async function() {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        if (!userData.token) {
            return false;
        }
        
        try {
            // Verificar token com o backend
            const response = await fetch('/api/auth/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${userData.token}`
                }
            });
            
            if (!response.ok) {
                return false;
            }
            
            const data = await response.json();
            return data.authenticated === true;
        } catch (error) {
            console.error('Erro ao verificar token com o backend:', error);
            return false;
        }
    };
    
    window.logout = function() {
        // Get current page before logout
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        // Clear user data
        localStorage.removeItem('userData');
        localStorage.removeItem('userLoggedIn');
        
        // Redirect to login page with redirect parameter
        console.log('Redirecionando para login.html...');
        
        // Abordagem 1: window.open com _self (substitui a página atual)
        window.open(`login.html?redirect=${encodeURIComponent(currentPage)}`, '_self');
        
        // Abordagem 2: setTimeout como fallback
        setTimeout(() => {
            console.log('Fallback: usando location.href');
            window.location.href = `login.html?redirect=${encodeURIComponent(currentPage)}`;
        }, 500);
    };
    
    window.apiRequest = async function(url, options = {}) {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        if (userData.token) {
            options.headers = options.headers || {};
            options.headers['Authorization'] = `Bearer ${userData.token}`;
        }
        
        try {
            const response = await fetch(url, options);
            
            if (response.status === 401) {
                console.log('Token expirado ou inválido, deslogando usuário...');
                logout();
                return null;
            }
            
            return response;
        } catch (error) {
            console.error('Erro na requisição API:', error);
            throw error;
        }
    };
    
    async function checkAuth() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        if (publicPages.includes(currentPage)) {
            return;
        }
        
        if (!isAuthenticated()) {
            console.log('Usuário não autenticado. Redirecionando para login.html...');
            
            // Abordagem 1: window.open com _self (substitui a página atual)
            window.open(`login.html?redirect=${encodeURIComponent(currentPage)}`, '_self');
            
            // Abordagem 2: setTimeout como fallback
            setTimeout(() => {
                console.log('Fallback: usando location.href');
                window.location.href = `login.html?redirect=${encodeURIComponent(currentPage)}`;
            }, 500);
            return;
        }
        
        // Verificar token com o backend (apenas em ambiente de produção)
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' ||
                             window.location.protocol === 'file:';
        
        if (!isDevelopment) {
            try {
                const isValid = await verifyTokenWithBackend();
                if (!isValid) {
                    console.log('Token inválido. Redirecionando para login.html...');
                    logout();
                }
            } catch (error) {
                console.error('Erro ao verificar token:', error);
                // Em caso de erro na verificação, manter o usuário logado
                // para evitar problemas de conexão temporários
            }
        }
    }
    
    checkAuth();
})();
