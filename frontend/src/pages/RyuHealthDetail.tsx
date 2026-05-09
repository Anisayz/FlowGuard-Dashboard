import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Activity, Cpu, Zap, Server, RefreshCw } from 'lucide-react';
import { API_BASE } from '../services/api';
import { PATHS } from '../routes/paths';
import { uiHealth, uiRyuState } from '../i18n/formatters';
import type { HealthData, SdnInfo } from '../types';

const RyuHealthDetail: React.FC = () => {
  const navigate = useNavigate();
  const [health,     setHealth]     = useState<HealthData | null>(null);
  const [sdnInfo,    setSdnInfo]    = useState<SdnInfo | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchData = async () => {
    try {
      const [healthRes, sdnRes] = await Promise.all([
        axios.get<HealthData>(`${API_BASE}/health`),
        axios.get<SdnInfo>(`${API_BASE}/sdn/info`),
      ]);
      console.debug('[RyuHealthDetail] health:', healthRes.data);
      console.debug('[RyuHealthDetail] sdn/info:', sdnRes.data);
      setHealth(healthRes.data);
      setSdnInfo(sdnRes.data);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('[RyuHealthDetail] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5_000);
    return () => clearInterval(interval);
  }, []);

  // ── Derived from health.ryu (the nested RyuHealth object) ─────────────────
  const ryuObj    = health?.ryu;
  const isHealthy = ryuObj?.controller === 'healthy';

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1e1e2a, #14141e)',
    border: '1px solid #2a2a35', borderRadius: '12px',
    padding: '20px', fontFamily: 'monospace',
  };

  const statCard = (icon: React.ReactNode, label: string, value: string | number, color: string) => (
    <div style={{ ...cardStyle, textAlign: 'center' }}>
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '26px', fontWeight: 'bold', color }}>{value}</div>
      <div style={{ color: '#8888aa', fontSize: '12px', marginTop: '4px' }}>{label}</div>
    </div>
  );

  return (
    <div style={{ fontFamily: 'monospace', color: '#e0e0ff' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button type="button" onClick={() => navigate(PATHS.home)} style={{
          background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)',
          color: '#00ff88', borderRadius: '8px', padding: '8px 14px',
          cursor: 'pointer', fontFamily: 'monospace', fontSize: '13px',
        }}>← Retour</button>

        <div>
          <h2 style={{ color: '#00ff88', margin: 0, fontSize: '22px' }}>
            <Server size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Contrôleur SDN Ryu
          </h2>
          <p style={{ color: '#8888aa', margin: '4px 0 0', fontSize: '12px' }}>
            Dernière mise à jour : {lastUpdate}
            <button onClick={fetchData} style={{
              background: 'none', border: 'none', color: '#00ff88',
              cursor: 'pointer', marginLeft: '8px', padding: 0,
            }}>
              <RefreshCw size={12} />
            </button>
          </p>
        </div>

        <div style={{
          marginLeft: 'auto',
          background: isHealthy ? 'rgba(0,255,136,0.1)' : 'rgba(255,0,102,0.1)',
          border: `1px solid ${isHealthy ? '#00ff88' : '#ff0066'}`,
          borderRadius: '8px', padding: '8px 16px',
          color: isHealthy ? '#00ff88' : '#ff0066',
          fontSize: '14px', fontWeight: 'bold',
        }}>
          {isHealthy ? '🟢 EN LIGNE' : '🔴 HORS LIGNE'}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#00ff88' }}>Chargement…</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {statCard(<Zap size={24} color="#00ff88" />,     'Statut',           uiHealth(ryuObj?.controller) || '-',   '#00ff88')}
            {statCard(<Activity size={24} color="#ffaa00" />, 'Disponibilité',    String(ryuObj?.uptime ?? '-'),         '#ffaa00')}
            {statCard(<Cpu size={24} color="#00aaff" />,     'Flux installés',   String(ryuObj?.flows_installed ?? '-'),'#00aaff')}
            {statCard(<Server size={24} color="#ff0066" />,  'Commutateurs',     String(ryuObj?.switches ?? '-'),       '#ff0066')}
          </div>

          {/* Detail Table */}
          <div style={cardStyle}>
            <h3 style={{ color: '#00ff88', margin: '0 0 16px', borderLeft: '3px solid #ff0066', paddingLeft: '12px' }}>
              📋 Détails du contrôleur
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                {[
                  { key: 'État contrôleur',  value: uiHealth(ryuObj?.controller),    color: '#00ff88' },
                { key: 'État Ryu', value: ryuObj != null ? uiRyuState(ryuObj) : undefined, color: '#00ff88' },
                  { key: 'Flux installés',   value: ryuObj?.flows_installed,         color: '#00aaff' },
                  { key: 'Commutateurs',     value: ryuObj?.switches,                color: '#00aaff' },
                  { key: 'Règles',           value: ryuObj?.rules,                   color: '#ff0066' },
                  { key: 'Horodatage',       value: ryuObj?.time,                    color: '#8888aa' },
                  { key: 'Point d\'accès API', value: sdnInfo?.api_endpoint,         color: '#8888aa' },
                  { key: 'API REST',         value: sdnInfo?.rest_api,              color: '#8888aa' },
                  { key: 'Protocole',        value: sdnInfo?.protocol,              color: '#8888aa' },
                  { key: 'Version',          value: sdnInfo?.version,               color: '#8888aa' },
                  { key: 'Architecture',     value: sdnInfo?.architecture,          color: '#8888aa' },
                  { key: 'Dernière synchro', value: sdnInfo?.last_topology_sync,    color: '#8888aa' },
                ].map(({ key, value, color }) => value != null && (
                  <tr key={key} style={{ borderBottom: '1px solid #1a1a2a' }}>
                    <td style={{ padding: '10px 12px', color: '#8888aa', width: '40%' }}>{key}</td>
                    <td style={{ padding: '10px 12px', color }}>{String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default RyuHealthDetail;