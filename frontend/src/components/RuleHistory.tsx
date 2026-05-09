import React from 'react';
 
interface Rule {
  rule_id:     string;
  src_ip:      string;
  action:      string;
  dpid:        string;
  source:      string;
  created_at:  string;
  deleted_at?: string | null;
  alert_id?:   string | null;
  active:      boolean;  
}


interface RuleHistoryProps { rules: Rule[]; }

const RuleHistory: React.FC<RuleHistoryProps> = ({ rules }) => {
  if (rules.length === 0)
    return <p style={{ color: '#8888aa', textAlign: 'center', padding: '40px', fontFamily: 'monospace' }}>Aucun historique.</p>;

  console.log(rules)
  return (
    <div style={{ background: 'linear-gradient(135deg, #1e1e2a, #14141e)', border: '1px solid #2a2a3a', borderRadius: '12px', overflow: 'hidden' }}>
      <h3 style={{ color: '#00ff88', padding: '16px 20px', margin: 0, borderBottom: '1px solid #2a2a3a', fontFamily: 'monospace' }}>
         Historique des règles
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'monospace' }}>
        <thead>
          <tr style={{ background: '#14141e' }}>
            {['ID','IP source','Action','Commut.','Origine','Créée','Suppr.','ID alerte'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#8888aa', borderBottom: '1px solid #2a2a3a' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.rule_id} style={{ borderBottom: '1px solid #1a1a2a' }}>
              <td style={{ padding: '9px 12px', color: '#8888aa' }}>{rule.rule_id.slice(0, 8)}…</td>
              <td style={{ padding: '9px 12px', color: '#ff0066' }}>{rule.src_ip}</td>
              <td style={{ padding: '9px 12px', color: '#ffaa00' }}>{rule.action}</td>
              <td style={{ padding: '9px 12px', color: '#00aaff' }}>{rule.dpid}</td>
              <td style={{ padding: '9px 12px', color: '#8888aa' }}>{rule.source}</td>
              <td style={{ padding: '9px 12px', color: '#8888aa', fontSize: '11px' }}>{new Date(rule.created_at).toLocaleString()}</td>
              <td style={{ padding: '9px 12px', color: rule.deleted_at ? '#ff6666' : '#8888aa', fontSize: '11px' }}>
                {rule.deleted_at ? new Date(rule.deleted_at).toLocaleString() : '-'}
              </td>
              <td style={{ padding: '9px 12px', color: '#8888aa' }}>{rule.alert_id || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RuleHistory;