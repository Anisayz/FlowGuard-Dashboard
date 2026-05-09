import React, { useState } from 'react';
import AddRuleForm from './AddRuleForm';
import RulesTable from './RulesTable';
import RuleHistory from './RuleHistory';
import type { Rule } from '../types';
 

interface FirewallRulesProps {
  rules: Rule[];
  onRefresh: () => void;
  availableDpids: string[];
}

const FirewallRules: React.FC<FirewallRulesProps> = ({ rules, onRefresh, availableDpids }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
const activeRules  = rules.filter(r => r.active);
const historyRules = rules.filter(r => !r.active);
  console.log('rules total:', rules.length, '| active:', activeRules.length, '| history:', historyRules.length);
  console.log('sample rule:', rules[0]);
  
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
            <h2 style={{ color: '#00ff88', margin: '0 0 4px', fontSize: '20px' }}>Règles pare-feu</h2>
            <p style={{ color: '#8888aa', margin: 0, fontSize: '12px' }}>
              Gestion et suivi des règles de filtrage
            </p>
          </div>
          {/* Compteurs */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88', borderRadius: '6px', padding: '4px 12px', fontSize: '12px' }}>
              {activeRules.length} actives
            </span>
            <span style={{ background: 'rgba(136,136,170,0.1)', border: '1px solid rgba(136,136,170,0.3)', color: '#8888aa', borderRadius: '6px', padding: '4px 12px', fontSize: '12px' }}>
               {historyRules.length} historique
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
             Règles actives ({activeRules.length})
          </button>
          <button style={tabStyle('history')} onClick={() => setActiveTab('history')}>
             Historique ({historyRules.length})
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