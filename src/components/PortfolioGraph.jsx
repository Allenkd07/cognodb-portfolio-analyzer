'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Spin } from 'antd';
import useThemeTokens from '../lib/useThemeTokens';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export default function PortfolioGraph({ graph, height = 460 }) {
  const { tokens } = useThemeTokens();
  const fgRef = useRef();
  const containerRef = useRef();
  const [size, setSize] = useState({ width: 0, height });

  const graphColors = tokens.graphNode;
  const legend = [
    { label: 'You', color: graphColors.investor },
    { label: 'Fund', color: graphColors.fund },
    { label: 'Stock', color: graphColors.stock },
    { label: 'Sector', color: graphColors.sector },
    { label: 'Concentrated sector', color: graphColors.sectorTop },
  ];

  function nodeColor(node) {
    if (node.label === 'Sector') return node.isTopSector ? graphColors.sectorTop : graphColors.sector;
    const key = node.label ? node.label.toLowerCase() : '';
    return graphColors[key] || tokens.colorTextTertiary;
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [height]);

  const data = useMemo(
    () => ({
      nodes: graph.nodes.map((n) => ({ ...n })),
      links: graph.links.map((l) => ({ ...l })),
    }),
    [graph]
  );

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        border: `1px solid ${tokens.colorBorder}`,
        borderRadius: 8,
        overflow: 'hidden',
        background: tokens.colorBgContainer,
        width: '100%',
        // Prevents layout collapse before the dynamically-imported graph mounts.
        minHeight: height,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 2,
          background: tokens.colorBgContainer,
          opacity: 0.94,
          borderRadius: 6,
          padding: '8px 10px',
          fontSize: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        }}
      >
        {legend.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
            <span style={{ color: tokens.colorTextSecondary }}>{item.label}</span>
          </div>
        ))}
      </div>

      {size.width === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height }}>
          <Spin />
        </div>
      )}

      {size.width > 0 && (
        <ForceGraph2D
          ref={fgRef}
          graphData={data}
          width={size.width}
          height={size.height}
          backgroundColor={tokens.colorBgContainer}
          nodeId="id"
          nodeLabel={(n) =>
            n.label === 'Sector'
              ? `${n.name}${n.isTopSector ? ' (largest exposure)' : ''}`
              : `${n.label}: ${n.name}`
          }
          nodeColor={nodeColor}
          nodeVal={(n) => n.val || 5}
          nodeRelSize={3}
          linkColor={() => tokens.linkMuted}
          linkWidth={(l) => (l.weightPct ? Math.max(0.5, Math.min(4, l.weightPct / 8)) : 0.6)}
          linkDirectionalParticles={0}
          cooldownTicks={100}
          onEngineStop={() => fgRef.current && fgRef.current.zoomToFit(400, 40)}
          enableNodeDrag
        />
      )}
    </div>
  );
}
