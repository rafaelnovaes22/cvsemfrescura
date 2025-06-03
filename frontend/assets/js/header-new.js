// Header Padronizado - CV Sem Frescura (Versão 3.0 - INSTANTÂNEO TOTAL)
console.log('🚀 Carregando header-new.js v3.0 - INSTANTÂNEO TOTAL');

class HeaderManager {
    constructor() {
        this.header = null;
        this.isLoaded = false;
        this.dropdownOpen = false;
        this.isLoggedIn = false;
        this.userInfo = null;
        this.lastCreditsRequest = null;
        this.creditsRequestThrottle = 5000; // 5 segundos

        // Aplicar CSS INSTANTANEAMENTE antes de qualquer coisa
        this.applyCSSInstantaneously();

        // Inicializar IMEDIATAMENTE
        this.init();
    }

    // APLICA CSS CRÍTICO IMEDIATAMENTE - SEM DELAY
    applyCSSInstantaneously() {
        const style = document.createElement('style');
        style.id = 'header-instant-css-v3';
        style.innerHTML = `
            /* CSS CRÍTICO INSTANTÂNEO PARA HEADER */
            .header {
                position: sticky !important;
                top: 0 !important;
                z-index: 50 !important;
                background: rgba(250, 249, 247, 0.95) !important;
                backdrop-filter: blur(12px) !important;
                border-bottom: 1px solid #e8ddd0 !important;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }

            /* DROPDOWN VERTICAL GARANTIDO - MAIS FORTE QUE NUCLEAR */
            #userDropdown,
            .dropdown-menu {
                position: absolute !important;
                top: 100% !important;
                right: 0 !important;
                margin-top: 0.5rem !important;
                background: white !important;
                border-radius: 0.5rem !important;
                min-width: 200px !important;
                max-width: 250px !important;
                z-index: 9999 !important;
                border: 1px solid #e5e7eb !important;
                overflow: hidden !important;
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important;
                box-sizing: border-box !important;
                display: none !important;
                flex-direction: column !important;
                flex-wrap: nowrap !important;
                align-items: stretch !important;
                justify-content: flex-start !important;
            }

            /* FORÇA FLEX COLUMN EM QUALQUER SITUAÇÃO */
            #userDropdown[style*="flex"],
            #userDropdown.show,
            #userDropdown.dropdown-open,
            .dropdown-menu[style*="flex"],
            .dropdown-menu.show {
                display: flex !important;
                flex-direction: column !important;
                flex-wrap: nowrap !important;
                align-items: stretch !important;
                justify-content: flex-start !important;
            }

            /* ITENS DO DROPDOWN - SEMPRE VERTICAIS */
            #userDropdown a,
            #userDropdown .dropdown-item,
            .dropdown-menu a,
            .dropdown-menu .dropdown-item,
            .dropdown-item {
                display: block !important;
                width: 100% !important;
                padding: 0.75rem 1rem !important;
                color: #3f3f46 !important;
                text-decoration: none !important;
                font-size: 0.875rem !important;
                border: none !important;
                text-align: left !important;
                background: transparent !important;
                cursor: pointer !important;
                font-family: inherit !important;
                line-height: 1.5 !important;
                box-sizing: border-box !important;
                transition: background-color 0.2s ease !important;
                flex-shrink: 0 !important;
                flex-grow: 0 !important;
                order: initial !important;
                margin: 0 !important;
                outline: none !important;
                white-space: nowrap !important;
            }

            /* HOVER DOS ITENS */
            #userDropdown a:hover,
            #userDropdown .dropdown-item:hover,
            .dropdown-menu a:hover,
            .dropdown-menu .dropdown-item:hover {
                background-color: #f4f4f5 !important;
                color: #3f3f46 !important;
            }

            /* BOTÃO DE LOGOUT */
            #logoutButton,
            .logout-btn {
                color: #dc3545 !important;
                border-top: 1px solid #e5e7eb !important;
                margin-top: 0 !important;
            }

            #logoutButton:hover,
            .logout-btn:hover {
                background-color: #fef2f2 !important;
                color: #dc3545 !important;
            }

            /* BOTÃO DO MENU DO USUÁRIO */
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
                border: none !important;
                font-family: inherit !important;
            }

            #authButton:hover {
                background: #e8ddd0 !important;
            }

            /* BADGE DE CRÉDITOS SEMPRE CORRETO */
            #userCredits,
            .credits-badge {
                background: #583819 !important;
                color: white !important;
                padding: 0.25rem 0.5rem !important;
                border-radius: 0.375rem !important;
                font-size: 0.75rem !important;
                font-weight: 600 !important;
            }

            /* LAYOUT RESPONSIVO SIMPLES */
            @media (max-width: 768px) {
                #userDropdown,
                .dropdown-menu {
                    right: 0.5rem !important;
                    min-width: 180px !important;
                }
            }
        `;

        // Aplicar imediatamente no head
        if (document.head) {
            document.head.appendChild(style);
        } else {
            // Se head ainda não existe, aplicar quando existir
            document.addEventListener('DOMContentLoaded', () => {
                document.head.appendChild(style);
            });
        }

        console.log('⚡ CSS INSTANTÂNEO aplicado IMEDIATAMENTE');
    }

