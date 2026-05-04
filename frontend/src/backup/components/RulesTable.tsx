import React from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';
interface Rule { rule_id: string; src_ip: string; action: string; dpid: string; source: string; rate_kbps?: number | null; created_at: string; }
interface RulesTableProps { rules: Rule[]; onDelete: () => void; }

const actionColor = (a: string) =>
  a === 'block' ? '#ff0066' : a === 'allow' ? '#00ff88' : '#ffaa00';

const RulesTable: React.FC<RulesTableProps> = ({ rules, onDelete }) => {
  const handleDelete = async (ruleId: string) => {
    if (window.confirm('Delete this rule?')) {
      try { await axios.delete(`${API_BASE}/rules/${ruleId}`); onDelete(); }
      catch { alert('Error deleting rule'); }
    }
  };

  if (rules.length === 0)
    return <p style={{ color: '#8888aa', textAlign: 'center', padding: '40px', fontFamily: 'monospace' }}>No active rules.</p>;

  return (
    <div style={{ background: 'linear-gradient(135deg, #1e1e2a, #14141e)', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden' }}>
      <h3 style={{ color: '#00ff88', padding: '16px 20px', margin: 0, borderBottom: '1px solid #2a2a3a', fontFamily: 'monospace' }}>
        🔴 Active Rules
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: 'monospace' }}>
        <thead>
          <tr style={{ background: '#14141e' }}>
            {['ID','Source IP','Action','Switch','Source','Rate','Created','Delete'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#8888aa', borderBottom: '1px solid #2a2a3a' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.rule_id} style={{ borderBottom: '1px solid #1a1a2a' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#1a1a2a')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <td style={{ padding: '10px 12px', color: '#8888aa' }}>{rule.rule_id.slice(0, 8)}…</td>
              <td style={{ padding: '10px 12px', color: '#ff0066' }}>{rule.src_ip}</td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{ background: actionColor(rule.action) + '22', color: actionColor(rule.action), padding: '2px 8px', borderRadius: '4px' }}>
                  {rule.action}
                </span>
              </td>
              <td style={{ padding: '10px 12px', color: '#00aaff' }}>{rule.dpid}</td>
              <td style={{ padding: '10px 12px', color: '#8888aa' }}>{rule.source}</td>
              <td style={{ padding: '10px 12px', color: '#ffaa00' }}>{rule.rate_kbps || '-'}</td>
              <td style={{ padding: '10px 12px', color: '#8888aa', fontSize: '11px' }}>{new Date(rule.created_at).toLocaleString()}</td>
              <td style={{ padding: '10px 12px' }}>
                <button onClick={() => handleDelete(rule.rule_id)} style={{
                  background: '#ff006622', border: '1px solid #ff0066', borderRadius: '4px',
                  color: '#ff0066', padding: '4px 10px', cursor: 'pointer', fontSize: '11px',
                }}>🗑 Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RulesTable;