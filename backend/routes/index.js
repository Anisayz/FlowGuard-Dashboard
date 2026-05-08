const { Router } = require('express');
const authRoutes = require('./auth.routes');
const homeRoutes = require('./home');
const firewallRulesRoutes = require('./firewall-rules');
const alertRoutes = require('./alert');
const infrastructureRoutes = require('./infrastructure');

const router = Router();

router.get('/', (req, res) => {
  res.status(200).send('FlowGuard API (Express)');
});

router.use(authRoutes);
router.use(homeRoutes);
router.use(firewallRulesRoutes);
router.use(alertRoutes);
router.use(infrastructureRoutes);

module.exports = router;