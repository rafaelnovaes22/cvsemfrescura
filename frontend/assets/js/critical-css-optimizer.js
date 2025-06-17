/**
 * FASE FINAL: CRITICAL CSS OPTIMIZER - CV Sem Frescura
 * Extração Automática + Carregamento Inteligente + Performance
 * Versão: 3.0.0
 */

class CriticalCSSOptimizer {
    constructor() {
        this.criticalCSS = '';
        this.nonCriticalCSS = [];
        this.loadedStylesheets = new Set();
        this.pendingLoads = new Map();
        this.observer = null;

        this.config = {
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            criticalThreshold: 0.75, // 75% da viewport
            lazyLoadDelay: 100,
            maxCriticalSize: 50 * 1024, // 50KB
            enablePrefetch: true,
            enablePreload: true
        };

        this.init();
    }

    /**
     * Inicialização do otimizador
     */
    init() {
        this.extractCriticalCSS();
        this.setupLazyLoading();
        this.setupViewportObserver();
        this.optimizeExistingStylesheets();

        console.log('🎨 CriticalCSSOptimizer inicializado');
    }

    /**
     * Extrai CSS crítico baseado na viewport atual
     */
    extractCriticalCSS() {
        const criticalSelectors = this.identifyCriticalSelectors();
        const extractedCSS = this.extractSelectorsCSS(criticalSelectors);

        if (extractedCSS.length > 0) {
            this.criticalCSS = this.optimizeCSS(extractedCSS);
            this.injectCriticalCSS();
        }

        console.log(`🎨 CSS Crítico extraído: ${this.criticalCSS.length} chars`);
    }

    /**
     * Identifica seletores críticos na viewport atual
     */
    identifyCriticalSelectors() {
        const criticalElements = [];
        const viewportHeight = window.innerHeight * this.config.criticalThreshold;

        // Elementos visíveis na viewport
        const allElements = document.querySelectorAll('*');

        for (const element of allElements) {
            const rect = element.getBoundingClientRect();

            // Elemento está na área crítica
            if (rect.top < viewportHeight && rect.bottom > 0) {
                criticalElements.push(element);
            }
        }

        // Extrair seletores únicos
        const selectors = new Set();

        criticalElements.forEach(element => {
            // Tag name
            selectors.add(element.tagName.toLowerCase());

            // Classes
            if (element.className) {
                element.className.split(' ')
                    .filter(cls => cls.trim())
                    .forEach(cls => selectors.add(`.${cls}`));
            }

            // ID
            if (element.id) {
                selectors.add(`#${element.id}`);
            }

            // Seletores específicos importantes
            if (element.matches('header, nav, .header, .navbar, .hero, .banner')) {
                selectors.add(this.getSpecificSelector(element));
            }
        });

        return Array.from(selectors);
    }

    /**
     * Gera seletor específico para um elemento
     */
    getSpecificSelector(element) {
        let selector = element.tagName.toLowerCase();

        if (element.id) {
            return `#${element.id}`;
        }

        if (element.className) {
            const classes = element.className.split(' ').filter(cls => cls.trim());
            if (classes.length > 0) {
                selector += '.' + classes.join('.');
            }
        }

        return selector;
    }

