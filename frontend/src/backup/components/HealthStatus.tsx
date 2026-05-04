import React from 'react';
import { ViewId } from '../types';

interface Health {
  controller: string;
  mitigation_engine: string;
}

interface HealthStatusProps {
  health: Health;
  onNavigate: (view: ViewId) => void;
}

const HealthStatus: React.FC<HealthStatusProps> = ({ health, onNavigate }) => {
  const isRyuUp     = health.controller        === 'healthy';
  const isEngineUp  = health.mitigation_engine === 'healthy';

  const itemStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '10px',
    cursor: 'pointer', padding: '6px 12px',
    borderRadius: '6px', transition: 'background 0.2s',
    fontFamily: 'monospace',
  };

  return (
    <div className="health-status">
      <div
        className="health-item"
        style={itemStyle}
        onClick={() => onNavigate('ryu-health')}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,255,136,0.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        title="Voir détails Ryu Controller"
      >
        <span className={`health-dot ${isRyuUp ? 'healthy' : 'unhealthy'}`}></span>
        <span>SDN Controller: <strong style={{ color: isRyuUp ? '#00ff88' : '#ff0066' }}>{health.controller}</strong></span>
        <span style={{ color: '#555577', fontSize: '11px' }}>→</span>
      </div>

      <div
        className="health-item"
        style={itemStyle}
        onClick={() => onNavigate('engine-health')}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,255,136,0.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        title="Voir détails Mitigation Engine"
      >
        <span className={`health-dot ${isEngineUp ? 'healthy' : 'unhealthy'}`}></span>
        <span>Mitigation Engine: <strong style={{ color: isEngineUp ? '#00ff88' : '#ff0066' }}>{health.mitigation_engine}</strong></span>
        <span style={{ color: '#555577', fontSize: '11px' }}>→</span>
      </div>
    </div>
  );
};

export default HealthStatus;