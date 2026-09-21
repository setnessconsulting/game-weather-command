import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const domainRoot = join(root, "src", "domain");
const forbidden = [
  /from\s+["']react(?:\/|["'])/,
  /from\s+["']react-dom(?:\/|["'])/,
  /from\s+["']zod["']/,
  /from\s+["']@\/(?:app|viz|audio|scenarios)(?:\/|["'])/,
  /\bwindow\b/,
  /\bdocument\b/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bfetch\s*\(/,
  /Math\.random\s*\(/,
  /Date\.now\s*\(/,
  /requestAnimationFrame\s*\(/,
];

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  }).filter((path) => /\.ts$/.test(path));
}

const violations = [];
for (const path of files(domainRoot)) {
  const source = readFileSync(path, "utf8");
  for (const rule of forbidden) {
    if (rule.test(source)) violations.push(relative(root, path) + " violates domain purity: " + rule);
  }
}

if (violations.length) {
  console.error(violations.join("\n"));
  process.exit(1);
}
console.log("PASS: domain layer is framework/browser/network/time/ambient-randomness free.");
