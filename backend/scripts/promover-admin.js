#!/usr/bin/env node

/**
 * Script para promover um usuário a administrador
 * Uso: node backend/scripts/promover-admin.js email@exemplo.com
 */

const sequelize = require('../db');
const User = require('../models/user');

async function promoverAdmin(email) {
    try {
        console.log('🔧 Conectando ao banco de dados...');
        await sequelize.authenticate();
        console.log('✅ Conectado com sucesso!\n');

        // Buscar usuário pelo email
        console.log(`🔍 Buscando usuário: ${email}`);
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.error(`\n❌ Erro: Usuário não encontrado!`);
            console.log(`\n💡 Dica: Verifique se o email está correto.`);
            console.log(`📧 Email fornecido: ${email}\n`);
            process.exit(1);
        }

        // Verificar se já é admin
        if (user.isAdmin) {
            console.log(`\n✅ O usuário já é administrador!`);
            console.log(`\n📊 Informações do usuário:`);
            console.log(`   👤 Nome: ${user.name}`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   👑 Admin: SIM`);
            console.log(`   💳 Créditos: ${user.credits}`);
            console.log(`   📅 Criado em: ${new Date(user.createdAt).toLocaleDateString('pt-BR')}\n`);
            process.exit(0);
        }

        // Promover a admin
        console.log(`\n🚀 Promovendo ${user.name} a administrador...`);
        await user.update({ isAdmin: true });

        console.log(`\n🎉 SUCESSO! Usuário promovido a administrador!\n`);
        console.log(`📊 Informações atualizadas:`);
        console.log(`   👤 Nome: ${user.name}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👑 Admin: SIM ✅`);
        console.log(`   💳 Créditos: ${user.credits}`);
        console.log(`   📅 Criado em: ${new Date(user.createdAt).toLocaleDateString('pt-BR')}\n`);

        console.log(`✨ Próximos passos:`);
        console.log(`   1. Faça logout se estiver logado`);
        console.log(`   2. Faça login novamente com este email`);
        console.log(`   3. Acesse: http://localhost:3000/admin.html`);
        console.log(`   4. Você terá acesso ao painel administrativo!\n`);

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Erro ao promover usuário:', error.message);
        console.error('\n🔧 Detalhes do erro:', error);
        process.exit(1);
    }
}

// Email padrão do administrador principal
const ADMIN_EMAIL = 'rafaeldenovaes@gmail.com';

// Verificar se foi fornecido um email (caso contrário, usar o padrão)
const email = process.argv[2] || ADMIN_EMAIL;

if (!process.argv[2]) {
    console.log(`\n💡 Nenhum email fornecido, usando administrador padrão: ${ADMIN_EMAIL}\n`);
}

// Validar formato básico do email
if (!email.includes('@') || !email.includes('.')) {
    console.log('\n❌ Erro: Email inválido!\n');
    console.log(`📧 Email fornecido: ${email}`);
    console.log('💡 Forneça um email válido no formato: usuario@exemplo.com\n');
    process.exit(1);
}

// Executar promoção
promoverAdmin(email);

