import { NextResponse } from 'next/server';
import {
  getLookThroughExposure,
  getSectorConcentration,
  getFundOverlap,
  getFundNetwork,
  listFunds,
} from '../../../lib/queries';

function pairs(items) {
  const result = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      result.push([items[i], items[j]]);
    }
  }
  return result;
}

const GRAPH_STOCK_LIMIT = 20;

function buildGraph({ holdings, network, exposure, topSectorName, fundNameByCode }) {
  const topStockIds = new Set(exposure.slice(0, GRAPH_STOCK_LIMIT).map((e) => e.ticker));

  const nodes = new Map();
  const links = [];

  const nodeId = (label, id) => `${label}:${id}`;

  function addNode(label, id, name, extra = {}) {
    const key = nodeId(label, id);
    if (!nodes.has(key)) {
      nodes.set(key, { id: key, label, refId: id, name, ...extra });
    }
    return key;
  }

  const investorKey = addNode('Investor', 'root', 'Your portfolio', { val: 14 });

  const totalInvested = holdings.reduce((sum, h) => sum + h.investedAmount, 0);
  for (const h of holdings) {
    const fundKey = addNode('Fund', h.fundCode, fundNameByCode.get(h.fundCode) || h.fundCode, { val: 8 });
    links.push({ source: investorKey, target: fundKey, weightPct: (h.investedAmount / totalInvested) * 100 });
  }

  for (const e of network.edges) {
    if (e.bLabel === 'Stock' && !topStockIds.has(e.bId)) continue;
    const aKey = addNode(e.aLabel, e.aId, e.aName || e.aId, { val: e.aLabel === 'Fund' ? 8 : 5 });
    const bKey = addNode(e.bLabel, e.bId, e.bName || e.bId, { val: e.bLabel === 'Fund' ? 8 : 5 });
    links.push({ source: aKey, target: bKey, weightPct: e.weightPct });
  }

  for (const s of network.stockSectors) {
    if (!topStockIds.has(s.stockId)) continue;
    const stockKey = addNode('Stock', s.stockId, s.stockName, { val: 5 });
    const sectorKey = addNode('Sector', s.sectorName, s.sectorName, {
      val: 6,
      isTopSector: s.sectorName === topSectorName,
    });
    links.push({ source: stockKey, target: sectorKey, weightPct: null });
  }

  return { nodes: [...nodes.values()], links };
}

function validateHoldings(holdings) {
  if (!Array.isArray(holdings) || holdings.length === 0) {
    return 'holdings must be a non-empty array';
  }
  for (const h of holdings) {
    if (typeof h.fundCode !== 'string' || !h.fundCode.trim()) {
      return 'each holding needs a fundCode';
    }
    if (typeof h.investedAmount !== 'number' || h.investedAmount <= 0) {
      return 'each holding needs a positive investedAmount';
    }
  }
  return null;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { holdings } = body;
  const validationError = validateHoldings(holdings);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const fundCodes = [...new Set(holdings.map((h) => h.fundCode))];
    const fundPairs = pairs(fundCodes);

    const [exposure, sectors, overlapResults, network, allFunds] = await Promise.all([
      getLookThroughExposure(holdings),
      getSectorConcentration(holdings),
      Promise.all(fundPairs.map(([a, b]) => getFundOverlap(a, b).then((stocks) => ({ fund1: a, fund2: b, stocks })))),
      getFundNetwork(fundCodes),
      listFunds(),
    ]);

    const totalInvested = holdings.reduce((sum, h) => sum + h.investedAmount, 0);
    const totalLookThrough = exposure.reduce((sum, e) => sum + e.exposureAmount, 0);

    const overlaps = overlapResults
      .filter((o) => o.stocks.length > 0)
      .map((o) => {
        const fund1SharedWeight = o.stocks.reduce((sum, s) => sum + s.fund1Weight, 0);
        const fund2SharedWeight = o.stocks.reduce((sum, s) => sum + s.fund2Weight, 0);
        return {
          fund1: o.fund1,
          fund2: o.fund2,
          sharedStockCount: o.stocks.length,
          fund1SharedWeight,
          fund2SharedWeight,
          overlapPct: (fund1SharedWeight + fund2SharedWeight) / 2,
          stocks: o.stocks,
        };
      })
      .sort((a, b) => b.overlapPct - a.overlapPct);

    const fundNameByCode = new Map(allFunds.map((f) => [f.code, f.name]));
    const graph = buildGraph({
      holdings,
      network,
      exposure,
      topSectorName: sectors[0] ? sectors[0].sector : null,
      fundNameByCode,
    });

    return NextResponse.json({
      totalInvested,
      totalLookThrough,
      exposure,
      sectors,
      overlaps,
      graph,
    });
  } catch (err) {
    console.error('POST /api/analyze failed:', err.message);
    return NextResponse.json(
      { error: 'Could not reach the database. Please try again in a moment.' },
      { status: 503 }
    );
  }
}
