# Guia de Depuração para Erro de Autenticação Google OAuth

Este guia fornece instruções detalhadas para diagnosticar e corrigir o erro "The given origin is not allowed for the given client ID" ao configurar o login com Google.

## Erros Identificados

Os seguintes erros foram identificados no console do navegador:

1. `[GSI_LOGGER]: The given origin is not allowed for the given client ID.`
2. `The fetch of the id assertion endpoint resulted in a network error: ERR_FAILED`
3. `The provider's token fetch resulted in an error response code.`
4. `[GSI_LOGGER]: FedCM get() rejects with IdentityCredentialError: Error retrieving a token.`

## Diagnóstico Passo a Passo

### Passo 1: Identificar a Origem Exata da Requisição

1. Abra o console do navegador (F12)
2. Na aba "Console", observe o erro completo
3. Identifique a origem exata da requisição:
   - Verifique a URL completa na barra de endereços do navegador
   - Anote o protocolo (http/https), domínio e porta (se houver)
   - Exemplo: `http://localhost:5000` ou `file:///C:/Users/Rafael/CVSEMFRESCURA/cvsemfrescura/login.html`

### Passo 2: Verificar as Configurações no Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione o projeto "CV Sem Frescura"
3. No menu lateral, vá para "APIs e serviços" > "Credenciais"
4. Clique no ID do cliente OAuth que você está usando
5. Verifique as "Origens JavaScript autorizadas":
   - Confirme se a origem exata identificada no Passo 1 está listada
   - Se estiver usando `file://`, certifique-se de que `file://` está listado
   - Se estiver usando `http://localhost`, verifique se a porta está correta (ex: `http://localhost:5000`)

### Passo 3: Verificar a Tela de Consentimento OAuth

1. No menu lateral, vá para "APIs e serviços" > "Tela de consentimento OAuth"
2. Verifique se a tela de consentimento está configurada corretamente:
   - Tipo de usuário: "Externo"
   - Nome do aplicativo: "CV Sem Frescura"
   - Domínios autorizados: deve incluir o domínio da sua aplicação
   - URLs de política de privacidade e termos de serviço: devem estar configuradas
   - Escopos: `email`, `profile`, `openid`

### Passo 4: Verificar o Status do Projeto

1. No menu lateral, vá para "APIs e serviços" > "Painel"
2. Verifique se a API "Google Identity Services" está ativada
3. Se não estiver, clique em "Ativar APIs e serviços" e ative-a

### Passo 5: Verificar o Client ID no Código

1. Abra o arquivo `frontend/assets/js/login.js`
2. Localize a função `initGoogleLogin`
3. Verifique se o `client_id` corresponde exatamente ao ID do cliente nas credenciais do Google Cloud Console

## Configurações Exatas Necessárias

Com base nos erros identificados, aqui estão as configurações exatas que devem ser incluídas no Google Cloud Console:

### 1. Origens JavaScript Autorizadas

Adicione **todas** as seguintes origens:

```
http://localhost
http://localhost:5000
http://localhost:8000  # Servidor Python atual
https://cvsemfrescura.com.br
file://
```

### 2. URIs de Redirecionamento Autorizados

Adicione **todas** as seguintes URIs:

```
http://localhost/login.html
http://localhost:5000/login.html
http://localhost:8000/login.html  # Servidor Python atual
https://cvsemfrescura.com.br/login.html
```

### 3. Configurações Adicionais Importantes

1. **Tipo de Aplicativo**: Certifique-se de que o tipo de aplicativo está definido como "Aplicativo da Web"
2. **Status de Publicação**: Se o aplicativo estiver em desenvolvimento, certifique-se de que seu e-mail está adicionado como usuário de teste
3. **Domínios Autorizados**: Adicione `localhost` e `cvsemfrescura.com.br` como domínios autorizados na tela de consentimento OAuth

## Solução para Casos Específicos

### Se estiver usando arquivo HTML local (file://)

Se você está abrindo o arquivo HTML diretamente (usando `file://`), há limitações adicionais:

1. Adicione `file://` às origens JavaScript autorizadas
2. Alguns navegadores têm restrições de segurança para arquivos locais. Considere usar um servidor local simples como:
   - Python: `python -m http.server 5000`
   - Node.js: `npx serve -l 5000`

### Se estiver usando um servidor local

Se você está usando um servidor local, certifique-se de que:

1. A porta no URL corresponde exatamente à porta nas origens autorizadas
2. O servidor está configurado para servir HTTPS se você estiver usando origens HTTPS
3. O domínio `localhost` está autorizado na tela de consentimento OAuth

## Passos Finais de Verificação

1. Limpe o cache do navegador
2. Reinicie o navegador
3. Verifique se não há bloqueadores de cookies ou extensões que possam interferir
4. Tente em um navegador diferente para isolar problemas específicos do navegador

## Configuração Completa do Projeto no Google Cloud Console

Para garantir que todas as configurações necessárias estejam corretas, aqui está um resumo completo da configuração do projeto:

1. **Projeto**: "CV Sem Frescura"
2. **Tela de consentimento OAuth**:
   - Tipo de usuário: Externo
   - Nome do aplicativo: CV Sem Frescura
   - E-mail de suporte ao usuário: [seu e-mail]
   - Domínios autorizados: `localhost`, `cvsemfrescura.com.br`
   - URLs de política de privacidade: `http://localhost:5000/privacy.html`, `https://cvsemfrescura.com.br/privacy.html`
   - URLs de termos de serviço: `http://localhost:5000/terms.html`, `https://cvsemfrescura.com.br/terms.html`
   - Escopos: `email`, `profile`, `openid`
   - Usuários de teste: [seu e-mail]

3. **Credenciais OAuth 2.0**:
   - Tipo de aplicativo: Aplicativo da Web
   - Nome: CV Sem Frescura
   - Origens JavaScript autorizadas:
     - `http://localhost`
     - `http://localhost:5000`
     - `https://cvsemfrescura.com.br`
     - `file://`
   - URIs de redirecionamento autorizados:
     - `http://localhost/login.html`
     - `http://localhost:5000/login.html`
     - `https://cvsemfrescura.com.br/login.html`

4. **APIs Ativadas**:
   - Google Identity Services API
   - Google Sign-In API

Após fazer essas alterações, aguarde alguns minutos para que as alterações sejam propagadas nos servidores do Google antes de testar novamente.
