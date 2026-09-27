import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

const BUDGET_KIB = 350;

function gzipKib(path) {
  const bytes = gzipSync(readFileSync(path)).length;
  return Math.round((bytes / 1024) * 100) / 100;
}

const assets = readdirSync(join(dist, "assets"))
  .map((name) => {
    const file = join(dist, "assets", name);
    const raw = readFileSync(file).length;
    return { name, rawBytes: raw, gzipKib: gzipKib(file) };
  })
  .sort((a, b) => b.rawBytes - a.rawBytes);

const html = readFileSync(join(dist, "index.html"));
const htmlGzip = Math.round((gzipSync(html).length / 1024) * 100) / 100;

const totalGzip = Math.round((htmlGzip + assets.reduce((sum, asset) => sum + asset.gzipKib, 0)) * 100) / 100;
const withinBudget = totalGzip <= BUDGET_KIB;

const report = {
  budget: { compressedTransferTargetKiB: BUDGET_KIB },
  html: { gzipKib: htmlGzip },
  assets,
  totalGzipKib: totalGzip,
  withinBudget
};

const outDir = join(root, "qualification", process.env.QUALIFICATION_SHA ?? "local");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "bundle-report.json"), `${JSON.stringify(report, null, 2)}\n`);

console.log(`Bundle report: html ${htmlGzip} KiB gzip + assets ${assets.length} files`);
console.log(`Total compressed transfer: ${totalGzip} KiB (budget ${BUDGET_KIB} KiB) — ${withinBudget ? "PASS" : "FAIL"}`);
for (const asset of assets.slice(0, 5)) {
  console.log(`  ${asset.name}: ${asset.rawBytes} B raw, ${asset.gzipKib} KiB gzip`);
}
process.exitCode = withinBudget ? 0 : 1;
