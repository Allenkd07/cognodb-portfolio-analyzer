require('dotenv').config();
const neo4j = require('neo4j-driver');

let driver;

function getDriver() {
  if (!driver) {
    const { COGNODB_URI, COGNODB_USER, COGNODB_PASSWORD } = process.env;
    if (!COGNODB_URI || !COGNODB_USER || !COGNODB_PASSWORD) {
      throw new Error('Missing COGNODB_URI, COGNODB_USER or COGNODB_PASSWORD in environment');
    }
    driver = neo4j.driver(COGNODB_URI, neo4j.auth.basic(COGNODB_USER, COGNODB_PASSWORD));
  }
  return driver;
}

async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = undefined;
  }
}

module.exports = { getDriver, closeDriver };
