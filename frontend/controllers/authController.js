const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const LoginAttempt = require('../models/LoginAttempt');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Log de tentativa de login
  console.log(`Tentativa de login para o e-mail: ${email}`);

  if (!email || !password) {
    console.warn(`Tentativa de login sem e-mail ou senha completos`);
    return next(new AppError('Please provide email and password!', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  // Registrar tentativa no banco
  const attempt = await LoginAttempt.create({
    email,
    ip: req.ip,
    timestamp: new Date()
  });

  // Verificar número de tentativas recentes
  const attempts = await LoginAttempt.countDocuments({
    email,
    ip: req.ip,
    timestamp: { $gt: new Date(Date.now() - 15 * 60 * 1000) }
  });

  if (attempts > 5) {
    console.warn(`Muitas tentativas de login para ${email} (${attempts} tentativas em 15 minutos)`);
    return next(new AppError('Too many login attempts. Try again later.', 429));
  }

  if (!user) {
    console.warn(`Tentativa de login com e-mail inexistente: ${email}`);
    return next(new AppError('Incorrect email or password', 401));
  }

  const isPasswordValid = await user.correctPassword(password, user.password);
  if (!isPasswordValid) {
    console.warn(`Tentativa de login com senha incorreta para: ${email}`);
    return next(new AppError('Incorrect email or password', 401));
  }

  console.log(`Login bem-sucedido para o usuário: ${email}`);
  createSendToken(user, 200, res);
});

// Adicionar função de logout
exports.logout = catchAsync(async (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({ status: 'success' });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  req.user = currentUser;
  next();
});
