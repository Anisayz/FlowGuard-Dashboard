import React from 'react';
import { deleteRule } from '../services/api';

interface Rule {
  rule_id:    string;
  src_ip:     string;
  action:     string;
  dpid:       string;
  source:     string;
  rate_kbps?: number | null;
  created_at: string;
  active:     boolean;       
  deleted_at?: string | null;  
}

interface RulesTableProps { rules: Rule[]; onDelete: () => void; }

const actionColor = (a: string) =>
  a === 'block' ? '#ff0066' : a === 'allow' ? '#00ff88' : '#ffaa00';

const actionLabel = (a: string) =>
  ({ block: 'Bloquer', allow: 'Autoriser', ratelimit: 'Limiter' } as Record<string, string>)[a] ?? a;

const RulesTable: React.FC<RulesTableProps> = ({ rules, onDelete }) => {
  const handleDelete = async (ruleId: string) => {
    if (window.confirm('Supprimer cette règle ?')) {
      try { await deleteRule(ruleId); onDelete(); }
      catch { alert('Erreur lors de la suppression'); }
    }
  };

  if (rules.length === 0)
    return <p style={{ color: '#8888aa', textAlign: 'center', padding: '40px', fontFamily: 'monospace' }}>Aucune règle active.</p>;

  return (
    <div style={{ background: 'linear-gradient(135deg, #1e1e2a, #14141e)', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden' }}>
      <h3 style={{ color: '#00ff88', padding: '16px 20px', margin: 0, borderBottom: '1px solid #2a2a3a', fontFamily: 'monospace' }}>
        🔴 Règles actives
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: 'monospace' }}>
        <thead>
          <tr style={{ background: '#14141e' }}>
            {['ID', 'IP source', 'Action', 'Commut.', 'Origine', 'Débit', 'Créée', 'Suppr.'].map(h => (
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
                  {actionLabel(rule.action)}
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
                }}>🗑 Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RulesTable;
