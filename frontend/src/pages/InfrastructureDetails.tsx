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

  // ── Derived values from health.ryu (object) ────────────────────────────────
  const ryuObj        = health?.ryu;                          // the nested object
  const ryuUp         = ryuObj?.ryu ?? '—';                   // "up" / "down"
  const ryuController = ryuObj?.controller ?? '—';            // "healthy" / ...
  const ryuUptime     = ryuObj?.uptime ?? '—';
  const ryuFlows      = ryuObj?.flows_installed ?? '—';

  return (
    <div style={{ fontFamily: 'monospace', color: '#e0e0ff' }}>

      {errorBanner}

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div style={{
        ...sectionStyle, padding: '20px',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '12px',
      }}>
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
         uiRyuState(ryuObj) || String(ryuUp),
          ryuController === 'healthy',
        )}
        {expanded['sdn'] && sdnInfo && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
              {[
                { icon: <Zap size={20} color="#00ff88" />,     label: 'Statut',         value: uiHealth(ryuController) || ryuController, color: '#00ff88' },
                { icon: <Activity size={20} color="#ffaa00" />, label: 'Disponibilité',  value: ryuUptime,                                color: '#ffaa00' },
                { icon: <Network size={20} color="#00aaff" />,  label: 'Flux installés', value: ryuFlows,                                 color: '#00aaff' },
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
                {row('Point d\'accès API',         sdnInfo.api_endpoint,  '#8888aa')}
                {row('API REST',                   sdnInfo.rest_api,      '#8888aa')}
                {row('Protocole',                  badge(String(sdnInfo.protocol), '#00aaff'))}
                {row('Version',                    badge(String(sdnInfo.version),  '#00ff88'))}
                {row('Architecture',               sdnInfo.architecture,  '#8888aa')}
                {row('Commutateurs',               `${switches.length} commutateur(s) connecté(s)`, '#00ff88')}
                {typeof sdnInfo.last_topology_sync === 'string' &&
                  row('Dernière synchro topologie', sdnInfo.last_topology_sync, '#8888aa')}
                {ryuObj?.switches_connected != null &&
                  row('Commutateurs (Ryu)',         String(ryuObj.switches_connected), '#00aaff')}
                {ryuObj?.mitigation_latency_ms != null &&
                  row('Latence mitigation',         `${ryuObj.mitigation_latency_ms} ms`, '#8888aa')}
                {ryuObj?.ml_feed_status &&
                  row('Flux ML',                   badge(ryuObj.ml_feed_status, ryuObj.ml_feed_status === 'connected' ? '#00ff88' : '#ff0066'))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 2. SWITCHES ───────────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        {sectionHeader(
          'switches',
          <Network size={18} color="#00aaff" />,
          `Commutateurs (${switches.length} connectés)`,
          `${switches.length} actif(s)`,
          switches.length > 0,
        )}
        {expanded['switches'] && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
              {switches.map(sw => {
                const swMac   = macTable.filter(m => m.dpid === sw.dpid);
                const swRules = activeRules.filter(r => r.dpid === sw.dpid);
                return (
                  <div key={sw.dpid} style={{
                    background: '#14141e', border: '1px solid rgba(0,170,255,0.3)',
                    borderRadius: '10px', padding: '16px',
                  }}>
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
                        { label: 'Entrées MAC',    value: swMac.length,      color: '#ffaa00' },
                        { label: 'Règles actives', value: swRules.length,    color: '#ff0066' },
                        { label: 'Adresse',        value: sw.address ?? '—', color: '#8888aa' },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{
                          display: 'flex', justifyContent: 'space-between',
                          padding: '5px 0', borderBottom: '1px solid #1a1a2a',
                        }}>
                          <span style={{ color: '#8888aa' }}>{label}</span>
                          <span style={{ color, fontWeight: 'bold' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                    {swMac.length > 0 && (
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ color: '#8888aa', fontSize: '11px', marginBottom: '4px' }}>Table MAC :</div>
                        {swMac.map((m, i) => (
                          <div key={i} style={{
                            background: '#0a0a12', borderRadius: '4px',
                            padding: '4px 8px', marginBottom: '3px',
                            fontSize: '11px', display: 'flex', justifyContent: 'space-between',
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

      {/* ── 3. MITIGATION ENGINE ──────────────────────────────────────────── */}
      <div style={sectionStyle}>
        {sectionHeader(
          'engine',
          <Shield size={18} color="#ff0066" />,
          'Moteur de mitigation',
          uiHealth(health?.mitigation?.status) || health?.mitigation?.status || '—',
          health?.mitigation?.status === 'ok',
        )}
        {expanded['engine'] && engineInfo && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
              {[
                { label: 'Règles actives',   value: activeRules.length,                                                color: '#00ff88' },
                { label: 'Auto-mitigation',  value: activeRules.filter(r => r.source === 'mitigation_engine').length,  color: '#ff0066' },
                { label: 'Règles manuelles', value: activeRules.filter(r => r.source === 'manual').length,             color: '#ffaa00' },
                { label: 'Total historique', value: rules.length,                                                       color: '#00aaff' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  background: '#14141e', border: '1px solid #2a2a35',
                  borderRadius: '8px', padding: '14px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color }}>{value}</div>
                  <div style={{ color: '#8888aa', fontSize: '11px', marginTop: '4px' }}>{label}</div>
                </div>
              ))}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {row('Statut',            badge(engineInfo.status ?? '-', engineInfo.status === 'ok' ? '#00ff88' : '#ff0066'))}
                {row('Point d\'accès API', engineInfo.api_endpoint, '#8888aa')}
                {row('Base de données',   badge(engineInfo.db ?? '-', engineInfo.db === 'ok' || engineInfo.db === 'connected' ? '#00ff88' : '#ff0066'))}
                {row('Cache dédup',       String(engineInfo.dedup_cache ?? '-'), '#8888aa')}
                {row('Alertes totales',   String(engineInfo.total_alerts ?? '-'), '#00aaff')}
                {row('Dernier signal',    engineInfo.last_heartbeat ?? '-', '#8888aa')}
                {Array.isArray(engineInfo.actions) && row(
                  'Actions sur règles',
                  <>{engineInfo.actions.map(a => badge(a, a === 'block' ? '#ff0066' : a === 'isolate' ? '#ffaa00' : '#00aaff'))}</>,
                )}
                {Array.isArray(engineInfo.source_types) && row(
                  'Types de source',
                  <>{engineInfo.source_types.map(s => badge(s, s === 'manual' ? '#ffaa00' : '#ff0066'))}</>,
                )}
                {typeof engineInfo.endpoints === 'object' && engineInfo.endpoints !== null && row(
                  'Points d\'accès',
                  <div style={{ fontSize: '12px', lineHeight: 1.6 }}>
                    {Object.entries(engineInfo.endpoints as Record<string, string>).map(([k, v]) => (
                      <div key={k}><span style={{ color: '#8888aa' }}>{k}:</span> {v}</div>
                    ))}
                  </div>,
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 4. MACHINE LEARNING ───────────────────────────────────────────── */}
      <div style={sectionStyle}>
        {sectionHeader(
          'ml',
          <Brain size={18} color="#aa44ff" />,
          "Module d'apprentissage automatique",
          mlStatus?.status === 'active' ? 'actif' : (mlStatus?.status ?? 'inaccessible'),
          mlStatus?.status === 'active',
        )}
        {expanded['ml'] && (
          <div style={{ padding: '20px' }}>
            {!mlStatus || mlStatus.status === 'unreachable' ? (
              <div style={{ color: '#ff0066', fontSize: '13px' }}>
                ⚠ Module ML inaccessible — aucune donnée disponible.
                {mlStatus?.error && (
                  <span style={{ color: '#8888aa', marginLeft: '8px' }}>({mlStatus.error})</span>
                )}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {row('Statut',                badge(mlStatus.status ?? '-', mlStatus.status === 'active' ? '#00ff88' : '#ff0066'))}
                  {row('Modèles chargés',        mlStatus.models_loaded ? '✔ Oui' : '✘ Non', mlStatus.models_loaded ? '#00ff88' : '#ff0066')}
                  {mlStatus.algorithm    && row('Algorithme',              badge(mlStatus.algorithm, '#aa44ff'))}
                  {mlStatus.anomaly_type && row('Détecteur d\'anomalies',  mlStatus.anomaly_type, '#8888aa')}
                  {mlStatus.n_features   != null && row('Caractéristiques d\'entrée', String(mlStatus.n_features), '#8888aa')}
                  {mlStatus.n_classes    != null && row('Nombre de classes',           String(mlStatus.n_classes),  '#8888aa')}
                  {Array.isArray(mlStatus.output_classes) && mlStatus.output_classes.length > 0 && row(
                    'Classes de sortie',
                    <>{mlStatus.output_classes.map(c => badge(c, c === 'BENIGN' ? '#00ff88' : c.includes('ATTACK') ? '#ff0066' : '#ffaa00'))}</>,
                  )}
                  {mlStatus.ae_threshold  != null && row('Seuil autoencodeur',   String(mlStatus.ae_threshold), '#8888aa')}
                  {mlStatus.rf_conf_high  != null && row('Confiance RF (haute)', String(mlStatus.rf_conf_high), '#8888aa')}
                  {mlStatus.verdict_actions && typeof mlStatus.verdict_actions === 'object' && row(
                    'Actions par verdict',
                    <div style={{ fontSize: '12px', lineHeight: 1.6 }}>
                      {Object.entries(mlStatus.verdict_actions as Record<string, string>).map(([verdict, action]) => (
                        <div key={verdict}>
                          <span style={{ color: '#8888aa' }}>{verdict}:</span>{' '}
                          {badge(action, verdict === 'ATTACK' ? '#ff0066' : verdict === 'BENIGN' ? '#00ff88' : '#ffaa00')}
                        </div>
                      ))}
                    </div>,
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default InfrastructureDetails;