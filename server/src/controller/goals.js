const { NotFoundError, InvariantError } = require('../exceptions');
const Goals = require('../models/goals.js');

const createGoal = async (req, res, next) => {
  const data = req.validated;
  const goal = await Goals.create({ userId: req.user.id, ...data });
  if (!goal) {
    return next(new InvariantError('Gagal membuat goal'));
  }
  res.status(201).json(goal);
};

const getAllGoals = async (req, res, next) => {
  try {
    const goals = await Goals.getAll(req.user.id);
    res.json(goals);
  } catch (err) {
    next(err);
  }
};

const getGoalById = async (req, res, next) => {
  try {
    const goal = await Goals.findById(req.params.id);
    if (!goal) {
      return next(new NotFoundError('Goal tidak ditemukan'));
    }
    res.json(goal);
  } catch (err) {
    next(err);
  }
};

const editGoalById = async (req, res, next) => {
  const data = req.validated;
  const goal = await Goals.update({
    id: req.params.id,
    userId: req.user.id,
    ...data,
  });

  if (!goal) {
    return next(new NotFoundError('Goal tidak ditemukan'));
  }

  res.json(goal);
};

const deleteGoalById = async (req, res, next) => {
  const goal = await Goals.delete(req.params.id, req.user.id);
  if (!goal) {
    return next(new NotFoundError('Goal tidak ditemukan'));
  }
  res.status(204).end();
};

module.exports = {
  createGoal,
  getAllGoals,
  getGoalById,
  editGoalById,
  deleteGoalById,
};
