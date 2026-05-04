const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use(express.json());

  app.use(routes);

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ detail: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
