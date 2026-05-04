import React, { useState } from 'react';
import AddRuleForm from './AddRuleForm';
import RulesTable from './RulesTable';
import RuleHistory from './RuleHistory';

interface Rule {
  rule_id: string;
  src_ip: string;
  action: string;
  dpid: string;
  source: string;
  rate_kbps?: number | null;
  created_at: string;
  deleted_at?: string | null;
  alert_id?: string | null;
}

interface FirewallRulesProps {
  rules: Rule[];
  onRefresh: () => void;
  availableDpids: string[];
}

const FirewallRules: React.FC<FirewallRulesProps> = ({ rules, onRefresh, availableDpids }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const activeRules  = rules.filter((r) => !r.deleted_at);
  const historyRules = rules.filter((r) =>  r.deleted_at);

  const tabStyle = (tab: 'active' | 'history'): React.CSSProperties => ({
    padding: '10px 24px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: '13px',
    background: activeTab === tab ? 'rgba(0,255,136,0.1)' : 'transparent',
    color: activeTab === tab ? '#00ff88' : '#8888aa',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid #00ff88' : '2px solid transparent',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ fontFamily: 'monospace' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1e2a, #14141e)',
        border: '1px solid #2a2a35', borderRadius: '12px',
        padding: '20px', marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ color: '#00ff88', margin: '0 0 4px', fontSize: '20px' }}>🛡️ Firewall Rules</h2>
            <p style={{ color: '#8888aa', margin: 0, fontSize: '12px' }}>
              Manage and monitor all firewall rules
            </p>
          </div>
          {/* Compteurs */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88', borderRadius: '6px', padding: '4px 12px', fontSize: '12px' }}>
              🟢 {activeRules.length} Active
            </span>
            <span style={{ background: 'rgba(136,136,170,0.1)', border: '1px solid rgba(136,136,170,0.3)', color: '#8888aa', borderRadius: '6px', padding: '4px 12px', fontSize: '12px' }}>
              📜 {historyRules.length} History
            </span>
          </div>
        </div>
      </div>

      {/* Add Rule Form — toujours visible */}
      <AddRuleForm availableDpids={availableDpids} onRuleAdded={onRefresh} />

      {/* Tabs */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1e2a, #14141e)',
        border: '1px solid #2a2a35', borderRadius: '12px',
        overflow: 'hidden',
      }}>
        {/* Tab Bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #2a2a35' }}>
          <button style={tabStyle('active')}  onClick={() => setActiveTab('active')}>
            🔴 Active Rules ({activeRules.length})
          </button>
          <button style={tabStyle('history')} onClick={() => setActiveTab('history')}>
            📜 Rule History ({historyRules.length})
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '20px' }}>
          {activeTab === 'active' ? (
            <RulesTable rules={activeRules} onDelete={onRefresh} />
          ) : (
            <RuleHistory rules={[...activeRules, ...historyRules]} />
          )}
        </div>
      </div>
    </div>
  );
};

export default FirewallRules;