const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');
const { costTracker } = require('../utils/costTracker');

// Configuração do transportador de email
const createTransporter = () => {
  // Para desenvolvimento, usar transporter de teste (exceto se SMTP estiver configurado)
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }

  // Para produção, configurar com seu provedor de email
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Enviar email de recuperação de senha
const sendPasswordResetEmail = async (email, name, token) => {
  try {
    const transporter = createTransporter();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password.html?token=${token}`;

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@cvsemfrescura.com',
      to: email,
      subject: '🔐 Redefinir Senha - CV Sem Frescura',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Redefinir Senha</title>
          <style>
            body {
              font-family: 'Inter', Arial, sans-serif;
              line-height: 1.6;
              color: #583819;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #F3EADA;
            }
            .container {
              background: #FFFCF9;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(88, 56, 25, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #583819;
              margin-bottom: 10px;
            }
            .title {
              color: #583819;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              background-color: #583819 !important;
              color: white !important;
              padding: 15px 30px;
              text-decoration: none !important;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
              border: none;
              font-size: 16px;
            }
            .button:hover {
              background-color: #512808 !important;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
              color: #856404;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 14px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CV Sem Frescura</div>
            </div>
            
            <h2 class="title">🔐 Redefinir Senha</h2>
            
            <p>Olá, <strong>${name}</strong>!</p>
            
            <p>Recebemos uma solicitação para redefinir a senha da sua conta. Se você fez esta solicitação, clique no botão abaixo para criar uma nova senha:</p>
            
            <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border: 2px solid #583819; border-radius: 8px;">
              <p style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #583819;">
                🔐 Para redefinir sua senha, clique no link abaixo:
              </p>
              <p style="margin: 0; font-size: 16px;">
                <a href="${resetUrl}" style="color: #583819; font-weight: bold; text-decoration: underline;">
                  👉 REDEFINIR MINHA SENHA AGORA
                </a>
              </p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este link é válido por <strong>1 hora</strong></li>
                <li>Só pode ser usado <strong>uma vez</strong></li>
                <li>Se você não solicitou esta redefinição, ignore este email</li>
              </ul>
            </div>
            
            <p><strong>Alternativa:</strong> Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; border: 1px solid #ddd;">
              ${resetUrl}
            </p>
            
            <p style="font-size: 12px; color: #666; margin-top: 20px;">
              <em>Nota: Se o link principal não funcionar, use o link alternativo acima.</em>
            </p>
            
            <div class="footer">
              <p>Este email foi enviado automaticamente. Não responda a este email.</p>
              <p><strong>CV Sem Frescura</strong> - IA a serviço do que importa: você, seu talento, sua carreira.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Redefinir Senha - CV Sem Frescura
        
        Olá, ${name}!
        
        Recebemos uma solicitação para redefinir a senha da sua conta.
        
        Para criar uma nova senha, acesse o link abaixo:
        ${resetUrl}
        
        IMPORTANTE:
        - Este link é válido por 1 hora
        - Só pode ser usado uma vez
        - Se você não solicitou esta redefinição, ignore este email
        
        CV Sem Frescura
        IA a serviço do que importa: você, seu talento, sua carreira.
      `
    };

    const info = await transporter.sendMail(mailOptions);

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.info('🔐 EMAIL DE RESET SIMULADO (DESENVOLVIMENTO)');
      logger.info(`📧 Para: ${email}`);
      logger.info(`👤 Nome: ${name}`);
      logger.info(`🔗 Link de reset: ${resetUrl}`);
      logger.info(`🎫 Token: ${token}`);
      logger.info('⚠️  Em produção, configure as variáveis SMTP_HOST, SMTP_USER, SMTP_PASS');
    } else {
      logger.info(`📧 Email de reset enviado para: ${email}`);

      // 💰 Rastrear custo do email
      costTracker.trackSendGrid(1, 'password_reset');
    }

    return info;

  } catch (error) {
    logger.error('Erro ao enviar email de reset:', error);
    throw error;
  }
};

