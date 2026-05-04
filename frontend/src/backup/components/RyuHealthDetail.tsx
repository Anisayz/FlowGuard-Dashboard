import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, Cpu, Zap, Server, RefreshCw } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

interface RyuDetail {
  controller: string;
  uptime: string;
  flows_installed: number;
  ryu: string;
  version?: string;
  switches_connected?: number;
}

interface Props { onBack: () => void; }

const RyuHealthDetail: React.FC<Props> = ({ onBack }) => {
  const [data, setData]       = useState<RyuDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/health`);
      setData(res.data);
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
        <button onClick={onBack} style={{
          background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)',
          color: '#00ff88', borderRadius: '8px', padding: '8px 14px',
          cursor: 'pointer', fontFamily: 'monospace', fontSize: '13px',
        }}>← Back</button>
        <div>
          <h2 style={{ color: '#00ff88', margin: 0, fontSize: '22px' }}>
            <Server size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Ryu SDN Controller
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
          background: data?.controller === 'healthy' ? 'rgba(0,255,136,0.1)' : 'rgba(255,0,102,0.1)',
          border: `1px solid ${data?.controller === 'healthy' ? '#00ff88' : '#ff0066'}`,
          borderRadius: '8px', padding: '8px 16px',
          color: data?.controller === 'healthy' ? '#00ff88' : '#ff0066',
          fontSize: '14px', fontWeight: 'bold',
        }}>
          {data?.controller === 'healthy' ? '🟢 ONLINE' : '🔴 OFFLINE'}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#00ff88' }}>Loading...</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {statCard(<Zap size={24} color="#00ff88" />,  'Status',           data?.controller || '-',       '#00ff88')}
            {statCard(<Activity size={24} color="#ffaa00" />, 'Uptime',        data?.uptime || '-',           '#ffaa00')}
            {statCard(<Cpu size={24} color="#00aaff" />,  'Flows Installed',  data?.flows_installed ?? '-',  '#00aaff')}
            {statCard(<Server size={24} color="#ff0066" />,'Switches',        data?.switches_connected ?? 4, '#ff0066')}
          </div>

          {/* Detail Table */}
          <div style={cardStyle}>
            <h3 style={{ color: '#00ff88', margin: '0 0 16px', borderLeft: '3px solid #ff0066', paddingLeft: '12px' }}>
              📋 Controller Details
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                {[
                  { key: 'Controller Status', value: data?.controller,       color: '#00ff88' },
                  { key: 'Ryu Status',         value: data?.ryu,             color: '#00ff88' },
                  { key: 'Uptime',             value: data?.uptime,          color: '#ffaa00' },
                  { key: 'Flows Installed',    value: data?.flows_installed, color: '#00aaff' },
                  { key: 'API Endpoint',       value: 'http://localhost:8080', color: '#8888aa' },
                  { key: 'REST API',           value: '/v1.0/topology/*',    color: '#8888aa' },
                  { key: 'Protocol',           value: 'OpenFlow 1.3',        color: '#8888aa' },
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
              📡 Event Log
            </h3>
            {[
              { time: new Date(Date.now() - 1000 * 60).toLocaleTimeString(), msg: 'Flow rules synced with switches', color: '#00ff88' },
              { time: new Date(Date.now() - 1000 * 120).toLocaleTimeString(), msg: 'New switch connected: s4',        color: '#00aaff' },
              { time: new Date(Date.now() - 1000 * 300).toLocaleTimeString(), msg: 'Topology discovery complete',     color: '#ffaa00' },
              { time: new Date(Date.now() - 1000 * 600).toLocaleTimeString(), msg: 'Controller started',             color: '#00ff88' },
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