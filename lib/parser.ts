import {
  defaultAppearance,
  defaultPersonality,
} from "./schema";
import type {
  BottomType,
  CharacterAppearance,
  EyeShape,
  HairLength,
  HairStyle,
  Personality,
  TopType,
} from "./types";

const HAIR_COLORS: Record<string, string> = {
  redhead: "#c23b22",
  "red hair": "#c23b22",
  crimson: "#9b1b30",
  auburn: "#8a2a1a",
  ginger: "#d35400",
  blonde: "#e8c56b",
  blond: "#e8c56b",
  platinum: "#e8e4d8",
  silver: "#c5c8d0",
  white: "#f4f0e8",
  brunette: "#3d2314",
  brown: "#5c3a21",
  black: "#141418",
  raven: "#0d0d12",
  pink: "#e86b9a",
  lavender: "#9b7ad4",
  purple: "#7b3bb0",
  violet: "#7b3bb0",
  blue: "#3a6fd8",
  teal: "#2aa3a3",
  green: "#2f8f4e",
  orange: "#e07a2f",
};

const EYE_COLORS: Record<string, string> = {
  green: "#2f8f4e",
  hazel: "#7a8f32",
  amber: "#c48a1a",
  brown: "#5c3a21",
  blue: "#3a6fd8",
  violet: "#7b3bb0",
  purple: "#7b3bb0",
  red: "#c23b22",
  gold: "#d4a017",
  golden: "#d4a017",
  gray: "#7a7a8a",
  grey: "#7a7a8a",
  pink: "#e86b9a",
  silver: "#c5c8d0",
};

const SKIN: Record<string, string> = {
  porcelain: "#f6d9c8",
  pale: "#f6d9c8",
  fair: "#f0c4ae",
  peach: "#e8b496",
  warm: "#d99a78",
  tan: "#c47a52",
  olive: "#b07a54",
  brown: "#8a5536",
  dark: "#5c331f",
  deep: "#5c331f",
  ebony: "#3d2216",
};

const TRAITS = [
  "shy",
  "timid",
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
  "cold",
  "horny",
  "flirty",
  "clingy",
];

function has(text: string, ...needles: string[]): boolean {
  return needles.some((n) => text.includes(n));
}

function firstMatch(text: string, map: Record<string, string>): string | null {
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (text.includes(key)) return map[key];
  }
  return null;
}

export interface ParseResult {
  name: string;
  appearance: CharacterAppearance;
  personality: Personality;
  notes: string[];
}

