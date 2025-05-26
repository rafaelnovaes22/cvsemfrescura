-- Inicialização do banco de dados CV Sem Frescura (PostgreSQL)
-- Este arquivo é executado automaticamente quando o container PostgreSQL é criado

-- Criar extensões úteis se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- O database já é criado pelo POSTGRES_DB
-- Conectar ao database criado

-- Log de inicialização (comentado pois o Sequelize cria as tabelas automaticamente)
-- CREATE TABLE IF NOT EXISTS init_check (
--     id SERIAL PRIMARY KEY,
--     initialized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- INSERT INTO init_check (initialized_at) VALUES (CURRENT_TIMESTAMP);

-- Dados iniciais podem ser adicionados aqui se necessário 
-- O Sequelize criará as tabelas automaticamente via migrations 