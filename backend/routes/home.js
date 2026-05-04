const { Router } = require('express');
const dashboardStore = require('../services/dashboardStore');
const healthService = require('../services/healthService');

const router = Router();

router.get('/health', async (req, res, next) => {
  try {
    const data = await healthService.getHealth();
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.get('/ml/status', (req, res) => {
  res.json(dashboardStore.getMlStatusSnapshot());
});

router.get('/stats/timeline', (req, res) => {
  res.json(dashboardStore.getAlertTimeline());
});

router.get('/stats/attack-types', (req, res) => {
  res.json(dashboardStore.getAttackTypes());
});

router.get('/stats/recent-alerts', (req, res) => {
  res.json(dashboardStore.getRecentAlerts());
});

module.exports = router;
