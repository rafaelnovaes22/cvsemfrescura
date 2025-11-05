# 🔧 Troubleshooting - Histórico de Análises

## 📊 Status Atual

✅ **Backend funcionando perfeitamente**
- 23 análises no banco de dados
- 5 análises do usuário (Rafael)
- APIs `/api/ats/history` e `/api/ats/analysis/:id` funcionando
- Dados completos e válidos

❌ **Frontend com problema**
- Página fica vazia ao clicar em "Ver Análise"
- Erro de sintaxe corrigido no `results.js`
- Problema pode estar no carregamento ou processamento

## 🔍 Passos para Diagnosticar

### 1. Verificar se o Servidor Backend está Rodando

```bash
# No diretório backend/
npm start
# ou
node server.js
```

**Deve aparecer:**
```
✅ SQLite configurado: dev.sqlite
🚀 Servidor rodando na porta 3000
```

### 2. Testar APIs Diretamente

Abra o navegador e teste:

```
http://localhost:3000/api/ats/history
http://localhost:3000/api/ats/analysis/328c0ad4-d927-4dac-95c8-abc8492c4358
```

**Resultado esperado:** JSON com dados das análises

### 3. Verificar Console do Navegador

1. Abra `history.html`
2. Pressione `F12` para abrir DevTools
3. Vá na aba **Console**
4. Clique em "Ver Análise"
5. Observe os logs

**Logs esperados:**
```
🔍 Carregando análise: 328c0ad4-d927-4dac-95c8-abc8492c4358
📡 Fazendo requisição para: http://localhost:3000/api/ats/analysis/...
✅ Análise carregada com sucesso
💾 Salvando no sessionStorage...
🔄 Redirecionando para results.html...
```

### 4. Verificar SessionStorage

Na página `results.html`, no console:

```javascript
// Verificar se dados estão no sessionStorage
console.log('atsResult:', !!sessionStorage.getItem('atsResult'));
console.log('fileName:', sessionStorage.getItem('fileName'));
console.log('isHistoricalView:', sessionStorage.getItem('isHistoricalView'));

// Ver dados completos
console.log(JSON.parse(sessionStorage.getItem('atsResult')));
```

### 5. Usar Páginas de Teste

Criamos páginas específicas para debug:

1. **`debug-frontend.html`** - Teste completo do frontend
2. **`results-simple-test.html`** - Teste simplificado do results.js

## 🚨 Problemas Comuns e Soluções

### Problema 1: "CONFIG não encontrado"

**Sintoma:** Erro no console sobre CONFIG
**Solução:**
```javascript
// Verificar se config.js está carregando
console.log('CONFIG:', window.CONFIG);
```

### Problema 2: "Token não encontrado"

**Sintoma:** Erro 401 nas APIs
**Solução:**
```javascript
// Verificar token
console.log('Token:', localStorage.getItem('token'));

// Se não houver token, fazer login novamente
```

### Problema 3: "Página fica vazia"

**Sintomas:** 
- `results.html` carrega mas não mostra dados
- Console sem erros aparentes

**Soluções:**
1. Verificar se `results.js` está carregando:
   ```javascript
   console.log('Results.js carregado:', typeof displayCompatibilityScores);
   ```

2. Verificar elementos HTML:
   ```javascript
   console.log('Elemento conclusion:', document.getElementById('conclusion'));
   ```

3. Testar com dados manuais:
   ```javascript
   // Forçar dados no sessionStorage
   sessionStorage.setItem('atsResult', JSON.stringify({
       conclusion: "Teste manual",
       fileName: "teste.pdf",
       isHistoricalView: true
   }));
   location.reload();
   ```

### Problema 4: "Erro de CORS"

**Sintoma:** Erro de CORS no console
**Solução:** Verificar se o servidor backend tem CORS habilitado

### Problema 5: "Erro de CSP (Content Security Policy)"

**Sintoma:** Erro sobre fontes do Google
**Solução:** Temporariamente ignorar (não afeta funcionalidade)

## 🧪 Scripts de Teste Disponíveis

### Backend:
```bash
node backend/debug-complete-flow.js          # Debug completo
node backend/test-user-analyses.js           # Testar análises do usuário
node backend/scripts/validate-history-fix.js # Validação completa
```

### Frontend:
- `debug-frontend.html` - Debug interativo
- `results-simple-test.html` - Teste simplificado
- `test-results-page.html` - Teste com dados simulados

## 📋 Checklist de Verificação

- [ ] Servidor backend rodando na porta 3000
- [ ] APIs retornando dados corretos
- [ ] Token de autenticação válido
- [ ] `config.js` carregando corretamente
- [ ] `results.js` sem erros de sintaxe
- [ ] Elementos HTML existem na página
- [ ] SessionStorage recebendo dados
- [ ] Console sem erros críticos

## 🔧 Comandos de Debug Úteis

### No Console do Navegador:

```javascript
// Ativar debug detalhado
historyLogger.toggleDebug();

// Testar função viewAnalysis
window.viewAnalysis('328c0ad4-d927-4dac-95c8-abc8492c4358');

// Verificar dependências
console.log({
    CONFIG: !!window.CONFIG,
    auth: !!window.auth,
    Sanitizer: !!window.Sanitizer,
    historyLogger: !!window.historyLogger
});

// Limpar storage
sessionStorage.clear();
localStorage.clear();

// Baixar logs de debug
historyLogger.downloadLogs();
```

## 🎯 Próximos Passos

1. **Execute o servidor backend**
2. **Abra `debug-frontend.html`**
3. **Execute os testes na ordem**
4. **Identifique onde está falhando**
5. **Use os comandos de debug específicos**

## 📞 Se Ainda Não Funcionar

Se após todos esses passos ainda não funcionar:

1. **Capture logs completos** do console
2. **Teste com `results-simple-test.html`**
3. **Verifique se há bloqueadores de script**
4. **Teste em modo incógnito**
5. **Verifique se há extensões interferindo**

O backend está 100% funcional, então o problema está definitivamente no frontend e pode ser identificado com esses testes!