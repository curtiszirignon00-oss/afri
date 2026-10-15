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

// scripts/cleanCandles.ts
var import_dns = __toESM(require("dns"));
var import_config = require("dotenv/config");
var import_mongodb = require("mongodb");
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
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
var isWeekend = (d) => d.getUTCDay() === 0 || d.getUTCDay() === 6;
var CHUNK = 500;
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
async function main() {
  const argv = process.argv.slice(2);
  const apply = argv.includes("--apply");
  const onlyWeekend = argv.includes("--weekend");
  const onlyOhlc = argv.includes("--ohlc");
  const doWeekend = onlyWeekend || !onlyOhlc;
  const doOhlc = onlyOhlc || !onlyWeekend;
  console.log("");
  console.log(apply ? "*** MODE APPLICATION \u2014 ECRITURE EN BASE ***" : "--- MODE DRY-RUN \u2014 aucune ecriture ---");
  console.log("operations : " + [doWeekend && "week-end", doOhlc && "ohlc"].filter(Boolean).join(" + "));
  console.log("");
  const raw = process.env.DATABASE_URI;
  if (!raw) throw new Error("DATABASE_URI manquant dans .env");
  const client = new import_mongodb.MongoClient(withAuthSource(raw), { serverSelectionTimeoutMS: 3e4 });
  await client.connect();
  const db = client.db();
  const col = db.collection("stock_history");
  const before = await col.countDocuments();
  const hist = await col.find({}, { projection: { stock_ticker: 1, date: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 } }).sort({ stock_ticker: 1, date: 1 }).toArray();
  console.log("bougies en base : " + before);
  const weekendRows = doWeekend ? hist.filter((h) => isWeekend(h.date)) : [];
  const byTickerDate = /* @__PURE__ */ new Map();
  for (const h of hist) byTickerDate.set(h.stock_ticker + "|" + key(h.date), h);
  const prevTradingDay = (d) => {
    const x = new Date(d);
    do {
      x.setUTCDate(x.getUTCDate() - 1);
    } while (isWeekend(x));
    return x;
  };
  if (doWeekend) {
    let copies = 0;
    const oddballs = [];
    for (const h of weekendRows) {
      const ref = byTickerDate.get(h.stock_ticker + "|" + key(prevTradingDay(h.date)));
      if (ref && ref.open === h.open && ref.high === h.high && ref.low === h.low && ref.close === h.close) copies++;
      else oddballs.push(h);
    }
    const dates = Array.from(new Set(weekendRows.map((h) => key(h.date)))).sort();
    console.log("");
    console.log("=".repeat(74));
    console.log("1. SUPPRESSION DES BOUGIES DE WEEK-END");
    console.log("=".repeat(74));
    console.log("a supprimer                      : " + weekendRows.length);
    console.log("  copies de la seance precedente : " + copies);
    console.log("  valeurs divergentes            : " + oddballs.length + "  (anciens imports)");
    console.log("dates concernees (" + dates.length + ") :");
    for (const d of chunk(dates, 7)) console.log("   " + d.join("  "));
    if (oddballs.length) {
      console.log("  -- lignes divergentes (echantillon) --");
      for (const h of oddballs.slice(0, 10)) {
        const ref = byTickerDate.get(h.stock_ticker + "|" + key(prevTradingDay(h.date)));
        console.log("     " + h.stock_ticker.padEnd(7) + " " + key(h.date) + " " + DOW[h.date.getUTCDay()] + "  O" + h.open + " H" + h.high + " L" + h.low + " C" + h.close + (ref ? "   | seance precedente: C" + ref.close : "   | pas de seance precedente"));
      }
    }
  }
  const fixes = [];
  if (doOhlc) {
    const weekendIds = new Set(weekendRows.map((h) => String(h._id)));
    for (const h of hist) {
      if (weekendIds.has(String(h._id))) continue;
      const high = Math.max(h.open, h.high, h.low, h.close);
      const low = Math.min(h.open, h.high, h.low, h.close);
      if (high !== h.high || low !== h.low) fixes.push({ row: h, high, low });
    }
    console.log("");
    console.log("=".repeat(74));
    console.log("2. RECADRAGE DES OHLC IMPOSSIBLES");
    console.log("=".repeat(74));
    console.log("a corriger : " + fixes.length);
    const perTicker = /* @__PURE__ */ new Map();
    for (const f of fixes) perTicker.set(f.row.stock_ticker, (perTicker.get(f.row.stock_ticker) ?? 0) + 1);
    const top = Array.from(perTicker.entries()).sort((a, b) => b[1] - a[1]);
    console.log("  par ticker : " + top.map(([t, n]) => t + ":" + n).join(", "));
    console.log("  -- echantillon --");
    for (const f of fixes.slice(0, 10)) {
      console.log("     " + f.row.stock_ticker.padEnd(7) + " " + key(f.row.date) + "  O" + f.row.open + " C" + f.row.close + "   H " + f.row.high + "->" + f.high + "   L " + f.row.low + "->" + f.low);
    }
  }
  if (!apply) {
    console.log("");
    console.log("=".repeat(74));
    console.log("DRY-RUN \u2014 rien n'a ete ecrit.");
    console.log("  suppressions prevues : " + weekendRows.length);
    console.log("  corrections prevues  : " + fixes.length);
    console.log("  total apres          : " + (before - weekendRows.length) + " bougies");
    console.log("Relancer avec --apply pour executer.");
    console.log("=".repeat(74));
    await client.close();
    return;
  }
  const exportsDir = import_path.default.join(__dirname, "..", "exports");
  if (!import_fs.default.existsSync(exportsDir)) import_fs.default.mkdirSync(exportsDir, { recursive: true });
  const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
  const backupPath = import_path.default.join(exportsDir, "clean-candles-backup-" + stamp + ".json");
  import_fs.default.writeFileSync(backupPath, JSON.stringify({
    generated_at: (/* @__PURE__ */ new Date()).toISOString(),
    deleted_weekend: weekendRows,
    clamped_ohlc: fixes.map((f) => ({ before: f.row, after: { high: f.high, low: f.low } }))
  }, null, 2), "utf-8");
  console.log("");
  console.log("sauvegarde ecrite : " + backupPath);
  let deleted = 0;
  for (const batch of chunk(weekendRows.map((h) => h._id), CHUNK)) {
    const res = await col.deleteMany({ _id: { $in: batch } });
    deleted += res.deletedCount ?? 0;
    process.stdout.write("\r  suppression : " + deleted + "/" + weekendRows.length);
  }
  if (weekendRows.length) console.log("");
  let updated = 0;
  for (const batch of chunk(fixes, CHUNK)) {
    const ops = batch.map((f) => ({
      updateOne: { filter: { _id: f.row._id }, update: { $set: { high: f.high, low: f.low } } }
    }));
    const res = await col.bulkWrite(ops, { ordered: false });
    updated += res.modifiedCount ?? 0;
    process.stdout.write("\r  correction  : " + updated + "/" + fixes.length);
  }
  if (fixes.length) console.log("");
  const after = await col.countDocuments();
  console.log("");
  console.log("=".repeat(74));
  console.log("TERMINE");
  console.log("  supprimees : " + deleted);
  console.log("  corrigees  : " + updated);
  console.log("  bougies    : " + before + " -> " + after);
  console.log("=".repeat(74));
  const check = await col.find({}, { projection: { stock_ticker: 1, date: 1, open: 1, high: 1, low: 1, close: 1 } }).toArray();
  const leftWeekend = check.filter((h) => isWeekend(h.date)).length;
  const leftBad = check.filter((h) => h.high < Math.max(h.open, h.close) || h.low > Math.min(h.open, h.close) || h.high < h.low).length;
  console.log("verification \u2014 week-end restants : " + leftWeekend + " | OHLC impossibles restants : " + leftBad);
  await client.close();
}
main().catch((e) => {
  console.error("ERREUR:", e?.message ?? e);
  process.exit(1);
});
