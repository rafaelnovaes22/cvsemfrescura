const { describe, it, expect, beforeEach } = require('@jest/globals');
const SequelizeMock = require('sequelize-mock');

describe('User Model', () => {
  let dbMock;
  let User;

  beforeEach(() => {
    // Criar nova instância do mock para cada teste
    dbMock = new SequelizeMock();
    
    // Definir o modelo User com o mock
    User = dbMock.define('User', {
      id: {
        type: SequelizeMock.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: SequelizeMock.STRING,
        allowNull: false
      },
      email: {
        type: SequelizeMock.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: SequelizeMock.STRING,
        allowNull: false
      },
      email_verified: {
        type: SequelizeMock.BOOLEAN,
        defaultValue: false
      },
      onboarding_completed: {
        type: SequelizeMock.BOOLEAN,
        defaultValue: false
      },
      preferences: {
        type: SequelizeMock.JSON,
        defaultValue: {}
      },
      job_area: {
        type: SequelizeMock.STRING,
        allowNull: true
      },
      experience_level: {
        type: SequelizeMock.STRING,
        allowNull: true
      },
      last_login: {
        type: SequelizeMock.DATE,
        allowNull: true
      },
      credits: {
        type: SequelizeMock.INTEGER,
        defaultValue: 0
      },
      isGuestAccount: {
        type: SequelizeMock.BOOLEAN,
        defaultValue: false
      },
      isAdmin: {
        type: SequelizeMock.BOOLEAN,
        defaultValue: false
      },
      metadata: {
        type: SequelizeMock.JSON,
        defaultValue: {}
      }
    }, {
      tableName: 'users',
      timestamps: true
    });
  });

  describe('Model Instance', () => {
    it('should create a user instance with required fields', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword123'
      };

      const user = await User.create(userData);

      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.password).toBe(userData.password);
    });

    it('should have default values for optional fields', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword123'
      };

      const user = await User.create(userData);

      expect(user.email_verified).toBe(false);
      expect(user.onboarding_completed).toBe(false);
      expect(user.credits).toBe(0);
      expect(user.isGuestAccount).toBe(false);
      expect(user.isAdmin).toBe(false);
      expect(user.preferences).toEqual({});
      expect(user.metadata).toEqual({});
    });

    it('should update user credits', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword123',
        credits: 5
      });

      await user.update({ credits: 10 });

      expect(user.credits).toBe(10);
    });

    it('should handle user with custom preferences', async () => {
      const preferences = {
        theme: 'dark',
        notifications: true
      };

      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword123',
        preferences
      });

      expect(user.preferences).toEqual(preferences);
    });
  });
});