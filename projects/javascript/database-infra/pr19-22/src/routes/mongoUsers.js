const { Router } = require('express');
const { createUser, getUsers, getUserById, updateUser, deleteUser } =
  require('../controllers/mongoUsersController');
const { cacheMiddleware } = require('../middleware/cache');

const MONGO_TTL = 60; // 1 минута

const router = Router();

router.post('/',     createUser);
router.get('/',      cacheMiddleware(() => 'mongo:users:all', MONGO_TTL),        getUsers);
router.get('/:id',   cacheMiddleware((req) => `mongo:users:${req.params.id}`, MONGO_TTL), getUserById);
router.patch('/:id', updateUser);
router.delete('/:id',deleteUser);

module.exports = router;
