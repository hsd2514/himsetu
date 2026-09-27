/**
 * Round trip between Convex and notebooks/timesfm_forecast.ipynb.
 *
 *   npm run forecast:export [-- out.json]          consumption history for the notebook
 *   npm run forecast:import -- timesfm_forecast.json   TimesFM-3 output into `forecasts`
 *
 * Uses NEXT_PUBLIC_CONVEX_URL from .env.local; set CONVEX_URL to target another deployment.
 */
import { readFile, writeFile } from "node:fs/promises";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

const [cmd, file] = process.argv.slice(2);
const url = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;
if (!url) fail("No Convex URL. Run `npx convex dev` once to create .env.local, or set CONVEX_URL.");
const client = new ConvexHttpClient(url);

if (cmd === "export") await exportHistory(file ?? "notebooks/history.json");
else if (cmd === "import" && file) await importForecast(file);
else fail("Usage: npm run forecast:export [-- out.json]  |  npm run forecast:import -- timesfm_forecast.json");

async function exportHistory(out) {
  const history = await call("query", "forecast:history", {});
  await writeFile(out, JSON.stringify(history));
  console.log(`Wrote ${history.series.length} series to ${out}. Upload it to the notebook, or point CONVEX_URL there.`);
}

async function importForecast(path) {
  let doc;
  try {
    doc = JSON.parse(await readFile(path, "utf8"));
  } catch (e) {
    fail(`Cannot read ${path}: ${e.message}`);
  }
  const rows = Array.isArray(doc) ? doc : doc.rows;
  if (!Array.isArray(rows) || rows.length === 0) fail(`${path} has no forecast rows`);

  // Send only the fields the mutation accepts.
  const clean = rows.map(({ stationCode, item, points, stockOutDate }) => ({
    stationCode,
    item,
    points: points.map(({ date, qty }) => ({ date, qty })),
    ...(stockOutDate != null ? { stockOutDate } : {}),
  }));
  const n = await call("mutation", "forecast:importTimesfm", { rows: clean });
  console.log(`Imported ${n} TimesFM-3 forecast${n === 1 ? "" : "s"}${doc.model ? ` from ${doc.model}` : ""}.`);
  for (const r of clean) {
    const out = r.stockOutDate ? new Date(r.stockOutDate).toISOString().slice(0, 10) : "stays above safety";
    console.log(`  ${r.stationCode.padEnd(8)} ${r.item.padEnd(8)} ${out}`);
  }
}

async function call(kind, name, args) {
  try {
    return await client[kind](makeFunctionReference(name), args);
  } catch (e) {
    fail(`${name} failed: ${String(e.message).replace(/^.*Uncaught Error: /s, "").split("\n")[0]}`);
  }
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}
