// auth-optimized.js - Versão otimizada do sistema de autenticação
// destravaCV - Foco em performance e menor bundle size

console.log('🔐 Auth Optimized v1.0 carregado');

// Cache e configuração
const cache = new Map();
const config = {
    maxRetries: 50,
    retryDelay: 100,
    apiTimeout: 10000
};

// Utilitários otimizados
const utils = {
    // Debounce para evitar múltiplas chamadas
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle para limitação de taxa
    throttle: (func, limit) => {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Validação de email otimizada
    isValidEmail: email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),

    // Geração de headers otimizada
    getHeaders: (token = null) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    }
};

// Gerenciamento de API URL otimizado
class ApiManager {
    constructor() {
        this.baseUrl = null;
        this.isInitialized = false;
    }

    async getBaseUrl() {
        if (this.baseUrl) return this.baseUrl;

        // Fallback imediato baseado no hostname
        const hostname = window.location.hostname;
        const isDev = hostname === 'localhost' || hostname === '127.0.0.1';

        this.baseUrl = isDev ? 'http://localhost:3000' : '';

        // Tentar obter CONFIG se disponível
        if (window.CONFIG?.api?.baseUrl !== undefined) {
            this.baseUrl = window.CONFIG.api.baseUrl;
        }

        this.isInitialized = true;
        return this.baseUrl;
    }

    async request(endpoint, options = {}) {
        const baseUrl = await this.getBaseUrl();
        const url = `${baseUrl}/api/user${endpoint}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.apiTimeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Timeout na requisição');
            }
            throw error;
        }
    }
}

// Instância única do gerenciador de API
const apiManager = new ApiManager();

// Gerenciamento de autenticação otimizado
class AuthManager {
    constructor() {
        this.user = null;
        this.token = null;
        this.listeners = new Set();
        this.isInitialized = false;

        this.init();
    }

    init() {
        // Carregar dados do localStorage de forma síncrona
        this.loadFromStorage();

        // Configurar listeners de eventos
        this.setupEventListeners();

        this.isInitialized = true;
    }

    loadFromStorage() {
        try {
            this.token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');
            this.user = userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.warn('Erro ao carregar dados do localStorage:', error);
            this.clearAuth();
        }
    }

    setupEventListeners() {
        // Listener para mudanças no localStorage (múltiplas abas)
        window.addEventListener('storage', (e) => {
            if (e.key === 'token' || e.key === 'user') {
                this.loadFromStorage();
                this.notifyListeners();
            }
        });
    }

    // Salvar autenticação de forma otimizada
    saveAuth(token, user) {
        this.token = token;
        this.user = user;

        // Usar requestIdleCallback para não bloquear UI
        const saveToStorage = () => {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
        };

        if ('requestIdleCallback' in window) {
            requestIdleCallback(saveToStorage);
        } else {
            setTimeout(saveToStorage, 0);
        }

        this.notifyListeners();
    }

    clearAuth() {
        this.token = null;
        this.user = null;

        localStorage.removeItem('token');
        localStorage.removeItem('user');

        this.notifyListeners();
    }

    // Sistema de listeners otimizado
    addListener(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback({
                    authenticated: !!this.token,
                    user: this.user
                });
            } catch (error) {
                console.warn('Erro em listener de auth:', error);
            }
        });
    }

    // Métodos de autenticação otimizados
    async register(name, email, password) {
        if (!utils.isValidEmail(email)) {
            throw new Error('Email inválido');
        }

        const data = await apiManager.request('/register', {
            method: 'POST',
            headers: utils.getHeaders(),
            body: JSON.stringify({ name, email, password })
        });

        return data;
    }

    async login(email, password) {
        if (!utils.isValidEmail(email)) {
            throw new Error('Email inválido');
        }

        const data = await apiManager.request('/login', {
            method: 'POST',
            headers: utils.getHeaders(),
            body: JSON.stringify({ email, password })
        });

        // Buscar créditos em paralelo
        const creditsPromise = this.fetchCredits(data.token).catch(() => ({ credits: 0 }));
        const creditsData = await creditsPromise;

        data.user.credits = creditsData.credits;
        this.saveAuth(data.token, data.user);

        return data.user;
    }

    async fetchProfile() {
        if (!this.token) throw new Error('Não autenticado');

        const data = await apiManager.request('/profile', {
            headers: utils.getHeaders(this.token)
        });

        this.user = data;
        this.saveAuth(this.token, data);

        return data;
    }

    async fetchCredits(token = this.token) {
        if (!token) throw new Error('Token não disponível');

        // Cache de créditos por 30 segundos
        const cacheKey = `credits_${token.slice(-10)}`;
        const cached = cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < 30000) {
            return cached.data;
        }

        const data = await apiManager.request('/credits', {
            headers: utils.getHeaders(token)
        });

        cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });

        return data;
    }

    // Getters otimizados
    get isAuthenticated() {
        return !!this.token;
    }

    get currentUser() {
        return this.user;
    }

    get authToken() {
        return this.token;
    }
}

// Instância única do gerenciador de autenticação
const authManager = new AuthManager();

// API pública otimizada - mantém compatibilidade com código existente
window.authManager = authManager;

// Funções de compatibilidade (para não quebrar código existente)
window.saveAuth = (token, user) => authManager.saveAuth(token, user);
window.clearAuth = () => authManager.clearAuth();
window.getToken = () => authManager.authToken;
window.getUser = () => authManager.currentUser;
window.isAuthenticated = () => authManager.isAuthenticated;
window.registerUser = (name, email, password) => authManager.register(name, email, password);
window.loginUser = (email, password) => authManager.login(email, password);
window.fetchProfile = () => authManager.fetchProfile();
window.fetchUserCredits = (forceRefresh = false) => {
    if (forceRefresh) {
        const cacheKey = `credits_${authManager.authToken?.slice(-10)}`;
        cache.delete(cacheKey);
    }
    return authManager.fetchCredits();
};

// Função de logout otimizada
window.logout = () => {
    authManager.clearAuth();
    // Limpar cache
    cache.clear();
    // Redirecionar se necessário
    if (window.location.pathname !== '/landing.html' && window.location.pathname !== '/') {
        window.location.href = '/landing.html';
    }
};

// Cleanup de gift code otimizado
window.cleanupAllGiftCodeData = () => {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.toLowerCase().includes('gift')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
};

// Event listener para mudanças de autenticação (compatibilidade)
window.addEventListener('authChanged', (event) => {
    // Manter compatibilidade com código existente
    if (event.detail) {
        authManager.user = event.detail.user;
        authManager.token = event.detail.authenticated ? authManager.token : null;
    }
});

console.log('✅ Auth Optimized inicializado');

// Exportar para módulos ES6 se necessário
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { authManager, apiManager };
} 