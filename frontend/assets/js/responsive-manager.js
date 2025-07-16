/**
 * FASE 2: RESPONSIVE MANAGER - destravaCV
 * Sistema Inteligente de Responsividade e Detecção de Dispositivos
 * Versão: 2.0.0
 */

class ResponsiveManager {
    constructor() {
        this.breakpoints = {
            mobile: 767,
            tablet: 1023,
            desktop: 1024,
            large: 1440
        };

        this.currentBreakpoint = null;
        this.deviceInfo = {};
        this.touchDevice = false;
        this.connectionSpeed = 'unknown';
        this.preferredMotion = true;

        this.observers = {
            resize: [],
            orientation: [],
            breakpoint: []
        };

        this.init();
    }

    /**
     * Inicialização do sistema
     */
    init() {
        this.detectDevice();
        this.detectConnection();
        this.detectPreferences();
        this.setupEventListeners();
        this.updateBreakpoint();
        this.optimizeForDevice();

        console.log('📱 ResponsiveManager inicializado:', {
            breakpoint: this.currentBreakpoint,
            device: this.deviceInfo,
            touch: this.touchDevice,
            connection: this.connectionSpeed
        });
    }

    /**
     * Detecta informações do dispositivo
     */
    detectDevice() {
        const ua = navigator.userAgent;
        const viewport = this.getViewportSize();

        this.deviceInfo = {
            mobile: /iPhone|iPad|iPod|Android|BlackBerry|IEMobile|Opera Mini/i.test(ua),
            tablet: /iPad|Android(?!.*Mobile)|Tablet/i.test(ua),
            ios: /iPhone|iPad|iPod/i.test(ua),
            android: /Android/i.test(ua),
            safari: /Safari/i.test(ua) && !/Chrome/i.test(ua),
            chrome: /Chrome/i.test(ua),
            firefox: /Firefox/i.test(ua),
            viewport: viewport,
            pixelRatio: window.devicePixelRatio || 1,
            orientation: this.getOrientation()
        };

        // Detectar se é dispositivo touch
        this.touchDevice = 'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0;

        // Adicionar classes CSS baseadas no dispositivo
        this.addDeviceClasses();
    }

    /**
     * Detecta velocidade da conexão
     */
    detectConnection() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            this.connectionSpeed = connection.effectiveType || 'unknown';

