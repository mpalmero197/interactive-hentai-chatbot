import { localRespond, systemPrompt } from "@/lib/chat";
import type { Character, ChatMessage } from "@/lib/types";

export const runtime = "nodejs";

interface Body {
  character: Character;
  history: ChatMessage[];
  userText: string;
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const { character, history, userText } = body;
  if (!character || !userText) {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const key = process.env.OPENAI_API_KEY;
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!key) {
    const local = localRespond(character, userText, history ?? []);
    return Response.json({ reply: local.content, source: "local" });
  }

  try {
    const messages = [
      { role: "system", content: systemPrompt(character) },
      ...(history ?? [])
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userText },
    ];

    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.9,
        max_tokens: 280,
        messages,
      }),
    });

    if (!res.ok) {
      const local = localRespond(character, userText, history ?? []);
      return Response.json({ reply: local.content, source: "local" });
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      const local = localRespond(character, userText, history ?? []);
      return Response.json({ reply: local.content, source: "local" });
    }
    return Response.json({ reply, source: "openai" });
  } catch {
    const local = localRespond(character, userText, history ?? []);
    return Response.json({ reply: local.content, source: "local" });
  }
}
