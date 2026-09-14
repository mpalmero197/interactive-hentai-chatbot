"use client";

import Link from "next/link";
import { useRef } from "react";
import { clothingLabel } from "@/lib/clothing";
import {
  buildExportBundle,
  parseImportBundle,
} from "@/lib/storage";
import type { Character } from "@/lib/types";
import {
  deleteCharacter,
  replaceAllCharacters,
  useCharacters,
} from "@/stores/characterStore";
import { getAllThreads, replaceAllThreads } from "@/stores/chatStore";

export function HomeClient() {
  const characters = useCharacters();
  const fileRef = useRef<HTMLInputElement>(null);

  function exportAll() {
    const bundle = buildExportBundle(characters, getAllThreads());
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "afterglow-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(file: File) {
    const raw = await file.text();
    const bundle = parseImportBundle(raw);
    replaceAllCharacters(bundle.characters);
    const threads: Record<string, (typeof bundle.threads)[number]> = {};
    for (const t of bundle.threads ?? []) threads[t.characterId] = t;
    replaceAllThreads(threads);
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-amber-200/60">
            Adult companion studio
          </p>
          <h1 className="mt-1 font-serif text-3xl text-rose-50 sm:text-4xl">Afterglow</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-rose-100/60">
            Build a girl from a sentence. Talk to her. Pull the straps. Put her to sleep.
            Strip her if you want.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/create"
            className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white"
          >
            Create new
          </Link>
          <button
            type="button"
            onClick={exportAll}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70"
          >
            Export
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70"
          >
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {characters.map((c) => (
          <CharacterCard key={c.id} character={c} />
        ))}
      </section>
    </div>
  );
}

function CharacterCard({ character }: { character: Character }) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-white/8 bg-[#160b12] p-4">
      <div>
        <div className="mb-3 flex gap-1.5">
          <Swatch color={character.appearance.hair.color} />
          <Swatch color={character.appearance.eyes.color} />
          <Swatch color={character.appearance.skinTone} />
          <Swatch color={character.appearance.outfit.top.color} />
        </div>
        <h2 className="font-serif text-xl text-rose-50">{character.name}</h2>
        <p className="mt-1 line-clamp-2 text-xs text-white/45">{character.description}</p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-amber-200/50">
          {character.personality.traits.slice(0, 3).join(" · ") || "unmarked"} ·{" "}
          {clothingLabel(character.appearance)}
        </p>
      </div>
      <div className="mt-4 flex gap-2">
        <Link
          href={`/play/${character.id}`}
          className="flex-1 rounded-xl bg-rose-500/90 py-2 text-center text-sm font-medium text-white"
        >
          Play
        </Link>
        <Link
          href={`/create?id=${character.id}`}
          className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/60"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={() => deleteCharacter(character.id)}
          className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/40"
        >
          Del
        </button>
      </div>
    </article>
  );
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      className="h-5 w-5 rounded-full border border-white/15"
      style={{ background: color }}
    />
  );
}
