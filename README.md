# CV Sem Frescura

Sistema de análise de currículos que identifica palavras-chave relevantes para vagas de emprego e fornece recomendações personalizadas para otimização.

## Funcionalidades

- Extração de núcleos substantivos concisos das descrições de vagas
- Análise de correspondência entre currículo e requisitos das vagas
- Identificação de palavras-chave presentes e ausentes no currículo
- Recomendações personalizadas para melhorias
- Conclusão detalhada sobre o estado atual do currículo

## Estrutura do Projeto

- `backend/`: API e lógica de processamento em Python
  - `modules/`: Módulos principais (análise de CV, interface com IA, etc.)
  - `utils/`: Utilitários (formatação, extração de texto, etc.)
  - `database/`: Configuração e operações de banco de dados
  - `uploads/`: Diretório para arquivos enviados pelos usuários
- `frontend/`: Interface do usuário
  - `assets/`: Recursos estáticos (CSS, JS, imagens)

## Tecnologias Utilizadas

- Backend: Python, Flask
- Frontend: HTML, CSS, JavaScript
- IA: OpenAI GPT-4 Turbo para análise de texto
- Armazenamento: SQLite

## Instalação

1. Clone o repositório
2. Configure as variáveis de ambiente no arquivo `.env`
3. Instale as dependências:
   ```
   pip install -r backend/requirements.txt
   ```
4. Execute o servidor:
   ```
   python backend/app.py
   ```

## Uso

1. Acesse a aplicação pelo navegador
2. Faça upload do seu currículo
3. Adicione links de vagas de interesse
4. Receba análise detalhada e recomendações personalizadas

## Resolução de Problemas

### Limite de Tokens

O sistema utiliza o modelo GPT-4 Turbo da OpenAI para análise de currículos, que suporta até 128K tokens de contexto. Anteriormente, usávamos o modelo padrão GPT-4 com limite de 8K tokens, o que causava erros quando currículos ou descrições de vagas eram muito extensos.

#### Solução Implementada

- Atualização do modelo de `gpt-4` para `gpt-4-turbo` no arquivo `backend/modules/ai_interface.py`
- Esta mudança permite processar documentos maiores sem atingir o limite de tokens
- O modelo mantém a mesma qualidade de análise com capacidade expandida

Se você encontrar erros relacionados a limites de tokens nos logs (`logs/app_YYYYMMDD.log`), verifique se o modelo configurado é `gpt-4-turbo`.
