# 🎁 Guia Completo: Código de Presente para Sorteio

## 📋 Código Gerado
**SORTEIO1LMHG6**

## 🎯 Como Funciona
- ✅ Sistema já implementado e funcionando
- ✅ Código pode ser usado **APENAS 1 vez**
- ✅ Primeira pessoa que usar ganha 1 análise gratuita
- ✅ Após o uso, código fica automaticamente indisponível
- ✅ Sistema previne uso duplicado pelo mesmo usuário
- ✅ Rastreamento completo de quem usou e quando

## 🔧 Como Criar o Código no Sistema

### Opção 1: Via API (Recomendado)
```bash
POST /api/gift-code/create
Authorization: Bearer [SEU_TOKEN_ADMIN]
Content-Type: application/json

{
  "code": "SORTEIO1LMHG6",
  "maxUses": 1,
  "description": "Código de sorteio - uso único"
}
```

### Opção 2: Direto no PostgreSQL
```sql
INSERT INTO gift_codes (
  code, description, "isActive", "usedCount", "maxUses", "expiresAt", "createdAt", "updatedAt"
) VALUES (
  'SORTEIO1LMHG6',
  'Código de sorteio - uso único',
  true,
  0,
  1,
  NULL,
  NOW(),
  NOW()
);
```

## 📱 Links para Compartilhamento

### Produção
```
https://cvsemfrescura.com.br/analisar?giftCode=SORTEIO1LMHG6
```

### Teste Local
```
http://localhost:3000/analisar?giftCode=SORTEIO1LMHG6
```

## 🔍 Como Monitorar o Sorteio

Execute este comando para verificar o status:
```bash
node backend/check-sorteio-status.js SORTEIO1LMHG6
```

Isso mostrará:
- ✅ Se o código ainda está disponível
- 🏆 Quem ganhou (se alguém já usou)
- 📅 Quando foi usado
- 📊 Estatísticas gerais

## 🎲 Como Fazer o Sorteio

1. **Criar o código** (usando uma das opções acima)
2. **Compartilhar o link** nas suas redes sociais
3. **Primeira pessoa** que clicar e se cadastrar/logar ganha
4. **Monitorar** usando o script de verificação
5. **Anunciar o ganhador** baseado no resultado do sistema

## 🛡️ Proteções Implementadas

- ❌ **Não permite uso duplo** pelo mesmo usuário
- ❌ **Não permite uso após esgotar limite** (1 uso)
- ❌ **Não permite uso de códigos inativos**
- ❌ **Não permite uso de códigos expirados**
- ✅ **Registra histórico completo** de uso
- ✅ **Interface amigável** com mensagens claras
- ✅ **Incrementa créditos automaticamente**

## 🔄 Códigos de Backup (para futuros sorteios)

Se quiser fazer mais sorteios:
- SORTEIOQHX47N
- SORTEIOIX54VU  
- SORTEIONSUOEF

## 📝 Exemplo de Post para Redes Sociais

```
🎁 SORTEIO ESPECIAL! 🎁

A primeira pessoa que usar este link ganha uma análise de currículo GRATUITA!

👆 Clique agora: https://cvsemfrescura.com.br/analisar?giftCode=SORTEIO1LMHG6

⚡ Apenas 1 pessoa pode usar
⚡ Válido até alguém resgatar
⚡ Análise completa com IA

#Sorteio #CurriculoGratis #CVSemFrescura
```

## 🚨 Importante

- O código **SORTEIO1LMHG6** precisa ser criado no sistema primeiro
- Teste sempre em ambiente local antes de usar em produção
- O sistema de gift codes já está 100% implementado e testado
- Use o script de monitoramento para acompanhar o sorteio

## ✅ Status do Sistema

- ✅ Modelos de banco (GiftCode, GiftCodeUsage) - OK
- ✅ Controllers (validação, aplicação) - OK  
- ✅ Rotas API (/api/gift-code/*) - OK
- ✅ Frontend (interface de código) - OK
- ✅ Proteções de segurança - OK
- ✅ Rastreamento de uso - OK
- ✅ Scripts de monitoramento - OK

**O sistema está pronto! Apenas crie o código e use! 🚀** 