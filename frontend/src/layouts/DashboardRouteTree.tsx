import { DashboardDataProvider } from '../contexts/DashboardDataContext';
import { DashboardShell } from './DashboardShell';

type Props = {
  username: string;
  onLogout: () => void;
};

 
export function DashboardRouteTree({ username, onLogout }: Props) {
  return (
    <DashboardDataProvider>
      <DashboardShell username={username} onLogout={onLogout} />
    </DashboardDataProvider>
  );
}
