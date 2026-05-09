const axios = require('axios');
const config = require('../config');

class SdnControllerError extends Error {
  constructor(message, { status, code, cause: err } = {}) {
    super(message);
    this.name = 'SdnControllerError';
    this.status = status;
    this.code = code;
    if (err) this.cause = err;
  }
}

function wrapAxiosError(err) {
  if (err.response) {
    return new SdnControllerError(err.message, {
      status: err.response.status,
      code: 'SDN_HTTP_ERROR',
      cause: err,
    });
  }
  if (err.code === 'ECONNABORTED') {
    return new SdnControllerError('SDN controller request timed out', {
      code: 'SDN_TIMEOUT',
      cause: err,
    });
  }
  if (err.request) {
    return new SdnControllerError('No response from SDN controller', {
      code: 'SDN_NO_RESPONSE',
      cause: err,
    });
  }
  return new SdnControllerError(err.message || 'SDN request failed', {
    code: 'SDN_UNKNOWN',
    cause: err,
  });
}

function createSdnHttpClient() {
  return axios.create({
    baseURL: config.sdn.baseURL.replace(/\/$/, ''),
    timeout: config.sdn.timeoutMs,
    headers: {
      Accept: 'application/json',
      ...(config.sdn.apiKey ? { 'X-API-Key': config.sdn.apiKey } : {}),
    },
    validateStatus: (s) => s >= 200 && s < 300,
  });
}
 
function createSdnClient() {
  const http = createSdnHttpClient();

  async function get(path) {
    try {
      const res = await http.get(path.startsWith('/') ? path : `/${path}`);
      return res.data;
    } catch (err) {
      throw wrapAxiosError(err);
    }
  }

  return {
    get,

    // ── Topology ────────────────────────────────────────────────────────────
    fetchSwitches: () => get('/v1.0/topology/switches'),
    fetchLinks:    () => get('/v1.0/topology/links'),
    fetchHosts:    () => get('/v1.0/topology/hosts'),

    
    getHealth: () => get('/health'),

 
    async fetchTopologyBundle() {
      const [switches, links, hosts] = await Promise.all([
        get('/v1.0/topology/switches'),
        get('/v1.0/topology/links'),
        get('/v1.0/topology/hosts'),
      ]);
      return { switches, links, hosts };
    },
  };
}

const defaultClient = createSdnClient();

module.exports = {
  SdnControllerError,
  createSdnHttpClient,
  createSdnClient,
  sdnClient: defaultClient,
};