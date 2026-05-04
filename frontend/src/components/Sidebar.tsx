import type { FC } from 'react';
import { NavLink } from 'react-router-dom';
import { PATHS } from '../routes/paths';

const SIDEBAR_NAV = [
  { to: PATHS.home, label: 'Accueil', icon: '🏠', end: true },
  { to: PATHS.firewallRules, label: 'Pare-feu', icon: '🛡️', end: false },
  { to: PATHS.alerts, label: 'Alertes', icon: '🚨', end: false },
  { to: PATHS.infrastructure, label: 'Infrastructure', icon: '🏗️', end: false },
] as const;

type SidebarProps = {
  username?: string;
  onLogout: () => void;
};

const Sidebar: FC<SidebarProps> = ({ username, onLogout }) => (
  <aside className="dashboard-sidebar">
    <div className="dashboard-sidebar__header">
      <div className="dashboard-sidebar__title">🛡️ FlowGuard SDN</div>
      <div className="dashboard-sidebar__subtitle">Supervision sécurité</div>
      {username && (
        <div className="dashboard-sidebar__user">Utilisateur : {username}</div>
      )}
    </div>
    <nav className="dashboard-sidebar__nav" aria-label="Navigation principale">
      {SIDEBAR_NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `dashboard-sidebar__link${isActive ? ' dashboard-sidebar__link--active' : ''}`
          }
        >
          <span className="dashboard-sidebar__icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
    <div className="dashboard-sidebar__footer">
      <button type="button" className="dashboard-sidebar__logout" onClick={onLogout}>
        Déconnexion
      </button>
    </div>
  </aside>
);

export default Sidebar;
