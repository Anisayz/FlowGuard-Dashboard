export interface Rule {
  rule_id: string;
  src_ip: string;
  action: string;
  dpid: string;
  source: string;
  rate_kbps?: number | null;
  created_at: string;
  deleted_at?: string | null;
  alert_id?: string | null;
}

export interface Switch {
  dpid: string;
  [key: string]: any;
}

export interface MacEntry {
  dpid: string;
  mac: string;
  port: number;
}


export interface Stats {
  totalRules: number;
  activeRules: number;
  blockedAttacks: number;
  activeSwitches: number;
}

// types déjà existants...

export interface TopologySwitch {
  dpid: string;
}

export interface TopologyHost {
  mac: string;
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
  switches: TopologySwitch[];
  hosts: TopologyHost[];
  links: TopologyLink[];
}

export interface GraphNode {
  id: string;
  type: 'switch' | 'host';
  label: string;
  dpid?: string;
  mac?: string;
  ipv4?: string[];
  port?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  srcPort?: number;
  dstPort?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface Health {
  controller:        string;
  mitigation_engine: string;
}

export interface HealthStatusProps {
  health: Health;
}

