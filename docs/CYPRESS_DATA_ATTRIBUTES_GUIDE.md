# 🎯 Guia de Atributos data-cy para Testes E2E

## 📋 Introdução

Este guia documenta os padrões para adicionar atributos `data-cy` aos elementos HTML, facilitando a criação e manutenção de testes E2E com Cypress.

## 🏷️ Padrões de Nomenclatura

### Convenções Gerais
- Use kebab-case: `data-cy="user-profile-button"`
- Seja descritivo mas conciso
- Evite IDs genéricos como `data-cy="button1"`
- Prefira nomes semânticos sobre posicionais

### Categorias de Elementos

#### 1. Formulários
```html
<!-- Inputs -->
<input data-cy="email-input" type="email">
<input data-cy="password-input" type="password">
<textarea data-cy="job-description-textarea"></textarea>

<!-- Botões de ação -->
<button data-cy="submit-button">Enviar</button>
<button data-cy="cancel-button">Cancelar</button>

<!-- Seletores -->
<select data-cy="country-select">
  <option data-cy="country-option-br">Brasil</option>
</select>
```

#### 2. Navegação
```html
<!-- Links de menu -->
<a data-cy="nav-home" href="/">Início</a>
<a data-cy="nav-analysis" href="/analisar">Análise</a>
<a data-cy="nav-history" href="/history">Histórico</a>

<!-- Abas -->
<button data-cy="transactions-tab">Transações</button>
<button data-cy="analyses-tab">Análises</button>
```

#### 3. Listagens e Tabelas
```html
<!-- Tabelas -->
<table data-cy="transactions-table">
  <thead>
    <tr>
      <th data-cy="header-date">Data</th>
      <th data-cy="header-amount">Valor</th>
    </tr>
  </thead>
  <tbody>
    <tr data-cy="transaction-row">
      <td data-cy="transaction-date">01/01/2025</td>
      <td data-cy="transaction-amount">R$ 29,90</td>
    </tr>
  </tbody>
</table>

<!-- Listas -->
<ul data-cy="analysis-list">
  <li data-cy="analysis-item">
    <span data-cy="analysis-score">85%</span>
    <button data-cy="view-analysis-btn">Ver</button>
  </li>
</ul>
```

#### 4. Modais e Alertas
```html
<!-- Modal -->
<div data-cy="confirmation-modal">
  <h3 data-cy="modal-title">Confirmar ação</h3>
  <button data-cy="modal-confirm">Confirmar</button>
  <button data-cy="modal-cancel">Cancelar</button>
</div>

<!-- Alertas -->
<div data-cy="error-alert" class="alert-error">
  <span data-cy="error-message">Erro ao processar</span>
  <button data-cy="retry-button">Tentar novamente</button>
</div>
```

#### 5. Estados Vazios
```html
<div data-cy="empty-transactions">
  <p>Nenhuma transação encontrada</p>
  <button data-cy="start-shopping">Começar agora</button>
</div>
```

## 📝 Implementação no Projeto

### history.html
```html
<!-- Adicionar aos elementos existentes -->
<button class="tab-button active" data-cy="transactions-tab" onclick="switchTab('transactions')">
  💳 Transações
</button>

<button class="tab-button" data-cy="analyses-tab" onclick="switchTab('analyses')">
  📊 Análises de Currículo
</button>

<div data-cy="empty-transactions" class="empty-state">
  <p>Nenhuma transação encontrada</p>
</div>

<div data-cy="empty-analyses" class="empty-state">
  <p>Nenhuma análise encontrada</p>
  <button data-cy="start-analysis-btn">Fazer primeira análise</button>
</div>

<!-- Filtros e busca -->
<select data-cy="date-filter">
  <option value="all">Todos</option>
  <option value="7days">Últimos 7 dias</option>
  <option value="30days">Últimos 30 dias</option>
</select>

<input data-cy="search-analyses" type="search" placeholder="Buscar análises...">

<!-- Exportação -->
<button data-cy="export-transactions">Exportar</button>
<button data-cy="export-csv">CSV</button>
<button data-cy="export-pdf">PDF</button>
```

