import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Server, Shield, Network, Brain,
  Activity, Zap, RefreshCw,
  ChevronDown, ChevronUp, CheckCircle,
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

interface Switch   { dpid: string; n_tables?: number; capabilities?: number; }
interface MacEntry { dpid: string; mac: string; port: number; }

interface SdnInfo {
  api_endpoint: string; rest_api: string;
  protocol: string; version: string; architecture: string;
}

interface EngineInfo {
  api_endpoint: string; actions: string[];
  source_types: string[]; storage: string; integration: string;
}

interface MlDetection {
  time: string; src_ip: string; attack_type: string;
  confidence: string; action: string; action_color: string;
}

interface MlStat {
  count: number; pct: number; color: string;
}

interface MlStatus {
  status: string; algorithm: string; input_features: string;
  output_classes: string[]; training_data: string;
  accuracy: number; last_trained: string; inference_time: string;
  confidence: number; flows_analyzed: number;
  stats: Record<string, MlStat>;
  recent_detections: MlDetection[];
}

const InfrastructureDetails: React.FC = () => {
  const [health,     setHealth]     = useState<any>({});
  const [switches,   setSwitches]   = useState<Switch[]>([]);
  const [macTable,   setMacTable]   = useState<MacEntry[]>([]);
  const [rules,      setRules]      = useState<any[]>([]);
  const [sdnInfo,    setSdnInfo]    = useState<SdnInfo | null>(null);
  const [engineInfo, setEngineInfo] = useState<EngineInfo | null>(null);
  const [mlStatus,   setMlStatus]   = useState<MlStatus | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const [expanded,   setExpanded]   = useState<Record<string, boolean>>({
    sdn: true, switches: true, engine: true, ml: true,
  });

  const fetchData = async () => {
    try {
      const [
        healthRes, switchesRes, macRes, rulesRes,
        sdnRes, engineRes, mlRes,
      ] = await Promise.all([
        axios.get(`${API_BASE}/health`),
        axios.get(`${API_BASE}/switches`),
        axios.get(`${API_BASE}/mactable`),
        axios.get(`${API_BASE}/rules`),
        axios.get(`${API_BASE}/sdn/info`),
        axios.get(`${API_BASE}/engine/info`),
        axios.get(`${API_BASE}/ml/status`),
      ]);
      setHealth(healthRes.data);
      setSwitches(switchesRes.data);
      setMacTable(macRes.data);
      setRules(rulesRes.data);
      setSdnInfo(sdnRes.data);
      setEngineInfo(engineRes.data);
      setMlStatus(mlRes.data);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const sectionStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1e1e2a, #14141e)',
    border: '1px solid #2a2a35', borderRadius: '12px',
    marginBottom: '20px', overflow: 'hidden', fontFamily: 'monospace',
  };

  const sectionHeader = (
    key: string, icon: React.ReactNode,
    title: string, status: string, statusOk: boolean
  ) => (
    <div onClick={() => toggle(key)} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px', cursor: 'pointer',
      borderBottom: expanded[key] ? '1px solid #2a2a35' : 'none',
      background: 'rgba(0,0,0,0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {icon}
        <span style={{ color: '#e0e0ff', fontWeight: 'bold', fontSize: '15px' }}>{title}</span>
        <span style={{
          background: statusOk ? 'rgba(0,255,136,0.1)' : 'rgba(255,0,102,0.1)',
          border: `1px solid ${statusOk ? '#00ff8866' : '#ff006666'}`,
          color: statusOk ? '#00ff88' : '#ff0066',
          borderRadius: '6px', padding: '2px 10px', fontSize: '11px',
        }}>
          {statusOk ? '● ONLINE' : '● OFFLINE'} — {status}
        </span>
      </div>
      <span style={{ color: '#8888aa' }}>
        {expanded[key] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </span>
    </div>
  );

  const row = (label: string, value: React.ReactNode, valueColor = '#e0e0ff') => (
    <tr style={{ borderBottom: '1px solid #1a1a2a' }}>
      <td style={{ padding: '9px 16px', color: '#8888aa', width: '35%', fontSize: '13px' }}>{label}</td>
      <td style={{ padding: '9px 16px', color: valueColor, fontSize: '13px' }}>{value}</td>
    </tr>
  );

  const badge = (text: string, color: string) => (
    <span style={{
      background: color + '22', border: `1px solid ${color}66`,
      color, borderRadius: '4px', padding: '2px 8px',
      fontSize: '11px', marginRight: '6px',
    }}>{text}</span>
  );

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', color: '#00ff88', fontFamily: 'monospace' }}>
      <div style={{ fontSize: '36px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
      <p style={{ marginTop: '12px', color: '#8888aa' }}>Loading infrastructure...</p>
    </div>
  );

  const activeRules = rules.filter((r) => !r.deleted_at);
  const statLabels: Record<string, string> = {
    normal: 'Normal Traffic', ddos: 'DDoS Detected',
    port_scan: 'Port Scan', brute_force: 'Brute Force',
  };

  return (
    <div style={{ fontFamily: 'monospace', color: '#e0e0ff' }}>

      {/* Page Header */}
      <div style={{ ...sectionStyle, padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ color: '#00ff88', margin: '0 0 4px', fontSize: '22px' }}>🏗️ Infrastructure Details</h2>
          <p style={{ color: '#8888aa', margin: 0, fontSize: '12px' }}>
            Admin view — full system visibility • Last update: {lastUpdate}
          </p>
        </div>
        <button onClick={fetchData} style={{
          background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)',
          color: '#00ff88', borderRadius: '8px', padding: '8px 16px',
          cursor: 'pointer', fontFamily: 'monospace', fontSize: '13px',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── 1. SDN CONTROLLER ─────────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        {sectionHeader('sdn', <Server size={18} color="#00ff88" />, 'SDN Controller (Ryu)', health.ryu || 'unknown', health.controller === 'healthy')}
        {expanded['sdn'] && sdnInfo && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
              {[
                { icon: <Zap size={20} color="#00ff88" />,      label: 'Status',          value: health.controller || '-',      color: '#00ff88' },
                { icon: <Activity size={20} color="#ffaa00" />,  label: 'Uptime',          value: health.uptime || '-',           color: '#ffaa00' },
                { icon: <Network size={20} color="#00aaff" />,   label: 'Flows Installed', value: health.flows_installed ?? '-',  color: '#00aaff' },
              ].map(({ icon, label, value, color }) => (
                <div key={label} style={{
                  background: '#14141e', border: '1px solid #2a2a35',
                  borderRadius: '8px', padding: '14px', textAlign: 'center',
                }}>
                  <div style={{ marginBottom: '6px' }}>{icon}</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color }}>{value}</div>
                  <div style={{ color: '#8888aa', fontSize: '11px', marginTop: '4px' }}>{label}</div>
                </div>
              ))}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {row('API Endpoint',   sdnInfo.api_endpoint,                        '#8888aa')}
                {row('REST API',       sdnInfo.rest_api,                            '#8888aa')}
                {row('Protocol',       badge(sdnInfo.protocol,  '#00aaff')          )}
                {row('Version',        badge(sdnInfo.version,   '#00ff88')          )}
                {row('Architecture',   sdnInfo.architecture,                        '#8888aa')}
                {row('Switches Mgmt',  `${switches.length} switches connected`,     '#00ff88')}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 2. SWITCHES ───────────────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        {sectionHeader('switches', <Network size={18} color="#00aaff" />, `Switches (${switches.length} connected)`, `${switches.length} active`, switches.length > 0)}
        {expanded['switches'] && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
              {switches.map((sw) => {
                const swMac   = macTable.filter((m) => m.dpid === sw.dpid);
                const swRules = activeRules.filter((r) => r.dpid === sw.dpid);
                return (
                  <div key={sw.dpid} style={{
                    background: '#14141e', border: '1px solid rgba(0,170,255,0.3)',
                    borderRadius: '10px', padding: '16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '24px' }}>🔀</span>
                      <div>
                        <div style={{ color: '#00aaff', fontWeight: 'bold', fontSize: '14px' }}>{sw.dpid}</div>
                        <div style={{ color: '#8888aa', fontSize: '11px' }}>OpenFlow Switch</div>
                      </div>
                      <span style={{ marginLeft: 'auto' }}><CheckCircle size={16} color="#00ff88" /></span>
                    </div>
                    <div style={{ fontSize: '12px' }}>
                      {[
                        { label: 'MAC Entries',  value: swMac.length,          color: '#ffaa00' },
                        { label: 'Active Rules', value: swRules.length,         color: '#ff0066' },
                        { label: 'Tables',       value: sw.n_tables ?? 254,     color: '#8888aa' },
                        { label: 'Capabilities', value: sw.capabilities ?? 79,  color: '#8888aa' },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #1a1a2a' }}>
                          <span style={{ color: '#8888aa' }}>{label}</span>
                          <span style={{ color, fontWeight: 'bold' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                    {swMac.length > 0 && (
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ color: '#8888aa', fontSize: '11px', marginBottom: '4px' }}>MAC Table:</div>
                        {swMac.map((m, i) => (
                          <div key={i} style={{
                            background: '#0a0a12', borderRadius: '4px',
                            padding: '4px 8px', marginBottom: '3px', fontSize: '11px',
                            display: 'flex', justifyContent: 'space-between',
                          }}>
                            <span style={{ color: '#ffaa00' }}>{m.mac}</span>
                            <span style={{ color: '#8888aa' }}>port {m.port}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. MITIGATION ENGINE ──────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        {sectionHeader('engine', <Shield size={18} color="#ff0066" />, 'Mitigation Engine', health.mitigation_engine || 'unknown', health.mitigation_engine === 'healthy')}
        {expanded['engine'] && engineInfo && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
              {[
                { label: 'Active Rules',   value: activeRules.length,                                              color: '#00ff88' },
                { label: 'Auto-mitigated', value: activeRules.filter(r => r.source === 'mitigation_engine').length, color: '#ff0066' },
                { label: 'Manual Rules',   value: activeRules.filter(r => r.source === 'manual').length,            color: '#ffaa00' },
                { label: 'Total History',  value: rules.length,                                                     color: '#00aaff' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: '#14141e', border: '1px solid #2a2a35', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color }}>{value}</div>
                  <div style={{ color: '#8888aa', fontSize: '11px', marginTop: '4px' }}>{label}</div>
                </div>
              ))}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {row('Status',          badge(health.mitigation_engine || '-', '#00ff88'))}
                {row('API Endpoint',    engineInfo.api_endpoint,                                                   '#8888aa')}
                {row('Rule Actions',    <>{engineInfo.actions.map(a => badge(a, a === 'block' ? '#ff0066' : a === 'allow' ? '#00ff88' : '#ffaa00'))}</>)}
                {row('Source Types',    <>{engineInfo.source_types.map(s => badge(s, s === 'manual' ? '#ffaa00' : '#ff0066'))}</>)}
                {row('History Storage', engineInfo.storage,                                                        '#8888aa')}
                {row('Uptime',          health.uptime || '-',                                                      '#ffaa00')}
                {row('Integration',     engineInfo.integration,                                                    '#8888aa')}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 4. MACHINE LEARNING ───────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        {sectionHeader('ml', <Brain size={18} color="#aa44ff" />, 'Machine Learning Module', mlStatus?.status || 'unknown', mlStatus?.status === 'active')}
        {expanded['ml'] && mlStatus && (
          <div style={{ padding: '20px' }}>

            {/* Banner */}
            <div style={{
              background: 'rgba(170,68,255,0.08)', border: '1px solid rgba(170,68,255,0.3)',
              borderRadius: '8px', padding: '12px 16px', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px',
            }}>
              <Brain size={16} color="#aa44ff" />
              <span style={{ color: '#aa44ff' }}>
                ML Module is {mlStatus.status} — {mlStatus.flows_analyzed.toLocaleString()} flows analyzed
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              {/* Model Info — depuis API */}
              <div>
                <h4 style={{ color: '#aa44ff', margin: '0 0 12px', fontSize: '13px' }}>🧠 Model Configuration</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {row('Algorithm',      badge(mlStatus.algorithm, '#aa44ff'))}
                    {row('Input Features', mlStatus.input_features,       '#8888aa')}
                    {row('Output',         <>{mlStatus.output_classes.map(c => badge(c, c === 'Normal' ? '#00ff88' : c === 'DDoS' ? '#ff0066' : '#ffaa00'))}</>)}
                    {row('Training Data',  mlStatus.training_data,        '#8888aa')}
                    {row('Accuracy',       `${mlStatus.accuracy}%`,       '#00ff88')}
                    {row('Last Trained',   mlStatus.last_trained,         '#8888aa')}
                    {row('Inference',      mlStatus.inference_time,       '#00aaff')}
                  </tbody>
                </table>
              </div>

              {/* Live Stats — depuis API */}
              <div>
                <h4 style={{ color: '#aa44ff', margin: '0 0 12px', fontSize: '13px' }}>📊 Live Detection Stats</h4>
                {Object.entries(mlStatus.stats).map(([key, stat]) => (
                  <div key={key} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                      <span style={{ color: '#8888aa' }}>{statLabels[key] || key}</span>
                      <span style={{ color: stat.color, fontWeight: 'bold' }}>{stat.count.toLocaleString()}</span>
                    </div>
                    <div style={{ background: '#14141e', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${stat.pct}%`, height: '100%', background: stat.color, borderRadius: '4px', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                ))}
                {/* Confidence */}
                <div style={{ background: '#14141e', border: '1px solid #2a2a35', borderRadius: '8px', padding: '12px', marginTop: '16px' }}>
                  <div style={{ color: '#8888aa', fontSize: '11px', marginBottom: '6px' }}>Model Confidence</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, background: '#0a0a12', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${mlStatus.confidence}%`, height: '100%', background: 'linear-gradient(90deg, #00ff88, #aa44ff)', borderRadius: '4px' }} />
                    </div>
                    <span style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '14px' }}>{mlStatus.confidence}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Detections — depuis API */}
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ color: '#aa44ff', margin: '0 0 12px', fontSize: '13px' }}>🚨 Recent ML Detections</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a2a35' }}>
                    {['Time', 'Source IP', 'Attack Type', 'Confidence', 'Action Taken'].map(h => (
                      <th key={h} style={{ padding: '8px', textAlign: 'left', color: '#8888aa' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mlStatus.recent_detections.map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2a' }}>
                      <td style={{ padding: '9px 8px', color: '#555577' }}>{d.time}</td>
                      <td style={{ padding: '9px 8px', color: '#ff0066' }}>{d.src_ip}</td>
                      <td style={{ padding: '9px 8px', color: '#ffaa00' }}>{d.attack_type}</td>
                      <td style={{ padding: '9px 8px', color: '#aa44ff', fontWeight: 'bold' }}>{d.confidence}</td>
                      <td style={{ padding: '9px 8px' }}>{badge(d.action, d.action_color)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfrastructureDetails;