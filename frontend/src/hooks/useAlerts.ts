import { useState, useEffect, useCallback } from 'react';
import { getAlerts } from '../services/api';

export interface Alert {
  alert_id:     string;
  src_ip:       string;
  dst_ip:       string;
  attack_type:  string;
  severity:     'critical' | 'high' | 'medium' | 'low';
  status:       'blocked' | 'mitigated' | 'monitoring' | 'resolved';
  dpid:         string;
  packet_count: number;
  byte_count:   number;
  created_at:   string;
  mitigated_at: string | null;
  rule_id:      string | null;
}

interface UseAlertsReturn {
  alerts:     Alert[];
  loading:    boolean;
  lastUpdate: string;
  refresh:    () => Promise<void>;
}

export function useAlerts(intervalMs = 8_000): UseAlertsReturn {
  const [alerts,     setAlerts]     = useState<Alert[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  const refresh = useCallback(async () => {
    try {
      const data = await getAlerts();
      setAlerts(data);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, intervalMs);
    return () => clearInterval(interval);
  }, [refresh, intervalMs]);

  return { alerts, loading, lastUpdate, refresh };
}
