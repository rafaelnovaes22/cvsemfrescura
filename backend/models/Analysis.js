const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Analysis = sequelize.define('Analysis', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        filename: {
            type: DataTypes.STRING,
            allowNull: true
        },
        job_links: {
            type: DataTypes.JSON,
            allowNull: true
        },
        result_data: {
            type: DataTypes.JSON,
            allowNull: false
        },
        summary: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        average_score: {
            type: DataTypes.DECIMAL(4, 2),
            allowNull: true
        },
        jobs_analyzed: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        status: {
            type: DataTypes.ENUM('processing', 'completed', 'failed'),
            defaultValue: 'completed'
        },
        analysis_type: {
            type: DataTypes.STRING,
            defaultValue: 'universal_ats'
        },
        credits_used: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        }
    }, {
        tableName: 'analyses',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    // Associações
    Analysis.associate = function (models) {
        Analysis.belongsTo(models.User, {
            foreignKey: 'user_email',
            targetKey: 'email',
            as: 'user'
        });
    };

    return Analysis;
}; 