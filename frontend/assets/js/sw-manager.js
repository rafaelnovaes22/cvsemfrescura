/**
 * FASE FINAL: SERVICE WORKER MANAGER - destravaCV
 * Registro, Controle e Comunicação com Service Worker
 * Versão: 3.0.0
 */

class ServiceWorkerManager {
    constructor() {
        this.registration = null;
        this.updateAvailable = false;
        this.isOnline = navigator.onLine;

        this.callbacks = {
            updateAvailable: [],
            installed: [],
            activated: [],
            offline: [],
            online: []
        };

        this.init();
    }

    /**
     * Inicialização do Service Worker Manager
     */
    async init() {
        if (!('serviceWorker' in navigator)) {
            console.warn('⚠️ Service Worker não suportado neste navegador');
            return;
        }

        try {
            await this.register();
            this.setupEventListeners();
            this.setupOnlineOfflineDetection();
            this.setupUpdateDetection();

            console.log('🚀 ServiceWorkerManager inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro na inicialização do SW Manager:', error);
        }
    }

    /**
     * Registra o Service Worker
     */
    async register() {
        try {
            this.registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none'
            });

            console.log('✅ Service Worker registrado:', this.registration.scope);

            // Verificar se há atualização disponível
            if (this.registration.waiting) {
                this.handleUpdateAvailable();
            }

