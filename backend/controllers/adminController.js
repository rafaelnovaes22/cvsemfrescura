const GiftCode = require('../models/giftCode');
const GiftCodeUsage = require('../models/giftCodeUsage');
const User = require('../models/user');
const { Op } = require('sequelize');

// Dashboard com estatísticas gerais
exports.getDashboard = async (req, res) => {
    try {
        const stats = await Promise.all([
            // Total de códigos
            GiftCode.count(),

            // Códigos ativos
            GiftCode.count({ where: { isActive: true } }),

            // Códigos usados completamente
            GiftCode.count({
                where: {
                    usedCount: { [Op.gte]: GiftCode.literal('max_uses') }
                }
            }),

            // Total de usos hoje
            GiftCodeUsage.count({
                where: {
                    createdAt: {
                        [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            }),

            // Códigos que expiram em 7 dias
            GiftCode.count({
                where: {
                    expiresAt: {
                        [Op.lte]: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        [Op.gt]: new Date()
                    }
                }
            })
        ]);

        res.json({
            totalCodes: stats[0],
            activeCodes: stats[1],
            exhaustedCodes: stats[2],
            usagesToday: stats[3],
            expiringCodes: stats[4]
        });

    } catch (error) {
        console.error('❌ Erro no dashboard:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// Listar todos os códigos com filtros
exports.listCodes = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            search,
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;

        // Construir filtros
        const where = {};

        if (status === 'active') {
            where.isActive = true;
            where.usedCount = { [Op.lt]: GiftCode.literal('max_uses') };
        } else if (status === 'inactive') {
            where.isActive = false;
        } else if (status === 'exhausted') {
            where.usedCount = { [Op.gte]: GiftCode.literal('max_uses') };
        } else if (status === 'expired') {
            where.expiresAt = { [Op.lt]: new Date() };
        }

        if (search) {
            where.code = { [Op.iLike]: `%${search}%` };
        }

        const { count, rows } = await GiftCode.findAndCountAll({
            where,
            order: [[sortBy, sortOrder]],
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [
                {
                    model: GiftCodeUsage,
                    as: 'usages',
                    include: [{ model: User, attributes: ['id', 'email'] }]
                }
            ]
        });

        res.json({
            codes: rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalItems: count,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('❌ Erro ao listar códigos:', error);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

// Criar códigos em lote
exports.createBulkCodes = async (req, res) => {
    try {
        const {
            prefix = 'BULK',
            quantity = 10,
            maxUses = 1,
            expiresAt = null,
            description = ''
        } = req.body;

        const codes = [];
        const createdCodes = [];

        // Gerar códigos únicos
        for (let i = 0; i < quantity; i++) {
            let code;
            let attempts = 0;

            do {
                const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
                code = `${prefix}${randomPart}`;
                attempts++;

                if (attempts > 10) {
                    throw new Error('Muitas tentativas para gerar código único');
                }
            } while (codes.includes(code) || await GiftCode.findOne({ where: { code } }));

            codes.push(code);
        }

        // Criar códigos no banco
        for (const code of codes) {
            const giftCode = await GiftCode.create({
                code,
                maxUses,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                isActive: true,
                usedCount: 0,
                createdById: req.user?.id,
                description
            });

            createdCodes.push(giftCode);
        }

        res.status(201).json({
            success: true,
            message: `${quantity} códigos criados com sucesso!`,
            codes: createdCodes
        });

    } catch (error) {
        console.error('❌ Erro ao criar códigos em lote:', error);
        res.status(500).json({ error: 'Erro ao criar códigos em lote.' });
    }
};

// Atualizar código
exports.updateCode = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive, maxUses, expiresAt, description } = req.body;

        const giftCode = await GiftCode.findByPk(id);
        if (!giftCode) {
            return res.status(404).json({ error: 'Código não encontrado.' });
        }

        await giftCode.update({
            isActive: isActive !== undefined ? isActive : giftCode.isActive,
            maxUses: maxUses !== undefined ? maxUses : giftCode.maxUses,
            expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : giftCode.expiresAt,
            description: description !== undefined ? description : giftCode.description
        });

        res.json({
            success: true,
            message: 'Código atualizado com sucesso!',
            code: giftCode
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar código:', error);
        res.status(500).json({ error: 'Erro ao atualizar código.' });
    }
};

// Deletar código
exports.deleteCode = async (req, res) => {
    try {
        const { id } = req.params;

        const giftCode = await GiftCode.findByPk(id);
        if (!giftCode) {
            return res.status(404).json({ error: 'Código não encontrado.' });
        }

        // Verificar se tem usos
        const usageCount = await GiftCodeUsage.count({ where: { giftCodeId: id } });

        if (usageCount > 0) {
            // Se já foi usado, apenas desativar
            await giftCode.update({ isActive: false });
            return res.json({
                success: true,
                message: 'Código desativado (já possui histórico de uso).'
            });
        }

        // Se não foi usado, pode deletar
        await giftCode.destroy();

        res.json({
            success: true,
            message: 'Código removido com sucesso!'
        });

    } catch (error) {
        console.error('❌ Erro ao deletar código:', error);
        res.status(500).json({ error: 'Erro ao deletar código.' });
    }
};

// Relatório de uso
exports.getUsageReport = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            codeId
        } = req.query;

        const where = {};

        if (startDate && endDate) {
            where.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        if (codeId) {
            where.giftCodeId = codeId;
        }

        const usages = await GiftCodeUsage.findAll({
            where,
            include: [
                {
                    model: GiftCode,
                    attributes: ['code', 'description']
                },
                {
                    model: User,
                    attributes: ['email', 'name']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Estatísticas
        const stats = {
            totalUsages: usages.length,
            uniqueUsers: [...new Set(usages.map(u => u.userId))].length,
            uniqueCodes: [...new Set(usages.map(u => u.giftCodeId))].length
        };

        res.json({
            usages,
            stats
        });

    } catch (error) {
        console.error('❌ Erro no relatório:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório.' });
    }
};

// Exportar códigos para CSV
exports.exportCodes = async (req, res) => {
    try {
        const { status } = req.query;

        const where = {};
        if (status === 'active') {
            where.isActive = true;
        } else if (status === 'inactive') {
            where.isActive = false;
        }

        const codes = await GiftCode.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });

        // Gerar CSV
        let csv = 'Código,Status,Usos,Máximo,Expira Em,Criado Em\n';

        codes.forEach(code => {
            const status = code.isActive ? 'Ativo' : 'Inativo';
            const expiresAt = code.expiresAt ? code.expiresAt.toISOString() : 'Nunca';
            const createdAt = code.createdAt.toISOString();

            csv += `${code.code},${status},${code.usedCount},${code.maxUses},${expiresAt},${createdAt}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=gift-codes.csv');
        res.send(csv);

    } catch (error) {
        console.error('❌ Erro ao exportar:', error);
        res.status(500).json({ error: 'Erro ao exportar códigos.' });
    }
}; 