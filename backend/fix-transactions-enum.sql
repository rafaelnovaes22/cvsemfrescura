-- Script para corrigir o tipo enum na tabela transactions

-- Removendo a tabela existente 
DROP TABLE IF EXISTS "transactions" CASCADE;

-- Criando o tipo enum para status se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_transactions_status') THEN
        CREATE TYPE "enum_transactions_status" AS ENUM ('pending', 'completed', 'failed', 'refunded');
    END IF;
END
$$;

-- Recriando a tabela com o tipo enum correto
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
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users" ("id") ON DELETE CASCADE
);

-- Criando índice
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_transactions_userId') THEN
        CREATE INDEX "idx_transactions_userId" ON "transactions" ("userId");
    END IF;
END
$$;

SELECT 'Tabela transactions e enum corrigidos com sucesso!' as "Mensagem";
