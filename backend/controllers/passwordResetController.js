const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../models');
const User = db.User;
const PasswordReset = db.PasswordReset;
const { sendPasswordResetEmail } = require('../services/emailService');
const { logger } = require('../utils/logger');

// Solicitar reset de senha
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email é obrigatório'
            });
        }

        // Verificar se usuário existe
        const user = await User.findOne({ where: { email } });

        if (!user) {
            // Por segurança, sempre retornar sucesso mesmo se email não existir
            return res.status(200).json({
                success: true,
                message: 'Se o email existir em nossa base, você receberá instruções para redefinir sua senha.'
            });
        }

        // Limpar tokens antigos do usuário
        await PasswordReset.destroy({
            where: { userId: user.id }
        });

        // Gerar novo token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        // Criar registro de reset
        await PasswordReset.create({
            userId: user.id,
            token,
            expiresAt
        });

        // Enviar email
        try {
            await sendPasswordResetEmail(user.email, user.name, token);
            logger.info(`Email de reset enviado para: ${email}`);
        } catch (emailError) {
            logger.error('Erro ao enviar email de reset:', emailError);
            // Continuar mesmo se email falhar - em produção você pode querer tratar isso diferente
        }

        res.status(200).json({
            success: true,
            message: 'Se o email existir em nossa base, você receberá instruções para redefinir sua senha.'
        });

    } catch (error) {
        logger.error('Erro ao solicitar reset de senha:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
};

// Verificar se token é válido
const verifyResetToken = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token é obrigatório'
            });
        }

        // Verificar token
        const resetRequest = await PasswordReset.findOne({
            where: {
                token,
                used: false,
                expiresAt: {
                    [require('sequelize').Op.gt]: new Date()
                }
            }
        });

        if (!resetRequest) {
            return res.status(400).json({
                success: false,
                error: 'Token inválido ou expirado'
            });
        }

        // Buscar usuário separadamente
        const user = await User.findByPk(resetRequest.userId, {
            attributes: ['id', 'name', 'email']
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Token válido',
            user: {
                email: user.email,
                name: user.name
            }
        });

    } catch (error) {
        logger.error('Erro ao verificar token:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
};

// Confirmar nova senha
const confirmPasswordReset = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Token e nova senha são obrigatórios'
            });
        }

        // Validar senha
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'A senha deve ter pelo menos 6 caracteres'
            });
        }

        // Verificar token
        const resetRequest = await PasswordReset.findOne({
            where: {
                token,
                used: false,
                expiresAt: {
                    [require('sequelize').Op.gt]: new Date()
                }
            }
        });

        if (!resetRequest) {
            return res.status(400).json({
                success: false,
                error: 'Token inválido ou expirado'
            });
        }

        // Buscar usuário
        const user = await User.findByPk(resetRequest.userId);

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        // Criptografar nova senha
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Atualizar senha do usuário
        await user.update({
            password: hashedPassword
        });

        // Marcar token como usado
        await resetRequest.update({
            used: true
        });

        logger.info(`Senha redefinida para usuário: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Senha redefinida com sucesso! Você já pode fazer login.'
        });

    } catch (error) {
        logger.error('Erro ao confirmar reset de senha:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
};

// Limpar tokens expirados (para ser executado periodicamente)
const cleanupExpiredTokens = async () => {
    try {
        const deleted = await PasswordReset.destroy({
            where: {
                expiresAt: {
                    [require('sequelize').Op.lt]: new Date()
                }
            }
        });

        if (deleted > 0) {
            logger.info(`${deleted} tokens expirados removidos`);
        }
    } catch (error) {
        logger.error('Erro ao limpar tokens expirados:', error);
    }
};

module.exports = {
    requestPasswordReset,
    verifyResetToken,
    confirmPasswordReset,
    cleanupExpiredTokens
}; 