const { getDriver, closeDriver } = require('../lib/driver');
const { SECTORS, STOCKS, FUNDS, INVESTORS } = require('./data');

async function run(session, query, params = {}) {
  const result = await session.run(query, params);
  return result;
}

async function seed() {
  const driver = getDriver();
  const session = driver.session();

  try {
    console.log('Clearing existing data...');
    await run(session, 'MATCH (n) DETACH DELETE n');

    console.log('Creating constraints...');
    await run(session, 'CREATE CONSTRAINT sector_name IF NOT EXISTS FOR (s:Sector) REQUIRE s.name IS UNIQUE');
    await run(session, 'CREATE CONSTRAINT stock_ticker IF NOT EXISTS FOR (s:Stock) REQUIRE s.ticker IS UNIQUE');
    await run(session, 'CREATE CONSTRAINT fund_code IF NOT EXISTS FOR (f:Fund) REQUIRE f.code IS UNIQUE');
    await run(session, 'CREATE CONSTRAINT investor_name IF NOT EXISTS FOR (i:Investor) REQUIRE i.name IS UNIQUE');

    console.log(`Creating ${SECTORS.length} sectors...`);
    await run(
      session,
      `UNWIND $sectors AS name
       CREATE (:Sector {name: name})`,
      { sectors: SECTORS }
    );

    console.log(`Creating ${STOCKS.length} stocks...`);
    await run(
      session,
      `UNWIND $stocks AS stock
       CREATE (s:Stock {ticker: stock.ticker, name: stock.name})
       WITH s, stock
       MATCH (sec:Sector {name: stock.sector})
       CREATE (s)-[:BELONGS_TO_SECTOR]->(sec)`,
      { stocks: STOCKS }
    );

    console.log(`Creating ${FUNDS.length} funds...`);
    const fundNodes = FUNDS.map(({ code, name, category }) => ({ code, name, category }));
    await run(
      session,
      `UNWIND $funds AS fund
       CREATE (:Fund {code: fund.code, name: fund.name, category: fund.category})`,
      { funds: fundNodes }
    );

    console.log('Creating fund -> stock holdings...');
    const stockHoldings = FUNDS.flatMap((fund) =>
      (fund.holdings || []).map((h) => ({ fundCode: fund.code, ticker: h.ticker, weightPct: h.weightPct }))
    );
    await run(
      session,
      `UNWIND $holdings AS h
       MATCH (f:Fund {code: h.fundCode})
       MATCH (s:Stock {ticker: h.ticker})
       CREATE (f)-[:INVESTS_IN {weightPct: h.weightPct}]->(s)`,
      { holdings: stockHoldings }
    );

    console.log('Creating fund -> fund holdings (fund-of-funds)...');
    const fundHoldings = FUNDS.flatMap((fund) =>
      (fund.fundHoldings || []).map((h) => ({ fundCode: fund.code, targetFundCode: h.fundCode, weightPct: h.weightPct }))
    );
    await run(
      session,
      `UNWIND $holdings AS h
       MATCH (f:Fund {code: h.fundCode})
       MATCH (target:Fund {code: h.targetFundCode})
       CREATE (f)-[:INVESTS_IN {weightPct: h.weightPct}]->(target)`,
      { holdings: fundHoldings }
    );

    console.log(`Creating ${INVESTORS.length} investors...`);
    await run(
      session,
      `UNWIND $investors AS inv
       CREATE (:Investor {name: inv.name})`,
      { investors: INVESTORS.map(({ name }) => ({ name })) }
    );

    console.log('Creating investor -> fund holdings...');
    const investorHoldings = INVESTORS.flatMap((inv) =>
      inv.holdings.map((h) => ({
        investorName: inv.name,
        fundCode: h.fundCode,
        units: h.units,
        investedAmount: h.investedAmount,
      }))
    );
    await run(
      session,
      `UNWIND $holdings AS h
       MATCH (i:Investor {name: h.investorName})
       MATCH (f:Fund {code: h.fundCode})
       CREATE (i)-[:HOLDS_UNITS_OF {units: h.units, investedAmount: h.investedAmount}]->(f)`,
      { holdings: investorHoldings }
    );

    const counts = await run(
      session,
      `MATCH (n) RETURN labels(n)[0] AS label, count(*) AS count ORDER BY label`
    );
    console.log('\nSeed complete. Node counts:');
    counts.records.forEach((r) => console.log(`  ${r.get('label')}: ${r.get('count').toNumber()}`));
  } finally {
    await session.close();
    await closeDriver();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
