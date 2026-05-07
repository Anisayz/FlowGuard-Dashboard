/**
 * infrastructureService.ts
 * ------------------------
 * All API calls for the Infrastructure page.
 * Unwraps envelope responses so callers always get plain typed values.
 */

import axios from 'axios';
import { API_BASE } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Switch {
  dpid: string;
  n_tables?: number;
  capabilities?: number;
}

export interface MacEntry {
  dpid: string;
  mac: string;
  port: number;
}

export interface Rule {
  rule_id: string;
  src_ip: string;
  action: string;
  dpid: string;
  source: string;
  rate_kbps?: number | null;
  created_at: string;
  deleted_at?: string | null;
  active?: boolean;
  alert_id?: string | null;
}

export interface SdnInfo {
  api_endpoint: string;
  rest_api: string;
  protocol: string;
  version: string;
  architecture: string;
  [key: string]: unknown;
}

export interface EngineInfo {
  api_endpoint: string;
  actions: string[];
  source_types: string[];
  storage: string;
  integration: string;
  [key: string]: unknown;
}

export interface MlDetection {
  time: string;
  src_ip: string;
  attack_type: string;
  confidence: string;
  action: string;
  action_color: string;
}

export interface MlStat {
  count: number;
  pct: number;
  color: string;
}

export interface MlStatus {
  status: string;
  algorithm: string;
  input_features: string;
  output_classes: string[];
  training_data: string;
  accuracy: number;
  last_trained: string;
  inference_time: string;
  confidence: number;
  flows_analyzed: number;
  stats: Record<string, MlStat>;
  recent_detections: MlDetection[];
}

export interface HealthData {
  controller?: string;
  mitigation_engine?: string;
  ryu?: string;
  uptime?: string;
  flows_installed?: number;
  switches_connected?: number;
  [key: string]: unknown;
}

export interface InfrastructureData {
  health: HealthData;
  switches: Switch[];
  macTable: MacEntry[];
  rules: Rule[];
  sdnInfo: SdnInfo | null;
  engineInfo: EngineInfo | null;
  mlStatus: MlStatus | null;
}


const get = (path: string) => axios.get(`${API_BASE}${path}`).then(r => r.data);

export const fetchHealth     = (): Promise<HealthData>      => get('/health');
export const fetchSdnInfo    = (): Promise<SdnInfo>         => get('/sdn/info');
export const fetchEngineInfo = (): Promise<EngineInfo>      => get('/engine/info');
export const fetchMlStatus   = (): Promise<MlStatus>        => get('/ml/status');

export const fetchSwitches = (): Promise<Switch[]> =>
  get('/switches').then(d => Array.isArray(d) ? d : (d?.switches ?? []));

export const fetchMacTable = (): Promise<MacEntry[]> =>
  get('/mactable').then(d => Array.isArray(d) ? d : (d?.entries ?? []));

export const fetchRules = (): Promise<Rule[]> =>
  get('/rules').then(d => Array.isArray(d) ? d : (d?.rules ?? []));

// ─── Aggregate fetch (all at once) ───────────────────────────────────────────

export async function fetchInfrastructureData(): Promise<InfrastructureData> {
  const [health, switches, macTable, rules, sdnInfo, engineInfo, mlStatus] =
    await Promise.allSettled([
      fetchHealth(),
      fetchSwitches(),
      fetchMacTable(),
      fetchRules(),
      fetchSdnInfo(),
      fetchEngineInfo(),
      fetchMlStatus(),
    ]);

  return {
    health:     health.status     === 'fulfilled' ? health.value     : {},
    switches:   switches.status   === 'fulfilled' ? switches.value   : [],
    macTable:   macTable.status   === 'fulfilled' ? macTable.value   : [],
    rules:      rules.status      === 'fulfilled' ? rules.value      : [],
    sdnInfo:    sdnInfo.status    === 'fulfilled' ? sdnInfo.value    : null,
    engineInfo: engineInfo.status === 'fulfilled' ? engineInfo.value : null,
    mlStatus:   mlStatus.status   === 'fulfilled' ? mlStatus.value   : null,
  };
}