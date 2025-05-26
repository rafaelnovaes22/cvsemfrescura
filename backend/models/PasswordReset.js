const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
    const PasswordReset = sequelize.define('PasswordReset', {
        id: {
            type: DataTypes.UUID,
            defaultValue: () => uuidv4(),
            primaryKey: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        token: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        used: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'PasswordResets',
        timestamps: true,
        indexes: [
            {
                fields: ['token']
            },
            {
                fields: ['userId']
            },
            {
                fields: ['expiresAt']
            }
        ]
    });

    // Associações
    PasswordReset.associate = (models) => {
        PasswordReset.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    // Método para gerar token único
    PasswordReset.generateToken = () => {
        return require('crypto').randomBytes(32).toString('hex');
    };

    // Método para verificar se token é válido
    PasswordReset.isValidToken = async function (token) {
        const resetRequest = await this.findOne({
            where: {
                token,
                used: false,
                expiresAt: {
                    [sequelize.Sequelize.Op.gt]: new Date()
                }
            },
            include: [{
                model: sequelize.models.User,
                as: 'user'
            }]
        });

        return resetRequest;
    };

    // Método para marcar token como usado
    PasswordReset.markAsUsed = async function (token) {
        await this.update(
            { used: true },
            { where: { token } }
        );
    };

    // Método para limpar tokens expirados
    PasswordReset.cleanupExpired = async function () {
        await this.destroy({
            where: {
                expiresAt: {
                    [sequelize.Sequelize.Op.lt]: new Date()
                }
            }
        });
    };

    return PasswordReset;
}; 