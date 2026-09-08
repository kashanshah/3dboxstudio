import type { Locale } from "./config";
import en from "../../messages/en.json";
import deGenerated from "../../messages/de.generated.json";
import esGenerated from "../../messages/es.generated.json";
import frGenerated from "../../messages/fr.generated.json";
import frManual from "../../messages/fr.manual.json";
import zhGenerated from "../../messages/zh.generated.json";
import zhManual from "../../messages/zh.manual.json";

export type MessageTree = Record<string, unknown>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Deep-merge message trees. Later sources win on leaf conflicts. */
export function mergeMessages(...sources: MessageTree[]): MessageTree {
  const out: MessageTree = {};
  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      if (isPlainObject(value) && isPlainObject(out[key])) {
        out[key] = mergeMessages(out[key] as MessageTree, value);
      } else {
        out[key] = value;
      }
    }
  }
  return out;
}

function logMissingKeys(locale: Locale, merged: MessageTree, base: MessageTree, path = ""): void {
  if (process.env.NODE_ENV !== "development") return;
  for (const [key, value] of Object.entries(base)) {
    const nextPath = path ? `${path}.${key}` : key;
    if (isPlainObject(value)) {
      const child = merged[key];
      if (isPlainObject(child)) {
        logMissingKeys(locale, child, value, nextPath);
      } else {
        console.warn(`[i18n] missing namespace for ${locale}: ${nextPath}`);
      }
      continue;
    }
    if (!(key in merged)) {
      console.warn(`[i18n] missing key for ${locale}: ${nextPath}`);
    }
  }
}

/**
 * Locale message resolution:
 * 1. English source (`messages/en.json`) as base
 * 2. Machine-generated (`messages/{locale}.generated.json`)
 * 3. Manual overrides (`messages/{locale}.manual.json`) — win over generated
 *
 * English is always the runtime fallback for missing keys via the merge base.
 */
export async function loadMessages(locale: Locale): Promise<MessageTree> {
  if (locale === "en") {
    return en as MessageTree;
  }

  let merged: MessageTree = en as MessageTree;

  if (locale === "fr") {
    merged = mergeMessages(en as MessageTree, frGenerated as MessageTree, frManual as MessageTree);
  } else if (locale === "es") {
    merged = mergeMessages(en as MessageTree, esGenerated as MessageTree);
  } else if (locale === "de") {
    merged = mergeMessages(en as MessageTree, deGenerated as MessageTree);
  } else if (locale === "zh") {
    merged = mergeMessages(en as MessageTree, zhGenerated as MessageTree, zhManual as MessageTree);
  }

  logMissingKeys(locale, merged, en as MessageTree);
  return merged;
}
