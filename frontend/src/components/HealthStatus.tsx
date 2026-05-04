import type { CSSProperties, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import type { HealthStatusProps } from '../types';
import { PATHS } from '../routes/paths';
import { uiHealth } from '../i18n/formatters';

const HealthStatus: FC<HealthStatusProps> = ({ health }) => {
  const navigate = useNavigate();
  const isRyuUp = health.controller === 'healthy';
  const isEngineUp = health.mitigation_engine === 'healthy';

  const itemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '6px',
    transition: 'background 0.2s',
    fontFamily: 'monospace',
  };

  return (
    <div className="health-status">
      <div
        className="health-item"
        style={itemStyle}
        onClick={() => navigate(PATHS.ryuHealth)}
        onKeyDown={(e) => e.key === 'Enter' && navigate(PATHS.ryuHealth)}
        role="button"
        tabIndex={0}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0,255,136,0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
        title="Détails du contrôleur Ryu"
      >
        <span className={`health-dot ${isRyuUp ? 'healthy' : 'unhealthy'}`} />
        <span>
          Contrôleur SDN :{' '}
          <strong style={{ color: isRyuUp ? '#00ff88' : '#ff0066' }}>
            {uiHealth(health.controller)}
          </strong>
        </span>
        <span style={{ color: '#555577', fontSize: '11px' }}>→</span>
      </div>

      <div
        className="health-item"
        style={itemStyle}
        onClick={() => navigate(PATHS.mitigationEngine)}
        onKeyDown={(e) => e.key === 'Enter' && navigate(PATHS.mitigationEngine)}
        role="button"
        tabIndex={0}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0,255,136,0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
        title="Détails du moteur de mitigation"
      >
        <span className={`health-dot ${isEngineUp ? 'healthy' : 'unhealthy'}`} />
        <span>
          Moteur de mitigation :{' '}
          <strong style={{ color: isEngineUp ? '#00ff88' : '#ff0066' }}>
            {uiHealth(health.mitigation_engine)}
          </strong>
        </span>
        <span style={{ color: '#555577', fontSize: '11px' }}>→</span>
      </div>
    </div>
  );
};

export default HealthStatus;