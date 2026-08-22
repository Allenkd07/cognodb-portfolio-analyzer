import { Select, InputNumber, Button, Typography, Space, Tag } from 'antd';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { formatCurrency } from '../lib/format';
import useThemeTokens from '../lib/useThemeTokens';

const { Text } = Typography;

function categoryTag(category, categoryColors) {
  const color = categoryColors[category] || (category?.startsWith('Sectoral') ? 'volcano' : 'default');
  return (
    <Tag color={color} style={{ marginInlineEnd: 0, fontSize: 11 }}>
      {category}
    </Tag>
  );
}

export default function PortfolioBuilder({ funds, rows, onChangeRow, onAddRow, onRemoveRow, disabled }) {
  const { tokens } = useThemeTokens();
  const total = rows.reduce((sum, r) => sum + (Number(r.investedAmount) || 0), 0);

  return (
    <div>
      <Text strong style={{ display: 'block', marginBottom: 8 }}>
        Build a hypothetical portfolio
      </Text>

      <Space orientation="vertical" style={{ width: '100%' }} size={12}>
        {rows.map((row, idx) => (
          <div key={idx} style={{ border: `1px solid ${tokens.colorBorder}`, borderRadius: 8, padding: 12, position: 'relative' }}>
            {rows.length > 1 && (
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                disabled={disabled}
                onClick={() => onRemoveRow(idx)}
                aria-label="Remove fund"
                style={{ position: 'absolute', top: 6, right: 6, zIndex: 1 }}
              />
            )}
            <Select
              size="large"
              style={{ width: '100%' }}
              placeholder="Select a fund…"
              value={row.fundCode || undefined}
              disabled={disabled}
              onChange={(value) => onChangeRow(idx, { ...row, fundCode: value })}
              showSearch
              optionFilterProp="label"
              listHeight={320}
              options={funds.map((f) => ({ value: f.code, label: f.name, category: f.category, name: f.name }))}
              optionRender={(option) => (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '2px 0' }}>
                  <span style={{ whiteSpace: 'normal', lineHeight: 1.3 }}>{option.data.name}</span>
                  {categoryTag(option.data.category, tokens.categoryTagColors)}
                </div>
              )}
            />
            <InputNumber
              size="large"
              style={{ width: '100%', marginTop: 8 }}
              min={0}
              placeholder="Amount (₹)"
              disabled={disabled}
              value={row.investedAmount === '' ? null : row.investedAmount}
              onChange={(value) => onChangeRow(idx, { ...row, investedAmount: value ?? '' })}
            />
          </div>
        ))}
      </Space>

      <Button type="link" icon={<PlusOutlined />} disabled={disabled} onClick={onAddRow} style={{ paddingLeft: 0, marginTop: 10 }}>
        Add another fund
      </Button>

      {total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 10, borderTop: `1px solid ${tokens.colorBorderSecondary}` }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Total entered</Text>
          <Text strong className="tabular" style={{ fontSize: 13 }}>{formatCurrency(total)}</Text>
        </div>
      )}
    </div>
  );
}
