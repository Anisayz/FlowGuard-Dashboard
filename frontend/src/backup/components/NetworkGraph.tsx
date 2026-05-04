import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Monitor, Laptop } from 'lucide-react';
import type { TopologyData, GraphData, GraphNode, GraphLink } from '../types';

// ── Transform ──────────────────────────────────────────────────────────────
export function transformToGraphData(topology: TopologyData): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const addedLinks = new Set<string>();

  topology.switches.forEach((sw) => {
    nodes.push({
      id: sw.dpid, type: 'switch',
      label: `SW-${sw.dpid.slice(-2)}`, dpid: sw.dpid,
    });
  });

  topology.hosts.forEach((host) => {
    const hostId = host.mac;
    nodes.push({
      id: hostId, type: 'host',
      label: host.ipv4[0] || host.mac.slice(-8),
      mac: host.mac, ipv4: host.ipv4, port: host.port,
    });
    const linkId = `${hostId}-${host.dpid}`;
    if (!addedLinks.has(linkId)) {
      links.push({ source: hostId, target: host.dpid, dstPort: host.port });
      addedLinks.add(linkId);
    }
  });

  topology.links.forEach((link) => {
    const linkId = [link.src_dpid, link.dst_dpid].sort().join('-');
    if (!addedLinks.has(linkId)) {
      links.push({
        source: link.src_dpid, target: link.dst_dpid,
        srcPort: link.src_port, dstPort: link.dst_port,
      });
      addedLinks.add(linkId);
    }
  });

  return { nodes, links };
}

// ── NetworkGraph Component ─────────────────────────────────────────────────
interface NetworkGraphProps {
  data: GraphData;
  height?: number;       // hauteur personnalisable
  showLabels?: boolean;  // afficher les labels
  showLegend?: boolean;  // afficher la légende
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  data,
  height = 420,
  showLabels = true,
  showLegend = true,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const update = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (svgRef.current?.parentElement) {
          const rect = svgRef.current.parentElement.getBoundingClientRect();
          setDimensions({ width: rect.width || 600, height });
        }
      }, 100);
    };
    update();
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('resize', update); clearTimeout(timeoutId); };
  }, [height]);

  const nodePositions = useCallback(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const switches = data.nodes.filter((n) => n.type === 'switch');
    const hosts    = data.nodes.filter((n) => n.type === 'host');
    const cx = dimensions.width  / 2;
    const cy = dimensions.height / 2;
    const swR  = Math.min(dimensions.width, dimensions.height) * 0.25;
    const hstR = swR * 1.7;

    switches.forEach((sw, i) => {
      const angle = (2 * Math.PI * i) / switches.length - Math.PI / 2;
      positions[sw.id] = {
        x: cx + swR * Math.cos(angle),
        y: cy + swR * Math.sin(angle),
      };
    });

    hosts.forEach((host, i) => {
      const connectedLink = data.links.find(
        (l) => l.source === host.id || l.target === host.id
      );
      const switchId = connectedLink
        ? connectedLink.source === host.id ? connectedLink.target : connectedLink.source
        : null;

      if (switchId && positions[switchId]) {
        const sp = positions[switchId];
        const angle  = Math.atan2(sp.y - cy, sp.x - cx);
        const offset = (i % 3 - 1) * 0.45;
        positions[host.id] = {
          x: cx + hstR * Math.cos(angle + offset),
          y: cy + hstR * Math.sin(angle + offset),
        };
      } else {
        const angle = (2 * Math.PI * i) / hosts.length;
        positions[host.id] = {
          x: cx + hstR * Math.cos(angle),
          y: cy + hstR * Math.sin(angle),
        };
      }
    });
    return positions;
  }, [data, dimensions]);

  const positions = nodePositions();

  return (
    <div>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} style={{ width: '100%' }}>
        <defs>
          <filter id="glow-green">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-blue">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Links */}
        {data.links.map((link, i) => {
          const src = positions[link.source];
          const tgt = positions[link.target];
          if (!src || !tgt) return null;
          const isHostLink = data.nodes.find((n) => n.id === link.source)?.type === 'host';
          return (
            <line key={i}
              x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
              stroke={isHostLink ? 'rgba(0,170,255,0.35)' : 'rgba(0,255,136,0.4)'}
              strokeWidth={isHostLink ? 1.5 : 2}
              strokeDasharray={isHostLink ? '5,4' : undefined}
            />
          );
        })}

        {/* Nodes */}
        {data.nodes.map((node) => {
          const pos = positions[node.id];
          if (!pos) return null;
          const isSwitch = node.type === 'switch';
          const r = isSwitch ? 26 : 20;
          const color = isSwitch ? '#00ff88' : '#00aaff';

          return (
            <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
              <circle r={r + 6} fill="none" stroke={color} strokeWidth={1} opacity={0.2} />
              <circle r={r}
                fill={isSwitch ? '#0a2a1a' : '#0a1a2a'}
                stroke={color} strokeWidth={2}
                filter={`url(#${isSwitch ? 'glow-green' : 'glow-blue'})`}
              />
              <foreignObject x={-r / 2} y={-r / 2} width={r} height={r}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                  {isSwitch
                    ? <Monitor size={r * 0.75} color={color} strokeWidth={1.5} />
                    : <Laptop  size={r * 0.75} color={color} strokeWidth={1.5} />
                  }
                </div>
              </foreignObject>
              {showLabels && (
                <text y={r + 16} textAnchor="middle"
                  fill={color} fontSize={11} fontFamily="monospace" fontWeight="bold">
                  {node.label}
                </text>
              )}
              {showLabels && node.type === 'host' && node.ipv4?.[0] && (
                <text y={r + 28} textAnchor="middle"
                  fill="rgba(136,136,170,0.8)" fontSize={9} fontFamily="monospace">
                  {node.ipv4[0]}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      {showLegend && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '24px',
          marginTop: '12px', paddingTop: '12px',
          borderTop: '1px solid rgba(42,42,53,0.8)',
          flexWrap: 'wrap',
        }}>
          {[
            { color: '#00ff88',              label: 'Switch',      shape: 'circle' },
            { color: '#00aaff',              label: 'Host',        shape: 'circle' },
            { color: 'rgba(0,255,136,0.4)',  label: 'Switch Link', shape: 'line'   },
            { color: 'rgba(0,170,255,0.4)',  label: 'Host Link',   shape: 'dashed' },
          ].map(({ color, label, shape }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {shape === 'circle' && <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />}
              {shape === 'line'   && <div style={{ width: 20, height: 2, background: color }} />}
              {shape === 'dashed' && <div style={{ width: 20, height: 0, borderTop: `2px dashed ${color}` }} />}
              <span style={{ color: '#8888aa', fontSize: '11px' }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NetworkGraph;