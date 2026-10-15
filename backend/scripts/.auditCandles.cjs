var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key2 of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key2) && key2 !== except)
        __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
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

// scripts/auditCandles.ts
var import_dns = __toESM(require("dns"));
var import_config = require("dotenv/config");
var import_mongodb = require("mongodb");
try {
  import_dns.default.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
  import_dns.default.promises.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch {
}
var enodata = Object.assign(new Error("queryTxt ENODATA"), { code: "ENODATA" });
import_dns.default.resolveTxt = (_n, cb) => process.nextTick(() => cb(enodata));
import_dns.default.promises.resolveTxt = async () => {
  throw enodata;
};
var DOW = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
var key = (d) => d.toISOString().slice(0, 10);
var mins = (d) => d.getUTCHours() * 60 + d.getUTCMinutes();
var isWeekend = (d) => d.getUTCDay() === 0 || d.getUTCDay() === 6;
function withAuthSource(uri) {
  if (/[?&]authSource=/.test(uri)) return uri;
  return uri + (uri.includes("?") ? "&" : "?") + "authSource=admin";
}
async function main() {
  const raw = process.env.DATABASE_URI;
  if (!raw) throw new Error("DATABASE_URI manquant dans .env");
  const uri = withAuthSource(raw);
  const client = new import_mongodb.MongoClient(uri, { serverSelectionTimeoutMS: 3e4 });
  await client.connect();
  const db = client.db();
  const hist = await db.collection("stock_history").find({}, { projection: { stock_ticker: 1, date: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 } }).sort({ stock_ticker: 1, date: 1 }).toArray();
  console.log("=".repeat(74));
  console.log("STOCK_HISTORY - bougies journalieres");
  console.log("=".repeat(74));
  console.log("total bougies :", hist.length);
  if (!hist.length) {
    await client.close();
    return;
  }
  const times = hist.map((h) => h.date.getTime());
  console.log("periode       :", key(new Date(Math.min(...times))), "->", key(new Date(Math.max(...times))));
  console.log("tickers       :", new Set(hist.map((h) => h.stock_ticker)).size);
  const weekend = [];
  const invalid = [];
  const noWick = [];
  const flat = [];
  const bad = [];
  for (const h of hist) {
    if (isWeekend(h.date)) weekend.push(h);
    if (h.high < h.low || h.high < Math.max(h.open, h.close) || h.low > Math.min(h.open, h.close)) invalid.push(h);
    if (h.open <= 0 || h.close <= 0 || h.high <= 0 || h.low <= 0) bad.push(h);
    if (h.high === Math.max(h.open, h.close) && h.low === Math.min(h.open, h.close)) noWick.push(h);
    if (h.open === h.close && h.high === h.low && h.open === h.high) flat.push(h);
  }
  const byTicker = /* @__PURE__ */ new Map();
  for (const h of hist) {
    if (!byTicker.has(h.stock_ticker)) byTicker.set(h.stock_ticker, []);
    byTicker.get(h.stock_ticker).push(h);
  }
  const dupPrev = [];
  for (const [t, rows] of byTicker) {
    for (let i = 1; i < rows.length; i++) {
      const a = rows[i - 1];
      const b = rows[i];
      if (a.open === b.open && a.high === b.high && a.low === b.low && a.close === b.close) {
        dupPrev.push({ t, d: key(b.date), prev: key(a.date), dow: DOW[b.date.getUTCDay()] });
      }
    }
  }
  const pct = (n) => (n / hist.length * 100).toFixed(1) + "%";
  console.log("");
  console.log("PROBLEMES");
  console.log("  week-end (sam/dim)         : " + weekend.length + " (" + pct(weekend.length) + ")");
  console.log("  OHLC incoherent            : " + invalid.length + " (" + pct(invalid.length) + ")");
  console.log("  prix <= 0                  : " + bad.length + " (" + pct(bad.length) + ")");
  console.log("  sans meche (H/L = O/C)     : " + noWick.length + " (" + pct(noWick.length) + ")");
  console.log("  totalement plate (O=H=L=C) : " + flat.length + " (" + pct(flat.length) + ")");
  console.log("  OHLC identique a la veille : " + dupPrev.length + " (" + pct(dupPrev.length) + ")");
  if (weekend.length) {
    console.log("");
    console.log("  -- echantillon week-end --");
    for (const h of weekend.slice(0, 10)) {
      console.log("     " + h.stock_ticker.padEnd(7) + " " + key(h.date) + " " + DOW[h.date.getUTCDay()] + " O" + h.open + " H" + h.high + " L" + h.low + " C" + h.close + " V" + h.volume);
    }
    console.log("     -> " + new Set(weekend.map((h) => key(h.date))).size + " dates de week-end concernees");
  }
  if (dupPrev.length) {
    console.log("");
    console.log("  -- echantillon doublons de la veille --");
    for (const d of dupPrev.slice(0, 10)) {
      console.log("     " + d.t.padEnd(7) + " " + d.d + " (" + d.dow + ") == " + d.prev);
    }
  }
  if (invalid.length) {
    console.log("");
    console.log("  -- echantillon OHLC incoherent --");
    for (const h of invalid.slice(0, 10)) {
      console.log("     " + h.stock_ticker.padEnd(7) + " " + key(h.date) + " O" + h.open + " H" + h.high + " L" + h.low + " C" + h.close);
    }
  }
  const byYear = /* @__PURE__ */ new Map();
  for (const h of hist) {
    const y = h.date.getUTCFullYear();
    if (!byYear.has(y)) byYear.set(y, { total: 0, noWick: 0, flat: 0 });
    const e = byYear.get(y);
    e.total++;
    if (h.high === Math.max(h.open, h.close) && h.low === Math.min(h.open, h.close)) e.noWick++;
    if (h.open === h.close && h.high === h.low && h.open === h.high) e.flat++;
  }
  console.log("");
  console.log("  -- par annee : sans meche / plates --");
  for (const y of Array.from(byYear.keys()).sort()) {
    const e = byYear.get(y);
    console.log("     " + y + " : " + String(e.total).padStart(5) + " bougies | sans meche " + String(Math.round(e.noWick / e.total * 100)).padStart(3) + "% | plates " + String(Math.round(e.flat / e.total * 100)).padStart(3) + "%");
  }
  const snaps = await db.collection("intraday_snapshots").find({}, { projection: { stock_ticker: 1, timestamp: 1, price: 1, volume: 1 } }).sort({ timestamp: 1 }).toArray();
  console.log("");
  console.log("=".repeat(74));
  console.log("INTRADAY_SNAPSHOTS");
  console.log("=".repeat(74));
  console.log("total snapshots :", snaps.length);
  if (snaps.length) {
    console.log("periode         :", snaps[0].timestamp.toISOString(), "->", snaps[snaps.length - 1].timestamp.toISOString());
    console.log("tickers         :", new Set(snaps.map((s) => s.stock_ticker)).size);
    const wk = snaps.filter((s) => isWeekend(s.timestamp));
    const pre = snaps.filter((s) => !isWeekend(s.timestamp) && mins(s.timestamp) < 585);
    const late = snaps.filter((s) => !isWeekend(s.timestamp) && mins(s.timestamp) > 915);
    const p = (n) => (n / snaps.length * 100).toFixed(1) + "%";
    console.log("  week-end               : " + wk.length + " (" + p(wk.length) + ")");
    console.log("  avant 09h45 (pre-ouv.) : " + pre.length + " (" + p(pre.length) + ")");
    console.log("  apres 15h15            : " + late.length + " (" + p(late.length) + ")");
    const byMin = /* @__PURE__ */ new Map();
    for (const s of snaps) {
      const k = String(s.timestamp.getUTCHours()).padStart(2, "0") + ":" + String(s.timestamp.getUTCMinutes()).padStart(2, "0");
      byMin.set(k, (byMin.get(k) ?? 0) + 1);
    }
    console.log("");
    console.log("  -- repartition horaire (UTC) --");
    for (const k of Array.from(byMin.keys()).sort()) {
      const flag = k < "09:45" ? "  <- pre-ouverture" : k > "15:15" ? "  <- apres cloture" : "";
      console.log("     " + k + " : " + String(byMin.get(k)).padStart(6) + flag);
    }
    console.log("");
    console.log("  jours couverts : " + new Set(snaps.map((s) => key(s.timestamp))).size);
  }
  await client.close();
}
main().catch((e) => {
  console.error("ERREUR:", e?.message ?? e);
  process.exit(1);
});