            // Otimizar baseado na conexão
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                document.documentElement.classList.add('slow-connection');
                this.optimizeForSlowConnection();
            }
        }
    }

    /**
     * Detecta preferências do usuário
     */
    detectPreferences() {
        // Detectar preferência de movimento
        if (window.matchMedia) {
            const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.preferredMotion = !motionQuery.matches;

            motionQuery.addEventListener('change', (e) => {
                this.preferredMotion = !e.matches;
                this.updateMotionPreferences();
            });
        }

        // Detectar tema preferido
        if (window.matchMedia) {
            const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
            if (darkQuery.matches) {
                document.documentElement.classList.add('prefers-dark');
            }
        }
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Resize listener com throttle
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 100);
        });

        // Orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Scroll listener para otimizações
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.handleScroll();
            }, 16); // ~60fps
        }, { passive: true });

        // Visibility change para pausar animações
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }

    /**
     * Atualiza breakpoint atual
     */
    updateBreakpoint() {
        const width = window.innerWidth;
        let newBreakpoint;

        if (width <= this.breakpoints.mobile) {
            newBreakpoint = 'mobile';
        } else if (width <= this.breakpoints.tablet) {
            newBreakpoint = 'tablet';
        } else if (width <= this.breakpoints.large) {
            newBreakpoint = 'desktop';
        } else {
            newBreakpoint = 'large';
        }

        if (newBreakpoint !== this.currentBreakpoint) {
            const oldBreakpoint = this.currentBreakpoint;
            this.currentBreakpoint = newBreakpoint;

            // Atualizar classes CSS
            this.updateBreakpointClasses(oldBreakpoint, newBreakpoint);

            // Notificar observers
            this.notifyObservers('breakpoint', {
                old: oldBreakpoint,
                new: newBreakpoint,
                width: width
            });

            console.log(`📱 Breakpoint alterado: ${oldBreakpoint} → ${newBreakpoint}`);
        }
    }

    /**
     * Adiciona classes CSS baseadas no dispositivo
     */
    addDeviceClasses() {
        const html = document.documentElement;

        // Limpar classes existentes
        html.classList.remove('mobile', 'tablet', 'desktop', 'touch', 'no-touch');

        // Adicionar classes de dispositivo
        if (this.deviceInfo.mobile) html.classList.add('mobile');
        if (this.deviceInfo.tablet) html.classList.add('tablet');
        if (!this.deviceInfo.mobile && !this.deviceInfo.tablet) html.classList.add('desktop');

        // Touch support
        html.classList.add(this.touchDevice ? 'touch' : 'no-touch');

        // Browser específico
        if (this.deviceInfo.ios) html.classList.add('ios');
        if (this.deviceInfo.android) html.classList.add('android');
        if (this.deviceInfo.safari) html.classList.add('safari');
        if (this.deviceInfo.chrome) html.classList.add('chrome');
        if (this.deviceInfo.firefox) html.classList.add('firefox');

        // Pixel ratio
        if (this.deviceInfo.pixelRatio >= 2) {
            html.classList.add('high-dpi');
        }
    }

    /**
     * Atualiza classes de breakpoint
     */
    updateBreakpointClasses(oldBreakpoint, newBreakpoint) {
        const html = document.documentElement;

        if (oldBreakpoint) {
            html.classList.remove(`bp-${oldBreakpoint}`);
        }

        html.classList.add(`bp-${newBreakpoint}`);
    }

    /**
     * Otimizações específicas para o dispositivo
     */
    optimizeForDevice() {
        // Otimizações para mobile
        if (this.isMobile()) {
            this.optimizeForMobile();
        }

        // Otimizações para touch
        if (this.touchDevice) {
            this.optimizeForTouch();
        }

        // Otimizações para conexão lenta
        if (this.connectionSpeed === 'slow-2g' || this.connectionSpeed === '2g') {
            this.optimizeForSlowConnection();
        }
    }

    /**
     * Otimizações específicas para mobile
     */
    optimizeForMobile() {
        // Desabilitar hover effects em mobile
        const style = document.createElement('style');
        style.textContent = `
            @media (hover: none) and (pointer: coarse) {
                *:hover {
                    -webkit-transform: none !important;
                    transform: none !important;
                }
            }
        `;
        document.head.appendChild(style);

        // Melhorar performance de scroll
        document.body.style.webkitOverflowScrolling = 'touch';

        // Prevenir zoom em inputs
        this.preventInputZoom();

        console.log('📱 Otimizações mobile aplicadas');
    }

    /**
     * Otimizações para dispositivos touch
     */
    optimizeForTouch() {
        // Aumentar área de toque para elementos pequenos
        const touchTargets = document.querySelectorAll('button, a, input, [role="button"]');
        touchTargets.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                element.style.minWidth = '44px';
                element.style.minHeight = '44px';
            }
        });

        console.log('👆 Otimizações touch aplicadas');
    }

    /**
     * Otimizações para conexão lenta
     */
    optimizeForSlowConnection() {
        // Desabilitar animações desnecessárias
        document.documentElement.classList.add('reduce-animations');

        // Lazy load mais agressivo
        this.enableAggressiveLazyLoading();

        // Reduzir qualidade de imagens
        this.optimizeImageQuality();

        console.log('🐌 Otimizações para conexão lenta aplicadas');
    }

    /**
     * Previne zoom em inputs no iOS
     */
    preventInputZoom() {
        if (this.deviceInfo.ios) {
            const inputs = document.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.style.fontSize === '' || parseFloat(input.style.fontSize) < 16) {
                    input.style.fontSize = '16px';
                }
            });
        }
    }

    /**
     * Lazy loading agressivo para conexões lentas
     */
    enableAggressiveLazyLoading() {
        const images = document.querySelectorAll('img[src]');
        images.forEach(img => {
            if (!img.loading) {
                img.loading = 'lazy';
            }
        });
    }

    /**
     * Otimiza qualidade de imagens para conexões lentas
     */
    optimizeImageQuality() {
        // Implementar lógica para servir imagens de menor qualidade
        // Pode ser integrado com um CDN que suporte isso
    }

    /**
     * Handlers de eventos
     */
    handleResize() {
        this.updateBreakpoint();
        this.deviceInfo.viewport = this.getViewportSize();

        this.notifyObservers('resize', {
            viewport: this.deviceInfo.viewport,
            breakpoint: this.currentBreakpoint
        });
    }

    handleOrientationChange() {
        const newOrientation = this.getOrientation();
        const oldOrientation = this.deviceInfo.orientation;

        this.deviceInfo.orientation = newOrientation;

        // Força recálculo do viewport após mudança de orientação
        setTimeout(() => {
            this.deviceInfo.viewport = this.getViewportSize();
            this.updateBreakpoint();
        }, 200);

        this.notifyObservers('orientation', {
            old: oldOrientation,
            new: newOrientation
        });
    }

    handleScroll() {
        // Otimizações durante scroll
        const scrollY = window.scrollY;

        // Pausa animações durante scroll rápido
        if (this.scrollTimeout) {
            document.body.classList.add('is-scrolling');
        } else {
            document.body.classList.remove('is-scrolling');
        }

        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
            document.body.classList.remove('is-scrolling');
        }, 150);
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // Pausar animações quando página não está visível
            document.body.classList.add('page-hidden');
        } else {
            document.body.classList.remove('page-hidden');
        }
    }

    /**
     * Atualiza preferências de movimento
     */
    updateMotionPreferences() {
        if (this.preferredMotion) {
            document.documentElement.classList.remove('reduce-motion');
        } else {
            document.documentElement.classList.add('reduce-motion');
        }
    }

    /**
     * Utilitários
     */
    getViewportSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            ratio: window.innerWidth / window.innerHeight
        };
    }

    getOrientation() {
        if (screen.orientation) {
            return screen.orientation.angle === 0 || screen.orientation.angle === 180
                ? 'portrait' : 'landscape';
        }
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }

    /**
     * Métodos públicos para verificação de estado
     */
    isMobile() {
        return this.currentBreakpoint === 'mobile';
    }

    isTablet() {
        return this.currentBreakpoint === 'tablet';
    }

    isDesktop() {
        return this.currentBreakpoint === 'desktop' || this.currentBreakpoint === 'large';
    }

    isTouch() {
        return this.touchDevice;
    }

    isSlowConnection() {
        return this.connectionSpeed === 'slow-2g' || this.connectionSpeed === '2g';
    }

    /**
     * Sistema de observers
     */
    on(event, callback) {
        if (this.observers[event]) {
            this.observers[event].push(callback);
        }
    }

    off(event, callback) {
        if (this.observers[event]) {
            const index = this.observers[event].indexOf(callback);
            if (index > -1) {
                this.observers[event].splice(index, 1);
            }
        }
    }

    notifyObservers(event, data) {
        if (this.observers[event]) {
            this.observers[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Erro no observer ${event}:`, error);
                }
            });
        }
    }

    /**
     * Utilitários para componentes
     */
    adaptComponent(element, config) {
        const currentBP = this.currentBreakpoint;

        if (config[currentBP]) {
            const settings = config[currentBP];

            Object.keys(settings).forEach(property => {
                if (property === 'classes') {
                    // Remover classes de outros breakpoints
                    Object.keys(config).forEach(bp => {
                        if (bp !== currentBP && config[bp].classes) {
                            config[bp].classes.forEach(cls => {
                                element.classList.remove(cls);
                            });
                        }
                    });

                    // Adicionar classes do breakpoint atual
                    settings.classes.forEach(cls => {
                        element.classList.add(cls);
                    });
                } else {
                    element.style[property] = settings[property];
                }
            });
        }
    }

    /**
     * Lazy loading inteligente baseado no dispositivo
     */
    setupIntelligentLazyLoading() {
        if ('IntersectionObserver' in window) {
            const options = {
                rootMargin: this.isMobile() ? '50px' : '100px',
                threshold: 0.1
            };

            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;

                        // Carregar imagem otimizada baseada no dispositivo
                        if (img.dataset.src) {
                            let src = img.dataset.src;

                            // Ajustar qualidade baseada na conexão
                            if (this.isSlowConnection() && img.dataset.srcLowQuality) {
                                src = img.dataset.srcLowQuality;
                            }

                            // Ajustar tamanho baseado no DPR
                            if (this.deviceInfo.pixelRatio >= 2 && img.dataset.srcRetina) {
                                src = img.dataset.srcRetina;
                            }

                            img.src = src;
                            img.classList.remove('lazy');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            }, options);

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    /**
     * Debug e informações
     */
    getDebugInfo() {
        return {
            breakpoint: this.currentBreakpoint,
            device: this.deviceInfo,
            touch: this.touchDevice,
            connection: this.connectionSpeed,
            preferredMotion: this.preferredMotion,
            viewport: this.getViewportSize()
        };
    }
}

// Instância global
window.ResponsiveManager = new ResponsiveManager();

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResponsiveManager;
} 