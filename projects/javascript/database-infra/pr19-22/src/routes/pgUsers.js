const { Router } = require('express');
const { createUser, getUsers, getUserById, updateUser, deleteUser } =
  require('../controllers/pgUsersController');
const { cacheMiddleware } = require('../middleware/cache');

const PG_TTL = 60; // 1 минута

const router = Router();

router.post('/',     createUser);
router.get('/',      cacheMiddleware(() => 'pg:users:all', PG_TTL),        getUsers);
router.get('/:id',   cacheMiddleware((req) => `pg:users:${req.params.id}`, PG_TTL), getUserById);
router.patch('/:id', updateUser);
router.delete('/:id',deleteUser);

module.exports = router;
