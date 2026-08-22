'use client';

import { Alert, Card, Row, Col, Statistic, Table, Typography, Space, Empty, Tabs } from 'antd';
import { WarningFilled } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { formatCurrency, formatPercent } from '../lib/format';
import useThemeTokens from '../lib/useThemeTokens';
import PortfolioGraph from './PortfolioGraph';
import FundOverlapTab from './FundOverlapTab';

const { Text } = Typography;

const SECTOR_CHART_LIMIT = 10;

function SectorTooltip({ active, payload }) {
  const { tokens } = useThemeTokens();
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: tokens.colorBgContainer,
        border: `1px solid ${tokens.colorBorder}`,
        borderRadius: 6,
        padding: '8px 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ fontWeight: 600, color: tokens.colorText }}>{d.sector}</div>
      <div style={{ color: tokens.colorTextSecondary, fontVariantNumeric: 'tabular-nums' }}>
        {formatCurrency(d.exposureAmount)} · {formatPercent(d.pct)}
      </div>
    </div>
  );
}

export default function ExposureResults({ data, funds }) {
  const { tokens } = useThemeTokens();
  const { totalInvested, totalLookThrough, exposure, sectors, overlaps = [], graph } = data;

  const holdingsColumns = [
    { title: 'ISIN', dataIndex: 'ticker', key: 'ticker', render: (v) => <Text code>{v}</Text> },
    { title: 'Company', dataIndex: 'name', key: 'name' },
    {
      title: 'Exposure',
      dataIndex: 'exposureAmount',
      key: 'exposureAmount',
      align: 'right',
      render: (v) => <span className="tabular">{formatCurrency(v)}</span>,
    },
    {
      title: '% of portfolio',
      dataIndex: 'pct',
      key: 'pct',
      align: 'right',
      render: (v) => <Text type="secondary" className="tabular">{formatPercent(v)}</Text>,
    },
  ];

  const sectorData = sectors.map((s) => ({
    ...s,
    pct: totalLookThrough > 0 ? (s.exposureAmount / totalLookThrough) * 100 : 0,
  }));
  const topSector = sectorData[0];
  const topHoldings = exposure.slice(0, 10).map((e, i) => ({
    key: e.ticker + i,
    ...e,
    pct: totalLookThrough > 0 ? (e.exposureAmount / totalLookThrough) * 100 : 0,
  }));

  const chartSectors = sectorData.slice(0, SECTOR_CHART_LIMIT);
  const restSectors = sectorData.slice(SECTOR_CHART_LIMIT);
  if (restSectors.length > 0) {
    chartSectors.push({
      sector: `Other sectors (${restSectors.length})`,
      exposureAmount: restSectors.reduce((sum, s) => sum + s.exposureAmount, 0),
      pct: restSectors.reduce((sum, s) => sum + s.pct, 0),
    });
  }
  const chartHeight = Math.max(240, chartSectors.length * 34);

  return (
    <Space orientation="vertical" size={20} style={{ width: '100%' }}>
      <Card
        title="Your portfolio, traced through every fund"
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            drag to rearrange · scroll to zoom
          </Text>
        }
      >
        {graph && graph.nodes.length > 0 ? (
          <PortfolioGraph graph={graph} height={540} />
        ) : (
          <Empty description="No graph data" />
        )}

        <Row gutter={24} style={{ marginTop: 20 }}>
          <Col xs={24} sm={8}>
            <Statistic title="Total invested" value={totalInvested} formatter={(v) => formatCurrency(v)} />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic title="Resolved look-through value" value={totalLookThrough} formatter={(v) => formatCurrency(v)} />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic title="Distinct stocks held" value={exposure.length} />
          </Col>
        </Row>
      </Card>

      {topSector && topSector.pct >= 25 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningFilled />}
          title="Concentration alert"
          description={
            <>
              <strong>{formatPercent(topSector.pct)}</strong> of your real, look-through exposure
              is concentrated in <strong>{topSector.sector}</strong> (visible in the graph above
              as the red cluster), even though it's spread across multiple funds.
            </>
          }
        />
      )}

      <Card>
        <Tabs
          defaultActiveKey="sectors"
          type="card"
          size="large"
          items={[
            {
              key: 'sectors',
              label: 'Sector breakdown',
              children: (
                <>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    NSE industry classification
                    {restSectors.length > 0 &&
                      ` · top ${SECTOR_CHART_LIMIT} shown, ${restSectors.length} more grouped below`}
                  </Text>
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    <BarChart data={chartSectors} layout="vertical" margin={{ top: 12, right: 56, bottom: 4, left: 4 }} barCategoryGap={10}>
                      <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke={tokens.colorBorderSecondary} />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => formatCurrency(v)}
                        tick={{ fill: tokens.colorTextTertiary, fontSize: 11 }}
                        axisLine={{ stroke: tokens.colorBorder }}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="sector"
                        width={190}
                        tick={{ fill: tokens.colorText, fontSize: 12 }}
                        axisLine={{ stroke: tokens.colorBorder }}
                        tickLine={false}
                      />
                      <Tooltip content={<SectorTooltip />} cursor={{ fill: tokens.cursorWash }} />
                      <Bar dataKey="exposureAmount" radius={[0, 4, 4, 0]} maxBarSize={20}>
                        {chartSectors.map((entry, idx) => (
                          <Cell
                            key={idx}
                            fill={entry.sector.startsWith('Other sectors') ? tokens.sectorPaletteOther : tokens.sectorPalette[idx % tokens.sectorPalette.length]}
                          />
                        ))}
                        <LabelList dataKey="pct" position="right" formatter={(v) => formatPercent(v)} style={{ fontSize: 11, fill: tokens.colorText, fontWeight: 500 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              ),
            },
            {
              key: 'holdings',
              label: 'Top holdings',
              children: (
                <>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                    identified by ISIN
                  </Text>
                  <Table columns={holdingsColumns} dataSource={topHoldings} pagination={false} size="middle" />
                </>
              ),
            },
            ...(overlaps.length > 0
              ? [
                  {
                    key: 'overlap',
                    label: 'Fund overlap',
                    children: <FundOverlapTab overlaps={overlaps} funds={funds} />,
                  },
                ]
              : []),
          ]}
        />
      </Card>
    </Space>
  );
}
