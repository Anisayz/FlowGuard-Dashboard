import { useState, useEffect, useCallback } from 'react';
import { getRules, getSwitches, getAlerts, getTimeline, getAttackTypes, getRecentAlerts } from '../services/api';

export interface DashboardStats {
  totalRules:     number;
  activeRules:    number;
  blockedAttacks: number;
  activeSwitches: number;
}

export interface TimelinePoint { time: string; alerts: number; blocked: number; datasets: string[] }
export interface AttackType    { name: string; value: number; color: string; }
export interface RecentAlert   {
  time: string; src: string; dst: string;
  type: string; severity: string; sColor: string; status: string;
}

interface UseDashboardStatsReturn {
  stats:        DashboardStats;
  timeline:     TimelinePoint[];
  attackTypes:  AttackType[];
  recentAlerts: RecentAlert[];
}

export function useDashboardStats(intervalMs = 20_000): UseDashboardStatsReturn {
  const [stats,        setStats]        = useState<DashboardStats>({
    totalRules: 0, activeRules: 0, blockedAttacks: 0, activeSwitches: 0,
  });
  const [timeline,     setTimeline]     = useState<TimelinePoint[]>([]);
  const [attackTypes,  setAttackTypes]  = useState<AttackType[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      const [rulesRes, switchesRes, alertsRes, timelineRes, typesRes, recentRes] = await Promise.all([
        getRules(),
        getSwitches(),
        getAlerts(),
        getTimeline(),
        getAttackTypes(),
        getRecentAlerts(),
      ]);

      const activeRules = rulesRes.filter((r: any) => !r.deleted_at);
      const blocked     = alertsRes.filter((a: any) => a.status === 'blocked').length;

      setStats({
        totalRules:     rulesRes.length,
        activeRules:    activeRules.length,
        blockedAttacks: blocked,
        activeSwitches: switchesRes.length,
      });
      setTimeline(timelineRes);
      setAttackTypes(typesRes);
      setRecentAlerts(recentRes);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, intervalMs);
    return () => clearInterval(interval);
  }, [fetchAll, intervalMs]);

  return { stats, timeline, attackTypes, recentAlerts };
}
