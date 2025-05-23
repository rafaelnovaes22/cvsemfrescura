-- Script completo para recriar o banco de dados CV Sem Frescura
-- Este script apaga e recria todas as estruturas necessárias

-- FASE 1: APAGAR ESTRUTURAS EXISTENTES
-- Desativar verificações de chave estrangeira temporariamente
SET session_replication_role = 'replica';

-- Remover todas as tabelas existentes
DROP TABLE IF EXISTS "transactions" CASCADE;
DROP TABLE IF EXISTS "Transactions" CASCADE;
DROP TABLE IF EXISTS "VerificationTokens" CASCADE;
DROP TABLE IF EXISTS "PasswordResets" CASCADE;
DROP TABLE IF EXISTS "AnalysisResults" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "SequelizeMeta" CASCADE;

-- Remover tipos personalizados
DROP TYPE IF EXISTS "enum_transactions_status" CASCADE;
DROP TYPE IF EXISTS "enum_Transactions_status" CASCADE;

-- FASE 2: CRIAR NOVA ESTRUTURA

-- Criar tipos personalizados
CREATE TYPE "enum_transactions_status" AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Criar tabela de usuários
CREATE TABLE "Users" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password" VARCHAR(255) NOT NULL,
  "email_verified" BOOLEAN DEFAULT FALSE,
  "onboarding_completed" BOOLEAN DEFAULT FALSE,
  "job_area" VARCHAR(255),
  "experience_level" VARCHAR(255),
  "preferences" JSONB,
  "credits" INTEGER DEFAULT 1,
  "stripeCustomerId" VARCHAR(255),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Criar tabela de tokens de verificação
CREATE TABLE "VerificationTokens" (
  "id" UUID PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "token" VARCHAR(255) NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "VerificationTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users" ("id") ON DELETE CASCADE
);

-- Criar tabela de redefinição de senha
CREATE TABLE "PasswordResets" (
  "id" UUID PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "token" VARCHAR(255) NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "PasswordResets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users" ("id") ON DELETE CASCADE
);

-- Criar tabela de resultados de análise
CREATE TABLE "AnalysisResults" (
  "id" UUID PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "resumeFileName" VARCHAR(255),
  "resumeContent" TEXT,
  "jobUrls" JSONB,
  "result" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "AnalysisResults_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users" ("id") ON DELETE CASCADE
);

-- Criar tabela de transações
CREATE TABLE "transactions" (
  "id" UUID PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "amount" FLOAT NOT NULL,
  "credits" INTEGER NOT NULL,
  "status" "enum_transactions_status" DEFAULT 'pending',
  "paymentMethod" VARCHAR(255),
  "paymentIntentId" VARCHAR(255),
  "stripeCustomerId" VARCHAR(255),
  "metadata" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users" ("id") ON DELETE CASCADE
);

-- Criar tabela de controle de migrações Sequelize
CREATE TABLE "SequelizeMeta" (
  "name" VARCHAR(255) NOT NULL,
  PRIMARY KEY ("name")
);

-- Criar índices para otimização de consultas
CREATE INDEX "idx_users_email" ON "Users" ("email");
CREATE INDEX "idx_verification_tokens_token" ON "VerificationTokens" ("token");
CREATE INDEX "idx_password_resets_token" ON "PasswordResets" ("token");
CREATE INDEX "idx_transactions_userId" ON "transactions" ("userId");
CREATE INDEX "idx_analysis_results_userId" ON "AnalysisResults" ("userId");

-- Registrar migrações aplicadas manualmente
INSERT INTO "SequelizeMeta" ("name") VALUES 
('20250522_fix_transaction_user_id.js'),
('add-onboarding-columns.js');

-- Restaurar verificações de chave estrangeira
SET session_replication_role = 'origin';

-- Criar usuário de teste (opcional)
INSERT INTO "Users" ("name", "email", "password", "email_verified", "credits", "createdAt", "updatedAt") 
VALUES ('Teste', 'teste@example.com', '$2b$10$3euPgdRxQK/M7QYp/2Hs5.e8DdspL1ChBLfYQmUsRlvhMCmcRLcf6', TRUE, 5, NOW(), NOW());

-- Mensagem de confirmação
SELECT 'Banco de dados CV Sem Frescura recriado com sucesso!' as "Mensagem";
