import { Avatar, Typography } from 'antd';
import { formatCurrency } from '../lib/format';
import useThemeTokens from '../lib/useThemeTokens';

const { Text } = Typography;

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Deterministic avatar colour per name so the same investor always gets the same colour.
function avatarColor(name, palette) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

export default function InvestorPicker({ investors, selected, onSelect, disabled }) {
  const { tokens } = useThemeTokens();

  return (
    <div>
      <Text strong style={{ display: 'block', marginBottom: 8 }}>
        Choose a sample investor
      </Text>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
        Each one already holds a small basket of funds. Pick one to see their true underlying
        exposure.
      </Text>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto', paddingRight: 2 }}>
        {investors.map((inv) => {
          const isSelected = selected === inv.name;
          return (
            <div
              key={inv.name}
              onClick={() => !disabled && onSelect(isSelected ? null : inv.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                border: `1px solid ${isSelected ? tokens.colorPrimary : tokens.colorBorder}`,
                background: isSelected ? tokens.selectedWash : tokens.colorBgContainer,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <Avatar size={36} style={{ background: avatarColor(inv.name, tokens.avatarPalette), flexShrink: 0, fontSize: 13 }}>
                {initials(inv.name)}
              </Avatar>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Text strong style={{ display: 'block', fontSize: 13.5, lineHeight: 1.3 }}>
                  {inv.name}
                </Text>
                <Text type="secondary" className="tabular" style={{ fontSize: 12 }}>
                  {inv.fundCount} fund{inv.fundCount > 1 ? 's' : ''} · {formatCurrency(inv.totalInvested)}
                </Text>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
