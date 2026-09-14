"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { parseDescription } from "@/lib/parser";
import {
  BOTTOM_TYPES,
  EYE_COLOR_PRESETS,
  EYE_SHAPES,
  HAIR_COLOR_PRESETS,
  HAIR_LENGTHS,
  HAIR_STYLES,
  OUTFIT_COLORS,
  SKIN_PRESETS,
  TOP_TYPES,
  TRAIT_OPTIONS,
  UNDERWEAR_TYPES,
  createCharacter,
  defaultAppearance,
  defaultPersonality,
} from "@/lib/schema";
import { applyClothingPatch, normalizeAppearance } from "@/lib/clothing";
import type { Character, CharacterAppearance, Personality } from "@/lib/types";
import { upsertCharacter } from "@/stores/characterStore";
import { CharacterStage } from "./CharacterStage";

interface Props {
  initial?: Character;
}

export function CharacterCreator({ initial }: Props) {
  const router = useRouter();
  const [description, setDescription] = useState(
    initial?.description ??
      "petite redhead with green eyes, large bust, spaghetti-strap top, teasing and affectionate",
  );
  const [name, setName] = useState(initial?.name ?? "Akari");
  const [appearance, setAppearance] = useState<CharacterAppearance>(
    normalizeAppearance(initial?.appearance ?? defaultAppearance()),
  );
  const [personality, setPersonality] = useState<Personality>(
    initial?.personality ?? defaultPersonality(),
  );
  const [notes, setNotes] = useState<string[]>([]);

  const preview = useMemo<Character>(
    () =>
      createCharacter({
        id: initial?.id ?? "preview",
        name: name || "Unnamed",
        description,
        appearance,
        personality,
        isSleeping: false,
      }),
    [appearance, description, initial?.id, name, personality],
  );

  function parseNow() {
    const parsed = parseDescription(description);
    setAppearance(parsed.appearance);
    setPersonality(parsed.personality);
    setNotes(parsed.notes);
    if (!initial) setName(parsed.name);
  }

  function save() {
    const character = createCharacter({
      id: initial?.id,
      name: name.trim() || "Unnamed",
      description,
      appearance,
      personality,
      createdAt: initial?.createdAt,
    });
    upsertCharacter(character);
    router.push(`/play/${character.id}`);
  }

  function patchTop(partial: Partial<CharacterAppearance["outfit"]["top"]>) {
    setAppearance({
      ...appearance,
      outfit: { ...appearance.outfit, top: { ...appearance.outfit.top, ...partial } },
    });
  }

  function toggleTrait(trait: string) {
    const has = personality.traits.includes(trait);
    const traits = has
      ? personality.traits.filter((t) => t !== trait)
      : [...personality.traits, trait].slice(0, 5);
    setPersonality({ ...personality, traits });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5">
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.2em] text-rose-300/70">
            Description
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-rose-50 outline-none focus:border-rose-400/40"
            placeholder='petite redhead with green eyes, large bust, spaghetti-strap top'
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={parseNow}
            className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white"
          >
            Parse text
          </button>
          {notes.length > 0 && (
            <p className="self-center text-xs text-white/40">
              picked up: {notes.join(", ")}
            </p>
          )}
        </div>

        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.2em] text-rose-300/70">
            Name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-rose-50 outline-none focus:border-rose-400/40"
          />
        </label>

        <section className="grid gap-4 sm:grid-cols-2">
          <Picker
            label="Hair color"
            options={HAIR_COLOR_PRESETS}
            value={appearance.hair.color}
            onChange={(color) =>
              setAppearance({ ...appearance, hair: { ...appearance.hair, color } })
            }
          />
          <Picker
            label="Eye color"
            options={EYE_COLOR_PRESETS}
            value={appearance.eyes.color}
            onChange={(color) =>
              setAppearance({ ...appearance, eyes: { ...appearance.eyes, color } })
            }
          />
          <Picker
            label="Skin"
            options={SKIN_PRESETS}
            value={appearance.skinTone}
            onChange={(skinTone) => setAppearance({ ...appearance, skinTone })}
          />
          <Picker
            label="Top color"
            options={OUTFIT_COLORS}
            value={appearance.outfit.top.color}
            onChange={(color) => patchTop({ color })}
          />
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Hair style"
            value={appearance.hair.style}
            options={HAIR_STYLES}
            onChange={(style) =>
              setAppearance({
                ...appearance,
                hair: { ...appearance.hair, style: style as CharacterAppearance["hair"]["style"] },
              })
            }
          />
          <Select
            label="Hair length"
            value={appearance.hair.length}
            options={HAIR_LENGTHS}
            onChange={(length) =>
              setAppearance({
                ...appearance,
                hair: {
                  ...appearance.hair,
                  length: length as CharacterAppearance["hair"]["length"],
                },
              })
            }
          />
          <Select
            label="Eyes"
            value={appearance.eyes.shape}
            options={[...EYE_SHAPES]}
            onChange={(shape) =>
              setAppearance({
                ...appearance,
                eyes: { ...appearance.eyes, shape: shape as CharacterAppearance["eyes"]["shape"] },
              })
            }
          />
          <Select
            label="Top"
            value={appearance.outfit.top.type}
            options={TOP_TYPES}
            onChange={(type) =>
              patchTop({ type: type as CharacterAppearance["outfit"]["top"]["type"] })
            }
          />
          <Select
            label="Bottom"
            value={appearance.outfit.bottom.type}
            options={BOTTOM_TYPES}
            onChange={(type) =>
              setAppearance({
                ...appearance,
                outfit: {
                  ...appearance.outfit,
                  bottom: {
                    ...appearance.outfit.bottom,
                    type: type as CharacterAppearance["outfit"]["bottom"]["type"],
                  },
                },
              })
            }
          />
          <Select
            label="Underwear"
            value={appearance.outfit.underwear.type}
            options={UNDERWEAR_TYPES}
            onChange={(type) =>
              setAppearance({
                ...appearance,
                outfit: {
                  ...appearance.outfit,
                  underwear: {
                    ...appearance.outfit.underwear,
                    type: type as CharacterAppearance["outfit"]["underwear"]["type"],
                  },
                },
              })
            }
          />
        </div>

        <div className="space-y-3">
          <Slider
            label="Bust"
            value={appearance.bust}
            onChange={(bust) => setAppearance({ ...appearance, bust })}
          />
          <Slider
            label="Hips"
            value={appearance.hips}
            onChange={(hips) => setAppearance({ ...appearance, hips })}
          />
          <Slider
            label="Waist (higher = thicker)"
            value={appearance.waist}
            onChange={(waist) => setAppearance({ ...appearance, waist })}
          />
          <Slider
            label="Height"
            value={appearance.height}
            onChange={(height) => setAppearance({ ...appearance, height })}
          />
        </div>

        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-rose-300/70">
            Personality
          </p>
          <div className="flex flex-wrap gap-1.5">
            {TRAIT_OPTIONS.map((trait) => {
              const on = personality.traits.includes(trait);
              return (
                <button
                  key={trait}
                  type="button"
                  onClick={() => toggleTrait(trait)}
                  className={
                    on
                      ? "rounded-full bg-rose-500 px-2.5 py-1 text-xs text-white"
                      : "rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/50"
                  }
                >
                  {trait}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={save}
          className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 py-3 text-sm font-semibold text-white"
        >
          Save & play
        </button>
      </div>

      <div className="lg:sticky lg:top-6 h-[560px]">
        <CharacterStage
          character={preview}
          onClothing={(patch) => setAppearance(applyClothingPatch(appearance, patch))}
        />
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-[11px] uppercase tracking-[0.16em] text-rose-300/70">
        {label}
        <span className="text-white/40">{Math.round(value * 100)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-rose-500"
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-[0.16em] text-rose-300/70">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-rose-50 outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Picker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-rose-300/70">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            title={o.label}
            onClick={() => onChange(o.value)}
            className="h-7 w-7 rounded-full border-2"
            style={{
              background: o.value,
              borderColor: value.toLowerCase() === o.value.toLowerCase() ? "#f4d38a" : "#ffffff33",
            }}
          />
        ))}
      </div>
    </div>
  );
}
