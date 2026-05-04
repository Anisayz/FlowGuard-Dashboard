const { Router } = require('express');
const dashboardStore = require('../services/dashboardStore');
const networkResourceService = require('../services/networkResourceService');
const config = require('../config');

const router = Router();

router.get('/topology', async (req, res, next) => {
  try {
    const data = await networkResourceService.getTopology();
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.get('/switches', async (req, res, next) => {
  try {
    const data = await networkResourceService.getSwitches();
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.get('/mactable', (req, res) => {
  res.json(dashboardStore.fakeMacTable);
});

router.get('/sdn/info', (req, res) => {
  res.json({
    ...dashboardStore.fakeSdnInfo,
    api_endpoint: config.sdn.baseURL,
    last_topology_sync: new Date().toISOString(),
  });
});

router.get('/engine/info', (req, res) => {
  res.json({
    ...dashboardStore.fakeEngineInfo,
    last_heartbeat: new Date().toISOString(),
  });
});

module.exports = router;
