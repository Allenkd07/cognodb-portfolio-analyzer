const neo4j = require('neo4j-driver');
const { getDriver } = require('./driver');

// Neo4j can return plain JS numbers or Integer objects depending on the value;
// this normalizes either into a JS number for the API layer.
function toNumber(value) {
  if (value && typeof value === 'object' && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  return value;
}

async function runRead(query, params = {}) {
  const session = getDriver().session({ defaultAccessMode: neo4j.session.READ });
  try {
    const result = await session.run(query, params);
    return result.records;
  } finally {
    await session.close();
  }
}

// Investor list with a quick summary per investor (fund count, total invested) so the
// picker can show meaningful context without an N+1 fetch per investor.
async function listInvestors() {
  const records = await runRead(
    `MATCH (i:Investor)-[h:HOLDS_UNITS_OF]->(f:Fund)
     RETURN i.name AS name, count(f) AS fundCount, sum(h.investedAmount) AS totalInvested
     ORDER BY name`
  );
  return records.map((r) => ({
    name: r.get('name'),
    fundCount: toNumber(r.get('fundCount')),
    totalInvested: toNumber(r.get('totalInvested')),
  }));
}

async function listFunds() {
  const records = await runRead(
    'MATCH (f:Fund) RETURN f.code AS code, f.name AS name, f.category AS category ORDER BY f.name'
  );
  return records.map((r) => ({ code: r.get('code'), name: r.get('name'), category: r.get('category') }));
}

// Direct fund holdings for a stored investor: [{ fundCode, fundName, investedAmount }]
async function getInvestorHoldings(investorName) {
  const records = await runRead(
    `MATCH (i:Investor {name: $investorName})-[h:HOLDS_UNITS_OF]->(f:Fund)
     RETURN f.code AS fundCode, f.name AS fundName, h.investedAmount AS investedAmount
     ORDER BY h.investedAmount DESC`,
    { investorName }
  );
  return records.map((r) => ({
    fundCode: r.get('fundCode'),
    fundName: r.get('fundName'),
    investedAmount: toNumber(r.get('investedAmount')),
  }));
}

// Core look-through query: given a set of fund holdings (each with an invested amount),
// resolve true stock-level exposure by traversing INVESTS_IN through any depth of
// fund-of-funds nesting, multiplying weightPct along the path.
// holdings: [{ fundCode, investedAmount }]
async function getLookThroughExposure(holdings) {
  const records = await runRead(
    `UNWIND $holdings AS h
     MATCH (f0:Fund {code: h.fundCode})
     MATCH p = (f0)-[:INVESTS_IN*1..5]->(stock:Stock)
     WITH h, stock, reduce(w = 1.0, rel IN relationships(p) | w * (rel.weightPct / 100.0)) AS pathWeight
     WITH stock, sum(h.investedAmount * pathWeight) AS exposureAmount
     RETURN stock.ticker AS ticker, stock.name AS name, exposureAmount
     ORDER BY exposureAmount DESC`,
    { holdings }
  );
  return records.map((r) => ({
    ticker: r.get('ticker'),
    name: r.get('name'),
    exposureAmount: toNumber(r.get('exposureAmount')),
  }));
}

// Same traversal, aggregated one hop further to Sector instead of Stock.
async function getSectorConcentration(holdings) {
  const records = await runRead(
    `UNWIND $holdings AS h
     MATCH (f0:Fund {code: h.fundCode})
     MATCH investPath = (f0)-[:INVESTS_IN*1..5]->(stock:Stock)
     MATCH (stock)-[:BELONGS_TO_SECTOR]->(sector:Sector)
     WITH h, sector, reduce(w = 1.0, rel IN relationships(investPath) | w * (rel.weightPct / 100.0)) AS pathWeight
     WITH sector, sum(h.investedAmount * pathWeight) AS exposureAmount
     RETURN sector.name AS sector, exposureAmount
     ORDER BY exposureAmount DESC`,
    { holdings }
  );
  return records.map((r) => ({
    sector: r.get('sector'),
    exposureAmount: toNumber(r.get('exposureAmount')),
  }));
}

// Top N look-through stock holdings, ranked by exposure amount.
async function getTopHoldings(holdings, limit = 10) {
  const records = await runRead(
    `UNWIND $holdings AS h
     MATCH (f0:Fund {code: h.fundCode})
     MATCH p = (f0)-[:INVESTS_IN*1..5]->(stock:Stock)
     WITH h, stock, reduce(w = 1.0, rel IN relationships(p) | w * (rel.weightPct / 100.0)) AS pathWeight
     WITH stock, sum(h.investedAmount * pathWeight) AS exposureAmount
     RETURN stock.ticker AS ticker, stock.name AS name, exposureAmount
     ORDER BY exposureAmount DESC
     LIMIT $limit`,
    { holdings, limit: neo4j.int(limit) }
  );
  return records.map((r) => ({
    ticker: r.get('ticker'),
    name: r.get('name'),
    exposureAmount: toNumber(r.get('exposureAmount')),
  }));
}

// Direct-holdings overlap between two funds: shared stocks and each fund's weight in them.
async function getFundOverlap(fundCode1, fundCode2) {
  const records = await runRead(
    `MATCH (f1:Fund {code: $fundCode1})-[r1:INVESTS_IN]->(stock:Stock)<-[r2:INVESTS_IN]-(f2:Fund {code: $fundCode2})
     RETURN stock.ticker AS ticker, stock.name AS name, r1.weightPct AS fund1Weight, r2.weightPct AS fund2Weight
     ORDER BY (r1.weightPct + r2.weightPct) DESC`,
    { fundCode1, fundCode2 }
  );
  return records.map((r) => ({
    ticker: r.get('ticker'),
    name: r.get('name'),
    fund1Weight: r.get('fund1Weight'),
    fund2Weight: r.get('fund2Weight'),
  }));
}

// Ranks other funds by shared direct holdings with a given fund.
async function getSimilarFunds(fundCode, limit = 5) {
  const records = await runRead(
    `MATCH (f1:Fund {code: $fundCode})-[r1:INVESTS_IN]->(stock:Stock)<-[r2:INVESTS_IN]-(f2:Fund)
     WHERE f1 <> f2
     WITH f2, sum(CASE WHEN r1.weightPct < r2.weightPct THEN r1.weightPct ELSE r2.weightPct END) AS overlapScore
     RETURN f2.code AS code, f2.name AS name, overlapScore
     ORDER BY overlapScore DESC
     LIMIT $limit`,
    { fundCode, limit: neo4j.int(limit) }
  );
  return records.map((r) => ({
    code: r.get('code'),
    name: r.get('name'),
    overlapScore: toNumber(r.get('overlapScore')),
  }));
}

// Raw subgraph reachable from a set of fund codes: every Fund->Fund and Fund->Stock
// edge on any INVESTS_IN path out of those funds, plus Stock->Sector edges for the
// stocks reached. Used to render the actual traversal as a node-link graph, separate
// from the aggregated exposure numbers the other queries compute.
async function getFundNetwork(fundCodes) {
  const edgeRecords = await runRead(
    `UNWIND $fundCodes AS code
     MATCH (f0:Fund {code: code})
     MATCH p = (f0)-[:INVESTS_IN*1..5]->(:Stock)
     UNWIND relationships(p) AS rel
     WITH DISTINCT startNode(rel) AS a, endNode(rel) AS b, rel.weightPct AS weightPct
     RETURN labels(a)[0] AS aLabel, coalesce(a.code, a.ticker) AS aId, a.name AS aName,
            labels(b)[0] AS bLabel, coalesce(b.code, b.ticker) AS bId, b.name AS bName,
            weightPct`,
    { fundCodes }
  );

  const sectorRecords = await runRead(
    `UNWIND $fundCodes AS code
     MATCH (f0:Fund {code: code})-[:INVESTS_IN*1..5]->(stock:Stock)-[:BELONGS_TO_SECTOR]->(sector:Sector)
     RETURN DISTINCT stock.ticker AS stockId, stock.name AS stockName, sector.name AS sectorName`,
    { fundCodes }
  );

  const edges = edgeRecords.map((r) => ({
    aLabel: r.get('aLabel'),
    aId: r.get('aId'),
    aName: r.get('aName'),
    bLabel: r.get('bLabel'),
    bId: r.get('bId'),
    bName: r.get('bName'),
    weightPct: r.get('weightPct'),
  }));

  const stockSectors = sectorRecords.map((r) => ({
    stockId: r.get('stockId'),
    stockName: r.get('stockName'),
    sectorName: r.get('sectorName'),
  }));

  return { edges, stockSectors };
}

module.exports = {
  listInvestors,
  listFunds,
  getInvestorHoldings,
  getLookThroughExposure,
  getSectorConcentration,
  getTopHoldings,
  getFundOverlap,
  getSimilarFunds,
  getFundNetwork,
};
