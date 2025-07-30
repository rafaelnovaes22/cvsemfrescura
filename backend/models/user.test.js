const { DataTypes } = require('sequelize');
const User = require('./user');

// O mock do db já é feito automaticamente pelo moduleNameMapper no jest.config.js

describe('User Model', () => {
  let sequelize;

  beforeEach(() => {
    sequelize = require('../db');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Model Definition', () => {
    it('should have correct model name', () => {
      expect(User.name).toBe('User');
    });

    it('should have correct table name', () => {
      expect(User.tableName).toBe('users');
    });

    it('should have timestamps enabled', () => {
      expect(User.options.timestamps).toBe(true);
    });
  });

  describe('Field Definitions', () => {
    // Para sequelize-mock, precisamos acessar os atributos de forma diferente
    const fields = User.rawAttributes || {};

    it('should have id field as primary key with auto increment', () => {
      expect(fields.id).toBeDefined();
      expect(fields.id.primaryKey).toBe(true);
      expect(fields.id.autoIncrement).toBe(true);
      expect(fields.id.type.constructor.name).toBe('INTEGER');
    });

    it('should have required name field', () => {
      expect(fields.name).toBeDefined();
      expect(fields.name.allowNull).toBe(false);
      expect(fields.name.type.constructor.name).toBe('STRING');
    });

    it('should have required unique email field with validation', () => {
      expect(fields.email).toBeDefined();
      expect(fields.email.allowNull).toBe(false);
      expect(fields.email.unique).toBe(true);
      expect(fields.email.type.constructor.name).toBe('STRING');
      expect(fields.email.validate).toEqual({ isEmail: true });
    });

    it('should have required password field', () => {
      expect(fields.password).toBeDefined();
      expect(fields.password.allowNull).toBe(false);
      expect(fields.password.type.constructor.name).toBe('STRING');
    });

    it('should have email_verified field with default false', () => {
      expect(fields.email_verified).toBeDefined();
      expect(fields.email_verified.defaultValue).toBe(false);
      expect(fields.email_verified.type.constructor.name).toBe('BOOLEAN');
    });

    it('should have onboarding_completed field with default false', () => {
      expect(fields.onboarding_completed).toBeDefined();
      expect(fields.onboarding_completed.defaultValue).toBe(false);
      expect(fields.onboarding_completed.type.constructor.name).toBe('BOOLEAN');
    });

    it('should have preferences field as JSON with default empty object', () => {
      expect(fields.preferences).toBeDefined();
      expect(fields.preferences.defaultValue).toEqual({});
      expect(fields.preferences.type.constructor.name).toBe('JSON');
    });

    it('should have optional job_area field', () => {
      expect(fields.job_area).toBeDefined();
      expect(fields.job_area.allowNull).toBe(true);
      expect(fields.job_area.type.constructor.name).toBe('STRING');
    });

    it('should have optional experience_level field', () => {
      expect(fields.experience_level).toBeDefined();
      expect(fields.experience_level.allowNull).toBe(true);
      expect(fields.experience_level.type.constructor.name).toBe('STRING');
    });

    it('should have optional last_login field', () => {
      expect(fields.last_login).toBeDefined();
      expect(fields.last_login.allowNull).toBe(true);
      expect(fields.last_login.type.constructor.name).toBe('DATE');
    });

    it('should have credits field with default 0', () => {
      expect(fields.credits).toBeDefined();
      expect(fields.credits.defaultValue).toBe(0);
      expect(fields.credits.type.constructor.name).toBe('INTEGER');
    });

    it('should have isGuestAccount field with default false', () => {
      expect(fields.isGuestAccount).toBeDefined();
      expect(fields.isGuestAccount.defaultValue).toBe(false);
      expect(fields.isGuestAccount.type.constructor.name).toBe('BOOLEAN');
    });

    it('should have isAdmin field with default false', () => {
      expect(fields.isAdmin).toBeDefined();
      expect(fields.isAdmin.defaultValue).toBe(false);
      expect(fields.isAdmin.type.constructor.name).toBe('BOOLEAN');
    });

    it('should have metadata field as JSON with default empty object', () => {
      expect(fields.metadata).toBeDefined();
      expect(fields.metadata.defaultValue).toEqual({});
      expect(fields.metadata.type.constructor.name).toBe('JSON');
    });
  });

  describe('Model Instance', () => {
    it('should create a user instance with default values', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password'
      };

      const user = User.build(userData);

      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.password).toBe(userData.password);
      expect(user.email_verified).toBe(false);
      expect(user.onboarding_completed).toBe(false);
      expect(user.credits).toBe(0);
      expect(user.isGuestAccount).toBe(false);
      expect(user.isAdmin).toBe(false);
      expect(user.preferences).toEqual({});
      expect(user.metadata).toEqual({});
    });
  });
});