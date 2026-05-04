import FirewallRules from '../components/FirewallRules';
import { useDashboardData } from '../contexts/DashboardDataContext';

export function FirewallRulesRoute() {
  const { rules, switches, fetchAll } = useDashboardData();
  const availableDpids = switches.map((s) => s.dpid);
  return (
    <FirewallRules
      rules={rules}
      onRefresh={fetchAll}
      availableDpids={availableDpids}
    />
  );
}
