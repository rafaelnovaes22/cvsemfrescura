-- Script SQL para corrigir permissões de administrador
-- Adicionar coluna isAdmin se não existir
ALTER TABLE users ADD COLUMN isAdmin INTEGER DEFAULT 0;

-- Promover o usuário mais recente a administrador
UPDATE users 
SET isAdmin = 1 
WHERE id = (
    SELECT id 
    FROM users 
    ORDER BY createdAt DESC 
    LIMIT 1
);

-- Verificar resultado
SELECT 
    id,
    name,
    email,
    isAdmin,
    createdAt
FROM users 
ORDER BY createdAt DESC; 