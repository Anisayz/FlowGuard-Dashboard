import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import { DashboardRouteTree } from './layouts/DashboardRouteTree';
import { HomeRoute } from './routes/home';
import { FirewallRulesRoute } from './routes/firewall-rules';
import { AlertsRoute } from './routes/alerts';
import { InfrastructureRoute } from './routes/infrastructure';
import { RyuHealthRoute } from './routes/ryu-health';
import { MitigationEngineRoute } from './routes/mitigation-engine';
import { PATHS } from './routes/paths';
import { getMe, getStoredToken, logout } from './services/api';
import './App.css';

const loadingScreen = (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #0a0a12, #14141e)',
      color: '#8888aa',
      fontFamily: 'monospace',
    }}
  >
    Chargement…
  </div>
);

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const boot = async () => {
      const token = getStoredToken();
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const me = await getMe();
        setUsername(me.username);
      } catch {
        logout();
        setUsername(null);
      } finally {
        setAuthLoading(false);
      }
    };
    boot();
  }, []);

  const handleLogout = () => {
    logout();
    setUsername(null);
  };

  return (
    <BrowserRouter>
      {authLoading ? (
        loadingScreen
      ) : !username ? (
        <Login
          onLoggedIn={async () => {
            const me = await getMe();
            setUsername(me.username);
          }}
        />
      ) : (
        <Routes>
          <Route
            element={
              <DashboardRouteTree username={username} onLogout={handleLogout} />
            }
          >
            <Route index element={<HomeRoute />} />
            <Route path="firewall-rules" element={<FirewallRulesRoute />} />
            <Route path="alerts" element={<AlertsRoute />} />
            <Route path="infrastructure" element={<InfrastructureRoute />} />
            <Route path="health/ryu" element={<RyuHealthRoute />} />
            <Route
              path="health/mitigation-engine"
              element={<MitigationEngineRoute />}
            />
          </Route>
          <Route path="*" element={<Navigate to={PATHS.home} replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}
