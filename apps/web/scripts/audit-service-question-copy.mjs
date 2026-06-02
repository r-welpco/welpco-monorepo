/**
 * Audits FR service-question copy against all BFF seed English strings.
 * Exit 1 if any missing or untranslated (value === English).
 *
 *   node apps/web/scripts/audit-service-question-copy.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");

const SEED_FILES = [
  path.join(webRoot, "../bff/src/database/seeds/service-selection-question-definitions.ts"),
  path.join(webRoot, "../bff/src/database/seeds/seed-content.ts"),
];

const FR_PATH = path.join(webRoot, "messages/service-question-copy.fr.json");
const BUILD_SCRIPT_FR = path.join(__dirname, "build-service-question-copy-fr.mjs");

/** English === French is acceptable for these CMS strings (true cognates in fr-CA). */
const COGNATE_OK = new Set([
  "Description",
  "Urgent",
  "TV",
  "SUV",
  "Online",
  "Interior",
  "Exterior",
  "Moderate",
  "Family",
  "Question 1",
]);

const OPTIONAL_SOURCES = [
  path.join(webRoot, "../bff/test/content.e2e-spec.ts"),
  path.join(webRoot, "../bff/src/modules/content/content.service.spec.ts"),
];

function extractFromFile(filePath) {
  const s = fs.readFileSync(filePath, "utf8");
  const labels = new Set();
  const placeholders = new Set();
  const helpTexts = new Set();
  const optionLabels = new Set();

  for (const m of s.matchAll(/^\s+label:\s*['"]([^'"]+)['"],?\s*$/gm)) labels.add(m[1]);
  for (const m of s.matchAll(/placeholder:\s*['"]([^'"]+)['"]/g)) placeholders.add(m[1]);
  for (const m of s.matchAll(/helpText:\s*(['"])([\s\S]*?)\1/g)) helpTexts.add(m[2]);
  for (const m of s.matchAll(/\{\s*value:\s*['"][^'"]+['"],\s*label:\s*['"]([^'"]+)['"]\s*\}/g)) {
    optionLabels.add(m[1]);
  }

  return { labels, placeholders, helpTexts, optionLabels };
}

function mergeSets() {
  const merged = {
    labels: new Set(),
    placeholders: new Set(),
    helpTexts: new Set(),
    optionLabels: new Set(),
  };
  for (const f of SEED_FILES) {
    const e = extractFromFile(f);
    for (const key of Object.keys(merged)) {
      e[key].forEach((x) => merged[key].add(x));
    }
  }
  return merged;
}

function loadBuildScriptFrKeys() {
  const src = fs.readFileSync(BUILD_SCRIPT_FR, "utf8");
  const frBlock = src.match(/const FR = \{([\s\S]*?)\n\};/);
  if (!frBlock) return new Set();
  const keys = new Set();
  for (const m of frBlock[1].matchAll(/^\s*(?:"([^"]+)"|([A-Za-z][A-Za-z0-9]*)):\s/gm)) {
    keys.add(m[1] ?? m[2]);
  }
  return keys;
}

function auditBucket(bucket, enSet, frMap, scriptFrKeys) {
  const missing = [];
  const untranslated = [];
  const missingFromScript = [];

  for (const en of [...enSet].sort()) {
    if (!(en in frMap)) {
      missing.push(en);
      continue;
    }
    if (frMap[en] === en && !COGNATE_OK.has(en)) untranslated.push(en);
    if (!scriptFrKeys.has(en)) missingFromScript.push(en);
  }

  return {
    bucket,
    total: enSet.size,
    missing,
    untranslated,
    missingFromScript,
    ok: missing.length === 0 && untranslated.length === 0,
  };
}

const merged = mergeSets();
const fr = JSON.parse(fs.readFileSync(FR_PATH, "utf8"));
const scriptFrKeys = loadBuildScriptFrKeys();

console.log("Service question copy audit\n");
console.log("Sources:", SEED_FILES.map((f) => path.relative(process.cwd(), f)).join("\n         "));
console.log("FR file:", path.relative(process.cwd(), FR_PATH), "\n");

const results = ["labels", "placeholders", "helpTexts", "optionLabels"].map((b) =>
  auditBucket(b, merged[b], fr[b] ?? {}, scriptFrKeys),
);

let failed = false;
for (const r of results) {
  const status = r.ok ? "OK" : "FAIL";
  console.log(`[${status}] ${r.bucket}: ${r.total} EN strings`);
  if (r.missing.length) {
    failed = true;
    console.log("  Missing from service-question-copy.fr.json:");
    r.missing.forEach((x) => console.log(`    - ${x}`));
  }
  if (r.untranslated.length) {
    failed = true;
    console.log("  Present but identical to EN (needs FR in build script):");
    r.untranslated.forEach((x) => console.log(`    - ${x}`));
  }
}

const allEn = new Set([
  ...merged.labels,
  ...merged.placeholders,
  ...merged.helpTexts,
  ...merged.optionLabels,
]);
const orphanFr = [];
for (const bucket of ["labels", "placeholders", "helpTexts", "optionLabels"]) {
  for (const key of Object.keys(fr[bucket] ?? {})) {
    if (!merged[bucket].has(key)) orphanFr.push(`${bucket}: ${key}`);
  }
}
if (orphanFr.length) {
  console.log(`\n[WARN] ${orphanFr.length} FR keys not in current seeds (stale?):`);
  orphanFr.slice(0, 15).forEach((x) => console.log(`  - ${x}`));
  if (orphanFr.length > 15) console.log(`  ... and ${orphanFr.length - 15} more`);
}

const scriptOnly = [...scriptFrKeys].filter((k) => !allEn.has(k));
if (scriptOnly.length) {
  console.log(`\n[INFO] ${scriptOnly.length} keys in build script not found in seeds (may be legacy):`);
  scriptOnly.slice(0, 10).forEach((x) => console.log(`  - ${x}`));
}

console.log("\n--- Summary ---");
console.log(
  `Labels: ${merged.labels.size} | Placeholders: ${merged.placeholders.size} | Help: ${merged.helpTexts.size} | Options: ${merged.optionLabels.size}`,
);
console.log(`Total unique EN strings: ${allEn.size}`);

const optionalMerged = { labels: new Set(), placeholders: new Set(), helpTexts: new Set(), optionLabels: new Set() };
for (const f of OPTIONAL_SOURCES) {
  if (!fs.existsSync(f)) continue;
  const e = extractFromFile(f);
  for (const key of Object.keys(optionalMerged)) {
    e[key].forEach((x) => optionalMerged[key].add(x));
  }
}
const optionalMissing = [];
for (const bucket of ["labels", "placeholders", "helpTexts", "optionLabels"]) {
  const frMap = fr[bucket] ?? {};
  for (const en of optionalMerged[bucket]) {
    if (!(en in frMap) || (frMap[en] === en && !COGNATE_OK.has(en))) {
      optionalMissing.push(`${bucket}: ${en}`);
    }
  }
}
if (optionalMissing.length) {
  console.log(`\n[WARN] ${optionalMissing.length} test-only strings not fully covered (non-blocking):`);
  optionalMissing.forEach((x) => console.log(`  - ${x}`));
}

if (failed) {
  console.log("\nAudit FAILED. Update FR in build-service-question-copy-fr.mjs and regenerate.");
  process.exit(1);
}
console.log("\nAudit PASSED — all production seed strings have FR copy.");
if (COGNATE_OK.size) {
  const usedCognates = [...COGNATE_OK].filter(
    (k) =>
      merged.labels.has(k) ||
      merged.placeholders.has(k) ||
      merged.helpTexts.has(k) ||
      merged.optionLabels.has(k),
  );
  if (usedCognates.length) {
    console.log(`Cognates (EN=FR allowed): ${usedCognates.join(", ")}`);
  }
}
