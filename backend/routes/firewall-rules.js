const { Router } = require('express');
const requireAuth = require('../middleware/requireAuth');
const { mitigationClient, MitigationEngineError } = require('../clients/mitigationClient');

const router = Router();

function mapRule(r) {
  return {
    rule_id:      r.rule_id,
    src_ip:       r.src_ip,
    action:       r.action,
    dpid:         r.dpid        != null ? String(r.dpid) : null,
    source:       r.source,
    rate_kbps:    r.rate_kbps   ?? null,
    created_at:   r.created_at  ?? null,
    deleted_at:   r.deleted_at  ?? null,
    idle_timeout: r.idle_timeout ?? null,
    hard_timeout: r.hard_timeout ?? null,
    active:       r.active,
    alert_id:     r.alert_id    ? String(r.alert_id) : null,
    _source: 'live',
  };
}

// ─── GET /rules ───────────────────────────────────────────────────────────────
router.get('/rules', async (req, res, next) => {
  const { active, source, action, limit, offset } = req.query;

  try {
    const data = await mitigationClient.getRules({
      active:  active === 'true' || active === '1' ? true : active === 'false' || active === '0' ? false : undefined,
      source:  typeof source === 'string' ? source : undefined,
      action:  typeof action === 'string' ? action : undefined,
      limit:   limit  ? Number(limit)  : 200,
      offset:  offset ? Number(offset) : 0,
    });

    const rules = (data.rules || []).map(mapRule);
    return res.json({ count: rules.length, rules, _source: 'live' });

  } catch (err) {
    if (err instanceof MitigationEngineError) {
      const status = err.status || 502;
      return res.status(status).json({ detail: err.message, _source: 'live' });
    }
    next(err);
  }
});

// ─── POST /rules ──────────────────────────────────────────────────────────────
router.post('/rules', requireAuth, async (req, res, next) => {
  const { src_ip, action, dpid, rate_kbps, idle_timeout, hard_timeout } = req.body || {};

  console.debug('[rules] POST body received:', JSON.stringify({
    src_ip, action, dpid, rate_kbps, idle_timeout, hard_timeout,
  }, null, 2));

  if (action === 'ratelimit' && !rate_kbps) {
    return res.status(422).json({ detail: 'rate_kbps is required for ratelimit' });
  }
  if (rate_kbps !== undefined && (isNaN(Number(rate_kbps)) || Number(rate_kbps) < 0)) {
    return res.status(422).json({ detail: 'rate_kbps must be a non-negative number' });
  }
  if (idle_timeout !== undefined && isNaN(Number(idle_timeout))) {
    return res.status(422).json({ detail: 'idle_timeout must be a number' });
  }
  if (hard_timeout !== undefined && isNaN(Number(hard_timeout))) {
    return res.status(422).json({ detail: 'hard_timeout must be a number' });
  }

  const payload = {
  src_ip,
  action,
  dpid:         dpid ? parseInt(dpid, 16) : undefined,  // "00009248d8b57941" → 159558711591233
  rate_kbps:    rate_kbps    ? Number(rate_kbps)    : undefined,
  idle_timeout: idle_timeout ? Number(idle_timeout) : undefined,
  hard_timeout: hard_timeout ? Number(hard_timeout) : undefined,
};

  console.debug('[rules] POST payload being sent to mitigation engine:', JSON.stringify(payload, null, 2));

  try {
    const rule = await mitigationClient.createManualRule(payload);
    console.debug('[rules] POST raw response from mitigation engine:', JSON.stringify(rule, null, 2));
    return res.status(201).json({ ...mapRule(rule), _source: 'live' });

  } catch (err) {
    if (err instanceof MitigationEngineError) {
      console.error('[rules] POST mitigation engine error:', {
        status:  err.status,
        code:    err.code,
        message: err.message,
        // log the full response body from the engine if available
        detail:  err.cause?.response?.data ?? null,
      });
      const status = err.status || 502;
      return res.status(status).json({ detail: err.message, _source: 'live' });
    }
    next(err);
  }
});

// ─── DELETE /rules/:rule_id ───────────────────────────────────────────────────
router.delete('/rules/:rule_id', requireAuth, async (req, res, next) => {
  const { rule_id } = req.params;

  console.debug(`[rules] DELETE rule_id=${rule_id}`);

  try {
    const result = await mitigationClient.deleteRule(rule_id);
    console.debug(`[rules] DELETE raw response from mitigation engine:`, JSON.stringify(result, null, 2));
    return res.json({ ...result, _source: 'live' });

  } catch (err) {
    if (err instanceof MitigationEngineError) {
      console.error('[rules] POST mitigation engine full detail:',
          JSON.stringify(err.cause?.response?.data, null, 2));
      console.error(`[rules] DELETE mitigation engine error for rule ${rule_id}:`, {
        status:  err.status,
        code:    err.code,
        message: err.message,
        detail:  err.cause?.response?.data ?? null,
      });
      const status = err.status || 502;
      return res.status(status).json({ detail: err.message, _source: 'live' });
    }
    next(err);
  }
});

module.exports = router;