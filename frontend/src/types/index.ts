// ── Rules ──────────────────────────────────────────────────────────────────
export interface Rule {
  rule_id:       string;
  src_ip:        string;
  action:        string;
  dpid:          string;
  source:        string;
  rate_kbps?:    number | null;
  created_at:    string;
  deleted_at?:   string | null;
  active?:       boolean;
  alert_id?:     string | null;
  hard_timeout?: number;
  idle_timeout?: number;
}

// ── Switches / MAC table ───────────────────────────────────────────────────
export interface Switch {
  dpid:          string;
  address?:      string;
  active_rules?: number;
}

export interface MacEntry {
  dpid: string;
  mac:  string;
  port: number;
}

// ── Dashboard stats ────────────────────────────────────────────────────────
export interface DashboardStats {
  totalRules:     number;
  activeRules:    number;
  blockedAttacks: number;
  activeSwitches: number;
}

// ── Timeline ───────────────────────────────────────────────────────────────
export interface TimelineDataset {
  label: string;
  data:  number[];
}

export interface Timeline {
  labels:   string[];
  datasets: TimelineDataset[];
  _source?: string;
}

// ── Attack types ───────────────────────────────────────────────────────────
export interface AttackType {
  name:  string;
  value: number;
  color: string;
}

// ── Recent alerts ──────────────────────────────────────────────────────────
export interface RecentAlert {
  time:     string;
  src:      string;
  dst:      string;
  type:     string;
  severity: string;
  sColor:   string;
  status:   string;
}

// ── Topology ───────────────────────────────────────────────────────────────
export interface TopologyHost {
  mac:  string;
  ipv4: string[];
  port: number;
  dpid: string;
}

export interface TopologyLink {
  src_dpid: string;
  dst_dpid: string;
  src_port: number;
  dst_port: number;
}

export interface TopologyData {
  switches: Record<string, { address: string }>;
  hosts:    TopologyHost[];
  links:    TopologyLink[];
  _source?: string;
}

// ── Graph ──────────────────────────────────────────────────────────────────
export interface GraphNode {
  id:       string;
  type:     'switch' | 'host';
  label:    string;
  dpid?:    string;
  address?: string;
  mac?:     string;
  ipv4?:    string[];
  port?:    number;
}

export interface GraphLink {
  source:   string;
  target:   string;
  srcPort?: number;
  dstPort?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ── Health ─────────────────────────────────────────────────────────────────
export interface RyuHealth {
  status:                 string;
  switches:               number;
  rules:                  number;
  time:                   string;    // ISO string (converted from epoch by home.js)
  ryu?:                   string;    // "up" | "down"
  controller?:            string;    // "healthy" | "unhealthy"
  uptime?:                string;
  flows_installed?:       number;
  switches_connected?:    number;
  mitigation_latency_ms?: number;
  ml_feed_status?:        string;
}

export interface MitigationHealth {
  status:       string;
  db:           string;
  active_rules: number;
  total_alerts: number;
  dedup_cache:  number;
}

export interface MlHealth {
  status:        string;
  models_loaded: boolean;
  n_features:    number | null;
  n_classes:     number | null;
}

export interface HealthData {
  overall?:    string;
  ryu?:        RyuHealth;
  mitigation?: MitigationHealth;
  ml?:         MlHealth;
  timestamp?:  string;
}

// ── SDN info (from /sdn/info) ──────────────────────────────────────────────
export interface SdnInfo {
  api_endpoint:       string;
  rest_api:           string;
  protocol:           string;
  version:            string;
  architecture:       string;
  status:             string;
  switches_connected: number | null;
  active_rules:       number | null;
  last_topology_sync: string;
  _source?:           string;
  [key: string]: unknown;
}

// ── Engine info (from /engine/info) ───────────────────────────────────────
export interface EngineInfo {
  api_endpoint:   string;
  status:         string;
  db:             string;
  active_rules:   number;
  total_alerts:   number;
  dedup_cache:    number;
  last_heartbeat: string;
  actions:        string[];
  source_types:   string[];
  endpoints:      Record<string, string>;
  _source?:       string;
  [key: string]: unknown;
}

// ── ML status (from /ml/status) ───────────────────────────────────────────
// Only fields the live ML engine actually returns.
export interface MlStatus {
  status:          string;           // 'active' | 'degraded' | 'unreachable'
  models_loaded:   boolean;
  algorithm:       string | null;    // e.g. 'Random Forest'
  anomaly_type:    string | null;    // e.g. 'Autoencoder'
  n_features:      number | null;
  n_classes:       number | null;
  output_classes:  string[];
  ae_threshold:    number | null;
  rf_conf_high:    number | null;
  verdict_actions: Record<string, string> | null;
  _source?:        string;
  // error fields when unreachable
  error?:          string;
  detail?:         string;
  health_error?:   string;
  info_error?:     string;
}

// ── Aggregate infrastructure data ──────────────────────────────────────────
export interface InfrastructureData {
  health:     HealthData;
  switches:   Switch[];
  macTable:   MacEntry[];
  rules:      Rule[];
  sdnInfo:    SdnInfo    | null;
  engineInfo: EngineInfo | null;
  mlStatus:   MlStatus   | null;
}
export interface HealthStatusProps {
  health: {
    controller?:        string;   // 'healthy' | 'unhealthy'
    mitigation_engine?: string;   // 'healthy' | 'unhealthy'
  };
}