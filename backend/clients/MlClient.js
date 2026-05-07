/**
 * mlClient.js
 * Low-level HTTP client for the ML Engine (FastAPI, port 8000).
 *
 * Endpoints covered (from api.py):
 *   POST  /predict            — single flow classification
 *   POST  /predict/batch      — batch flow classification (max 1000)
 *   GET   /health             — liveness + model status
 *   GET   /info               — model metadata, classes, thresholds
 */

const axios = require('axios');

// ─── Config ───────────────────────────────────────────────────────────────────
let config;
try {
  config = require('./config');
} catch {
  config = {};
}

const ML_BASE_URL =
  (config.ml && config.ml.baseURL) ||
  process.env.ML_BASE_URL ||
  'http://localhost:8000';

const ML_TIMEOUT_MS =
  (config.ml && config.ml.timeoutMs) ||
  Number(process.env.ML_TIMEOUT_MS || 10000);  // inference can take a moment

// ─── Error class ─────────────────────────────────────────────────────────────
class MlEngineError extends Error {
  constructor(message, { status, code, cause: err } = {}) {
    super(message);
    this.name = 'MlEngineError';
    this.status = status;
    this.code = code;
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
    return new MlEngineError(detail, {
      status: err.response.status,
      code: 'ML_HTTP_ERROR',
      cause: err,
    });
  }
  if (err.code === 'ECONNABORTED') {
    return new MlEngineError('ML engine request timed out', {
      code: 'ML_TIMEOUT',
      cause: err,
    });
  }
  if (err.request) {
    return new MlEngineError('No response from ML engine', {
      code: 'ML_NO_RESPONSE',
      cause: err,
    });
  }
  return new MlEngineError(err.message || 'ML request failed', {
    code: 'ML_UNKNOWN',
    cause: err,
  });
}

// ─── HTTP client factory ──────────────────────────────────────────────────────
function createHttpClient() {
  return axios.create({
    baseURL: ML_BASE_URL.replace(/\/$/, ''),
    timeout: ML_TIMEOUT_MS,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    validateStatus: (s) => s >= 200 && s < 300,
  });
}

// ─── Client factory ───────────────────────────────────────────────────────────
function createMlClient() {
  const http = createHttpClient();

  async function get(path) {
    try {
      const res = await http.get(path);
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

  // ── Health ─────────────────────────────────────────────────────────────────
  /**
   * GET /health
   * Returns { status, models_loaded, n_features, n_classes }
   */
  async function getHealth() {
    return get('/health');
  }

  // ── Info ───────────────────────────────────────────────────────────────────
  /**
   * GET /info
   * Returns {
   *   model_type, anomaly_type, n_features,
   *   classes, ae_threshold, rf_conf_high,
   *   verdict_actions: { ATTACK, SUSPECT, ANOMALY, BENIGN }
   * }
   */
  async function getInfo() {
    return get('/info');
  }

  // ── Inference ──────────────────────────────────────────────────────────────
  /**
   * POST /predict
   * @param {object} features   Flat dict of CICFlowMeter feature name → float
   * @param {string} [flow_id]  Optional correlation ID
   * Returns VerdictResponse:
   *   { flow_id, label, confidence, is_attack, anomaly_score,
   *     anomaly_flagged, verdict, source, action,
   *     class_probabilities, inference_ms }
   */
  async function predict(features, flow_id = null) {
    return post('/predict', { features, flow_id });
  }

  /**
   * POST /predict/batch
   * @param {Array<{ features: object, flow_id?: string }>} flows
   * Returns BatchVerdictResponse:
   *   { results, total, attack_count, suspect_count,
   *     anomaly_count, benign_count, total_inference_ms }
   */
  async function predictBatch(flows) {
    if (!Array.isArray(flows) || flows.length === 0) {
      throw new MlEngineError('flows must be a non-empty array', { code: 'ML_BAD_INPUT' });
    }
    if (flows.length > 1000) {
      throw new MlEngineError('batch size exceeds 1000 flows', { code: 'ML_BAD_INPUT' });
    }
    return post('/predict/batch', { flows });
  }

  return {
    getHealth,
    getInfo,
    predict,
    predictBatch,
  };
}

// ─── Singleton ────────────────────────────────────────────────────────────────
const mlClient = createMlClient();

module.exports = {
  MlEngineError,
  createMlClient,
  mlClient,
};