// models/User.js
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Por favor, forneça seu nome']
    },
    email: {
        type: String,
        required: [true, 'Por favor, forneça seu email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Por favor, forneça um email válido']
    },
    password: {
        type: String,
        required: [true, 'Por favor, forneça uma senha'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Por favor, confirme sua senha'],
        validate: {
            // Este validador só funciona em CREATE e SAVE
            validator: function (el) {
                return el === this.password;
            },
            message: 'As senhas não coincidem!'
        }
    },
    passwordChangedAt: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

// Middleware de pré-salvamento para criptografar a senha
userSchema.pre('save', async function (next) {
    // Apenas executar esta função se a senha foi modificada
    if (!this.isModified('password')) return next();

    try {
        // Hash da senha com custo de 12
        this.password = await bcrypt.hash(this.password, 12);

        // Excluir passwordConfirm
        this.passwordConfirm = undefined;
        next();
    } catch (error) {
        return next(new Error('Erro ao processar a senha: ' + error.message));
    }
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function (next) {
    // this aponta para a consulta atual
    this.find({ active: { $ne: false } });
    next();
});

// Método para comparar senhas
userSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword
) {
    try {
        return await bcrypt.compare(candidatePassword, userPassword);
    } catch (error) {
        console.error('Erro ao verificar a senha:', error);
        throw new Error('Falha na verificação de senha');
    }
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );

        return JWTTimestamp < changedTimestamp;
    }

    // Falso significa NÃO alterado
    return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;