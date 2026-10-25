const User = require('../models/MongoUser');
const { saveToCache, invalidateUsersCache } = require('../middleware/cache');

const MONGO_USERS_TTL = 60; // 1 минута

const createUser = async (req, res) => {
  try {
    const { first_name, last_name, age } = req.body;
    if (!first_name || !last_name || age === undefined)
      return res.status(400).json({ error: 'Поля first_name, last_name и age обязательны' });
    const user = await new User({ first_name, last_name, age }).save();
    await invalidateUsersCache('mongo');
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/mongo/users — кэш 1 минута
const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    await saveToCache(req.cacheKey, users, req.cacheTTL);
    res.json({ source: 'server', data: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/mongo/users/:id — кэш 1 минута
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    await saveToCache(req.cacheKey, user, req.cacheTTL);
    res.json({ source: 'server', data: user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    await invalidateUsersCache('mongo', req.params.id);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    await invalidateUsersCache('mongo', req.params.id);
    res.json({ message: 'Пользователь удалён' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createUser, getUsers, getUserById, updateUser, deleteUser };
