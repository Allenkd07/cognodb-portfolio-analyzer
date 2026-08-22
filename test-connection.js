require('dotenv').config();
const neo4j = require('neo4j-driver');

const { COGNODB_URI, COGNODB_USER, COGNODB_PASSWORD } = process.env;

const driver = neo4j.driver(COGNODB_URI, neo4j.auth.basic(COGNODB_USER, COGNODB_PASSWORD));

async function main() {
  const session = driver.session();
  try {
    const result = await session.run('RETURN 1 AS ok');
    console.log('Connected. Test query result:', result.records[0].get('ok').toNumber());
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error('Connection failed:', err.message);
  process.exit(1);
});
