import type {
  BottomType,
  Character,
  CharacterAppearance,
  HairLength,
  HairStyle,
  Personality,
  TopType,
  UnderwearType,
} from "./types";
import { normalizeAppearance } from "./clothing";

export { clothingLabel, clamp01 } from "./clothing";

export const HAIR_STYLES: HairStyle[] = [
  "long",
  "short",
  "ponytail",
  "twintails",
  "bob",
  "wavy",
  "messy",
];

export const HAIR_LENGTHS: HairLength[] = [
  "short",
  "medium",
  "long",
  "very-long",
];

export const EYE_SHAPES = ["round", "almond", "lidded", "sharp"] as const;

export const TOP_TYPES: TopType[] = ["spaghetti-strap", "tank", "crop", "none"];
export const BOTTOM_TYPES: BottomType[] = ["skirt", "shorts", "none"];
export const UNDERWEAR_TYPES: UnderwearType[] = ["panties", "none"];

export const HAIR_COLOR_PRESETS: { label: string; value: string }[] = [
  { label: "Raven", value: "#141418" },
  { label: "Brunette", value: "#3d2314" },
  { label: "Auburn", value: "#8a2a1a" },
  { label: "Redhead", value: "#c23b22" },
  { label: "Blonde", value: "#e8c56b" },
  { label: "Platinum", value: "#e8e4d8" },
  { label: "Silver", value: "#c5c8d0" },
  { label: "Pink", value: "#e86b9a" },
  { label: "Lavender", value: "#9b7ad4" },
  { label: "Blue", value: "#3a6fd8" },
  { label: "Teal", value: "#2aa3a3" },
];

export const EYE_COLOR_PRESETS: { label: string; value: string }[] = [
  { label: "Green", value: "#2f8f4e" },
  { label: "Hazel", value: "#7a8f32" },
  { label: "Amber", value: "#c48a1a" },
  { label: "Brown", value: "#5c3a21" },
  { label: "Blue", value: "#3a6fd8" },
  { label: "Violet", value: "#7b3bb0" },
  { label: "Red", value: "#c23b22" },
  { label: "Gold", value: "#d4a017" },
  { label: "Gray", value: "#7a7a8a" },
  { label: "Pink", value: "#e86b9a" },
];

export const SKIN_PRESETS: { label: string; value: string }[] = [
  { label: "Porcelain", value: "#f6d9c8" },
  { label: "Fair", value: "#f0c4ae" },
  { label: "Peach", value: "#e8b496" },
  { label: "Warm", value: "#d99a78" },
  { label: "Tan", value: "#c47a52" },
  { label: "Olive", value: "#b07a54" },
  { label: "Brown", value: "#8a5536" },
  { label: "Deep", value: "#5c331f" },
];

export const OUTFIT_COLORS: { label: string; value: string }[] = [
  { label: "Wine", value: "#8b1e3f" },
  { label: "Crimson", value: "#c41e3a" },
  { label: "Rose", value: "#e85a7a" },
  { label: "Black", value: "#1a1218" },
  { label: "Ivory", value: "#f3e6d8" },
  { label: "Navy", value: "#1c2a4a" },
  { label: "Forest", value: "#1f4a32" },
  { label: "Gold", value: "#c9a227" },
  { label: "Lilac", value: "#b08ad4" },
  { label: "Teal", value: "#1a6b6b" },
];

export const TRAIT_OPTIONS = [
  "shy",
  "teasing",
  "bratty",
  "affectionate",
  "dominant",
  "submissive",
  "playful",
  "gentle",
  "confident",
  "lustful",
  "tsundere",
  "kuudere",
  "yandere",
  "sweet",
] as const;

export function defaultAppearance(): CharacterAppearance {
  return {
    hair: { color: "#c23b22", style: "long", length: "long" },
    eyes: { color: "#2f8f4e", shape: "round" },
    skinTone: "#f0c4ae",
    bust: 0.72,
    hips: 0.62,
    waist: 0.38,
    height: 0.32,
    outfit: {
      top: {
        type: "spaghetti-strap",
        color: "#8b1e3f",
        leftStrap: 0,
        rightStrap: 0,
        pullDown: 0,
        removed: false,
      },
      bottom: { type: "skirt", color: "#1a1218", pulledDown: 0, removed: false },
      underwear: { type: "panties", color: "#3a1220", pulledDown: 0, removed: false },
    },
  };
}

export function defaultPersonality(): Personality {
  return {
    traits: ["teasing", "affectionate"],
    description: "Warm, a little filthy, and very present.",
    speechStyle: "intimate",
  };
}

export function createCharacter(
  partial: Partial<Character> & { name: string },
): Character {
  const now = Date.now();
  return {
    id: partial.id ?? crypto.randomUUID(),
    name: partial.name,
    description: partial.description ?? "",
    appearance: normalizeAppearance(partial.appearance ?? defaultAppearance()),
    personality: partial.personality ?? defaultPersonality(),
    isSleeping: partial.isSleeping ?? false,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
}

export function demoCharacter(): Character {
  return createCharacter({
    id: "demo-redhead",
    name: "Akari",
    description:
      "petite redhead with green eyes, large bust, spaghetti-strap top, teasing and affectionate",
    appearance: defaultAppearance(),
    personality: {
      traits: ["teasing", "affectionate", "playful"],
      description: "A petite redhead who leans in close and talks like she already knows you.",
      speechStyle: "intimate",
    },
  });
}
