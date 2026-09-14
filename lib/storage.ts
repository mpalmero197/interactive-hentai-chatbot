import { demoCharacter } from "./schema";
import type { Character, ChatThread, ExportBundle } from "./types";

const CHAR_KEY = "ihc.characters.v1";
const THREAD_KEY = "ihc.threads.v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function loadCharacters(): Character[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(CHAR_KEY);
    if (!raw) return [demoCharacter()];
    const parsed = JSON.parse(raw) as Character[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [demoCharacter()];
    return parsed;
  } catch {
    return [demoCharacter()];
  }
}

export function saveCharacters(characters: Character[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(CHAR_KEY, JSON.stringify(characters));
}

export function loadThreads(): Record<string, ChatThread> {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(THREAD_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ChatThread>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveThreads(threads: Record<string, ChatThread>): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(THREAD_KEY, JSON.stringify(threads));
}

export function buildExportBundle(
  characters: Character[],
  threads: Record<string, ChatThread>,
): ExportBundle {
  return {
    version: 1,
    exportedAt: Date.now(),
    characters,
    threads: Object.values(threads),
  };
}

export function parseImportBundle(raw: string): ExportBundle {
  const data = JSON.parse(raw) as ExportBundle;
  if (!data || data.version !== 1 || !Array.isArray(data.characters)) {
    throw new Error("Invalid Afterglow export file");
  }
  return data;
}
