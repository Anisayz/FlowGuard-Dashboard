import { useState, useEffect, useCallback } from 'react';
import { getRules, getSwitches, getMacTable, getHealth, getTopology } from '../services/api';
import type { Rule, Switch, MacEntry, TopologyData } from '../types';

interface AppData {
  rules:       Rule[];
  switches:    Switch[];
  macTable:    MacEntry[];
  health:      any;
  topology:    TopologyData | null;
  topoLoading: boolean;
  topoError:   string | undefined;
  fetchAll:    () => Promise<void>;
}

export function useAppData(): AppData {
  const [rules,       setRules]       = useState<Rule[]>([]);
  const [switches,    setSwitches]    = useState<Switch[]>([]);
  const [macTable,    setMacTable]    = useState<MacEntry[]>([]);
  const [health,      setHealth]      = useState<any>({});
  const [topology,    setTopology]    = useState<TopologyData | null>(null);
  const [topoLoading, setTopoLoading] = useState(true);
  const [topoError,   setTopoError]   = useState<string | undefined>();

  const fetchAll = useCallback(async () => {
    setTopoLoading(true);
    setTopoError(undefined);

    // Core data — non-blocking on failure
    try {
      const [rulesData, switchesData, macData, healthData] = await Promise.all([
        getRules(),
        getSwitches(),
        getMacTable(),
        getHealth(),
      ]);
      setRules(rulesData);
      setSwitches(switchesData);
      setMacTable(macData);
      setHealth(healthData);
    } catch (err) {
      console.error('Core data fetch error:', err);
    }

    // Topology — separate state so failures are scoped
    try {
      const topoData = await getTopology();
      setTopology(topoData);
      setTopoError(undefined);
    } catch {
      setTopoError('Impossible de joindre le contrôleur Ryu');
    } finally {
      setTopoLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return { rules, switches, macTable, health, topology, topoLoading, topoError, fetchAll };
}
