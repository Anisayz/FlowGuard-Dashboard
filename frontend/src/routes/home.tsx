import DashboardHome from '../pages/DashboardHome';
import { useDashboardData } from '../contexts/DashboardDataContext';

export function HomeRoute() {
  const { topology, topoLoading, topoError } = useDashboardData();
  return (
    <DashboardHome
      topology={topology}
      isLoading={topoLoading}
      error={topoError}
    />
  );
}
