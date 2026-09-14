"use client";

import { useSyncExternalStore } from "react";
import { loadThreads, saveThreads } from "@/lib/storage";
import type { ChatMessage, ChatThread } from "@/lib/types";

type Listener = () => void;

let hydrated = false;
let threads: Record<string, ChatThread> = {};
const listeners = new Set<Listener>();

function emit() {
  if (hydrated) saveThreads(threads);
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  threads = loadThreads();
  hydrated = true;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  hydrate();
  return threads;
}

function getServerSnapshot(): Record<string, ChatThread> {
  return {};
}

export function useThreads(): Record<string, ChatThread> {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useThread(characterId: string): ChatMessage[] {
  const all = useThreads();
  return all[characterId]?.messages ?? [];
}

export function appendMessage(
  characterId: string,
  message: Omit<ChatMessage, "id" | "createdAt"> &
    Partial<Pick<ChatMessage, "id" | "createdAt">>,
): ChatMessage {
  hydrate();
  const full: ChatMessage = {
    id: message.id ?? crypto.randomUUID(),
    createdAt: message.createdAt ?? Date.now(),
    role: message.role,
    content: message.content,
  };
  const existing = threads[characterId]?.messages ?? [];
  threads = {
    ...threads,
    [characterId]: { characterId, messages: [...existing, full] },
  };
  emit();
  return full;
}

export function clearThread(characterId: string): void {
  hydrate();
  const next = { ...threads };
  delete next[characterId];
  threads = next;
  emit();
}

export function replaceAllThreads(next: Record<string, ChatThread>): void {
  hydrate();
  threads = next;
  emit();
}

export function getAllThreads(): Record<string, ChatThread> {
  hydrate();
  return threads;
}
