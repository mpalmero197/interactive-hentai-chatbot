"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  applyClothingPatch,
  clothingLabel,
  redress,
  stripAll,
} from "@/lib/clothing";
import type { Character } from "@/lib/types";
import { patchCharacter, useCharacters } from "@/stores/characterStore";
import { CharacterStage } from "./CharacterStage";
import { ChatPanel } from "./ChatPanel";

export function PlayClient({ id }: { id: string }) {
  const characters = useCharacters();
  const character = useMemo(
    () => characters.find((c) => c.id === id),
    [characters, id],
  );

  if (!character) {
    return (
      <div className="space-y-3">
        <p className="text-rose-100/70">No character with that id on this device.</p>
        <Link href="/" className="text-sm text-rose-300 underline">
          Back home
        </Link>
      </div>
    );
  }

  function setSleep(isSleeping: boolean) {
    patchCharacter(character!.id, { isSleeping });
  }

  function dress(next: Character["appearance"]) {
    patchCharacter(character!.id, { appearance: next });
  }

  const o = character.appearance.outfit;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-amber-200/55">
            {character.isSleeping ? "asleep" : "awake"} · {clothingLabel(character.appearance)}
          </p>
          <h1 className="font-serif text-2xl text-rose-50">{character.name}</h1>
        </div>
        <Link href={`/create?id=${character.id}`} className="text-sm text-white/45 hover:text-rose-100">
          Edit look
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,400px)] lg:items-stretch">
        <div className="flex flex-col gap-3">
          <div className="h-[58vh] min-h-[360px] lg:h-[min(72vh,760px)]">
            <CharacterStage
              character={character}
              onClothing={(patch) =>
                dress(applyClothingPatch(character.appearance, patch))
              }
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSleep(!character.isSleeping)}
              className="rounded-xl bg-white/8 px-3 py-2 text-sm text-rose-50"
            >
              {character.isSleeping ? "Wake" : "Sleep"}
            </button>
            <button
              type="button"
              onClick={() =>
                dress(
                  applyClothingPatch(character.appearance, {
                    topRemoved: true,
                    pullDown: 1,
                    leftStrap: 1,
                    rightStrap: 1,
                  }),
                )
              }
              className="rounded-xl bg-white/8 px-3 py-2 text-sm text-rose-50"
            >
              Top off
            </button>
            <button
              type="button"
              onClick={() =>
                dress(
                  applyClothingPatch(character.appearance, {
                    bottomRemoved: true,
                    bottomPulled: 1,
                  }),
                )
              }
              className="rounded-xl bg-white/8 px-3 py-2 text-sm text-rose-50"
            >
              Bottoms off
            </button>
            <button
              type="button"
              onClick={() =>
                dress(
                  applyClothingPatch(character.appearance, {
                    underwearRemoved: true,
                    underwearPulled: 1,
                  }),
                )
              }
              className="rounded-xl bg-white/8 px-3 py-2 text-sm text-rose-50"
            >
              Underwear off
            </button>
            <button
              type="button"
              onClick={() => dress(stripAll(character.appearance))}
              className="rounded-xl bg-rose-500 px-3 py-2 text-sm font-medium text-white"
            >
              Strip all
            </button>
            <button
              type="button"
              onClick={() => dress(redress(character.appearance))}
              className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white/70"
            >
              Redress
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-white/35">
            Grab the gold beads. Straps are thin elastic — they stretch and bounce. The top
            is soft fabric (slides and sags). Skirts/shorts are heavier and keep moving after
            you let go. Underwear is lace. Release early and it springs back; pull past the
            drop point and it slides off. Current straps{" "}
            {Math.round(o.top.leftStrap * 100)}/{Math.round(o.top.rightStrap * 100)}.
          </p>
        </div>
        <div className="h-[min(70vh,640px)] min-h-[320px] lg:h-[min(72vh,760px)]">
          <ChatPanel character={character} />
        </div>
      </div>
    </div>
  );
}
