const { randomInt, randomUUID } = require('crypto');

function hoursAgo(n) {
  return new Date(Date.now() - n * 3600 * 1000).toISOString();
}
function minutesAgo(n) {
  return new Date(Date.now() - n * 60 * 1000).toISOString();
}
function daysAgo(n) {
  return new Date(Date.now() - n * 86400 * 1000).toISOString();
}

const fakeRules = [
  {
    rule_id: 'a1b2c3d4-0001',
    src_ip: '192.168.1.100',
    action: 'block',
    dpid: 's1',
    source: 'mitigation_engine',
    rate_kbps: null,
    created_at: hoursAgo(3),
    deleted_at: null,
    alert_id: 'alert-001',
  },
  {
    rule_id: 'a1b2c3d4-0002',
    src_ip: '10.0.0.45',
    action: 'ratelimit',
    dpid: 's2',
    source: 'manual',
    rate_kbps: 512,
    created_at: hoursAgo(1),
    deleted_at: null,
    alert_id: null,
  },
  {
    rule_id: 'a1b2c3d4-0003',
    src_ip: '172.16.2.33',
    action: 'block',
    dpid: 's1',
    source: 'mitigation_engine',
    rate_kbps: null,
    created_at: minutesAgo(30),
    deleted_at: null,
    alert_id: 'alert-002',
  },
  {
    rule_id: 'a1b2c3d4-0004',
    src_ip: '8.8.8.8',
    action: 'allow',
    dpid: 's3',
    source: 'manual',
    rate_kbps: null,
    created_at: daysAgo(1),
    deleted_at: null,
    alert_id: null,
  },
  {
    rule_id: 'a1b2c3d4-0005',
    src_ip: '1.1.1.99',
    action: 'block',
    dpid: 's2',
    source: 'mitigation_engine',
    rate_kbps: null,
    created_at: daysAgo(2),
    deleted_at: hoursAgo(5),
    alert_id: 'alert-099',
  },
];

const fakeSwitches = [
  { dpid: 's1', n_tables: 254, capabilities: 79 },
  { dpid: 's2', n_tables: 254, capabilities: 79 },
  { dpid: 's3', n_tables: 254, capabilities: 79 },
  { dpid: 's4', n_tables: 254, capabilities: 79 },
];

const fakeMacTable = [
  { dpid: 's1', mac: '00:11:22:33:44:01', port: 1 },
  { dpid: 's1', mac: '00:11:22:33:44:02', port: 2 },
  { dpid: 's1', mac: '00:11:22:33:44:03', port: 4 },
  { dpid: 's2', mac: 'aa:bb:cc:dd:ee:01', port: 1 },
  { dpid: 's2', mac: 'aa:bb:cc:dd:ee:02', port: 3 },
  { dpid: 's2', mac: 'aa:bb:cc:dd:ee:04', port: 5 },
  { dpid: 's3', mac: 'ff:ee:dd:cc:bb:01', port: 2 },
  { dpid: 's3', mac: 'ff:ee:dd:cc:bb:02', port: 3 },
  { dpid: 's4', mac: 'cc:dd:ee:ff:00:11', port: 1 },
  { dpid: 's4', mac: 'cc:dd:ee:ff:00:22', port: 2 },
];

const fakeTopology = {
  switches: [{ dpid: 's1' }, { dpid: 's2' }, { dpid: 's3' }, { dpid: 's4' }],
  hosts: [
    { mac: '00:00:00:00:00:01', ipv4: ['10.0.0.101'], port: 1, dpid: 's3' },
    { mac: '00:00:00:00:00:02', ipv4: ['10.0.0.102'], port: 2, dpid: 's3' },
    { mac: '00:00:00:00:00:03', ipv4: ['10.0.0.103'], port: 1, dpid: 's4' },
  ],
  links: [
    { src_dpid: 's1', dst_dpid: 's2', src_port: 1, dst_port: 1 },
    { src_dpid: 's2', dst_dpid: 's1', src_port: 1, dst_port: 1 },
    { src_dpid: 's1', dst_dpid: 's3', src_port: 2, dst_port: 1 },
    { src_dpid: 's3', dst_dpid: 's1', src_port: 1, dst_port: 2 },
    { src_dpid: 's1', dst_dpid: 's4', src_port: 3, dst_port: 1 },
    { src_dpid: 's4', dst_dpid: 's1', src_port: 1, dst_port: 3 },
  ],
};

