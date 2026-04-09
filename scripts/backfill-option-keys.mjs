#!/usr/bin/env node
// One-shot backfill for option `key` + per-option `available` fields.
//
// Keystatic recently gained stable identifiers for option groups/options so
// that a new `option_overrides` table in Postgres can store per-option
// availability without being fragile to name changes. Existing items don't
// have these fields yet — this script walks every item JSON and adds them:
//
//   - group.key       ← slugified group.name.en (if missing)
//   - option.key      ← slugified option.name.en (if missing)
//   - option.available ← true (if missing)
//
// Run once, eyeball the diff, commit. Idempotent — safe to re-run.

import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ITEMS_DIR = new URL("../content/items/", import.meta.url);

function slugify(input) {
  return String(input ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureUnique(base, taken) {
  if (!taken.has(base)) {
    taken.add(base);
    return base;
  }
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  const next = `${base}-${i}`;
  taken.add(next);
  return next;
}

async function findItemFiles() {
  const root = new URL(ITEMS_DIR);
  const entries = await readdir(root);
  const files = [];
  for (const name of entries) {
    const full = join(root.pathname, name);
    const s = await stat(full);
    if (s.isFile() && name.endsWith(".json")) {
      files.push(full);
      continue;
    }
    if (s.isDirectory()) {
      const indexPath = join(full, "index.json");
      try {
        await stat(indexPath);
        files.push(indexPath);
      } catch {
        /* no index.json, skip */
      }
    }
  }
  return files;
}

async function processFile(path) {
  const raw = await readFile(path, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data.optionGroups)) return { path, changed: false };

  let changed = false;
  const groupKeys = new Set();

  for (const group of data.optionGroups) {
    if (!group.key || typeof group.key !== "string" || group.key.length === 0) {
      const base = slugify(group?.name?.en) || "group";
      group.key = ensureUnique(base, groupKeys);
      changed = true;
    } else {
      groupKeys.add(group.key);
    }

    if (!Array.isArray(group.options)) continue;
    const optionKeys = new Set();
    for (const option of group.options) {
      if (
        !option.key ||
        typeof option.key !== "string" ||
        option.key.length === 0
      ) {
        const base = slugify(option?.name?.en) || "option";
        option.key = ensureUnique(base, optionKeys);
        changed = true;
      } else {
        optionKeys.add(option.key);
      }
      if (typeof option.available !== "boolean") {
        option.available = true;
        changed = true;
      }
    }
  }

  if (changed) {
    await writeFile(path, JSON.stringify(data, null, 2) + "\n", "utf8");
  }
  return { path, changed };
}

async function main() {
  const files = await findItemFiles();
  if (files.length === 0) {
    console.log("No item JSON files found under content/items/");
    return;
  }
  let updated = 0;
  for (const f of files) {
    const { changed } = await processFile(f);
    const rel = f.replace(process.cwd() + "/", "");
    console.log(`${changed ? "updated " : "unchanged"} ${rel}`);
    if (changed) updated++;
  }
  console.log(`\nDone. ${updated}/${files.length} file(s) updated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
