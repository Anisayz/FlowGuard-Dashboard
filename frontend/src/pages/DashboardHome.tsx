import React from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Network, AlertCircle } from 'lucide-react';
import NetworkGraph, { transformToGraphData } from '../components/NetworkGraph';
import { useDashboardStats } from '../hooks/useDashboardStats';
import type { TopologyData } from '../types';
import { uiAlertStatus, uiSeverity } from '../i18n/formatters';

interface DashboardHomeProps {
  topology:  TopologyData | null;
  isLoading: boolean;
  error?:    string;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ topology, isLoading, error }) => {
  const { stats, timeline, attackTypes, recentAlerts } = useDashboardStats();

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1e1e2a, #14141e)',
    border: '1px solid #2a2a35',
    borderRadius: '12px',
    padding: '20px',
  };

  const tooltipStyle = {
    contentStyle: {
      background: '#1e1e2a', border: '1px solid #2a2a35',
      color: '#e0e0ff', fontFamily: 'monospace', fontSize: '12px',
    },
  };

  const badgeStyle: React.CSSProperties = {
    background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)',
    color: '#00ff88', borderRadius: '6px', padding: '3px 10px', fontSize: '12px',
  };

  const graphData = topology ? transformToGraphData(topology) : null;

  return (
    <div style={{ background: '#0a0a12', minHeight: '100vh', color: '#e0e0ff', padding: '20px', fontFamily: 'monospace' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#00ff88', fontSize: '26px', margin: '0 0 4px' }}>
          🛡️ Tableau de bord sécurité SDN
        </h1>
        <p style={{ color: '#8888aa', margin: 0, fontSize: '13px' }}>
          Supervision réseau en temps réel • Détection des menaces • Mitigation automatisée
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Règles totales',     value: stats.totalRules,     color: '#00ff88', icon: '📋' },
          { label: 'Règles actives',    value: stats.activeRules,    color: '#ffaa00', icon: '🔴' },
          { label: 'Attaques bloquées', value: stats.blockedAttacks, color: '#ff0066', icon: '🛡️' },
          { label: 'Commutateurs actifs', value: stats.activeSwitches, color: '#00aaff', icon: '🔌' },
        ].map((card) => (
          <div key={card.label} style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: '28px' }}>{card.icon}</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: card.color, margin: '6px 0' }}>
              {card.value}
            </div>
            <div style={{ color: '#8888aa', fontSize: '12px' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={cardStyle}>
          <h3 style={{ color: '#00ff88', margin: '0 0 16px', fontSize: '14px' }}>📈 Chronologie des alertes</h3>
          {timeline.length === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8888aa', fontSize: '12px' }}>
              Chargement…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                <XAxis dataKey="time" stroke="#8888aa" tick={{ fontSize: 11 }} />
                <YAxis stroke="#8888aa" tick={{ fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="alerts"  stroke="#ff0066" fill="#ff006633" name="Alertes" />
                <Area type="monotone" dataKey="blocked" stroke="#00ff88" fill="#00ff8833" name="Bloquées" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={cardStyle}>
          <h3 style={{ color: '#00ff88', margin: '0 0 16px', fontSize: '14px' }}>🎯 Types d’attaque</h3>
          {attackTypes.length === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8888aa', fontSize: '12px' }}>
              Chargement…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={attackTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}>
                  {attackTypes.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Alerts */}
      <div style={{ ...cardStyle, marginBottom: '20px' }}>
        <h3 style={{ color: '#00ff88', margin: '0 0 16px', fontSize: '14px' }}>🚨 Alertes récentes</h3>
        {recentAlerts.length === 0 ? (
          <p style={{ color: '#8888aa', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>Aucune alerte pour le moment.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2a35' }}>
                {['Heure', 'IP source', 'Destination', 'Type d’attaque', 'Gravité', 'Statut'].map(h => (
                  <th key={h} style={{ padding: '8px', textAlign: 'left', color: '#8888aa', fontSize: '11px', letterSpacing: '1px' }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentAlerts.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1a1a2a' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,255,136,0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 8px', color: '#555577' }}>{row.time}</td>
                  <td style={{ padding: '10px 8px', color: '#ff0066', fontWeight: 'bold' }}>{row.src}</td>
                  <td style={{ padding: '10px 8px', color: '#8888aa' }}>{row.dst}</td>
                  <td style={{ padding: '10px 8px', color: '#ffaa00' }}>{row.type}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      background: row.sColor + '22', color: row.sColor,
                      border: `1px solid ${row.sColor}66`,
                      padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                    }}>{uiSeverity(row.severity)}</span>
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      background: '#00ff8822', color: '#00ff88',
                      border: '1px solid #00ff8866',
                      padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                    }}>{uiAlertStatus(row.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Network Topology */}
      <div style={{ ...cardStyle, ...(error ? { border: '1px solid rgba(255,0,102,0.5)' } : {}) }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ color: '#00ff88', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 4px', fontSize: '14px' }}>
              <Network size={16} color="#00ff88" /> Topologie réseau
            </h3>
            <p style={{ color: '#8888aa', fontSize: '12px', margin: 0 }}>
              Vue des commutateurs, liaisons et hôtes actifs
            </p>
          </div>
          {topology && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={badgeStyle}>🔀 {topology.switches.length} commutateurs</span>
              <span style={{ ...badgeStyle, background: 'rgba(0,170,255,0.1)', border: '1px solid rgba(0,170,255,0.3)', color: '#00aaff' }}>
                💻 {topology.hosts.length} hôtes
              </span>
              <span style={{ ...badgeStyle, background: 'rgba(255,170,0,0.1)', border: '1px solid rgba(255,170,0,0.3)', color: '#ffaa00' }}>
                🔗 {Math.floor(topology.links.length / 2)} liaisons
              </span>
            </div>
          )}
        </div>

        <div style={{
          background: 'radial-gradient(circle at center, #0a0a1a 0%, #050508 100%)',
          borderRadius: '10px', border: '1px solid rgba(0,255,136,0.15)',
          padding: '16px', minHeight: '460px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {error ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff0066', padding: '20px' }}>
              <AlertCircle size={16} />
              <span style={{ fontSize: '13px' }}>{error}</span>
            </div>
          ) : isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#00ff88' }}>
              <div style={{ fontSize: '32px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
              <p style={{ marginTop: '12px', color: '#8888aa', fontSize: '13px' }}>Chargement de la topologie…</p>
            </div>
          ) : graphData && graphData.nodes.length > 0 ? (
            <NetworkGraph data={graphData} height={460} showLabels showLegend />
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Network size={48} color="rgba(136,136,170,0.4)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: '#8888aa', fontSize: '13px' }}>Aucune donnée de topologie</p>
              <p style={{ color: '#555577', fontSize: '11px', marginTop: '4px' }}>
                Connectez le contrôleur Ryu ou utilisez le mode démo
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
