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

// Logout
function logout() {
    clearAuth();
    window.location.reload();
}

// Expor funções globalmente
window.auth = {
    registerUser,
    loginUser,
    fetchProfile,
    logout,
    getUser,
    getToken,
    saveAuth,
    clearAuth
};
