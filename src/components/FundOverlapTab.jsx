'use client';

import { useState } from 'react';
import { Select, Tag, Empty, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';
import { formatPercent } from '../lib/format';
import useThemeTokens from '../lib/useThemeTokens';

const { Title, Text } = Typography;

function riskFor(pct) {
  if (pct >= 30) return { label: 'High overlap', color: 'red' };
  if (pct >= 15) return { label: 'Moderate overlap', color: 'orange' };
  return { label: 'Low overlap', color: 'green' };
}

function fundLabel(funds, code) {
  const f = funds.find((f) => f.code === code);
  return f ? f.name : code;
}

export default function FundOverlapTab({ overlaps, funds }) {
  const { tokens } = useThemeTokens();
  const [index, setIndex] = useState(0);

  if (overlaps.length === 0) {
    return <Empty description="No overlapping holdings between the funds you hold." />;
  }

  const selected = overlaps[index] || overlaps[0];
  const fund1Name = fundLabel(funds, selected.fund1);
  const fund2Name = fundLabel(funds, selected.fund2);
  const risk = riskFor(selected.overlapPct);

  const barData = selected.stocks
    .slice()
    .sort((a, b) => b.fund1Weight + b.fund2Weight - (a.fund1Weight + a.fund2Weight))
    .map((s) => ({
      name: s.name.length > 26 ? s.name.slice(0, 26) + '…' : s.name,
      fund1Weight: s.fund1Weight,
      fund2Weight: s.fund2Weight,
    }));

  return (
    <div>
      {overlaps.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
            Compare a different pair
          </Text>
          <Select
            style={{ width: '100%', maxWidth: 480 }}
            value={index}
            onChange={setIndex}
            options={overlaps.map((o, i) => ({
              value: i,
              label: `${fundLabel(funds, o.fund1)} × ${fundLabel(funds, o.fund2)} (${formatPercent(o.overlapPct)} overlap)`,
            }))}
          />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Tag color={risk.color} style={{ marginBottom: 8 }}>
            {risk.label.toUpperCase()}
          </Tag>
          <Title level={4} style={{ margin: 0 }}>
            {fund1Name} × {fund2Name}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {selected.sharedStockCount} shared holding{selected.sharedStockCount > 1 ? 's' : ''}
          </Text>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Title level={2} style={{ margin: 0, color: tokens.colorPrimary }}>
            {formatPercent(selected.overlapPct)}
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>average shared weight</Text>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(320, barData.length * 42)}>
        <BarChart layout="vertical" data={barData} margin={{ top: 8, right: 40, left: 8, bottom: 8 }} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke={tokens.colorBorderSecondary} />
          <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: tokens.colorTextTertiary }} />
          <YAxis type="category" dataKey="name" width={200} tick={{ fontSize: 12, fill: tokens.colorText }} />
          <Tooltip formatter={(v) => `${v}%`} />
          <Legend wrapperStyle={{ paddingTop: 8 }} />
          <Bar dataKey="fund1Weight" name={fund1Name} fill={tokens.overlapFund1} radius={[0, 3, 3, 0]} barSize={14}>
            <LabelList dataKey="fund1Weight" position="right" formatter={(v) => `${v}%`} style={{ fontSize: 11, fill: tokens.colorText }} />
          </Bar>
          <Bar dataKey="fund2Weight" name={fund2Name} fill={tokens.overlapFund2} radius={[0, 3, 3, 0]} barSize={14}>
            <LabelList dataKey="fund2Weight" position="right" formatter={(v) => `${v}%`} style={{ fontSize: 11, fill: tokens.colorText }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