export function parseDescription(raw: string): ParseResult {
  const text = raw.toLowerCase();
  const appearance = defaultAppearance();
  const personality = defaultPersonality();
  const notes: string[] = [];

  const hairColor = firstMatch(text, HAIR_COLORS);
  if (hairColor) {
    appearance.hair.color = hairColor;
    notes.push("hair color");
  }

  if (has(text, "twintail", "twin tail", "pigtail", "twin-tail")) {
    appearance.hair.style = "twintails";
    notes.push("twintails");
  } else if (has(text, "ponytail", "pony tail")) {
    appearance.hair.style = "ponytail";
    notes.push("ponytail");
  } else if (has(text, "bob cut", "bob hair", " bob")) {
    appearance.hair.style = "bob";
    notes.push("bob");
  } else if (has(text, "wavy", "curly", "curls")) {
    appearance.hair.style = "wavy";
    notes.push("wavy hair");
  } else if (has(text, "messy")) {
    appearance.hair.style = "messy";
    notes.push("messy hair");
  } else if (has(text, "short hair")) {
    appearance.hair.style = "short";
    appearance.hair.length = "short";
    notes.push("short hair");
  } else if (has(text, "long hair", "flowing hair")) {
    appearance.hair.style = "long";
    appearance.hair.length = "long";
    notes.push("long hair");
  }

  if (has(text, "very long", "floor-length", "waist-length")) {
    appearance.hair.length = "very-long";
  } else if (has(text, "long hair", "long red", "long blonde", "long black")) {
    appearance.hair.length = "long";
  } else if (has(text, "medium hair", "shoulder-length")) {
    appearance.hair.length = "medium";
  } else if (has(text, "short hair", "pixie")) {
    appearance.hair.length = "short";
  }

  const eyeColor = firstMatch(
    text.replace(/hair[^.]{0,24}/g, " "),
    Object.fromEntries(
      Object.entries(EYE_COLORS).map(([k, v]) => [`${k} eye`, v]),
    ),
  );
  if (eyeColor) {
    appearance.eyes.color = eyeColor;
    notes.push("eye color");
  } else {
    for (const [k, v] of Object.entries(EYE_COLORS)) {
      if (text.includes(`${k} eyes`) || text.includes(`${k}-eyed`)) {
        appearance.eyes.color = v;
        notes.push("eye color");
        break;
      }
    }
  }

  if (has(text, "lidded", "sleepy eyes", "half-lidded", "bedroom eyes")) {
    appearance.eyes.shape = "lidded";
  } else if (has(text, "sharp eyes", "fox eyes", "cat eyes")) {
    appearance.eyes.shape = "sharp";
  } else if (has(text, "almond")) {
    appearance.eyes.shape = "almond";
  } else if (has(text, "round eyes", "big eyes")) {
    appearance.eyes.shape = "round";
  }

  const skin = firstMatch(text, SKIN);
  if (skin && has(text, "skin", "tan", "pale", "fair", "porcelain", "olive", "ebony")) {
    appearance.skinTone = skin;
    notes.push("skin");
  }

  if (has(text, "huge bust", "enormous", "stacked", "huge breast", "huge tits")) {
    appearance.bust = 0.95;
    notes.push("bust");
  } else if (has(text, "large bust", "big bust", "busty", "large breast", "big breast", "big tits", "large chest")) {
    appearance.bust = 0.82;
    notes.push("bust");
  } else if (has(text, "modest bust", "average bust", "medium bust")) {
    appearance.bust = 0.5;
    notes.push("bust");
  } else if (has(text, "small bust", "flat chest", "small breast", "tiny bust")) {
    appearance.bust = 0.22;
    notes.push("bust");
  }

  if (has(text, "wide hip", "thick hip", "thick thighs", "curvy", "thicc")) {
    appearance.hips = 0.82;
    notes.push("hips");
  } else if (has(text, "slim hip", "narrow hip")) {
    appearance.hips = 0.32;
    notes.push("hips");
  }

  if (has(text, "hourglass", "slim waist", "tiny waist", "narrow waist")) {
    appearance.waist = 0.22;
    notes.push("waist");
  } else if (has(text, "soft waist", "thick waist")) {
    appearance.waist = 0.62;
  }

  if (has(text, "petite", "tiny girl", "short girl", "short stack")) {
    appearance.height = 0.22;
    if (!has(text, "large bust", "big bust", "busty", "large breast")) {
      appearance.bust = Math.min(appearance.bust, 0.55);
    }
    notes.push("petite");
  } else if (has(text, "tall", "towering", "long legs")) {
    appearance.height = 0.82;
    notes.push("tall");
  } else if (has(text, "short")) {
    appearance.height = 0.3;
  }

  if (has(text, "spaghetti", "thin strap", "slip top", "camisole")) {
    appearance.outfit.top.type = "spaghetti-strap";
    notes.push("spaghetti-strap top");
  } else if (has(text, "crop top", "crop")) {
    appearance.outfit.top.type = "crop";
  } else if (has(text, "tank top", "tank")) {
    appearance.outfit.top.type = "tank";
  } else if (has(text, "topless", "no top")) {
    appearance.outfit.top.removed = true;
    appearance.outfit.top.pullDown = 1;
  }

  if (has(text, "shorts")) {
    appearance.outfit.bottom.type = "shorts";
  } else if (has(text, "skirt")) {
    appearance.outfit.bottom.type = "skirt";
  } else if (has(text, "underwear only", "panties only")) {
    appearance.outfit.bottom.type = "none";
    appearance.outfit.bottom.removed = true;
    appearance.outfit.underwear.type = "panties";
  }

  if (has(text, "no panties", "no underwear")) {
    appearance.outfit.underwear.removed = true;
    appearance.outfit.underwear.type = "none";
  }

  if (has(text, "nude", "naked", "no clothes")) {
    appearance.outfit.top.removed = true;
    appearance.outfit.top.pullDown = 1;
    appearance.outfit.bottom.removed = true;
    appearance.outfit.bottom.pulledDown = 1;
    appearance.outfit.underwear.removed = true;
    appearance.outfit.underwear.pulledDown = 1;
  } else if (has(text, "bottomless")) {
    appearance.outfit.bottom.removed = true;
    appearance.outfit.underwear.removed = true;
  }

  const outfitColor = firstMatch(text, {
    "wine top": "#8b1e3f",
    "red top": "#c41e3a",
    "black top": "#1a1218",
    "white top": "#f3e6d8",
    "pink top": "#e85a7a",
    "blue top": "#1c2a4a",
  });
  if (outfitColor) appearance.outfit.top.color = outfitColor;

  const traits = TRAITS.filter((t) => text.includes(t));
  if (traits.length) {
    personality.traits = [...new Set(traits)].slice(0, 4);
    notes.push("personality");
  }

  if (personality.traits.includes("shy") || personality.traits.includes("timid")) {
    personality.speechStyle = "soft";
    personality.description = "Hesitant at first, then unexpectedly honest.";
  } else if (personality.traits.includes("dominant")) {
    personality.speechStyle = "commanding";
    personality.description = "Takes the lead and likes you a little off-balance.";
  } else if (personality.traits.includes("tsundere")) {
    personality.speechStyle = "tsundere";
    personality.description = "Sharp tongue, warm hands. Don't read into it.";
  } else if (personality.traits.includes("kuudere")) {
    personality.speechStyle = "cool";
    personality.description = "Quiet, precise, and closer than she admits.";
  } else if (personality.traits.includes("yandere")) {
    personality.speechStyle = "intense";
    personality.description = "Sweet. Focused. Yours.";
  } else if (personality.traits.includes("bratty")) {
    personality.speechStyle = "bratty";
    personality.description = "Pushes buttons and wants you to push back.";
  } else {
    personality.speechStyle = "intimate";
    personality.description = "Warm, a little filthy, and very present.";
  }

  const name = extractName(raw);
  return { name, appearance, personality, notes };
}

