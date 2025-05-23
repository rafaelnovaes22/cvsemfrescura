// auth.js - Gerenciamento de autenticação e perfil para CV Sem Frescura

// URL base para endpoints de usuários
const API_URL = 'http://localhost:3000/api/user';

// Salva token e dados do usuário no localStorage
function saveAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

// Remove dados de autenticação
function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

// Recupera token
function getToken() {
    return localStorage.getItem('token');
}

// Recupera dados do usuário
function getUser() {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch {
        return null;
    }
}

// Registro de usuário
async function registerUser(name, email, password) {
    const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao registrar');
    return await res.json();
}

// Login de usuário
async function loginUser(email, password) {
    const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao logar');
    const data = await res.json();

    // Buscar créditos do usuário imediatamente após login
    try {
        const creditsRes = await fetch(`${API_URL}/credits`, {
            headers: { 'Authorization': `Bearer ${data.token}` }
        });
        if (creditsRes.ok) {
            const creditsData = await creditsRes.json();
            // Adicionar créditos ao objeto do usuário antes de salvar
            data.user.credits = creditsData.credits;
        }
    } catch (error) {
        console.error('Erro ao buscar créditos:', error);
        // Definir créditos como 0 em caso de erro
        data.user.credits = 0;
    }

    saveAuth(data.token, data.user);
    return data.user;
}

// Buscar perfil autenticado
async function fetchProfile() {
    const token = getToken();
    if (!token) throw new Error('Não autenticado');
    const res = await fetch(`${API_URL}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao buscar perfil');
    return await res.json();
}

// Verificar se o usuário está autenticado
function isAuthenticated() {
    return !!getToken();
}

// Logout
function logout() {
    clearAuth();
    // Limpar dados relacionados ao código de presente
    localStorage.removeItem('pendingGiftCode');
    localStorage.removeItem('isGiftCodeUser');
    localStorage.removeItem('giftCode');

    // Limpar parâmetros da URL se existirem
    const currentUrl = new URL(window.location);
    if (currentUrl.searchParams.has('giftCode')) {
        currentUrl.searchParams.delete('giftCode');
        window.history.replaceState({}, document.title, currentUrl.pathname + currentUrl.search);
    }

    // Função adicional para garantir limpeza completa
    cleanupAllGiftCodeData();

    // Redirecionar para a landing page após logout
    window.location.href = 'landing.html';
}

// Função para limpeza completa de dados de código de presente
function cleanupAllGiftCodeData() {
    // Limpar localStorage
    localStorage.removeItem('pendingGiftCode');
    localStorage.removeItem('isGiftCodeUser');
    localStorage.removeItem('giftCode');

    // Limpar sessionStorage se houver dados relacionados
    sessionStorage.removeItem('pendingGiftCode');
    sessionStorage.removeItem('isGiftCodeUser');
    sessionStorage.removeItem('giftCode');

    // Limpar parâmetros da URL
    const currentUrl = new URL(window.location);
    if (currentUrl.searchParams.has('giftCode')) {
        currentUrl.searchParams.delete('giftCode');
        window.history.replaceState({}, document.title, currentUrl.pathname + currentUrl.search);
    }

    console.log('Todos os dados de código de presente foram limpos.');
}

// Buscar créditos atualizados do usuário
async function fetchUserCredits(forceRefresh = false) {
    const token = getToken();
    if (!token) return 0;

    try {
        const res = await fetch(`${API_URL}/credits`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Erro ao buscar créditos');

        const data = await res.json();
        const credits = data.credits || 0;

        // Atualizar créditos no objeto do usuário
        const user = getUser();
        if (user) {
            user.credits = credits;
            localStorage.setItem('user', JSON.stringify(user));

            // Atualizar UI se existir função de atualização
            if (window.updateAnalyzeButton && forceRefresh) {
                window.updateAnalyzeButton(credits);
            }
        }

        return credits;
    } catch (error) {
        console.error('Erro ao buscar créditos:', error);
        return getUser()?.credits || 0;
    }
}

// Expor funções globalmente
window.auth = {
    registerUser,
    loginUser,
    fetchProfile,
    fetchUserCredits,
    getToken,
    getUser,
    isAuthenticated,
    logout,
    saveAuth,
    clearAuth,
    cleanupAllGiftCodeData
};