    /**
     * Extrai CSS para seletores específicos
     */
    extractSelectorsCSS(selectors) {
        const extractedRules = [];

        // Percorrer todas as stylesheets
        for (const stylesheet of document.styleSheets) {
            try {
                if (stylesheet.cssRules) {
                    for (const rule of stylesheet.cssRules) {
                        if (rule.type === CSSRule.STYLE_RULE) {
                            // Verificar se o seletor é crítico
                            if (this.isCriticalSelector(rule.selectorText, selectors)) {
                                extractedRules.push(rule.cssText);
                            }
                        } else if (rule.type === CSSRule.MEDIA_RULE) {
                            // Processar regras de media queries
                            for (const mediaRule of rule.cssRules) {
                                if (mediaRule.type === CSSRule.STYLE_RULE) {
                                    if (this.isCriticalSelector(mediaRule.selectorText, selectors)) {
                                        extractedRules.push(`@media ${rule.conditionText} { ${mediaRule.cssText} }`);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                // Ignorar erros de CORS
                console.log('⚠️ Não foi possível acessar stylesheet:', stylesheet.href);
            }
        }

        return extractedRules.join('\n');
    }

    /**
     * Verifica se um seletor é crítico
     */
    isCriticalSelector(selectorText, criticalSelectors) {
        if (!selectorText) return false;

        // Seletores sempre críticos
        const alwaysCritical = [
            'html', 'body', '*',
            ':root', '::before', '::after',
            'header', 'nav', '.header', '.navbar'
        ];

        if (alwaysCritical.some(sel => selectorText.includes(sel))) {
            return true;
        }

        // Verificar se algum seletor crítico está presente
        return criticalSelectors.some(criticalSel => {
            return selectorText.includes(criticalSel) ||
                this.isRelatedSelector(selectorText, criticalSel);
        });
    }

    /**
     * Verifica se seletores são relacionados
     */
    isRelatedSelector(selectorText, criticalSelector) {
        // Lógica para detectar seletores relacionados
        // Ex: .btn e .btn-primary
        if (criticalSelector.startsWith('.') && selectorText.includes(criticalSelector)) {
            return true;
        }

        // Pseudo-classes e pseudo-elementos
        if (selectorText.includes(criticalSelector + ':') ||
            selectorText.includes(criticalSelector + '::')) {
            return true;
        }

        return false;
    }

    /**
     * Otimiza CSS removendo redundâncias
     */
    optimizeCSS(css) {
        let optimized = css;

        // Remover comentários
        optimized = optimized.replace(/\/\*[\s\S]*?\*\//g, '');

        // Remover espaços desnecessários
        optimized = optimized.replace(/\s+/g, ' ');
        optimized = optimized.replace(/;\s*}/g, '}');
        optimized = optimized.replace(/{\s*/g, '{');
        optimized = optimized.replace(/;\s*/g, ';');

        // Remover regras vazias
        optimized = optimized.replace(/[^{}]+{\s*}/g, '');

        // Limitar tamanho máximo
        if (optimized.length > this.config.maxCriticalSize) {
            console.warn(`⚠️ CSS crítico muito grande (${optimized.length} chars), truncando`);
            optimized = optimized.substring(0, this.config.maxCriticalSize);
        }

        return optimized.trim();
    }

    /**
     * Injeta CSS crítico inline
     */
    injectCriticalCSS() {
        if (!this.criticalCSS) return;

        // Verificar se já existe
        if (document.getElementById('critical-css-inline')) return;

        const style = document.createElement('style');
        style.id = 'critical-css-inline';
        style.textContent = this.criticalCSS;

        // Inserir no head antes de outros stylesheets
        const firstLink = document.querySelector('link[rel="stylesheet"]');
        if (firstLink) {
            document.head.insertBefore(style, firstLink);
        } else {
            document.head.appendChild(style);
        }

        console.log('🎨 CSS crítico injetado inline');
    }

    /**
     * Configura lazy loading de CSS não-crítico
     */
    setupLazyLoading() {
        // Identificar stylesheets não-críticos
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');

        stylesheets.forEach(link => {
            if (this.isNonCriticalStylesheet(link)) {
                this.convertToLazyLoad(link);
            }
        });
    }

    /**
     * Verifica se stylesheet é não-crítico
     */
    isNonCriticalStylesheet(link) {
        const href = link.href;

        // Padrões de CSS não-crítico
        const nonCriticalPatterns = [
            'print',
            'animation',
            'modal',
            'tooltip',
            'dropdown',
            'carousel',
            'accordion',
            'tabs'
        ];

        return nonCriticalPatterns.some(pattern =>
            href.includes(pattern) || link.media === 'print'
        );
    }

    /**
     * Converte stylesheet para lazy loading
     */
    convertToLazyLoad(link) {
        const href = link.href;

        // Criar preload link
        if (this.config.enablePreload) {
            const preload = document.createElement('link');
            preload.rel = 'preload';
            preload.as = 'style';
            preload.href = href;
            preload.onload = () => {
                // Converter para stylesheet quando carregado
                preload.rel = 'stylesheet';
            };

            document.head.appendChild(preload);
        }

        // Remover link original
        link.remove();

        // Adicionar à lista de não-críticos
        this.nonCriticalCSS.push({
            href: href,
            media: link.media || 'all',
            loaded: false
        });
    }

    /**
     * Carrega CSS não-crítico sob demanda
     */
    loadNonCriticalCSS(href, media = 'all') {
        if (this.loadedStylesheets.has(href)) {
            return Promise.resolve();
        }

        if (this.pendingLoads.has(href)) {
            return this.pendingLoads.get(href);
        }

        const promise = new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.media = media;

            link.onload = () => {
                this.loadedStylesheets.add(href);
                this.pendingLoads.delete(href);
                console.log(`🎨 CSS não-crítico carregado: ${href}`);
                resolve();
            };

            link.onerror = () => {
                this.pendingLoads.delete(href);
                console.error(`❌ Erro ao carregar CSS: ${href}`);
                reject(new Error(`Failed to load CSS: ${href}`));
            };

            document.head.appendChild(link);
        });

        this.pendingLoads.set(href, promise);
        return promise;
    }

    /**
     * Configura observer para carregamento baseado na viewport
     */
    setupViewportObserver() {
        if (!('IntersectionObserver' in window)) return;

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.handleElementVisible(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.1
        });

        // Observar elementos que podem precisar de CSS adicional
        this.observeElements();
    }

    /**
     * Observa elementos que podem precisar de CSS adicional
     */
    observeElements() {
        const elementsToObserve = document.querySelectorAll(`
            .modal, .tooltip, .dropdown, .carousel, .accordion,
            .tabs, .gallery, .lightbox, [data-lazy-css]
        `);

        elementsToObserve.forEach(element => {
            this.observer.observe(element);
        });
    }

    /**
     * Trata elemento que se tornou visível
     */
    handleElementVisible(element) {
        const lazyCSS = element.dataset.lazyCss;

        if (lazyCSS) {
            this.loadNonCriticalCSS(lazyCSS);
        }

        // Carregar CSS baseado em classes
        const classList = Array.from(element.classList);

        classList.forEach(className => {
            const cssFile = this.getCSSFileForClass(className);
            if (cssFile) {
                this.loadNonCriticalCSS(cssFile);
            }
        });

        // Parar de observar após carregar
        this.observer.unobserve(element);
    }

    /**
     * Mapeia classe para arquivo CSS
     */
    getCSSFileForClass(className) {
        const classToFileMap = {
            'modal': '/assets/css/modal.css',
            'carousel': '/assets/css/carousel.css',
            'tooltip': '/assets/css/tooltip.css',
            'dropdown': '/assets/css/dropdown.css',
            'accordion': '/assets/css/accordion.css',
            'tabs': '/assets/css/tabs.css'
        };

        return classToFileMap[className];
    }

    /**
     * Otimiza stylesheets existentes
     */
    optimizeExistingStylesheets() {
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');

        stylesheets.forEach(link => {
            // Adicionar prefetch para stylesheets importantes
            if (this.config.enablePrefetch && this.isImportantStylesheet(link)) {
                this.prefetchStylesheet(link.href);
            }

            // Adicionar loading="lazy" se suportado
            if ('loading' in HTMLLinkElement.prototype) {
                if (this.isNonCriticalStylesheet(link)) {
                    link.loading = 'lazy';
                }
            }
        });
    }

    /**
     * Verifica se stylesheet é importante
     */
    isImportantStylesheet(link) {
        const href = link.href;

        const importantPatterns = [
            'critical',
            'responsive',
            'main',
            'app',
            'style'
        ];

        return importantPatterns.some(pattern => href.includes(pattern));
    }

    /**
     * Prefetch stylesheet
     */
    prefetchStylesheet(href) {
        const prefetch = document.createElement('link');
        prefetch.rel = 'prefetch';
        prefetch.href = href;
        prefetch.as = 'style';

        document.head.appendChild(prefetch);
    }

    /**
     * Força carregamento de todo CSS não-crítico
     */
    loadAllNonCriticalCSS() {
        const promises = this.nonCriticalCSS
            .filter(css => !css.loaded)
            .map(css => this.loadNonCriticalCSS(css.href, css.media));

        return Promise.all(promises);
    }

    /**
     * Obtém métricas de performance do CSS
     */
    getPerformanceMetrics() {
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"], style');

        return {
            totalStylesheets: stylesheets.length,
            criticalCSSSize: this.criticalCSS.length,
            loadedNonCritical: this.loadedStylesheets.size,
            pendingLoads: this.pendingLoads.size,
            nonCriticalCount: this.nonCriticalCSS.length
        };
    }

    /**
     * Atualiza configuração
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };

        // Re-extrair CSS crítico se viewport mudou significativamente
        const viewportChanged = Math.abs(this.config.viewportWidth - window.innerWidth) > 100 ||
            Math.abs(this.config.viewportHeight - window.innerHeight) > 100;

        if (viewportChanged) {
            this.config.viewportWidth = window.innerWidth;
            this.config.viewportHeight = window.innerHeight;
            this.extractCriticalCSS();
        }
    }

    /**
     * Limpa recursos
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }

        this.pendingLoads.clear();
        this.loadedStylesheets.clear();
    }
}

// Auto-inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.CriticalCSSOptimizer = new CriticalCSSOptimizer();
    });
} else {
    window.CriticalCSSOptimizer = new CriticalCSSOptimizer();
}

// Reotimizar em mudanças de viewport
window.addEventListener('resize', () => {
    if (window.CriticalCSSOptimizer) {
        clearTimeout(window.resizeTimeout);
        window.resizeTimeout = setTimeout(() => {
            window.CriticalCSSOptimizer.updateConfig({
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight
            });
        }, 250);
    }
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CriticalCSSOptimizer;
} 