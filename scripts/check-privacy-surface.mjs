import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const allowedRuntime = new Set(["react", "react-dom", "zod"]);
const runtime = Object.keys(packageJson.dependencies ?? {});
const unexpected = runtime.filter((name) => !allowedRuntime.has(name));

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  }).filter((path) => /\.(ts|tsx)$/.test(path));
}

const forbidden = [
  ["fetch(", /\bfetch\s*\(/],
  ["XMLHttpRequest", /\bXMLHttpRequest\b/],
  ["WebSocket", /\bWebSocket\b/],
  ["localStorage", /\blocalStorage\b/],
  ["sessionStorage", /\bsessionStorage\b/],
  ["analytics marker", /\b(?:gtag|segment|mixpanel|posthog|sentry)\b/i],
];

const violations = [];
if (unexpected.length) violations.push("Unexpected runtime dependencies: " + unexpected.join(", "));

for (const path of files(join(root, "src"))) {
  const source = readFileSync(path, "utf8");
  for (const [label, pattern] of forbidden) {
    if (pattern.test(source)) violations.push(path.replace(root + "/", "") + ": " + label);
  }
}

if (violations.length) {
  console.error(violations.join("\n"));
  process.exit(1);
}
console.log("PASS: runtime dependency and source privacy surface is bounded.");
