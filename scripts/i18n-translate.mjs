#!/usr/bin/env node
/**
 * One-shot / on-demand machine translation for next-intl message trees.
 *
 * Does NOT run on `next build`. Run manually when English source keys change:
 *
 *   GOOGLE_TRANSLATE_API_KEY=... npm run i18n:translate -- --to fr
 *
 * Behavior:
 * - Reads messages/en.json (source of truth)
 * - Merges into messages/{locale}.generated.json
 * - Skips keys that already exist in generated OR manual files (unless --force)
 * - Never overwrites messages/{locale}.manual.json
 *
 * Requires Google Cloud Translation API key (free tier ~500k chars/month).
 * Without a key, the script exits with instructions (committed fr.generated.json
 * is already seeded and safe to ship).
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const messagesDir = resolve(root, "messages");
const envFiles = [resolve(root, ".env.local"), resolve(root, ".env")];
const MAX_TEXT_SEGMENTS_PER_REQUEST = 100;

function parseArgs(argv) {
  const out = { to: ["fr"], force: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--to" && argv[i + 1]) {
      out.to = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    } else if (arg === "--force") {
      out.force = true;
    }
  }
  return out;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function flatten(obj, prefix = "", out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(value)) flatten(value, path, out);
    else out[path] = String(value);
  }
  return out;
}

function unflatten(flat) {
  const out = {};
  for (const [path, value] of Object.entries(flat)) {
    const parts = path.split(".");
    let cursor = out;
    for (let i = 0; i < parts.length - 1; i++) {
      cursor[parts[i]] ??= {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
  }
  return out;
}

function readJson(path) {
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, "utf8"));
}

function loadDotEnvFile(path) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!key || process.env[key] !== undefined) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function translateBatch(texts, target, apiKey) {
  const placeholders = texts.map((value) => [...value.matchAll(/\{[A-Za-z][A-Za-z0-9_]*\}/g)].map((match) => match[0]));
  const protectedTexts = texts.map((value, textIndex) =>
    placeholders[textIndex].reduce(
      (result, placeholder, placeholderIndex) => result.replaceAll(placeholder, `__I18N_${placeholderIndex}__`),
      value
    )
  );
  const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: protectedTexts,
      source: "en",
      target,
      format: "text",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Translate API ${res.status}: ${body}`);
  }
  const data = await res.json();
  return data.data.translations.map((t, textIndex) =>
    placeholders[textIndex].reduce(
      (result, placeholder, placeholderIndex) => result.replaceAll(`__I18N_${placeholderIndex}__`, placeholder),
      t.translatedText
    )
  );
}

async function translateInChunks(texts, target, apiKey) {
  const translated = [];
  for (let i = 0; i < texts.length; i += MAX_TEXT_SEGMENTS_PER_REQUEST) {
    const chunk = texts.slice(i, i + MAX_TEXT_SEGMENTS_PER_REQUEST);
    const chunkTranslated = await translateBatch(chunk, target, apiKey);
    translated.push(...chunkTranslated);
  }
  return translated;
}

async function main() {
  envFiles.forEach(loadDotEnvFile);
  const { to, force } = parseArgs(process.argv.slice(2));
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY?.trim();

  if (!apiKey) {
    console.error(`Missing GOOGLE_TRANSLATE_API_KEY.

This script is intentionally opt-in (not part of next build).

Seeded files already exist at messages/*.generated.json.
To refresh missing keys from Google Cloud Translation:

  GOOGLE_TRANSLATE_API_KEY=your_key npm run i18n:translate -- --to fr
`);
    process.exit(1);
  }

  const en = readJson(resolve(messagesDir, "en.json"));
  const enFlat = flatten(en);

  for (const locale of to) {
    if (locale === "en") continue;

    const generatedPath = resolve(messagesDir, `${locale}.generated.json`);
    const manualPath = resolve(messagesDir, `${locale}.manual.json`);
    const generatedFlat = flatten(readJson(generatedPath));
    const manualFlat = flatten(readJson(manualPath));

    const missing = [];
    for (const [key, value] of Object.entries(enFlat)) {
      if (!force && (key in generatedFlat || key in manualFlat)) continue;
      if (!force && key in manualFlat) continue;
      missing.push({ key, value });
    }

    if (missing.length === 0) {
      console.log(`[${locale}] nothing to translate`);
      continue;
    }

    console.log(`[${locale}] translating ${missing.length} string(s)…`);
    const translated = await translateInChunks(
      missing.map((m) => m.value),
      locale,
      apiKey
    );

    const nextGenerated = force ? {} : { ...generatedFlat };
    missing.forEach((item, index) => {
      // Do not overwrite manual keys even with --force
      if (item.key in manualFlat) return;
      nextGenerated[item.key] = translated[index];
    });

    const tree = unflatten(nextGenerated);
    writeFileSync(generatedPath, `${JSON.stringify(tree, null, 2)}\n`, "utf8");
    console.log(`[${locale}] wrote ${generatedPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
