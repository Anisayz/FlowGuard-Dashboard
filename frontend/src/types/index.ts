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
  alert_id?:     string | null;
  active:        boolean;
  hard_timeout?: number;
  idle_timeout?: number;
}

// ── Switches / MAC table ───────────────────────────────────────────────────
export interface Switch {
  dpid: string;
  [key: string]: any;
}

export interface MacEntry {
  dpid: string;
  mac:  string;
  port: number;
}

// ── Dashboard stats ────────────────────────────────────────────────────────
export interface Stats {
  totalRules:     number;
  activeRules:    number;
  blockedAttacks: number;
  activeSwitches: number;
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
  switches: Record<string, { address: string }>;  // key = dpid, value has no dpid field
  hosts:    TopologyHost[];
  links:    TopologyLink[];
  _source:  string;
}

// ── Graph ──────────────────────────────────────────────────────────────────
export interface GraphNode {
  id:       string;
  type:     'switch' | 'host';
  label:    string;
  dpid?:    string;
  address?: string;   // e.g. "('127.0.0.1', 58638)"
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
export interface Health {
  controller:        string;
  mitigation_engine: string;
}

export interface HealthStatusProps {
  health: Health;
}