const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  onboarding_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  job_area: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  experience_level: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  credits: {
    type: DataTypes.INTEGER,
    defaultValue: 0, // Novo usuário não recebe créditos automáticos
  },
  isGuestAccount: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;
