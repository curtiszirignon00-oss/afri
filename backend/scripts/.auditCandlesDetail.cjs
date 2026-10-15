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

// scripts/auditCandlesDetail.ts
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
function withAuthSource(uri) {
  if (/[?&]authSource=/.test(uri)) return uri;
  return uri + (uri.includes("?") ? "&" : "?") + "authSource=admin";
}
var DOW = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
var key = (d) => d.toISOString().slice(0, 10);
var mins = (d) => d.getUTCHours() * 60 + d.getUTCMinutes();
var isWeekend = (d) => d.getUTCDay() === 0 || d.getUTCDay() === 6;
async function main() {
  const raw = process.env.DATABASE_URI;
  if (!raw) throw new Error("DATABASE_URI manquant");
  const client = new import_mongodb.MongoClient(withAuthSource(raw), { serverSelectionTimeoutMS: 3e4 });
  await client.connect();
  const db = client.db();
  const hist = await db.collection("stock_history").find({}, { projection: { stock_ticker: 1, date: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 } }).sort({ stock_ticker: 1, date: 1 }).toArray();
  const byTickerDate = /* @__PURE__ */ new Map();
  for (const h of hist) byTickerDate.set(h.stock_ticker + "|" + key(h.date), h);
  const prevTradingDay = (d) => {
    const x = new Date(d);
    do {
      x.setUTCDate(x.getUTCDate() - 1);
    } while (isWeekend(x));
    return x;
  };
  const weekend = hist.filter((h) => isWeekend(h.date));
  let wkCopy = 0, wkDiff = 0;
  const wkDiffSamples = [];
  for (const h of weekend) {
    const ref = byTickerDate.get(h.stock_ticker + "|" + key(prevTradingDay(h.date)));
    if (ref && ref.open === h.open && ref.high === h.high && ref.low === h.low && ref.close === h.close) wkCopy++;
    else {
      wkDiff++;
      if (wkDiffSamples.length < 8) {
        wkDiffSamples.push(`${h.stock_ticker.padEnd(7)} ${key(h.date)} ${DOW[h.date.getUTCDay()]} O${h.open} H${h.high} L${h.low} C${h.close}` + (ref ? `  | vendredi: O${ref.open} H${ref.high} L${ref.low} C${ref.close}` : "  | pas de seance precedente"));
      }
    }
  }
  console.log("=".repeat(74));
  console.log("1. BOUGIES DE WEEK-END");
  console.log("=".repeat(74));
  console.log("total                      : " + weekend.length);
  console.log("  copie exacte du vendredi : " + wkCopy);
  console.log("  differentes du vendredi  : " + wkDiff);
  if (wkDiffSamples.length) {
    console.log("  -- echantillon des differentes --");
    for (const s of wkDiffSamples) console.log("     " + s);
  }
  const wkDates = Array.from(new Set(weekend.map((h) => key(h.date)))).sort();
  console.log("  dates concernees (" + wkDates.length + ") : " + wkDates.join(", "));
  const perDate = /* @__PURE__ */ new Map();
  for (const h of hist) {
    const k = key(h.date);
    if (!perDate.has(k)) perDate.set(k, []);
    perDate.get(k).push(h);
  }
  console.log("");
  console.log("=".repeat(74));
  console.log("2. JOURS OUVRES SUSPECTS (tout le marche identique a la veille)");
  console.log("=".repeat(74));
  const suspects = [];
  for (const [k, rows] of perDate) {
    const d = /* @__PURE__ */ new Date(k + "T00:00:00.000Z");
    if (isWeekend(d)) continue;
    if (rows.length < 20) continue;
    const prev = key(prevTradingDay(d));
    let same = 0, cmp = 0;
    for (const h of rows) {
      const ref = byTickerDate.get(h.stock_ticker + "|" + prev);
      if (!ref) continue;
      cmp++;
      if (ref.open === h.open && ref.high === h.high && ref.low === h.low && ref.close === h.close) same++;
    }
    if (cmp >= 20 && same === cmp) suspects.push({ d: k, dow: DOW[d.getUTCDay()], n: cmp });
  }
  suspects.sort((a, b) => a.d.localeCompare(b.d));
  console.log("jours trouves : " + suspects.length + "  (candidats jours feries / absence de cotation)");
  for (const s of suspects) console.log("   " + s.d + " " + s.dow + "  (" + s.n + " tickers identiques a la seance precedente)");
  const snaps = await db.collection("intraday_snapshots").find({}, { projection: { stock_ticker: 1, timestamp: 1, price: 1, volume: 1 } }).sort({ timestamp: 1 }).toArray();
  const inWindow = snaps.filter((s) => !isWeekend(s.timestamp) && mins(s.timestamp) >= 585 && mins(s.timestamp) <= 915);
  const extremes = /* @__PURE__ */ new Map();
  for (const s of inWindow) {
    const k = s.stock_ticker + "|" + key(s.timestamp);
    const e = extremes.get(k);
    if (!e) extremes.set(k, { min: s.price, max: s.price, n: 1 });
    else {
      e.min = Math.min(e.min, s.price);
      e.max = Math.max(e.max, s.price);
      e.n++;
    }
  }
  console.log("");
  console.log("=".repeat(74));
  console.log("3. BACKFILL DES MECHES DEPUIS LES SNAPSHOTS INTRADAY");
  console.log("=".repeat(74));
  console.log("snapshots retenus (09h45-15h15, jours ouvres) : " + inWindow.length);
  console.log("couples ticker/jour couverts                  : " + extremes.size);
  let wouldChange = 0, wouldGainWick = 0, noChange = 0, noSnap = 0;
  const samples = [];
  for (const h of hist) {
    const e = extremes.get(h.stock_ticker + "|" + key(h.date));
    if (!e) {
      noSnap++;
      continue;
    }
    const newHigh = Math.max(h.open, h.close, h.high, e.max);
    const newLow = Math.min(h.open, h.close, h.low, e.min);
    const hadWick = !(h.high === Math.max(h.open, h.close) && h.low === Math.min(h.open, h.close));
    const willHaveWick = !(newHigh === Math.max(h.open, h.close) && newLow === Math.min(h.open, h.close));
    if (newHigh !== h.high || newLow !== h.low) {
      wouldChange++;
      if (!hadWick && willHaveWick) wouldGainWick++;
      if (samples.length < 10) {
        samples.push(`${h.stock_ticker.padEnd(7)} ${key(h.date)}  O${h.open} C${h.close}  H ${h.high}->${newHigh}  L ${h.low}->${newLow}  (${e.n} snapshots)`);
      }
    } else noChange++;
  }
  console.log("bougies journalieres modifiees                : " + wouldChange);
  console.log("  dont qui gagnent une vraie meche            : " + wouldGainWick);
  console.log("bougies couvertes mais inchangees             : " + noChange);
  console.log("bougies sans snapshot (hors periode)          : " + noSnap);
  if (samples.length) {
    console.log("  -- echantillon --");
    for (const s of samples) console.log("     " + s);
  }
  const outPre = snaps.filter((s) => !isWeekend(s.timestamp) && mins(s.timestamp) < 585);
  const outPost = snaps.filter((s) => !isWeekend(s.timestamp) && mins(s.timestamp) > 915);
  const outWk = snaps.filter((s) => isWeekend(s.timestamp));
  console.log("");
  console.log("=".repeat(74));
  console.log("4. SNAPSHOTS HORS FENETRE (candidats suppression)");
  console.log("=".repeat(74));
  console.log("avant 09h45 : " + outPre.length);
  console.log("apres 15h15 : " + outPost.length);
  console.log("week-end    : " + outWk.length);
  console.log("TOTAL       : " + (outPre.length + outPost.length + outWk.length) + " / " + snaps.length);
  let clamp = 0;
  const clampSamples = [];
  for (const h of hist) {
    const nh = Math.max(h.open, h.high, h.low, h.close);
    const nl = Math.min(h.open, h.high, h.low, h.close);
    if (nh !== h.high || nl !== h.low) {
      clamp++;
      if (clampSamples.length < 8) {
        clampSamples.push(`${h.stock_ticker.padEnd(7)} ${key(h.date)}  O${h.open} C${h.close}  H ${h.high}->${nh}  L ${h.low}->${nl}`);
      }
    }
  }
  console.log("");
  console.log("=".repeat(74));
  console.log("5. OHLC INCOHERENT : effet du recadrage high=max / low=min");
  console.log("=".repeat(74));
  console.log("bougies corrigees : " + clamp);
  for (const s of clampSamples) console.log("     " + s);
  await client.close();
}
main().catch((e) => {
  console.error("ERREUR:", e?.message ?? e);
  process.exit(1);
});
