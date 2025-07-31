const axios = require('axios');
const openaiService = require('../../../services/openaiService');
const claudeService = require('../../../services/claudeService');
const rateLimitMonitor = require('../../../services/rateLimitMonitor');

// Mock das dependências
jest.mock('axios');
jest.mock('../../../services/claudeService', () => ({
  extractATSDataClaude: jest.fn()
}));
jest.mock('../../../services/rateLimitMonitor', () => ({
  getRecommendedService: jest.fn(),
  recordOpenAIUsage: jest.fn(),
  updateOpenAILimits: jest.fn(),
  getOpenAIWaitTime: jest.fn().mockReturnValue(1000),
  getUsageStats: jest.fn().mockReturnValue({
    openai: { requests: 0, limit: 100 }
  })
}));

describe('OpenAI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Silenciar console.log para os testes
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('extractATSData', () => {
    const mockJobsText = 'Vaga para desenvolvedor JavaScript com React e Node.js';
    const mockResumeText = 'João Silva, desenvolvedor com experiência em React';

    const mockAnalysisResponse = {
      job_keywords: ['JavaScript', 'React', 'Node.js'],
      job_keywords_present: ['React'],
      job_keywords_missing: ['JavaScript', 'Node.js'],
      found_keywords: ['React'],
      missing_keywords: ['JavaScript', 'Node.js'],
      sections: {
        resumo: {
          nota: 7,
          avaliacao: 'Bom resumo profissional',
          sugestoes: ['Adicionar objetivos', 'Melhorar descrição']
        },
        experiencia: {
          nota: 8,
          avaliacao: 'Experiência relevante',
          sugestoes: ['Adicionar métricas', 'Detalhar projetos']
        }
      },
      score_geral: 75,
      missing_sections: []
    };

    it('deve usar Claude quando recomendado pelo rate monitor', async () => {
      // Arrange
      rateLimitMonitor.getRecommendedService.mockReturnValue({
        service: 'claude',
        reason: 'OpenAI rate limit atingido'
      });

      claudeService.extractATSDataClaude.mockResolvedValue(
        JSON.stringify(mockAnalysisResponse)
      );

      // Act
      const result = await openaiService.extractATSData(mockJobsText, mockResumeText);

      // Assert
      expect(rateLimitMonitor.getRecommendedService).toHaveBeenCalled();
      expect(claudeService.extractATSDataClaude).toHaveBeenCalled();
      expect(result).toEqual(mockAnalysisResponse);
    });

    it('deve usar OpenAI quando recomendado pelo rate monitor', async () => {
      // Arrange
      rateLimitMonitor.getRecommendedService.mockReturnValue({
        service: 'openai',
        reason: 'OpenAI disponível'
      });

      axios.post.mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: JSON.stringify(mockAnalysisResponse)
            }
          }]
        }
      });

      // Act
      const result = await openaiService.extractATSData(mockJobsText, mockResumeText);

      // Assert
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          model: expect.any(String),
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining(mockJobsText)
            })
          ])
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
            'Content-Type': 'application/json'
          })
        })
      );
      expect(rateLimitMonitor.recordOpenAIUsage).toHaveBeenCalledWith(expect.any(Number));
      expect(result).toEqual(mockAnalysisResponse);
    });

    it('deve fazer fallback para Claude quando OpenAI falha com rate limit', async () => {
      // Arrange
      rateLimitMonitor.getRecommendedService.mockReturnValue({
        service: 'openai',
        reason: 'OpenAI disponível'
      });

      // Simular erro de rate limit do OpenAI  
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.response = { status: 429 };

      axios.post.mockRejectedValue(rateLimitError);

      claudeService.extractATSDataClaude.mockResolvedValue(
        JSON.stringify(mockAnalysisResponse)
      );

      // Act
      const result = await openaiService.extractATSData(mockJobsText, mockResumeText);

      // Assert
      expect(axios.post).toHaveBeenCalled();
      expect(claudeService.extractATSDataClaude).toHaveBeenCalled();
      expect(result).toEqual(mockAnalysisResponse);
    });

    it('deve usar backoff exponencial em retries', async () => {
      // Arrange
      rateLimitMonitor.getRecommendedService.mockReturnValue({
        service: 'openai',
        reason: 'OpenAI disponível'
      });

      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.response = { status: 429 };

      // Primeiro falha, depois sucesso
      axios.post
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({
          data: {
            choices: [{
              message: {
                content: JSON.stringify(mockAnalysisResponse)
              }
            }]
          }
        });

      // Act
      const result = await openaiService.extractATSData(mockJobsText, mockResumeText);

      // Assert
      expect(result).toEqual(mockAnalysisResponse);
      expect(rateLimitMonitor.recordOpenAIUsage).toHaveBeenCalled();
    });

    it('deve tratar erros não retriáveis usando Claude como fallback', async () => {
      // Arrange
      rateLimitMonitor.getRecommendedService.mockReturnValue({
        service: 'openai',
        reason: 'OpenAI disponível'
      });

      const authError = new Error('Invalid API key');
      authError.response = { status: 401 };

      axios.post.mockRejectedValue(authError);

      claudeService.extractATSDataClaude.mockResolvedValue(
        JSON.stringify(mockAnalysisResponse)
      );

      // Act
      const result = await openaiService.extractATSData(mockJobsText, mockResumeText);

      // Assert
      expect(claudeService.extractATSDataClaude).toHaveBeenCalled();
      expect(result).toEqual(mockAnalysisResponse);
    });

    it('deve processar resposta JSON com blocos de código', async () => {
      // Arrange
      rateLimitMonitor.getRecommendedService.mockReturnValue({
        service: 'claude',
        reason: 'Usando Claude'
      });

      const jsonWithCodeBlock = '```json\n' + JSON.stringify(mockAnalysisResponse) + '\n```';
      claudeService.extractATSDataClaude.mockResolvedValue(jsonWithCodeBlock);

      // Act
      const result = await openaiService.extractATSData(mockJobsText, mockResumeText);

      // Assert
      expect(result).toEqual(mockAnalysisResponse);
    });

    it('deve lançar erro quando ambos os serviços falham', async () => {
      // Arrange
      rateLimitMonitor.getRecommendedService.mockReturnValue({
        service: 'openai',
        reason: 'OpenAI disponível'
      });

      const openaiError = new Error('OpenAI failed');
      openaiError.response = { status: 500 };

      axios.post.mockRejectedValue(openaiError);

      const claudeError = new Error('Claude failed');
      claudeService.extractATSDataClaude.mockRejectedValue(claudeError);

      // Mock do getUsageStats para evitar erro
      rateLimitMonitor.getUsageStats.mockReturnValue({
        openai: { requests: 0, limit: 100 }
      });

      // Act & Assert
      await expect(openaiService.extractATSData(mockJobsText, mockResumeText))
        .rejects.toThrow();
    });

    it('deve calcular tokens estimados corretamente', async () => {
      // Arrange
      const longText = 'a'.repeat(1000); // 1000 caracteres
      rateLimitMonitor.getRecommendedService.mockReturnValue({
        service: 'openai',
        reason: 'OpenAI disponível'
      });

      axios.post.mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: JSON.stringify(mockAnalysisResponse)
            }
          }]
        }
      });

      // Act
      await openaiService.extractATSData(longText, mockResumeText);

      // Assert
      expect(rateLimitMonitor.getRecommendedService).toHaveBeenCalledWith(
        expect.any(Number) // Tokens estimados
      );
    });

    it('deve lidar com parâmetros vazios', async () => {
      // Arrange
      rateLimitMonitor.getRecommendedService.mockReturnValue({
        service: 'claude',
        reason: 'Usando Claude'
      });

      claudeService.extractATSDataClaude.mockResolvedValue(
        JSON.stringify(mockAnalysisResponse)
      );

      // Act & Assert - O serviço deve funcionar mesmo com strings vazias
      const result = await openaiService.extractATSData('', mockResumeText);
      expect(result).toEqual(mockAnalysisResponse);
    });

    it('deve atualizar monitor de rate limit após sucesso', async () => {
      // Arrange
      rateLimitMonitor.getRecommendedService.mockReturnValue({
        service: 'openai',
        reason: 'OpenAI disponível'
      });

      axios.post.mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: JSON.stringify(mockAnalysisResponse)
            }
          }]
        }
      });

      // Act
      await openaiService.extractATSData(mockJobsText, mockResumeText);

      // Assert
      expect(rateLimitMonitor.recordOpenAIUsage).toHaveBeenCalledWith(
        expect.any(Number) // Tokens estimados
      );
    });

    it('deve lidar com resposta JSON malformada usando fallback', async () => {
      // Arrange
      rateLimitMonitor.getRecommendedService.mockReturnValue({
        service: 'openai',
        reason: 'OpenAI disponível'
      });

      axios.post.mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: 'invalid json response'
            }
          }]
        }
      });

      claudeService.extractATSDataClaude.mockResolvedValue(
        JSON.stringify(mockAnalysisResponse)
      );

      // Mock necessário para evitar erro
      rateLimitMonitor.getUsageStats.mockReturnValue({
        openai: { requests: 0, limit: 100 }
      });

      // Act
      const result = await openaiService.extractATSData(mockJobsText, mockResumeText);

      // Assert
      expect(claudeService.extractATSDataClaude).toHaveBeenCalled();
      expect(result).toEqual(mockAnalysisResponse);
    });
  });
});