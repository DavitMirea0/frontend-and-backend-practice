const User = require('../models/PgUser');
const { saveToCache, invalidateUsersCache } = require('../middleware/cache');

const PG_USERS_TTL = 60; // 1 минута

const createUser = async (req, res) => {
  try {
    const { first_name, last_name, age } = req.body;
    if (!first_name || !last_name || age === undefined)
      return res.status(400).json({ error: 'Поля first_name, last_name и age обязательны' });
    const user = await User.create({ first_name, last_name, age });
    await invalidateUsersCache('pg');
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/pg/users — кэш 1 минута (middleware навешивается в роутере)
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({ order: [['id', 'ASC']] });
    await saveToCache(req.cacheKey, users, req.cacheTTL);
    res.json({ source: 'server', data: users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/pg/users/:id — кэш 1 минута
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    await saveToCache(req.cacheKey, user, req.cacheTTL);
    res.json({ source: 'server', data: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    await user.update(req.body);
    await invalidateUsersCache('pg', req.params.id);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    await user.destroy();
    await invalidateUsersCache('pg', req.params.id);
    res.json({ message: `Пользователь #${req.params.id} удалён` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createUser, getUsers, getUserById, updateUser, deleteUser };
