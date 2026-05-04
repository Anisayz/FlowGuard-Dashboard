const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

function verifyAdminPassword(plainPassword) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(config.adminPassword, salt);
  return bcrypt.compareSync(plainPassword, hash);
}

function login(username, password) {
  if (username !== config.adminUsername || !verifyAdminPassword(password)) {
    return null;
  }
  const token = jwt.sign(
    { sub: username },
    config.jwtSecret,
    {
      algorithm: config.jwtAlgorithm,
      expiresIn: `${config.jwtExpireMinutes}m`,
    },
  );
  const expiresIn = config.jwtExpireMinutes * 60;
  return { access_token: token, token_type: 'bearer', expires_in: expiresIn };
}

function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      algorithms: [config.jwtAlgorithm],
    });
    const username = payload.sub;
    if (!username || username !== config.adminUsername) {
      return null;
    }
    return { username };
  } catch {
    return null;
  }
}

module.exports = {
  login,
  verifyAccessToken,
};
