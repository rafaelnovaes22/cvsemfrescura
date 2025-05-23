// Header Padronizado - CV Sem Frescura
class HeaderManager {
    constructor() {
        this.header = null;
        this.isLoaded = false;
        this.dropdownOpen = false;
        this.lastCreditsRequest = null;
        this.isLoggedIn = false;
        this.userInfo = null;
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Iniciando header manager...');

            // Verificar se CSS foi carregado, senão criar fallback
            await this.ensureHeaderCSS();
            console.log('✅ CSS do header verificado');

            // Carregar header HTML
            await this.loadHeader();
            console.log('✅ HTML do header carregado');

            // Aguardar um pouco para o DOM processar
            setTimeout(() => {
                // Verificar autenticação
                this.checkAuthStatus();

                // Configurar event listeners
                this.setupEventListeners();

                console.log('✅ Header inicializado com sucesso na página:', window.location.pathname);
            }, 100);
        } catch (error) {
            console.error('❌ Erro ao inicializar header:', error);
        }
    }

    async ensureHeaderCSS() {
        return new Promise((resolve) => {
            // Verificar se o CSS já foi carregado
            const existingLink = document.querySelector('link[href*="header.css"]');
            if (!existingLink) {
                console.log('📝 Arquivo header.css não encontrado, usando fallback');
                this.createFallbackCSS();
                resolve();
                return;
            }

            // Verificar se o CSS carregou corretamente
            const testLoadCSS = () => {
                const testEl = document.createElement('div');
                testEl.className = 'header';
                testEl.style.position = 'absolute';
                testEl.style.visibility = 'hidden';
                testEl.style.top = '-9999px';
                document.body.appendChild(testEl);

                const styles = window.getComputedStyle(testEl);
                const hasCSS = styles.position === 'sticky' || styles.position === 'fixed';

                document.body.removeChild(testEl);

                if (!hasCSS) {
                    console.warn('⚠️ Header CSS não carregou corretamente, usando fallback CSS inline');
                    this.createFallbackCSS();
                } else {
                    console.log('✅ Header CSS carregado corretamente');
                }

                resolve();
            };

            // Verificar se o link CSS já carregou
            if (existingLink.sheet) {
                testLoadCSS();
            } else {
                // Aguardar carregamento do CSS
                existingLink.addEventListener('load', testLoadCSS);
                existingLink.addEventListener('error', () => {
                    console.warn('❌ Erro ao carregar header.css, usando fallback');
                    this.createFallbackCSS();
                    resolve();
                });

                // Timeout de segurança
                setTimeout(testLoadCSS, 300);
            }
        });
    }

    createFallbackCSS() {
        const style = document.createElement('style');
        style.id = 'header-fallback-css';
        style.innerHTML = `
            .header {
                position: sticky;
                top: 0;
                z-index: 50;
                background: rgba(250, 249, 247, 0.95);
                backdrop-filter: blur(12px);
                border-bottom: 1px solid #e8ddd0;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            .header-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                height: 80px;
                max-width: 1280px;
                margin: 0 auto;
                padding: 0 1.5rem;
                gap: 2rem;
            }
            .logo {
                height: 48px;
                width: auto;
            }
            .nav {
                display: flex;
                gap: 2rem;
            }
            .nav-link {
                color: #3f3f46;
                text-decoration: none;
                font-weight: 500;
                font-size: 0.95rem;
                padding: 0.5rem 0;
                transition: color 0.15s;
            }
            .nav-link:hover {
                color: #583819;
            }
            .header-actions {
                display: flex;
                gap: 0.75rem;
                align-items: center;
            }
            .btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                font-weight: 600;
                font-size: 0.875rem;
                line-height: 1;
                border-radius: 0.5rem;
                transition: all 0.15s;
                text-decoration: none;
                border: none;
                cursor: pointer;
                white-space: nowrap;
            }
            .btn-sm {
                padding: 0.5rem 1rem;
                font-size: 0.8rem;
            }
            .btn-primary {
                background: #583819;
                color: white;
            }
            .btn-primary:hover {
                background: #4a2f15;
            }
            .btn-secondary {
                background: #f4f0ea;
                color: #583819;
            }
            .btn-secondary:hover {
                background: #e8ddd0;
            }
            .btn-ghost {
                background: transparent;
                color: #3f3f46;
                border: 1px solid #d4d4d8;
            }
            .btn-ghost:hover {
                background: #f4f4f5;
            }
            .guest-actions {
                display: flex;
                gap: 0.75rem;
                align-items: center;
            }
            .user-menu-wrapper {
                position: relative;
            }
            .user-menu {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                background: #f4f0ea;
                padding: 0.5rem 1rem;
                border-radius: 0.75rem;
                cursor: pointer;
                transition: all 0.15s;
                text-decoration: none;
                color: inherit;
            }
            .user-menu:hover {
                background: #e8ddd0;
            }
            .user-name {
                font-weight: 500;
                color: #583819;
            }
            .credits-badge {
                background: #583819;
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
            }
            .dropdown-icon {
                font-size: 0.7rem;
                color: #583819;
                transition: transform 0.15s;
            }
            .dropdown-menu {
                position: absolute;
                top: 100%;
                right: 0;
                margin-top: 0.5rem;
                background: white;
                border-radius: 0.5rem;
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
                min-width: 200px;
                z-index: 999;
                display: none;
                border: 1px solid #e5e7eb;
                overflow: hidden;
            }
            .dropdown-item {
                display: block;
                padding: 0.75rem 1rem;
                color: #3f3f46;
                text-decoration: none;
                font-size: 0.875rem;
                transition: background 0.15s;
                border: none;
                width: 100%;
                text-align: left;
                cursor: pointer;
                background: none;
            }
            .dropdown-item:hover {
                background: #f4f4f5;
            }
            .dropdown-item.logout-btn {
                color: #dc3545;
                border-top: 1px solid #e5e7eb;
            }
            .dropdown-item.logout-btn:hover {
                background: #fef2f2;
            }
            @media (max-width: 768px) {
                .nav { display: none; }
                .header-content { gap: 1rem; }
                .btn { font-size: 0.8rem; padding: 0.4rem 0.8rem; }
            }
        `;
        document.head.appendChild(style);
        console.log('✅ CSS de fallback aplicado');
    }

    async loadHeader() {
        try {
            console.log('📥 Tentando carregar header.html...');
            const response = await fetch('assets/components/header.html');
            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                throw new Error(`Erro ao carregar header: ${response.status}`);
            }

            const headerHTML = await response.text();
            console.log('📄 HTML carregado, tamanho:', headerHTML.length);

            const headerContainer = document.createElement('div');
            headerContainer.innerHTML = headerHTML;

            const headerElement = headerContainer.querySelector('.header');
            console.log('🔍 Elemento header encontrado:', !!headerElement);

            if (headerElement && document.body) {
                console.log('💉 Inserindo header no DOM...');
                document.body.insertBefore(headerElement, document.body.firstChild);
                this.header = headerElement;
                this.isLoaded = true;
                console.log('✅ Header inserido com sucesso');
                this.adjustMainContentMargin();
            } else {
                console.error('❌ Não foi possível inserir header - elemento ou body não encontrado');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar header:', error);
            console.log('🔄 Tentando criar header via fallback...');
            this.createFallbackHeader();
        }
    }

    createFallbackHeader() {
        console.log('🆘 Criando header de emergência...');
        const headerHTML = `
        <header class="header" id="header">
            <div class="container">
                <div class="header-content">
                    <div class="logo-container">
                        <a href="landing.html">
                            <img src="assets/img/logo.png" alt="CV Sem Frescura" class="logo">
                        </a>
                    </div>
                    <nav class="nav" id="headerNav"></nav>
                    <div class="header-actions">
                        <div class="guest-actions" id="guestActions" style="display: none;">
                            <a href="#gift-code" class="btn btn-secondary btn-sm">
                                <span>🎓</span>
                                <span>Código do Curso</span>
                            </a>
                            <a href="analisar.html?login=true" class="btn btn-ghost btn-sm">
                                <span>🔐</span>
                                <span>Entrar</span>
                            </a>
                            <a href="payment.html" class="btn btn-primary btn-sm">
                                <span>💳</span>
                                <span>Comprar</span>
                            </a>
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
        this.isLoaded = true;
        console.log('✅ Header de emergência criado com sucesso');
        this.adjustMainContentMargin();
    }

    adjustMainContentMargin() {
        if (!this.header) return;

        const headerHeight = this.header.offsetHeight;

        // Para a landing, ajustar especificamente a seção hero
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            heroSection.style.paddingTop = `${headerHeight + 20}px`;
            console.log(`📏 Ajustada margem da hero section: ${headerHeight + 20}px`);
            return;
        }

        // Para outras páginas, usar seletor padrão
        const main = document.querySelector('main, .main-content, body > div:first-of-type');
        if (main) {
            main.style.paddingTop = `${headerHeight + 20}px`;
            console.log(`📏 Ajustada margem do elemento principal: ${headerHeight + 20}px`);
        }
    }

    setupEventListeners() {
        console.log('🔧 Configurando event listeners do header...');

        // Fechar dropdown quando clicar fora
        document.addEventListener('click', (e) => {
            const userMenuWrapper = document.getElementById('userMenuWrapper');
            if (userMenuWrapper && !userMenuWrapper.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Toggle dropdown
        const authButton = document.getElementById('authButton');
        if (authButton) {
            console.log('✅ Event listener adicionado ao authButton');
            authButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔽 Clique no menu do usuário detectado');
                this.toggleDropdown();
            });
        } else {
            console.warn('⚠️ Elemento authButton não encontrado');
        }

        // Logout
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            console.log('✅ Event listener adicionado ao logoutButton');
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🚪 Logout clicado');
                if (window.auth) {
                    window.auth.logout();
                }
            });
        } else {
            console.warn('⚠️ Elemento logoutButton não encontrado');
        }

        // Setup contextual navigation
        this.setupContextualNavigation();
    }

    setupContextualNavigation() {
        const nav = document.querySelector('.nav');
        if (!nav) return;

        const currentPage = this.getCurrentPage();
        let navItems = [];

        switch (currentPage) {
            case 'landing':
                navItems = [
                    { href: '#features', text: 'Recursos' },
                    { href: '#how-it-works', text: 'Como Funciona' },
                    { href: 'payment.html', text: 'Comprar' }
                ];
                break;
            case 'analisar':
                navItems = [
                    { href: 'landing.html', text: 'Início' },
                    { href: 'payment.html', text: 'Comprar' }
                ];
                break;
            case 'results':
                navItems = [
                    { href: 'analisar.html', text: 'Nova Análise' },
                    { href: 'history.html', text: 'Histórico' }
                ];
                break;
            case 'history':
                navItems = [
                    { href: 'history.html', text: 'Histórico' },
                    { href: 'payment.html', text: 'Comprar' }
                ];
                break;
            case 'payment':
                navItems = [
                    { href: 'analisar.html', text: 'Analisar Currículo' },
                    { href: 'landing.html', text: 'Início' }
                ];
                break;
            default:
                navItems = [
                    { href: 'landing.html', text: 'Início' },
                    { href: 'analisar.html', text: 'Analisar Currículo' }
                ];
        }

        nav.innerHTML = navItems.map(item =>
            `<a href="${item.href}" class="nav-link">${item.text}</a>`
        ).join('');
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('landing')) return 'landing';
        if (path.includes('analisar') || path.includes('app')) return 'analisar';
        if (path.includes('payment')) return 'payment';
        if (path.includes('results')) return 'results';
        if (path.includes('history')) return 'history';
        return 'other';
    }

    updateUserInterface() {
        if (!this.isLoaded) {
            console.log('⚠️ Header ainda não carregado');
            return;
        }

        const user = window.auth ? window.auth.getUser() : null;
        const guestActions = document.getElementById('guestActions');
        const userMenuWrapper = document.getElementById('userMenuWrapper');
        const userName = document.getElementById('userName');
        const userCredits = document.getElementById('userCredits');

        console.log('🔄 Atualizando interface do usuário:', {
            isLoggedIn: !!user,
            userName: user?.name,
            guestActionsFound: !!guestActions,
            userMenuWrapperFound: !!userMenuWrapper
        });

        if (user) {
            // Usuário logado
            if (guestActions) guestActions.style.display = 'none';
            if (userMenuWrapper) {
                userMenuWrapper.style.display = 'block';
                console.log('👤 Menu do usuário exibido');
            }
            if (userName) userName.textContent = user.name.split(' ')[0];

            // Exibir créditos do localStorage primeiro (resposta rápida)
            if (userCredits && user.credits !== undefined) {
                userCredits.textContent = `${user.credits} análises`;
            }

            // Buscar créditos atualizados apenas se necessário
            this.fetchUserCredits();
        } else {
            // Usuário não logado
            if (guestActions) {
                guestActions.style.display = 'flex';
                console.log('👥 Ações de visitante exibidas');
            }
            if (userMenuWrapper) userMenuWrapper.style.display = 'none';
            if (userCredits) userCredits.textContent = '0 análises';
        }
    }

    async fetchUserCredits() {
        if (!window.auth || !window.auth.getToken()) return;

        // Throttling: não fazer requisição se já foi feita nos últimos 30 segundos
        const now = Date.now();
        if (this.lastCreditsRequest && (now - this.lastCreditsRequest) < 30000) {
            return;
        }
        this.lastCreditsRequest = now;

        try {
            const response = await fetch('/api/user/credits', {
                headers: {
                    'Authorization': `Bearer ${window.auth.getToken()}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const creditsElement = document.getElementById('userCredits');

                if (creditsElement) {
                    creditsElement.textContent = `${data.credits} análises`;

                    // Atualizar cores baseado no número de créditos
                    if (data.credits <= 0) {
                        creditsElement.style.background = 'linear-gradient(135deg, var(--error-500) 0%, #dc2626 100%)';
                    } else if (data.credits <= 2) {
                        creditsElement.style.background = 'linear-gradient(135deg, var(--warning-500) 0%, #d97706 100%)';
                    } else {
                        creditsElement.style.background = 'linear-gradient(135deg, var(--success-500) 0%, #16a34a 100%)';
                    }
                }

                // Atualizar localStorage
                const user = window.auth.getUser();
                if (user) {
                    user.credits = data.credits;
                    localStorage.setItem('user', JSON.stringify(user));
                }
            }
        } catch (error) {
            console.error('Erro ao buscar créditos:', error);
        }
    }

    toggleDropdown() {
        const userDropdown = document.getElementById('userDropdown');
        if (!userDropdown) {
            console.warn('⚠️ Elemento userDropdown não encontrado');
            return;
        }

        this.dropdownOpen = !this.dropdownOpen;
        userDropdown.style.display = this.dropdownOpen ? 'block' : 'none';

        // Animar ícone do dropdown
        const dropdownIcon = document.querySelector('.dropdown-icon');
        if (dropdownIcon) {
            dropdownIcon.style.transform = this.dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)';
        }

        console.log(`📋 Dropdown ${this.dropdownOpen ? 'aberto' : 'fechado'}`);
    }

    closeDropdown() {
        const userDropdown = document.getElementById('userDropdown');
        if (!userDropdown) return;

        this.dropdownOpen = false;
        userDropdown.style.display = 'none';

        // Resetar ícone
        const dropdownIcon = document.querySelector('.dropdown-icon');
        if (dropdownIcon) {
            dropdownIcon.style.transform = 'rotate(0deg)';
        }
    }

    setupScrollEffect() {
        if (!this.header) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                this.header.classList.add('scrolled');
            } else {
                this.header.classList.remove('scrolled');
            }
        });
    }

    // Método público para atualizar créditos (pode ser chamado de outras páginas)
    refreshCredits() {
        this.lastCreditsRequest = null; // Reset throttling
        this.fetchUserCredits();
    }

    // Método público para atualizar interface do usuário
    refreshUserInterface() {
        this.updateUserInterface();
    }

    // Método para forçar atualização completa (usar apenas quando necessário)
    forceRefresh() {
        this.lastCreditsRequest = null; // Reset throttling
        this.updateUserInterface();
    }

    checkAuthStatus() {
        if (window.auth) {
            this.isLoggedIn = true;
            this.userInfo = window.auth.getUser();
        } else {
            this.isLoggedIn = false;
            this.userInfo = null;
        }
        this.updateUserInterface();
        this.setupScrollEffect();
    }
}

