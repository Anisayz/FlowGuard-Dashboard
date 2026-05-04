const { sdnClient, SdnControllerError } = require('./sdnClient');
const config = require('../config');

/**
 * Application-level SDN controller access (Ryu REST or compatible).
 * Route handlers should depend on this module, not on axios directly.
 */
async function getLiveTopology() {
  return sdnClient.fetchTopologyBundle();
}

/**
 * Lightweight reachability check (does not assume a dedicated health path).
 */
async function probeController() {
  try {
    await sdnClient.fetchSwitches();
    return { reachable: true, baseURL: config.sdn.baseURL };
  } catch (err) {
    if (err instanceof SdnControllerError) {
      return {
        reachable: false,
        baseURL: config.sdn.baseURL,
        error: err.code || err.message,
      };
    }
    throw err;
  }
}

module.exports = {
  getLiveTopology,
  probeController,
  SdnControllerError,
};
