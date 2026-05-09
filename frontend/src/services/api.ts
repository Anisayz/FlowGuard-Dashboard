import axios from 'axios';
import type { Rule, Switch, MacEntry, TopologyData } from '../types';

export const API_BASE =
  (import.meta.env.VITE_API_BASE?.trim() || '') ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:3000');

const client = axios.create({ baseURL: API_BASE });

// ─── Auth token storage ───────────────────────────────────────────────────────

const TOKEN_STORAGE_KEY = 'sdn_auth_token';

export type AuthUser    = { username: string };
export type LoginResult = { access_token: string; token_type: string; expires_in: number };

export const getStoredToken = (): string | null =>
  localStorage.getItem(TOKEN_STORAGE_KEY);

export const setAuthToken = (token: string | null) => {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else       localStorage.removeItem(TOKEN_STORAGE_KEY);
};

// ─── Request interceptor — attach Bearer token ────────────────────────────────

client.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — debug log every response ─────────────────────────

client.interceptors.response.use(
  (response) => {
    console.debug(
      `[api] ${response.config.method?.toUpperCase()} ${response.config.url} →`,
      response.status,
      response.data,
    );
    return response;
  },
  (error) => {
    const res  = error.response;
    const req  = error.config;
    console.error(
      `[api] ${req?.method?.toUpperCase() ?? '?'} ${req?.url ?? '?'} → ERROR`,
      res ? { status: res.status, data: res.data } : { message: error.message, code: error.code },
    );
    return Promise.reject(error);
  },
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const login = async (username: string, password: string): Promise<LoginResult> => {
  const res = await client.post<LoginResult>('/auth/login', { username, password });
  setAuthToken(res.data.access_token);
  return res.data;
};

export const logout = () => setAuthToken(null);

export const getMe = (): Promise<AuthUser> =>
  client.get<AuthUser>('/auth/me').then((r) => r.data);


export const getRules = (): Promise<Rule[]> =>
  client.get<{ count: number; rules: Rule[] }>('/rules').then((r) => r.data.rules ?? []);

export const createRule = (payload: {
  src_ip:      string;
  action:      string;
  dpid?:       string;
  rate_kbps?:  number;
  idle_timeout?: number;
  hard_timeout?: number;
}): Promise<Rule> =>
  client.post<Rule>('/rules', payload).then((r) => r.data);

export const deleteRule = (id: string): Promise<{ deleted: boolean; rule_id: string }> =>
  client.delete<{ deleted: boolean; rule_id: string }>(`/rules/${id}`).then((r) => r.data);


export const getAlerts = (): Promise<any[]> =>
  client
    .get<{ total: number; count: number; alerts: any[] }>('/alerts')
    .then((r) => r.data.alerts ?? []);

 
export const getHealth = (): Promise<any> =>
  client.get('/health').then((r) => r.data);


export const getTopology = (): Promise<TopologyData> =>
  client.get<TopologyData>('/topology').then((r) => r.data);

export const getSwitches = (): Promise<Switch[]> =>
  client
    .get<{ switches: Switch[] } | Switch[]>('/switches')
    .then((r) => (Array.isArray(r.data) ? r.data : r.data.switches ?? []));

export const getMacTable = (): Promise<MacEntry[]> =>
  client
    .get<{ count: number; entries: MacEntry[] }>('/mactable')
    .then((r) => r.data.entries ?? []);

export const getTimeline     = (): Promise<any> =>
  client.get('/stats/timeline').then((r) => r.data);

export const getAttackTypes  = (): Promise<any[]> =>
  client.get('/stats/attack-types').then((r) => r.data);

export const getRecentAlerts = (): Promise<any[]> =>
  client.get('/stats/recent-alerts').then((r) => r.data);