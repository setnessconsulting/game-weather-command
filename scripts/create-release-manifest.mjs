// create-release-manifest.mjs — immutable release identity for games-site static-web.
//
// Usage:
//   node scripts/create-release-manifest.mjs dist
//   node scripts/create-release-manifest.mjs dist --check
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const [, , distArgument = "dist", ...flags] = process.argv;
const distDir = path.resolve(distArgument);
const checkOnly = flags.includes("--check");
const manifestPath = path.join(distDir, "release-manifest.json");
const GAME_SLUG = "weather-command";
const ENTRY_FILE = "index.html";
const PROVENANCE_MANIFEST_PATH = path.resolve("docs/ASSET_PROVENANCE_MANIFEST.json");

const contentTypes = new Map([
  [".css", "text/css"],
  [".html", "text/html"],
  [".js", "text/javascript"],
  [".json", "application/json"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".wasm", "application/wasm"],
  [".woff2", "font/woff2"]
]);

const workflowRunUrl =
  process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null;
const inReleaseWorkflow = process.env.GITHUB_ACTIONS === "true" && Boolean(workflowRunUrl);

async function filesUnder(directory, prefix = "") {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = path.posix.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(absolute, relative)));
    else if (entry.isFile() && relative !== "release-manifest.json") files.push({ relative, absolute });
  }
  return files;
}

async function sha256(filePath) {
  const bytes = await fs.readFile(filePath);
  return { sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.byteLength };
}

const contentTypeFor = (relative) =>
  contentTypes.get(path.extname(relative).toLowerCase()) ?? "application/octet-stream";

async function lockfileIdentity() {
  try {
    const digest = await sha256(path.resolve("package-lock.json"));
    return { path: "package-lock.json", ...digest };
  } catch {
    return null;
  }
}

async function readProvenanceManifest() {
  const raw = await fs.readFile(PROVENANCE_MANIFEST_PATH, "utf8");
  const manifest = JSON.parse(raw);
  if (
    manifest.schemaVersion !== "1.0.0" ||
    typeof manifest.version !== "string" ||
    manifest.game !== GAME_SLUG ||
    !Array.isArray(manifest.entries) ||
    manifest.entries.length === 0
  ) {
    throw new Error("Asset provenance manifest must identify this game and contain versioned entries");
  }

  const ids = new Set();
  for (const entry of manifest.entries) {
    if (
      typeof entry.provenanceId !== "string" ||
      ids.has(entry.provenanceId) ||
      typeof entry.category !== "string" ||
      !Array.isArray(entry.sourcePaths) ||
      entry.sourcePaths.length === 0 ||
      typeof entry.creator !== "string" ||
      typeof entry.creationMethod !== "string" ||
      typeof entry.sourceReference !== "string" ||
      typeof entry.modifications !== "string" ||
      typeof entry.rightsBasis !== "string" ||
      typeof entry.licenseCategory !== "string" ||
      typeof entry.releaseApproval !== "string"
    ) {
      throw new Error("Asset provenance manifest contains an incomplete or duplicate entry");
    }
    ids.add(entry.provenanceId);
  }

  return { manifest, identity: { path: "docs/ASSET_PROVENANCE_MANIFEST.json", ...(await sha256(PROVENANCE_MANIFEST_PATH)) } };
}

function provenanceForOutput(relative, provenanceEntries) {
  const extension = path.extname(relative).toLowerCase();
  const provenanceId =
    relative === ENTRY_FILE
      ? "wc-static-shell"
      : relative.startsWith("assets/") && extension === ".css"
        ? "wc-interface-styles"
        : relative.startsWith("assets/") && extension === ".js"
          ? "wc-game-runtime"
          : undefined;
  const entry = provenanceEntries.find((candidate) => candidate.provenanceId === provenanceId);
  if (!entry) throw new Error(`No asset provenance entry is mapped to release file: ${relative}`);
  return entry;
}

async function buildManifest() {
  const version = process.env.GAME_RELEASE_VERSION ?? process.env.npm_package_version ?? "0.1.0";
  const provenance = await readProvenanceManifest();
  const files = {};
  for (const file of await filesUnder(distDir)) {
    const entry = provenanceForOutput(file.relative, provenance.manifest.entries);
    files[file.relative] = {
      ...(await sha256(file.absolute)),
      contentType: contentTypeFor(file.relative),
      provenanceId: entry.provenanceId,
      licenseCategory: entry.licenseCategory,
      releaseApproval: entry.releaseApproval
    };
  }

  return {
    schemaVersion: "1.0.0",
    game: GAME_SLUG,
    version,
    commit: process.env.GAME_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "working-tree",
    entryFile: ENTRY_FILE,
    manifestFile: "release-manifest.json",
    r2Prefix: `${GAME_SLUG}/${version}/`,
    lockfile: await lockfileIdentity(),
    provenanceManifestVersion: provenance.manifest.version,
    provenanceManifest: {
      ...provenance.identity,
      schemaVersion: provenance.manifest.schemaVersion,
      entries: provenance.manifest.entries
    },
    validationStatus: "candidate-not-approved",
    validationEvidence: {
      status: "candidate-not-approved",
      workflowRun: workflowRunUrl,
      checks: [
        "typecheck",
        "lint",
        "unit-coverage",
        "architecture-boundary",
        "privacy-surface",
        "production-build",
        "browser-e2e",
        "nested-host-e2e"
      ].map((name) => ({
        name,
        status: inReleaseWorkflow ? "executed-before-manifest" : "not-asserted",
        reference: workflowRunUrl
      })),
      pending: [
        { name: "hosted-games-site-preview", status: "pending", reference: null },
        { name: "named-human-approval-gates", status: "pending", reference: null },
        { name: "independent-science-review", status: "pending", reference: null }
      ]
    },
    files
  };
}

async function main() {
  await fs.access(path.join(distDir, ENTRY_FILE));
  const next = await buildManifest();

  if (checkOnly) {
    const current = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    const comparable = JSON.stringify({ ...current, files: next.files });
    const expected = JSON.stringify({ ...next, files: next.files });
    if (comparable !== expected) {
      throw new Error("release-manifest.json does not match the current dist payload");
    }
    console.log(`Release manifest verified against ${distDir}`);
    return;
  }

  await fs.writeFile(manifestPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  const count = Object.keys(next.files).length;
  console.log(
    `Release manifest written for ${GAME_SLUG} ${next.version} (${count} payload files, commit ${next.commit})`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
