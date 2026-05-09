 
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchInfrastructureData } from '../services/infrastructureService';
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

const POLL_INTERVAL_MS = 20_000;

 

export interface UseInfrastructureReturn {
  health:      HealthData;
  switches:    Switch[];
  macTable:    MacEntry[];
  rules:       Rule[];
  activeRules: Rule[];
  sdnInfo:     SdnInfo     | null;
  engineInfo:  EngineInfo  | null;
  mlStatus:    MlStatus    | null;
  loading:     boolean;
  error:       string | null;
  lastUpdate:  string;
  refresh:     () => void;
}

const EMPTY: InfrastructureData = {
  health: {}, switches: [], macTable: [], rules: [],
  sdnInfo: null, engineInfo: null, mlStatus: null,
};

 

export function useInfrastructure(): UseInfrastructureReturn {
  const [data,       setData]       = useState<InfrastructureData>(EMPTY);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchRef = useRef<(() => Promise<void>) | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchInfrastructureData();
      console.debug('[useInfrastructure] fetched:', result);
      setData(result);
      setError(null);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useInfrastructure] fetch error:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  fetchRef.current = load;

  useEffect(() => {
    fetchRef.current?.();
    const id = setInterval(() => fetchRef.current?.(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const activeRules = data.rules.filter(r => r.active === true);

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
    refresh:     load,
  };
}