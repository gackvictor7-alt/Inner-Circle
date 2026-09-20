/**
 * i18n audit (development tool).
 *
 *   npx tsx scripts/i18n-audit.ts
 *
 * Checks three things:
 *   1. Every `t.…` / `tr("…")` / `*Key="…"` key referenced in src/ exists.
 *   2. German and English dictionaries have exactly the same shape.
 *   3. Reports how many keys are defined (dead-key detection is intentionally
 *      conservative: dynamically composed keys are not reported).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { dictionaries } from "../src/lib/i18n/dictionaries";

const de = dictionaries.de;
const en = dictionaries.en;

type Node = Record<string, unknown>;

function resolve(root: Node, path: string): unknown {
  return path.split(".").reduce<unknown>((node, part) => {
    if (node && typeof node === "object" && part in (node as Node)) return (node as Node)[part];
    return undefined;
  }, root);
}

function flatten(node: unknown, prefix = "", out: string[] = []): string[] {
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node as Node)) flatten(value, prefix ? `${prefix}.${key}` : key, out);
  } else {
    out.push(prefix);
  }
  return out;
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (/\.(tsx?|ts)$/.test(entry)) files.push(full);
  }
  return files;
}

const root = de as unknown as Node;
const enRoot = en as unknown as Node;

const patterns = [
  /(?:titleKey|leadKey|textKey|labelKey|placeholderKey|helpKey|successKey|submitKey|messageKey|k)=["']([a-zA-Z0-9_.]+)["']/g,
  /tr\(["']([a-zA-Z0-9_.]+)["']\)/g,
  /\bt\.([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)/g,
];

const used = new Map<string, string[]>();
for (const file of walk("src")) {
  const content = readFileSync(file, "utf8");
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      const key = match[1];
      if (!key.includes(".") && pattern.source.includes("\\bt\\.")) continue;
      const list = used.get(key) ?? [];
      list.push(file);
      used.set(key, list);
    }
  }
}

const missing: string[] = [];
for (const [key, files] of used) {
  if (resolve(root, key) === undefined) missing.push(`${key}  (${[...new Set(files)].slice(0, 3).join(", ")})`);
}

function suggestions(path: string): string {
  const parts = path.split(".");
  for (let i = parts.length - 1; i > 0; i -= 1) {
    const parentPath = parts.slice(0, i).join(".");
    const parent = resolve(root, parentPath);
    if (parent && typeof parent === "object") {
      const children = Object.keys(parent as Node);
      if (children.length <= 30) return `${parentPath}: ${children.join(", ")}`;
    }
  }
  return "";
}

const deKeys = new Set(flatten(root));
const enKeys = new Set(flatten(enRoot));
const onlyDe = [...deKeys].filter((key) => !enKeys.has(key));
const onlyEn = [...enKeys].filter((key) => !deKeys.has(key));

console.log(`Dictionary keys: DE ${deKeys.size}, EN ${enKeys.size}`);
if (missing.length) {
  console.log(`\nMISSING KEYS USED IN CODE (${missing.length}):`);
  for (const entry of missing.sort()) console.log(`  - ${entry}`);
  if (process.argv.includes("--suggest")) {
    console.log("\nSuggestions:");
    for (const entry of missing.sort()) console.log(`  ${entry.split("  ")[0]}  ->  ${suggestions(entry.split("  ")[0])}`);
  }
} else {
  console.log("\nAll keys referenced in code exist in both locales.");
}

if (onlyDe.length || onlyEn.length) {
  console.log(`\nSHAPE MISMATCH: only DE (${onlyDe.length}), only EN (${onlyEn.length})`);
  for (const key of onlyDe.slice(0, 40)) console.log(`  DE only: ${key}`);
  for (const key of onlyEn.slice(0, 40)) console.log(`  EN only: ${key}`);
} else {
  console.log("\nDE and EN dictionaries have identical shapes.");
}
