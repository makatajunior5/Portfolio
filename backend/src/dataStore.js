const fs = require("fs/promises");
const path = require("path");

const DATA_FILE = path.join(__dirname, "portfolioData.json");

async function readPortfolio() {
  const content = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(content);
}

async function writePortfolio(data) {
  await fs.writeFile(DATA_FILE, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

module.exports = {
  readPortfolio,
  writePortfolio,
};
