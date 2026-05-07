/**
 * mitigationClient.js
 * Low-level HTTP client for the Mitigation Engine (FastAPI, port 9000).
 *
 * Mirrors the pattern of sdnClient.js so the rest of the codebase
 * only ever depends on typed errors and structured return values.
 *
 * Endpoints covered (from alert.py / rules.py / health.py):
 *   POST   /alert
 *   GET    /alerts          ?verdict=&src_ip=&limit=&offset=
 *   GET    /alerts/:id
 *   GET    /rules           ?active=&source=&action=&limit=&offset=
 *   GET    /rules/:id
 *   POST   /rules/manual
 *   DELETE /rules/:id
 *   GET    /health
 */

const axios = require('axios');

// ─── Config ──────────────────────────────────────────────────────────────────
// Pull from the same config object the rest of the app uses, but fall back to
// sane env-var defaults so the client works standalone in tests.
let config;
try {
  config = require('./config');
} catch {
  config = {};
}

const MITIGATION_BASE_URL =
  (config.mitigation && config.mitigation.baseURL) ||
  process.env.MITIGATION_BASE_URL ||
  'http://localhost:9000';

const MITIGATION_TIMEOUT_MS =
  (config.mitigation && config.mitigation.timeoutMs) ||
  Number(process.env.MITIGATION_TIMEOUT_MS) || 8000;
const MITIGATION_API_KEY =
  (config.mitigation && config.mitigation.apiKey) ||
  process.env.MITIGATION_API_KEY ||
  '';

// ─── Error class ─────────────────────────────────────────────────────────────
class MitigationEngineError extends Error {
  constructor(message, { status, code, cause: err } = {}) {
    super(message);
    this.name = 'MitigationEngineError';
    this.status = status;   // HTTP status from the engine, if available
    this.code = code;       // symbolic code for the caller
    if (err) this.cause = err;
  }
}

// ─── Axios error → typed error ────────────────────────────────────────────────
function wrapAxiosError(err) {
  if (err.response) {
    const detail =
      err.response.data?.detail ||
      err.response.data?.error ||
      err.message;
    return new MitigationEngineError(detail, {
      status: err.response.status,
      code: 'MITIGATION_HTTP_ERROR',
      cause: err,
    });
  }
   if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || err.code === 'ERR_CANCELED') {
    return new MitigationEngineError('Mitigation engine request timed out', {
      code: 'MITIGATION_TIMEOUT',
      cause: err,
    });
  }
  if (err.request) {
    return new MitigationEngineError('No response from mitigation engine', {
      code: 'MITIGATION_NO_RESPONSE',
      cause: err,
    });
  }
  return new MitigationEngineError(err.message || 'Mitigation request failed', {
    code: 'MITIGATION_UNKNOWN',
    cause: err,
  });
}

// ─── HTTP client factory ──────────────────────────────────────────────────────
function createHttpClient() {
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (MITIGATION_API_KEY) {
    headers['X-API-Key'] = MITIGATION_API_KEY;
  }
  return axios.create({
    baseURL: MITIGATION_BASE_URL.replace(/\/$/, ''),
    timeout: MITIGATION_TIMEOUT_MS,
    headers,
    validateStatus: (s) => s >= 200 && s < 300,
  });
}

// ─── Client factory ───────────────────────────────────────────────────────────
function createMitigationClient() {
  const http = createHttpClient();

  // Generic helpers
  async function get(path, params = {}) {
    try {
      const res = await http.get(path, { params });
      return res.data;
    } catch (err) {
      throw wrapAxiosError(err);
    }
  }

  async function post(path, body = {}) {
    try {
      const res = await http.post(path, body);
      return res.data;
    } catch (err) {
      throw wrapAxiosError(err);
    }
  }

  async function del(path) {
    try {
      const res = await http.delete(path);
      return res.data;
    } catch (err) {
      throw wrapAxiosError(err);
    }
  }

  // ── Health ─────────────────────────────────────────────────────────────────
  /**
   * GET /health
   * Returns { status, db, active_rules, total_alerts, dedup_cache, time }
   */
  async function getHealth() {
    return get('/health');
  }

  // ── Alerts ─────────────────────────────────────────────────────────────────
  /**
   * GET /alerts
   * @param {object} opts
   * @param {string}  [opts.verdict]   ATTACK | SUSPECT | ANOMALY
   * @param {string}  [opts.src_ip]
   * @param {number}  [opts.limit=100]
   * @param {number}  [opts.offset=0]
   * Returns { total, count, alerts: AlertRecord[] }
   */
  async function getAlerts({ verdict, src_ip, limit = 100, offset = 0 } = {}) {
    const params = { limit, offset };
    if (verdict) params.verdict = verdict;
    if (src_ip)  params.src_ip  = src_ip;
    return get('/alerts', params);
  }

  /**
   * GET /alerts/:id
   * Returns a single AlertRecord or throws 404.
   */
  async function getAlert(alertId) {
   return get(`/alerts/${encodeURIComponent(alertId)}`);
  }

  /**
   * POST /alert   (ML Engine → Mitigation Engine ingestion endpoint)
   * @param {object} payload  Raw ML verdict payload (normalizer handles it)
   * Returns { alert_id, rule_id, action, duplicate }
   */
  async function sendAlert(payload) {
    return post('/alert', payload);
  }

  // ── Rules ──────────────────────────────────────────────────────────────────
  /**
   * GET /rules
   * @param {object} opts
   * @param {boolean} [opts.active]
   * @param {string}  [opts.source]   manual | mitigation_engine
   * @param {string}  [opts.action]   block | ratelimit | isolate
   * @param {number}  [opts.limit=200]
   * @param {number}  [opts.offset=0]
   * Returns { count, rules: RuleRecord[] }
   */
  async function getRules({ active, source, action, limit = 200, offset = 0 } = {}) {
    const params = { limit, offset };
    if (active  !== undefined) params.active  = active;
    if (source)                params.source  = source;
    if (action)                params.action  = action;
    return get('/rules', params);
  }

  /**
   * GET /rules/:id
   * Returns a single RuleRecord or throws 404.
   */
  async function getRule(ruleId) {
    return get(`/rules/${ruleId}`);
  }

  /**
   * POST /rules/manual
   * @param {object} body
   * @param {string}  body.src_ip
   * @param {string}  body.action       block | ratelimit | isolate
   * @param {number}  [body.rate_kbps]  Required for ratelimit
   * @param {number}  [body.idle_timeout]
   * @param {number}  [body.hard_timeout]
   * @param {number}  [body.dpid]
   * Returns the created RuleRecord (status 201).
   */
  async function createManualRule(body) {
    return post('/rules/manual', body);
  }

  /**
   * DELETE /rules/:id
   * Returns { deleted: true, rule_id: "..." }
   */
  async function deleteRule(ruleId) {
    return del(`/rules/${ruleId}`);
  }

  return {
    // health
    getHealth,
    // alerts
    getAlerts,
    getAlert,
    sendAlert,
    // rules
    getRules,
    getRule,
    createManualRule,
    deleteRule,
  };
}

// ─── Singleton ────────────────────────────────────────────────────────────────
const mitigationClient = createMitigationClient();

module.exports = {
  MitigationEngineError,
  createMitigationClient,
  mitigationClient,
};