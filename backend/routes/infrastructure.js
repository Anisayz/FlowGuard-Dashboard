const { Router } = require('express');
const { sdnClient, SdnControllerError }            = require('../services/sdnClient');
const { mitigationClient, MitigationEngineError }  = require('../clients/mitigationClient');
const { mlClient, MlEngineError }                  = require('../clients/mlClient');
const config = require('../config');

const router = Router();

// ─── GET /topology ────────────────────────────────────────────────────────────
// Ryu: GET /topology → { switches: [{dpid, address}], links: [{src_dpid, src_port, dst_dpid, dst_port}] }
router.get('/topology', async (req, res, next) => {
  try {
    const data = await sdnClient.get('/topology');
    console.debug('[topology] Raw response from Ryu:', JSON.stringify(data, null, 2));
    return res.json({ ...data, _source: 'live' });
  } catch (err) {
    if (err instanceof SdnControllerError) {
      console.error('[topology] Ryu error:', {
        status:  err.status,
        code:    err.code,
        message: err.message,
      });
      const status = err.status || 502;
      return res.status(status).json({ detail: err.message, _source: 'live' });
    }
    next(err);
  }
});

// ─── GET /switches ────────────────────────────────────────────────────────────
// Ryu: GET /switches → { switches: [{dpid, address, active_rules}] }
router.get('/switches', async (req, res, next) => {
  try {
    const data = await sdnClient.get('/switches');
    console.debug('[switches] Raw response from Ryu:', JSON.stringify(data, null, 2));
    return res.json({ ...data, _source: 'live' });
  } catch (err) {
    if (err instanceof SdnControllerError) {
      console.error('[switches] Ryu error:', {
        status:  err.status,
        code:    err.code,
        message: err.message,
      });
      const status = err.status || 502;
      return res.status(status).json({ detail: err.message, _source: 'live' });
    }
    next(err);
  }
});

// ─── GET /mactable ────────────────────────────────────────────────────────────
// Ryu: GET /mactable → { count, entries: [{dpid, mac, port}] }
router.get('/mactable', async (req, res, next) => {
  try {
    const data = await sdnClient.get('/mactable');
    console.debug('[mactable] Raw response from Ryu:', JSON.stringify(data, null, 2));
    return res.json({ ...data, _source: 'live' });
  } catch (err) {
    if (err instanceof SdnControllerError) {
      console.error('[mactable] Ryu error:', {
        status:  err.status,
        code:    err.code,
        message: err.message,
      });
      const status = err.status || 502;
      return res.status(status).json({ detail: err.message, _source: 'live' });
    }
    next(err);
  }
});

// ─── GET /sdn/info ────────────────────────────────────────────────────────────
// Ryu: GET /health → { status, switches, rules, time }
router.get('/sdn/info', async (req, res, next) => {
  try {
    const ryuHealth = await sdnClient.get('/health');
    console.debug('[sdn/info] Raw response from Ryu:', JSON.stringify(ryuHealth, null, 2));

    return res.json({
      api_endpoint:       config.sdn.baseURL,
      rest_api:           '/firewall/rules, /topology, /switches, /mactable, /health, /dump',
      protocol:           'OpenFlow 1.3',
      version:            'Ryu SDN Controller',
      architecture:       'Centralized SDN Controller',
      status:             ryuHealth.status,
      switches_connected: ryuHealth.switches,
      active_rules:       ryuHealth.rules,
      last_topology_sync: new Date(ryuHealth.time * 1000).toISOString(),
      _source: 'live',
    });
  } catch (err) {
    if (err instanceof SdnControllerError) {
      console.error('[sdn/info] Ryu error:', {
        status:  err.status,
        code:    err.code,
        message: err.message,
      });
      const status = err.status || 502;
      return res.status(status).json({ detail: err.message, _source: 'live' });
    }
    next(err);
  }
});

// ─── GET /engine/info ─────────────────────────────────────────────────────────
// Mitigation Engine: GET /health → { status, db, active_rules, total_alerts, dedup_cache }
router.get('/engine/info', async (req, res, next) => {
  try {
    const engineHealth = await mitigationClient.getHealth();
    console.debug('[engine/info] Raw response from mitigation engine:', JSON.stringify(engineHealth, null, 2));

    return res.json({
      api_endpoint:   (config.mitigation && config.mitigation.baseURL) ||
                      process.env.MITIGATION_BASE_URL ||
                      'http://localhost:9000',
      status:         engineHealth.status,
      db:             engineHealth.db,
      active_rules:   engineHealth.active_rules,
      total_alerts:   engineHealth.total_alerts,
      dedup_cache:    engineHealth.dedup_cache,
      last_heartbeat: new Date().toISOString(),
      actions:        ['block', 'ratelimit', 'isolate'],
      source_types:   ['manual', 'mitigation_engine'],
      endpoints: {
        health: 'GET /health',
        alert:  'POST /alert',
        rules:  'GET|POST|DELETE /rules',
        alerts: 'GET /alerts',
      },
      _source: 'live',
    });
  } catch (err) {
    if (err instanceof MitigationEngineError) {
      console.error('[engine/info] Mitigation engine error:', {
        status:  err.status,
        code:    err.code,
        message: err.message,
      });
      const status = err.status || 502;
      return res.status(status).json({ detail: err.message, _source: 'live' });
    }
    next(err);
  }
});

// ─── GET /ml/info ─────────────────────────────────────────────────────────────
router.get('/ml/info', async (req, res, next) => {
  try {
    const info = await mlClient.getInfo();
    console.debug('[ml/info] Raw response from ML engine:', JSON.stringify(info, null, 2));
    return res.json({ ...info, _source: 'live' });
  } catch (err) {
    if (err instanceof MlEngineError) {
      console.error('[ml/info] ML engine error:', {
        status:  err.status,
        code:    err.code,
        message: err.message,
      });
      const status = err.status || 502;
      return res.status(status).json({ detail: err.message, _source: 'live' });
    }
    next(err);
  }
});

module.exports = router;