// Inicializar header quando DOM estiver pronto
function initializeHeader() {
    console.log('🔄 Inicializando header manager...');
    window.headerManager = new HeaderManager();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHeader);
} else {
    // DOM já carregado
    initializeHeader();
}

// Atualizar interface quando autenticação mudarwindow.addEventListener('storage', (e) => {    if (e.key === 'user' || e.key === 'token') {        if (window.headerManager) {            window.headerManager.refreshUserInterface();        }        // Atualizar botão de análise quando créditos mudarem        if (e.key === 'user' && window.updateAnalyzeButton) {            setTimeout(window.updateAnalyzeButton, 100);        }    }});

// Verificar mudanças de autenticação apenas quando necessário (não em loop)
let lastAuthState = null;
function checkAuthChange() {
    if (!window.headerManager || !window.headerManager.isLoaded) return;

    const currentUser = window.auth ? window.auth.getUser() : null;
    const currentAuthState = currentUser ? currentUser.email : null;

    // Só atualizar se o estado de autenticação realmente mudou
    if (lastAuthState !== currentAuthState) {
        lastAuthState = currentAuthState;
        window.headerManager.updateUserInterface();
    }
}

// Verificar mudanças apenas quando há foco na página (reduz requisições)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        setTimeout(checkAuthChange, 500);
    }
});

// Verificar apenas quando há interação do usuário
document.addEventListener('click', () => {
    setTimeout(checkAuthChange, 100);
});

// Expor globalmente para outras páginas
window.HeaderManager = HeaderManager; 