# CV Sem Frescura - Análise de Precificação

## Análise Estratégica de Precificação - Funcionalidade Multivaga

### Contexto
O "CV Sem Frescura" implementou um sistema avançado de análise multivaga que permite aos usuários avaliarem seu currículo com até 7 vagas simultaneamente. Esta funcionalidade representa um diferencial significativo no mercado brasileiro de otimização de currículos para ATS.

### Valor Entregue ao Usuário

1. **Análise Consolidada**
   - Extração de requisitos de até 7 vagas simultaneamente
   - Deduplicação rigorosa de termos e habilidades
   - Consolidação inteligente mantendo versões mais específicas (ex: "Microsoft Power BI" vs "Power BI")

2. **Categorização Estratégica**
   - Identificação hierárquica de requisitos comuns entre múltiplas vagas
   - Classificação entre requisitos eliminatórios e classificatórios
   - Criação de "dicionário de equivalência" para termos relacionados

3. **Economia de Tempo e Recursos**
   - Redução de 5-10 horas que seriam gastas analisando manualmente cada vaga
   - Identificação precisa de requisitos que poderiam desqualificar o candidato
   - Estratégia otimizada para adequação curricular a múltiplas oportunidades

4. **Recomendações Priorizadas**
   - Sugestões que beneficiam a compatibilidade com múltiplas vagas
   - Ranking de vagas por nível de adequação do currículo
   - Indicação do esforço necessário para adequação a cada vaga

### Análise de Custos

1. **Custos Operacionais**
   - Processamento de múltiplas URLs em paralelo
   - Consumo de tokens da API OpenAI (GPT-4 Turbo)
   - Infraestrutura para extração de conteúdo dos sites de vagas
   - Servidores para processamento e armazenamento

2. **Custos Marginais**
   - Custo incremental por vaga analisada
   - Variação de consumo de API baseado na complexidade e tamanho das descrições
   - Economia de escala com volume de usuários

### Estrutura de Preço Ideal

#### Opções de Pricing

| Tipo de Análise | Faixa de Preço Ideal | Preço Promocional |
|-----------------|----------------------|-------------------|
| Básica (1 vaga) | R$29,90 - R$39,90    | R$19,97           |
| Intermediária (3 vagas) | R$49,90 - R$59,90 | R$39,97       |
| Premium (7 vagas) | R$69,90 - R$79,90   | R$59,97           |

#### Modelo de Assinatura

| Plano | Preço | Benefícios |
|-------|------|------------|
| Mensal | R$99,90/mês | Análises ilimitadas |
| Trimestral | R$79,90/mês | Economia de 20% + Consulta personalizada |
| Anual | R$59,90/mês | Economia de 40% + Revisão manual mensal |

### Justificativa para Faixa de Preço

O preço ideal para a análise multivaga (até 7 vagas) está entre **R$59,90 e R$79,90** considerando:

1. **Percepção de Valor**
   - Preços abaixo de R$49,90 podem sinalizar baixa qualidade para usuários que valorizam ferramentas de carreira
   - A faixa sugerida reflete adequadamente o valor entregue sem ultrapassar limites psicológicos de compra

2. **Comparativos de Mercado**
   - Serviços de otimização manual de currículo: R$150-300 por currículo
   - Ferramentas ATS simples (verificação básica): R$50-100 por análise
   - Consultorias de carreira: R$200-500 por sessão

3. **Estratégia de Monetização**
   - Preço de entrada promocional (R$39,97) para aquisição inicial de usuários
   - Estrutura em camadas para diferentes necessidades dos usuários
   - Modelo de assinatura para incentivar o uso recorrente e fidelização

### Recomendações para Testes

1. **Testes A/B** com diferentes faixas de preço (R$39,97 - R$79,90)
2. **Promoções limitadas** para os primeiros 1000 usuários
3. **Bundling** com serviços complementares (revisão manual, consultoria personalizada)
4. **Programa de indicação** com descontos para ambas as partes

### Conclusão

A análise indica que uma estratégia de preço flexível, começando com valores promocionais (R$39,97) e evoluindo para a faixa ideal (R$59,90 - R$79,90) à medida que o produto se estabelece no mercado, maximizaria tanto a adoção quanto a sustentabilidade do negócio.

A proposta de valor única do sistema multivaga justifica um posicionamento de preço que reflita a sofisticação da solução, mantendo-se acessível ao público-alvo brasileiro.
