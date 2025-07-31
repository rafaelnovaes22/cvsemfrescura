const axios = require('axios');
const claudeService = require('../../../services/claudeService');

// Mock do axios
jest.mock('axios');

describe('Claude Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Silenciar console para os testes
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('extractATSDataClaude', () => {
    const mockPrompt = 'Analise este currículo: João Silva...';
    
    const mockClaudeResponse = {
      job_keywords: ['JavaScript', 'React', 'Node.js'],
      job_keywords_present: ['JavaScript'],
      job_keywords_missing: ['React', 'Node.js'],
      sections: {
        resumo: {
          nota: 8,
          avaliacao: 'Bom resumo profissional',
          sugestoes: ['Adicionar objetivos específicos']
        }
      },
      score_geral: 78
    };

    it('deve extrair dados ATS usando Claude com sucesso', async () => {
      // Arrange
      process.env.CLAUDE_API_KEY = 'test-claude-key';
      
      axios.post.mockResolvedValue({
        data: {
          content: [{
            text: JSON.stringify(mockClaudeResponse)
          }]
        }
      });

      // Act
      const result = await claudeService.extractATSDataClaude(mockPrompt);

      // Assert
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: mockPrompt
          }]
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'test-claude-key',
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          })
        })
      );
      expect(result).toBe(JSON.stringify(mockClaudeResponse));
    });

    it('deve retornar erro quando API key não está configurada', async () => {
      // Arrange
      delete process.env.CLAUDE_API_KEY;

      // Act & Assert
      await expect(claudeService.extractATSDataClaude(mockPrompt))
        .rejects.toThrow('Claude API key não configurada');
    });

    it('deve tratar erro de rate limit do Claude', async () => {
      // Arrange
      process.env.CLAUDE_API_KEY = 'test-claude-key';
      
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.response = { 
        status: 429,
        data: { error: { message: 'Rate limit exceeded' } }
      };
      
      axios.post.mockRejectedValue(rateLimitError);

      // Act & Assert
      await expect(claudeService.extractATSDataClaude(mockPrompt))
        .rejects.toThrow('Rate limit exceeded');
    });

    it('deve tratar erro de autenticação do Claude', async () => {
      // Arrange
      process.env.CLAUDE_API_KEY = 'invalid-key';
      
      const authError = new Error('Invalid API key');
      authError.response = { 
        status: 401,
        data: { error: { message: 'Invalid API key' } }
      };
      
      axios.post.mockRejectedValue(authError);

      // Act & Assert
      await expect(claudeService.extractATSDataClaude(mockPrompt))
        .rejects.toThrow('Invalid API key');
    });

    it('deve tratar resposta vazia do Claude', async () => {
      // Arrange
      process.env.CLAUDE_API_KEY = 'test-claude-key';
      
      axios.post.mockResolvedValue({
        data: {
          content: []
        }
      });

      // Act & Assert
      await expect(claudeService.extractATSDataClaude(mockPrompt))
        .rejects.toThrow('Resposta vazia do Claude');
    });

    it('deve tratar JSON inválido na resposta do Claude', async () => {
      // Arrange
      process.env.CLAUDE_API_KEY = 'test-claude-key';
      
      axios.post.mockResolvedValue({
        data: {
          content: [{
            text: 'Resposta não é JSON válido'
          }]
        }
      });

      // Act & Assert
      await expect(claudeService.extractATSDataClaude(mockPrompt))
        .rejects.toThrow();
    });

    it('deve usar configurações corretas da API Claude', async () => {
      // Arrange
      process.env.CLAUDE_API_KEY = 'test-claude-key';
      
      axios.post.mockResolvedValue({
        data: {
          content: [{
            text: JSON.stringify(mockClaudeResponse)
          }]
        }
      });

      // Act
      await claudeService.extractATSDataClaude(mockPrompt);

      // Assert
      const axiosCall = axios.post.mock.calls[0];
      const [url, requestData, config] = axiosCall;
      
      expect(url).toBe('https://api.anthropic.com/v1/messages');
      expect(requestData.model).toBe('claude-3-sonnet-20240229');
      expect(requestData.max_tokens).toBe(4000);
      expect(config.headers['x-api-key']).toBe('test-claude-key');
      expect(config.headers['anthropic-version']).toBe('2023-06-01');
    });

    it('deve validar entrada do prompt', async () => {
      // Arrange
      process.env.CLAUDE_API_KEY = 'test-claude-key';

      // Act & Assert
      await expect(claudeService.extractATSDataClaude(''))
        .rejects.toThrow('Prompt não pode estar vazio');
        
      await expect(claudeService.extractATSDataClaude(null))
        .rejects.toThrow('Prompt é obrigatório');
        
      await expect(claudeService.extractATSDataClaude(undefined))
        .rejects.toThrow('Prompt é obrigatório');
    });

    it('deve tratar timeout da API Claude', async () => {
      // Arrange
      process.env.CLAUDE_API_KEY = 'test-claude-key';
      
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'ECONNABORTED';
      
      axios.post.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(claudeService.extractATSDataClaude(mockPrompt))
        .rejects.toThrow('Request timeout');
    });

    it('deve incluir user-agent correto nas requisições', async () => {
      // Arrange
      process.env.CLAUDE_API_KEY = 'test-claude-key';
      
      axios.post.mockResolvedValue({
        data: {
          content: [{
            text: JSON.stringify(mockClaudeResponse)
          }]
        }
      });

      // Act
      await claudeService.extractATSDataClaude(mockPrompt);

      // Assert
      const config = axios.post.mock.calls[0][2];
      expect(config.headers).toEqual(
        expect.objectContaining({
          'User-Agent': expect.stringContaining('CVSemFrescura')
        })
      );
    });
  });
});