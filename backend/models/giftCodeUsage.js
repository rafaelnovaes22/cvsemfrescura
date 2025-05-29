const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const GiftCodeUsage = sequelize.define('GiftCodeUsage', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        giftCodeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'gift_codes',
                key: 'id'
            }
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        usedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'gift_code_usages',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['giftCodeId', 'userId'] // Evita uso duplicado do mesmo código pelo mesmo usuário
            }
        ]
    });

    // Definir associações
    GiftCodeUsage.associate = (models) => {
        // Um uso pertence a um código de presente
        GiftCodeUsage.belongsTo(models.GiftCode, {
            foreignKey: 'giftCodeId',
            as: 'GiftCode'
        });

        // Um uso pertence a um usuário
        GiftCodeUsage.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'User'
        });
    };

    return GiftCodeUsage;
}; 