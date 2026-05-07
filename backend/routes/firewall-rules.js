const { Router } = require('express');
const requireAuth = require('../middleware/requireAuth');
const { mitigationClient, MitigationEngineError } = require('../clients/mitigationClient'); 
const dashboardStore = require('../services/dashboardStore');

const router = Router();

 
function mapRule(r) {
  return {
    rule_id:      r.rule_id,
    src_ip:       r.src_ip,
    action:       r.action,
    dpid:         r.dpid   != null ? String(r.dpid) : null,
    source:       r.source,
    rate_kbps:    r.rate_kbps   || null,
    created_at:   r.created_at  || null,
    deleted_at:   r.deleted_at  || null,
    idle_timeout: r.idle_timeout || null,
    hard_timeout: r.hard_timeout || null,
    active:       r.active,
    alert_id:     r.alert_id    ? String(r.alert_id) : null,
    _source: 'live',
  };
}

function mapFakeRule(r) {
  return { ...r, active: !r.deleted_at, _source: 'demo' };
}

// ─── GET /rules ───────────────────────────────────────────────────────────────
router.get('/rules', async (req, res, next) => {
  const { active, source, action, limit, offset } = req.query;

  try {
    const data = await mitigationClient.getRules({
      active:  active  === 'true' ? true : active === 'false' ? false : undefined,
      source:  typeof source === 'string' ? source : undefined,
      action:  typeof action === 'string' ? action : undefined,
      limit:   limit  ? Number(limit)  : 200,
      offset:  offset ? Number(offset) : 0,
    });

    const rules = (data.rules || []).map(mapRule);
    return res.json({ count: rules.length, rules, _source: 'live' });

  } catch (err) {
    if (err instanceof MitigationEngineError) {
      console.warn('[rules] Mitigation engine unreachable, using demo data:', err.code);
      const onlyActive = active === 'true' || active === '1';
      let fakeRules = dashboardStore.getRules(onlyActive).map(mapFakeRule);
      if (source) fakeRules = fakeRules.filter(r => r.source === source);
      if (action) fakeRules = fakeRules.filter(r => r.action === action);
      res.set('X-Data-Source', 'demo');
      return res.json({ count: fakeRules.length, rules: fakeRules, _source: 'demo' });
    }
    next(err);
  }
});

// ─── POST /rules ──────────────────────────────────────────────────────────────
// Dashboard "Create Rule" form → POST /rules/manual on the engine
router.post('/rules', requireAuth, async (req, res, next) => {
  const { src_ip, action, dpid, rate_kbps, idle_timeout, hard_timeout } = req.body || {};

  if (typeof src_ip !== 'string' || typeof action !== 'string') {
    return res.status(422).json({ detail: 'src_ip and action are required' });
  }
  if (!['block', 'ratelimit', 'isolate'].includes(action)) {
    return res.status(422).json({ detail: 'action must be block | ratelimit | isolate' });
  }
  if (action === 'ratelimit' && !rate_kbps) {
    return res.status(422).json({ detail: 'rate_kbps is required for ratelimit' });
  }

  try {
    const rule = await mitigationClient.createManualRule({
      src_ip,
      action,
      dpid:         dpid         || undefined,
      rate_kbps:    rate_kbps    ? Number(rate_kbps)    : undefined,
      idle_timeout: idle_timeout ? Number(idle_timeout) : undefined,
      hard_timeout: hard_timeout ? Number(hard_timeout) : undefined,
    });

    return res.status(201).json({ ...mapRule(rule), _source: 'live' });

  } catch (err) {
    if (err instanceof MitigationEngineError) {
      // Propagate engine validation errors (422) and service errors (503) as-is
      const status = err.status || 502;
      return res.status(status).json({ detail: err.message, _source: 'live' });
    }
    next(err);
  }
});

// ─── DELETE /rules/:rule_id ───────────────────────────────────────────────────
router.delete('/rules/:rule_id', requireAuth, async (req, res, next) => {
  const { rule_id } = req.params;

  try {
    const result = await mitigationClient.deleteRule(rule_id);
    return res.json({ ...result, _source: 'live' });

  } catch (err) {
    if (err instanceof MitigationEngineError) {
      if (err.status === 404) {
        return res.status(404).json({ detail: `Rule ${rule_id} not found` });
      }
      if (err.status === 409) {
        return res.status(409).json({ detail: err.message });
      }
      // Engine down — fall back to soft-delete in fake store so UI stays responsive
      console.warn('[rules] Mitigation engine unreachable, falling back to local delete:', err.code);
      const result = dashboardStore.deleteRule(rule_id);
      res.set('X-Data-Source', 'demo');
      return res.json({ ...result, _source: 'demo' });
    }
    next(err);
  }
});

module.exports = router;