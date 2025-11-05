# Design Document

## Overview

O problema no histórico de análises é multifacetado, envolvendo questões no banco de dados, API backend e processamento frontend. A solução requer uma abordagem sistemática para diagnosticar e corrigir cada camada do sistema.

## Architecture

### Fluxo de Dados Atual
```
1. Usuário faz análise → Dados salvos em AnalysisResults
2. Usuário acessa histórico → API /api/ats/history retorna lista
3. Usuário clica "Ver Análise" → API /api/ats/analysis/:id retorna dados
4. Frontend salva no sessionStorage → Redireciona para results.html
5. results.html lê sessionStorage → Exibe dados da análise
```

### Pontos de Falha Identificados
1. **Banco de Dados**: Tabela AnalysisResults pode não existir ou ter estrutura incorreta
2. **Salvamento**: Dados podem não estar sendo salvos corretamente durante a análise
3. **API Backend**: Endpoints podem não estar retornando dados corretos
4. **Frontend**: results.js pode não estar processando dados históricos adequadamente

## Components and Interfaces

### 1. Database Layer (AnalysisResults Model)
```javascript
// Estrutura da tabela AnalysisResults
{
  id: UUID (Primary Key),
  userId: INTEGER (Foreign Key),
  resumeFileName: STRING,
  resumeContent: TEXT,
  jobUrls: JSON,
  result: JSON, // Dados completos da análise
  createdAt: DATE,
  updatedAt: DATE
}
```

### 2. Backend API Endpoints
```javascript
// GET /api/ats/history
// Retorna lista de análises do usuário
Response: [
  {
    id: "uuid",
    fileName: "curriculo.pdf",
    jobUrls: ["url1", "url2"],
    createdAt: "2025-01-15T10:00:00Z",
    jobCount: 3,
    summary: { hasCompatibilityScores: true, hasKeywords: true }
  }
]

// GET /api/ats/analysis/:id
// Retorna dados completos de uma análise específica
Response: {
  // Dados completos da análise original
  conclusion: "...",
  resumo: { nota: 8.5, avaliacao: "..." },
  job_keywords_present: [...],
  jobs: [...],
  isHistoricalView: true,
  fileName: "curriculo.pdf"
}
```

### 3. Frontend Components

#### history.js
- Carrega lista de análises via API
- Configura event listeners para botões "Ver Análise"
- Chama viewAnalysis() com ID da análise

#### results.js
- Detecta se é visualização histórica
- Processa dados do sessionStorage
- Exibe indicador visual para análises históricas
- Preenche todos os campos da interface

## Data Models

### AnalysisResults Table Schema
```sql
CREATE TABLE AnalysisResults (
  id TEXT PRIMARY KEY,
  userId INTEGER NOT NULL,
  resumeFileName TEXT,
  resumeContent TEXT,
  jobUrls TEXT, -- JSON serializado
  result TEXT,  -- JSON serializado com dados completos
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Analysis Result JSON Structure
```javascript
{
  // Dados principais
  conclusion: "Texto da conclusão",
  
  // Avaliações por seção
  resumo: { nota: 8.5, avaliacao: "...", sugestoes: [...] },
  idiomas: { nota: 7.0, avaliacao: "...", sugestoes: [...] },
  formacao: { nota: 9.0, avaliacao: "...", sugestoes: [...] },
  habilidades: { nota: 8.0, avaliacao: "...", sugestoes: [...] },
  informacoes_pessoais: { nota: 7.5, avaliacao: "...", sugestoes: [...] },
  experiencia_profissional: { nota: 8.5, avaliacao: "...", sugestoes: [...] },
  
  // Análise de palavras-chave
  job_keywords: [...],
  job_keywords_present: [...],
  job_keywords_missing: [...],
  job_keywords_with_count: [{ keyword: "...", count: 3 }],
  
  // Dados das vagas
  jobs: [{ title: "...", link: "...", description: "..." }],
  
  // Metadados
  fileName: "curriculo.pdf",
  credits_remaining: 5
}
```

## Error Handling

### Database Errors
- **Tabela não existe**: Criar automaticamente via sync()
- **Dados corrompidos**: Validar JSON antes de salvar/retornar
- **Conexão falha**: Retry com backoff exponencial

### API Errors
- **401 Unauthorized**: Verificar token JWT válido
- **404 Not Found**: Análise não existe ou não pertence ao usuário
- **500 Internal Error**: Log detalhado + resposta genérica

### Frontend Errors
- **SessionStorage vazio**: Exibir mensagem de erro apropriada
- **Dados inválidos**: Validar estrutura antes de processar
- **Campos ausentes**: Exibir placeholder ou mensagem "N/A"

## Testing Strategy

### 1. Database Testing
- Verificar se tabela existe e tem estrutura correta
- Testar criação automática da tabela
- Validar salvamento e recuperação de dados JSON

### 2. API Testing
- Testar endpoints com usuário autenticado
- Verificar filtros de segurança (usuário só acessa suas análises)
- Testar casos de erro (análise inexistente, usuário não autenticado)

### 3. Frontend Testing
- Testar carregamento de dados históricos
- Verificar exibição de indicadores visuais
- Testar casos de erro (dados ausentes, formato inválido)

### 4. Integration Testing
- Fluxo completo: análise → salvamento → histórico → visualização
- Testar com diferentes tipos de análise (com/sem Gupy, diferentes números de vagas)
- Verificar consistência de dados entre análise original e histórica

## Implementation Phases

### Phase 1: Database Diagnosis & Repair
1. Criar script de diagnóstico para verificar estado atual
2. Implementar criação automática da tabela se não existir
3. Validar dados existentes e corrigir inconsistências

### Phase 2: Backend API Fixes
1. Verificar e corrigir salvamento de análises
2. Testar endpoints de histórico
3. Implementar logs detalhados para debug

### Phase 3: Frontend Improvements
1. Melhorar tratamento de erros em results.js
2. Adicionar indicadores visuais para análises históricas
3. Implementar validação robusta de dados

### Phase 4: Testing & Validation
1. Testar fluxo completo com dados reais
2. Verificar diferentes cenários de uso
3. Validar correção do problema original