function extractName(raw: string): string {
  const named = raw.match(
    /(?:named|name is|called|name:)\s*["']?([A-Za-z][A-Za-z'-]{1,20})/i,
  );
  if (named?.[1]) return title(named[1]);
  const quoted = raw.match(/["']([A-Za-z][A-Za-z'-]{1,20})["']/);
  if (quoted?.[1]) return title(quoted[1]);
  const leading = raw.trim().match(/^([A-Z][a-z]{2,16})\b/);
  if (leading?.[1] && !["The", "She", "Her", "A"].includes(leading[1])) {
    return leading[1];
  }
  return guessName(raw.toLowerCase());
}

function guessName(text: string): string {
  if (text.includes("redhead") || text.includes("red hair")) return "Akari";
  if (text.includes("blonde") || text.includes("blond")) return "Lila";
  if (text.includes("black hair") || text.includes("raven")) return "Noir";
  if (text.includes("pink")) return "Momo";
  if (text.includes("silver") || text.includes("white hair")) return "Shiro";
  return "Hana";
}

function title(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function applyManualHairStyle(
  appearance: CharacterAppearance,
  style: HairStyle,
): CharacterAppearance {
  return { ...appearance, hair: { ...appearance.hair, style } };
}

export function applyManualHairLength(
  appearance: CharacterAppearance,
  length: HairLength,
): CharacterAppearance {
  return { ...appearance, hair: { ...appearance.hair, length } };
}

export function applyEyeShape(
  appearance: CharacterAppearance,
  shape: EyeShape,
): CharacterAppearance {
  return { ...appearance, eyes: { ...appearance.eyes, shape } };
}

export function applyTopType(
  appearance: CharacterAppearance,
  type: TopType,
): CharacterAppearance {
  return {
    ...appearance,
    outfit: { ...appearance.outfit, top: { ...appearance.outfit.top, type } },
  };
}

export function applyBottomType(
  appearance: CharacterAppearance,
  type: BottomType,
): CharacterAppearance {
  return {
    ...appearance,
    outfit: {
      ...appearance.outfit,
      bottom: { ...appearance.outfit.bottom, type },
    },
  };
}
