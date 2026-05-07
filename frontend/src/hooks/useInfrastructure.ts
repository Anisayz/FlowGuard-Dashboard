/**
 * useInfrastructure.ts
 * ---------------------
 * Manages all state, polling, and refresh logic for the Infrastructure page.
 * The component stays a pure UI consumer.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchInfrastructureData,
  type InfrastructureData,
  type HealthData,
  type Switch,
  type MacEntry,
  type Rule,
  type SdnInfo,
  type EngineInfo,
  type MlStatus,
} from '../services/infrastructureService';

const POLL_INTERVAL_MS = 8_000;

// ─── Shape returned to the component ─────────────────────────────────────────

export interface UseInfrastructureReturn {
  // data
  health:     HealthData;
  switches:   Switch[];
  macTable:   MacEntry[];
  rules:      Rule[];
  activeRules: Rule[];
  sdnInfo:    SdnInfo | null;
  engineInfo: EngineInfo | null;
  mlStatus:   MlStatus | null;
  // meta
  loading:    boolean;
  error:      string | null;
  lastUpdate: string;
  // actions
  refresh:    () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useInfrastructure(): UseInfrastructureReturn {
  const [data, setData] = useState<InfrastructureData>({
    health:     {},
    switches:   [],
    macTable:   [],
    rules:      [],
    sdnInfo:    null,
    engineInfo: null,
    mlStatus:   null,
  });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState('');

  // Keep a ref so the interval callback always calls the latest version
  const fetchRef = useRef<() => Promise<void>>();

  const fetch = useCallback(async () => {
    try {
      const result = await fetchInfrastructureData();
      setData(result);
      setError(null);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      console.error('[useInfrastructure]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  fetchRef.current = fetch;

  // Initial load + polling
  useEffect(() => {
    fetchRef.current?.();
    const id = setInterval(() => fetchRef.current?.(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const activeRules = data.rules.filter(r => !r.deleted_at && r.active !== false);

  return {
    health:      data.health,
    switches:    data.switches,
    macTable:    data.macTable,
    rules:       data.rules,
    activeRules,
    sdnInfo:     data.sdnInfo,
    engineInfo:  data.engineInfo,
    mlStatus:    data.mlStatus,
    loading,
    error,
    lastUpdate,
    refresh: fetch,
  };
}