### analisar.html
```html
<!-- Upload de arquivo -->
<div data-cy="file-upload-area" class="upload-area">
  <input data-cy="file-upload-input" type="file" accept=".pdf,.docx">
  <span data-cy="file-name">arquivo.pdf</span>
  <span data-cy="file-size">2.5 MB</span>
  <button data-cy="remove-file-button">Remover</button>
</div>

<!-- Descrição da vaga -->
<textarea data-cy="job-description-textarea"></textarea>
<span data-cy="char-count">0/5000</span>

<!-- URL da vaga -->
<button data-cy="use-url-button">Usar URL</button>
<input data-cy="job-url-input" type="url">
<span data-cy="url-valid-icon">✓</span>

<!-- Templates -->
<button data-cy="templates-button">Templates</button>
<div data-cy="templates-modal">
  <div data-cy="template-item">Template 1</div>
</div>

<!-- Botão de análise -->
<button data-cy="analyze-button">Analisar</button>

<!-- Estados de carregamento -->
<div data-cy="loading-spinner"></div>
<div data-cy="loading-message">Analisando...</div>

<!-- Progresso -->
<div data-cy="progress-step-upload" class="completed">Upload</div>
<div data-cy="progress-step-processing" class="active">Processando</div>

<!-- Erros -->
<div data-cy="error-alert">
  <span data-cy="error-message">Erro ao processar</span>
  <button data-cy="retry-button">Tentar novamente</button>
</div>
```

### results.html
```html
<!-- Pontuação -->
<div data-cy="match-score">
  <span data-cy="match-score-value">85</span>
  <span data-cy="match-score-label">% Compatibilidade</span>
</div>
<div data-cy="score-visualization"></div>

<!-- Seções de resultado -->
<section data-cy="strengths-section">
  <h3 data-cy="strengths-title">Pontos Fortes</h3>
  <div data-cy="strength-item">Experiência relevante</div>
</section>

<section data-cy="improvements-section">
  <h3 data-cy="improvements-title">Sugestões de Melhoria</h3>
  <div data-cy="improvement-item">Adicionar certificações</div>
</section>

<!-- Keywords -->
<section data-cy="keywords-section">
  <div data-cy="found-keywords">
    <span data-cy="found-keyword-tag">React</span>
  </div>
  <div data-cy="missing-keywords">
    <span data-cy="missing-keyword-tag">Kubernetes</span>
  </div>
</section>

<!-- Ações -->
<button data-cy="download-report-button">Baixar Relatório</button>
<button data-cy="download-pdf">PDF</button>
<button data-cy="download-docx">DOCX</button>

<button data-cy="share-button">Compartilhar</button>
<div data-cy="share-modal">
  <input data-cy="share-link-input" readonly>
  <button data-cy="copy-link-button">Copiar</button>
</div>

<button data-cy="new-analysis-button">Nova Análise</button>
```

## 🔍 Boas Práticas

### 1. Não use data-cy para estilização
```html
<!-- ❌ Errado -->
<style>
  [data-cy="submit-button"] { color: blue; }
</style>

<!-- ✅ Correto -->
<button class="btn-primary" data-cy="submit-button">Enviar</button>
```

### 2. Mantenha os atributos únicos
```html
<!-- ❌ Errado - IDs duplicados -->
<button data-cy="submit-button">Enviar</button>
<button data-cy="submit-button">Confirmar</button>

<!-- ✅ Correto -->
<button data-cy="form-submit-button">Enviar</button>
<button data-cy="modal-submit-button">Confirmar</button>
```

### 3. Use atributos específicos para elementos dinâmicos
```html
<!-- Para listas dinâmicas -->
<div data-cy="transaction-list">
  <div data-cy="transaction-item" data-transaction-id="123">
    <!-- conteúdo -->
  </div>
</div>
```

### 4. Adicione atributos para estados
```html
<div data-cy="loading-state" data-loading="true">
  Carregando...
</div>

<div data-cy="error-state" data-error-type="network">
  Erro de conexão
</div>
```

## 🚀 Checklist de Implementação

- [ ] Adicionar data-cy em todos os formulários
- [ ] Adicionar data-cy em botões de ação principais
- [ ] Adicionar data-cy em elementos de navegação
- [ ] Adicionar data-cy em tabelas e listas
- [ ] Adicionar data-cy em modais e alertas
- [ ] Adicionar data-cy em estados vazios
- [ ] Adicionar data-cy em elementos de feedback
- [ ] Documentar novos atributos neste guia

## 📊 Manutenção

1. **Ao adicionar novos elementos**: Sempre inclua data-cy
2. **Ao remover elementos**: Verifique se não quebra testes
3. **Ao refatorar**: Mantenha os mesmos data-cy quando possível
4. **Review de código**: Verificar presença de data-cy em PRs

---

**Última atualização**: Janeiro 2025
**Referência**: [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)