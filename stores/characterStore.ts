"use client";

import { useSyncExternalStore } from "react";
import { normalizeAppearance } from "@/lib/clothing";
import { demoCharacter } from "@/lib/schema";
import { loadCharacters, saveCharacters } from "@/lib/storage";
import type { Character } from "@/lib/types";

function normalizeCharacter(c: Character): Character {
  return { ...c, appearance: normalizeAppearance(c.appearance) };
}

type Listener = () => void;

let hydrated = false;
let characters: Character[] = [];
const listeners = new Set<Listener>();

function emit() {
  if (hydrated) saveCharacters(characters);
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  characters = loadCharacters().map(normalizeCharacter);
  if (!characters.some((c) => c.id === "demo-redhead")) {
    characters = [demoCharacter(), ...characters];
  }
  hydrated = true;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Character[] {
  hydrate();
  return characters;
}

function getServerSnapshot(): Character[] {
  return [];
}

export function useCharacters(): Character[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function upsertCharacter(character: Character): void {
  hydrate();
  const idx = characters.findIndex((c) => c.id === character.id);
  const next = normalizeCharacter({ ...character, updatedAt: Date.now() });
  if (idx === -1) characters = [next, ...characters];
  else {
    const copy = characters.slice();
    copy[idx] = next;
    characters = copy;
  }
  emit();
}

export function getCharacter(id: string): Character | undefined {
  hydrate();
  return characters.find((c) => c.id === id);
}

export function deleteCharacter(id: string): void {
  hydrate();
  characters = characters.filter((c) => c.id !== id);
  emit();
}

export function patchCharacter(
  id: string,
  patch: Partial<Character> | ((c: Character) => Character),
): Character | undefined {
  hydrate();
  const current = characters.find((c) => c.id === id);
  if (!current) return undefined;
  const next =
    typeof patch === "function"
      ? patch(current)
      : { ...current, ...patch, updatedAt: Date.now() };
  upsertCharacter({ ...next, updatedAt: Date.now() });
  return next;
}

export function replaceAllCharacters(next: Character[]): void {
  hydrate();
  characters = next;
  emit();
}
