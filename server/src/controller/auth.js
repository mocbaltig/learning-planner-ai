const jwt = require('jsonwebtoken');
const config = require('../utils/config');
const Profiles = require('../models/profiles');
const Users = require('../models/users');
const { ConflictError, UnauthorizedError, NotFoundError } = require('../exceptions');

function generateToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '15m' });
}

function generateRefreshToken(userId) {
  return jwt.sign({ userId }, config.jwtRefreshSecret, { expiresIn: '7d' });
}

const register = async (req, res, next) => {
  const { email, password } = req.validated;
  const existing = await Users.emailExist(email);
  if (existing) {
    return next(new ConflictError('Email sudah terdaftar'));
  }
  const userResult = await Users.create({ email, password });
  const userId = userResult.id;

  await Profiles.init(userId);

  const token = generateToken(userId);
  const refreshToken = generateRefreshToken(userId);

  res.status(201).json({ token, refreshToken, userId });
};

const login = async (req, res, next) => {
  const { email, password } = req.validated;

  const userId = await Users.verify(email, password);

  if (!userId) {
    return next(new UnauthorizedError('Email atau password salah'));
  }

  const token = generateToken(userId);
  const refreshToken = generateRefreshToken(userId);
  res.json({ token, refreshToken, userId });
};

const me = async (req, res, next) => {
  const profile = await Profiles.findByUserId(req.user.id);

  if (!profile) {
    return next(new NotFoundError('User tidak ditemukan'));
  }

  res.json(profile);
};

const updateProfile = async (req, res, next) => {
  try {
    const updated = await Profiles.updateByUserId(req.user.id, req.body);
    if (!updated) {
      return next(new NotFoundError('Profile tidak ditemukan'));
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, me, updateProfile };
