#!/usr/bin/env node

/**
 * Script de Setup Inicial do Administrador
 * Garante que APENAS o email específico tenha permissões de admin
 * Execução automática: node backend/scripts/setup-admin.js
 */

const sequelize = require('../db');
const User = require('../models/user');

// ⚠️ IMPORTANTE: Apenas este email terá permissões de administrador
const ADMIN_EMAIL = 'rafaeldenovaes@gmail.com';

async function setupAdmin() {
    try {
        console.log('🔧 Iniciando configuração de administrador...\n');
        
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados\n');

        // 1. Remover privilégios de admin de TODOS os usuários
        console.log('🔒 Removendo privilégios de admin de todos os usuários...');
        await User.update(
            { isAdmin: false },
            { where: {} }
        );
        console.log('✅ Privilégios removidos\n');

        // 2. Buscar o usuário administrador principal
        console.log(`🔍 Buscando administrador principal: ${ADMIN_EMAIL}`);
        const adminUser = await User.findOne({ 
            where: { email: ADMIN_EMAIL } 
        });

        if (!adminUser) {
            console.log(`\n⚠️ ATENÇÃO: Usuário ${ADMIN_EMAIL} não encontrado no banco de dados!\n`);
            console.log('📝 Próximos passos:');
            console.log(`   1. Acesse: http://localhost:3000/analisar.html`);
            console.log(`   2. Crie uma conta com o email: ${ADMIN_EMAIL}`);
            console.log(`   3. Execute este script novamente: node backend/scripts/setup-admin.js\n`);
            process.exit(1);
        }

        // 3. Promover APENAS este usuário a admin
        console.log(`\n🚀 Promovendo ${adminUser.name} a administrador único...`);
        await adminUser.update({ isAdmin: true });

        // 4. Verificar configuração
        const allAdmins = await User.findAll({ 
            where: { isAdmin: true },
            attributes: ['id', 'name', 'email', 'isAdmin']
        });

        console.log(`\n✅ SUCESSO! Configuração de administrador concluída!\n`);
        console.log('═'.repeat(60));
        console.log('👑 ADMINISTRADOR ÚNICO DO SISTEMA');
        console.log('═'.repeat(60));
        console.log(`   👤 Nome: ${adminUser.name}`);
        console.log(`   📧 Email: ${adminUser.email}`);
        console.log(`   💳 Créditos: ${adminUser.credits}`);
        console.log(`   📅 Criado em: ${new Date(adminUser.createdAt).toLocaleDateString('pt-BR')}`);
        console.log('═'.repeat(60));
        console.log();

        // Verificar se há mais de um admin (não deveria)
        if (allAdmins.length > 1) {
            console.log('⚠️ AVISO: Foram encontrados múltiplos admins no banco!');
            console.log('🔧 Corrigindo automaticamente...\n');
            
            for (const user of allAdmins) {
                if (user.email !== ADMIN_EMAIL) {
                    await user.update({ isAdmin: false });
                    console.log(`   ❌ Removido admin de: ${user.email}`);
                }
            }
            console.log('\n✅ Correção concluída! Agora há apenas 1 admin.\n');
        }

        console.log('📋 Próximos passos:');
        console.log('   1. Faça logout se estiver logado');
        console.log('   2. Faça login com o email: ' + ADMIN_EMAIL);
        console.log('   3. Acesse o painel admin: http://localhost:3000/admin.html');
        console.log('   4. Link discreto no footer da landing page: ⚙️ Admin\n');

        console.log('🔐 Segurança:');
        console.log('   ✅ Apenas ' + ADMIN_EMAIL + ' tem acesso admin');
        console.log('   ✅ Todos os outros usuários são normais');
        console.log('   ✅ Configuração protegida e automatizada\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Erro ao configurar administrador:', error.message);
        console.error('🔧 Detalhes:', error);
        process.exit(1);
    }
}

// Executar setup
setupAdmin();

