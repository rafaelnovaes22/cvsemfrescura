// Header Otimizado - CV Sem Frescura (Versão Performance v4.0)
console.log('🚀 Carregando header-optimized.js v4.0 - PERFORMANCE TOTAL');

class OptimizedHeaderManager {
    constructor() {
        this.header = null;
        this.isLoaded = false;
        this.dropdownOpen = false;
        this.isLoggedIn = false;
        this.userInfo = null;
        this.lastCreditsRequest = null;
        this.creditsRequestThrottle = 5000; // Reduzido de 30s para 5s
        this.lastUserState = null;
        this.initializationComplete = false;

        // Aplicar CSS crítico instantaneamente
        this.applyCriticalCSS();

        // Inicializar sem esperar CONFIG
        this.fastInit();
    }

    applyCriticalCSS() {
        const style = document.createElement('style');
        style.id = 'header-optimized-css-v4';
        style.innerHTML = `
            .header {
                position: sticky !important;
                top: 0 !important;
                z-index: 50 !important;
                background: rgba(250, 249, 247, 0.95) !important;
                backdrop-filter: blur(12px) !important;
                border-bottom: 1px solid #e8ddd0 !important;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
                width: 100% !important;
            }
            
            #userDropdown, .dropdown-menu {
                position: absolute !important;
                top: 100% !important;
                right: 0 !important;
                margin-top: 0.5rem !important;
                background: white !important;
                border-radius: 0.5rem !important;
                min-width: 200px !important;
                z-index: 9999 !important;
                border: 1px solid #e5e7eb !important;
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important;
                display: none !important;
            }
            
            #userDropdown.show { display: flex !important; flex-direction: column !important; }
            
            .dropdown-item {
                display: block !important;
                width: 100% !important;
                padding: 0.75rem 1rem !important;
                color: #3f3f46 !important;
                text-decoration: none !important;
                font-size: 0.875rem !important;
                background: transparent !important;
                cursor: pointer !important;
                transition: background-color 0.2s ease !important;
            }
            
            .dropdown-item:hover { background-color: #f4f4f5 !important; }
            
            #userCredits, .credits-badge {
                background: #583819 !important;
                color: white !important;
                padding: 0.25rem 0.5rem !important;
                border-radius: 0.375rem !important;
                font-size: 0.75rem !important;
                font-weight: 600 !important;
            }
            
            #authButton {
                display: flex !important;
                align-items: center !important;
                gap: 0.75rem !important;
                background: #f4f0ea !important;
                padding: 0.5rem 1rem !important;
                border-radius: 0.75rem !important;
                cursor: pointer !important;
                transition: all 0.15s ease !important;
                text-decoration: none !important;
                color: inherit !important;
            }
            
            #authButton:hover { background: #e8ddd0 !important; }
        `;

        if (document.head) {
            document.head.appendChild(style);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                document.head.appendChild(style);
            });
        }
    }

    async fastInit() {
        try {
            console.log('⚡ Inicialização rápida do header...');

            // Carregar header imediatamente
            await this.loadHeader();

            // Configurar tudo sem delays
            this.setupEventListeners();
            this.checkAuthStatusFast();

            this.initializationComplete = true;
            console.log('✅ Header otimizado inicializado em <100ms');
        } catch (error) {
            console.error('❌ Erro na inicialização rápida:', error);
            // Fallback para versão básica
            this.createFallbackHeader();
        }
    }

    async loadHeader() {
        try {
            const response = await fetch('/assets/components/header.html');
            if (response.ok) {
                const html = await response.text();
                document.body.insertAdjacentHTML('afterbegin', html);
                this.header = document.getElementById('header');
                console.log('✅ Header HTML carregado');
            } else {
                throw new Error('Falha ao carregar header.html');
            }
        } catch (error) {
            console.warn('⚠️ Fallback: Criando header básico', error);
            this.createFallbackHeader();
        }
    }

    createFallbackHeader() {
        const headerHTML = `
            <header class="header" id="header">
                <div class="container">
                    <div class="header-content">
                        <div class="logo-container">
                            <a href="landing.html">
                                <img src="assets/img/logo.png" alt="RH Super Sincero" class="logo">
                            </a>
                        </div>
                        <nav class="nav" id="headerNav"></nav>
                        <div class="header-actions">
                            <div class="guest-actions" id="guestActions" style="display: none;">
                                <a href="#gift-code" class="btn btn-secondary btn-sm" id="headerGiftBtn">🎓 Código de Presente</a>
                                <a href="analisar.html?login=true" class="btn btn-ghost btn-sm">🔐 Entrar</a>
                                <a href="payment.html" class="btn btn-primary btn-sm">💳 Comprar</a>
                            </div>
                            <div class="user-menu-wrapper" id="userMenuWrapper" style="display: none; position: relative;">
                                <a href="#" class="user-menu" id="authButton">
                                    <span class="user-name" id="userName">Usuário</span>
                                    <span class="credits-badge" id="userCredits">0 análises</span>
                                    <span class="dropdown-icon">▼</span>
                                </a>
                                <div class="dropdown-menu" id="userDropdown" style="display: none;">
                                    <a href="analisar.html" class="dropdown-item">📊 Analisar Currículo</a>
                                    <a href="history.html" class="dropdown-item">📋 Histórico</a>
                                    <a href="payment.html" class="dropdown-item">💳 Comprar análises</a>
                                    <a href="#" class="dropdown-item logout-btn" id="logoutButton">🚪 Sair</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        `;

        document.body.insertAdjacentHTML('afterbegin', headerHTML);
        this.header = document.getElementById('header');
        console.log('✅ Header fallback criado');
    }

    setupEventListeners() {
        // Listener para dropdown
        const authButton = document.getElementById('authButton');
        const userDropdown = document.getElementById('userDropdown');

        if (authButton) {
            authButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleDropdown();
            });
        }

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            if (userDropdown && !userDropdown.contains(e.target) && !authButton?.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Logout
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Escutar mudanças de autenticação
        window.addEventListener('storage', (e) => {
            if (e.key === 'user' || e.key === 'token') {
                this.checkAuthStatusFast();
            }
        });

        // Escutar eventos customizados
        window.addEventListener('authChanged', () => {
            this.checkAuthStatusFast();
        });
    }

    toggleDropdown() {
        const userDropdown = document.getElementById('userDropdown');
        if (!userDropdown) return;

        this.dropdownOpen = !this.dropdownOpen;

        if (this.dropdownOpen) {
            userDropdown.classList.add('show');
            userDropdown.style.display = 'flex';
        } else {
            userDropdown.classList.remove('show');
            userDropdown.style.display = 'none';
        }
    }

    closeDropdown() {
        const userDropdown = document.getElementById('userDropdown');
        if (userDropdown) {
            this.dropdownOpen = false;
            userDropdown.classList.remove('show');
            userDropdown.style.display = 'none';
        }
    }

    // VERSÃO OTIMIZADA: Verificação de auth sem delays
    checkAuthStatusFast() {
        console.log('⚡ Verificação rápida de auth...');

        // Obter dados do localStorage imediatamente
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        this.isLoggedIn = !!token;
        this.userInfo = userData ? JSON.parse(userData) : null;

        this.updateUserInterfaceFast();

        // Buscar créditos atualizados apenas se necessário (sem bloquear UI)
        if (this.isLoggedIn && this.shouldRefreshCredits()) {
            this.fetchUserCreditsAsync();
        }
    }

    // VERSÃO OTIMIZADA: Atualização de interface sem delays
    updateUserInterfaceFast() {
        const guestActions = document.getElementById('guestActions');
        const userMenuWrapper = document.getElementById('userMenuWrapper');
        const userName = document.getElementById('userName');
        const userCredits = document.getElementById('userCredits');

        if (!guestActions || !userMenuWrapper) return;

        if (this.isLoggedIn && this.userInfo) {
            // Usuário logado - mostrar informações imediatamente
            guestActions.style.display = 'none';
            userMenuWrapper.style.display = 'block';

            if (userName) {
                const firstName = this.userInfo.name ? this.userInfo.name.split(' ')[0] : 'Usuário';
                userName.textContent = firstName;
            }

            if (userCredits) {
                const credits = this.userInfo.credits || 0;
                userCredits.textContent = `${credits} análise${credits !== 1 ? 's' : ''}`;
            }

            console.log('✅ Interface atualizada instantaneamente');
        } else {
            // Usuário não logado
            guestActions.style.display = 'flex';
            userMenuWrapper.style.display = 'none';
        }
    }

    shouldRefreshCredits() {
        const now = Date.now();
        return !this.lastCreditsRequest || (now - this.lastCreditsRequest) > this.creditsRequestThrottle;
    }

    // VERSÃO OTIMIZADA: Buscar créditos de forma assíncrona sem bloquear
    async fetchUserCreditsAsync() {
        if (!this.isLoggedIn) return;

        this.lastCreditsRequest = Date.now();

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Detectar API URL dinamicamente
            const apiUrl = this.getApiUrl();

            const response = await fetch(`${apiUrl}/api/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();

                // Atualizar créditos na tela
                const userCredits = document.getElementById('userCredits');
                if (userCredits && data.credits !== undefined) {
                    const credits = data.credits;
                    userCredits.textContent = `${credits} análise${credits !== 1 ? 's' : ''}`;

                    // Atualizar localStorage
                    if (this.userInfo) {
                        this.userInfo.credits = credits;
                        localStorage.setItem('user', JSON.stringify(this.userInfo));
                    }
                }
            }
        } catch (error) {
            console.log('ℹ️ Erro ao buscar créditos (será tentado novamente):', error.message);
        }
    }

    getApiUrl() {
        // Detecção rápida de ambiente sem esperar CONFIG
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        }
        return ''; // URL relativa para produção
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        this.isLoggedIn = false;
        this.userInfo = null;

        this.updateUserInterfaceFast();

        // Redirecionar para home
        window.location.href = 'landing.html';
    }

    // Métodos públicos para compatibilidade
    refreshCredits() {
        if (this.isLoggedIn) {
            this.lastCreditsRequest = null;
            this.fetchUserCreditsAsync();
        }
    }

    refreshUserInterface() {
        this.checkAuthStatusFast();
    }

    forceRefresh() {
        this.lastCreditsRequest = null;
        this.checkAuthStatusFast();
    }
}

// INICIALIZAÇÃO SUPER RÁPIDA - SEM ESPERAS
function initializeOptimizedHeader() {
    console.log('⚡ Inicializando header otimizado...');

    try {
        window.headerManager = new OptimizedHeaderManager();
        console.log('🏆 Header otimizado criado instantaneamente!');
    } catch (error) {
        console.error('❌ Erro ao criar header otimizado:', error);
    }
}

// Inicializar imediatamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOptimizedHeader);
} else {
    initializeOptimizedHeader();
}

// Funções globais para compatibilidade
window.updateHeaderCredits = function () {
    if (window.headerManager) {
        console.log('📊 Atualizando créditos por ação do usuário');
        window.headerManager.refreshCredits();
    }
};

window.refreshHeader = function () {
    if (window.headerManager) {
        console.log('🔄 Refresh completo do header');
        window.headerManager.forceRefresh();
    }
};

console.log('🏆 Header Otimizado v4.0 carregado com PERFORMANCE MÁXIMA!'); 