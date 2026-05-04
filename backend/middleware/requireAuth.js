const authService = require('../services/authService');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).set('WWW-Authenticate', 'Bearer').json({ detail: 'Not authenticated' });
  }
  const user = authService.verifyAccessToken(parts[1]);
  if (!user) {
    return res.status(401).set('WWW-Authenticate', 'Bearer').json({ detail: 'Not authenticated' });
  }
  req.user = user;
  return next();
}

module.exports = requireAuth;
