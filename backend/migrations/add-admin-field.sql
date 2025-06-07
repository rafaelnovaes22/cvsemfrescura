-- Migration: Adicionar campo isAdmin à tabela users
-- Data: 2024
-- Descrição: Adiciona controle de acesso administrativo

-- Verificar se a coluna já existe antes de adicionar
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'isAdmin'
    ) THEN
        -- Adicionar coluna isAdmin
        ALTER TABLE users ADD COLUMN "isAdmin" BOOLEAN DEFAULT false;
        
        -- Atualizar todos os usuários existentes para não serem admin por padrão
        UPDATE users SET "isAdmin" = false WHERE "isAdmin" IS NULL;
        
        -- Adicionar constraint NOT NULL
        ALTER TABLE users ALTER COLUMN "isAdmin" SET NOT NULL;
        
        RAISE NOTICE 'Campo isAdmin adicionado com sucesso à tabela users';
    ELSE
        RAISE NOTICE 'Campo isAdmin já existe na tabela users';
    END IF;
END $$;

-- Criar índice para performance (opcional)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_admin 
ON users ("isAdmin") 
WHERE "isAdmin" = true; 