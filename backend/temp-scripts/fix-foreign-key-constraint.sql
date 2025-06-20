-- Script para corrigir a constraint de chave estrangeira da tabela transactions
-- Este script resolve o erro: "transactions_userId_fkey" violates foreign key constraint

-- Verificar estado atual
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'transactions';

-- Verificar qual tabela de usuários contém os dados
SELECT 'Users' as tabela, COUNT(*) as total_registros FROM "Users"
UNION ALL
SELECT 'users' as tabela, COUNT(*) as total_registros FROM "users";

-- SOLUÇÃO: Corrigir a constraint para apontar para a tabela correta
-- Assumindo que a tabela 'users' (minúscula) é a que contém os dados válidos

-- 1. Remover a constraint atual
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_userId_fkey;

-- 2. Criar a constraint correta apontando para a tabela 'users'
ALTER TABLE transactions 
ADD CONSTRAINT transactions_userId_fkey 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

-- 3. Verificar se a correção funcionou
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'transactions'
    AND tc.constraint_name = 'transactions_userId_fkey';

-- Mensagem de confirmação
SELECT 'Constraint de chave estrangeira corrigida com sucesso!' as "Status",
       'A tabela transactions agora aponta para users (minúscula)' as "Detalhes"; 