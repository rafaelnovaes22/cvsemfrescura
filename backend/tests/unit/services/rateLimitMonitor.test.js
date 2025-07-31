const rateLimitMonitor = require('../../../services/rateLimitMonitor');

describe('Rate Limit Monitor', () => {
  let logSpy, warnSpy, errorSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset internal state
    rateLimitMonitor.resetStats();

    // Silenciar console para os testes
    logSpy = jest.spyOn(console, 'log').mockImplementation();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restaurar apenas se os spies foram criados
    if (logSpy) logSpy.mockRestore();
    if (warnSpy) warnSpy.mockRestore();
    if (errorSpy) errorSpy.mockRestore();
  });

  describe('getRecommendedService', () => {
    it('deve recomendar OpenAI quando dentro dos limites', () => {
      // Arrange
      const estimatedTokens = 1000;

      // Act
      const result = rateLimitMonitor.getRecommendedService(estimatedTokens);

      // Assert
      expect(result.service).toBe('openai');
      expect(result.reason).toContain('OpenAI disponível');
    });

    it('deve recomendar Claude quando OpenAI está próximo do limite', () => {
      // Arrange
      // Simular requests suficientes para atingir 90% do limite de requests
      for (let i = 0; i < 2800; i++) { // Mais que 90% de 3000
        rateLimitMonitor.updateOpenAIUsage(10);
      }

      const estimatedTokens = 1000;

      // Act
      const result = rateLimitMonitor.getRecommendedService(estimatedTokens);

      // Assert
      expect(result.service).toBe('claude');
      expect(result.reason).toContain('rate limited');
    });

    it('deve recomendar Claude para requests que excedem tokens disponíveis', () => {
      // Arrange
      const largeTokenRequest = 140000; // Request que excede 90% do limite (135k)

      // Act
      const result = rateLimitMonitor.getRecommendedService(largeTokenRequest);

      // Assert
      expect(result.service).toBe('claude');
      expect(result.reason).toContain('rate limited');
    });

    it('deve considerar janela de tempo para rate limiting', () => {
      // Arrange
      const estimatedTokens = 1000;

      // Simular muitos requests em pouco tempo
      for (let i = 0; i < 60; i++) {
        rateLimitMonitor.updateOpenAIUsage(1000);
      }

      // Act
      const result = rateLimitMonitor.getRecommendedService(estimatedTokens);

      // Assert
      expect(result.service).toBe('claude');
      expect(result.reason).toContain('rate limit');
    });
  });

  describe('updateOpenAIUsage', () => {
    it('deve atualizar estatísticas de uso do OpenAI', () => {
      // Arrange
      const tokensUsed = 1500;

      // Act
      rateLimitMonitor.updateOpenAIUsage(tokensUsed);
      const stats = rateLimitMonitor.getUsageStats();

      // Assert
      expect(stats.openai.requests).toBe(1);
      expect(stats.openai.tokens).toBe(1500);
      expect(stats.openai.lastRequest).toBeInstanceOf(Date);
    });

    it('deve acumular múltiplas chamadas', () => {
      // Arrange & Act
      rateLimitMonitor.updateOpenAIUsage(1000);
      rateLimitMonitor.updateOpenAIUsage(500);
      rateLimitMonitor.updateOpenAIUsage(2000);

      const stats = rateLimitMonitor.getUsageStats();

      // Assert
      expect(stats.openai.requests).toBe(3);
      expect(stats.openai.tokens).toBe(3500);
    });

    it('deve validar entrada de tokens', () => {
      // Act & Assert
      expect(() => rateLimitMonitor.updateOpenAIUsage(-100))
        .toThrow('Tokens deve ser um número positivo');

      expect(() => rateLimitMonitor.updateOpenAIUsage('invalid'))
        .toThrow('Tokens deve ser um número');

      expect(() => rateLimitMonitor.updateOpenAIUsage(null))
        .toThrow('Tokens deve ser um número');
    });
  });

  describe('updateClaudeUsage', () => {
    it('deve atualizar estatísticas de uso do Claude', () => {
      // Arrange
      const tokensUsed = 2000;

      // Act
      rateLimitMonitor.updateClaudeUsage(tokensUsed);
      const stats = rateLimitMonitor.getUsageStats();

      // Assert
      expect(stats.claude.requests).toBe(1);
      expect(stats.claude.tokens).toBe(2000);
      expect(stats.claude.lastRequest).toBeInstanceOf(Date);
    });

    it('deve acumular múltiplas chamadas do Claude', () => {
      // Arrange & Act
      rateLimitMonitor.updateClaudeUsage(1500);
      rateLimitMonitor.updateClaudeUsage(800);

      const stats = rateLimitMonitor.getUsageStats();

      // Assert
      expect(stats.claude.requests).toBe(2);
      expect(stats.claude.tokens).toBe(2300);
    });
  });

  describe('getUsageStats', () => {
    it('deve retornar estatísticas vazias inicialmente', () => {
      // Act
      const stats = rateLimitMonitor.getUsageStats();

      // Assert
      expect(stats.openai.requests).toBe(0);
      expect(stats.openai.tokens).toBe(0);
      expect(stats.claude.requests).toBe(0);
      expect(stats.claude.tokens).toBe(0);
    });

    it('deve retornar estatísticas corretas após uso', () => {
      // Arrange
      rateLimitMonitor.updateOpenAIUsage(1000);
      rateLimitMonitor.updateClaudeUsage(1500);

      // Act
      const stats = rateLimitMonitor.getUsageStats();

      // Assert
      expect(stats.openai.requests).toBe(1);
      expect(stats.openai.tokens).toBe(1000);
      expect(stats.claude.requests).toBe(1);
      expect(stats.claude.tokens).toBe(1500);
    });

    it('deve incluir limites configurados', () => {
      // Act
      const stats = rateLimitMonitor.getUsageStats();

      // Assert
      expect(stats.openai.limit).toBeDefined();
      expect(stats.openai.limit).toBeGreaterThan(0);
      expect(stats.claude.limit).toBeDefined();
      expect(stats.claude.limit).toBeGreaterThan(0);
    });

    it('deve calcular tempo até reset', () => {
      // Arrange
      rateLimitMonitor.updateOpenAIUsage(1000);

      // Act
      const stats = rateLimitMonitor.getUsageStats();

      // Assert
      expect(stats.openai.resetTime).toBeInstanceOf(Date);
      expect(stats.openai.timeUntilReset).toBeGreaterThan(0);
    });
  });

  describe('checkRateLimit', () => {
    it('deve permitir request quando dentro dos limites', async () => {
      // Arrange
      const service = 'openai';
      const estimatedTokens = 1000;

      // Act
      const result = await rateLimitMonitor.checkRateLimit(service, estimatedTokens);

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
      expect(result.resetTime).toBeInstanceOf(Date);
    });

    it('deve negar request quando excede limite', () => {
      // Arrange
      const service = 'openai';

      // Simular uso excessivo - atingir 90% do limite de requests
      for (let i = 0; i < 2800; i++) { // Mais que 90% de 3000
        rateLimitMonitor.updateOpenAIUsage(10);
      }

      // Act
      const result = rateLimitMonitor.checkRateLimit(service, 1000);

      // Assert
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBeLessThanOrEqual(700); // Poucos restando
      expect(result.retryAfter).toBeGreaterThanOrEqual(0);
    });

    it('deve validar parâmetros de entrada', () => {
      // Act & Assert
      expect(() => rateLimitMonitor.checkRateLimit('', 1000))
        .toThrow('Service é obrigatório');

      expect(() => rateLimitMonitor.checkRateLimit('openai', -100))
        .toThrow('Tokens deve ser positivo');
    });
  });

  describe('resetStats', () => {
    it('deve resetar todas as estatísticas', () => {
      // Arrange
      rateLimitMonitor.updateOpenAIUsage(1000);
      rateLimitMonitor.updateClaudeUsage(1500);

      // Act
      rateLimitMonitor.resetStats();
      const stats = rateLimitMonitor.getUsageStats();

      // Assert
      expect(stats.openai.requests).toBe(0);
      expect(stats.openai.tokens).toBe(0);
      expect(stats.claude.requests).toBe(0);
      expect(stats.claude.tokens).toBe(0);
    });
  });

  describe('getHealthStatus', () => {
    it('deve retornar status saudável quando tudo OK', () => {
      // Act
      const health = rateLimitMonitor.getHealthStatus();

      // Assert
      expect(health.status).toBe('healthy');
      expect(health.openai.status).toBe('operational');
      expect(health.claude.status).toBe('operational');
    });

    it('deve detectar quando OpenAI está próximo do limite', () => {
      // Arrange
      // Usar 85% do limite de requests para atingir status warning (>80%)
      for (let i = 0; i < 2550; i++) { // 85% de 3000
        rateLimitMonitor.updateOpenAIUsage(10);
      }

      // Act
      const health = rateLimitMonitor.getHealthStatus();

      // Assert
      expect(health.openai.status).toBe('warning');
      expect(health.openai.usage).toBeGreaterThan(80);
    });

    it('deve detectar quando serviço está no limite', () => {
      // Arrange
      // Usar 95% do limite de requests para atingir status degraded (>=90%)
      for (let i = 0; i < 2850; i++) { // 95% de 3000
        rateLimitMonitor.updateOpenAIUsage(10);
      }

      // Act
      const health = rateLimitMonitor.getHealthStatus();

      // Assert
      expect(health.status).toBe('degraded');
      expect(health.openai.status).toBe('limited');
    });
  });
});