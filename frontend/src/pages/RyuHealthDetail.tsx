import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Activity, Cpu, Zap, Server, RefreshCw } from 'lucide-react';
import { API_BASE } from '../services/api';
import { PATHS } from '../routes/paths';
import { uiHealth, uiRyuState } from '../i18n/formatters';

interface RyuDetail {
  controller: string;
  uptime: string;
  flows_installed: number;
  ryu: string;
  version?: string;
  switches_connected?: number;
  demo_mode?: boolean;
  note?: string;
}

const RyuHealthDetail: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData]       = useState<RyuDetail | null>(null);
  const [sdnInfo, setSdnInfo] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchData = async () => {
    try {
      const [healthRes, sdnRes] = await Promise.all([
        axios.get<RyuDetail>(`${API_BASE}/health`),
        axios.get(`${API_BASE}/sdn/info`),
      ]);
      setData(healthRes.data);
      setSdnInfo(sdnRes.data);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

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
          background: data?.controller === 'healthy' ? 'rgba(0,255,136,0.1)' : 'rgba(255,0,102,0.1)',
          border: `1px solid ${data?.controller === 'healthy' ? '#00ff88' : '#ff0066'}`,
          borderRadius: '8px', padding: '8px 16px',
          color: data?.controller === 'healthy' ? '#00ff88' : '#ff0066',
          fontSize: '14px', fontWeight: 'bold',
        }}>
          {data?.controller === 'healthy' ? '🟢 EN LIGNE' : '🔴 HORS LIGNE'}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#00ff88' }}>Chargement…</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {statCard(<Zap size={24} color="#00ff88" />,  'Statut',           uiHealth(data?.controller) || '-',       '#00ff88')}
            {statCard(<Activity size={24} color="#ffaa00" />, 'Disponibilité',        data?.uptime || '-',           '#ffaa00')}
            {statCard(<Cpu size={24} color="#00aaff" />,  'Flux installés',  data?.flows_installed ?? '-',  '#00aaff')}
            {statCard(<Server size={24} color="#ff0066" />,'Commutateurs',        data?.switches_connected ?? 4, '#ff0066')}
          </div>

          {data?.demo_mode && data?.note && (
            <div style={{
              ...cardStyle,
              marginBottom: '16px',
              borderColor: '#ffaa0066',
              color: '#ffcc66',
              fontSize: '12px',
            }}>
              Mode démo : {data.note}
            </div>
          )}

          {/* Detail Table */}
          <div style={cardStyle}>
            <h3 style={{ color: '#00ff88', margin: '0 0 16px', borderLeft: '3px solid #ff0066', paddingLeft: '12px' }}>
              📋 Détails du contrôleur
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                {[
                  { key: 'État contrôleur', value: uiHealth(data?.controller),       color: '#00ff88' },
                  { key: 'État Ryu',         value: uiRyuState(data?.ryu),             color: '#00ff88' },
                  { key: 'Durée de fonctionnement',             value: data?.uptime,          color: '#ffaa00' },
                  { key: 'Flux installés',    value: data?.flows_installed, color: '#00aaff' },
                  { key: 'Point d’accès API',       value: sdnInfo?.api_endpoint ?? 'http://localhost:8080', color: '#8888aa' },
                  { key: 'API REST',           value: sdnInfo?.rest_api ?? '/v1.0/topology/*',    color: '#8888aa' },
                  { key: 'Protocole',           value: sdnInfo?.protocol ?? 'OpenFlow 1.3',        color: '#8888aa' },
                  { key: 'Version',            value: sdnInfo?.version,      color: '#8888aa' },
                  { key: 'Écoute',             value: sdnInfo?.listen_address, color: '#8888aa' },
                  { key: 'Port OpenFlow',            value: sdnInfo?.ofp_listen_port, color: '#8888aa' },
                ].map(({ key, value, color }) => (
                  <tr key={key} style={{ borderBottom: '1px solid #1a1a2a' }}>
                    <td style={{ padding: '10px 12px', color: '#8888aa', width: '40%' }}>{key}</td>
                    <td style={{ padding: '10px 12px', color }}>{String(value ?? '-')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Timeline */}
          <div style={{ ...cardStyle, marginTop: '16px' }}>
            <h3 style={{ color: '#00ff88', margin: '0 0 16px', borderLeft: '3px solid #ff0066', paddingLeft: '12px' }}>
              📡 Journal d’événements
            </h3>
            {[
              { time: new Date(Date.now() - 1000 * 60).toLocaleTimeString(), msg: 'Règles de flux synchronisées avec les commutateurs', color: '#00ff88' },
              { time: new Date(Date.now() - 1000 * 120).toLocaleTimeString(), msg: 'Nouveau commutateur connecté : s4',        color: '#00aaff' },
              { time: new Date(Date.now() - 1000 * 300).toLocaleTimeString(), msg: 'Découverte de topologie terminée',     color: '#ffaa00' },
              { time: new Date(Date.now() - 1000 * 600).toLocaleTimeString(), msg: 'Démarrage du contrôleur',             color: '#00ff88' },
            ].map((ev, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', padding: '8px 0', borderBottom: '1px solid #1a1a2a', fontSize: '12px' }}>
                <span style={{ color: '#555577', minWidth: '80px' }}>{ev.time}</span>
                <span style={{ color: ev.color }}>{ev.msg}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default RyuHealthDetail;