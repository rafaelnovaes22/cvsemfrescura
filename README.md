# CV Sem Frescura

O CV Sem Frescura é uma ferramenta de análise de currículos que ajuda candidatos a entenderem como seu currículo se compara com requisitos de vagas específicas.

## Funcionalidades

- Análise de currículo em relação a vagas específicas
- Extração de palavras-chave de vagas
- Identificação de palavras-chave presentes e ausentes no currículo
- Recomendações para melhorar o currículo
- Avaliação de compatibilidade com sistemas ATS
- Análise detalhada de cada seção do currículo

## Tecnologias

- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **Backend**: Node.js, Express
- **API**: OpenAI (GPT-4o)

## Instalação

```bash
# Clone o repositório
git clone [URL_DO_REPOSITÓRIO]

# Navegue até o diretório do projeto
cd cv-sem-frescura

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais da OpenAI

# Inicie o servidor
npm run dev
```

## Configuração

Você precisa definir as seguintes variáveis de ambiente no arquivo `.env`:

```
PORT=3000
OPENAI_API_KEY=sua_chave_api_aqui
```

## Uso

1. Acesse a aplicação em `http://localhost:3000`
2. Faça o upload do seu currículo (PDF, DOC ou DOCX)
3. Opcionalmente, adicione links de vagas para comparação
4. Aguarde a análise ser concluída
5. Explore os resultados detalhados da análise

## Licença

Este projeto está licenciado sob a licença MIT.

## Contato

Para dúvidas ou sugestões, entre em contato pelo email: [seu-email@exemplo.com] 