const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GiftCode = sequelize.define('GiftCode', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Descrição do código (ex: Curso RH Super Sincero, Promoção Black Friday)'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    usedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    maxUses: {
      type: DataTypes.INTEGER,
      defaultValue: 1, // Por padrão, cada código pode ser usado apenas uma vez
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true, // Null significa que não expira
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: true, // Referência ao usuário administrador que criou o código
    }
  }, {
    tableName: 'gift_codes',
    timestamps: true,
  });

  // Definir associações
  GiftCode.associate = (models) => {
    // Um código pode ter múltiplos usos
    GiftCode.hasMany(models.GiftCodeUsage, {
      foreignKey: 'giftCodeId',
      as: 'usages'
    });

    // Um código foi criado por um usuário
    GiftCode.belongsTo(models.User, {
      foreignKey: 'createdById',
      as: 'creator'
    });
  };

  return GiftCode;
};
