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

    // Core data — each fetch is independent; one failure won't block the rest
    const [rulesRes, switchesRes, macRes, healthRes] = await Promise.allSettled([
      getRules(),
      getSwitches(),
      getMacTable(),
      getHealth(),
    ]);

    if (rulesRes.status    === 'fulfilled') setRules(rulesRes.value);
    else console.error('getRules failed:',    rulesRes.reason);

    if (switchesRes.status === 'fulfilled') setSwitches(switchesRes.value);
    else console.error('getSwitches failed:', switchesRes.reason);

    if (macRes.status      === 'fulfilled') setMacTable(macRes.value);
    else console.error('getMacTable failed:', macRes.reason);

    if (healthRes.status   === 'fulfilled') setHealth(healthRes.value);
    else console.error('getHealth failed:',   healthRes.reason);

    // Topology — separate so its failure is scoped to topoError
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
    const interval = setInterval(fetchAll, 20_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return { rules, switches, macTable, health, topology, topoLoading, topoError, fetchAll };
}