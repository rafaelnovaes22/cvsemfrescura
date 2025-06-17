// Performance Optimizer - CV Sem Frescura
// Otimizações críticas para melhorar Core Web Vitals

console.log('⚡ Performance Optimizer v1.0 carregado');

class PerformanceOptimizer {
    constructor() {
        this.observers = new Map();
        this.loadedResources = new Set();
        this.criticalResourcesLoaded = false;

        this.init();
    }

    init() {
        // Executar otimizações críticas imediatamente
        this.optimizeCriticalPath();

        // Aguardar DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeOptimizations());
        } else {
            this.initializeOptimizations();
        }
    }

    optimizeCriticalPath() {
        // Preload de recursos críticos
        this.preloadCriticalResources();

        // Otimizar fontes
        this.optimizeFonts();

        // Detectar conexão lenta
        this.detectSlowConnection();
    }

    preloadCriticalResources() {
        const criticalResources = [
            { href: '/assets/css/critical.css', as: 'style' },
            { href: '/assets/img/logo-optimized.svg', as: 'image' },
            { href: '/assets/js/config.js', as: 'script' }
        ];

        criticalResources.forEach(resource => {
            if (!this.loadedResources.has(resource.href)) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = resource.href;
                link.as = resource.as;

                if (resource.as === 'style') {
                    link.onload = () => {
                        link.rel = 'stylesheet';
                        this.loadedResources.add(resource.href);
                    };
                }

                document.head.appendChild(link);
                console.log('🔗 Preload:', resource.href);
            }
        });
    }

    optimizeFonts() {
        // Preload da fonte principal
        const fontLink = document.createElement('link');
        fontLink.rel = 'preload';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
        fontLink.as = 'style';
        fontLink.crossOrigin = 'anonymous';

        fontLink.onload = () => {
            fontLink.rel = 'stylesheet';
            console.log('🔤 Fonte Inter carregada');
        };

        document.head.appendChild(fontLink);
    }

    detectSlowConnection() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            const slowConnections = ['slow-2g', '2g', '3g'];

            if (slowConnections.includes(connection.effectiveType)) {
                document.documentElement.classList.add('slow-connection');
                console.log('🐌 Conexão lenta detectada:', connection.effectiveType);

                // Reduzir qualidade de imagens
                this.optimizeForSlowConnection();
            }
        }
    }

    optimizeForSlowConnection() {
        // Desabilitar animações desnecessárias
        const style = document.createElement('style');
        style.textContent = `
            .slow-connection * {
                animation-duration: 0.1s !important;
                transition-duration: 0.1s !important;
            }
            .slow-connection .hero::after {
                display: none;
            }
        `;
        document.head.appendChild(style);
    }

    initializeOptimizations() {
        // Lazy loading de imagens
        this.setupLazyLoading();

        // Lazy loading de scripts não críticos
        this.setupScriptLazyLoading();

        // Otimizar interações
        this.optimizeInteractions();

        // Monitorar performance
        this.monitorPerformance();

        console.log('✅ Performance Optimizer inicializado');
    }

    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;

                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }

                        if (img.dataset.srcset) {
                            img.srcset = img.dataset.srcset;
                            img.removeAttribute('data-srcset');
                        }

                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);

                        console.log('🖼️ Imagem carregada:', img.src);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            // Observar imagens com lazy loading
            document.querySelectorAll('img[data-src]').forEach(img => {
                img.classList.add('lazy');
                imageObserver.observe(img);
            });

            this.observers.set('images', imageObserver);
        }
    }

    setupScriptLazyLoading() {
        const nonCriticalScripts = [
            '/assets/js/analytics.js',
            '/assets/js/social-share.js'
        ];

        // Carregar scripts não críticos após interação do usuário
        const loadNonCriticalScripts = () => {
            nonCriticalScripts.forEach(src => {
                if (!this.loadedResources.has(src)) {
                    const script = document.createElement('script');
                    script.src = src;
                    script.async = true;
                    script.onload = () => {
                        this.loadedResources.add(src);
                        console.log('📜 Script não crítico carregado:', src);
                    };
                    document.head.appendChild(script);
                }
            });
        };

        // Carregar após primeiro scroll ou clique
        const triggerEvents = ['scroll', 'click', 'touchstart'];
        const loadOnce = () => {
            loadNonCriticalScripts();
            triggerEvents.forEach(event => {
                document.removeEventListener(event, loadOnce, { passive: true });
            });
        };

        triggerEvents.forEach(event => {
            document.addEventListener(event, loadOnce, { passive: true });
        });

        // Fallback: carregar após 3 segundos
        setTimeout(loadNonCriticalScripts, 3000);
    }

    optimizeInteractions() {
        // Prefetch de páginas importantes ao hover
        const importantLinks = document.querySelectorAll('a[href^="/analisar"], a[href^="/payment"]');

        importantLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                const href = link.getAttribute('href');
                if (!this.loadedResources.has(`prefetch:${href}`)) {
                    const prefetchLink = document.createElement('link');
                    prefetchLink.rel = 'prefetch';
                    prefetchLink.href = href;
                    document.head.appendChild(prefetchLink);

                    this.loadedResources.add(`prefetch:${href}`);
                    console.log('🔮 Prefetch:', href);
                }
            }, { once: true });
        });
    }

    monitorPerformance() {
        // Monitorar Core Web Vitals
        if ('PerformanceObserver' in window) {
            // Largest Contentful Paint
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.log('📊 LCP:', Math.round(lastEntry.startTime), 'ms');
            }).observe({ entryTypes: ['largest-contentful-paint'] });

            // First Input Delay
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    console.log('📊 FID:', Math.round(entry.processingStart - entry.startTime), 'ms');
                });
            }).observe({ entryTypes: ['first-input'] });

            // Cumulative Layout Shift
            new PerformanceObserver((list) => {
                let clsValue = 0;
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                console.log('📊 CLS:', clsValue.toFixed(4));
            }).observe({ entryTypes: ['layout-shift'] });
        }

        // Monitorar tempo de carregamento
        window.addEventListener('load', () => {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            console.log('⏱️ Tempo total de carregamento:', Math.round(loadTime), 'ms');

            // Reportar performance crítica
            if (loadTime > 3000) {
                console.warn('⚠️ Carregamento lento detectado:', Math.round(loadTime), 'ms');
            }
        });
    }

    // Método público para adicionar recursos críticos
    addCriticalResource(href, as) {
        if (!this.loadedResources.has(href)) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = href;
            link.as = as;
            document.head.appendChild(link);

            this.loadedResources.add(href);
            console.log('➕ Recurso crítico adicionado:', href);
        }
    }

    // Método público para otimizar imagem específica
    optimizeImage(img) {
        if (img && img.tagName === 'IMG') {
            // Adicionar loading lazy se não tiver
            if (!img.loading) {
                img.loading = 'lazy';
            }

            // Adicionar decode async
            img.decoding = 'async';

            console.log('🖼️ Imagem otimizada:', img.src);
        }
    }
}

// Inicializar otimizador
const performanceOptimizer = new PerformanceOptimizer();

// Exportar para uso global
window.PerformanceOptimizer = performanceOptimizer; 