import type { Locale } from "./config";
import en from "../../messages/en.json";
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

/**
 * Locale message resolution:
 * 1. English source (`messages/en.json`) as base
 * 2. Machine-generated (`messages/{locale}.generated.json`)
 * 3. Manual overrides (`messages/{locale}.manual.json`) — win over generated
 *
 * Generated files are produced by `npm run i18n:translate` (not on every build).
 */
export async function loadMessages(locale: Locale): Promise<MessageTree> {
  if (locale === "en") {
    return en as MessageTree;
  }

  if (locale === "fr") {
    return mergeMessages(en as MessageTree, frGenerated as MessageTree, frManual as MessageTree);
  }

  if (locale === "es") {
    return mergeMessages(en as MessageTree, esGenerated as MessageTree);
  }

  if (locale === "zh") {
    return mergeMessages(en as MessageTree, zhGenerated as MessageTree, zhManual as MessageTree);
  }

  return en as MessageTree;
}
