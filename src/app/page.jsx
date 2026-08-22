'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Layout, Card, Button, Typography, Skeleton, Alert, Spin, Row, Col } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import InvestorPicker from '../components/InvestorPicker';
import PortfolioBuilder from '../components/PortfolioBuilder';
import ExposureResults from '../components/ExposureResults';
import EmptyStatePreview from '../components/EmptyStatePreview';
import useThemeTokens from '../lib/useThemeTokens';

const { Content } = Layout;
const { Text } = Typography;

const EMPTY_ROW = () => ({ fundCode: '', investedAmount: '' });

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body;
}

function HomePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') === 'custom' ? 'custom' : 'sample';
  const { mode: themeMode, tokens, toggleTheme } = useThemeTokens();

  function switchMode(next) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', next);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const [listStatus, setListStatus] = useState('loading');
  const [listError, setListError] = useState(null);
  const [investors, setInvestors] = useState([]);
  const [funds, setFunds] = useState([]);

  // Sample and custom modes keep independent selection + analysis state.
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [sampleAnalysis, setSampleAnalysis] = useState(null);
  const [sampleStatus, setSampleStatus] = useState('idle'); // idle | loading | error
  const [sampleError, setSampleError] = useState(null);

  const [customRows, setCustomRows] = useState([EMPTY_ROW()]);
  const [customAnalysis, setCustomAnalysis] = useState(null);
  const [customStatus, setCustomStatus] = useState('idle');
  const [customError, setCustomError] = useState(null);

  const analysis = mode === 'sample' ? sampleAnalysis : customAnalysis;
  const analyzeStatus = mode === 'sample' ? sampleStatus : customStatus;
  const analyzeError = mode === 'sample' ? sampleError : customError;

  useEffect(() => {
    let cancelled = false;
    async function loadLists() {
      try {
        const [investorsRes, fundsRes] = await Promise.all([
          fetchJson('/api/investors'),
          fetchJson('/api/funds'),
        ]);
        if (cancelled) return;
        setInvestors(investorsRes.investors);
        setFunds(fundsRes.funds);
        setListStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setListError(err.message);
        setListStatus('error');
      }
    }
    loadLists();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSelectInvestor(name) {
    setSelectedInvestor(name);
    setSampleAnalysis(null);
    if (!name) return;

    setSampleStatus('loading');
    setSampleError(null);
    try {
      const { holdings } = await fetchJson(`/api/investors/${encodeURIComponent(name)}`);
      const result = await fetchJson('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdings }),
      });
      setSampleAnalysis(result);
      setSampleStatus('idle');
    } catch (err) {
      setSampleError(err.message);
      setSampleStatus('error');
    }
  }

  function updateRow(idx, next) {
    setCustomRows((rows) => rows.map((r, i) => (i === idx ? next : r)));
  }
  function addRow() {
    setCustomRows((rows) => [...rows, EMPTY_ROW()]);
  }
  function removeRow(idx) {
    setCustomRows((rows) => rows.filter((_, i) => i !== idx));
  }

  async function handleAnalyzeCustom() {
    const holdings = customRows
      .filter((r) => r.fundCode && r.investedAmount)
      .map((r) => ({ fundCode: r.fundCode, investedAmount: Number(r.investedAmount) }));

    if (holdings.length === 0) {
      setCustomError('Add at least one fund with an amount before analyzing.');
      setCustomStatus('error');
      return;
    }

    setCustomStatus('loading');
    setCustomError(null);
    try {
      const result = await fetchJson('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdings }),
      });
      setCustomAnalysis(result);
      setCustomStatus('idle');
    } catch (err) {
      setCustomError(err.message);
      setCustomStatus('error');
    }
  }

  return (
    <Layout style={{ minHeight: '100vh', background: tokens.colorBgLayout }}>
      <Content style={{ maxWidth: 1680, margin: '0 auto', width: '100%', padding: '48px 32px 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 36 }}>
          <div style={{ maxWidth: 720 }}>
            <Text style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: tokens.colorTextTertiary, display: 'block', marginBottom: 14 }}>
              Portfolio look-through analysis
            </Text>
            <div style={{ fontSize: 34, fontWeight: 700, color: tokens.colorText, lineHeight: 1.2, marginBottom: 12, letterSpacing: '-0.01em' }}>
              See what you actually own.
            </div>
            <Text type="secondary" style={{ fontSize: 15, lineHeight: 1.6 }}>
              Every mutual fund you hold, including funds that hold other funds, resolved down
              to individual stocks and sectors, so hidden concentration stops hiding.
            </Text>
          </div>
          <Button
            shape="circle"
            icon={themeMode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
            aria-label={themeMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            style={{ flexShrink: 0 }}
          />
        </div>

        {listStatus === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '80px 0' }}>
            <Spin size="large" />
            <Text type="secondary">Loading data…</Text>
          </div>
        )}

        {listStatus === 'error' && (
          <Alert
            type="error"
            showIcon
            title="Can't reach the database"
            description={listError}
            action={
              <Button size="small" onClick={() => window.location.reload()}>
                Retry
              </Button>
            }
          />
        )}

        {listStatus === 'ready' && (
          <Row gutter={32}>
            <Col xs={24} lg={6}>
              <Card
                tabList={[
                  { key: 'sample', label: 'Sample investor' },
                  { key: 'custom', label: 'Build your own' },
                ]}
                activeTabKey={mode}
                onTabChange={switchMode}
              >
                {mode === 'sample' ? (
                  <InvestorPicker
                    investors={investors}
                    selected={selectedInvestor}
                    onSelect={handleSelectInvestor}
                    disabled={sampleStatus === 'loading'}
                  />
                ) : (
                  <div>
                    <PortfolioBuilder
                      funds={funds}
                      rows={customRows}
                      onChangeRow={updateRow}
                      onAddRow={addRow}
                      onRemoveRow={removeRow}
                      disabled={customStatus === 'loading'}
                    />
                    <Button
                      type="primary"
                      block
                      loading={customStatus === 'loading'}
                      onClick={handleAnalyzeCustom}
                      style={{ marginTop: 16 }}
                    >
                      Analyze portfolio
                    </Button>
                  </div>
                )}
              </Card>
            </Col>

            <Col xs={24} lg={18} style={{ marginTop: 24 }}>
              {analyzeStatus === 'loading' && (
                <Card>
                  <Skeleton active paragraph={{ rows: 6 }} />
                </Card>
              )}
              {analyzeStatus === 'error' && (
                <Alert type="error" showIcon title="Couldn't analyze this portfolio" description={analyzeError} />
              )}
              {analyzeStatus === 'idle' && !analysis && (
                <Card>
                  <EmptyStatePreview mode={mode} />
                </Card>
              )}
              {analyzeStatus === 'idle' && analysis && <ExposureResults data={analysis} funds={funds} />}
            </Col>
          </Row>
        )}
      </Content>
    </Layout>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageInner />
    </Suspense>
  );
}