            return this.registration;
        } catch (error) {
            console.error('❌ Falha no registro do Service Worker:', error);
            throw error;
        }
    }

    /**
     * Configura event listeners do Service Worker
     */
    setupEventListeners() {
        if (!this.registration) return;

        // Novo Service Worker instalado
        this.registration.addEventListener('updatefound', () => {
            const newWorker = this.registration.installing;

            newWorker.addEventListener('statechange', () => {
                switch (newWorker.state) {
                    case 'installed':
                        if (navigator.serviceWorker.controller) {
                            // Nova versão disponível
                            this.handleUpdateAvailable();
                        } else {
                            // Primeira instalação
                            this.notifyCallbacks('installed');
                        }
                        break;

                    case 'activated':
                        this.notifyCallbacks('activated');
                        break;
                }
            });
        });

        // Mensagens do Service Worker
        navigator.serviceWorker.addEventListener('message', event => {
            this.handleServiceWorkerMessage(event.data);
        });

        // Controlador alterado (nova versão ativa)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🔄 Service Worker controlador alterado');
            window.location.reload();
        });
    }

    /**
     * Configura detecção de online/offline
     */
    setupOnlineOfflineDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.notifyCallbacks('online');
            console.log('🌐 Aplicação online');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.notifyCallbacks('offline');
            console.log('📵 Aplicação offline');
        });
    }

    /**
     * Configura detecção de atualizações
     */
    setupUpdateDetection() {
        // Verificar atualizações periodicamente
        setInterval(() => {
            if (this.registration) {
                this.registration.update();
            }
        }, 60000); // A cada 1 minuto

        // Verificar quando a página ganha foco
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.registration) {
                this.registration.update();
            }
        });
    }

    /**
     * Trata atualização disponível
     */
    handleUpdateAvailable() {
        this.updateAvailable = true;
        this.notifyCallbacks('updateAvailable');

        // Mostrar notificação de atualização
        this.showUpdateNotification();
    }

    /**
     * Mostra notificação de atualização
     */
    showUpdateNotification() {
        // Criar notificação elegante
        const notification = document.createElement('div');
        notification.id = 'sw-update-notification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                max-width: 320px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                animation: slideInRight 0.3s ease;
            ">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                    <span style="font-size: 1.5rem;">🚀</span>
                    <strong>Atualização Disponível</strong>
                </div>
                <p style="margin: 0 0 1rem 0; opacity: 0.9; font-size: 0.9rem; line-height: 1.4;">
                    Uma nova versão está disponível com melhorias de performance.
                </p>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="window.SWManager.applyUpdate()" style="
                        background: rgba(255, 255, 255, 0.2);
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        color: white;
                        padding: 0.5rem 1rem;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 0.85rem;
                        flex: 1;
                    ">
                        Atualizar
                    </button>
                    <button onclick="window.SWManager.dismissUpdate()" style="
                        background: transparent;
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        color: white;
                        padding: 0.5rem 1rem;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 0.85rem;
                    ">
                        Depois
                    </button>
                </div>
            </div>
            <style>
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;

        // Remover notificação anterior se existir
        const existing = document.getElementById('sw-update-notification');
        if (existing) {
            existing.remove();
        }

        document.body.appendChild(notification);

        // Auto-remover após 10 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }

    /**
     * Aplica atualização do Service Worker
     */
    async applyUpdate() {
        if (!this.registration || !this.registration.waiting) {
            console.warn('⚠️ Nenhuma atualização disponível');
            return;
        }

        // Sinalizar para o SW waiting que pode skipWaiting
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Remover notificação
        this.dismissUpdate();
    }

    /**
     * Dispensa notificação de atualização
     */
    dismissUpdate() {
        const notification = document.getElementById('sw-update-notification');
        if (notification) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }

    /**
     * Trata mensagens do Service Worker
     */
    handleServiceWorkerMessage(data) {
        const { type, payload } = data;

        switch (type) {
            case 'CACHE_STATUS':
                console.log('📊 Status do Cache:', payload);
                break;

            case 'CACHE_CLEARED':
                console.log('🗑️ Cache limpo com sucesso');
                break;

            default:
                console.log('📨 Mensagem do SW:', data);
        }
    }

    /**
     * Comunicação com Service Worker
     */
    async sendMessage(message) {
        if (!navigator.serviceWorker.controller) {
            console.warn('⚠️ Nenhum Service Worker ativo');
            return;
        }

        return new Promise((resolve) => {
            const channel = new MessageChannel();

            channel.port1.onmessage = (event) => {
                resolve(event.data);
            };

            navigator.serviceWorker.controller.postMessage(message, [channel.port2]);
        });
    }

    /**
     * Obter status do cache
     */
    async getCacheStatus() {
        return this.sendMessage({ type: 'GET_CACHE_STATUS' });
    }

    /**
     * Limpar todo o cache
     */
    async clearCache() {
        return this.sendMessage({ type: 'CLEAR_CACHE' });
    }

    /**
     * Prefetch URLs
     */
    async prefetchUrls(urls) {
        return this.sendMessage({
            type: 'PREFETCH_URLS',
            payload: { urls }
        });
    }

    /**
     * Verificar se está online
     */
    isOnlineStatus() {
        return this.isOnline;
    }

    /**
     * Verificar se há atualização disponível
     */
    hasUpdateAvailable() {
        return this.updateAvailable;
    }

    /**
     * Registrar callback para eventos
     */
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    /**
     * Remover callback
     */
    off(event, callback) {
        if (this.callbacks[event]) {
            const index = this.callbacks[event].indexOf(callback);
            if (index > -1) {
                this.callbacks[event].splice(index, 1);
            }
        }
    }

    /**
     * Notificar callbacks
     */
    notifyCallbacks(event, data = null) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Erro no callback ${event}:`, error);
                }
            });
        }
    }

    /**
     * Instalar PWA
     */
    async installPWA() {
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            const { outcome } = await window.deferredPrompt.userChoice;

            console.log(`PWA install outcome: ${outcome}`);
            window.deferredPrompt = null;

            return outcome === 'accepted';
        }

        console.warn('⚠️ PWA install prompt não disponível');
        return false;
    }

    /**
     * Verificar se PWA está instalada
     */
    isPWAInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
    }

    /**
     * Obter informações de performance
     */
    getPerformanceInfo() {
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            const paint = performance.getEntriesByType('paint');

            return {
                loadTime: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
                domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
                firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
                firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                transferSize: navigation.transferSize,
                cacheHits: this.getCacheHitRate()
            };
        }

        return null;
    }

    /**
     * Calcular taxa de cache hits (estimativa)
     */
    getCacheHitRate() {
        // Implementação simplificada - em produção seria mais sofisticada
        const resources = performance.getEntriesByType('resource');
        const cachedResources = resources.filter(r => r.transferSize === 0);

        return resources.length > 0 ?
            Math.round((cachedResources.length / resources.length) * 100) : 0;
    }
}

// Inicializar automaticamente quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.SWManager = new ServiceWorkerManager();
    });
} else {
    window.SWManager = new ServiceWorkerManager();
}

// PWA Install Prompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;

    console.log('💾 PWA install prompt disponível');

    // Mostrar botão de instalação se necessário
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
        installButton.style.display = 'block';
    }
});

// PWA Instalada
window.addEventListener('appinstalled', () => {
    console.log('✅ PWA instalada com sucesso');
    window.deferredPrompt = null;

    // Esconder botão de instalação
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
        installButton.style.display = 'none';
    }
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServiceWorkerManager;
} 