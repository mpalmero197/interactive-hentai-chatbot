"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { requestModelReply } from "@/lib/chat";
import { clothingLabel } from "@/lib/schema";
import type { Character } from "@/lib/types";
import { appendMessage, clearThread, useThread } from "@/stores/chatStore";
import { patchCharacter } from "@/stores/characterStore";

interface Props {
  character: Character;
}

export function ChatPanel({ character }: Props) {
  const messages = useThread(character.id);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<"local" | "openai" | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages.length, busy]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setDraft("");
    appendMessage(character.id, { role: "user", content: trimmed });
    setBusy(true);
    try {
      const reply = await requestModelReply(character, messages, trimmed);
      if (reply.sleepIntent === "sleep") {
        patchCharacter(character.id, { isSleeping: true });
      } else if (reply.sleepIntent === "wake") {
        patchCharacter(character.id, { isSleeping: false });
      }
      appendMessage(character.id, { role: "assistant", content: reply.content });
      setSource(reply.source);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(draft);
  }

  return (
    <div className="flex h-full min-h-[360px] flex-col overflow-hidden rounded-2xl border border-rose-400/15 bg-[#160b12]/90">
      <header className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-rose-300/70">
            chat · {character.personality.traits.slice(0, 3).join(" · ")}
          </p>
          <h2 className="font-medium text-rose-50">{character.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          {source && (
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/40">
              {source}
            </span>
          )}
          <button
            type="button"
            onClick={() => clearThread(character.id)}
            className="text-[11px] text-white/40 hover:text-rose-200"
          >
            Clear
          </button>
        </div>
      </header>

      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-sm leading-relaxed text-rose-100/55">
            {character.name} is {character.isSleeping ? "asleep" : "here"}.{" "}
            {character.personality.description} Outfit:{" "}
            {clothingLabel(character.appearance)}.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-8 rounded-2xl rounded-br-sm bg-rose-500/15 px-3 py-2 text-sm text-rose-50"
                : "mr-8 rounded-2xl rounded-bl-sm bg-white/5 px-3 py-2 text-sm text-rose-50/90"
            }
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="mr-8 text-xs uppercase tracking-[0.18em] text-rose-200/40">
            typing
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="border-t border-white/5 p-3">
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              character.isSleeping
                ? "She's out. Wake her, or let her sleep…"
                : `Talk to ${character.name}…`
            }
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-rose-50 outline-none placeholder:text-white/25 focus:border-rose-400/40"
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Send
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["go to sleep", "wake up", "pull the straps", "come here"].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => void send(q)}
              className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-white/50 hover:border-rose-300/40 hover:text-rose-100"
            >
              {q}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
