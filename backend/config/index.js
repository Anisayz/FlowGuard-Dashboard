require('dotenv').config();

function parseCorsOrigins(raw) {
  if (raw === undefined || raw === '') {
    return ['http://localhost:3000', 'http://localhost:5173'];
  }
  if (raw === '*') {
    return true;
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  /** When true (default), /health and infra payloads simulate a healthy Ryu + mitigation stack until real services are wired. Set DEMO_INFRASTRUCTURE=false to rely on live SDN probes only. */
  demoInfrastructure: process.env.DEMO_INFRASTRUCTURE !== 'false',
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtAlgorithm: process.env.JWT_ALGORITHM || 'HS256',
  jwtExpireMinutes: Number(process.env.JWT_EXPIRE_MINUTES || 60),
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin',
  sdn: {
    baseURL: process.env.SDN_CONTROLLER_URL || 'http://127.0.0.1:8080',
    timeoutMs: Number(process.env.SDN_REQUEST_TIMEOUT_MS || 10000),
  },
};
