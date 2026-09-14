export type HairStyle =
  | "long"
  | "short"
  | "ponytail"
  | "twintails"
  | "bob"
  | "wavy"
  | "messy";

export type HairLength = "short" | "medium" | "long" | "very-long";

export type EyeShape = "round" | "almond" | "lidded" | "sharp";

export type TopType = "spaghetti-strap" | "tank" | "crop" | "none";
export type BottomType = "skirt" | "shorts" | "none";
export type UnderwearType = "panties" | "none";

export interface HairAppearance {
  color: string;
  style: HairStyle;
  length: HairLength;
}

export interface EyeAppearance {
  color: string;
  shape: EyeShape;
}

export interface TopClothing {
  type: TopType;
  color: string;
  /** 0 = on shoulder, 1 = fully pulled down the arm */
  leftStrap: number;
  rightStrap: number;
  /** 0 = covering chest, 1 = pulled to the waist */
  pullDown: number;
  /** true = garment fully off the body */
  removed: boolean;
}

export interface BottomClothing {
  type: BottomType;
  color: string;
  pulledDown: number;
  removed: boolean;
}

export interface UnderwearClothing {
  type: UnderwearType;
  color: string;
  pulledDown: number;
  removed: boolean;
}

export interface OutfitAppearance {
  top: TopClothing;
  bottom: BottomClothing;
  underwear: UnderwearClothing;
}

export interface CharacterAppearance {
  hair: HairAppearance;
  eyes: EyeAppearance;
  skinTone: string;
  /** 0 flat … 1 very large */
  bust: number;
  hips: number;
  waist: number;
  /** 0 petite … 1 tall */
  height: number;
  outfit: OutfitAppearance;
}

export interface Personality {
  traits: string[];
  description: string;
  speechStyle: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  appearance: CharacterAppearance;
  personality: Personality;
  isSleeping: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
}

export interface ChatThread {
  characterId: string;
  messages: ChatMessage[];
}

export interface ExportBundle {
  version: 1;
  exportedAt: number;
  characters: Character[];
  threads: ChatThread[];
}
