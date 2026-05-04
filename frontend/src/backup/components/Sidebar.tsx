import React from 'react';
import { ViewId } from '../types';


interface SidebarProps { activeView: ViewId; setActiveView: (v: ViewId) => void; }

const menuItems: { id: ViewId; label: string; icon: string }[] = [
  { id: 'home',           label: 'Home',           icon: '🏠' },
  { id: 'rules',          label: 'Firewall Rules', icon: '🛡️' },
  { id: 'alerts',         label: 'Alerts',         icon: '🚨' },  
  { id: 'infrastructure', label: 'Infrastructure', icon: '🏗️' },
];

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => (
  <div style={{
    width: '220px', minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a12, #14141e)',
    borderRight: '1px solid #2a2a3a',
    padding: '20px 0', fontFamily: 'monospace',
  }}>
    <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #2a2a3a' }}>
      <div style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '16px' }}>🛡️ SDN Dashboard</div>
      <div style={{ color: '#8888aa', fontSize: '11px', marginTop: '4px' }}>Security Monitor</div>
    </div>
    <nav style={{ marginTop: '16px' }}>
      {menuItems.map((item) => {
        const active = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            style={{
              width: '100%', textAlign: 'left',
              background: active ? 'linear-gradient(90deg, #00ff8822, transparent)' : 'transparent',
              border: 'none',
              borderLeft: active ? '3px solid #00ff88' : '3px solid transparent',
              color: active ? '#00ff88' : '#8888aa',
              padding: '12px 20px',
              cursor: 'pointer', fontSize: '13px',
              display: 'flex', alignItems: 'center', gap: '10px',
              transition: 'all 0.2s',
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  </div>
);

export default Sidebar;