import axios from 'axios';
import type { Rule, Switch, MacEntry, TopologyData } from '../types';

/** Dev: proxied via Vite `/api` → Express. Override with `VITE_API_BASE`. */
export const API_BASE =
  (import.meta.env.VITE_API_BASE?.trim() || '') ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:3000');

const client = axios.create({ baseURL: API_BASE });

const TOKEN_STORAGE_KEY = 'sdn_auth_token';

export type AuthUser = { username: string };
export type LoginResult = { access_token: string; token_type: string; expires_in: number };

export const getStoredToken = (): string | null => localStorage.getItem(TOKEN_STORAGE_KEY);

export const setAuthToken = (token: string | null) => {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(TOKEN_STORAGE_KEY);
};

client.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (username: string, password: string) => {
  const res = await client.post<LoginResult>('/auth/login', { username, password });
  setAuthToken(res.data.access_token);
  return res.data;
};

export const logout = () => setAuthToken(null);

export const getMe = () => client.get<AuthUser>('/auth/me').then((r) => r.data);

// ── Rules ────────────────────────────────────────────────────────────────────
export const getRules      = ()              => client.get<Rule[]>('/rules').then(r => r.data);
export const deleteRule    = (id: string)    => client.delete(`/rules/${id}`);
export const createRule    = (payload: {
  src_ip: string;
  action: string;
  dpid: string;
  rate_kbps?: number;
}) => client.post('/rules', payload);

// ── Switches / MAC ───────────────────────────────────────────────────────────
export const getSwitches   = () => client.get<Switch[]>('/switches').then(r => r.data);
export const getMacTable   = () => client.get<MacEntry[]>('/mactable').then(r => r.data);

// ── Health ───────────────────────────────────────────────────────────────────
export const getHealth     = () => client.get('/health').then(r => r.data);

// ── Topology ─────────────────────────────────────────────────────────────────
export const getTopology   = () => client.get<TopologyData>('/topology').then(r => r.data);

// ── Alerts ───────────────────────────────────────────────────────────────────
export const getAlerts     = () => client.get('/alerts').then(r => r.data);

// ── Stats ────────────────────────────────────────────────────────────────────
export const getTimeline      = () => client.get('/stats/timeline').then(r => r.data);
export const getAttackTypes   = () => client.get('/stats/attack-types').then(r => r.data);
export const getRecentAlerts  = () => client.get('/stats/recent-alerts').then(r => r.data);
