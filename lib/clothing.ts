import type {
  BottomClothing,
  CharacterAppearance,
  OutfitAppearance,
  TopClothing,
  UnderwearClothing,
} from "./types";

export function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

const FALLBACK: OutfitAppearance = {
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
};

export type ClothingPatch = Partial<{
  leftStrap: number;
  rightStrap: number;
  pullDown: number;
  bottomPulled: number;
  underwearPulled: number;
  topRemoved: boolean;
  bottomRemoved: boolean;
  underwearRemoved: boolean;
}>;

const OFF = 0.92;

export function normalizeOutfit(outfit: Partial<OutfitAppearance> | undefined): OutfitAppearance {
  const d = FALLBACK;
  const rawBottom = outfit?.bottom as
    | (Omit<BottomClothing, "type"> & { type?: string })
    | undefined;
  const legacyType = rawBottom?.type ?? "";
  const bottomType: BottomClothing["type"] =
    legacyType === "panties" || legacyType === "none" || legacyType === "skirt" || legacyType === "shorts"
      ? legacyType === "panties"
        ? "none"
        : legacyType
      : d.bottom.type;
  return {
    top: {
      ...d.top,
      ...outfit?.top,
      removed: outfit?.top?.removed ?? false,
    },
    bottom: {
      ...d.bottom,
      ...rawBottom,
      type: bottomType,
      removed: rawBottom?.removed ?? false,
    },
    underwear: {
      ...d.underwear,
      ...outfit?.underwear,
      type:
        legacyType === "panties" && !outfit?.underwear
          ? "panties"
          : (outfit?.underwear?.type ?? d.underwear.type),
      removed: outfit?.underwear?.removed ?? false,
    },
  };
}

export function normalizeAppearance(a: CharacterAppearance): CharacterAppearance {
  return { ...a, outfit: normalizeOutfit(a.outfit) };
}

export function isTopOff(top: TopClothing): boolean {
  return top.removed || top.type === "none" || top.pullDown >= OFF;
}

export function isBottomOff(bottom: BottomClothing): boolean {
  return bottom.removed || bottom.type === "none" || bottom.pulledDown >= OFF;
}

export function isUnderwearOff(u: UnderwearClothing): boolean {
  return u.removed || u.type === "none" || u.pulledDown >= OFF;
}

export function isNude(a: CharacterAppearance): boolean {
  const o = normalizeOutfit(a.outfit);
  return isTopOff(o.top) && isBottomOff(o.bottom) && isUnderwearOff(o.underwear);
}

export function clothingLabel(appearance: CharacterAppearance): string {
  const o = normalizeOutfit(appearance.outfit);
  const t = o.top;
  if (isNude({ ...appearance, outfit: o })) return "nude";
  if (isTopOff(t) && isBottomOff(o.bottom) && !isUnderwearOff(o.underwear)) {
    return "underwear only";
  }
  if (isTopOff(t) && !isBottomOff(o.bottom)) return "topless";
  if (!isTopOff(t) && isBottomOff(o.bottom) && isUnderwearOff(o.underwear)) {
    return "bottomless";
  }
  const strapsDown = (t.leftStrap > 0.55 ? 1 : 0) + (t.rightStrap > 0.55 ? 1 : 0);
  if (t.pullDown > 0.4) return "top pulled down";
  if (strapsDown === 2) return "both straps down";
  if (t.leftStrap > 0.55) return "left strap down";
  if (t.rightStrap > 0.55) return "right strap down";
  if (o.bottom.pulledDown > 0.45) return "bottoms pulled";
  return "dressed";
}

export function applyClothingPatch(
  appearance: CharacterAppearance,
  patch: ClothingPatch,
): CharacterAppearance {
  const o = normalizeOutfit(appearance.outfit);
  let leftStrap = patch.leftStrap ?? o.top.leftStrap;
  let rightStrap = patch.rightStrap ?? o.top.rightStrap;
  let pullDown = patch.pullDown ?? o.top.pullDown;
  let bottomPulled = patch.bottomPulled ?? o.bottom.pulledDown;
  let underwearPulled = patch.underwearPulled ?? o.underwear.pulledDown;
  let topRemoved = patch.topRemoved ?? o.top.removed;
  let bottomRemoved = patch.bottomRemoved ?? o.bottom.removed;
  let underwearRemoved = patch.underwearRemoved ?? o.underwear.removed;

  if (pullDown >= OFF) topRemoved = true;
  if (bottomPulled >= OFF) bottomRemoved = true;
  if (underwearPulled >= OFF) underwearRemoved = true;
  if (topRemoved) {
    pullDown = 1;
    leftStrap = 1;
    rightStrap = 1;
  }
  if (bottomRemoved) bottomPulled = 1;
  if (underwearRemoved) underwearPulled = 1;

  return {
    ...appearance,
    outfit: {
      top: {
        ...o.top,
        leftStrap: clamp01(leftStrap),
        rightStrap: clamp01(rightStrap),
        pullDown: clamp01(pullDown),
        removed: topRemoved,
      },
      bottom: {
        ...o.bottom,
        pulledDown: clamp01(bottomPulled),
        removed: bottomRemoved,
      },
      underwear: {
        ...o.underwear,
        pulledDown: clamp01(underwearPulled),
        removed: underwearRemoved,
      },
    },
  };
}

export function stripAll(appearance: CharacterAppearance): CharacterAppearance {
  return applyClothingPatch(appearance, {
    topRemoved: true,
    bottomRemoved: true,
    underwearRemoved: true,
    leftStrap: 1,
    rightStrap: 1,
    pullDown: 1,
    bottomPulled: 1,
    underwearPulled: 1,
  });
}

export function redress(appearance: CharacterAppearance): CharacterAppearance {
  const o = normalizeOutfit(appearance.outfit);
  return {
    ...appearance,
    outfit: {
      top: { ...o.top, leftStrap: 0, rightStrap: 0, pullDown: 0, removed: false },
      bottom: { ...o.bottom, pulledDown: 0, removed: false },
      underwear: { ...o.underwear, pulledDown: 0, removed: false },
    },
  };
}
