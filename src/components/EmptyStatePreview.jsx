import { Typography } from 'antd';
import useThemeTokens from '../lib/useThemeTokens';

const { Text } = Typography;

// Static, illustrative node-link diagram, not real data. Echoes the visual language of
// the real PortfolioGraph so the empty state previews what running an analysis produces.
function GraphPreview({ tokens }) {
  const investor = { x: 20, y: 100 };
  const funds = [
    { x: 100, y: 55 },
    { x: 100, y: 145 },
  ];
  const stocks = [
    { x: 195, y: 25 },
    { x: 195, y: 65 },
    { x: 195, y: 105 },
    { x: 195, y: 145 },
    { x: 195, y: 180 },
  ];
  const sectors = [
    { x: 285, y: 55 },
    { x: 285, y: 145 },
  ];

  const fundStockLinks = [
    [0, 0], [0, 1], [0, 2],
    [1, 2], [1, 3], [1, 4],
  ];
  const stockSectorLinks = [
    [0, 0], [1, 0], [2, 0],
    [2, 1], [3, 1], [4, 1],
  ];

  const nodeColors = tokens.graphNode;

  return (
    <svg viewBox="0 0 320 200" width="100%" height="180" style={{ maxWidth: 320 }} aria-hidden="true">
      {funds.map((f, i) => (
        <line key={`if${i}`} x1={investor.x} y1={investor.y} x2={f.x} y2={f.y} stroke={tokens.linkMuted} strokeWidth="1.5" />
      ))}
      {fundStockLinks.map(([fi, si], i) => (
        <line key={`fs${i}`} x1={funds[fi].x} y1={funds[fi].y} x2={stocks[si].x} y2={stocks[si].y} stroke={tokens.linkMuted} strokeWidth="1.2" />
      ))}
      {stockSectorLinks.map(([si, ci], i) => (
        <line key={`sc${i}`} x1={stocks[si].x} y1={stocks[si].y} x2={sectors[ci].x} y2={sectors[ci].y} stroke={tokens.linkMuted} strokeWidth="1.2" />
      ))}

      <circle cx={investor.x} cy={investor.y} r={9} fill={nodeColors.investor} opacity={0.85} />
      {funds.map((f, i) => (
        <circle key={`fn${i}`} cx={f.x} cy={f.y} r={6.5} fill={nodeColors.fund} opacity={0.8} />
      ))}
      {stocks.map((s, i) => (
        <circle key={`sn${i}`} cx={s.x} cy={s.y} r={4.5} fill={nodeColors.stock} opacity={0.75} />
      ))}
      {sectors.map((c, i) => (
        <circle key={`cn${i}`} cx={c.x} cy={c.y} r={5.5} fill={nodeColors.sector} opacity={0.75} />
      ))}
    </svg>
  );
}

const STEPS = [
  { n: 1, text: 'Pick a sample investor, or build a hypothetical portfolio yourself.' },
  { n: 2, text: 'Every fund is traced through any depth of fund-of-funds nesting.' },
  { n: 3, text: 'See your true stock and sector exposure, and where it hides.' },
];

export default function EmptyStatePreview({ mode }) {
  const { tokens } = useThemeTokens();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 32,
        flexWrap: 'wrap',
        padding: '28px 8px',
      }}
    >
      <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', flex: '1 1 280px' }}>
        <GraphPreview tokens={tokens} />
      </div>
      <div style={{ flex: '1 1 320px', minWidth: 260 }}>
        <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 4 }}>
          {mode === 'sample'
            ? 'Pick an investor on the left to trace their portfolio.'
            : 'Add a few funds on the left to trace your portfolio.'}
        </Text>
        <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
          The graph above is illustrative. Yours will be built from real fund holdings the
          moment you run an analysis.
        </Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span
                style={{
                  flexShrink: 0,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: tokens.colorBorderSecondary,
                  color: tokens.colorTextSecondary,
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {s.n}
              </span>
              <Text style={{ fontSize: 13, lineHeight: 1.5 }}>{s.text}</Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
