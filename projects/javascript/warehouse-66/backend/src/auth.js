import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const TOKEN_TTL = '12h';

// Подписать JWT
export function signToken(user) {
  return jwt.sign(
    { sub: user.user_id, username: user.username, role: user.role },
    SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

// Распарсить заголовок и положить пользователя в req.user; не падать если нет токена
export function attachUser(req, _res, next) {
  const auth = req.headers.authorization || '';
  const m = auth.match(/^Bearer\s+(.+)$/);
  if (!m) { req.user = null; return next(); }
  try {
    req.user = jwt.verify(m[1], SECRET);
  } catch {
    req.user = null;
  }
  next();
}

// Требовать авторизацию (любая роль кроме guest по умолчанию)
export function requireAuth(allowedRoles = ['admin', 'client']) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Требуется авторизация' });
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    next();
  };
}
