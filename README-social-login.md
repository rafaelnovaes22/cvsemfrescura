# Configuração de Login Social - Google OAuth

Este documento contém instruções detalhadas para configurar o login social com Google para o sistema CV Sem Frescura, com foco específico na resolução do erro "The given origin is not allowed for the given client ID".

## Configuração do Google OAuth - Passo a Passo

### Passo 1: Criar um projeto no Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em "Selecionar um projeto" no topo da página
3. Clique em "Novo projeto"
4. Dê um nome ao projeto (ex: "CV Sem Frescura")
5. Clique em "Criar"
6. Aguarde a criação do projeto e selecione-o

### Passo 2: Configurar a tela de consentimento OAuth

1. No menu lateral, vá para "APIs e serviços" > "Tela de consentimento OAuth"
2. Selecione o tipo de usuário "Externo" e clique em "Criar"
3. Preencha as informações obrigatórias:
   - Nome do aplicativo: "CV Sem Frescura"
   - E-mail de suporte ao usuário: seu e-mail
   - Logotipo do aplicativo: faça upload do logotipo (opcional)
   - Domínio do aplicativo: seu domínio (ex: cvsemfrescura.com.br) ou deixe em branco para desenvolvimento
   - E-mail para contato do desenvolvedor: seu e-mail
4. Clique em "Salvar e continuar"
5. Na seção "Escopos", adicione os seguintes escopos (mínimos necessários):
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
6. Clique em "Salvar e continuar"
7. Na seção "Usuários de teste", adicione os e-mails que poderão testar o aplicativo enquanto estiver em desenvolvimento
   - Isso é crucial para testar o aplicativo antes da verificação
   - Adicione seu próprio e-mail e quaisquer outros e-mails de testadores
8. Clique em "Salvar e continuar"
9. Revise as informações e clique em "Voltar ao painel"

### Passo 3: Adicionar URLs de Política de Privacidade e Termos de Serviço

1. Volte para "APIs e serviços" > "Tela de consentimento OAuth"
2. Clique em "Editar aplicativo"
3. Adicione as URLs para:
   - Política de privacidade: `http://localhost/privacy.html` (desenvolvimento) ou `https://cvsemfrescura.com.br/privacy.html` (produção)
   - Termos de serviço: `http://localhost/terms.html` (desenvolvimento) ou `https://cvsemfrescura.com.br/terms.html` (produção)
4. Clique em "Salvar e continuar"

### Passo 4: Criar credenciais OAuth 2.0

1. No menu lateral, vá para "APIs e serviços" > "Credenciais"
2. Clique em "Criar credenciais" e selecione "ID do cliente OAuth"
3. Selecione o tipo de aplicativo "Aplicativo da Web"
4. Dê um nome à credencial: "CV Sem Frescura"
   - Este nome é usado apenas para identificar o cliente no console e não será mostrado aos usuários finais
   - Os domínios dos URIs incluídos serão automaticamente adicionados à tela de consentimento do OAuth como domínios autorizados

5. **IMPORTANTE**: Em "Origens JavaScript autorizadas", adicione EXATAMENTE:
   - URIs 1: `http://localhost:5000`
   - URIs 2: `http://localhost:8000` (Servidor Python atual)
   - URIs 3: `https://cvsemfrescura.com.br`
   - URIs 4: `file://` (Se precisar usar arquivos locais)

6. Em "URIs de redirecionamento autorizados", adicione EXATAMENTE:
   - URIs 1: `http://localhost:5000/login.html`
   - URIs 2: `http://localhost:8000/login.html` (Servidor Python atual)
   - URIs 3: `https://cvsemfrescura.com.br/login.html`

7. Clique em "Criar"
8. Anote o "ID do cliente" que será exibido (você precisará dele para o código)

### Passo 5: Configurar o código para usar o Client ID

1. Abra o arquivo `frontend/assets/js/login.js`
2. Localize a função `initGoogleLogin`
3. Substitua `'YOUR_GOOGLE_CLIENT_ID'` pelo seu Client ID do Google:

```javascript
function initGoogleLogin() {
    google.accounts.id.initialize({
        client_id: 'SEU_CLIENT_ID_AQUI', // Substitua pelo Client ID obtido no passo 4
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: 'signin',
        ux_mode: 'popup',
        scope: 'email profile openid',
        prompt_parent_id: 'googleLogin',
        state_cookie_domain: window.location.hostname,
        nonce: generateNonce(),
        itp_support: true
    });
    
    // Resto da função...
}
```

### Passo 6: Configurar o botão customizado do Google

1. Abra o arquivo `login.html`
2. Verifique se o botão customizado do Google está configurado corretamente:

```html
<button type="button" class="social-button" id="customGoogleLogin">
    <svg class="social-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
        <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
    </svg>
    Google
</button>
```

3. Abra o arquivo `frontend/assets/js/login.js`
4. Verifique se o event listener para o botão customizado está configurado para usar o Google Sign-In API:

```javascript
customGoogleLoginBtn.addEventListener('click', function() {
    // Verificar se o Google Sign-In API está carregado
    if (typeof google !== 'undefined' && google.accounts) {
        // Iniciar o fluxo de autenticação do Google
        google.accounts.id.prompt();
    } else {
        showLoginError('API do Google não está disponível. Por favor, tente novamente mais tarde.');
    }
});
```