    async init() {
        try {
            console.log('🚀 Iniciando header manager v3.0...');

            // Carregar header (prioritário - inline se disponível)
            await this.loadHeader();
            console.log('✅ HTML do header carregado');

            // Configurar tudo imediatamente
            setTimeout(() => {
                this.checkAuthStatus();
                this.setupEventListeners();
                this.setupScrollEffect();
                console.log('✅ Header v3.0 inicializado completamente');
            }, 10); // Delay mínimo apenas para garantir DOM
        } catch (error) {
            console.error('❌ Erro ao inicializar header v3.0:', error);
        }
    }

    async loadHeader() {
        try {
            // PRIORIDADE 1: Verificar se header já existe inline (INSTANTÂNEO)
            const existingHeader = document.getElementById('header');
            if (existingHeader) {
                console.log('⚡ Header inline encontrado - INSTANTÂNEO');
                this.header = existingHeader;
                this.isLoaded = true;
                this.adjustMainContentMargin();
                return;
            }

            // PRIORIDADE 2: Tentar carregar header.html
            console.log('📥 Tentando carregar header.html...');
            const response = await fetch('assets/components/header.html');

            if (!response.ok) {
                throw new Error(`Erro ao carregar header: ${response.status}`);
            }

            const headerHTML = await response.text();
            const headerContainer = document.createElement('div');
            headerContainer.innerHTML = headerHTML;
            const headerElement = headerContainer.querySelector('.header');

            if (headerElement && document.body) {
                document.body.insertBefore(headerElement, document.body.firstChild);
                this.header = headerElement;
                this.isLoaded = true;
                console.log('✅ Header HTML carregado e inserido');
                this.adjustMainContentMargin();
            } else {
                throw new Error('Elemento header não encontrado no HTML carregado');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar header:', error);
            console.log('🆘 Criando header de emergência...');
            this.createFallbackHeader();
        }
    }

    createFallbackHeader() {
        const headerHTML = `
        <header class="header" id="header">
            <div style="
                display: flex; align-items: center; justify-content: space-between; 
                height: 80px; max-width: 1280px; margin: 0 auto; 
                padding: 0 1.5rem; gap: 2rem;
            ">
                <div>
                    <a href="landing.html">
                        <img src="assets/img/logo.png" alt="CV Sem Frescura" style="height: 48px; width: auto;">
                    </a>
                </div>
                <nav style="display: flex; gap: 2rem;" id="headerNav"></nav>
                <div style="display: flex; gap: 0.75rem; align-items: center;">
                    <div id="guestActions" style="display: none; gap: 0.75rem; align-items: center;">
                        <a href="#gift-code" style="
                            display: inline-flex; align-items: center; gap: 0.5rem;
                            padding: 0.5rem 1rem; background: #f4f0ea; color: #583819;
                            border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 0.8rem;
                        ">
                            <span>🎓</span>
                            <span>Código de Presente</span>
                        </a>
                        <a href="analisar.html?login=true" style="
                            display: inline-flex; align-items: center; gap: 0.5rem;
                            padding: 0.5rem 1rem; background: transparent; color: #3f3f46;
                            border: 1px solid #d4d4d8; border-radius: 0.5rem; text-decoration: none; 
                            font-weight: 600; font-size: 0.8rem;
                        ">
                            <span>🔐</span>
                            <span>Entrar</span>
                        </a>
                        <a href="payment.html" style="
                            display: inline-flex; align-items: center; gap: 0.5rem;
                            padding: 0.5rem 1rem; background: #583819; color: white;
                            border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 0.8rem;
                        ">
                            <span>💳</span>
                            <span>Comprar</span>
                        </a>
                    </div>
                    <div id="userMenuWrapper" style="display: none; position: relative;">
                        <a href="#" id="authButton">
                            <span id="userName" style="font-weight: 500; color: #583819;">Usuário</span>
                            <span id="userCredits">0 análises</span>
                            <span style="font-size: 0.7rem; color: #583819;">▼</span>
                        </a>
                        <div id="userDropdown">
                            <a href="analisar.html">📊 Analisar Currículo</a>
                            <a href="history.html">📋 Histórico</a>
                            <a href="payment.html">💳 Comprar análises</a>
                            <a href="#" id="logoutButton">🚪 Sair</a>
                        </div>
                    </div>
                </div>
            </div>
        </header>
        `;

        document.body.insertAdjacentHTML('afterbegin', headerHTML);
        this.header = document.getElementById('header');
        this.isLoaded = true;
        console.log('✅ Header de emergência criado com CSS inline integrado');
        this.adjustMainContentMargin();
    }

    adjustMainContentMargin() {
        if (!this.header) return;

        const currentPage = this.getCurrentPage();

        // PÁGINAS QUE NÃO PRECISAM DE AJUSTE AUTOMÁTICO (já têm CSS correto)
        const pagesWithFixedLayout = ['history', 'analisar', 'payment'];
        if (pagesWithFixedLayout.includes(currentPage)) {
            console.log(`⏭️ Página ${currentPage}: layout já definido no CSS, não ajustando`);
            return;
        }

        const headerHeight = this.header.offsetHeight;

        // Para a landing, ajustar especificamente a seção hero
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            heroSection.style.paddingTop = `${headerHeight + 20}px`;
            console.log(`📏 Ajustada margem da hero section: ${headerHeight + 20}px`);
            return;
        }

        // Para outras páginas que precisam de ajuste dinâmico
        const main = document.querySelector('main, .main-content, body > div:first-of-type');
        if (main) {
            main.style.paddingTop = `${headerHeight + 20}px`;
            console.log(`📏 Ajustada margem do elemento principal: ${headerHeight + 20}px`);
        }
    }

