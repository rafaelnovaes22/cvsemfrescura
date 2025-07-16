/**
 * FASE FINAL: SERVICE WORKER AVANÇADO - destravaCV
 * Cache Inteligente + Estratégias de Rede + Suporte Offline
 * Versão: 3.0.0
 */

const CACHE_VERSION = 'cv-sem-frescura-v3.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Recursos críticos que devem ser cached imediatamente
const CRITICAL_RESOURCES = [
    '/',
    '/index.html',
    '/landing.html',
    '/analisar.html',
    '/assets/css/critical.css',
    '/assets/css/responsive-critical.css',
    '/assets/js/performance-optimizer.js',
    '/assets/js/responsive-manager.js',
    '/assets/js/auth-optimized.js',
    '/assets/img/novo_logo.png',
    '/assets/img/logo-optimized.svg',
    '/manifest.json'
];

// Recursos que podem ser cached sob demanda
const CACHEABLE_RESOURCES = [
    '/payment.html',
    '/contact.html',
    '/privacy.html',
    '/terms.html',
    '/assets/css/landing.min.css',
    '/assets/css/header.css',
    '/assets/js/config.js',
    '/assets/js/header-new.js'
];

// APIs que devem ter cache com TTL
const API_ENDPOINTS = [
    '/api/user/profile',
    '/api/user/credits',
    '/api/config/stripe-key'
];

// Estratégias de cache
const CACHE_STRATEGIES = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
    NETWORK_ONLY: 'network-only',
    CACHE_ONLY: 'cache-only'
};

// TTL para diferentes tipos de recursos (em segundos)
const CACHE_TTL = {
    STATIC: 7 * 24 * 60 * 60,      // 7 dias
    DYNAMIC: 24 * 60 * 60,         // 1 dia
    API: 5 * 60,                   // 5 minutos
    IMAGES: 30 * 24 * 60 * 60      // 30 dias
};

/**
 * Event: Install
 * Cache recursos críticos
 */
self.addEventListener('install', event => {
    console.log('🔧 Service Worker: Instalando v' + CACHE_VERSION);

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('📦 Cache: Armazenando recursos críticos');
                return cache.addAll(CRITICAL_RESOURCES);
            })
            .then(() => {
                console.log('✅ Service Worker: Instalação concluída');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Erro na instalação do SW:', error);
            })
    );
});

/**
 * Event: Activate
 * Limpar caches antigos
 */
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker: Ativando v' + CACHE_VERSION);

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => {
                            return cacheName.startsWith('cv-sem-frescura-') &&
                                cacheName !== STATIC_CACHE &&
                                cacheName !== DYNAMIC_CACHE &&
                                cacheName !== API_CACHE &&
                                cacheName !== IMAGE_CACHE;
                        })
                        .map(cacheName => {
                            console.log('🗑️ Cache: Removendo cache antigo:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('✅ Service Worker: Ativação concluída');
                return self.clients.claim();
            })
    );
});

/**
 * Event: Fetch
 * Interceptar requests e aplicar estratégias de cache
 */
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // Ignorar requests não-GET
    if (request.method !== 'GET') {
        return;
    }

    // Ignorar requests para outros domínios (exceto APIs conhecidas)
    if (url.origin !== location.origin && !isKnownAPI(url)) {
        return;
    }

    // Determinar estratégia baseada no tipo de recurso
    const strategy = getStrategy(request);

    event.respondWith(
        handleRequest(request, strategy)
            .catch(error => {
                console.error('❌ Erro no fetch:', error);
                return handleOfflineResponse(request);
            })
    );
});

/**
 * Determina a estratégia de cache baseada no request
 */
function getStrategy(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // APIs - Network First com fallback
    if (pathname.startsWith('/api/')) {
        return CACHE_STRATEGIES.NETWORK_FIRST;
    }

    // Imagens - Cache First
    if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
        return CACHE_STRATEGIES.CACHE_FIRST;
    }

    // CSS/JS - Stale While Revalidate
    if (pathname.match(/\.(css|js)$/i)) {
        return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
    }

    // HTML - Network First
    if (pathname.match(/\.(html?)$/i) || pathname === '/') {
        return CACHE_STRATEGIES.NETWORK_FIRST;
    }

    // Outros recursos - Stale While Revalidate
    return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
}

/**
 * Executa a estratégia de cache apropriada
 */
async function handleRequest(request, strategy) {
    switch (strategy) {
        case CACHE_STRATEGIES.CACHE_FIRST:
            return cacheFirst(request);

        case CACHE_STRATEGIES.NETWORK_FIRST:
            return networkFirst(request);

        case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
            return staleWhileRevalidate(request);

        case CACHE_STRATEGIES.NETWORK_ONLY:
            return fetch(request);

        case CACHE_STRATEGIES.CACHE_ONLY:
            return caches.match(request);

        default:
            return networkFirst(request);
    }
}

/**
 * Estratégia: Cache First
 * Busca no cache primeiro, rede como fallback
 */
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse && !isExpired(cachedResponse)) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            await cacheResponse(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        if (cachedResponse) {
            console.log('📦 Usando cache expirado como fallback');
            return cachedResponse;
        }
        throw error;
    }
}

/**
 * Estratégia: Network First
 * Busca na rede primeiro, cache como fallback
 */
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            await cacheResponse(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            console.log('📦 Usando cache como fallback para rede');
            return cachedResponse;
        }

        throw error;
    }
}

/**
 * Estratégia: Stale While Revalidate
 * Retorna cache imediatamente e atualiza em background
 */
