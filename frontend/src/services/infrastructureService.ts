/**
 * infrastructureService.ts
 * ------------------------
 * Thin fetch layer for the Infrastructure page.
 * All types live in types.ts — nothing is defined here.
 */

import axios from 'axios';
import { API_BASE } from './api';
import type {
  HealthData,
  Switch,
  MacEntry,
  Rule,
  SdnInfo,
  EngineInfo,
  MlStatus,
  InfrastructureData,
} from '../types';

// ─── Re-export so useInfrastructure.ts can import from one place ──────────────
export type {
  HealthData,
  Switch,
  MacEntry,
  Rule,
  SdnInfo,
  EngineInfo,
  MlStatus,
  InfrastructureData,
};

// ─── HTTP helper ──────────────────────────────────────────────────────────────

const get = (path: string) =>
  axios.get(`${API_BASE.replace(/\/$/, '')}${path}`).then(r => r.data);

// ─── Individual fetchers ──────────────────────────────────────────────────────

export const fetchHealth     = (): Promise<HealthData>  => get('/health');
export const fetchSdnInfo    = (): Promise<SdnInfo>     => get('/sdn/info');
export const fetchEngineInfo = (): Promise<EngineInfo>  => get('/engine/info');
export const fetchMlStatus   = (): Promise<MlStatus>    => get('/ml/status');

export const fetchSwitches = (): Promise<Switch[]> =>
  get('/switches').then(d => (Array.isArray(d) ? d : (d?.switches ?? [])));

export const fetchMacTable = (): Promise<MacEntry[]> =>
  get('/mactable').then(d => (Array.isArray(d) ? d : (d?.entries ?? [])));

export const fetchRules = (): Promise<Rule[]> =>
  get('/rules').then(d => (Array.isArray(d) ? d : (d?.rules ?? [])));

// ─── Aggregate fetch ──────────────────────────────────────────────────────────

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

  if (health.status     === 'rejected') console.error('[infra] /health failed:',      health.reason);
  if (switches.status   === 'rejected') console.error('[infra] /switches failed:',    switches.reason);
  if (macTable.status   === 'rejected') console.error('[infra] /mactable failed:',    macTable.reason);
  if (rules.status      === 'rejected') console.error('[infra] /rules failed:',       rules.reason);
  if (sdnInfo.status    === 'rejected') console.error('[infra] /sdn/info failed:',    sdnInfo.reason);
  if (engineInfo.status === 'rejected') console.error('[infra] /engine/info failed:', engineInfo.reason);
  if (mlStatus.status   === 'rejected') console.error('[infra] /ml/status failed:',   mlStatus.reason);

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