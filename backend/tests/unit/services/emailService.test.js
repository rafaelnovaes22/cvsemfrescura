const nodemailer = require('nodemailer');
const emailService = require('../../../services/emailService');
const { logger } = require('../../../utils/logger');

// Mock das dependências
jest.mock('nodemailer', () => ({
  createTransport: jest.fn()
}));
jest.mock('../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('Email Service', () => {
  let mockTransporter;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock do transporter
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({
        messageId: 'test-message-id',
        accepted: ['test@example.com'],
        rejected: []
      })
    };

    nodemailer.createTransport.mockReturnValue(mockTransporter);

    // Mock do logger - não precisa resetar, já está mockado

    // Limpar variáveis de ambiente para cada teste
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_PORT;
    delete process.env.FROM_EMAIL;
    delete process.env.FRONTEND_URL;
  });

  describe('sendPasswordResetEmail', () => {
    const testEmail = 'test@example.com';
    const testName = 'João Silva';
    const testToken = 'reset-token-123';

    it('deve enviar email de reset de senha com sucesso', async () => {
      // Arrange
      process.env.FROM_EMAIL = 'noreply@test.com';
      process.env.FRONTEND_URL = 'https://test.com';

      // Act
      const result = await emailService.sendPasswordResetEmail(testEmail, testName, testToken);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@test.com',
          to: testEmail,
          subject: expect.stringContaining('Redefinir Senha'),
          html: expect.stringContaining(testName)
        })
      );
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
    });

    it('deve usar valores padrão quando variáveis de ambiente não estão definidas', async () => {
      // Act
      await emailService.sendPasswordResetEmail(testEmail, testName, testToken);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@cvsemfrescura.com', // Valor padrão
          to: testEmail
        })
      );
    });

    it('deve incluir URL de reset correta no email', async () => {
      // Arrange
      process.env.FRONTEND_URL = 'https://myapp.com';

      // Act
      await emailService.sendPasswordResetEmail(testEmail, testName, testToken);

      // Assert
      const mailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailCall.html).toContain('https://myapp.com/reset-password.html?token=reset-token-123');
    });

    it('deve usar transporter de desenvolvimento quando SMTP não está configurado', async () => {
      // Act
      await emailService.sendPasswordResetEmail(testEmail, testName, testToken);

      // Assert
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });
    });

    it('deve usar transporter de produção quando SMTP está configurado', async () => {
      // Arrange
      process.env.SMTP_HOST = 'smtp.gmail.com';
      process.env.SMTP_USER = 'user@test.com';
      process.env.SMTP_PASS = 'password123';
      process.env.SMTP_PORT = '465';

      // Act
      await emailService.sendPasswordResetEmail(testEmail, testName, testToken);

      // Assert
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: '465',
        secure: false,
        auth: {
          user: 'user@test.com',
          pass: 'password123'
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    });

    it('deve tratar erros durante envio de email', async () => {
      // Arrange
      const error = new Error('SMTP Error');
      mockTransporter.sendMail.mockRejectedValue(error);

      // Act
      const result = await emailService.sendPasswordResetEmail(testEmail, testName, testToken);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('SMTP Error');
      expect(logger.error).toHaveBeenCalledWith(
        'Erro ao enviar email de recuperação de senha:',
        error
      );
    });

    it('deve validar parâmetros obrigatórios', async () => {
      // Act & Assert
      await expect(emailService.sendPasswordResetEmail('', testName, testToken))
        .resolves.toEqual(expect.objectContaining({ success: false }));

      await expect(emailService.sendPasswordResetEmail(testEmail, '', testToken))
        .resolves.toEqual(expect.objectContaining({ success: false }));

      await expect(emailService.sendPasswordResetEmail(testEmail, testName, ''))
        .resolves.toEqual(expect.objectContaining({ success: false }));
    });
  });

  describe('sendPasswordChangedEmail', () => {
    const testEmail = 'test@example.com';
    const testName = 'João Silva';

    it('deve enviar email de confirmação de mudança de senha', async () => {
      // Act
      const result = await emailService.sendPasswordChangedEmail(testEmail, testName);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: testEmail,
          subject: expect.stringContaining('Senha Alterada'),
          html: expect.stringContaining(testName)
        })
      );
      expect(result.success).toBe(true);
    });

    it('deve incluir informações de segurança no email', async () => {
      // Act
      await emailService.sendPasswordChangedEmail(testEmail, testName);

      // Assert
      const mailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailCall.html).toContain('senha foi alterada com sucesso');
      expect(mailCall.html).toContain('não foi você');
    });

    it('deve tratar erros durante envio', async () => {
      // Arrange
      const error = new Error('Network Error');
      mockTransporter.sendMail.mockRejectedValue(error);

      // Act
      const result = await emailService.sendPasswordChangedEmail(testEmail, testName);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network Error');
    });
  });

  describe('sendContactEmail', () => {
    const contactData = {
      name: 'João Silva',
      email: 'joao@example.com',
      subject: 'Dúvida sobre o sistema',
      message: 'Como posso melhorar meu currículo?'
    };

    it('deve enviar email de contato com sucesso', async () => {
      // Act
      const result = await emailService.sendContactEmail(contactData);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining(contactData.subject),
          html: expect.stringContaining(contactData.name),
          replyTo: contactData.email
        })
      );
      expect(result.success).toBe(true);
    });

    it('deve incluir todas as informações do contato no email', async () => {
      // Act
      await emailService.sendContactEmail(contactData);

      // Assert
      const mailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailCall.html).toContain(contactData.name);
      expect(mailCall.html).toContain(contactData.email);
      expect(mailCall.html).toContain(contactData.message);
    });

    it('deve configurar reply-to corretamente', async () => {
      // Act
      await emailService.sendContactEmail(contactData);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          replyTo: contactData.email
        })
      );
    });

    it('deve validar dados de contato obrigatórios', async () => {
      // Arrange
      const incompleteData = { name: 'João' };

      // Act
      const result = await emailService.sendContactEmail(incompleteData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('obrigatórios');
    });

    it('deve escapar HTML no conteúdo do email', async () => {
      // Arrange
      const maliciousData = {
        ...contactData,
        message: '<script>alert("xss")</script>Mensagem normal'
      };

      // Act
      await emailService.sendContactEmail(maliciousData);

      // Assert
      const mailCall = mockTransporter.sendMail.mock.calls[0][0];
      expect(mailCall.html).not.toContain('<script>');
      expect(mailCall.html).toContain('Mensagem normal');
    });
  });

  describe('createTransport', () => {
    it('deve criar transporter de desenvolvimento quando SMTP não configurado', () => {
      // Arrange - Sem variáveis SMTP

      // Act
      emailService.sendPasswordResetEmail('test@test.com', 'Test', 'token');

      // Assert
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });
    });

    it('deve criar transporter de produção quando SMTP configurado', () => {
      // Arrange
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_USER = 'user@test.com';
      process.env.SMTP_PASS = 'password';

      // Act
      emailService.sendPasswordResetEmail('test@test.com', 'Test', 'token');

      // Assert
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.test.com',
          auth: {
            user: 'user@test.com',
            pass: 'password'
          }
        })
      );
    });

    it('deve usar porta padrão quando não especificada', () => {
      // Arrange
      process.env.SMTP_HOST = 'smtp.test.com';
      process.env.SMTP_USER = 'user@test.com';
      process.env.SMTP_PASS = 'password';
      // SMTP_PORT não definida

      // Act
      emailService.sendPasswordResetEmail('test@test.com', 'Test', 'token');

      // Assert
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 587 // Porta padrão
        })
      );
    });
  });
});