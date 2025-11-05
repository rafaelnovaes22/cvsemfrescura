# Requirements Document

## Introduction

O sistema de histórico de análises não está funcionando corretamente. Quando o usuário clica em "Ver Análise" na página de histórico, a página de resultados fica vazia, não exibindo os dados da análise previamente realizada. Este problema impede que os usuários revisitem suas análises anteriores, comprometendo a experiência do usuário e o valor do produto.

## Requirements

### Requirement 1

**User Story:** Como um usuário logado, eu quero visualizar minhas análises anteriores no histórico, para que eu possa revisar os resultados sem consumir créditos adicionais.

#### Acceptance Criteria

1. WHEN o usuário acessa a página de histórico THEN o sistema SHALL exibir uma lista de todas as análises realizadas pelo usuário
2. WHEN o usuário clica em "Ver Análise" THEN o sistema SHALL redirecionar para a página de resultados com os dados da análise específica
3. WHEN a página de resultados carrega uma análise histórica THEN o sistema SHALL exibir todos os dados da análise original (conclusão, avaliações, palavras-chave, scores)
4. WHEN uma análise histórica é visualizada THEN o sistema SHALL indicar claramente que é uma visualização histórica e não consumir créditos

### Requirement 2

**User Story:** Como um usuário, eu quero que o sistema salve corretamente minhas análises no banco de dados, para que eu possa acessá-las posteriormente.

#### Acceptance Criteria

1. WHEN uma análise é concluída com sucesso THEN o sistema SHALL salvar todos os dados da análise na tabela AnalysisResults
2. WHEN os dados são salvos THEN o sistema SHALL incluir o resultado completo da análise em formato JSON
3. WHEN a tabela AnalysisResults não existir THEN o sistema SHALL criar a tabela automaticamente
4. WHEN há erro ao salvar THEN o sistema SHALL registrar o erro em logs mas não interromper o fluxo da análise

### Requirement 3

**User Story:** Como um usuário, eu quero que a API de histórico retorne os dados corretos das minhas análises, para que o frontend possa exibi-los adequadamente.

#### Acceptance Criteria

1. WHEN a API /api/ats/history é chamada THEN o sistema SHALL retornar uma lista das análises do usuário autenticado
2. WHEN a API /api/ats/analysis/:id é chamada THEN o sistema SHALL retornar os dados completos da análise específica
3. WHEN uma análise não pertence ao usuário THEN o sistema SHALL retornar erro 404
4. WHEN o usuário não está autenticado THEN o sistema SHALL retornar erro 401

### Requirement 4

**User Story:** Como um usuário, eu quero que a página de resultados processe corretamente os dados históricos, para que eu possa ver todas as informações da minha análise anterior.

#### Acceptance Criteria

1. WHEN a página de resultados recebe dados do sessionStorage THEN o sistema SHALL verificar se são dados históricos
2. WHEN são dados históricos THEN o sistema SHALL exibir um indicador visual de que é uma análise do histórico
3. WHEN os dados históricos são processados THEN o sistema SHALL preencher todos os campos da análise (conclusão, avaliações, scores, palavras-chave)
4. WHEN não há dados no sessionStorage THEN o sistema SHALL exibir uma mensagem de erro apropriada

### Requirement 5

**User Story:** Como um desenvolvedor, eu quero ter ferramentas de debug para diagnosticar problemas no histórico de análises, para que eu possa identificar e corrigir rapidamente falhas no sistema.

#### Acceptance Criteria

1. WHEN há problemas no histórico THEN o sistema SHALL fornecer logs detalhados sobre o processo
2. WHEN a tabela não existe THEN o sistema SHALL criar automaticamente com a estrutura correta
3. WHEN há dados corrompidos THEN o sistema SHALL identificar e reportar o problema
4. WHEN há inconsistências THEN o sistema SHALL fornecer informações para correção