import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function sha() {
  return execSync("git rev-parse HEAD", { cwd: root, encoding: "utf8" }).trim();
}

/**
 * A qualification package is a claim about one exact commit. If the working tree is dirty,
 * `git rev-parse HEAD` describes a commit that is not what was tested, so the evidence would
 * attest to code that does not exist in the repository. Fail before spending the run.
 */
function dirtyPaths() {
  return execSync("git status --porcelain --untracked-files=no", { cwd: root, encoding: "utf8" })
    .split("\n")
    .map((line) => line.slice(3).trim())
    .filter(Boolean);
}

function run(label, command, args, env) {
  const started = Date.now();
  try {
    execSync(`${command} ${args.map((arg) => `"${arg}"`).join(" ")}`, {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: "inherit"
    });
    return { label, command: `${command} ${args.join(" ")}`, status: "pass", durationMs: Date.now() - started };
  } catch (error) {
    return {
      label,
      command: `${command} ${args.join(" ")}`,
      status: "fail",
      durationMs: Date.now() - started,
      exitCode: error.status ?? 1
    };
  }
}

const sourceSha = sha();
const shortSha = sourceSha.slice(0, 8);
const outDir = join(root, "qualification", shortSha);

const dirty = dirtyPaths();
if (dirty.length > 0) {
  mkdirSync(outDir, { recursive: true });
  const summary = {
    sourceSha,
    generatedAt: new Date().toISOString(),
    steps: [],
    result: "fail",
    failedSteps: ["clean-tree"],
    dirtyPaths: dirty
  };
  writeFileSync(join(outDir, "qualification.json"), `${JSON.stringify(summary, null, 2)}\n`);
  console.error(
    `\nQualification refused: the working tree has tracked changes, so the evidence would not describe ${shortSha}.\n` +
      dirty.map((path) => `  ${path}`).join("\n") +
      "\nCommit or stash them and run the qualification again. There is deliberately no override: a package that " +
      "does not describe a commit is not evidence."
  );
  process.exitCode = 1;
} else {
  mkdirSync(outDir, { recursive: true });
}

const steps =
  dirty.length > 0
    ? []
    : [
        run("verify", npm, ["run", "verify"], {}),
        run("bundle-report", "node", ["scripts/bundle-report.mjs"], { QUALIFICATION_SHA: shortSha }),
        run("test:e2e", npm, ["run", "test:e2e:run"], {}),
        run("test:host", npm, ["run", "test:host:run"], {}),
        run("release:manifest", npm, ["run", "release:manifest"], { GAME_COMMIT_SHA: sourceSha }),
        run("release:check", npm, ["run", "release:check"], { GAME_COMMIT_SHA: sourceSha })
      ];

if (dirty.length > 0) {
  console.log(`\nQualification for ${shortSha}: FAIL (clean-tree)`);
} else {
  let releaseManifest = null;
  try {
    releaseManifest = JSON.parse(readFileSync(join(root, "dist", "release-manifest.json"), "utf8"));
  } catch {
    // The identity step below records a missing or invalid manifest as a qualification failure.
  }
  steps.push({
    label: "release-manifest-source-sha",
    command: "dist/release-manifest.json commit equals qualification source SHA",
    status: releaseManifest?.commit === sourceSha ? "pass" : "fail",
    durationMs: 0,
    expectedSourceSha: sourceSha,
    actualCommit: releaseManifest?.commit ?? null
  });

  // Copy the browser reports into the package so the directory really contains what the
  // documentation says it contains, instead of only the step summary.
  for (const report of ["playwright-report", "playwright-report-host"]) {
    const from = join(root, report);
    if (existsSync(from)) {
      cpSync(from, join(outDir, report), { recursive: true });
    }
  }
  if (releaseManifest) {
    cpSync(join(root, "dist", "release-manifest.json"), join(outDir, "release-manifest.json"));
  }

  const failed = steps.filter((step) => step.status === "fail");
  const summary = {
    sourceSha,
    generatedAt: new Date().toISOString(),
    steps,
    result: failed.length === 0 ? "pass" : "fail",
    failedSteps: failed.map((step) => step.label)
  };

  writeFileSync(join(outDir, "qualification.json"), `${JSON.stringify(summary, null, 2)}\n`);

  console.log(`\nQualification for ${shortSha}: ${summary.result.toUpperCase()}`);
  for (const step of steps) {
    console.log(`  ${step.status.toUpperCase().padEnd(5)} ${step.label} (${Math.round(step.durationMs / 1000)}s)`);
  }
  if (failed.length > 0) {
    console.log(`Failed steps: ${summary.failedSteps.join(", ")}`);
  }
  process.exitCode = failed.length === 0 ? 0 : 1;
}
