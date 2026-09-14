/** Layered PNG art-pack helpers for CharacterRenderer. */

export type StrapState = "both_up" | "left_down" | "right_down" | "both_down";
export type PullBand = "cover" | "mid" | "low" | "removed";
export type SlideBand = "up" | "mid" | "low" | "removed";

export interface ArtThresholds {
  strapDown: number;
  strapUp: number;
  pullMid: number;
  pullLow: number;
  removed: number;
  bottomMid: number;
  bottomLow: number;
  underwearMid: number;
  underwearLow: number;
}

export interface ArtManifest {
  id: string;
  name: string;
  canvas: { w: number; h: number };
  anchor: { x: number; y: number };
  thresholds: ArtThresholds;
  layers: Array<{
    id: string;
    file?: string;
    states?: string[];
    z: number;
    reveal?: string;
  }>;
}

export const DEFAULT_THRESHOLDS: ArtThresholds = {
  strapDown: 0.55,
  strapUp: 0.35,
  pullMid: 0.25,
  pullLow: 0.55,
  removed: 0.92,
  bottomMid: 0.35,
  bottomLow: 0.7,
  underwearMid: 0.35,
  underwearLow: 0.7,
};

/** Painted base colors in the Akari pack (tint = white when appearance matches). */
export const PACK_BASE = {
  hair: 0xc23b22,
  skin: 0xf0c4ae,
  top: 0x8b1e3f,
  bottom: 0x1a1218,
  underwear: 0x3a1220,
} as const;

export function strapState(
  left: number,
  right: number,
  down = 0.55,
): StrapState {
  const L = left >= down;
  const R = right >= down;
  if (L && R) return "both_down";
  if (L) return "left_down";
  if (R) return "right_down";
  return "both_up";
}

export function pullBand(
  pullDown: number,
  removed: boolean,
  t: ArtThresholds,
): PullBand {
  if (removed || pullDown >= t.removed) return "removed";
  if (pullDown >= t.pullLow) return "low";
  if (pullDown >= t.pullMid) return "mid";
  return "cover";
}

export function slideBand(
  pulled: number,
  removed: boolean,
  mid: number,
  low: number,
  removedAt: number,
): SlideBand {
  if (removed || pulled >= removedAt) return "removed";
  if (pulled >= low) return "low";
  if (pulled >= mid) return "mid";
  return "up";
}

/** Top filename for a discrete state (pull wins over straps). */
export function topFileFor(
  band: PullBand,
  straps: StrapState,
): string | null {
  if (band === "removed") return null;
  if (band === "mid") return "top_pulled_mid.png";
  if (band === "low") return "top_pulled_low.png";
  switch (straps) {
    case "left_down":
      return "top_left_down.png";
    case "right_down":
      return "top_right_down.png";
    case "both_down":
      return "top_both_down.png";
    default:
      return "top_straps_both_up.png";
  }
}

export function slideFile(layer: "bottom" | "underwear", band: SlideBand): string | null {
  if (band === "removed") return null;
  return `${layer}_${band}.png`;
}

export function faceFile(sleeping: boolean): string {
  return sleeping ? "face_sleep.png" : "face_awake.png";
}

/** Resolve art root so GH Pages basePath and local `/` both work. */
export function resolveArtRoot(packId = "akari"): string {
  if (typeof window === "undefined") return `/characters/${packId}`;
  return new URL(`characters/${packId}/`, window.location.href).pathname.replace(
    /\/?$/,
    "",
  );
}

export function artUrl(root: string, file: string): string {
  return `${root}/${file}`;
}

/** Multiplying tint: keep painted color when appearance matches pack base. */
export function tintFor(appearanceColor: number, packBase: number): number {
  return appearanceColor === packBase ? 0xffffff : appearanceColor;
}

/** World scale so 1536px canvas ≈ procedural body height (~560). */
export function spriteWorldScale(canvasH: number): number {
  return 560 / Math.max(1, canvasH);
}
