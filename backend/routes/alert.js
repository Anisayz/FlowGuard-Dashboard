const { Router } = require('express');
const { mitigationClient, MitigationEngineError } = require('../clients/mitigationClient');

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

  const statusMap = {
    block:    'blocked',
    ratelimit:'mitigated',
    isolate:  'mitigated',
    log_only: 'monitoring',
  };

  return {
    alert_id:        String(a.id),
    src_ip:          a.src_ip         ?? null,
    dst_ip:          a.dst_ip         ?? null,
    src_port:        a.src_port       ?? null,
    dst_port:        a.dst_port       ?? null,
    protocol:        a.protocol       ?? null,
    attack_type:     a.label          || a.verdict || 'Unknown',
    verdict:         a.verdict,
    confidence:      a.confidence,
    anomaly_score:   a.anomaly_score,
    anomaly_flagged: a.anomaly_flagged,
    ml_source:       a.ml_source,
    severity,
    status:          statusMap[a.action] || 'monitoring',
    action:          a.action,
    rule_id:         a.rule_id        || null,
    created_at:      a.received_at    || null,
    start_time_ms:   a.start_time_ms  || null,
    end_time_ms:     a.end_time_ms    || null,
    _source: 'live',
  };
}

// ─── GET /alerts ──────────────────────────────────────────────────────────────
router.get('/alerts', async (req, res, next) => {
  const { verdict, severity, status: statusFilter, src_ip, limit, offset } = req.query;

  try {
    const data = await mitigationClient.getAlerts({
      verdict:  typeof verdict === 'string' ? verdict : undefined,
      src_ip:   typeof src_ip  === 'string' ? src_ip  : undefined,
      limit:    limit  ? Number(limit)  : 100,
      offset:   offset ? Number(offset) : 0,
    });

  //  console.debug('[alerts] Raw response from mitigation engine:', JSON.stringify(data, null, 2));

    let alerts = (data.alerts || []).map(mapAlert);

    const hasClientFilter = severity || statusFilter;
    if (severity)     alerts = alerts.filter(a => a.severity === severity);
    if (statusFilter) alerts = alerts.filter(a => a.status   === statusFilter);

    return res.json({
      total:   hasClientFilter ? alerts.length : (data.total ?? alerts.length),
      count:   alerts.length,
      alerts,
      _source: 'live',
    });
  } catch (err) {
    if (err instanceof MitigationEngineError) {
      /*console.error('[alerts] Mitigation engine error:', {
        status:  err.status,
        code:    err.code,
        message: err.message,
      });*/
      const status = err.status || 502;
      return res.status(status).json({ detail: err.message, _source: 'live' });
    }
    next(err);
  }
});

// ─── GET /alerts/:id ──────────────────────────────────────────────────────────
router.get('/alerts/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const alert = await mitigationClient.getAlert(id);
  //  console.debug(`[alerts/${id}] Raw response from mitigation engine:`, JSON.stringify(alert, null, 2));
    return res.json({ ...mapAlert(alert), _source: 'live' });
  } catch (err) {
    if (err instanceof MitigationEngineError) {
     /* console.error(`[alerts/${id}] Mitigation engine error:`, {
        status:  err.status,
        code:    err.code,
        message: err.message,
      });*/
      const status = err.status || 502;
      return res.status(status).json({ detail: err.message, _source: 'live' });
    }
    next(err);
  }
});

module.exports = router;