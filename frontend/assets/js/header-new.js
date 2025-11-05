// Header Padronizado - destravaCV (Versão 3.0 - INSTANTÂNEO TOTAL)
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
        this.lastUserState = null;

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

            /* FORÇA FLEX COLUMN APENAS QUANDO EXPLICITAMENTE MOSTRADO */
            #userDropdown.show,
            #userDropdown.dropdown-open,
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
            headerContainer.innerHTML = Sanitizer.sanitizeHtml(headerHTML, ['div', 'nav', 'a', 'span', 'i', 'button', 'ul', 'li', 'img', 'header', 'h1', 'h2', 'h3']);
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
                        <img src="assets/img/novo_logo.png" alt="destravaCV" style="height: 48px; width: auto;">
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
                if (this.dropdownOpen) {
                    console.log('🔄 Fechando dropdown - clique fora detectado');
                    this.closeDropdown();
                }
            }
        });

        // Toggle dropdown - CORRIGIDO PARA FUNCIONAR COM <a> TAG
        const authButton = document.getElementById('authButton');
        if (authButton) {
            console.log('✅ Event listener INSTANTÂNEO adicionado ao authButton');

            // Remover event listeners anteriores se existirem
            if (this.authButtonClickHandler) {
                authButton.removeEventListener('click', this.authButtonClickHandler);
            }

            // Criar uma função vinculada para poder remover depois
            this.authButtonClickHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();

                console.log('🖱️ Clique no authButton detectado');
                console.log(`📊 Estado atual antes do toggle: dropdownOpen = ${this.dropdownOpen}`);

                // Toggle imediato do estado
                this.dropdownOpen = !this.dropdownOpen;
                console.log(`🔄 Novo estado: dropdownOpen = ${this.dropdownOpen}`);

                // DEBUG: Verificar se elementos existem
                const userDropdown = document.getElementById('userDropdown');
                console.log(`🔍 userDropdown encontrado: ${!!userDropdown}`);
                if (userDropdown) {
                    console.log(`📏 userDropdown display atual: ${userDropdown.style.display}`);
                }

                // Aplicar mudança visual imediatamente
                this.applyDropdownState();

                // DEBUG: Verificar estado após aplicar
                if (userDropdown) {
                    console.log(`📏 userDropdown display após aplicar: ${userDropdown.style.display}`);
                }
            };

            authButton.addEventListener('click', this.authButtonClickHandler);
        } else {
            console.warn('⚠️ authButton não encontrado para adicionar event listener');
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

    // NOVA FUNÇÃO PARA APLICAR O ESTADO DO DROPDOWN
    applyDropdownState() {
        const userDropdown = document.getElementById('userDropdown');
        const authButton = document.getElementById('authButton');

        if (!userDropdown) {
            console.warn('⚠️ userDropdown não encontrado');
            return;
        }

        if (this.dropdownOpen) {
            this.openDropdownInstant(userDropdown, authButton);
        } else {
            this.closeDropdownInstant(userDropdown, authButton);
        }
    }

    // DROPDOWN INSTANTÂNEO - VERSÃO FINAL CORRIGIDA
    toggleDropdownInstant() {
        // Esta função agora é apenas um wrapper para compatibilidade
        this.dropdownOpen = !this.dropdownOpen;
        this.applyDropdownState();
        console.log(`🔄 Toggle dropdown: ${this.dropdownOpen}`);
    }

    openDropdownInstant(userDropdown, authButton) {
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

        // Atualizar seta
        this.updateDropdownArrow(authButton, true);
        console.log('⚡ Dropdown INSTANTÂNEO aberto');
    }

    closeDropdownInstant(userDropdown, authButton) {
        // LIMPEZA COMPLETA DO STYLE E FORÇAR DISPLAY NONE
        userDropdown.style.cssText = 'display: none !important;';

        // Remover classes que possam forçar display
        userDropdown.classList.remove('show', 'dropdown-open');

        // Forçar atualização visual
        userDropdown.offsetHeight; // Trigger reflow

        // Verificação final - garantir que está escondido
        if (userDropdown.offsetParent !== null) {
            console.warn('⚠️ Dropdown ainda visível, aplicando força bruta...');
            userDropdown.style.setProperty('display', 'none', 'important');
            userDropdown.style.setProperty('visibility', 'hidden', 'important');
            userDropdown.style.setProperty('opacity', '0', 'important');
        }

        // Atualizar seta
        this.updateDropdownArrow(authButton, false);
        console.log('❌ Dropdown fechado');
    }

    updateDropdownArrow(authButton, isOpen) {
        if (!authButton) return;

        // Busca inteligente pela seta
        const spans = authButton.querySelectorAll('span');
        let dropdownIcon = null;

        // 1. Buscar por conteúdo de seta
        for (let i = spans.length - 1; i >= 0; i--) {
            const span = spans[i];
            const text = span.textContent || span.innerHTML;
            if (text.includes('▼') || text.includes('▲')) {
                dropdownIcon = span;
                break;
            }
        }

        // 2. Buscar por estilo (font-size pequeno)
        if (!dropdownIcon) {
            for (let i = spans.length - 1; i >= 0; i--) {
                const span = spans[i];
                const fontSize = window.getComputedStyle(span).fontSize;
                if (fontSize === '0.7rem' || parseFloat(fontSize) < 12) {
                    dropdownIcon = span;
                    break;
                }
            }
        }

        // 3. Usar último span como fallback
        if (!dropdownIcon && spans.length > 0) {
            dropdownIcon = spans[spans.length - 1];
        }

        if (dropdownIcon) {
            // Aplicar animação e texto
            dropdownIcon.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
            dropdownIcon.style.transition = 'transform 0.15s ease';
            dropdownIcon.textContent = isOpen ? '▲' : '▼';

            console.log(`🎯 Seta atualizada: ${isOpen ? '▲ (para cima)' : '▼ (para baixo)'}`);
        } else {
            console.warn('⚠️ Ícone da seta não encontrado no authButton');
        }
    }

    closeDropdown() {
        const userDropdown = document.getElementById('userDropdown');
        const authButton = document.getElementById('authButton');

        if (!userDropdown) return;

        this.dropdownOpen = false;
        this.closeDropdownInstant(userDropdown, authButton);
        console.log('🔄 Dropdown fechado via closeDropdown()');
    }

    setupContextualNavigation() {
        const nav = document.querySelector('#headerNav');
        if (!nav) return;

        const currentPage = this.getCurrentPage();
        let navItems = [];

        switch (currentPage) {
            case 'landing':
                navItems = [
                    { href: 'landing.html#features', text: 'Recursos', isAnchor: true },
                    { href: 'landing.html#how-it-works', text: 'Como Funciona', isAnchor: true }
                ];
                break;
            default:
                navItems = [
                    { href: 'landing.html', text: 'Início', isAnchor: false },
                    { href: 'analisar.html', text: 'Analisar', isAnchor: false },
                    { href: 'payment.html', text: 'Planos', isAnchor: false }
                ];
                break;
        }

        nav.innerHTML = navItems.map(item =>
            `<a href="${item.href}" style="
                color: #3f3f46; text-decoration: none; font-weight: 500; 
                font-size: 0.95rem; padding: 0.5rem 0; transition: color 0.15s;
            " onmouseover="this.style.color='#583819'" onmouseout="this.style.color='#3f3f46'" ${item.isAnchor ? 'class="scroll-link"' : ''}>${item.text}</a>`
        ).join('');

        // Configurar smooth scroll para links âncora na mesma página
        if (currentPage === 'landing') {
            nav.querySelectorAll('a.scroll-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('href').split('#')[1];
                    const targetElement = document.getElementById(targetId);
                    
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        }
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

        // Verificação defensiva mais robusta do estado de autenticação
        try {
            this.isLoggedIn = window.auth &&
                typeof window.auth.isAuthenticated === 'function' &&
                window.auth.isAuthenticated();
            this.userInfo = this.isLoggedIn &&
                typeof window.auth.getUser === 'function' ?
                window.auth.getUser() : null;
        } catch (error) {
            console.log('ℹ️ Auth não disponível ou incompleto, assumindo usuário não logado');
            this.isLoggedIn = false;
            this.userInfo = null;
        }

        // OTIMIZAÇÃO: Verificar se houve mudança real no estado do usuário
        const currentUserState = this.userInfo ? `${this.userInfo.email}-${this.userInfo.credits}` : 'guest';
        if (this.lastUserState === currentUserState) {
            // Estado não mudou, não precisa atualizar
            console.log('⚡ Estado não mudou, pulando atualização desnecessária');
            return;
        }
        this.lastUserState = currentUserState;
        console.log('🔄 Estado mudou, atualizando interface:', { currentUserState });

        // **PRESERVAR ESTADO DO DROPDOWN** - Salvar antes de qualquer modificação
        const userDropdown = document.getElementById('userDropdown');
        let dropdownWasVisible = false;
        if (userDropdown && this.dropdownOpen) {
            dropdownWasVisible = true;
            console.log('💾 Salvando estado do dropdown (estava aberto)');
        }

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

            // **RESTAURAR ESTADO DO DROPDOWN** - Após todas as modificações
            if (dropdownWasVisible && userDropdown) {
                console.log('🔄 Restaurando estado do dropdown (reabrindo)');
                // Forçar reabertura com delay mínimo para garantir que a modificação anterior foi aplicada
                setTimeout(() => {
                    this.openDropdownInstant(userDropdown, document.getElementById('authButton'));
                }, 10);
            }

            // OTIMIZAÇÃO: Não buscar créditos automaticamente aqui
            // Será feito apenas quando necessário via funções específicas
        } else {
            // Usuário não logado
            guestActions.style.display = 'flex';
            userMenuWrapper.style.display = 'none';
        }

        console.log('✅ Interface atualizada');
    }

    async fetchUserCredits() {
        // Verificação defensiva mais robusta
        if (!this.isLoggedIn ||
            !window.auth ||
            typeof window.auth.getToken !== 'function' ||
            !window.CONFIG?.api?.baseUrl) {
            console.log('ℹ️ Requisitos para fetchUserCredits não atendidos, pulando...');
            return;
        }

        // Throttling para evitar muitas requisições
        const now = Date.now();
        if (this.lastCreditsRequest && (now - this.lastCreditsRequest) < this.creditsRequestThrottle) {
            return;
        }
        this.lastCreditsRequest = now;

        try {
            const token = window.auth.getToken();
            if (!token) {
                console.log('ℹ️ Token não disponível, pulando fetchUserCredits');
                return;
            }

            const response = await fetch(`${window.CONFIG.api.baseUrl}/api/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const userCredits = document.getElementById('userCredits');

                if (userCredits && data.credits !== undefined) {
                    const credits = data.credits;
                    userCredits.textContent = `${credits} análise${credits !== 1 ? 's' : ''}`;

                    // Atualizar dados locais - apenas se getUser está disponível
                    if (typeof window.auth.getUser === 'function') {
                        const currentUser = window.auth.getUser();
                        if (currentUser) {
                            currentUser.credits = credits;
                            localStorage.setItem('user', JSON.stringify(currentUser));
                        }
                    }

                    // Disparar evento para outras partes da aplicação
                    window.dispatchEvent(new CustomEvent('userCreditsUpdated', {
                        detail: { credits }
                    }));
                }
            }
        } catch (error) {
            console.log('ℹ️ Erro ao buscar créditos (normal se offline ou auth incompleto):', error.message);
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
        console.log('📦 Storage mudou, atualizando header:', e.key);
        window.headerManager.refreshUserInterface();
    }
});

// OTIMIZAÇÃO: Função para verificar mudanças de autenticação (agora apenas sob demanda)
let lastAuthState = null;
function checkAuthChange() {
    if (!window.headerManager) return;

    const currentUser = window.auth && typeof window.auth.getUser === 'function' ? window.auth.getUser() : null;
    const currentAuthState = currentUser ? currentUser.email : null;

    // Só atualizar se o estado de autenticação realmente mudou
    if (lastAuthState !== currentAuthState) {
        lastAuthState = currentAuthState;
        console.log('🔄 Estado de autenticação mudou, atualizando header');
        window.headerManager.checkAuthStatus();
    }
}

// OTIMIZAÇÃO: Verificações apenas quando necessário
// Verificar mudanças apenas quando a página volta do background (uma vez por sessão de foco)
let hasCheckedOnVisibility = false;
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !hasCheckedOnVisibility) {
        hasCheckedOnVisibility = true;
        setTimeout(() => {
            console.log('👁️ Página voltou do background, verificando auth uma vez');
            checkAuthChange();
            // Reset do flag após 30 segundos para permitir nova verificação se necessário
            setTimeout(() => { hasCheckedOnVisibility = false; }, 30000);
        }, 500);
    }
});

// Função global para atualizar créditos quando houver ações específicas
window.updateHeaderCredits = function () {
    if (window.headerManager) {
        console.log('📊 Atualizando créditos por ação do usuário');
        window.headerManager.refreshCredits();
    }
};

// Função global para refresh completo do header (usar apenas quando necessário)
window.refreshHeader = function () {
    if (window.headerManager) {
        console.log('🔄 Refresh completo do header por ação do usuário');
        window.headerManager.forceRefresh();
    }
};

// Expor globalmente
window.HeaderManager = HeaderManager;

console.log('🏆 Header v3.0 INSTANTÂNEO carregado com sucesso!'); 