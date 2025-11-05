const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const AnalysisResults = sequelize.define('AnalysisResults', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    resumeFileName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resumeContent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    jobUrls: {
        type: DataTypes.JSON,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('jobUrls');
            if (!rawValue) return [];

            // Se for string, fazer parse
            if (typeof rawValue === 'string') {
                try {
                    return JSON.parse(rawValue);
                } catch (error) {
                    console.error('Erro ao fazer parse de jobUrls:', error);
                    return [];
                }
            }

            // Se já for array/objeto, retornar diretamente
            return rawValue;
        },
        set(value) {
            // Garantir que seja salvo como JSON válido
            if (Array.isArray(value) || typeof value === 'object') {
                this.setDataValue('jobUrls', value);
            } else if (typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    this.setDataValue('jobUrls', parsed);
                } catch (error) {
                    console.error('Erro ao definir jobUrls:', error);
                    this.setDataValue('jobUrls', []);
                }
            } else {
                this.setDataValue('jobUrls', []);
            }
        }
    },
    result: {
        type: DataTypes.JSON,
        allowNull: false,
        get() {
            const rawValue = this.getDataValue('result');
            if (!rawValue) return {};

            // Se for string, fazer parse
            if (typeof rawValue === 'string') {
                try {
                    return JSON.parse(rawValue);
                } catch (error) {
                    console.error('Erro ao fazer parse de result:', error);
                    return {};
                }
            }

            // Se já for objeto, retornar diretamente
            return rawValue;
        },
        set(value) {
            // Garantir que seja salvo como JSON válido
            if (typeof value === 'object') {
                this.setDataValue('result', value);
            } else if (typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    this.setDataValue('result', parsed);
                } catch (error) {
                    console.error('Erro ao definir result:', error);
                    this.setDataValue('result', {});
                }
            } else {
                this.setDataValue('result', {});
            }
        }
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
}, {
    tableName: 'AnalysisResults',
    timestamps: true,
    hooks: {
        beforeCreate: (analysis) => {
            // Validar dados antes de criar
            if (!analysis.result || typeof analysis.result !== 'object') {
                throw new Error('Result deve ser um objeto válido');
            }

            if (!analysis.userId) {
                throw new Error('UserId é obrigatório');
            }
        },
        beforeUpdate: (analysis) => {
            // Validar dados antes de atualizar
            if (analysis.changed('result') && (!analysis.result || typeof analysis.result !== 'object')) {
                throw new Error('Result deve ser um objeto válido');
            }
        }
    }
});

// Método para buscar análises de um usuário com dados formatados
AnalysisResults.findUserAnalyses = async function (userId, limit = 50) {
    const analyses = await this.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: limit
    });

    return analyses.map(analysis => ({
        id: analysis.id,
        fileName: analysis.resumeFileName,
        jobUrls: analysis.jobUrls,
        createdAt: analysis.createdAt,
        jobCount: Array.isArray(analysis.jobUrls) ? analysis.jobUrls.length : 0,
        summary: {
            hasCompatibilityScores: !!(analysis.result && analysis.result.jobs),
            hasKeywords: !!(analysis.result && analysis.result.job_keywords),
            hasEvaluations: !!(analysis.result && (analysis.result.resumo || analysis.result.idiomas))
        }
    }));
};

// Método para buscar análise específica com validação de usuário
AnalysisResults.findUserAnalysis = async function (analysisId, userId) {
    const analysis = await this.findOne({
        where: {
            id: analysisId,
            userId: userId
        }
    });

    if (!analysis) {
        return null;
    }

    // Preparar dados para o frontend
    const result = analysis.result;
    result.isHistoricalView = true;
    result.originalDate = analysis.createdAt;
    result.fileName = analysis.resumeFileName;
    result.analysisId = analysis.id;

    return result;
};

module.exports = AnalysisResults; 