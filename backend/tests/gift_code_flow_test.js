const fetch = global.fetch || require('node-fetch');

const BASE = 'http://localhost:3000';
const CODE = 'TESTE123';

async function validateCode() {
    const res = await fetch(`${BASE}/api/gift-code/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: CODE })
    });
    const data = await res.json();
    if (!data.valid) throw new Error('Código inválido: ' + JSON.stringify(data));
    console.log('✅ Código validado com sucesso');
}

async function registerUser(email) {
    const res = await fetch(`${BASE}/api/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Teste User', email, password: '123456' })
    });
    if (res.status === 400) {
        const err = await res.json();
        throw new Error('Falha no registro: ' + err.error);
    }
    if (!res.ok) throw new Error('Erro interno no registro');
    console.log('✅ Registro criado para', email);
}

async function loginUser(email) {
    const res = await fetch(`${BASE}/api/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: '123456' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Erro login: ' + data.error);
    console.log('✅ Login ok para', email);
    return { token: data.token, user: data.user };
}

async function applyCode(token) {
    const res = await fetch(`${BASE}/api/gift-code/apply`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: CODE })
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Erro aplicar código: ' + data.error);
    console.log('🎁 Código aplicado. Créditos adicionados:', data.creditsAdded, 'Total:', data.totalCredits);
}

async function getCredits(token) {
    const res = await fetch(`${BASE}/api/user/credits`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Erro buscar créditos');
    return data.credits;
}

(async () => {
    try {
        await validateCode();
        // Novo usuário (email com timestamp)
        const newEmail = `novo_${Date.now()}@exemplo.com`;
        await registerUser(newEmail);
        const newLogin = await loginUser(newEmail);
        await applyCode(newLogin.token);
        const creditsNewUser = await getCredits(newLogin.token);
        console.log('💰 Créditos final novo usuário:', creditsNewUser);

        // Usuário existente (reutilizar para segunda aplicação)
        const existingEmail = 'existe@exemplo.com';
        // Se não existir, registrar rapidamente
        try { await registerUser(existingEmail); } catch { }
        const existingLogin = await loginUser(existingEmail);
        await applyCode(existingLogin.token);
        const creditsExisting = await getCredits(existingLogin.token);
        console.log('💰 Créditos final usuário existente:', creditsExisting);

        console.log('\n🏆 Teste concluído com sucesso!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Teste falhou:', err.message);
        process.exit(1);
    }
})(); 