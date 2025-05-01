# CV Sem Frescura - Backend ATS

Backend Node.js/Express para análise ATS detalhada de currículos e vagas, com integração à OpenAI.

## Como rodar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Crie um arquivo `.env` com sua chave OpenAI:
   ```env
   OPENAI_API_KEY=sua-chave-aqui
   PORT=3000
   ```
3. Rode o servidor:
   ```bash
   npm run dev
   ```

## Endpoints

- `POST /api/ats/analyze`
  - Form-data: `resume` (arquivo PDF/DOC/DOCX), `jobLinks` (JSON com links de vagas)
  - Retorna: palavras-chave das vagas, encontradas, ausentes, recomendações e conclusão.

