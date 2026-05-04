import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Shield, AlertTriangle, TrendingUp, Clock, RefreshCw } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

interface Props { onBack: () => void; }

const MitigationEngineDetail: React.FC<Props> = ({ onBack }) => {
  const [data, setData]       = useState<any>(null);
  const [rules, setRules]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchData = async () => {
    try {
      const [healthRes, rulesRes] = await Promise.all([
        axios.get(`${API_BASE}/health`),
        axios.get(`${API_BASE}/rules`),
      ]);
      setData(healthRes.data);
      setRules(rulesRes.data);
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
        <button onClick={onBack} style={{
          background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)',
          color: '#00ff88', borderRadius: '8px', padding: '8px 14px',
          cursor: 'pointer', fontFamily: 'monospace', fontSize: '13px',
        }}>← Back</button>
        <div>
          <h2 style={{ color: '#00ff88', margin: 0, fontSize: '22px' }}>
            <Shield size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Mitigation Engine
          </h2>
          <p style={{ color: '#8888aa', margin: '4px 0 0', fontSize: '12px' }}>
            Last update: {lastUpdate}
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
          {data?.mitigation_engine === 'healthy' ? '🟢 ONLINE' : '🔴 OFFLINE'}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#00ff88' }}>Loading...</div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {statCard(<Shield    size={24} color="#00ff88" />, 'Active Rules',  activeRules.length,  '#00ff88')}
            {statCard(<AlertTriangle size={24} color="#ff0066" />, 'Auto-mitigated', autoRules.length, '#ff0066')}
            {statCard(<TrendingUp size={24} color="#ffaa00" />, 'Manual Rules', manualRules.length,  '#ffaa00')}
            {statCard(<Clock     size={24} color="#00aaff" />, 'Total History', rules.length,        '#00aaff')}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

            {/* Rule breakdown */}
            <div style={cardStyle}>
              <h3 style={{ color: '#00ff88', margin: '0 0 16px', borderLeft: '3px solid #ff0066', paddingLeft: '12px' }}>
                📊 Rule Breakdown
              </h3>
              {[
                { label: 'Active Rules',          value: activeRules.length,  color: '#00ff88', bg: 'rgba(0,255,136,0.1)' },
                { label: 'Auto-mitigated',        value: autoRules.length,    color: '#ff0066', bg: 'rgba(255,0,102,0.1)' },
                { label: 'Manual Rules',          value: manualRules.length,  color: '#ffaa00', bg: 'rgba(255,170,0,0.1)' },
                { label: 'Expired / Deleted',     value: deletedRules.length, color: '#8888aa', bg: 'rgba(136,136,170,0.1)' },
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
                ⚙️ Engine Info
              </h3>
              {[
                { key: 'Status',       value: data?.mitigation_engine, color: '#00ff88' },
                { key: 'Uptime',       value: data?.uptime,            color: '#ffaa00' },
                { key: 'API Endpoint', value: 'http://localhost:9000',  color: '#8888aa' },
                { key: 'Mode',         value: 'Automated + Manual',    color: '#8888aa' },
                { key: 'Storage',      value: 'In-Memory (fake)',       color: '#8888aa' },
                { key: 'Actions',      value: 'block / allow / ratelimit', color: '#8888aa' },
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
              🛡️ Recent Auto-Mitigations
            </h3>
            {autoRules.length === 0 ? (
              <p style={{ color: '#8888aa', fontSize: '13px' }}>No automated mitigations yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a2a35' }}>
                    {['IP Source', 'Action', 'Switch', 'Alert ID', 'Created'].map(h => (
                      <th key={h} style={{ padding: '8px', textAlign: 'left', color: '#8888aa' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {autoRules.map((rule) => (
                    <tr key={rule.rule_id} style={{ borderBottom: '1px solid #1a1a2a' }}>
                      <td style={{ padding: '9px 8px', color: '#ff0066' }}>{rule.src_ip}</td>
                      <td style={{ padding: '9px 8px', color: '#ffaa00' }}>{rule.action}</td>
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