const fakeAlerts = [
  {
    alert_id: 'alert-001',
    src_ip: '192.168.1.100',
    dst_ip: '10.0.0.5',
    attack_type: 'DDoS',
    severity: 'critical',
    status: 'blocked',
    dpid: 's1',
    packet_count: 15420,
    byte_count: 9823400,
    created_at: minutesAgo(5),
    mitigated_at: minutesAgo(4),
    rule_id: 'a1b2c3d4-0001',
  },
  {
    alert_id: 'alert-002',
    src_ip: '10.0.0.45',
    dst_ip: '172.16.2.1',
    attack_type: 'Port Scan',
    severity: 'high',
    status: 'mitigated',
    dpid: 's2',
    packet_count: 3210,
    byte_count: 128000,
    created_at: minutesAgo(20),
    mitigated_at: minutesAgo(19),
    rule_id: 'a1b2c3d4-0002',
  },
  {
    alert_id: 'alert-003',
    src_ip: '8.8.8.8',
    dst_ip: '10.0.0.2',
    attack_type: 'Brute Force',
    severity: 'medium',
    status: 'monitoring',
    dpid: 's1',
    packet_count: 890,
    byte_count: 44500,
    created_at: minutesAgo(35),
    mitigated_at: null,
    rule_id: null,
  },
  {
    alert_id: 'alert-004',
    src_ip: '172.16.0.9',
    dst_ip: '10.0.0.3',
    attack_type: 'DDoS',
    severity: 'critical',
    status: 'blocked',
    dpid: 's3',
    packet_count: 52100,
    byte_count: 31260000,
    created_at: hoursAgo(1),
    mitigated_at: new Date(new Date(hoursAgo(1)).getTime() + 30_000).toISOString(),
    rule_id: 'a1b2c3d4-0003',
  },
  {
    alert_id: 'alert-005',
    src_ip: '1.2.3.4',
    dst_ip: '10.0.0.1',
    attack_type: 'ICMP Flood',
    severity: 'low',
    status: 'resolved',
    dpid: 's4',
    packet_count: 320,
    byte_count: 16000,
    created_at: hoursAgo(2),
    mitigated_at: new Date(new Date(hoursAgo(2)).getTime() + 120_000).toISOString(),
    rule_id: null,
  },
];

const fakeMlStatus = {
  status: 'active',
  algorithm: 'Random Forest',
  input_features: 'Flow stats, packet rate, byte rate',
  output_classes: ['Normal', 'DDoS', 'Scan', 'Brute Force'],
  training_data: '50,000 labeled flows',
  accuracy: 97.3,
  last_trained: '2026-04-20 08:00',
  inference_time: '< 5ms',
  confidence: 97,
  flows_analyzed: 12847,
  stats: {
    normal: { count: 11923, pct: 92, color: '#00ff88' },
    ddos: { count: 634, pct: 5, color: '#ff0066' },
    port_scan: { count: 198, pct: 2, color: '#ffaa00' },
    brute_force: { count: 92, pct: 1, color: '#ff6600' },
  },
  recent_detections: [
    {
      time: new Date(Date.now() - 3 * 60 * 1000).toTimeString().slice(0, 8),
      src_ip: '192.168.1.100',
      attack_type: 'DDoS Attack',
      confidence: '99.1%',
      action: 'Auto-blocked',
      action_color: '#ff0066',
    },
    {
      time: new Date(Date.now() - 7 * 60 * 1000).toTimeString().slice(0, 8),
      src_ip: '10.0.0.45',
      attack_type: 'Port Scan',
      confidence: '95.4%',
      action: 'Rate-limited',
      action_color: '#ffaa00',
    },
    {
      time: new Date(Date.now() - 10 * 60 * 1000).toTimeString().slice(0, 8),
      src_ip: '8.8.8.8',
      attack_type: 'Brute Force',
      confidence: '91.2%',
      action: 'Monitoring',
      action_color: '#00aaff',
    },
    {
      time: new Date(Date.now() - 15 * 60 * 1000).toTimeString().slice(0, 8),
      src_ip: '172.16.0.9',
      attack_type: 'Normal Traffic',
      confidence: '98.7%',
      action: 'Allowed',
      action_color: '#00ff88',
    },
  ],
};

const fakeSdnInfo = {
  api_endpoint: 'http://localhost:8080',
  rest_api: '/v1.0/topology/*',
  protocol: 'OpenFlow 1.3',
  version: 'Ryu 4.34 (demo profile)',
  architecture: 'Centralized SDN Controller',
  environment: 'lab-simulated',
  openflow_version: '1.3',
  dataplane: 'Open vSwitch 3.x (expected)',
  listen_address: '0.0.0.0:8080',
  ofp_listen_port: 6653,
  loaded_apps: [
    'ryu.app.ofctl_rest',
    'ryu.app.rest_topology',
    'ryu.app.wsapi',
    'ryu.controller.ofp_handler',
  ],
  topology_refresh_ms: 5000,
  datapath_count: 4,
  flow_table_buckets: 12,
  note: 'Static demo metadata — replace with live Ryu discovery when the controller is online.',
};

