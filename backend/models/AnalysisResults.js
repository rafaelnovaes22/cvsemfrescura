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
        allowNull: true
    },
    result: {
        type: DataTypes.JSON,
        allowNull: false
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
    timestamps: true
});

module.exports = AnalysisResults; 