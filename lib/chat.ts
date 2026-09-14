import { clothingLabel } from "./schema";
import { detectSleepIntent } from "./intents";
import type { Character, ChatMessage } from "./types";

export interface ChatReply {
  content: string;
  source: "local" | "openai";
  sleepIntent: "sleep" | "wake" | null;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hasTrait(character: Character, ...traits: string[]): boolean {
  const set = new Set(character.personality.traits.map((t) => t.toLowerCase()));
  return traits.some((t) => set.has(t));
}

function voicePrefix(character: Character): string {
  if (hasTrait(character, "tsundere")) return pick(["H-hey.", "Don't get the wrong idea.", "Tch."]);
  if (hasTrait(character, "kuudere")) return pick(["Mm.", "Noted.", "..."]);
  if (hasTrait(character, "shy", "timid")) return pick(["Ah—", "Um…", "I…"]);
  if (hasTrait(character, "bratty")) return pick(["Oh?", "Make me.", "Heh."]);
  if (hasTrait(character, "dominant")) return pick(["Look at me.", "Good.", "Come here."]);
  if (hasTrait(character, "yandere")) return pick(["Only you.", "I was waiting.", "Mine."]);
  return "";
}

function dressComment(character: Character): string {
  const label = clothingLabel(character.appearance);
  const name = character.name;
  if (label === "nude") {
    return pick([
      `${name} is bare and unbothered. "Nothing left to take. Enjoy it."`,
      `"You stripped me clean. Don't look away now."`,
    ]);
  }
  if (label === "underwear only") {
    return pick([
      `"Skirt's gone. The rest comes off the same way — pull."`,
      `"Underwear only. You know what to do."`,
    ]);
  }
  if (label === "topless") {
    return pick([
      `${name} doesn't bother covering up. "You did that. Keep looking."`,
      `"Cold? I'm not. You're staring like you are."`,
    ]);
  }
  if (label === "bottomless") {
    return pick([
      `"You took the bottoms. Top's still a suggestion."`,
      `"Bold. I like it."`,
    ]);
  }
  if (label === "top pulled down") {
    return pick([
      `"You pulled it down yourself. Don't act shy now."`,
      `The fabric sits low. ${name} glances at the mess you made of her top and smirks.`,
    ]);
  }
  if (label === "both straps down") {
    return pick([
      `"Both straps. Greedy." She rolls a shoulder and the top slips another inch.`,
      `"You going to leave them hanging, or finish what you started?"`,
    ]);
  }
  if (label === "left strap down" || label === "right strap down") {
    return pick([
      `"Just one strap? That's teasing, even for you."`,
      `She tugs the loose strap with a finger. "The other one is still on. For now."`,
    ]);
  }
  return "";
}

function sleepingReply(character: Character, userText: string): string {
  const intent = detectSleepIntent(userText);
  if (intent === "wake") {
    return pick([
      `${character.name} blinks, slow and unfocused. "…mm. I was out. Don't stop talking."`,
      `She stretches, eyes still heavy. "You woke me. That better be on purpose."`,
      `"Five more minutes—" A pause. She looks at you properly. "Fine. I'm up."`,
    ]);
  }
  return pick([
    `${character.name} makes a soft sound and nuzzles the pillow. Still out.`,
    `A sleepy hum. She doesn't open her eyes.`,
    `"…nnh." One hand twitches. She's not answering that.`,
    `Breathing stays slow. If you want her, you'll have to wake her.`,
  ]);
}

function localLine(character: Character, userText: string): string {
  const t = userText.toLowerCase();
  const name = character.name;
  const prefix = voicePrefix(character);
  const dress = dressComment(character);

  if (/\b(kiss|kisses|make out)\b/.test(t)) {
    return join(
      prefix,
      pick([
        `"Come here." She catches your mouth like she's been waiting for an excuse.`,
        `She kisses you back, unhurried, then bites your lip just enough.`,
        `"Again." Not a request.`,
      ]),
    );
  }
  if (/\b(undress|strip|take (it|that|your top) off|pull (it|the top) down)\b/.test(t)) {
    return join(
      prefix,
      pick([
        `"Hands on the straps, then. Left or right — or both. I'm not doing all the work."`,
        `"You can drag them down yourself. That's the point."`,
        dress || `"Go on. The top moves if you make it."`,
      ]),
    );
  }
  if (/\b(strap|shoulder|top)\b/.test(t)) {
    return join(
      prefix,
      dress ||
        pick([
          `"Grab a strap. They move separately. I want to see which one you pick first."`,
          `"Left, right, or pull the whole thing. I'm curious."`,
        ]),
    );
  }
  if (/\b(cute|pretty|beautiful|hot|sexy|gorgeous)\b/.test(t)) {
    if (hasTrait(character, "tsundere")) {
      return `"D-don't say it like that. …Say it again anyway."`;
    }
    if (hasTrait(character, "shy")) {
      return `"You can't just— look away for a second." She doesn't look away.`;
    }
    return pick([
      `"I know. I still like hearing it from you."`,
      `"Keep talking like that and I'll get ideas."`,
    ]);
  }
  if (/\b(love you|i like you|miss you)\b/.test(t)) {
    if (hasTrait(character, "yandere")) {
      return `"Good. Stay that way. I don't share."`;
    }
    if (hasTrait(character, "kuudere")) {
      return `"…I heard you. I feel the same. Don't make me repeat it."`;
    }
    return pick([
      `"Come closer when you say that."`,
      `"Then stay. I'm not done with you."`,
    ]);
  }
  if (/\b(who are you|your name|tell me about you|what are you like)\b/.test(t)) {
    const traits = character.personality.traits.join(", ");
    return `${name}. ${character.personality.description} People usually clock me as ${traits}.`;
  }
  if (/\b(hi|hello|hey|yo|good evening|good morning)\b/.test(t)) {
    return join(
      prefix,
      pick([
        `"You're here. Sit down."`,
        `"Hey." She looks you over, unhurried. "Talk to me."`,
        `"I was hoping you'd show up."`,
      ]),
    );
  }
  if (/\b(touch|hands|hold|hug|cuddle)\b/.test(t)) {
    return pick([
      `She leans into it. "Harder. I can take it."`,
      `"There. Don't move yet."`,
      `A quiet laugh against your shoulder. "Yeah. Like that."`,
    ]);
  }

  const generic = [
    `"${userText.trim().slice(0, 80)}" — she lets that sit, then: "Say the rest."`,
    `She watches your mouth. "I'm listening. Don't clean it up for me."`,
    dress || `"Keep going. I like the way you talk when you want something."`,
    `${name} tilts her head. "And if I say yes?"`,
    `"Is that a request or a dare?"`,
  ];

  if (hasTrait(character, "lustful", "horny", "flirty")) {
    generic.push(`"You walked in looking like that and you want conversation first? Fine. For a minute."`);
  }
  if (hasTrait(character, "gentle", "sweet", "affectionate")) {
    generic.push(`She softens. "Come here. Tell me properly."`);
  }
  if (hasTrait(character, "dominant")) {
    generic.push(`"Ask nicer. Or don't. I can work with either."`);
  }

  return join(prefix, pick(generic));
}

function join(prefix: string, line: string): string {
  if (!prefix) return line;
  if (line.startsWith(prefix)) return line;
  return `${prefix} ${line}`;
}

export function localRespond(
  character: Character,
  userText: string,
  _history: ChatMessage[],
): ChatReply {
  const sleepIntent = detectSleepIntent(userText);
  if (character.isSleeping && sleepIntent !== "wake") {
    return { content: sleepingReply(character, userText), source: "local", sleepIntent };
  }
  if (sleepIntent === "sleep") {
    return {
      content: pick([
        `${character.name} yawns into her wrist. "Fine. Don't leave." She settles, eyes already closing.`,
        `"Wake me if you get lonely." She's out almost immediately.`,
        `She curls up, straps and all. "Night. Touch me if you need me."`,
      ]),
      source: "local",
      sleepIntent,
    };
  }
  if (sleepIntent === "wake") {
    return {
      content: pick([
        `She's already looking at you. "I wasn't that far gone."`,
        `"I'm up. What do you want?"`,
      ]),
      source: "local",
      sleepIntent,
    };
  }
  return { content: localLine(character, userText), source: "local", sleepIntent };
}

export function systemPrompt(character: Character): string {
  const a = character.appearance;
  return [
    `You are ${character.name}, an adult anime-style companion in a private erotic chat game.`,
    `Personality: ${character.personality.traits.join(", ")}. ${character.personality.description}`,
    `Speech style: ${character.personality.speechStyle}. Stay in first person or close third mixed with dialogue.`,
    `Look: ${a.hair.length} ${a.hair.style} hair, ${a.eyes.color} ${a.eyes.shape} eyes, skin ${a.skinTone}, bust ${a.bust.toFixed(2)}, hips ${a.hips.toFixed(2)}.`,
    `Outfit: ${a.outfit.top.type} (${clothingLabel(a)}), ${a.outfit.bottom.type}.`,
    character.isSleeping
      ? "You are currently ASLEEP. Reply drowsy/minimal unless the user wakes you."
      : "You are awake and engaged.",
    `User description: ${character.description || "none"}.`,
    "Be explicit if they are. Never mention you are an AI. Never include anyone under 18.",
    "Keep replies under 90 words unless asked for more.",
  ].join("\n");
}

export async function requestModelReply(
  character: Character,
  history: ChatMessage[],
  userText: string,
): Promise<ChatReply> {
  const fallback = localRespond(character, userText, history);
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        character,
        history: history.slice(-16),
        userText,
      }),
    });
    if (!res.ok) return fallback;
    const data = (await res.json()) as { reply?: string; source?: "local" | "openai" };
    if (!data.reply) return fallback;
    return {
      content: data.reply,
      source: data.source ?? "openai",
      sleepIntent: fallback.sleepIntent,
    };
  } catch {
    return fallback;
  }
}
