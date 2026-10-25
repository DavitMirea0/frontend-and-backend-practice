const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Нет токена авторизации' });
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Нет токена авторизации' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { return res.status(401).json({ message: 'Токен недействителен' }); }
}

function adminMiddleware(req, res, next) {
  if (req.user.role_id !== 3) return res.status(403).json({ message: 'Доступ запрещён' });
  next();
}

module.exports = { authMiddleware, adminMiddleware };