    setupEventListeners() {
        console.log('🔧 Configurando event listeners instantâneos...');

        // Fechar dropdown quando clicar fora
        document.addEventListener('click', (e) => {
            const userMenuWrapper = document.getElementById('userMenuWrapper');
            if (userMenuWrapper && !userMenuWrapper.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Toggle dropdown - SUPER OTIMIZADO
        const authButton = document.getElementById('authButton');
        if (authButton) {
            console.log('✅ Event listener INSTANTÂNEO adicionado ao authButton');
            authButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔽 Clique no menu detectado - Dropdown INSTANTÂNEO');
                this.toggleDropdownInstant();
            });
        }

        // Logout
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🚪 Logout clicado');
                if (window.auth) {
                    window.auth.logout();
                }
            });
        }

        this.setupContextualNavigation();
    }

    // DROPDOWN INSTANTÂNEO - VERSÃO ULTRA OTIMIZADA
    toggleDropdownInstant() {
        const userDropdown = document.getElementById('userDropdown');
        if (!userDropdown) {
            console.warn('⚠️ userDropdown não encontrado');
            return;
        }

        this.dropdownOpen = !this.dropdownOpen;

        if (this.dropdownOpen) {
            // APLICAÇÃO INSTANTÂNEA E TOTAL DOS ESTILOS
            userDropdown.style.cssText = `
                display: flex !important;
                flex-direction: column !important;
                flex-wrap: nowrap !important;
                align-items: stretch !important;
                justify-content: flex-start !important;
                position: absolute !important;
                top: 100% !important;
                right: 0 !important;
                margin-top: 0.5rem !important;
                background: white !important;
                border-radius: 0.5rem !important;
                min-width: 200px !important;
                max-width: 250px !important;
                z-index: 9999 !important;
                border: 1px solid #e5e7eb !important;
                overflow: hidden !important;
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important;
                box-sizing: border-box !important;
                visibility: visible !important;
                opacity: 1 !important;
            `;

            // FORÇA ESTILOS EM TODOS OS ITENS - INSTANTÂNEO
            const items = userDropdown.querySelectorAll('a');
            items.forEach((item) => {
                const isLogout = item.id === 'logoutButton' || item.textContent.includes('Sair');
                item.style.cssText = `
                    display: block !important;
                    width: 100% !important;
                    padding: 0.75rem 1rem !important;
                    color: ${isLogout ? '#dc3545' : '#3f3f46'} !important;
                    text-decoration: none !important;
                    font-size: 0.875rem !important;
                    border: none !important;
                    text-align: left !important;
                    background: transparent !important;
                    cursor: pointer !important;
                    font-family: inherit !important;
                    line-height: 1.5 !important;
                    box-sizing: border-box !important;
                    transition: background-color 0.2s ease !important;
                    flex-shrink: 0 !important;
                    white-space: nowrap !important;
                    ${isLogout ? 'border-top: 1px solid #e5e7eb !important;' : ''}
                `;

                // HOVER INSTANTÂNEO VIA JAVASCRIPT
                item.onmouseenter = function () {
                    this.style.backgroundColor = isLogout ? '#fef2f2' : '#f4f4f5';
                };
                item.onmouseleave = function () {
                    this.style.backgroundColor = 'transparent';
                };
            });

            console.log('⚡ Dropdown INSTANTÂNEO aberto');
        } else {
            userDropdown.style.display = 'none';
            console.log('❌ Dropdown fechado');
        }

        // Animar ícone
        const dropdownIcon = userDropdown.parentElement.querySelector('span:last-child');
        if (dropdownIcon) {
            dropdownIcon.style.transform = this.dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)';
            dropdownIcon.style.transition = 'transform 0.15s ease';
        }
    }

    closeDropdown() {
        const userDropdown = document.getElementById('userDropdown');
        if (!userDropdown) return;

        this.dropdownOpen = false;
        userDropdown.style.display = 'none';

        // Resetar ícone
        const dropdownIcon = userDropdown.parentElement.querySelector('span:last-child');
        if (dropdownIcon) {
            dropdownIcon.style.transform = 'rotate(0deg)';
        }
    }

    setupContextualNavigation() {
        const nav = document.querySelector('#headerNav');
        if (!nav) return;

        const currentPage = this.getCurrentPage();
        let navItems = [];

        switch (currentPage) {
            case 'landing':
                navItems = [
                    { href: '#features', text: 'Recursos' },
                    { href: '#how-it-works', text: 'Como Funciona' },
                    { href: '#testimonials', text: 'Depoimentos' }
                ];
                break;
            default:
                navItems = [
                    { href: 'landing.html', text: 'Início' },
                    { href: 'analisar.html', text: 'Analisar' },
                    { href: 'payment.html', text: 'Planos' }
                ];
                break;
        }

        nav.innerHTML = navItems.map(item =>
            `<a href="${item.href}" style="
                color: #3f3f46; text-decoration: none; font-weight: 500; 
                font-size: 0.95rem; padding: 0.5rem 0; transition: color 0.15s;
            " onmouseover="this.style.color='#583819'" onmouseout="this.style.color='#3f3f46'">${item.text}</a>`
        ).join('');
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('landing.html') || path === '/' || path === '') return 'landing';
        if (path.includes('analisar.html')) return 'analisar';
        if (path.includes('payment.html')) return 'payment';
        if (path.includes('history.html')) return 'history';
        return 'other';
    }

    updateUserInterface() {
        console.log('🔄 Atualizando interface do usuário...');

        const guestActions = document.getElementById('guestActions');
        const userMenuWrapper = document.getElementById('userMenuWrapper');
        const userName = document.getElementById('userName');
        const userCredits = document.getElementById('userCredits');

        if (!guestActions || !userMenuWrapper) return;

        // Verificar estado de autenticação
        this.isLoggedIn = window.auth && window.auth.isAuthenticated();
        this.userInfo = this.isLoggedIn ? window.auth.getUser() : null;

        if (this.isLoggedIn && this.userInfo) {
            // Usuário logado
            guestActions.style.display = 'none';
            userMenuWrapper.style.display = 'block';

            if (userName) {
                const firstName = this.userInfo.name ? this.userInfo.name.split(' ')[0] : 'Usuário';
                userName.textContent = firstName;
            }

            if (userCredits) {
                const credits = this.userInfo.credits || 0;
                userCredits.textContent = `${credits} análise${credits !== 1 ? 's' : ''}`;
                // FORÇA COR CORRETA SEMPRE
                userCredits.style.cssText = `
                    background: #583819 !important;
                    color: white !important;
                    padding: 0.25rem 0.5rem !important;
                    border-radius: 0.375rem !important;
                    font-size: 0.75rem !important;
                    font-weight: 600 !important;
                `;
            }

            // Buscar créditos atualizados (throttled)
            this.fetchUserCredits();
        } else {
            // Usuário não logado
            guestActions.style.display = 'flex';
            userMenuWrapper.style.display = 'none';
        }

        console.log('✅ Interface atualizada');
    }

    async fetchUserCredits() {
        if (!this.isLoggedIn || !window.auth || !window.CONFIG?.api?.url) return;

        // Throttling para evitar muitas requisições
        const now = Date.now();
        if (this.lastCreditsRequest && (now - this.lastCreditsRequest) < this.creditsRequestThrottle) {
            return;
        }
        this.lastCreditsRequest = now;

        try {
            const response = await fetch(`${window.CONFIG.api.url}/api/user/profile`, {
                headers: { 'Authorization': `Bearer ${window.auth.getToken()}` }
            });

            if (response.ok) {
                const data = await response.json();
                const userCredits = document.getElementById('userCredits');

                if (userCredits && data.credits !== undefined) {
                    const credits = data.credits;
                    userCredits.textContent = `${credits} análise${credits !== 1 ? 's' : ''}`;

                    // Atualizar dados locais
                    const currentUser = window.auth.getUser();
                    if (currentUser) {
                        currentUser.credits = credits;
                        localStorage.setItem('user', JSON.stringify(currentUser));
                    }

                    // Disparar evento para outras partes da aplicação
                    window.dispatchEvent(new CustomEvent('userCreditsUpdated', {
                        detail: { credits }
                    }));
                }
            }
        } catch (error) {
            console.log('ℹ️ Erro ao buscar créditos (normal se offline):', error.message);
        }
    }

    setupScrollEffect() {
        if (!this.header) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                this.header.style.transform = 'translateY(0)';
                this.header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
            } else {
                this.header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
            }
        });
    }

    // Métodos públicos para outras páginas
    refreshCredits() {
        this.lastCreditsRequest = null;
        this.fetchUserCredits();
    }

    refreshUserInterface() {
        this.updateUserInterface();
    }

    forceRefresh() {
        this.lastCreditsRequest = null;
        this.updateUserInterface();
    }

    checkAuthStatus() {
        this.updateUserInterface();
    }
}

