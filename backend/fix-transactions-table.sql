-- Script para corrigir a tabela transactions
-- Este script corrige o tipo da coluna userId de UUID para INTEGER

-- Removendo a tabela existente com o tipo incorreto
DROP TABLE IF EXISTS "transactions" CASCADE;

-- Recriando a tabela com o tipo correto para userId
CREATE TABLE "transactions" (
  "id" UUID PRIMARY KEY,
  "userId" INTEGER NOT NULL, -- Agora é INTEGER para corresponder com Users.id
  "amount" FLOAT NOT NULL,
  "credits" INTEGER NOT NULL,
  "status" VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  "paymentMethod" VARCHAR(255),
  "paymentIntentId" VARCHAR(255),
  "stripeCustomerId" VARCHAR(255),
  "metadata" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users" ("id") ON DELETE CASCADE
);

-- Criando índice para melhorar performance
CREATE INDEX "idx_transactions_userId" ON "transactions" ("userId");

SELECT 'Tabela transactions corrigida com sucesso!' as "Mensagem";
