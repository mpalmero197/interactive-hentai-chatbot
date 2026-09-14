# Afterglow — interactive hentai chatbot

Adult companion MVP: describe a girl, customize her body and clothes, chat with a personality-aware responder, drag clothing (including independent spaghetti straps), put her to sleep, and strip her completely.

Live data stays in `localStorage` on the device you play on.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

## Environment

Copy `.env.example` to `.env.local` if you want model chat.

| Variable | Required | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | no | If missing, chat uses the offline rule/template responder |
| `OPENAI_BASE_URL` | no | OpenAI-compatible API root |
| `OPENAI_MODEL` | no | Defaults to `gpt-4o-mini` |

## How to play (phone + desktop)

1. **Home** — saved girls + Create. A demo redhead (Akari) is seeded.
2. **Create** — paste something like `petite redhead with green eyes, large bust, spaghetti-strap top`. Hit **Parse text**, tweak sliders, save.
3. **Play** — stage on top (or left on desktop), chat below (or right).

### Clothing physics

Each layer has a material. Dragging is springy, not a snap.

| Piece | Material | Feel |
| --- | --- | --- |
| Spaghetti straps | `thin_elastic` | Stretch, bounce, independent left/right |
| Top | `soft_fabric` | Slides, sags, medium settle |
| Skirt / shorts | `heavier_cloth` | Inertia, hem sway, slower drop |
| Underwear | `lace` | Light, drapey |

Release before the drop threshold and the piece springs back with damping. Past the threshold (or with enough flick velocity) it keeps sliding off. Verlet points draw the straps so they hang and stretch.

### Strip

- Gold beads on the stage are grab handles. **Touch-friendly**: large hit circles, `touch-action: none`, Pixi pointer events (mouse + finger).
- **Left / right beads** — spaghetti straps move independently (up, one down, both down).
- **Chest bead** — pull the top down; pull past the waist to take it off.
- **Hip bead** — skirt/shorts slide down and off.
- **Pink bead** — underwear, once the bottoms are low or gone.
- Buttons: **Top off**, **Bottoms off**, **Underwear off**, **Strip all**, **Redress**.
- End state is a fully nude stylized anime silhouette.

### Sleep

- **Sleep / Wake** toggle, or type `go to sleep` / `wake up` in chat.
- Asleep: closed eyes, relaxed pose, slower breathing, drowsy replies.

## Architecture

```
app/                 App Router screens + /api/chat
components/          CharacterStage, ChatPanel, CharacterCreator, PlayClient
lib/types.ts         Appearance + clothing schema
lib/parser.ts        Deterministic keyword parser (offline)
lib/clothing.ts      Layered strip state (top / bottoms / underwear)
lib/chat.ts          Local responder + optional OpenAI-compatible call
lib/pixi/            Procedural PixiJS v8 body, clothes, ClothSim (spring-damper + Verlet)
stores/              localStorage-backed character + chat stores
```

- **No image assets.** Vector/Graphics silhouettes tinted by params.
- Characters and threads persist in `localStorage`. Export/import JSON from Home.

## Phone / public URL

GitHub Pages: https://mpalmero197.github.io/interactive-hentai-chatbot/

Open Play on a phone, grab the gold beads, pull straps and clothes. Data stays in that phone's localStorage.

## Deploy

Vercel, or any Next.js host:

```bash
npx vercel --yes --prod
```

Set `OPENAI_API_KEY` in the host if you want model replies. The app works without it.
