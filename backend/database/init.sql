-- Inicialização do banco de dados CV Sem Frescura
-- Este arquivo é executado automaticamente quando o container MySQL é criado

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Criar database se não existir
CREATE DATABASE IF NOT EXISTS cv_sem_frescura CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cv_sem_frescura;

-- Verificar se as tabelas já existem antes de criar
-- O Sequelize criará as tabelas automaticamente via migrations
-- Este arquivo apenas garante que o database existe

-- Log de inicialização
INSERT INTO information_schema.tables (table_schema, table_name) VALUES ('cv_sem_frescura', 'init_check') 
ON DUPLICATE KEY UPDATE table_name = table_name;

SET FOREIGN_KEY_CHECKS = 1;

-- Dados iniciais podem ser adicionados aqui se necessário 