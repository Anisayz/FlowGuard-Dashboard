const { Router } = require('express');
const dashboardStore = require('../services/dashboardStore');
const healthService  = require('../services/healthService');
const { mitigationClient, MitigationEngineError } = require('../clients/mitigationClient');
const { mlClient, MlEngineError }                  = require('../clients/mlClient');

const router = Router();

 
router.get('/health', async (req, res, next) => {
  try {
   
    const [ryuResult, mitigationResult, mlResult] = await Promise.allSettled([
      healthService.getHealth(),               
      mitigationClient.getHealth(),
      mlClient.getHealth(),
    ]);

    const ryu = ryuResult.status === 'fulfilled'
      ? ryuResult.value
      : { controller: 'unhealthy', ryu: 'down', error: ryuResult.reason?.code };

    const mitigation = mitigationResult.status === 'fulfilled'
      ? {
          status:       mitigationResult.value.status,
          db:           mitigationResult.value.db,
          active_rules: mitigationResult.value.active_rules,
          total_alerts: mitigationResult.value.total_alerts,
          dedup_cache:  mitigationResult.value.dedup_cache,
        }
      : { status: 'unreachable', error: mitigationResult.reason?.code };

    const ml = mlResult.status === 'fulfilled'
      ? {
          status:        mlResult.value.status,
          models_loaded: mlResult.value.models_loaded,
          n_features:    mlResult.value.n_features,
          n_classes:     mlResult.value.n_classes,
        }
      : { status: 'unreachable', error: mlResult.reason?.code };

    const allHealthy =
      (ryu.controller === 'healthy' || ryu.ryu === 'up') &&
      mitigation.status === 'ok' &&
      ml.status === 'ok';

    return res.json({
      overall:    allHealthy ? 'healthy' : 'degraded',
      ryu,
      mitigation,
      ml,
      timestamp:  new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /ml/status ───────────────────────────────────────────────────────────
// Fetches /health + /info from ML Engine and reshapes to dashboard's expected format.
router.get('/ml/status', async (req, res, next) => {
  try {
    const [healthResult, infoResult] = await Promise.allSettled([
      mlClient.getHealth(),
      mlClient.getInfo(),
    ]);

    if (healthResult.status === 'rejected' && infoResult.status === 'rejected') {
      // Both failed — serve demo snapshot with a flag
      console.warn('[ml/status] ML engine unreachable, using demo data');
      res.set('X-Data-Source', 'demo');
      return res.json({ ...dashboardStore.getMlStatusSnapshot(), _source: 'demo' });
    }

    const health = healthResult.status === 'fulfilled' ? healthResult.value : {};
    const info   = infoResult.status   === 'fulfilled' ? infoResult.value   : {};

    // Merge into the shape the dashboard already expects
    const mlStatus = {
      status:          health.status === 'ok' ? 'active' : 'degraded',
      models_loaded:   health.models_loaded ?? false,
      algorithm:       info.model_type   || 'Random Forest',
      anomaly_type:    info.anomaly_type || 'Autoencoder',
      n_features:      health.n_features ?? info.n_features ?? null,
      n_classes:       health.n_classes  ?? null,
      output_classes:  info.classes      || [],
      ae_threshold:    info.ae_threshold ?? null,
      rf_conf_high:    info.rf_conf_high ?? null,
      verdict_actions: info.verdict_actions || {
        ATTACK:  'block',
        SUSPECT: 'alert',
        ANOMALY: 'rate_limit+alert',
        BENIGN:  'pass',
      },
      // Keep fake metrics that have no live source yet
      accuracy:         dashboardStore.getMlStatusSnapshot().accuracy,
      flows_analyzed:   dashboardStore.getMlStatusSnapshot().flows_analyzed,
      recent_detections:dashboardStore.getMlStatusSnapshot().recent_detections,
      _source: 'live',
    };

    return res.json(mlStatus);
  } catch (err) {
    next(err);
  }
});

// ─── GET /stats/timeline ─────────────────────────────────────────────────────
// No live time-series API exists yet — served from store
router.get('/stats/timeline', (req, res) => {
  res.json(dashboardStore.getAlertTimeline());
});

// ─── GET /stats/attack-types ──────────────────────────────────────────────────
// Derive from live alerts when possible, fall back to store
router.get('/stats/attack-types', async (req, res, next) => {
  try {
    const data = await mitigationClient.getAlerts({ limit: 500 });
    const counts = {};
    for (const a of data.alerts || []) {
      const key = a.label || a.verdict || 'Unknown';
      counts[key] = (counts[key] || 0) + 1;
    }
    const typeColors = {
      'DDoS Attack':    '#ff0066',
      'Port Scan':      '#ffaa00',
      'Brute Force':    '#ff6600',
      'ICMP Flood':     '#00ff88',
      BENIGN:           '#00aaff',
      ANOMALY:          '#aa00ff',
      SUSPECT:          '#ffff00',
      Unknown:          '#8888aa',
    };
    const result = Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: typeColors[name] || '#8888aa',
    }));
    return res.json(result.length ? result : dashboardStore.getAttackTypes());
  } catch (err) {
    if (err instanceof MitigationEngineError) {
      res.set('X-Data-Source', 'demo');
      return res.json(dashboardStore.getAttackTypes());
    }
    next(err);
  }
});

// ─── GET /stats/recent-alerts ─────────────────────────────────────────────────
// Last 5 alerts from live engine, fall back to store
router.get('/stats/recent-alerts', async (req, res, next) => {
  try {
    const data = await mitigationClient.getAlerts({ limit: 5 });
    const severityColors = {
      critical: '#ff0066', high: '#ffaa00', medium: '#ffff00', low: '#00aaff',
    };
    // Map engine alerts → dashboard recent-alerts shape
    const verdictToSeverity = (verdict, confidence) => {
      if (verdict === 'ATTACK') return confidence >= 0.90 ? 'critical' : 'high';
      if (verdict === 'SUSPECT') return 'medium';
      if (verdict === 'ANOMALY') return 'medium';
      return 'low';
    };
    const alerts = (data.alerts || []).map(a => {
      const severity = verdictToSeverity(a.verdict, a.confidence);
      return {
        time:     a.received_at ? new Date(a.received_at).toTimeString().slice(0, 8) : '--:--:--',
        src:      a.src_ip  || '—',
        dst:      a.dst_ip  || '—',
        type:     a.label   || a.verdict || 'Unknown',
        severity: severity.charAt(0).toUpperCase() + severity.slice(1),
        sColor:   severityColors[severity] || '#8888aa',
        status:   a.action  || 'log_only',
        _source:  'live',
      };
    });
    if (alerts.length) {
      return res.json(alerts);
    }
    res.set('X-Data-Source', 'demo');
    return res.json(dashboardStore.getRecentAlerts());
  } catch (err) {
    if (err instanceof MitigationEngineError) {
      res.set('X-Data-Source', 'demo');
      return res.json(dashboardStore.getRecentAlerts());
    }    next(err);
  }
});

module.exports = router;