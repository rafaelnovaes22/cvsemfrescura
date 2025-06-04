// Script de debug temporário para verificar tokens
console.log('🔍 Debug de Token Iniciado');

// Verificar se o token está presente
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');

console.log('📋 Token presente:', !!token);
console.log('📋 User presente:', !!user);

if (token) {
    console.log('🔑 Token length:', token.length);
    console.log('🔑 Token preview:', token.substring(0, 20) + '...');

    // Tentar decodificar o token (base64)
    try {
        const parts = token.split('.');
        if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            console.log('📊 Token payload:', payload);
            console.log('⏰ Expira em:', new Date(payload.exp * 1000));
            console.log('🕒 Agora:', new Date());
            console.log('✅ Token válido?', payload.exp * 1000 > Date.now());
        }
    } catch (error) {
        console.error('❌ Erro ao decodificar token:', error);
    }
}

if (user) {
    try {
        const userData = JSON.parse(user);
        console.log('👤 User data:', userData);
    } catch (error) {
        console.error('❌ Erro ao fazer parse dos dados do usuário:', error);
    }
}

// Função para limpar dados inválidos
window.debugClearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('🗑️ Dados de autenticação limpos');
    location.reload();
}; 