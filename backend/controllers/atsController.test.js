const atsController = require('./atsController');
const atsService = require('../services/atsService');
const User = require('../models/user');
const AnalysisResults = require('../models/AnalysisResults');
const textExtractor = require('../utils/textExtractor');
const fs = require('fs');

// Mock dos serviços e modelos
jest.mock('../services/atsService');
jest.mock('../services/gupyOptimizationService');
jest.mock('../models/user');
jest.mock('../models/AnalysisResults');
jest.mock('../utils/textExtractor');
jest.mock('fs');

describe('ATS Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: { id: 1 },
      file: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('analyze', () => {
    it('should return 401 if user is not authenticated', async () => {
      req.user = null;

      await atsController.analyze(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuário não autenticado.'
      });
    });

    it('should return 404 if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await atsController.analyze(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Usuário não encontrado.'
      });
    });

    it('should return 403 if user has no credits', async () => {
      const mockUser = { id: 1, credits: 0 };
      User.findByPk.mockResolvedValue(mockUser);

      await atsController.analyze(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Você não possui créditos suficientes para realizar uma análise.',
        credits: 0
      });
    });

    it('should return 400 if no file or job links provided', async () => {
      const mockUser = { id: 1, credits: 5 };
      User.findByPk.mockResolvedValue(mockUser);
      req.body.jobLinks = '[]';

      await atsController.analyze(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Arquivo de currículo ou links de vagas ausentes.'
      });
    });

    it('should return 400 if less than 3 job links', async () => {
      const mockUser = { id: 1, credits: 5 };
      User.findByPk.mockResolvedValue(mockUser);
      req.file = { path: '/tmp/resume.pdf' };
      req.body.jobLinks = JSON.stringify(['link1', 'link2']);

      await atsController.analyze(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'É necessário incluir pelo menos 3 vagas para uma análise completa.'
      });
    });

    it('should return 400 if more than 7 job links', async () => {
      const mockUser = { id: 1, credits: 5 };
      User.findByPk.mockResolvedValue(mockUser);
      req.file = { path: '/tmp/resume.pdf' };
      req.body.jobLinks = JSON.stringify(['link1', 'link2', 'link3', 'link4', 'link5', 'link6', 'link7', 'link8']);

      await atsController.analyze(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'O limite máximo é de 7 vagas por análise. Remova alguns links e tente novamente.'
      });
    });

    it('should process analysis successfully', async () => {
      const mockUser = { 
        id: 1, 
        credits: 5,
        update: jest.fn()
      };
      const mockAnalysisResult = {
        jobs: [
          { title: 'Job 1', description: 'Description 1', score: 85 },
          { title: 'Job 2', description: 'Description 2', score: 90 },
          { title: 'Job 3', description: 'Description 3', score: 75 }
        ],
        overallScore: 85,
        keywordMatch: { present: ['skill1'], missing: ['skill2'] }
      };

      User.findByPk.mockResolvedValue(mockUser);
      req.file = { path: '/tmp/resume.pdf' };
      req.body.jobLinks = JSON.stringify(['link1', 'link2', 'link3']);
      
      atsService.processATS.mockResolvedValue(mockAnalysisResult);
      textExtractor.extract.mockResolvedValue('Resume text content');
      AnalysisResults.create.mockResolvedValue({ id: 1 });
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => {});

      await atsController.analyze(req, res);

      expect(atsService.processATS).toHaveBeenCalledWith('/tmp/resume.pdf', ['link1', 'link2', 'link3']);
      expect(mockUser.update).toHaveBeenCalledWith({ credits: 4 });
      expect(AnalysisResults.create).toHaveBeenCalledWith({
        userId: 1,
        resumeText: 'Resume text content',
        jobsAnalyzed: 3,
        overallScore: 85,
        results: expect.any(Object)
      });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        overallScore: 85,
        keywordMatch: expect.any(Object),
        jobs: expect.any(Array)
      }));
    });

    it('should handle ATS service errors', async () => {
      const mockUser = { id: 1, credits: 5 };
      User.findByPk.mockResolvedValue(mockUser);
      req.file = { path: '/tmp/resume.pdf' };
      req.body.jobLinks = JSON.stringify(['link1', 'link2', 'link3']);
      
      atsService.processATS.mockRejectedValue(new Error('ATS processing error'));

      await atsController.analyze(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Erro ao processar análise ATS. Por favor, tente novamente.',
        details: expect.any(String)
      });
    });
  });

  describe('getHistory', () => {
    it('should return user analysis history', async () => {
      const mockResults = [
        {
          id: 1,
          createdAt: new Date(),
          jobsAnalyzed: 3,
          overallScore: 85,
          results: { jobs: [] }
        }
      ];

      AnalysisResults.findAll.mockResolvedValue(mockResults);

      await atsController.getHistory(req, res);

      expect(AnalysisResults.findAll).toHaveBeenCalledWith({
        where: { userId: 1 },
        order: [['createdAt', 'DESC']],
        limit: 10
      });
      expect(res.json).toHaveBeenCalledWith(mockResults);
    });

    it('should handle database errors', async () => {
      AnalysisResults.findAll.mockRejectedValue(new Error('Database error'));

      await atsController.getHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Erro ao buscar histórico.'
      });
    });
  });

  describe('getAnalysis', () => {
    it('should return specific analysis by id', async () => {
      req.params = { id: '1' };
      const mockAnalysis = {
        id: 1,
        userId: 1,
        results: { jobs: [] }
      };

      AnalysisResults.findOne.mockResolvedValue(mockAnalysis);

      await atsController.getAnalysis(req, res);

      expect(AnalysisResults.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 }
      });
      expect(res.json).toHaveBeenCalledWith(mockAnalysis);
    });

    it('should return 404 if analysis not found', async () => {
      req.params = { id: '999' };
      AnalysisResults.findOne.mockResolvedValue(null);

      await atsController.getAnalysis(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Análise não encontrada.'
      });
    });
  });
});