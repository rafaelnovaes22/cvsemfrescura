const { sendContactEmail } = require('../services/emailService');
const { logger } = require('../utils/logger');

// Enviar email de contato
const sendContact = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validação básica
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Todos os campos são obrigatórios'
            });
        }

        // Validação de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email inválido'
            });
        }

        // Mapear assuntos para categorias mais legíveis
        const subjectMap = {
            'suporte': 'Suporte Técnico',
            'pagamento': 'Pagamentos e Planos',
            'funcionalidade': 'Nova Funcionalidade',
            'bug': 'Reportar Bug',
            'feedback': 'Feedback e Sugestões',
            'privacidade': 'Privacidade e Dados',
            'parceria': 'Parcerias',
            'outro': 'Outro'
        };

        const subjectText = subjectMap[subject] || subject;

        // Enviar email
        await sendContactEmail({
            name,
            email,
            subject: subjectText,
            message
        });

        logger.info(`Email de contato enviado de: ${email} - Assunto: ${subjectText}`);

        res.json({
            success: true,
            message: 'Mensagem enviada com sucesso! Responderemos em breve.'
        });

    } catch (error) {
        logger.error('Erro ao enviar email de contato:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor. Tente novamente mais tarde.'
        });
    }
};

module.exports = {
    sendContact
}; 