// Enviar email de confirmação de senha alterada
const sendPasswordChangedEmail = async (email, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@cvsemfrescura.com',
      to: email,
      subject: '✅ Senha Alterada - CV Sem Frescura',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Senha Alterada</title>
          <style>
            body {
              font-family: 'Inter', Arial, sans-serif;
              line-height: 1.6;
              color: #583819;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #F3EADA;
            }
            .container {
              background: #FFFCF9;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(88, 56, 25, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #583819;
              margin-bottom: 10px;
            }
            .title {
              color: #583819;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .success {
              background: #d4edda;
              border: 1px solid #c3e6cb;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
              color: #155724;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 14px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CV Sem Frescura</div>
            </div>
            
            <h2 class="title">✅ Senha Alterada com Sucesso</h2>
            
            <p>Olá, <strong>${name}</strong>!</p>
            
            <div class="success">
              <strong>🎉 Sua senha foi alterada com sucesso!</strong>
              <p>Agora você já pode fazer login com sua nova senha.</p>
            </div>
            
            <p>Se você não fez esta alteração, entre em contato conosco imediatamente.</p>
            
            <div class="footer">
              <p>Este email foi enviado automaticamente. Não responda a este email.</p>
              <p><strong>CV Sem Frescura</strong> - IA a serviço do que importa: você, seu talento, sua carreira.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Senha Alterada - CV Sem Frescura
        
        Olá, ${name}!
        
        Sua senha foi alterada com sucesso!
        Agora você já pode fazer login com sua nova senha.
        
        Se você não fez esta alteração, entre em contato conosco imediatamente.
        
        CV Sem Frescura
        IA a serviço do que importa: você, seu talento, sua carreira.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email de confirmação enviado para: ${email}`);
    return info;

  } catch (error) {
    logger.error('Erro ao enviar email de confirmação:', error);
    throw error;
  }
};

// Enviar email de contato
const sendContactEmail = async ({ name, email, subject, message }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@cvsemfrescura.com.br',
      to: 'contato@cvsemfrescura.com.br',
      replyTo: email,
      subject: `[CV Sem Frescura] ${subject} - ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nova Mensagem de Contato</title>
          <style>
            body {
              font-family: 'Inter', Arial, sans-serif;
              line-height: 1.6;
              color: #583819;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #F3EADA;
            }
            .container {
              background: #FFFCF9;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(88, 56, 25, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #583819;
              padding-bottom: 20px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #583819;
              margin-bottom: 10px;
            }
            .title {
              color: #583819;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .info-section {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .info-row {
              display: flex;
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: bold;
              color: #583819;
              min-width: 100px;
            }
            .info-value {
              color: #333;
            }
            .message-section {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .message-content {
              white-space: pre-wrap;
              line-height: 1.6;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 14px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CV Sem Frescura</div>
              <h2 class="title">📧 Nova Mensagem de Contato</h2>
            </div>
            
            <div class="info-section">
              <h3 style="color: #583819; margin-bottom: 15px;">📋 Informações do Contato</h3>
              
              <div class="info-row">
                <span class="info-label">Nome:</span>
                <span class="info-value">${name}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${email}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Assunto:</span>
                <span class="info-value">${subject}</span>
              </div>
              
              <div class="info-row">
                <span class="info-label">Data:</span>
                <span class="info-value">${new Date().toLocaleString('pt-BR')}</span>
              </div>
            </div>
            
            <div class="message-section">
              <h3 style="color: #583819; margin-bottom: 15px;">💬 Mensagem</h3>
              <div class="message-content">${message}</div>
            </div>
            
            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 6px; margin: 20px 0; color: #155724;">
              <strong>💡 Dica:</strong> Para responder, basta clicar em "Responder" que o email será enviado diretamente para ${email}
            </div>
            
            <div class="footer">
              <p>Este email foi enviado automaticamente pelo formulário de contato do site.</p>
              <p><strong>CV Sem Frescura</strong> - Sistema de Contato</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Nova Mensagem de Contato - CV Sem Frescura
        
        Nome: ${name}
        Email: ${email}
        Assunto: ${subject}
        Data: ${new Date().toLocaleString('pt-BR')}
        
        Mensagem:
        ${message}
        
        ---
        Para responder, envie um email para: ${email}
      `
    };

    const info = await transporter.sendMail(mailOptions);

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.info('📧 EMAIL DE CONTATO SIMULADO (DESENVOLVIMENTO)');
      logger.info(`👤 De: ${name} (${email})`);
      logger.info(`📋 Assunto: ${subject}`);
      logger.info(`💬 Mensagem: ${message}`);
      logger.info('⚠️  Em produção, configure as variáveis SMTP_HOST, SMTP_USER, SMTP_PASS');
    } else {
      logger.info(`📧 Email de contato enviado de: ${email} para contato@cvsemfrescura.com.br`);
    }

    return info;

  } catch (error) {
    logger.error('Erro ao enviar email de contato:', error);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendContactEmail
};

