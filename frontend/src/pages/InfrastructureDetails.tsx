 
import React, { useState } from 'react';
import {
  Server, Shield, Network, Brain,
  Activity, Zap, RefreshCw,
  ChevronDown, ChevronUp, CheckCircle,
} from 'lucide-react';
import { useInfrastructure } from '../hooks/useInfrastructure';
import { uiHealth, uiRyuState } from '../i18n/formatters';

// ─── Local UI helpers ─────────────────────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #1e1e2a, #14141e)',
  border: '1px solid #2a2a35', borderRadius: '12px',
  marginBottom: '20px', overflow: 'hidden', fontFamily: 'monospace',
};

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

const statLabels: Record<string, string> = {
  normal: 'Trafic normal', ddos: 'DDoS détecté',
  port_scan: 'Scan de ports', brute_force: 'Force brute',
};

// ─── Component ────────────────────────────────────────────────────────────────

const InfrastructureDetails: React.FC = () => {
  const {
    health, switches, macTable, rules, activeRules,
    sdnInfo, engineInfo, mlStatus,
    loading, error, lastUpdate, refresh,
  } = useInfrastructure();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    sdn: true, switches: true, engine: true, ml: true,
  });

  const toggle = (key: string) =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const sectionHeader = (
    key: string, icon: React.ReactNode,
    title: string, status: string, statusOk: boolean,
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
          {statusOk ? '● EN LIGNE' : '● HORS LIGNE'} — {status}
        </span>
      </div>
      <span style={{ color: '#8888aa' }}>
        {expanded[key] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </span>
    </div>
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', color: '#00ff88', fontFamily: 'monospace' }}>
      <div style={{ fontSize: '36px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
      <p style={{ marginTop: '12px', color: '#8888aa' }}>Chargement de l'infrastructure…</p>
    </div>
  );

  // ── Error banner (non-blocking) ────────────────────────────────────────────
  const errorBanner = error && (
    <div style={{
      background: 'rgba(255,0,102,0.1)', border: '1px solid #ff006666',
      borderRadius: '8px', padding: '10px 16px', marginBottom: '16px',
      color: '#ff0066', fontSize: '13px', fontFamily: 'monospace',
    }}>
      ⚠ Erreur de chargement : {error}
    </div>
  );

  return (
    <div style={{ fontFamily: 'monospace', color: '#e0e0ff' }}>

      {errorBanner}

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div style={{ ...sectionStyle, padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ color: '#00ff88', margin: '0 0 4px', fontSize: '22px' }}>🏗️ Détails infrastructure</h2>
          <p style={{ color: '#8888aa', margin: 0, fontSize: '12px' }}>
            Vue administrateur • Visibilité système • Dernière mise à jour : {lastUpdate}
          </p>
        </div>
        <button onClick={refresh} style={{
          background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)',
          color: '#00ff88', borderRadius: '8px', padding: '8px 16px',
          cursor: 'pointer', fontFamily: 'monospace', fontSize: '13px',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* ── 1. SDN CONTROLLER ─────────────────────────────────────────────── */}
      <div style={sectionStyle}>
         {sectionHeader(
          'sdn',
          <Server size={18} color="#00ff88" />,
          'Contrôleur SDN (Ryu)',
          uiRyuState(health.ryu) || String(health.ryu ?? '—'),
          health.controller === 'healthy'
        )}
         {expanded['sdn'] && sdnInfo && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
              {[
                { icon: <Zap size={20} color="#00ff88" />,     label: 'Statut',           value: uiHealth(health.controller) || '-', color: '#00ff88' },
                { icon: <Activity size={20} color="#ffaa00" />, label: 'Disponibilité',    value: health.uptime || '-',               color: '#ffaa00' },
                { icon: <Network size={20} color="#00aaff" />,  label: 'Flux installés',   value: health.flows_installed ?? '-',      color: '#00aaff' },
              ].map(({ icon, label, value, color }) => (
                <div key={label} style={{ background: '#14141e', border: '1px solid #2a2a35', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ marginBottom: '6px' }}>{icon}</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color }}>{value}</div>
                  <div style={{ color: '#8888aa', fontSize: '11px', marginTop: '4px' }}>{label}</div>
                </div>
              ))}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {row('Point d\'accès API',   sdnInfo.api_endpoint, '#8888aa')}
                {row('API REST',            sdnInfo.rest_api,     '#8888aa')}
                {row('Protocole',           badge(String(sdnInfo.protocol), '#00aaff'))}
                {row('Version',             badge(String(sdnInfo.version),  '#00ff88'))}
                {row('Architecture',        sdnInfo.architecture, '#8888aa')}
                {row('Commutateurs',        `${switches.length} commutateur(s) connecté(s)`, '#00ff88')}
                {typeof sdnInfo.environment       === 'string' && row('Environnement',                sdnInfo.environment,       '#8888aa')}
                {typeof sdnInfo.openflow_version  === 'string' && row('Spécification OpenFlow',       sdnInfo.openflow_version,  '#00aaff')}
                {typeof sdnInfo.dataplane         === 'string' && row('Plan de données',              sdnInfo.dataplane,         '#8888aa')}
                {typeof sdnInfo.listen_address    === 'string' && row('Écoute REST',                  sdnInfo.listen_address,    '#8888aa')}
                {typeof sdnInfo.ofp_listen_port   === 'number' && row('Port OpenFlow',                sdnInfo.ofp_listen_port,   '#8888aa')}
                {typeof sdnInfo.topology_refresh_ms === 'number' && row('Rafraîchissement topologie (ms)', sdnInfo.topology_refresh_ms, '#8888aa')}
                {typeof sdnInfo.last_topology_sync  === 'string' && row('Dernière synchro topologie', sdnInfo.last_topology_sync,'#8888aa')}
                {typeof sdnInfo.datapath_count    === 'number' && row('Chemins de données',           sdnInfo.datapath_count,    '#00ff88')}
                {typeof sdnInfo.flow_table_buckets === 'number' && row('Compartiments table de flux', sdnInfo.flow_table_buckets,'#8888aa')}
                {Array.isArray(sdnInfo.loaded_apps) && sdnInfo.loaded_apps.length > 0 && row(
                  'Applications chargées',
                  <>{(sdnInfo.loaded_apps as string[]).map(a => <span key={a} style={{ display: 'inline-block', margin: '2px 4px 2px 0' }}>{badge(a, '#aa44ff')}</span>)}</>,
                )}
                {typeof sdnInfo.note === 'string' && row('Remarque', sdnInfo.note, '#555577')}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 2. SWITCHES ───────────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        {sectionHeader('switches', <Network size={18} color="#00aaff" />, `Commutateurs (${switches.length} connectés)`, `${switches.length} actif(s)`, switches.length > 0)}
        {expanded['switches'] && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
              {switches.map(sw => {
                const swMac   = macTable.filter(m => m.dpid === sw.dpid);
                const swRules = activeRules.filter(r => r.dpid === sw.dpid);
                return (
                  <div key={sw.dpid} style={{ background: '#14141e', border: '1px solid rgba(0,170,255,0.3)', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '24px' }}>🔀</span>
                      <div>
                        <div style={{ color: '#00aaff', fontWeight: 'bold', fontSize: '14px' }}>{sw.dpid}</div>
                        <div style={{ color: '#8888aa', fontSize: '11px' }}>Commutateur OpenFlow</div>
                      </div>
                      <span style={{ marginLeft: 'auto' }}><CheckCircle size={16} color="#00ff88" /></span>
                    </div>
                    <div style={{ fontSize: '12px' }}>
                      {[
                        { label: 'Entrées MAC',    value: swMac.length,        color: '#ffaa00' },
                        { label: 'Règles actives', value: swRules.length,      color: '#ff0066' },
                        { label: 'Tables',         value: sw.n_tables ?? 254,  color: '#8888aa' },
                        { label: 'Capacités',      value: sw.capabilities ?? 79, color: '#8888aa' },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #1a1a2a' }}>
                          <span style={{ color: '#8888aa' }}>{label}</span>
                          <span style={{ color, fontWeight: 'bold' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                    {swMac.length > 0 && (
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ color: '#8888aa', fontSize: '11px', marginBottom: '4px' }}>Table MAC :</div>
                        {swMac.map((m, i) => (
                          <div key={i} style={{ background: '#0a0a12', borderRadius: '4px', padding: '4px 8px', marginBottom: '3px', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
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

      {/* ── 3. MITIGATION ENGINE ──────────────────────────────────────────── */}
      <div style={sectionStyle}>
        {sectionHeader('engine', <Shield size={18} color="#ff0066" />, 'Moteur de mitigation', uiHealth(health.mitigation_engine) || '—', health.mitigation_engine === 'healthy')}
        {expanded['engine'] && engineInfo && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
              {[
                { label: 'Règles actives',   value: activeRules.length,                                               color: '#00ff88' },
                { label: 'Auto-mitigation',  value: activeRules.filter(r => r.source === 'mitigation_engine').length, color: '#ff0066' },
                { label: 'Règles manuelles', value: activeRules.filter(r => r.source === 'manual').length,            color: '#ffaa00' },
                { label: 'Total historique', value: rules.length,                                                      color: '#00aaff' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: '#14141e', border: '1px solid #2a2a35', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color }}>{value}</div>
                  <div style={{ color: '#8888aa', fontSize: '11px', marginTop: '4px' }}>{label}</div>
                </div>
              ))}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {row('Statut',          badge(uiHealth(health.mitigation_engine) || '-', '#00ff88'))}
                {row('Point d\'accès API',    engineInfo.api_endpoint, '#8888aa')}
                {row('Actions sur règles',   <>{engineInfo.actions.map(a => badge(a, a === 'block' ? '#ff0066' : a === 'allow' ? '#00ff88' : '#ffaa00'))}</>)}
                {row('Types de source',      <>{engineInfo.source_types.map(s => badge(s, s === 'manual' ? '#ffaa00' : '#ff0066'))}</>)}
                {row('Stockage historique',  engineInfo.storage,      '#8888aa')}
                {row('Disponibilité',        health.uptime || '-',    '#ffaa00')}
                {row('Intégration',          engineInfo.integration,  '#8888aa')}
                {typeof engineInfo.service_name             === 'string' && row('Service',                  engineInfo.service_name,            '#00ff88')}
                {typeof engineInfo.version                  === 'string' && row('Version',                  badge(String(engineInfo.version), '#00aaff'))}
                {typeof engineInfo.build                    === 'string' && row('Build',                    engineInfo.build,                   '#8888aa')}
                {typeof engineInfo.mode                     === 'string' && row('Mode',                     engineInfo.mode,                    '#8888aa')}
                {typeof engineInfo.workers                  === 'number' && row('Workers',                  engineInfo.workers,                 '#8888aa')}
                {typeof engineInfo.queue_capacity           === 'number' && row('Capacité de file',         engineInfo.queue_capacity,          '#8888aa')}
                {typeof engineInfo.rate_limit_default_kbps  === 'number' && row('Limite de débit (kbps)',   engineInfo.rate_limit_default_kbps, '#ffaa00')}
                {typeof engineInfo.max_active_rules         === 'number' && row('Règles actives max',       engineInfo.max_active_rules,        '#8888aa')}
                {typeof engineInfo.decision_latency_target_ms === 'number' && row('Latence cible (ms)',     engineInfo.decision_latency_target_ms, '#00ff88')}
                {typeof engineInfo.last_heartbeat           === 'string' && row('Dernier signal',           engineInfo.last_heartbeat,          '#8888aa')}
                {typeof engineInfo.last_deploy              === 'string' && row('Dernier déploiement',      engineInfo.last_deploy,             '#8888aa')}
                {typeof engineInfo.maintainer               === 'string' && row('Responsable',              engineInfo.maintainer,              '#555577')}
                {Array.isArray(engineInfo.features) && engineInfo.features.length > 0 && row(
                  'Fonctionnalités',
                  <>{(engineInfo.features as string[]).map(f => <span key={f} style={{ display: 'inline-block', margin: '2px 4px 2px 0' }}>{badge(f, '#00aaff')}</span>)}</>,
                )}
                {typeof engineInfo.endpoints === 'object' && engineInfo.endpoints !== null && !Array.isArray(engineInfo.endpoints) && row(
                  'Points d\'accès',
                  <div style={{ fontSize: '12px', lineHeight: 1.6 }}>
                    {Object.entries(engineInfo.endpoints as Record<string, string>).map(([k, v]) => (
                      <div key={k}><span style={{ color: '#8888aa' }}>{k}:</span> {v}</div>
                    ))}
                  </div>,
                )}
                {typeof engineInfo.note === 'string' && row('Remarque', engineInfo.note, '#555577')}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 4. MACHINE LEARNING ───────────────────────────────────────────── */}
      <div style={sectionStyle}>
        {sectionHeader('ml', <Brain size={18} color="#aa44ff" />, 'Module d \'apprentissage automatique', mlStatus?.status === 'active' ? 'actif' : (mlStatus?.status || '—'), mlStatus?.status === 'active')}
        {expanded['ml'] && mlStatus && (
          <div style={{ padding: '20px' }}>
            <div style={{
              background: 'rgba(170,68,255,0.08)', border: '1px solid rgba(170,68,255,0.3)',
              borderRadius: '8px', padding: '12px 16px', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px',
            }}>
              <Brain size={16} color="#aa44ff" />
              <span style={{ color: '#aa44ff' }}>
                Module ML : {mlStatus.status === 'active' ? 'actif' : mlStatus.status} — {mlStatus.flows_analyzed.toLocaleString()} flux analysés
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h4 style={{ color: '#aa44ff', margin: '0 0 12px', fontSize: '13px' }}>🧠 Configuration du modèle</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {row('Algorithme',             badge(mlStatus.algorithm, '#aa44ff'))}
                    {row('Entrées / caractéristiques', mlStatus.input_features, '#8888aa')}
                    {row('Sorties',                <>{mlStatus.output_classes.map(c => badge(c, c === 'Normal' ? '#00ff88' : c === 'DDoS' ? '#ff0066' : '#ffaa00'))}</>)}
                    {row('Données d\'entraînement', mlStatus.training_data,     '#8888aa')}
                    {row('Précision',              `${mlStatus.accuracy}%`,    '#00ff88')}
                    {row('Dernier entraînement',   mlStatus.last_trained,      '#8888aa')}
                    {row('Inférence',              mlStatus.inference_time,    '#00aaff')}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 style={{ color: '#aa44ff', margin: '0 0 12px', fontSize: '13px' }}>📊 Statistiques de détection en direct</h4>
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
                <div style={{ background: '#14141e', border: '1px solid #2a2a35', borderRadius: '8px', padding: '12px', marginTop: '16px' }}>
                  <div style={{ color: '#8888aa', fontSize: '11px', marginBottom: '6px' }}>Confiance du modèle</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, background: '#0a0a12', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${mlStatus.confidence}%`, height: '100%', background: 'linear-gradient(90deg, #00ff88, #aa44ff)', borderRadius: '4px' }} />
                    </div>
                    <span style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '14px' }}>{mlStatus.confidence}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <h4 style={{ color: '#aa44ff', margin: '0 0 12px', fontSize: '13px' }}>🚨 Détections ML récentes</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2a2a35' }}>
                    {['Heure', 'IP source', 'Type d\'attaque', 'Confiance', 'Action'].map(h => (
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