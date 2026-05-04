import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import HealthStatus from '../components/HealthStatus';
import { useDashboardData } from '../contexts/DashboardDataContext';

type Props = {
  username: string;
  onLogout: () => void;
};

export function DashboardShell({ username, onLogout }: Props) {
  const { health } = useDashboardData();

  return (
    <div className="dashboard-shell">
      <Sidebar username={username} onLogout={onLogout} />
      <div className="dashboard-main">
        <div className="dashboard-main__health">
          <HealthStatus
            health={{
              controller: health.controller ?? 'unhealthy',
              mitigation_engine: health.mitigation_engine ?? 'unhealthy',
            }}
          />
        </div>
        <div className="dashboard-main__scroll">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
