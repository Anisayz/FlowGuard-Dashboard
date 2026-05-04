import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, TrendingUp, Clock, RefreshCw } from 'lucide-react';
import { API_BASE } from '../services/api';
import { PATHS } from '../routes/paths';
import { uiHealth } from '../i18n/formatters';

const MitigationEngineDetail: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData]       = useState<any>(null);
  const [rules, setRules]     = useState<any[]>([]);
  const [engineInfo, setEngineInfo] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchData = async () => {
    try {
      const [healthRes, rulesRes, engineRes] = await Promise.all([
        axios.get(`${API_BASE}/health`),
        axios.get(`${API_BASE}/rules`),
        axios.get(`${API_BASE}/engine/info`),
      ]);
      setData(healthRes.data);
      setRules(rulesRes.data);
      setEngineInfo(engineRes.data);
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

  const activeRules   = rules.filter((r) => !r.deleted_at);
  const deletedRules  = rules.filter((r) =>  r.deleted_at);
  const autoRules     = activeRules.filter((r) => r.source === 'mitigation_engine');
  const manualRules   = activeRules.filter((r) => r.source === 'manual');

  const statCard = (icon: React.ReactNode, label: string, value: string | number, color: string) => (
    <div style={{ ...cardStyle, textAlign: 'center' }}>
      <div style={{ marginBottom: '8px' }}>{icon}</div>
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
            <Shield size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Moteur de mitigation
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
          background: data?.mitigation_engine === 'healthy' ? 'rgba(0,255,136,0.1)' : 'rgba(255,0,102,0.1)',
          border: `1px solid ${data?.mitigation_engine === 'healthy' ? '#00ff88' : '#ff0066'}`,
          borderRadius: '8px', padding: '8px 16px',
          color: data?.mitigation_engine === 'healthy' ? '#00ff88' : '#ff0066',
          fontSize: '14px', fontWeight: 'bold',
        }}>
          {data?.mitigation_engine === 'healthy' ? '🟢 EN LIGNE' : '🔴 HORS LIGNE'}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#00ff88' }}>Chargement…</div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {statCard(<Shield    size={24} color="#00ff88" />, 'Règles actives',  activeRules.length,  '#00ff88')}
            {statCard(<AlertTriangle size={24} color="#ff0066" />, 'Auto-mitigation', autoRules.length, '#ff0066')}
            {statCard(<TrendingUp size={24} color="#ffaa00" />, 'Règles manuelles', manualRules.length,  '#ffaa00')}
            {statCard(<Clock     size={24} color="#00aaff" />, 'Total historique', rules.length,        '#00aaff')}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

            {/* Rule breakdown */}
            <div style={cardStyle}>
              <h3 style={{ color: '#00ff88', margin: '0 0 16px', borderLeft: '3px solid #ff0066', paddingLeft: '12px' }}>
                📊 Répartition des règles
              </h3>
              {[
                { label: 'Règles actives',          value: activeRules.length,  color: '#00ff88', bg: 'rgba(0,255,136,0.1)' },
                { label: 'Auto-mitigation',        value: autoRules.length,    color: '#ff0066', bg: 'rgba(255,0,102,0.1)' },
                { label: 'Règles manuelles',          value: manualRules.length,  color: '#ffaa00', bg: 'rgba(255,170,0,0.1)' },
                { label: 'Expirées / supprimées',     value: deletedRules.length, color: '#8888aa', bg: 'rgba(136,136,170,0.1)' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: '1px solid #1a1a2a', fontSize: '13px',
                }}>
                  <span style={{ color: '#8888aa' }}>{label}</span>
                  <span style={{ background: bg, color, padding: '2px 10px', borderRadius: '6px', fontWeight: 'bold' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Engine Info */}
            <div style={cardStyle}>
              <h3 style={{ color: '#00ff88', margin: '0 0 16px', borderLeft: '3px solid #ff0066', paddingLeft: '12px' }}>
                ⚙️ Informations moteur
              </h3>
              {[
                { key: 'Statut',       value: uiHealth(data?.mitigation_engine), color: '#00ff88' },
                { key: 'Durée de fonctionnement',       value: data?.uptime,            color: '#ffaa00' },
                { key: 'Service',      value: engineInfo?.service_name, color: '#00aaff' },
                { key: 'Version',      value: engineInfo?.version,      color: '#00ff88' },
                { key: 'Point d’accès API', value: engineInfo?.api_endpoint ?? 'http://localhost:9000', color: '#8888aa' },
                { key: 'Mode',         value: engineInfo?.mode ?? 'Automatisé + manuel', color: '#8888aa' },
                { key: 'Stockage',      value: engineInfo?.storage,      color: '#8888aa' },
                { key: 'Workers',      value: engineInfo?.workers,      color: '#8888aa' },
                { key: 'Capacité file',   value: engineInfo?.queue_capacity, color: '#8888aa' },
                { key: 'Règles max',    value: engineInfo?.max_active_rules, color: '#ffaa00' },
                { key: 'Actions',      value: Array.isArray(engineInfo?.actions) ? (engineInfo!.actions as string[]).join(' / ') : 'bloquer / autoriser / limiter', color: '#8888aa' },
                { key: 'Dernier signal', value: engineInfo?.last_heartbeat, color: '#555577' },
                { key: 'Intégration', value: engineInfo?.integration, color: '#555577' },
              ].map(({ key, value, color }) => (
                <div key={key} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid #1a1a2a', fontSize: '12px',
                }}>
                  <span style={{ color: '#8888aa' }}>{key}</span>
                  <span style={{ color }}>{String(value ?? '-')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent auto-mitigated rules */}
          <div style={cardStyle}>
            <h3 style={{ color: '#00ff88', margin: '0 0 16px', borderLeft: '3px solid #ff0066', paddingLeft: '12px' }}>
              🛡️ Mitigations automatiques récentes
            </h3>
            {autoRules.length === 0 ? (
              <p style={{ color: '#8888aa', fontSize: '13px' }}>Aucune mitigation automatique pour le moment.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a2a35' }}>
                    {['IP source', 'Action', 'Commutateur', 'ID alerte', 'Créée'].map(h => (
                      <th key={h} style={{ padding: '8px', textAlign: 'left', color: '#8888aa' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {autoRules.map((rule) => (
                    <tr key={rule.rule_id} style={{ borderBottom: '1px solid #1a1a2a' }}>
                      <td style={{ padding: '9px 8px', color: '#ff0066' }}>{rule.src_ip}</td>
                      <td style={{ padding: '9px 8px', color: '#ffaa00' }}>{({ block: 'Bloquer', allow: 'Autoriser', ratelimit: 'Limiter' } as Record<string, string>)[rule.action] ?? rule.action}</td>
                      <td style={{ padding: '9px 8px', color: '#00aaff' }}>{rule.dpid}</td>
                      <td style={{ padding: '9px 8px', color: '#8888aa' }}>{rule.alert_id || '-'}</td>
                      <td style={{ padding: '9px 8px', color: '#8888aa', fontSize: '11px' }}>
                        {new Date(rule.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MitigationEngineDetail;