const { Router } = require('express');
const healthService  = require('../services/healthService');
const { mitigationClient, MitigationEngineError } = require('../clients/mitigationClient');
const { mlClient, MlEngineError }                  = require('../clients/mlClient');

const router = Router();

// ─── GET /health ──────────────────────────────────────────────────────────────
router.get('/health', async (req, res, next) => {
  try {
    const [ryuResult, mitigationResult, mlResult] = await Promise.allSettled([
      healthService.getHealth(),
      mitigationClient.getHealth(),
      mlClient.getHealth(),
    ]);

    console.debug('[health] Ryu raw response:', JSON.stringify(
      ryuResult.status === 'fulfilled' ? ryuResult.value : { error: ryuResult.reason?.message, code: ryuResult.reason?.code }, null, 2
    ));
    console.debug('[health] Mitigation engine raw response:', JSON.stringify(
      mitigationResult.status === 'fulfilled' ? mitigationResult.value : { error: mitigationResult.reason?.message, code: mitigationResult.reason?.code }, null, 2
    ));
    console.debug('[health] ML engine raw response:', JSON.stringify(
      mlResult.status === 'fulfilled' ? mlResult.value : { error: mlResult.reason?.message, code: mlResult.reason?.code }, null, 2
    ));

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
      overall:   allHealthy ? 'healthy' : 'degraded',
      ryu,
      mitigation,
      ml,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /ml/status ───────────────────────────────────────────────────────────
router.get('/ml/status', async (req, res, next) => {
  try {
    const [healthResult, infoResult] = await Promise.allSettled([
      mlClient.getHealth(),
      mlClient.getInfo(),
    ]);

    console.debug('[ml/status] ML health raw response:', JSON.stringify(
      healthResult.status === 'fulfilled' ? healthResult.value : { error: healthResult.reason?.message, code: healthResult.reason?.code }, null, 2
    ));
    console.debug('[ml/status] ML info raw response:', JSON.stringify(
      infoResult.status === 'fulfilled' ? infoResult.value : { error: infoResult.reason?.message, code: infoResult.reason?.code }, null, 2
    ));

    if (healthResult.status === 'rejected' && infoResult.status === 'rejected') {
      console.error('[ml/status] ML engine unreachable — health error:', healthResult.reason?.message, '| info error:', infoResult.reason?.message);
      return res.status(502).json({
        detail: 'ML engine unreachable',
        health_error: healthResult.reason?.message,
        info_error:   infoResult.reason?.message,
        _source: 'live',
      });
    }

    const health = healthResult.status === 'fulfilled' ? healthResult.value : {};
    const info   = infoResult.status   === 'fulfilled' ? infoResult.value   : {};

    const mlStatus = {
      status:          health.status === 'ok' ? 'active' : 'degraded',
      models_loaded:   health.models_loaded ?? false,
      algorithm:       info.model_type   || null,
      anomaly_type:    info.anomaly_type || null,
      n_features:      health.n_features ?? info.n_features ?? null,
      n_classes:       health.n_classes  ?? null,
      output_classes:  info.classes      || [],
      ae_threshold:    info.ae_threshold ?? null,
      rf_conf_high:    info.rf_conf_high ?? null,
      verdict_actions: info.verdict_actions || null,
      _source: 'live',
    };

    return res.json(mlStatus);
  } catch (err) {
    next(err);
  }
});

// ─── GET /stats/timeline ─────────────────────────────────────────────────────
// No live time-series API exists yet — return empty until implemented
router.get('/stats/timeline', (req, res) => {
  console.debug('[stats/timeline] No live source available — returning empty');
  return res.json({ labels: [], datasets: [], _source: 'none' });
});

// ─── GET /stats/attack-types ──────────────────────────────────────────────────
router.get('/stats/attack-types', async (req, res, next) => {
  try {
    const data = await mitigationClient.getAlerts({ limit: 500 });
    console.debug('[stats/attack-types] Raw response from mitigation engine:', JSON.stringify(data, null, 2));

    const counts = {};
    for (const a of data.alerts || []) {
      const key = a.label || a.verdict || 'Unknown';
      counts[key] = (counts[key] || 0) + 1;
    }

    const typeColors = {
      'DDoS Attack': '#ff0066',
      'Port Scan':   '#ffaa00',
      'Brute Force': '#ff6600',
      'ICMP Flood':  '#00ff88',
      BENIGN:        '#00aaff',
      ANOMALY:       '#aa00ff',
      SUSPECT:       '#ffff00',
      Unknown:       '#8888aa',
    };

    const result = Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: typeColors[name] || '#8888aa',
    }));

    return res.json(result.length ? result : []);
  } catch (err) {
    if (err instanceof MitigationEngineError) {
      console.error('[stats/attack-types] Mitigation engine error:', {
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

// ─── GET /stats/recent-alerts ─────────────────────────────────────────────────
router.get('/stats/recent-alerts', async (req, res, next) => {
  try {
    const data = await mitigationClient.getAlerts({ limit: 5 });
    console.debug('[stats/recent-alerts] Raw response from mitigation engine:', JSON.stringify(data, null, 2));

    const severityColors = {
      critical: '#ff0066', high: '#ffaa00', medium: '#ffff00', low: '#00aaff',
    };

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

    return res.json(alerts);
  } catch (err) {
    if (err instanceof MitigationEngineError) {
      console.error('[stats/recent-alerts] Mitigation engine error:', {
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