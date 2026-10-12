var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// scripts/exportAllStockHistory.ts
var import_dns = __toESM(require("dns"));
var import_config = require("dotenv/config");
var import_mongodb = require("mongodb");
var import_exceljs = __toESM(require("exceljs"));
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
try {
  import_dns.default.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
  import_dns.default.promises.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch {
}
var enodata = Object.assign(new Error("queryTxt ENODATA"), { code: "ENODATA" });
import_dns.default.resolveTxt = (_name, cb) => process.nextTick(() => cb(enodata));
import_dns.default.promises.resolveTxt = async () => {
  throw enodata;
};
var START_DATE = /* @__PURE__ */ new Date("2023-01-01T00:00:00.000Z");
var END_DATE = /* @__PURE__ */ new Date("2026-09-29T23:59:59.999Z");
function safeSheetName(name, used) {
  const base = name.replace(/[\[\]:\*\?\/\\]/g, "_").slice(0, 31) || "SHEET";
  let candidate = base;
  let i = 1;
  while (used.has(candidate.toLowerCase())) {
    const suffix = `_${i++}`;
    candidate = base.slice(0, 31 - suffix.length) + suffix;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}
async function main() {
  console.log("\u{1F4CA} Export de l'historique journalier de toutes les actions...\n");
  const uri = process.env.DATABASE_URI;
  if (!uri) throw new Error("DATABASE_URI manquant dans .env");
  const exportsDir = import_path.default.join(__dirname, "..", "exports");
  if (!import_fs.default.existsSync(exportsDir)) import_fs.default.mkdirSync(exportsDir, { recursive: true });
  const client = new import_mongodb.MongoClient(uri, { serverSelectionTimeoutMS: 3e4 });
  await client.connect();
  console.log("   \u2705 Connect\xE9 \xE0 la base.\n");
  const db = client.db();
  const stocks = await db.collection("stocks").find({}, { projection: { symbol: 1, company_name: 1 } }).sort({ symbol: 1 }).toArray();
  console.log(`   ${stocks.length} actions trouv\xE9es.
`);
  const workbook = new import_exceljs.default.Workbook();
  workbook.creator = "AfriBourse";
  workbook.created = /* @__PURE__ */ new Date();
  const usedNames = /* @__PURE__ */ new Set();
  let totalRows = 0;
  let stocksWithData = 0;
  const summary = [];
  for (const stock of stocks) {
    const symbol = stock.symbol;
    const history = await db.collection("stock_history").find(
      { stock_ticker: symbol, date: { $gte: START_DATE, $lte: END_DATE } },
      { projection: { date: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 } }
    ).sort({ date: 1 }).toArray();
    const sheetName = safeSheetName(symbol, usedNames);
    const ws = workbook.addWorksheet(sheetName);
    ws.columns = [
      { header: "Date", key: "date", width: 14 },
      { header: "Ouverture", key: "open", width: 14 },
      { header: "Plus Haut", key: "high", width: 14 },
      { header: "Plus Bas", key: "low", width: 14 },
      { header: "Cl\xF4ture", key: "close", width: 14 },
      { header: "Volume", key: "volume", width: 16 }
    ];
    for (const h of history) {
      const d = h.date instanceof Date ? h.date : new Date(h.date);
      ws.addRow({
        date: d.toISOString().split("T")[0],
        open: h.open,
        high: h.high,
        low: h.low,
        close: h.close,
        volume: h.volume
      });
    }
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4CAF50" } };
    ws.views = [{ state: "frozen", ySplit: 1 }];
    ["open", "high", "low", "close"].forEach((k) => ws.getColumn(k).numFmt = "#,##0.00");
    ws.getColumn("volume").numFmt = "#,##0";
    totalRows += history.length;
    if (history.length > 0) stocksWithData++;
    summary.push({ symbol, name: stock.company_name ?? "", rows: history.length });
    console.log(`   \u2714 ${symbol.padEnd(8)} ${String(history.length).padStart(5)} lignes`);
  }
  const summaryWs = workbook.addWorksheet("_R\xE9sum\xE9");
  workbook.worksheets.pop();
  workbook.worksheets.unshift(summaryWs);
  summaryWs.columns = [
    { header: "Symbole", key: "symbol", width: 12 },
    { header: "Soci\xE9t\xE9", key: "name", width: 40 },
    { header: "Nb lignes", key: "rows", width: 12 }
  ];
  summary.forEach((s) => summaryWs.addRow(s));
  summaryWs.getRow(1).font = { bold: true };
  summaryWs.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2196F3" } };
  const filePath = import_path.default.join(exportsDir, "historique_actions_2023-01-01_2026-09-29.xlsx");
  await workbook.xlsx.writeFile(filePath);
  await client.close();
  console.log(`
\u{1F389} Export termin\xE9.`);
  console.log(`   Fichier : ${filePath}`);
  console.log(
    `   ${stocks.length} feuilles (${stocksWithData} avec donn\xE9es), ${totalRows} lignes au total.`
  );
}
main().catch((e) => {
  console.error("\u274C Erreur:", e);
  process.exit(1);
});
