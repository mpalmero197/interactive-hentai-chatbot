"use client";

import { useEffect, useRef } from "react";
import type { ClothingPatch } from "@/lib/pixi/CharacterRenderer";
import { clothingLabel } from "@/lib/schema";
import type { Character } from "@/lib/types";

interface Props {
  character: Character;
  onClothing: (patch: ClothingPatch) => void;
}

export function CharacterStage({ character, onClothing }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<import("@/lib/pixi/CharacterRenderer").CharacterRenderer | null>(
    null,
  );
  const clothingRef = useRef(onClothing);
  clothingRef.current = onClothing;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let renderer: import("@/lib/pixi/CharacterRenderer").CharacterRenderer | null =
      null;

    (async () => {
      const { CharacterRenderer } = await import("@/lib/pixi/CharacterRenderer");
      if (cancelled || !hostRef.current) return;
      renderer = new CharacterRenderer();
      await renderer.init(hostRef.current, character, (patch) =>
        clothingRef.current(patch),
      );
      if (cancelled) {
        renderer.destroy();
        return;
      }
      rendererRef.current = renderer;
    })();

    return () => {
      cancelled = true;
      renderer?.destroy();
      rendererRef.current = null;
    };
    // mount once; updates go through the other effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    rendererRef.current?.update(character);
  }, [character]);

  const label = clothingLabel(character.appearance);

  return (
    <div className="relative flex h-full min-h-[52vh] touch-none flex-col overflow-hidden rounded-2xl border border-rose-400/15 bg-[#12080e] shadow-[inset_0_0_80px_rgba(80,10,40,0.35)] sm:min-h-[420px]">
      <div ref={hostRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-amber-200/20 bg-black/45 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-amber-100/80">
        {character.isSleeping ? "asleep" : "awake"} · {label}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 text-center text-[11px] text-rose-100/55">
        Drag gold beads: left/right straps, top, bottoms, underwear. Pull all the way off.
      </div>
    </div>
  );
}
