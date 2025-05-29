const db = require('../models');
const Analysis = db.Analysis;
const User = db.User;

/**
 * Buscar histórico de análises do usuário
 */
exports.getHistory = async (req, res) => {
    try {
        const userEmail = req.user.email;

        // Buscar análises do usuário, ordenadas por data mais recente
        const analyses = await Analysis.findAll({
            where: {
                user_email: userEmail
            },
            order: [['created_at', 'DESC']],
            limit: 50, // Limitar a 50 análises mais recentes
            attributes: [
                'id',
                'filename',
                'summary',
                'average_score',
                'jobs_analyzed',
                'status',
                'analysis_type',
                'credits_used',
                'created_at'
            ]
        });

        res.json({
            total: analyses.length,
            analyses: analyses.map(analysis => ({
                id: analysis.id,
                filename: analysis.filename || 'Arquivo não especificado',
                summary: analysis.summary,
                average_score: parseFloat(analysis.average_score) || 0,
                jobs_analyzed: analysis.jobs_analyzed,
                status: analysis.status,
                analysis_type: analysis.analysis_type,
                credits_used: analysis.credits_used,
                created_at: analysis.created_at,
                formatted_date: new Date(analysis.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            }))
        });

    } catch (error) {
        console.error('❌ [HISTÓRICO] Erro ao buscar análises:', error);
        res.status(500).json({
            error: 'Erro ao carregar histórico de análises'
        });
    }
};

/**
 * Buscar uma análise específica com dados completos
 */
exports.getAnalysisById = async (req, res) => {
    try {
        const { id } = req.params;
        const userEmail = req.user.email;

        // Buscar análise específica do usuário
        const analysis = await Analysis.findOne({
            where: {
                id: id,
                user_email: userEmail
            }
        });

        if (!analysis) {
            return res.status(404).json({
                error: 'Análise não encontrada'
            });
        }

        res.json({
            id: analysis.id,
            filename: analysis.filename,
            job_links: analysis.job_links,
            result_data: analysis.result_data,
            summary: analysis.summary,
            average_score: parseFloat(analysis.average_score) || 0,
            jobs_analyzed: analysis.jobs_analyzed,
            status: analysis.status,
            analysis_type: analysis.analysis_type,
            credits_used: analysis.credits_used,
            created_at: analysis.created_at,
            formatted_date: new Date(analysis.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        });

    } catch (error) {
        console.error('❌ [ANÁLISE] Erro ao buscar análise:', error);
        res.status(500).json({
            error: 'Erro ao carregar análise'
        });
    }
};

/**
 * Deletar uma análise específica
 */
exports.deleteAnalysis = async (req, res) => {
    try {
        const { id } = req.params;
        const userEmail = req.user.email;

        // Buscar e deletar análise do usuário
        const deleted = await Analysis.destroy({
            where: {
                id: id,
                user_email: userEmail
            }
        });

        if (!deleted) {
            return res.status(404).json({
                error: 'Análise não encontrada'
            });
        }

        res.json({
            message: 'Análise deletada com sucesso'
        });

    } catch (error) {
        console.error('❌ [DELETE] Erro ao deletar análise:', error);
        res.status(500).json({
            error: 'Erro ao deletar análise'
        });
    }
};

/**
 * Reprocessar uma análise específica (caso tenha falhado na exibição)
 */
exports.reprocessAnalysis = async (req, res) => {
    try {
        const { id } = req.params;
        const userEmail = req.user.email;

        // Buscar análise específica do usuário
        const analysis = await Analysis.findOne({
            where: {
                id: id,
                user_email: userEmail
            }
        });

        if (!analysis) {
            return res.status(404).json({
                error: 'Análise não encontrada'
            });
        }

        // Verificar se a análise tem dados válidos
        if (!analysis.result_data) {
            return res.status(400).json({
                error: 'Análise não possui dados para reprocessamento'
            });
        }

        // Retornar dados da análise para o frontend processar
        res.json({
            id: analysis.id,
            result_data: analysis.result_data,
            filename: analysis.filename,
            message: 'Análise reprocessada com sucesso'
        });

        console.log(`🔄 [REPROCESSAR] Análise ${id} reprocessada para ${userEmail}`);

    } catch (error) {
        console.error('❌ [REPROCESSAR] Erro ao reprocessar análise:', error);
        res.status(500).json({
            error: 'Erro ao reprocessar análise'
        });
    }
}; 