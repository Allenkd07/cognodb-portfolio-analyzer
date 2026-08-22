require('dotenv').config();
const { closeDriver } = require('../lib/driver');
const {
  listInvestors,
  getInvestorHoldings,
  getLookThroughExposure,
  getSectorConcentration,
  getTopHoldings,
  getFundOverlap,
  getSimilarFunds,
} = require('../lib/queries');

async function main() {
  const investors = await listInvestors();
  console.log('Investors:', investors);

  const target = 'Priya Nair';
  const holdings = await getInvestorHoldings(target);
  console.log(`\n${target} direct fund holdings:`, holdings);

  const exposure = await getLookThroughExposure(holdings);
  const totalExposure = exposure.reduce((s, e) => s + e.exposureAmount, 0);
  const totalInvested = holdings.reduce((s, h) => s + h.investedAmount, 0);
  console.log(`\n${target} look-through stock exposure (top 10 of ${exposure.length}):`);
  exposure.slice(0, 10).forEach((e) => console.log(`  ${e.ticker.padEnd(12)} ${e.name.padEnd(30)} ₹${e.exposureAmount.toFixed(0)}`));
  console.log(`  Total look-through exposure: ₹${totalExposure.toFixed(0)}  (invested: ₹${totalInvested.toFixed(0)})`);

  const sectors = await getSectorConcentration(holdings);
  console.log(`\n${target} sector concentration:`);
  sectors.forEach((s) => console.log(`  ${s.sector.padEnd(35)} ₹${s.exposureAmount.toFixed(0)} (${((s.exposureAmount / totalExposure) * 100).toFixed(1)}%)`));

  const top5 = await getTopHoldings(holdings, 5);
  console.log(`\nTop 5 holdings:`, top5.map((t) => t.ticker));

  const overlap = await getFundOverlap('AXIS-LARGECAP', 'AXIS-NIFTY50');
  console.log(`\nOverlap AXIS-LARGECAP vs AXIS-NIFTY50 (${overlap.length} shared stocks):`);
  overlap.forEach((o) => console.log(`  ${o.ticker.padEnd(14)} fund1=${o.fund1Weight}% fund2=${o.fund2Weight}%`));

  const similar = await getSimilarFunds('AXIS-LARGECAP', 5);
  console.log(`\nFunds most similar to AXIS-LARGECAP:`);
  similar.forEach((s) => console.log(`  ${s.code.padEnd(15)} ${s.name.padEnd(35)} score=${s.overlapScore.toFixed(2)}`));
}

main()
  .catch((err) => console.error('Test failed:', err))
  .finally(() => closeDriver());
