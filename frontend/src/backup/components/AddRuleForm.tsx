import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';
interface NewRule { src_ip: string; action: string; dpid: string; rate_kbps: string; }
interface AddRuleFormProps { availableDpids: string[]; onRuleAdded: () => void; }

const inputStyle: React.CSSProperties = {
  background: '#14141e', border: '1px solid #2a2a3a', borderRadius: '6px',
  color: '#e0e0ff', padding: '8px 12px', fontSize: '13px', fontFamily: 'monospace',
  outline: 'none',
};

const AddRuleForm: React.FC<AddRuleFormProps> = ({ availableDpids, onRuleAdded }) => {
  const [newRule, setNewRule] = useState<NewRule>({
    src_ip: '', action: 'block', dpid: availableDpids[0] || 's1', rate_kbps: '',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      src_ip: newRule.src_ip, action: newRule.action, dpid: newRule.dpid,
      rate_kbps: newRule.action === 'ratelimit' ? parseInt(newRule.rate_kbps) : undefined,
    };
    try {
      await axios.post(`${API_BASE}/rules`, payload);
      setNewRule({ src_ip: '', action: 'block', dpid: availableDpids[0] || 's1', rate_kbps: '' });
      onRuleAdded();
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e1e2a, #14141e)',
      border: '1px solid #2a2a3a', borderRadius: '12px',
      padding: '20px', marginBottom: '20px', fontFamily: 'monospace',
    }}>
      <h3 style={{ color: '#00ff88', marginBottom: '16px', margin: '0 0 16px' }}>➕ Add Firewall Rule</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ color: '#8888aa', fontSize: '11px' }}>Source IP</label>
          <input
            style={{ ...inputStyle, width: '160px' }}
            type="text" placeholder="e.g. 192.168.1.100"
            value={newRule.src_ip}
            onChange={(e) => setNewRule({ ...newRule, src_ip: e.target.value })}
            required
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ color: '#8888aa', fontSize: '11px' }}>Action</label>
          <select
            style={{ ...inputStyle, width: '130px' }}
            value={newRule.action}
            onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
          >
            <option value="block">🔴 Block</option>
            <option value="allow">🟢 Allow</option>
            <option value="ratelimit">🟡 Rate Limit</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ color: '#8888aa', fontSize: '11px' }}>Switch</label>
          <select
            style={{ ...inputStyle, width: '120px' }}
            value={newRule.dpid}
            onChange={(e) => setNewRule({ ...newRule, dpid: e.target.value })}
          >
            {availableDpids.map((dpid) => (
              <option key={dpid} value={dpid}>{dpid}</option>
            ))}
          </select>
        </div>
        {newRule.action === 'ratelimit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ color: '#8888aa', fontSize: '11px' }}>Rate (kbps)</label>
            <input
              style={{ ...inputStyle, width: '100px' }}
              type="number" placeholder="1000"
              value={newRule.rate_kbps}
              onChange={(e) => setNewRule({ ...newRule, rate_kbps: e.target.value })}
            />
          </div>
        )}
        <button type="submit" style={{
          background: 'linear-gradient(135deg, #00ff88, #00aa55)',
          border: 'none', borderRadius: '6px', color: '#0a0a12',
          padding: '9px 20px', fontWeight: 'bold', cursor: 'pointer',
          fontSize: '13px', fontFamily: 'monospace',
        }}>
          Add Rule
        </button>
      </form>
    </div>
  );
};

export default AddRuleForm;