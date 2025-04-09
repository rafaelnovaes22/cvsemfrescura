/**
 * Auth Middleware
 * Gerencia autenticação e autorização de usuários
 * Nota: Autenticação parece estar desativada no sistema conforme comentários em index.html,
 * mas este arquivo é mantido como referência para implementação futura
 */

// Classe de serviço de autenticação
class AuthService {
    constructor() {
        this.tokenKey = 'auth_token';
        this.userKey = 'user_data';
    }

    /**
     * Salva o token JWT no localStorage
     * @param {String} token - Token JWT
     */
    setToken(token) {
        if (token) {
            localStorage.setItem(this.tokenKey, token);
        }
    }

    /**
     * Recupera o token JWT do localStorage
     * @returns {String|null} - Token JWT ou null
     */
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * Salva dados do usuário no localStorage
     * @param {Object} userData - Dados do usuário
     */
    setUser(userData) {
        if (userData) {
            localStorage.setItem(this.userKey, JSON.stringify(userData));
        }
    }

    /**
     * Recupera dados do usuário do localStorage
     * @returns {Object|null} - Dados do usuário ou null
     */
    getUser() {
        const userData = localStorage.getItem(this.userKey);
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Verifica se o usuário está autenticado
     * @returns {Boolean} - true se autenticado, false caso contrário
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Autentica o usuário com email e senha
     * @param {String} email - Email do usuário
     * @param {String} password - Senha do usuário
     * @returns {Promise<Object>} - Promessa que resolve com os dados do usuário
     */
    async login(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao fazer login');
            }

            // Armazenar token e dados do usuário
            this.setToken(data.token);
            this.setUser(data.user);

            return data;
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            throw error;
        }
    }

    /**
     * Registra um novo usuário
     * @param {Object} userData - Dados do usuário (nome, email, senha)
     * @returns {Promise<Object>} - Promessa que resolve com os dados do usuário
     */
    async register(userData) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao registrar usuário');
            }

            // Armazenar token e dados do usuário se registro com login automático
            if (data.token) {
                this.setToken(data.token);
                this.setUser(data.user);
            }

            return data;
        } catch (error) {
            console.error('Erro ao registrar usuário:', error);
            throw error;
        }
    }

    /**
     * Faz logout do usuário
     */
    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        
        // Redirecionar para página inicial ou login
        // Comentado pois autenticação parece estar desativada
        // window.location.href = 'index.html';
    }

    /**
     * Adiciona o token de autorização ao cabeçalho de uma requisição fetch
     * @param {Object} options - Opções do fetch
     * @returns {Object} - Opções com cabeçalho de autorização
     */
    addAuthHeader(options = {}) {
        const token = this.getToken();
        if (!token) return options;

        const headers = options.headers || {};
        return {
            ...options,
            headers: {
                ...headers,
                'Authorization': `Bearer ${token}`
            }
        };
    }
}

// Criar instância global do serviço de autenticação
window.authService = new AuthService();

// Função global para verificar autenticação
window.isAuthenticated = function() {
    return window.authService.isAuthenticated();
};

// Função para atualizar elementos da UI baseado no estado de autenticação
window.updateAuthUI = function() {
    const isAuthed = window.isAuthenticated();
    const user = window.authService.getUser();
    
    // Elementos de UI que podem existir em diferentes páginas
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const logoutLink = document.getElementById('logoutLink');
    const userGreeting = document.getElementById('userGreeting');
    const userMenuContainer = document.getElementById('userMenuContainer');
    const authButton = document.getElementById('authButton');
    const userDropdown = document.getElementById('userDropdown');
    
    // Atualizar elementos conforme autenticação
    if (isAuthed && user) {
        // Usuário autenticado
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'block';
        if (userGreeting) {
            userGreeting.textContent = `Olá, ${user.name || user.email}`;
            userGreeting.style.display = 'block';
        }
        if (authButton) {
            authButton.textContent = user.name || user.email;
            authButton.classList.add('logged-in');
        }
    } else {
        // Usuário não autenticado
        if (loginLink) loginLink.style.display = 'inline-block';
        if (registerLink) registerLink.style.display = 'inline-block';
        if (logoutLink) logoutLink.style.display = 'none';
        if (userGreeting) userGreeting.style.display = 'none';
        if (authButton) {
            authButton.textContent = 'Entrar';
            authButton.classList.remove('logged-in');
        }
    }
};

// Inicializar elementos de autenticação quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    // Atualizar UI
    if (typeof window.updateAuthUI === 'function') {
        window.updateAuthUI();
    }
    
    // Adicionar event listeners para elementos de autenticação
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.authService.logout();
            window.updateAuthUI();
        });
    }
});
