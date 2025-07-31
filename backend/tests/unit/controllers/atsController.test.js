const atsController = require('../../../controllers/atsController');
const atsService = require('../../../services/atsService');
const GupyOptimizationService = require('../../../services/gupyOptimizationService');
const User = require('../../../models/user');
const AnalysisResults = require('../../../models/AnalysisResults');
const fs = require('fs');
const {
  mockRequest,
  mockResponse,
  mockUser,
  expectSuccessResponse,
  expectErrorResponse
} = require('../../helpers/testHelpers');

// Mock das dependências
jest.mock('../../../services/atsService', () => ({
  processATS: jest.fn()
}));
jest.mock('../../../services/gupyOptimizationService');
jest.mock('../../../models/user');
jest.mock('../../../models/AnalysisResults');
jest.mock('../../../utils/textExtractor', () => ({
  extract: jest.fn().mockResolvedValue('Mock texto do currículo extraído')
}));
jest.mock('fs');

describe('ATS Controller', () => {
  let req, res;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();

    // Mock do console para silenciar logs
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    console.log.mockRestore();
    console.warn.mockRestore();
    console.error.mockRestore();
  });

  describe('analyze', () => {
    const mockAnalysisResult = {
      score_geral: 85,
      job_keywords: ['JavaScript', 'React', 'Node.js'],
      job_keywords_present: ['JavaScript', 'React'],
      job_keywords_missing: ['Node.js'],
      sections: {
        resumo: { nota: 8, avaliacao: 'Bom resumo' },
        experiencia: { nota: 9, avaliacao: 'Experiência sólida' }
      }
    };

    beforeEach(() => {
      req.user = { id: 1 };
      req.file = {
        path: '/tmp/resume.pdf',
        originalname: 'curriculo.pdf'
      };
      req.body = {
        jobLinks: JSON.stringify([
          'https://empresa.com/vaga1',
          'https://empresa.com/vaga2',
          'https://empresa.com/vaga3'
        ])
      };

      // Mock padrão - usuário com créditos
      User.findByPk.mockResolvedValue({
        ...mockUser,
        credits: 5,
        update: jest.fn().mockResolvedValue()
      });
    });

    it('deve realizar análise com sucesso', async () => {
      // Arrange
      atsService.processATS.mockResolvedValue(mockAnalysisResult);

      const mockUserInstance = {
        ...mockUser,
        credits: 5,
        update: jest.fn().mockResolvedValue()
      };
      User.findByPk.mockResolvedValue(mockUserInstance);

      AnalysisResults.create.mockResolvedValue({
        id: 1,
        userId: 1,
        result: mockAnalysisResult
      });

      // Act
      await atsController.analyze(req, res);

      // Assert
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(atsService.processATS).toHaveBeenCalledWith(
        '/tmp/resume.pdf',
        expect.arrayContaining([
          'https://empresa.com/vaga1',
          'https://empresa.com/vaga2',
          'https://empresa.com/vaga3'
        ])
      );
      expect(mockUserInstance.update).toHaveBeenCalledWith({ credits: 4 }); // 5 - 1
      expect(AnalysisResults.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          result: mockAnalysisResult
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining(mockAnalysisResult)
      );
    });

    it('deve retornar erro quando usuário não está autenticado', async () => {
      // Arrange
      req.user = null;

      // Act
      await atsController.analyze(req, res);

      // Assert
      expectErrorResponse(res, 401, 'não autenticado');
      expect(User.findByPk).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando usuário não é encontrado', async () => {
      // Arrange
      User.findByPk.mockResolvedValue(null);

      // Act
      await atsController.analyze(req, res);

      // Assert
      expectErrorResponse(res, 404, 'Usuário não encontrado');
      expect(atsService.processATS).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando usuário não tem créditos', async () => {
      // Arrange
      User.findByPk.mockResolvedValue({
        ...mockUser,
        credits: 0
      });

      // Act
      await atsController.analyze(req, res);

      // Assert
      expectErrorResponse(res, 403, 'créditos suficientes');
      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.credits).toBe(0);
      expect(atsService.processATS).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando arquivo não é fornecido', async () => {
      // Arrange
      req.file = null;

      // Act
      await atsController.analyze(req, res);

      // Assert
      expectErrorResponse(res, 400, 'Arquivo de currículo ou links de vagas ausentes');
      expect(atsService.processATS).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando links de vagas não são fornecidos', async () => {
      // Arrange
      req.body.jobLinks = JSON.stringify([]);

      // Act
      await atsController.analyze(req, res);

      // Assert
      expectErrorResponse(res, 400, 'Arquivo de currículo ou links de vagas ausentes');
      expect(atsService.processATS).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando menos de 3 vagas são fornecidas', async () => {
      // Arrange
      req.body.jobLinks = JSON.stringify([
        'https://empresa.com/vaga1',
        'https://empresa.com/vaga2'
      ]);

      // Act
      await atsController.analyze(req, res);

      // Assert
      expectErrorResponse(res, 400, 'pelo menos 3 vagas');
      expect(atsService.processATS).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando mais de 7 vagas são fornecidas', async () => {
      // Arrange
      const manyJobs = Array(8).fill().map((_, i) => `https://empresa.com/vaga${i + 1}`);
      req.body.jobLinks = JSON.stringify(manyJobs);

      // Act
      await atsController.analyze(req, res);

      // Assert
      expectErrorResponse(res, 400, 'limite máximo é de 7 vagas');
      expect(atsService.processATS).not.toHaveBeenCalled();
    });

    it('deve tratar erros do serviço de análise', async () => {
      // Arrange
      atsService.processATS.mockRejectedValue(
        new Error('Erro na análise do OpenAI')
      );

      // Act
      await atsController.analyze(req, res);

      // Assert
      expectErrorResponse(res, 500);
      // Verificar se o crédito não foi descontado em caso de erro
      const userMock = User.findByPk.mock.results[0].value;
      expect(userMock.update).not.toHaveBeenCalled();
    });

    it('deve lidar com JSON inválido nos jobLinks', async () => {
      // Arrange
      req.body.jobLinks = 'invalid json';

      // Act
      await atsController.analyze(req, res);

      // Assert
      expectErrorResponse(res, 500);
      expect(atsService.processATS).not.toHaveBeenCalled();
    });

    it('deve salvar resultados da análise no banco', async () => {
      // Arrange
      atsService.processATS.mockResolvedValue(mockAnalysisResult);

      const mockUserInstance = {
        ...mockUser,
        credits: 3,
        update: jest.fn().mockResolvedValue()
      };
      User.findByPk.mockResolvedValue(mockUserInstance);

      AnalysisResults.create.mockResolvedValue({
        id: 2,
        userId: 1,
        result: mockAnalysisResult,
        createdAt: new Date()
      });

      // Act
      await atsController.analyze(req, res);

      // Assert
      expect(AnalysisResults.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          result: mockAnalysisResult,
          resumeFileName: 'curriculo.pdf',
          resumeContent: 'Mock texto do currículo extraído',
          jobUrls: expect.arrayContaining([
            'https://empresa.com/vaga1',
            'https://empresa.com/vaga2',
            'https://empresa.com/vaga3'
          ])
        })
      );
    });

    it('deve processar análise mesmo com créditos nulos', async () => {
      // Arrange
      const mockUserInstance = {
        ...mockUser,
        credits: null, // Créditos não definidos
        update: jest.fn().mockResolvedValue()
      };
      User.findByPk.mockResolvedValue(mockUserInstance);

      // Act
      await atsController.analyze(req, res);

      // Assert
      expectErrorResponse(res, 403, 'créditos suficientes');
    });
  });

  describe('getAnalysisHistory', () => {
    beforeEach(() => {
      req.user = { id: 1 };
    });

    it('deve retornar histórico de análises do usuário', async () => {
      // Arrange
      const mockHistory = [
        {
          id: 1,
          userId: 1,
          result: { score_geral: 85 },
          createdAt: new Date(),
          resumePath: '/path/to/resume1.pdf'
        },
        {
          id: 2,
          userId: 1,
          result: { score_geral: 78 },
          createdAt: new Date(),
          resumePath: '/path/to/resume2.pdf'
        }
      ];

      AnalysisResults.findAll.mockResolvedValue(mockHistory);

      // Act
      await atsController.getAnalysisHistory(req, res);

      // Assert
      expect(AnalysisResults.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1 },
          order: [['createdAt', 'DESC']]
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            fileName: expect.any(String),
            jobUrls: expect.any(Array),
            createdAt: expect.any(Date),
            jobCount: expect.any(Number),
            summary: expect.objectContaining({
              hasCompatibilityScores: expect.any(Boolean),
              hasKeywords: expect.any(Boolean),
              hasEvaluations: expect.any(Boolean)
            })
          })
        ])
      );
    });

    it('deve retornar lista vazia quando usuário não tem análises', async () => {
      // Arrange
      AnalysisResults.findAll.mockResolvedValue([]);

      // Act
      await atsController.getAnalysisHistory(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('deve tratar erros ao buscar histórico', async () => {
      // Arrange
      AnalysisResults.findAll.mockRejectedValue(new Error('Database error'));

      // Act
      await atsController.getAnalysisHistory(req, res);

      // Assert
      expectErrorResponse(res, 500);
    });
  });

  describe('getAnalysisById', () => {
    beforeEach(() => {
      req.user = { id: 1 };
      req.params = { id: '123' };
    });

    it('deve retornar análise específica do usuário', async () => {
      // Arrange
      const mockAnalysis = {
        id: 123,
        userId: 1,
        result: { score_geral: 90 },
        createdAt: new Date()
      };

      AnalysisResults.findOne.mockResolvedValue(mockAnalysis);

      // Act
      await atsController.getAnalysisById(req, res);

      // Assert
      expect(AnalysisResults.findOne).toHaveBeenCalledWith({
        where: { id: '123', userId: 1 }
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          score_geral: 90,
          isHistoricalView: true,
          originalDate: expect.any(Date)
        })
      );
    });

    it('deve retornar erro quando análise não é encontrada', async () => {
      // Arrange
      AnalysisResults.findOne.mockResolvedValue(null);

      // Act
      await atsController.getAnalysisById(req, res);

      // Assert
      expectErrorResponse(res, 404, 'Análise não encontrada');
    });

    it('deve tratar IDs inválidos', async () => {
      // Arrange
      req.params.id = 'invalid';
      AnalysisResults.findOne.mockRejectedValue(new Error('Invalid ID'));

      // Act
      await atsController.getAnalysisById(req, res);

      // Assert
      expectErrorResponse(res, 500);
    });
  });
});