-- ========================================
-- CÓDIGO DE SORTEIO ÚNICO - PRONTO PARA USAR
-- ========================================
-- Execute este SQL no seu PostgreSQL de produção

INSERT INTO gift_codes (
  code, 
  description, 
  "isActive", 
  "usedCount", 
  "maxUses", 
  "expiresAt", 
  "createdAt", 
  "updatedAt"
) VALUES (
  'SORTEIOVQLJ29',
  'Código de sorteio - uso único',
  true,
  0,
  1,
  NULL,
  NOW(),
  NOW()
);

-- ========================================
-- VERIFICAR SE FOI CRIADO COM SUCESSO
-- ========================================
SELECT 
  code,
  description,
  "isActive",
  "usedCount",
  "maxUses",
  "expiresAt",
  "createdAt"
FROM gift_codes 
WHERE code = 'SORTEIOVQLJ29';

-- ========================================
-- LINK PARA COMPARTILHAMENTO
-- ========================================
-- https://cvsemfrescura.com.br/analisar?giftCode=SORTEIOVQLJ29

-- ========================================
-- COMANDO PARA MONITORAR O SORTEIO
-- ========================================
-- node backend/check-sorteio-status.js SORTEIOVQLJ29 