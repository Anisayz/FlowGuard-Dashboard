const { Router } = require('express');
const dashboardStore            = require('../services/dashboardStore');
const networkResourceService    = require('../services/networkResourceService');
const { sdnClient, SdnControllerError } = require('../services/sdnClient');
const { mitigationClient, MitigationEngineError } = require('../clients/mitigationClient');
const { mlClient, MlEngineError }                  = require('../clients/mlClient');
const config = require('../config');

const router = Router();
 
router.get('/topology', async (req, res, next) => {
  try {
    const data = await networkResourceService.getTopology();
    res.json(data);
  } catch (e) {
    next(e);
  }
});
 
router.get('/switches', async (req, res, next) => {
  try {
    const data = await networkResourceService.getSwitches();
    res.json(data);
  } catch (e) {
    next(e);
  }
});
 
router.get('/mactable', async (req, res, next) => {
  try {
   
    const data = await sdnClient.get('/mactable');
    
    res.json(data);
  } catch (err) {
    if (err instanceof SdnControllerError) {
      console.warn('[mactable] Ryu unreachable, using demo data:', err.code);
      res.set('X-Data-Source', 'demo');
      return res.json({
        count:   dashboardStore.fakeMacTable.length,
        entries: dashboardStore.fakeMacTable,
        _source: 'demo',
      });
    }
    next(err);
  }
});

// ─── GET /sdn/info ────────────────────────────────────────────────────────────
// Build live SDN info from Ryu /health + config, fall back to fake
router.get('/sdn/info', async (req, res, next) => {
  try {
    const ryuHealth = await sdnClient.get('/health');
    // ryuHealth: { status, switches, rules, time }
    return res.json({
      api_endpoint:         config.sdn.baseURL,
      rest_api:             '/firewall/rules, /topology, /switches, /mactable',
      protocol:             'OpenFlow 1.3',
      version:              'Ryu SDN Controller',
      architecture:         'Centralized SDN Controller',
      status:               ryuHealth.status || 'ok',
      switches_connected:   ryuHealth.switches ?? null,
      active_rules:         ryuHealth.rules    ?? null,
      last_topology_sync:   new Date().toISOString(),
      _source: 'live',
    });
  } catch (err) {
    if (err instanceof SdnControllerError) {
      console.warn('[sdn/info] Ryu unreachable, using demo data:', err.code);
      res.set('X-Data-Source', 'demo');
      return res.json({
        ...dashboardStore.fakeSdnInfo,
        api_endpoint:       config.sdn.baseURL,
        last_topology_sync: new Date().toISOString(),
        _source: 'demo',
      });
    }
    next(err);
  }
});

// ─── GET /engine/info ─────────────────────────────────────────────────────────
// Build live engine info from Mitigation Engine /health, fall back to fake
router.get('/engine/info', async (req, res, next) => {
  try {
    const engineHealth = await mitigationClient.getHealth();
    // engineHealth: { status, db, active_rules, total_alerts, dedup_cache, time }
    return res.json({
      api_endpoint:       (config.mitigation && config.mitigation.baseURL) ||
                          process.env.MITIGATION_BASE_URL ||
                          'http://localhost:9000',
      status:             engineHealth.status,
      db:                 engineHealth.db,
      active_rules:       engineHealth.active_rules,
      total_alerts:       engineHealth.total_alerts,
      dedup_cache:        engineHealth.dedup_cache,
      last_heartbeat:     new Date().toISOString(),
      actions:            ['block', 'ratelimit', 'isolate'],
      source_types:       ['manual', 'mitigation_engine'],
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
      console.warn('[engine/info] Mitigation engine unreachable, using demo data:', err.code);
      res.set('X-Data-Source', 'demo');
      return res.json({
        ...dashboardStore.fakeEngineInfo,
        last_heartbeat: new Date().toISOString(),
        _source: 'demo',
      });
    }
    next(err);
  }
});

// ─── GET /ml/info ─────────────────────────────────────────────────────────────
// Live ML Engine /info endpoint — new route the dashboard can use
router.get('/ml/info', async (req, res, next) => {
  try {
    const info = await mlClient.getInfo();
    return res.json({ ...info, _source: 'live' });
  } catch (err) {
    if (err instanceof MlEngineError) {
      console.warn('[ml/info] ML engine unreachable:', err.code);
      res.set('X-Data-Source', 'demo');
      return res.json({
        model_type:      'RandomForestClassifier',
        anomaly_type:    'Autoencoder (reconstruction error)',
        n_features:      null,
        classes:         ['BENIGN', 'DDoS Attack', 'Port Scan', 'Brute Force'],
        ae_threshold:    0.003863,
        rf_conf_high:    0.70,
        verdict_actions: { ATTACK: 'block', SUSPECT: 'alert', ANOMALY: 'rate_limit+alert', BENIGN: 'pass' },
        _source: 'demo',
      });
    }
    next(err);
  }
});

module.exports = router;