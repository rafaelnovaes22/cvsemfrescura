-- Script para recriar o banco de dados do CV Sem Frescura
-- Executar como usuário postgres ou outro com permissões adequadas

-- Desativando verificações de chave estrangeira temporariamente
SET session_replication_role = 'replica';

-- Apagando tabelas existentes (ordem inversa das dependências)
DROP TABLE IF EXISTS "Transactions" CASCADE;
DROP TABLE IF EXISTS "VerificationTokens" CASCADE;
DROP TABLE IF EXISTS "PasswordResets" CASCADE;
DROP TABLE IF EXISTS "AnalysisResults" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;
DROP TABLE IF EXISTS "SequelizeMeta" CASCADE;

-- Recriando tabelas na ordem correta

-- Tabela de usuários
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
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tabela de tokens de verificação
CREATE TABLE "VerificationTokens" (
  "id" UUID PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "token" VARCHAR(255) NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT "VerificationTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users" ("id") ON DELETE CASCADE
);

-- Tabela de redefinição de senha
CREATE TABLE "PasswordResets" (
  "id" UUID PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "token" VARCHAR(255) NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT "PasswordResets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users" ("id") ON DELETE CASCADE
);

-- Tabela de resultados de análise
CREATE TABLE "AnalysisResults" (
  "id" UUID PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "resumeFileName" VARCHAR(255),
  "resumeContent" TEXT,
  "jobUrls" JSONB,
  "result" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT "AnalysisResults_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users" ("id") ON DELETE CASCADE
);

-- Tabela de transações
CREATE TABLE "Transactions" (
  "id" UUID PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "amount" FLOAT NOT NULL,
  "credits" INTEGER NOT NULL,
  "status" VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  "paymentMethod" VARCHAR(255),
  "paymentIntentId" VARCHAR(255),
  "stripeCustomerId" VARCHAR(255),
  "metadata" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT "Transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users" ("id") ON DELETE CASCADE
);

-- Tabela para controle de migrações do Sequelize
CREATE TABLE "SequelizeMeta" (
  "name" VARCHAR(255) NOT NULL,
  PRIMARY KEY ("name")
);

-- Criando índices para melhorar performance
CREATE INDEX "idx_users_email" ON "Users" ("email");
CREATE INDEX "idx_verification_tokens_token" ON "VerificationTokens" ("token");
CREATE INDEX "idx_password_resets_token" ON "PasswordResets" ("token");
CREATE INDEX "idx_transactions_userId" ON "Transactions" ("userId");
CREATE INDEX "idx_analysis_results_userId" ON "AnalysisResults" ("userId");

-- Inserindo registro para a migração que estamos aplicando manualmente
INSERT INTO "SequelizeMeta" ("name") VALUES ('20250522_fix_transaction_user_id.js');

-- Restaurando verificações de chave estrangeira
SET session_replication_role = 'origin';

-- Comentário final
SELECT 'Banco de dados CV Sem Frescura recriado com sucesso!' as "Mensagem";
