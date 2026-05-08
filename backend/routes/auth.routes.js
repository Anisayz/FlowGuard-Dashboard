const { Router } = require('express');
const authService = require('../services/authService');
const requireAuth = require('../middleware/requireAuth');

const router = Router();

router.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(422).json({ detail: 'username and password required' });
  }
  const result = authService.login(username, password);
  if (!result) {
    return res.status(401).json({ detail: 'Invalid username or password' });
  }
  return res.json(result);
});

router.get('/auth/me', requireAuth, (req, res) => {
  res.json({ username: req.user.username });
});

module.exports = router;