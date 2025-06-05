// Configurações do Frontend - CV Sem Frescura
console.log('🔧 Carregando config.js v2.4...');

const CONFIG = {
  // Configurações da API baseadas no ambiente
  api: {
    // Detectar ambiente automaticamente
    baseUrl: (() => {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      const port = window.location.port;

      console.log('🌐 Detectando ambiente:', { hostname, protocol, port });

      // DESENVOLVIMENTO
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        console.log('🏠 Ambiente detectado: DESENVOLVIMENTO');
        // Sempre usar porta 3000 em desenvolvimento
        return 'http://localhost:3000';
      }

      // PRODUÇÃO - usar URLs relativas (mesmo domínio/servidor)
      // O servidor Express serve tanto frontend quanto API
      console.log('🚀 Ambiente detectado: PRODUÇÃO');
      return ''; // URL relativa - vai usar o mesmo servidor
    })(),
    endpoints: {
      payment: '/api/payment',
      user: '/api/user',
      ats: '/api/ats',
      config: '/api/config'
    }
  },

  // Ambiente atual detectado automaticamente
  environment: (() => {
    const hostname = window.location.hostname;
    return (hostname === 'localhost' || hostname === '127.0.0.1') ? 'development' : 'production';
  })()
};

// Cache para a chave obtida do backend
let _cachedStripeKey = null;

// ✅ FUNÇÃO PRINCIPAL: Busca chave do backend (dinâmica)
const getStripeKey = async () => {
  // Se já temos a chave em cache, retornar
  if (_cachedStripeKey) {
    return _cachedStripeKey;
  }

  try {
    console.log('🔄 Buscando chave Stripe do backend (.env)...');

    const response = await fetch(`${CONFIG.api.baseUrl}/api/config/stripe-key`);

    if (response.ok) {
      const data = await response.json();

      if (!data.publishableKey) {
        throw new Error('Chave não encontrada na resposta do backend');
      }

      // Validar formato da chave
      if (!data.publishableKey.startsWith('pk_')) {
        throw new Error('Formato de chave inválido');
      }

      _cachedStripeKey = data.publishableKey;
      console.log('✅ Chave Stripe obtida do backend:', _cachedStripeKey?.substring(0, 20) + '...');
      return _cachedStripeKey;
    } else {
      throw new Error(`Backend retornou: ${response.status} - ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Erro ao obter chave do backend:', error.message);
    console.error('💡 Certifique-se de que:');
    console.error('   - O backend está funcionando corretamente');
    console.error('   - O arquivo .env tem STRIPE_PUBLISHABLE_KEY configurado');
    console.error('   - A rota /api/config/stripe-key está funcionando');
    return null;
  }
};

// Função auxiliar para limpar cache (útil para testes)
const clearStripeKeyCache = () => {
  _cachedStripeKey = null;
  console.log('🗑️ Cache da chave Stripe limpo');
};

// Função para obter URL da API
const getApiUrl = (endpoint) => {
  return CONFIG.api.baseUrl + CONFIG.api.endpoints[endpoint];
};

// Função para verificar se backend está acessível
const checkBackendConnection = async () => {
  try {
    const response = await fetch(`${CONFIG.api.baseUrl}/api/config/stripe-key`);
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Exportar configurações globalmente
window.CONFIG = CONFIG;
window.getStripeKey = getStripeKey;
window.clearStripeKeyCache = clearStripeKeyCache;
window.getApiUrl = getApiUrl;
window.checkBackendConnection = checkBackendConnection;

console.log('✅ CONFIG criado com sucesso!');
console.log('📊 CONFIG.api.baseUrl:', CONFIG.api.baseUrl);
console.log('🔗 window.CONFIG:', typeof window.CONFIG, !!window.CONFIG); 