const { Router } = require('express');
const { mitigationClient, MitigationEngineError } = require('../clients/mitigationClient');
const dashboardStore = require('../services/dashboardStore');

const router = Router();
 
function mapAlert(a) {
  
  let severity = 'low';
  if (a.verdict === 'ATTACK') {
    severity = a.confidence >= 0.90 ? 'critical' : 'high';
  } else if (a.verdict === 'SUSPECT') {
    severity = 'medium';
  } else if (a.verdict === 'ANOMALY') {
    severity = 'medium';
  }

  // Derive a friendly status from the action field
  const statusMap = {
    block:    'blocked',
    ratelimit:'mitigated',
    isolate:  'mitigated',
    log_only: 'monitoring',
  };

  return {
    alert_id:     String(a.id),
    src_ip:       a.src_ip        ?? null,
    dst_ip:       a.dst_ip        ?? null,
    src_port:     a.src_port      ?? null,
    dst_port:     a.dst_port      ?? null,
    protocol:     a.protocol      ?? null,    attack_type:  a.label         || a.verdict || 'Unknown',
    verdict:      a.verdict,
    confidence:   a.confidence,
    anomaly_score:a.anomaly_score,
    anomaly_flagged: a.anomaly_flagged,
    ml_source:    a.ml_source,
    severity,
    status:       statusMap[a.action] || 'monitoring',
    action:       a.action,
    rule_id:      a.rule_id       || null,
    created_at:   a.received_at   || null,
    start_time_ms:a.start_time_ms || null,
    end_time_ms:  a.end_time_ms   || null,
    // keep source tag so the frontend can show "live" vs "demo"
    _source: 'live',
  };
}

// ─── Map fake store alert → same shape (adds _source tag) ────────────────────
function mapFakeAlert(a) {
  return { ...a, _source: 'demo' };
}

// ─── GET /alerts ──────────────────────────────────────────────────────────────
router.get('/alerts', async (req, res, next) => {
  const { verdict, severity, status: statusFilter, src_ip, limit, offset } = req.query;

  try {
    const data = await mitigationClient.getAlerts({
      verdict:  typeof verdict === 'string'  ? verdict  : undefined,
      src_ip:   typeof src_ip  === 'string'  ? src_ip   : undefined,
      limit:    limit  ? Number(limit)  : 100,
      offset:   offset ? Number(offset) : 0,
    });

    let alerts = (data.alerts || []).map(mapAlert);

    
    if (severity)     alerts = alerts.filter(a => a.severity === severity);
    // Track if we're applying client-side filters
    const hasClientFilter = severity || statusFilter;
    if (severity)     alerts = alerts.filter(a => a.severity === severity);
    if (statusFilter) alerts = alerts.filter(a => a.status   === statusFilter);

    return res.json({
      total:   hasClientFilter ? alerts.length : (data.total ?? alerts.length),
      count:   alerts.length,      _source: 'live',
    });
  } catch (err) {
    if (err instanceof MitigationEngineError) {
     
      console.warn('[alerts] Mitigation engine unreachable, using demo data:', err.code);
      let fakeAlerts = dashboardStore.fakeAlerts.map(mapFakeAlert);
      if (severity)     fakeAlerts = fakeAlerts.filter(a => a.severity === severity);
      if (statusFilter) fakeAlerts = fakeAlerts.filter(a => a.status   === statusFilter);
      res.set('X-Data-Source', 'demo');
      return res.json({ total: fakeAlerts.length, count: fakeAlerts.length, alerts: fakeAlerts, _source: 'demo' });
    }
    next(err);
  }
});

// ─── GET /alerts/:id ──────────────────────────────────────────────────────────
router.get('/alerts/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const alert = await mitigationClient.getAlert(id);
    return res.json({ ...mapAlert(alert), _source: 'live' });
  } catch (err) {
    if (err instanceof MitigationEngineError) {
      if (err.status === 404) {
        return res.status(404).json({ detail: `Alert ${id} not found` });
      }
      // Engine down — try fake store
      const fake = dashboardStore.fakeAlerts.find(a => String(a.alert_id) === id);      if (fake) {
        res.set('X-Data-Source', 'demo');
        return res.json({ ...mapFakeAlert(fake) });
      }
      return res.status(404).json({ detail: `Alert ${id} not found` });
    }
    next(err);
  }
});

module.exports = router;