const fakeEngineInfo = {
  api_endpoint: 'http://localhost:9000',
  actions: ['block', 'allow', 'ratelimit', 'quarantine_vlan'],
  source_types: ['manual', 'mitigation_engine', 'ml_pipeline'],
  storage: 'In-memory ruleset (Postgres migration planned)',
  integration: 'Ryu REST + custom FlowMod adapter (demo)',
  service_name: 'FlowGuard Mitigation Engine',
  version: '0.9.4-demo',
  build: 'flowguard-mitigation-20260428',
  mode: 'automated_plus_manual',
  workers: 2,
  queue_capacity: 8192,
  rate_limit_default_kbps: 1024,
  max_active_rules: 5000,
  decision_latency_target_ms: 50,
  features: ['flowmod_push', 'rate_limit', 'allowlist', 'audit_log', 'ml_webhook'],
  endpoints: {
    health: 'GET /health',
    rules: 'GET|POST|DELETE /rules',
    metrics: 'GET /metrics (planned)',
  },
  last_deploy: '2026-04-28T08:15:00Z',
  maintainer: 'Platform team — pending production cutover',
  note: 'Demo payload — swap for real mitigation API once the engine is deployed.',
};

function getRules(active) {
  if (active) {
    return fakeRules.filter((r) => !r.deleted_at);
  }
  return fakeRules;
}

function addRule(rule) {
  const newRule = {
    rule_id: randomUUID().replace(/-/g, '').slice(0, 12),
    src_ip: rule.src_ip,
    action: rule.action,
    dpid: rule.dpid,
    source: 'manual',
    rate_kbps: rule.rate_kbps ?? null,
    created_at: new Date().toISOString(),
    deleted_at: null,
    alert_id: null,
  };
  fakeRules.push(newRule);
  return newRule;
}

function deleteRule(ruleId) {
  const r = fakeRules.find((x) => x.rule_id === ruleId);
  if (r) {
    r.deleted_at = new Date().toISOString();
    return { message: 'Rule deleted', rule_id: ruleId };
  }
  return { message: 'Rule not found' };
}

function filterAlerts(severity, statusFilter) {
  let result = [...fakeAlerts];
  if (severity) {
    result = result.filter((a) => a.severity === severity);
  }
  if (statusFilter) {
    result = result.filter((a) => a.status === statusFilter);
  }
  return result;
}

function getMlStatusSnapshot() {
  fakeMlStatus.flows_analyzed += randomInt(0, 11);
  return { ...fakeMlStatus, stats: { ...fakeMlStatus.stats }, recent_detections: [...fakeMlStatus.recent_detections] };
}

function getAlertTimeline() {
  return [
    { time: '00:00', alerts: 4, blocked: 3 },
    { time: '04:00', alerts: 2, blocked: 2 },
    { time: '08:00', alerts: 8, blocked: 7 },
    { time: '12:00', alerts: 15, blocked: 13 },
    { time: '16:00', alerts: 10, blocked: 9 },
    { time: '20:00', alerts: 6, blocked: 5 },
    { time: '23:00', alerts: 3, blocked: 3 },
  ];
}

function getAttackTypes() {
  const typeColors = {
    DDoS: '#ff0066',
    'Port Scan': '#ffaa00',
    'Brute Force': '#ff6600',
    'ICMP Flood': '#00ff88',
    Other: '#8888aa',
  };
  const counts = {};
  for (const a of fakeAlerts) {
    counts[a.attack_type] = (counts[a.attack_type] || 0) + 1;
  }
  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    color: typeColors[name] || '#8888aa',
  }));
}

function getRecentAlerts() {
  const severityColors = {
    critical: '#ff0066',
    high: '#ffaa00',
    medium: '#ffff00',
    low: '#00aaff',
  };
  const sorted = [...fakeAlerts].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return sorted.slice(0, 5).map((a) => ({
    time: new Date(a.created_at).toTimeString().slice(0, 8),
    src: a.src_ip,
    dst: a.dst_ip,
    type: a.attack_type,
    severity: a.severity.charAt(0).toUpperCase() + a.severity.slice(1),
    sColor: severityColors[a.severity] || '#8888aa',
    status: a.status.charAt(0).toUpperCase() + a.status.slice(1),
  }));
}

module.exports = {
  fakeRules,
  fakeSwitches,
  fakeMacTable,
  fakeTopology,
  fakeAlerts,
  fakeSdnInfo,
  fakeEngineInfo,
  getRules,
  addRule,
  deleteRule,
  filterAlerts,
  getMlStatusSnapshot,
  getAlertTimeline,
  getAttackTypes,
  getRecentAlerts,
};
