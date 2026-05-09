import { useState, useEffect, useCallback } from 'react';
import { getRules, getSwitches, getAlerts, getTimeline, getAttackTypes, getRecentAlerts } from '../services/api';
import type { AttackType, DashboardStats, RecentAlert, Timeline } from '../types';

interface UseDashboardStatsReturn {
  stats:        DashboardStats;
  timeline:     Timeline;
  attackTypes:  AttackType[];
  recentAlerts: RecentAlert[];
}

const EMPTY_TIMELINE: Timeline = { labels: [], datasets: [] };

export function useDashboardStats(intervalMs = 20_000): UseDashboardStatsReturn {
  const [stats,        setStats]        = useState<DashboardStats>({
    totalRules: 0, activeRules: 0, blockedAttacks: 0, activeSwitches: 0,
  });
  const [timeline,     setTimeline]     = useState<Timeline>(EMPTY_TIMELINE);
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

      console.debug('[useDashboardStats] rules:',        rulesRes);
      console.debug('[useDashboardStats] switches:',     switchesRes);
      console.debug('[useDashboardStats] alerts:',       alertsRes);
      console.debug('[useDashboardStats] timeline:',     timelineRes);
      console.debug('[useDashboardStats] attackTypes:',  typesRes);
      console.debug('[useDashboardStats] recentAlerts:', recentRes);

      const activeRules = rulesRes.filter((r: any) => r.active === true);
      const blocked     = alertsRes.filter((a: any) => a.status === 'blocked').length;

      setStats({
        totalRules:     rulesRes.length,
        activeRules:    activeRules.length,
        blockedAttacks: blocked,
        activeSwitches: switchesRes.length,
      });

      // Backend returns { labels: string[], datasets: TimelineDataset[], _source? }
      // Guard against unexpected shapes
      setTimeline(
        timelineRes && Array.isArray(timelineRes.labels) && Array.isArray(timelineRes.datasets)
          ? timelineRes
          : EMPTY_TIMELINE,
      );

      setAttackTypes(Array.isArray(typesRes)  ? typesRes  : []);
      setRecentAlerts(Array.isArray(recentRes) ? recentRes : []);
    } catch (err) {
      console.error('[useDashboardStats] fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, intervalMs);
    return () => clearInterval(interval);
  }, [fetchAll, intervalMs]);

  return { stats, timeline, attackTypes, recentAlerts };
}