async function staleWhileRevalidate(request) {
    const cachedResponse = await caches.match(request);

    // Fetch em background para atualizar cache
    const fetchPromise = fetch(request)
        .then(networkResponse => {
            if (networkResponse.ok) {
                cacheResponse(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch(error => {
            console.log('⚠️ Falha na atualização em background:', error);
        });

    // Retorna cache se disponível, senão aguarda rede
    if (cachedResponse && !isExpired(cachedResponse)) {
        return cachedResponse;
    }

    return fetchPromise;
}

/**
 * Cache uma resposta no cache apropriado
 */
async function cacheResponse(request, response) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    let cacheName;

    if (pathname.startsWith('/api/')) {
        cacheName = API_CACHE;
    } else if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
        cacheName = IMAGE_CACHE;
    } else if (CRITICAL_RESOURCES.includes(pathname) || pathname === '/') {
        cacheName = STATIC_CACHE;
    } else {
        cacheName = DYNAMIC_CACHE;
    }

    try {
        const cache = await caches.open(cacheName);

        // Adicionar timestamp para TTL
        const responseWithTimestamp = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: {
                ...response.headers,
                'sw-cached-at': Date.now().toString()
            }
        });

        await cache.put(request, responseWithTimestamp);
        console.log(`📦 Cached: ${pathname} em ${cacheName}`);
    } catch (error) {
        console.error('❌ Erro ao cachear:', error);
    }
}

/**
 * Verifica se uma resposta cached expirou
 */
function isExpired(response) {
    const cachedAt = response.headers.get('sw-cached-at');

    if (!cachedAt) {
        return false; // Se não tem timestamp, considera válido
    }

    const now = Date.now();
    const cached = parseInt(cachedAt);
    const url = new URL(response.url);
    const pathname = url.pathname;

    let ttl;

    if (pathname.startsWith('/api/')) {
        ttl = CACHE_TTL.API * 1000;
    } else if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
        ttl = CACHE_TTL.IMAGES * 1000;
    } else if (CRITICAL_RESOURCES.includes(pathname)) {
        ttl = CACHE_TTL.STATIC * 1000;
    } else {
        ttl = CACHE_TTL.DYNAMIC * 1000;
    }

    return (now - cached) > ttl;
}

/**
 * Verifica se é uma API conhecida
 */
function isKnownAPI(url) {
    const knownAPIs = [
        'api.stripe.com',
        'fonts.googleapis.com',
        'fonts.gstatic.com'
    ];

    return knownAPIs.some(api => url.hostname.includes(api));
}

/**
 * Resposta para quando está offline
 */
async function handleOfflineResponse(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Para páginas HTML, retorna página offline
    if (pathname.match(/\.(html?)$/i) || pathname === '/') {
        return new Response(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Offline - destravaCV</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        text-align: center;
                        padding: 2rem;
                    }
                    .offline-container {
                        max-width: 400px;
                    }
                    .offline-icon {
                        font-size: 4rem;
                        margin-bottom: 1rem;
                    }
                    h1 {
                        margin-bottom: 1rem;
                        font-size: 2rem;
                    }
                    p {
                        margin-bottom: 2rem;
                        opacity: 0.9;
                        line-height: 1.6;
                    }
                    .retry-btn {
                        background: rgba(255, 255, 255, 0.2);
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        color: white;
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 1rem;
                        backdrop-filter: blur(10px);
                    }
                    .retry-btn:hover {
                        background: rgba(255, 255, 255, 0.3);
                    }
                </style>
            </head>
            <body>
                <div class="offline-container">
                    <div class="offline-icon">📱</div>
                    <h1>Você está offline</h1>
                    <p>Não foi possível conectar ao destravaCV. Verifique sua conexão com a internet e tente novamente.</p>
                    <button class="retry-btn" onclick="window.location.reload()">
                        Tentar Novamente
                    </button>
                </div>
            </body>
            </html>
        `, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8'
            }
        });
    }

    // Para outros recursos, retorna erro 503
    return new Response('Service Unavailable', {
        status: 503,
        statusText: 'Service Unavailable'
    });
}

/**
 * Event: Message
 * Comunicação com a aplicação principal
 */
self.addEventListener('message', event => {
    const { type, payload } = event.data;

    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'GET_CACHE_STATUS':
            getCacheStatus().then(status => {
                event.ports[0].postMessage({ type: 'CACHE_STATUS', payload: status });
            });
            break;

        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
            });
            break;

        case 'PREFETCH_URLS':
            prefetchUrls(payload.urls);
            break;
    }
});

/**
 * Obter status do cache
 */
async function getCacheStatus() {
    const cacheNames = await caches.keys();
    const status = {};

    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        status[cacheName] = {
            count: keys.length,
            urls: keys.map(req => req.url)
        };
    }

    return status;
}

/**
 * Limpar todos os caches
 */
async function clearAllCaches() {
    const cacheNames = await caches.keys();

    return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
}

/**
 * Prefetch URLs
 */
async function prefetchUrls(urls) {
    const cache = await caches.open(DYNAMIC_CACHE);

    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response);
                console.log(`🔄 Prefetched: ${url}`);
            }
        } catch (error) {
            console.log(`⚠️ Falha no prefetch: ${url}`, error);
        }
    }
}

/**
 * Background Sync para requests offline
 */
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(handleBackgroundSync());
    }
});

async function handleBackgroundSync() {
    console.log('🔄 Executando background sync');

    // Aqui você pode implementar lógica para:
    // - Reenviar formulários que falharam
    // - Sincronizar dados offline
    // - Atualizar cache de recursos críticos
}

console.log('🚀 Service Worker carregado - v' + CACHE_VERSION); 