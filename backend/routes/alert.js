const { Router } = require('express');
const dashboardStore = require('../services/dashboardStore');

const router = Router();

router.get('/alerts', (req, res) => {
  const { severity, status: statusFilter } = req.query;
  const data = dashboardStore.filterAlerts(
    typeof severity === 'string' ? severity : undefined,
    typeof statusFilter === 'string' ? statusFilter : undefined,
  );
  res.json(data);
});

module.exports = router;