### Passo 7: Verificar a inclusão do script do Google Sign-In API

1. Abra o arquivo `login.html`
2. Verifique se o script do Google Sign-In API está incluído corretamente:

```html
<!-- Google Sign-In API -->
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

### Passo 8: Testar o login com Google

1. Abra o arquivo `login.html` no navegador
   - Se estiver usando um servidor local, acesse `http://localhost:5000/login.html`
   - Se estiver abrindo diretamente, certifique-se de que adicionou `file://` às origens autorizadas
2. Clique no botão "Google"
3. Você deve ver a janela de login do Google
4. Após fazer login, você deve ser redirecionado de volta para o aplicativo

## Solução de Problemas Específicos

### Erro: "The given origin is not allowed for the given client ID"

Este erro ocorre quando a origem da requisição não está autorizada no Google Cloud Console. Para resolver:

1. **Verifique a origem exata da sua requisição**:
   - Abra o console do navegador (F12)
   - Na aba "Console", observe o erro completo
   - Identifique a origem que está sendo usada (ex: `http://localhost`, `http://localhost:5000`, `file://`)

2. **Adicione a origem exata às origens autorizadas**:
   - Volte ao Google Cloud Console > "APIs e serviços" > "Credenciais"
   - Edite o ID do cliente OAuth
   - Em "Origens JavaScript autorizadas", adicione a origem exata identificada no passo anterior
   - Clique em "Salvar"

3. **Verifique o protocolo**:
   - Se estiver usando `file://` para abrir o HTML diretamente, adicione `file://` às origens autorizadas
   - Se estiver usando um servidor local, certifique-se de incluir a porta correta (ex: `http://localhost:5000`)

4. **Limpe o cache do navegador**:
   - Às vezes, o navegador armazena em cache as configurações antigas
   - Limpe o cache e os cookies do navegador
   - Reinicie o navegador e tente novamente

5. **Verifique o Client ID no código**:
   - Certifique-se de que o Client ID no código corresponde exatamente ao Client ID nas credenciais do Google Cloud Console
   - Não deve haver espaços extras, caracteres especiais ou erros de digitação

6. **Aguarde a propagação das alterações**:
   - Às vezes, as alterações nas configurações do Google Cloud Console podem levar alguns minutos para serem propagadas
   - Aguarde alguns minutos e tente novamente

### Erro: "Popup closed by user"

Este erro ocorre quando o usuário fecha a janela de login do Google antes de concluir o processo. Para melhorar a experiência:

1. **Use o modo popup**:
   - Certifique-se de que `ux_mode` está definido como `'popup'` na configuração do Google Sign-In
   - Isso evita redirecionamentos completos da página

2. **Verifique bloqueadores de popup**:
   - Certifique-se de que o navegador não está bloqueando popups
   - Adicione o site à lista de exceções de bloqueadores de popup

### Erro: "idpiframe_initialization_failed"

Este erro ocorre quando há problemas na inicialização do iframe do Google Sign-In. Para resolver:

1. **Verifique a configuração do Client ID**:
   - Certifique-se de que o Client ID está correto
   - Verifique se o tipo de aplicativo está definido como "Aplicativo da Web"

2. **Verifique as origens autorizadas**:
   - Certifique-se de que a origem exata está autorizada

3. **Verifique a tela de consentimento OAuth**:
   - Certifique-se de que a tela de consentimento OAuth está configurada corretamente
   - Verifique se os escopos necessários estão adicionados

## Configuração do Backend para Autenticação Google

Para que o backend possa validar os tokens do Google e autenticar os usuários, siga estas etapas:

1. Abra o arquivo `.env` na pasta `backend`
2. Adicione ou atualize as seguintes variáveis:

```
# Google OAuth
GOOGLE_CLIENT_ID=seu_client_id_do_google
GOOGLE_CLIENT_SECRET=seu_client_secret_do_google
```

3. Certifique-se de que o módulo de autenticação do backend está configurado para validar tokens do Google:

```python
# Em backend/modules/auth.py
@auth_bp.route('/api/auth/google', methods=['POST'])
def google_auth():
    data = request.get_json()
    token = data.get('token')
    
    # Verificar o token com a API do Google
    try:
        idinfo = id_token.verify_oauth2_token(
            token, requests.Request(), Config.GOOGLE_CLIENT_ID)
        
        # Verificar o emissor do token
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Token emitido por emissor não confiável')
        
        # Extrair informações do usuário
        user_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')
        
        # Verificar se o usuário já existe no banco de dados
        # Se não existir, criar um novo usuário
        # Gerar token JWT para o usuário
        
        # Retornar token JWT e informações do usuário
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user_id,
                'email': email,
                'name': name,
                'picture': picture
            }
        })
    
    except ValueError as e:
        # Token inválido
        return jsonify({'error': str(e)}), 401
```

## Conclusão

Seguindo estes passos detalhados, você deve conseguir resolver o erro "The given origin is not allowed for the given client ID" e implementar com sucesso o login com Google em seu aplicativo. Lembre-se de que a configuração correta das origens JavaScript autorizadas é crucial para o funcionamento do login com Google.

Se você continuar enfrentando problemas, verifique o console do navegador para mensagens de erro mais específicas e ajuste as configurações conforme necessário.
