const { Router } = require('express');
const requireAuth = require('../middleware/requireAuth');
const dashboardStore = require('../services/dashboardStore');

const router = Router();

router.get('/rules', (req, res) => {
  const active = req.query.active;
  const onlyActive = active === 'true' || active === '1';
  res.json(dashboardStore.getRules(onlyActive));
});

router.post('/rules', requireAuth, (req, res) => {
  const { src_ip: srcIp, action, dpid, rate_kbps: rateKbps } = req.body || {};
  if (typeof srcIp !== 'string' || typeof action !== 'string' || typeof dpid !== 'string') {
    return res.status(422).json({ detail: 'src_ip, action, and dpid are required' });
  }
  const created = dashboardStore.addRule({
    src_ip: srcIp,
    action,
    dpid,
    rate_kbps: rateKbps,
  });
  res.status(201).json(created);
});

router.delete('/rules/:rule_id', requireAuth, (req, res) => {
  const out = dashboardStore.deleteRule(req.params.rule_id);
  res.json(out);
});

module.exports = router;
