import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, RefreshCw, Filter, Eye } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

interface Alert {
  alert_id: string;
  src_ip: string;
  dst_ip: string;
  attack_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'blocked' | 'mitigated' | 'monitoring' | 'resolved';
  dpid: string;
  packet_count: number;
  byte_count: number;
  created_at: string;
  mitigated_at: string | null;
  rule_id: string | null;
}

const severityConfig: Record<string, { color: string; icon: string }> = {
  critical: { color: '#ff0066', icon: '🔴' },
  high:     { color: '#ff6600', icon: '🟠' },
  medium:   { color: '#ffaa00', icon: '🟡' },
  low:      { color: '#00aaff', icon: '🔵' },
};

const statusConfig: Record<string, { color: string }> = {
  blocked:    { color: '#ff0066' },
  mitigated:  { color: '#ffaa00' },
  monitoring: { color: '#00aaff' },
  resolved:   { color: '#00ff88' },
};

const AlertsTable: React.FC = () => {
  const [alerts,      setAlerts]      = useState<Alert[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdate,  setLastUpdate]  = useState('');
  const [filterSev,   setFilterSev]   = useState<string>('all');
  const [filterStat,  setFilterStat]  = useState<string>('all');
  const [selected,    setSelected]    = useState<Alert | null>(null);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/alerts`);
      setAlerts(res.data);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 8000);
    return () => clearInterval(interval);
  }, []);

  const filtered = alerts.filter((a) => {
    if (filterSev  !== 'all' && a.severity !== filterSev)  return false;
    if (filterStat !== 'all' && a.status   !== filterStat) return false;
    return true;
  });

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1e1e2a, #14141e)',
    border: '1px solid #2a2a35', borderRadius: '12px',
    fontFamily: 'monospace',
  };

  const badge = (text: string, color: string) => (
    <span style={{
      background: color + '22', border: `1px solid ${color}66`,
      color, borderRadius: '4px', padding: '2px 8px',
      fontSize: '11px', fontWeight: 'bold',
    }}>{text}</span>
  );

  const selectStyle: React.CSSProperties = {
    background: '#14141e', border: '1px solid #2a2a35',
    borderRadius: '6px', color: '#e0e0ff',
    padding: '6px 10px', fontSize: '12px',
    fontFamily: 'monospace', outline: 'none', cursor: 'pointer',
  };

  // Counters
  const counts = {
    critical:   alerts.filter(a => a.severity === 'critical').length,
    high:       alerts.filter(a => a.severity === 'high').length,
    medium:     alerts.filter(a => a.severity === 'medium').length,
    low:        alerts.filter(a => a.severity === 'low').length,
    blocked:    alerts.filter(a => a.status   === 'blocked').length,
    monitoring: alerts.filter(a => a.status   === 'monitoring').length,
  };

  return (
    <div style={{ fontFamily: 'monospace', color: '#e0e0ff' }}>

      {/* Header */}
      <div style={{ ...cardStyle, padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ color: '#ff0066', margin: '0 0 4px', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} color="#ff0066" /> Security Alerts
            </h2>
            <p style={{ color: '#8888aa', margin: 0, fontSize: '12px' }}>
              Live feed from database • Last update: {lastUpdate}
            </p>
          </div>
          <button onClick={fetchAlerts} style={{
            background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)',
            color: '#00ff88', borderRadius: '8px', padding: '8px 14px',
            cursor: 'pointer', fontFamily: 'monospace', fontSize: '12px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginTop: '16px' }}>
          {[
            { label: 'Critical',   value: counts.critical,   color: '#ff0066' },
            { label: 'High',       value: counts.high,       color: '#ff6600' },
            { label: 'Medium',     value: counts.medium,     color: '#ffaa00' },
            { label: 'Low',        value: counts.low,        color: '#00aaff' },
            { label: 'Blocked',    value: counts.blocked,    color: '#ff0066' },
            { label: 'Monitoring', value: counts.monitoring, color: '#00aaff' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: color + '11', border: `1px solid ${color}33`,
              borderRadius: '8px', padding: '10px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color }}>{value}</div>
              <div style={{ color: '#8888aa', fontSize: '10px', marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{
        ...cardStyle, padding: '14px 20px', marginBottom: '16px',
        display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8888aa', fontSize: '13px' }}>
          <Filter size={14} /> Filters:
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ color: '#8888aa', fontSize: '12px' }}>Severity:</label>
          <select style={selectStyle} value={filterSev} onChange={(e) => setFilterSev(e.target.value)}>
            <option value="all">All</option>
            <option value="critical">🔴 Critical</option>
            <option value="high">🟠 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🔵 Low</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ color: '#8888aa', fontSize: '12px' }}>Status:</label>
          <select style={selectStyle} value={filterStat} onChange={(e) => setFilterStat(e.target.value)}>
            <option value="all">All</option>
            <option value="blocked">Blocked</option>
            <option value="mitigated">Mitigated</option>
            <option value="monitoring">Monitoring</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <span style={{ color: '#8888aa', fontSize: '12px', marginLeft: 'auto' }}>
          {filtered.length} / {alerts.length} alerts
        </span>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#00ff88' }}>
            <div style={{ fontSize: '32px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
            <p style={{ marginTop: '12px', color: '#8888aa' }}>Loading alerts from database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#8888aa', fontSize: '13px' }}>
            <AlertTriangle size={40} color="#8888aa" style={{ marginBottom: '12px' }} />
            <p>No alerts match the current filters.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#14141e', borderBottom: '2px solid #2a2a35' }}>
                {['Alert ID', 'Source IP', 'Dest IP', 'Attack Type', 'Severity', 'Status', 'Switch', 'Packets', 'Created', 'Details'].map(h => (
                  <th key={h} style={{ padding: '12px 10px', textAlign: 'left', color: '#00ff88', fontSize: '11px', letterSpacing: '1px' }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((alert) => {
                const sev  = severityConfig[alert.severity]  || { color: '#8888aa', icon: '⚪' };
                const stat = statusConfig[alert.status]       || { color: '#8888aa' };
                return (
                  <tr
                    key={alert.alert_id}
                    style={{ borderBottom: '1px solid #1a1a2a', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,255,136,0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '11px 10px', color: '#555577', fontSize: '11px' }}>
                      {alert.alert_id.slice(0, 10)}…
                    </td>
                    <td style={{ padding: '11px 10px', color: '#ff0066', fontWeight: 'bold' }}>{alert.src_ip}</td>
                    <td style={{ padding: '11px 10px', color: '#8888aa' }}>{alert.dst_ip}</td>
                    <td style={{ padding: '11px 10px', color: '#ffaa00' }}>{alert.attack_type}</td>
                    <td style={{ padding: '11px 10px' }}>
                      <span style={{
                        background: sev.color + '22', border: `1px solid ${sev.color}66`,
                        color: sev.color, borderRadius: '4px', padding: '3px 8px', fontSize: '11px',
                      }}>
                        {sev.icon} {alert.severity.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '11px 10px' }}>
                      <span style={{
                        background: stat.color + '22', border: `1px solid ${stat.color}66`,
                        color: stat.color, borderRadius: '4px', padding: '3px 8px', fontSize: '11px',
                      }}>
                        {alert.status}
                      </span>
                    </td>
                    <td style={{ padding: '11px 10px', color: '#00aaff' }}>{alert.dpid}</td>
                    <td style={{ padding: '11px 10px', color: '#8888aa' }}>
                      {alert.packet_count.toLocaleString()}
                    </td>
                    <td style={{ padding: '11px 10px', color: '#555577', fontSize: '11px' }}>
                      {new Date(alert.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '11px 10px' }}>
                      <button
                        onClick={() => setSelected(alert)}
                        style={{
                          background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)',
                          color: '#00ff88', borderRadius: '4px', padding: '4px 8px',
                          cursor: 'pointer', fontSize: '11px', fontFamily: 'monospace',
                          display: 'flex', alignItems: 'center', gap: '4px',
                        }}
                      >
                        <Eye size={11} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{
              background: '#1e1e2a', border: '1px solid #2a2a35',
              borderRadius: '16px', padding: '28px', width: '520px',
              fontFamily: 'monospace',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ color: '#ff0066', margin: 0, fontSize: '16px' }}>
                🚨 Alert Details
              </h3>
              <button onClick={() => setSelected(null)} style={{
                background: 'none', border: 'none', color: '#8888aa',
                cursor: 'pointer', fontSize: '18px',
              }}>✕</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                {[
                  { label: 'Alert ID',     value: selected.alert_id,                                      color: '#8888aa' },
                  { label: 'Source IP',    value: selected.src_ip,                                        color: '#ff0066' },
                  { label: 'Destination',  value: selected.dst_ip,                                        color: '#e0e0ff' },
                  { label: 'Attack Type',  value: selected.attack_type,                                   color: '#ffaa00' },
                  { label: 'Severity',     value: badge(selected.severity.toUpperCase(), severityConfig[selected.severity]?.color || '#8888aa') },
                  { label: 'Status',       value: badge(selected.status, statusConfig[selected.status]?.color || '#8888aa') },
                  { label: 'Switch',       value: selected.dpid,                                          color: '#00aaff' },
                  { label: 'Packets',      value: selected.packet_count.toLocaleString(),                 color: '#e0e0ff' },
                  { label: 'Bytes',        value: selected.byte_count.toLocaleString(),                   color: '#e0e0ff' },
                  { label: 'Detected at',  value: new Date(selected.created_at).toLocaleString(),         color: '#8888aa' },
                  { label: 'Mitigated at', value: selected.mitigated_at ? new Date(selected.mitigated_at).toLocaleString() : '—', color: '#8888aa' },
                  { label: 'Rule ID',      value: selected.rule_id || '—',                               color: '#8888aa' },
                ].map(({ label, value, color }) => (
                  <tr key={label} style={{ borderBottom: '1px solid #1a1a2a' }}>
                    <td style={{ padding: '9px 0', color: '#8888aa', width: '40%' }}>{label}</td>
                    <td style={{ padding: '9px 0', color }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsTable;