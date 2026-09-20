/**
 * Dictionary key audit.
 *
 * Scans the source for literal i18n keys ("app.…") and verifies that every key
 * exists in both the German and the English dictionary. Run with:
 *
 *   npx tsx scripts/check-keys.ts
 *
 * Exits with code 1 when keys are missing so it can be wired into CI later.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { dictionaries } from "../src/lib/i18n/dictionaries";

const root = resolve(process.cwd(), "src");
const files: string[] = [];

function walk(dir: string) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry)) files.push(full);
  }
}

walk(root);

const keyPattern = /"app\.[a-zA-Z0-9_.]+"|'app\.[a-zA-Z0-9_.]+'|"app\.[a-zA-Z0-9_.]+"/g;
const used = new Map<string, Set<string>>();

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const matches = source.match(keyPattern);
  if (!matches) continue;
  for (const raw of matches) {
    const key = raw.slice(1, -1);
    // Skip template fragments and dynamic segments.
    if (key.includes("$")) continue;
    if (!used.has(key)) used.set(key, new Set());
    used.get(key)!.add(file.replace(root + "/", ""));
  }
}

function resolveKey(dict: unknown, key: string): boolean {
  const parts = key.split(".");
  let node: unknown = dict;
  for (const part of parts) {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return false;
    }
  }
  return typeof node === "string";
}

const missing: [string, string[]][] = [];
for (const [key, sources] of [...used.entries()].sort()) {
  if (!resolveKey(dictionaries.de, key) || !resolveKey(dictionaries.en, key)) {
    missing.push([key, [...sources]]);
  }
}

console.log(`Checked ${used.size} literal dictionary keys in ${files.length} files.`);

if (missing.length === 0) {
  console.log("All referenced keys exist in DE and EN.");
} else {
  console.log(`\n${missing.length} missing keys:\n`);
  for (const [key, sources] of missing) {
    console.log(`  ${key}`);
    for (const source of sources.slice(0, 3)) console.log(`      ${source}`);
  }
  process.exitCode = 1;
}
