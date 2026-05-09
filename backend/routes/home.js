const { Router } = require('express');

const { sdnClient, SdnControllerError }           = require('../services/sdnClient');
const { mitigationClient, MitigationEngineError } = require('../clients/mitigationClient');
const { mlClient, MlEngineError }                  = require('../clients/mlClient');

const router = Router();

// ─── GET /health ──────────────────────────────────────────────────────────────
router.get('/health', async (req, res, next) => {
  try {
    const [ryuResult, mitigationResult, mlResult] = await Promise.allSettled([
      sdnClient.getHealth(),
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

    // Ryu returns: { status: 'ok', switches: N, rules: N, time: epoch }
    const ryu = ryuResult.status === 'fulfilled'
      ? {
          controller:         ryuResult.value.status === 'ok' ? 'healthy' : 'unhealthy',
          ryu:                ryuResult.value.status === 'ok' ? 'up' : 'down',
          switches_connected: ryuResult.value.switches,
          rules_active:       ryuResult.value.rules,
        }
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
      ryu.controller === 'healthy' &&
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
      return res.status(502).json({
        detail:       'ML engine unreachable',
        health_error: healthResult.reason?.message,
        info_error:   infoResult.reason?.message,
        _source:      'live',
      });
    }

    const health = healthResult.status === 'fulfilled' ? healthResult.value : {};
    const info   = infoResult.status   === 'fulfilled' ? infoResult.value   : {};

    const mlStatus = {
      status:          health.status === 'ok' ? 'active' : 'degraded',
      models_loaded:   health.models_loaded ?? false,
      algorithm:       info.model_type      || null,
      anomaly_type:    info.anomaly_type    || null,
      n_features:      health.n_features    ?? info.n_features ?? null,
      n_classes:       health.n_classes     ?? null,
      output_classes:  info.classes         || [],
      ae_threshold:    info.ae_threshold    ?? null,
      rf_conf_high:    info.rf_conf_high    ?? null,
      verdict_actions: info.verdict_actions || null,
      _source:         'live',
    };

    return res.json(mlStatus);
  } catch (err) {
    next(err);
  }
});

// ─── GET /stats/timeline ─────────────────────────────────────────────────────
// Buckets last 500 alerts by minute over the past 60 minutes.
// received_at is naive UTC from Python datetime.utcnow() — append 'Z' to
// force correct UTC parsing regardless of server local timezone.
// verdict/label may have trailing whitespace from DB — always .trim().
router.get('/stats/timeline', async (req, res, next) => {
  try {
    const data   = await mitigationClient.getAlerts({ limit: 500 });
    const alerts = data.alerts || [];

    const now        = Date.now();
    const MS_PER_MIN = 60 * 1000;
    const BUCKETS    = 60;

    // labels: "HH:MM" UTC for each of the last 60 minutes
    const labels = Array.from({ length: BUCKETS }, (_, i) => {
      const t = new Date(now - (BUCKETS - 1 - i) * MS_PER_MIN);
      return `${String(t.getUTCHours()).padStart(2, '0')}:${String(t.getUTCMinutes()).padStart(2, '0')}`;
    });

    const verdicts = ['ATTACK', 'SUSPECT', 'ANOMALY', 'BENIGN'];
    const counts   = {};
    for (const v of verdicts) counts[v] = new Array(BUCKETS).fill(0);

    for (const alert of alerts) {
      if (!alert.received_at) continue;

      const alertMs = new Date(alert.received_at + 'Z').getTime();
      const diffMin = Math.floor((now - alertMs) / MS_PER_MIN);

      if (diffMin < 0 || diffMin >= BUCKETS) continue;

      const bucketIdx = BUCKETS - 1 - diffMin;
      const verdict   = (alert.verdict || 'BENIGN').trim(); // trim trailing spaces from DB

      if (counts[verdict]) counts[verdict][bucketIdx]++;
    }

    const colors = {
      ATTACK:  '#ff0066',
      SUSPECT: '#ffaa00',
      ANOMALY: '#aa00ff',
      BENIGN:  '#00aaff',
    };

    const datasets = verdicts.map(v => ({
      label: v,
      data:  counts[v],
      color: colors[v],
    }));

    return res.json({ labels, datasets, _source: 'live' });

  } catch (err) {
    if (err instanceof MitigationEngineError) {
      const status = err.status || 502;
      return res.status(status).json({ detail: err.message, _source: 'live' });
    }
    next(err);
  }
});

// ─── GET /stats/attack-types ──────────────────────────────────────────────────
router.get('/stats/attack-types', async (req, res, next) => {
  try {
    const data = await mitigationClient.getAlerts({ limit: 500 });

    const counts = {};
    for (const a of data.alerts || []) {
      const key = (a.label || a.verdict || 'Unknown').trim();
      counts[key] = (counts[key] || 0) + 1;
    }

   const typeColors = {
  // Network attacks
  'Port Scan':     '#ff0066',
  'SYN Flood':     '#ffaa00',
  'HTTP Scan':     '#00ff88',
  'Infilteration': '#00aaff',
  'ICMP Flood':    '#ff6600',
  'UDP Flood':     '#aa00ff',
  'Brute Force':   '#ff00cc',
  'DDoS Attack':   '#ffff00',
  
  'BENIGN':        '#6666ff',
  'ANOMALY':       '#aa00ff',
  'SUSPECT':       '#ffaa00',
  'ATTACK':        '#ff0066',
  'Unknown':       '#444466',
};
    const result = Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: typeColors[name] || '#8888aa',
    }));

    return res.json(result.length ? result : []);
  } catch (err) {
    if (err instanceof MitigationEngineError) {
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

    const severityColors = {
      critical: '#ff0066', high: '#ffaa00', medium: '#ffff00', low: '#00aaff',
    };

    const verdictToSeverity = (verdict, confidence) => {
      if (verdict === 'ATTACK')  return confidence >= 0.90 ? 'critical' : 'high';
      if (verdict === 'SUSPECT') return 'medium';
      if (verdict === 'ANOMALY') return 'medium';
      return 'low';
    };

    const alerts = (data.alerts || []).map(a => {
      const verdict  = (a.verdict || '').trim();
      const severity = verdictToSeverity(verdict, a.confidence);
      return {
        time:     a.received_at ? new Date(a.received_at + 'Z').toUTCString().slice(17, 25) : '--:--:--',
        src:      a.src_ip  || '—',
        dst:      a.dst_ip  || '—',
        type:     (a.label  || verdict || 'Unknown').trim(),
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