// INICIALIZAÇÃO SUPER RÁPIDA
let headerInitAttempts = 0;
const MAX_HEADER_INIT_ATTEMPTS = 5; // Apenas 0.5 segundo máximo

function initializeHeaderInstant() {
    console.log('🚀 Inicializando header INSTANTÂNEO v3.0...');

    // Verificar se CONFIG está disponível (com limite de tentativas)
    if (typeof window.CONFIG === 'undefined' || !window.CONFIG) {
        headerInitAttempts++;

        if (headerInitAttempts >= MAX_HEADER_INIT_ATTEMPTS) {
            console.log('⚡ Criando header IMEDIATAMENTE sem aguardar CONFIG...');
            try {
                window.headerManager = new HeaderManager();
                console.log('🏆 Header INSTANTÂNEO criado com sucesso!');
            } catch (error) {
                console.error('❌ Falha ao criar header instantâneo:', error);
            }
            return;
        }

        console.log(`⏳ Aguardando CONFIG... (${headerInitAttempts}/${MAX_HEADER_INIT_ATTEMPTS})`);
        setTimeout(initializeHeaderInstant, 100);
        return;
    }

    console.log('✅ CONFIG carregado, criando HeaderManager INSTANTÂNEO...');
    headerInitAttempts = 0;
    window.headerManager = new HeaderManager();
}

// INICIALIZAR IMEDIATAMENTE
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHeaderInstant);
} else {
    initializeHeaderInstant();
}

// Escutar mudanças de autenticação
window.addEventListener('storage', (e) => {
    if ((e.key === 'user' || e.key === 'token') && window.headerManager) {
        window.headerManager.refreshUserInterface();
    }
});

// Função para verificar mudanças periódicas na autenticação
function checkAuthChange() {
    if (window.headerManager) {
        window.headerManager.checkAuthStatus();
    }
}

// Verificar mudanças na autenticação a cada 2 segundos
setInterval(checkAuthChange, 2000);

// Expor globalmente
window.HeaderManager = HeaderManager;

console.log('🏆 Header v3.0 INSTANTÂNEO carregado com sucesso!'); 