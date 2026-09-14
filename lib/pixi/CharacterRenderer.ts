import {
  Application,
  Assets,
  Circle,
  Container,
  FederatedPointerEvent,
  Graphics,
  Rectangle,
  Sprite,
  Texture,
} from "pixi.js";
import {
  clamp01,
  normalizeAppearance,
  type ClothingPatch,
} from "@/lib/clothing";
import type { Character, CharacterAppearance } from "@/lib/types";
import {
  artUrl,
  DEFAULT_THRESHOLDS,
  faceFile,
  fullBodyFileFor,
  PACK_BASE,
  pullBand,
  resolveArtRoot,
  slideBand,
  slideFile,
  spriteWorldScale,
  strapState,
  tintFor,
  topFileFor,
  type ArtManifest,
  type ArtThresholds,
} from "./artPack";
import { ClothSim, type SimKey } from "./ClothSim";
import { hexToNum, mix, shade } from "./colors";

export type { ClothingPatch };

type DragTarget = "left" | "right" | "top" | "bottom" | "underwear" | null;

interface BodyLayout {
  cx: number;
  headY: number;
  headR: number;
  neckY: number;
  shoulderY: number;
  shoulderW: number;
  bustY: number;
  bustW: number;
  bustD: number;
  waistY: number;
  waistW: number;
  hipsY: number;
  hipsW: number;
  crotchY: number;
  kneeY: number;
  footY: number;
  armLen: number;
}

function layout(a: CharacterAppearance): BodyLayout {
  const h = 0.82 + a.height * 0.28;
  const cx = 0;
  const headR = 40;
  const headY = -248 * h;
  const neckY = headY + headR + 6;
  const shoulderY = neckY + 18;
  const shoulderW = 52 + a.bust * 6;
  const bustY = shoulderY + 42;
  const bustW = 30 + a.bust * 30;
  const bustD = 16 + a.bust * 22;
  const waistY = bustY + 52;
  const waistW = 24 + a.waist * 14 - (1 - a.waist) * 2;
  const hipsY = waistY + 48;
  const hipsW = 36 + a.hips * 24;
  const crotchY = hipsY + 38;
  const kneeY = crotchY + 92 * h;
  const footY = kneeY + 96 * h;
  const armLen = 132 * h;
  return {
    cx,
    headY,
    headR,
    neckY,
    shoulderY,
    shoulderW,
    bustY,
    bustW,
    bustD,
    waistY,
    waistW,
    hipsY,
    hipsW,
    crotchY,
    kneeY,
    footY,
    armLen,
  };
}

export class CharacterRenderer {
  app: Application | null = null;
  host: HTMLElement | null = null;
  root = new Container();
  world = new Container();
  bg = new Graphics();
  hairBack = new Graphics();
  body = new Graphics();
  face = new Graphics();
  clothes = new Graphics();
  hairFront = new Graphics();
  handles = new Graphics();
  leftHit = new Graphics();
  rightHit = new Graphics();
  topHit = new Graphics();
  bottomHit = new Graphics();
  underwearHit = new Graphics();

  /** Layered PNG stack (when art pack loads). */
  artRoot = new Container();
  hairBackSprite: Sprite | null = null;
  bodySprite: Sprite | null = null;
  nudeDetailSprite: Sprite | null = null;
  underwearSprite: Sprite | null = null;
  bottomSprite: Sprite | null = null;
  topSprite: Sprite | null = null;
  faceSprite: Sprite | null = null;
  hairFrontSprite: Sprite | null = null;
  private artReady = false;
  private artTextures = new Map<string, Texture>();
  private artThresholds: ArtThresholds = { ...DEFAULT_THRESHOLDS };
  private artAnchor = { x: 0.5, y: 0.62 };
  private artCanvas = { w: 1024, h: 1536 };
  private artBaseScale = spriteWorldScale(1536);
  private artCrossfadeMs = 100;
  private artFade: { sprite: Sprite; from: number; to: number; t: number; dur: number } | null =
    null;
  private fullBodyStates = false;
  private lastFullBodyFile: string | null = null;
  private lastTopFile: string | null = null;
  private lastBottomFile: string | null = null;
  private lastUnderwearFile: string | null = null;
  private lastFaceFile: string | null = null;

  character: Character | null = null;
  onClothing?: (patch: ClothingPatch) => void;
  readonly sim = new ClothSim();
  private drag: DragTarget = null;
  private dragStartY = 0;
  private dragStart = 0;
  private elapsed = 0;
  private destroyed = false;
  private ro: ResizeObserver | null = null;
  private lastEmit = 0;
  private echo = false;

  async init(
    host: HTMLElement,
    character: Character,
    onClothing: (patch: ClothingPatch) => void,
  ) {
    this.host = host;
    this.character = character;
    this.onClothing = onClothing;
    const app = new Application();
    await app.init({
      background: 0x12080e,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      width: Math.max(280, host.clientWidth || 420),
      height: Math.max(420, host.clientHeight || 680),
    });
    if (this.destroyed) {
      app.destroy(true);
      return;
    }
    this.app = app;
    host.appendChild(app.canvas);
    app.canvas.style.width = "100%";
    app.canvas.style.height = "100%";
    app.canvas.style.display = "block";
    app.canvas.style.touchAction = "none";
    app.canvas.style.userSelect = "none";
    app.canvas.style.webkitUserSelect = "none";
    const prevent = (ev: Event) => ev.preventDefault();
    app.canvas.addEventListener("touchstart", prevent, { passive: false });
    app.canvas.addEventListener("touchmove", prevent, { passive: false });

    this.world.addChild(
      this.bg,
      this.hairBack,
      this.body,
      this.clothes,
      this.artRoot,
      this.face,
      this.hairFront,
      this.handles,
      this.leftHit,
      this.rightHit,
      this.topHit,
      this.bottomHit,
      this.underwearHit,
    );
    this.root.addChild(this.world);
    app.stage.addChild(this.root);
    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;
    if (app.renderer.events) {
      app.renderer.events.autoPreventDefault = true;
    }

    this.bindHits();
    this.bootSim(character);
    await this.tryLoadArtPack("akari");
    this.redraw();
    this.fit();

    app.ticker.add((t) => this.tick(t.deltaMS));
    app.stage.on("pointermove", (e) => this.onMove(e));
    app.stage.on("pointerup", () => this.onUp());
    app.stage.on("pointerupoutside", () => this.onUp());
    app.stage.on("pointercancel", () => this.onUp());

    this.ro = new ResizeObserver(() => this.fit());
    this.ro.observe(host);
  }

  update(character: Character) {
    this.character = character;
    if (!this.echo) this.bootSim(character, false);
  }

  private bootSim(character: Character, snap = true) {
    const a = normalizeAppearance(character.appearance);
    this.sim.configureMaterials(a.outfit.top.type, a.outfit.bottom.type);
    this.sim.reconcile(
      {
        leftStrap: a.outfit.top.removed ? 1 : a.outfit.top.leftStrap,
        rightStrap: a.outfit.top.removed ? 1 : a.outfit.top.rightStrap,
        pullDown: a.outfit.top.pullDown,
        bottomPulled: a.outfit.bottom.pulledDown,
        underwearPulled: a.outfit.underwear.pulledDown,
        topRemoved: a.outfit.top.removed || a.outfit.top.type === "none",
        bottomRemoved: a.outfit.bottom.removed || a.outfit.bottom.type === "none",
        underwearRemoved: a.outfit.underwear.removed || a.outfit.underwear.type === "none",
      },
      snap,
    );
  }

  private lastSig = "";

  private emitSim() {
    const p = this.sim.commitPayload();
    const sig = JSON.stringify(p);
    if (sig === this.lastSig) return;
    this.lastSig = sig;
    this.echo = true;
    this.onClothing?.({
      leftStrap: p.leftStrap,
      rightStrap: p.rightStrap,
      pullDown: p.pullDown,
      bottomPulled: p.bottomPulled,
      underwearPulled: p.underwearPulled,
      topRemoved: p.topRemoved,
      bottomRemoved: p.bottomRemoved,
      underwearRemoved: p.underwearRemoved,
    });
    queueMicrotask(() => {
      this.echo = false;
    });
  }

  private dragKey(target: DragTarget): SimKey | null {
    if (target === "left") return "leftStrap";
    if (target === "right") return "rightStrap";
    if (target === "top") return "top";
    if (target === "bottom") return "bottom";
    if (target === "underwear") return "underwear";
    return null;
  }

  destroy() {
    this.destroyed = true;
    this.ro?.disconnect();
    this.ro = null;
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
    if (this.host) {
      this.host.innerHTML = "";
      this.host = null;
    }
  }

  private fit() {
    const app = this.app;
    const host = this.host;
    if (!app || !host) return;
    const w = Math.max(240, host.clientWidth);
    const h = Math.max(360, host.clientHeight);
    app.renderer.resize(w, h);
    app.stage.hitArea = new Rectangle(0, 0, w, h);
    const scale = Math.min(w / 440, h / 720) * 0.98;
    this.root.scale.set(scale);
    this.root.position.set(w / 2, h * 0.56);
  }

  private tick(delta: number) {
    if (!this.character) return;
    this.elapsed += delta;
    const sleeping = this.character.isSleeping;
    const speed = sleeping ? 0.00155 : 0.0026;
    const amp = sleeping ? 0.016 : 0.009;
    const yAmp = sleeping ? 2.4 : 1.1;
    this.world.scale.y = 1 + Math.sin(this.elapsed * speed) * amp;
    this.world.y = Math.sin(this.elapsed * speed) * yAmp;
    if (sleeping) this.world.rotation = -0.03;
    else this.world.rotation = Math.sin(this.elapsed * 0.0007) * 0.01;

    const a = normalizeAppearance(this.character.appearance);
    const L = layout(a);
    const vis = this.visualAppearance();
    this.sim.step(delta);
    if (this.sim.top.removed) {
      this.sim.left.removed = true;
      this.sim.right.removed = true;
    }
    const top = vis.outfit.top;
    this.sim.stepRopes(
      this.strapEnds(L, "left", top),
      this.strapEnds(L, "right", top),
      delta,
    );
    if (this.artFade) {
      const f = this.artFade;
      f.t += delta;
      const u = Math.min(1, f.t / f.dur);
      f.sprite.alpha = f.from + (f.to - f.from) * u;
      if (u >= 1) this.artFade = null;
    }
    this.redraw();

    if (this.drag === null && this.sim.all().some((s) => s.removed || s.settling)) {
      this.emitSim();
    }
  }

  private bindHits() {
    const bind = (g: Graphics, target: DragTarget) => {
      g.eventMode = "static";
      g.cursor = "grab";
      g.on("pointerdown", (e: FederatedPointerEvent) => {
        e.stopPropagation();
        this.beginDrag(target, e.global.y);
      });
    };
    bind(this.leftHit, "left");
    bind(this.rightHit, "right");
    bind(this.topHit, "top");
    bind(this.bottomHit, "bottom");
    bind(this.underwearHit, "underwear");
  }

  private beginDrag(target: DragTarget, y: number) {
    if (!this.character || !target) return;
    const key = this.dragKey(target);
    if (!key) return;
    const s = this.sim.byKey(key);
    if (s.removed) return;
    this.drag = target;
    this.dragStartY = y;
    this.dragStart = s.value;
    this.sim.beginDrag(key);
    for (const hit of [this.leftHit, this.rightHit, this.topHit, this.bottomHit, this.underwearHit]) {
      hit.cursor = "grabbing";
    }
  }

  private onMove(e: FederatedPointerEvent) {
    if (!this.drag || !this.character) return;
    const key = this.dragKey(this.drag);
    if (!key) return;
    const dy = e.global.y - this.dragStartY;
    const next = this.dragStart + dy / 95;
    this.sim.dragTo(key, next);
    if (this.elapsed - this.lastEmit > 140) {
      this.lastEmit = this.elapsed;
      this.emitSim();
    }
  }

  private onUp() {
    if (this.drag) {
      const key = this.dragKey(this.drag);
      if (key) this.sim.release(key);
    }
    this.drag = null;
    this.leftHit.cursor = "grab";
    this.rightHit.cursor = "grab";
    this.topHit.cursor = "grab";
    this.bottomHit.cursor = "grab";
    this.underwearHit.cursor = "grab";
    this.emitSim();
  }

  private redraw() {
    const c = this.character;
    if (!c) return;
    const a = this.visualAppearance();
    const L = layout(a);
    const skin = hexToNum(a.skinTone);
    const hair = hexToNum(a.hair.color);
    const eye = hexToNum(a.eyes.color);
    const topC = hexToNum(a.outfit.top.color);
    const botC = hexToNum(a.outfit.bottom.color);
    const undC = hexToNum(a.outfit.underwear.color);

    this.bg.clear();
    this.hairBack.clear();
    this.body.clear();
    this.face.clear();
    this.clothes.clear();
    this.hairFront.clear();
    this.handles.clear();
    this.leftHit.clear();
    this.rightHit.clear();
    this.topHit.clear();
    this.bottomHit.clear();
    this.underwearHit.clear();

    this.drawBackdrop();

    if (this.artReady) {
      this.hairBack.visible = false;
      this.body.visible = false;
      this.clothes.visible = false;
      this.face.visible = false;
      this.hairFront.visible = false;
      this.artRoot.visible = true;
      this.syncSpritesFromSim(a, c.isSleeping);
    } else {
      this.artRoot.visible = false;
      this.hairBack.visible = true;
      this.body.visible = true;
      this.clothes.visible = true;
      this.face.visible = true;
      this.hairFront.visible = true;
      this.drawHairBack(this.hairBack, L, hair, a, c.isSleeping);
      this.drawBody(this.body, L, skin, c.isSleeping);
      this.drawClothes(this.clothes, L, a, topC, botC, undC, skin);
      this.drawFace(this.face, L, skin, eye, a, c.isSleeping);
      this.drawHairFront(this.hairFront, L, hair, a);
    }
    this.placeHits(L, a);
  }

  private visualAppearance(): CharacterAppearance {
    const base = normalizeAppearance(this.character!.appearance);
    const v = this.sim.snapshot();
    return {
      ...base,
      outfit: {
        ...base.outfit,
        top: {
          ...base.outfit.top,
          leftStrap: v.leftStrap,
          rightStrap: v.rightStrap,
          pullDown: v.pullDown,
          removed: v.topRemoved,
        },
        bottom: {
          ...base.outfit.bottom,
          pulledDown: v.bottomPulled,
          removed: v.bottomRemoved,
        },
        underwear: {
          ...base.outfit.underwear,
          pulledDown: v.underwearPulled,
          removed: v.underwearRemoved,
        },
      },
    };
  }

  private strapEnds(
    L: BodyLayout,
    side: "left" | "right",
    top: CharacterAppearance["outfit"]["top"],
  ) {
    const dir = side === "left" ? -1 : 1;
    const t = side === "left" ? top.leftStrap : top.rightStrap;
    const sag = t * 20 + top.pullDown * 28;
    const sx = dir * 18;
    const sy = L.bustY - 6 + sag;
    if (t < 0.15) {
      return {
        sx,
        sy,
        ex: dir * (L.shoulderW - 6),
        ey: L.shoulderY - 2,
        taut: 1 - t,
      };
    }
    return {
      sx,
      sy,
      ex: dir * (L.shoulderW + 8 + t * 16),
      ey: L.shoulderY + 18 + t * 88,
      taut: Math.max(0, 1 - t),
    };
  }

  private drawBackdrop() {
    const g = this.bg;
    g.circle(0, -40, 220).fill({ color: 0x3a1024, alpha: 0.35 });
    g.circle(-90, -180, 70).fill({ color: 0x6b2040, alpha: 0.12 });
    g.circle(110, 80, 90).fill({ color: 0x1a2040, alpha: 0.12 });
  }

  private drawHairBack(
    g: Graphics,
    L: BodyLayout,
    hair: number,
    a: CharacterAppearance,
    sleeping: boolean,
  ) {
    const dark = shade(hair, 0.72);
    const len =
      a.hair.length === "short"
        ? 36
        : a.hair.length === "medium"
          ? 80
          : a.hair.length === "long"
            ? 150
            : 210;
    g.ellipse(L.cx, L.headY + 10, L.headR + 16, L.headR + 20).fill(hair);
    g.ellipse(L.cx, L.headY + 28, L.headR + 10, 24).fill(dark);

    if (a.hair.style === "twintails") {
      const drop = sleeping ? 8 : 0;
      g.ellipse(-L.headR - 8, L.headY + 40 + drop, 22, 70 + len * 0.15).fill(hair);
      g.ellipse(L.headR + 8, L.headY + 40 + drop, 22, 70 + len * 0.15).fill(hair);
      g.ellipse(-L.headR - 8, L.headY + 100 + drop, 18, 40).fill(dark);
      g.ellipse(L.headR + 8, L.headY + 100 + drop, 18, 40).fill(dark);
    } else if (a.hair.style === "ponytail") {
      g.ellipse(L.cx + 8, L.headY + 20, 18, 16).fill(hair);
      g.ellipse(L.cx + 18, L.headY + 70, 20, 58 + len * 0.1).fill(hair);
    } else if (a.hair.style !== "short" && a.hair.style !== "bob") {
      g.roundRect(L.cx - 38, L.headY + 20, 76, len, 24).fill(hair);
      if (a.hair.style === "wavy" || a.hair.style === "messy") {
        g.ellipse(L.cx - 34, L.headY + 80, 16, 28).fill(hair);
        g.ellipse(L.cx + 36, L.headY + 100, 16, 30).fill(hair);
        g.ellipse(L.cx - 20, L.headY + 140, 18, 26).fill(dark);
      }
    }
  }

  private drawBody(g: Graphics, L: BodyLayout, skin: number, sleeping: boolean) {
    const shadow = shade(skin, 0.78);
    const blush = mix(skin, 0xff6b8a, 0.22);

    // legs
    const inward = sleeping ? 6 : 0;
    this.capsule(g, -18 + inward, L.crotchY, -22 + inward, L.kneeY, 13, skin);
    this.capsule(g, 18 - inward, L.crotchY, 22 - inward, L.kneeY, 13, skin);
    this.capsule(g, -22 + inward, L.kneeY, -18 + inward, L.footY, 11, skin);
    this.capsule(g, 22 - inward, L.kneeY, 18 - inward, L.footY, 11, skin);
    g.ellipse(-18 + inward, L.footY + 4, 16, 7).fill(shadow);
    g.ellipse(18 - inward, L.footY + 4, 16, 7).fill(shadow);

    // hips / torso silhouette
    g.moveTo(L.cx - L.shoulderW, L.shoulderY);
    g.bezierCurveTo(
      L.cx - L.shoulderW - 2,
      L.shoulderY + 16,
      L.cx - L.bustW,
      L.bustY - 8,
      L.cx - L.bustW,
      L.bustY + 4,
    );
    g.bezierCurveTo(
      L.cx - L.bustW + 2,
      L.waistY - 10,
      L.cx - L.waistW,
      L.waistY - 4,
      L.cx - L.waistW,
      L.waistY,
    );
    g.bezierCurveTo(
      L.cx - L.waistW,
      L.hipsY - 8,
      L.cx - L.hipsW,
      L.hipsY - 4,
      L.cx - L.hipsW,
      L.hipsY,
    );
    g.bezierCurveTo(
      L.cx - L.hipsW,
      L.hipsY + 22,
      L.cx - 20,
      L.crotchY - 2,
      L.cx,
      L.crotchY + 8,
    );
    g.bezierCurveTo(
      L.cx + 20,
      L.crotchY - 2,
      L.cx + L.hipsW,
      L.hipsY + 22,
      L.cx + L.hipsW,
      L.hipsY,
    );
    g.bezierCurveTo(
      L.cx + L.hipsW,
      L.hipsY - 4,
      L.cx + L.waistW,
      L.hipsY - 8,
      L.cx + L.waistW,
      L.waistY,
    );
    g.bezierCurveTo(
      L.cx + L.waistW,
      L.waistY - 4,
      L.cx + L.bustW - 2,
      L.waistY - 10,
      L.cx + L.bustW,
      L.bustY + 4,
    );
    g.bezierCurveTo(
      L.cx + L.bustW,
      L.bustY - 8,
      L.cx + L.shoulderW + 2,
      L.shoulderY + 16,
      L.cx + L.shoulderW,
      L.shoulderY,
    );
    g.lineTo(L.cx + 10, L.neckY);
    g.lineTo(L.cx - 10, L.neckY);
    g.closePath();
    g.fill(skin);

    // breasts
    const brx = L.bustW * 0.55;
    const bry = L.bustD * 0.55;
    g.ellipse(-brx * 0.15 - 18, L.bustY + 8, brx, bry).fill(skin);
    g.ellipse(brx * 0.15 + 18, L.bustY + 8, brx, bry).fill(skin);
    g.ellipse(-18, L.bustY + 10, brx * 0.7, bry * 0.55).fill(blush);
    g.ellipse(18, L.bustY + 10, brx * 0.7, bry * 0.55).fill(blush);

    // neck + head
    g.roundRect(-9, L.neckY - 6, 18, 22, 6).fill(skin);
    g.circle(0, L.headY, L.headR).fill(skin);
    g.ellipse(0, L.headY + 8, L.headR * 0.78, L.headR * 0.9).fill(shade(skin, 1.04));

    // arms
    const hang = sleeping ? 10 : 0;
    this.capsule(
      g,
      -L.shoulderW + 4,
      L.shoulderY + 8,
      -L.shoulderW - 22,
      L.shoulderY + L.armLen * 0.55 + hang,
      10,
      skin,
    );
    this.capsule(
      g,
      -L.shoulderW - 22,
      L.shoulderY + L.armLen * 0.55 + hang,
      -L.shoulderW - 10,
      L.shoulderY + L.armLen + hang,
      8,
      skin,
    );
    this.capsule(
      g,
      L.shoulderW - 4,
      L.shoulderY + 8,
      L.shoulderW + 22,
      L.shoulderY + L.armLen * 0.55 + hang,
      10,
      skin,
    );
    this.capsule(
      g,
      L.shoulderW + 22,
      L.shoulderY + L.armLen * 0.55 + hang,
      L.shoulderW + 10,
      L.shoulderY + L.armLen + hang,
      8,
      skin,
    );
    g.circle(-L.shoulderW - 10, L.shoulderY + L.armLen + hang, 8).fill(skin);
    g.circle(L.shoulderW + 10, L.shoulderY + L.armLen + hang, 8).fill(skin);
  }

  private capsule(
    g: Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    r: number,
    color: number,
  ) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    g.moveTo(x1 + nx * r, y1 + ny * r);
    g.lineTo(x2 + nx * r, y2 + ny * r);
    g.lineTo(x2 - nx * r, y2 - ny * r);
    g.lineTo(x1 - nx * r, y1 - ny * r);
    g.closePath();
    g.fill(color);
    g.circle(x1, y1, r).fill(color);
    g.circle(x2, y2, r).fill(color);
  }

  private drawClothes(
    g: Graphics,
    L: BodyLayout,
    a: CharacterAppearance,
    topC: number,
    botC: number,
    undC: number,
    skin: number,
  ) {
    const top = a.outfit.top;
    const bot = a.outfit.bottom;
    const und = a.outfit.underwear;
    const topOff = top.removed || top.type === "none";
    const botOff = bot.removed || bot.type === "none";
    const undOff = und.removed || und.type === "none";
    const sway = this.sim.hemSway;
    const leftSag = top.leftStrap * 20 + top.pullDown * 34;
    const rightSag = top.rightStrap * 20 + top.pullDown * 34;
    const reveal = topOff ? 1 : Math.max(top.leftStrap, top.rightStrap) * 0.25 + top.pullDown;

    // underwear first (under bottoms)
    if (!undOff) {
      const drop = und.pulledDown * 52;
      const y0 = L.hipsY - 6 + drop;
      const y1 = y0 + 26;
      g.moveTo(-L.hipsW + 8, y0);
      g.quadraticCurveTo(0, y0 - 8, L.hipsW - 8, y0);
      g.lineTo(L.hipsW - 14, y1);
      g.quadraticCurveTo(0, y1 + 10, -L.hipsW + 14, y1);
      g.closePath();
      g.fill(undC);
      g.moveTo(-8, y0 + 2);
      g.lineTo(0, y0 + 8);
      g.lineTo(8, y0 + 2);
      g.stroke({ width: 1.1, color: shade(undC, 1.3), alpha: 0.55 });
    } else {
      // stylized nude mound
      const mound = shade(skin, 0.86);
      g.ellipse(0, L.crotchY - 4, 11, 7).fill(mound);
    }

    // bottom over underwear
    if (!botOff) {
      const drop = bot.pulledDown * 56;
      const y0 = L.hipsY - 18 + drop;
      const y1 = bot.type === "shorts" ? y0 + 46 : y0 + 70;
      g.moveTo(-L.hipsW + 2, y0);
      g.quadraticCurveTo(0, y0 - 10, L.hipsW - 2, y0);
      g.lineTo(L.hipsW + (bot.type === "skirt" ? 10 : 0) + sway * 12, y1 + Math.abs(sway) * 4);
      g.quadraticCurveTo(sway * 8, y1 + 8, -L.hipsW - (bot.type === "skirt" ? 10 : 0) + sway * 8, y1);
      g.closePath();
      g.fill(botC);
      g.moveTo(-10, y0 + 2);
      g.lineTo(0, y0 + 10);
      g.lineTo(10, y0 + 2);
      g.stroke({ width: 1.2, color: shade(botC, 1.25), alpha: 0.5 });
    }

    // nipples if revealed
    if (reveal > 0.42 || topOff) {
      const nip = shade(skin, 0.62);
      g.ellipse(-20, L.bustY + 12 + (topOff ? 0 : leftSag * 0.15), 5, 3.4).fill(nip);
      g.ellipse(20, L.bustY + 12 + (topOff ? 0 : rightSag * 0.15), 5, 3.4).fill(nip);
    }

    if (topOff) return;

    const cupH = top.type === "crop" ? 36 : top.type === "tank" ? 58 : 46;
    const bandY = L.bustY + 20 + Math.max(leftSag, rightSag) * 0.35;
    const leftTop = L.bustY - 8 + leftSag;
    const rightTop = L.bustY - 8 + rightSag;

    // cups
    const leftCover = 1 - clamp01(top.pullDown * 1.15 + top.leftStrap * 0.35);
    const rightCover = 1 - clamp01(top.pullDown * 1.15 + top.rightStrap * 0.35);

    if (leftCover > 0.12) {
      g.ellipse(-20, leftTop + 22, 26 * leftCover + 10, (cupH / 2) * leftCover + 8).fill(topC);
    }
    if (rightCover > 0.12) {
      g.ellipse(20, rightTop + 22, 26 * rightCover + 10, (cupH / 2) * rightCover + 8).fill(topC);
    }

    // center knot / band
    if (top.pullDown < 0.85) {
      g.roundRect(-16, bandY, 32, 10, 4).fill(shade(topC, 0.85));
    }

    // tank extra coverage
    if (top.type === "tank" && top.pullDown < 0.7) {
      g.roundRect(-L.waistW - 4, L.bustY + 28 + top.pullDown * 20, L.waistW * 2 + 8, 36, 8).fill(
        topC,
      );
    }

    // straps
    this.drawStrap(g, L, "left", top, topC);
    this.drawStrap(g, L, "right", top, topC);
  }

  private drawStrap(
    g: Graphics,
    L: BodyLayout,
    side: "left" | "right",
    top: CharacterAppearance["outfit"]["top"],
    color: number,
  ) {
    if (top.type === "none" || top.removed) return;
    const width = top.type === "spaghetti-strap" ? 3.6 : 10;
    const rope = side === "left" ? this.sim.leftRope : this.sim.rightRope;
    if (rope.length >= 2 && !(rope[0].x === 0 && rope[1].x === 0 && rope[0].y === 0)) {
      g.moveTo(rope[0].x, rope[0].y);
      for (let i = 1; i < rope.length; i++) {
        const prev = rope[i - 1];
        const cur = rope[i];
        const mx = (prev.x + cur.x) / 2;
        const my = (prev.y + cur.y) / 2;
        g.quadraticCurveTo(prev.x, prev.y, mx, my);
      }
      const last = rope[rope.length - 1];
      g.lineTo(last.x, last.y);
    } else {
      const ends = this.strapEnds(L, side, top);
      g.moveTo(ends.sx, ends.sy);
      g.quadraticCurveTo((ends.sx + ends.ex) * 0.5, ends.sy - 16, ends.ex, ends.ey);
    }
    g.stroke({ width, color, cap: "round", join: "round" });
    g.stroke({ width: width * 0.35, color: shade(color, 1.35), cap: "round", alpha: 0.55 });
  }

  private drawFace(
    g: Graphics,
    L: BodyLayout,
    skin: number,
    eye: number,
    a: CharacterAppearance,
    sleeping: boolean,
  ) {
    const y = L.headY + 6;
    const eyeY = y - 2;
    const spread =
      a.eyes.shape === "round" ? 18 : a.eyes.shape === "almond" ? 19 : 18;
    const eyeH =
      a.eyes.shape === "lidded" ? 7 : a.eyes.shape === "sharp" ? 8 : 11;
    const eyeW =
      a.eyes.shape === "round" ? 12 : a.eyes.shape === "sharp" ? 14 : 13;

    // blush
    g.ellipse(-22, y + 16, 10, 5).fill({ color: 0xe07a8a, alpha: sleeping ? 0.18 : 0.32 });
    g.ellipse(22, y + 16, 10, 5).fill({ color: 0xe07a8a, alpha: sleeping ? 0.18 : 0.32 });

    if (sleeping) {
      g.moveTo(-spread - 8, eyeY);
      g.quadraticCurveTo(-spread, eyeY + 6, -spread + 8, eyeY);
      g.stroke({ width: 2.2, color: 0x3a2030, cap: "round" });
      g.moveTo(spread - 8, eyeY);
      g.quadraticCurveTo(spread, eyeY + 6, spread + 8, eyeY);
      g.stroke({ width: 2.2, color: 0x3a2030, cap: "round" });
      g.moveTo(-6, y + 22);
      g.quadraticCurveTo(0, y + 26, 6, y + 22);
      g.stroke({ width: 1.8, color: 0xc46a78, cap: "round" });
    } else {
      for (const dir of [-1, 1]) {
        const ex = dir * spread;
        g.ellipse(ex, eyeY, eyeW, eyeH).fill(0xfff7f2);
        g.ellipse(ex + dir * 1, eyeY + 1, eyeW * 0.62, eyeH * 0.78).fill(eye);
        g.ellipse(ex + dir * 1, eyeY + 1, 4.2, 5.2).fill(0x1a1014);
        g.circle(ex + dir * -3, eyeY - 3, 2.4).fill(0xffffff);
        g.circle(ex + dir * 2.5, eyeY + 2, 1.1).fill({ color: 0xffffff, alpha: 0.7 });
        // lash
        g.moveTo(ex - eyeW, eyeY - 2);
        g.quadraticCurveTo(ex, eyeY - eyeH - 3, ex + eyeW, eyeY - 2);
        g.stroke({ width: 1.8, color: 0x1a1014, cap: "round" });
        if (a.eyes.shape === "lidded") {
          g.ellipse(ex, eyeY - 4, eyeW, 4).fill({ color: skin, alpha: 0.85 });
        }
      }
      g.moveTo(-2, y + 10);
      g.lineTo(0, y + 14);
      g.lineTo(2, y + 10);
      g.stroke({ width: 1.2, color: shade(skin, 0.7), cap: "round" });
      g.ellipse(0, y + 24, 7, 3.2).fill(0xc45a6a);
    }

    // brows
    const browY = eyeY - (sleeping ? 6 : 16);
    g.moveTo(-spread - 10, browY + (sleeping ? 3 : 0));
    g.quadraticCurveTo(-spread, browY - 3, -spread + 10, browY + 1);
    g.stroke({ width: 2, color: 0x2a1820, cap: "round" });
    g.moveTo(spread - 10, browY + 1);
    g.quadraticCurveTo(spread, browY - 3, spread + 10, browY + (sleeping ? 3 : 0));
    g.stroke({ width: 2, color: 0x2a1820, cap: "round" });

    // ear hints
    g.ellipse(-L.headR + 4, L.headY + 6, 7, 11).fill(skin);
    g.ellipse(L.headR - 4, L.headY + 6, 7, 11).fill(skin);
  }

  private drawHairFront(g: Graphics, L: BodyLayout, hair: number, a: CharacterAppearance) {
    const dark = shade(hair, 0.8);
    g.ellipse(0, L.headY - 16, L.headR + 8, 22).fill(hair);
    if (a.hair.style === "bob") {
      g.ellipse(-26, L.headY + 18, 16, 22).fill(hair);
      g.ellipse(26, L.headY + 18, 16, 22).fill(hair);
    }
    // bangs
    g.ellipse(-14, L.headY - 6, 16, 18).fill(dark);
    g.ellipse(12, L.headY - 4, 15, 16).fill(hair);
    g.ellipse(0, L.headY - 10, 18, 14).fill(hair);
    if (a.hair.style === "messy") {
      g.ellipse(-28, L.headY - 22, 8, 14).fill(hair);
      g.ellipse(24, L.headY - 26, 7, 12).fill(hair);
    }
    if (a.hair.length === "very-long" || a.hair.style === "long") {
      g.ellipse(-32, L.headY + 30, 12, 28).fill(hair);
      g.ellipse(32, L.headY + 34, 12, 30).fill(hair);
    }
  }


  private async tryLoadArtPack(packId: string) {
    this.artReady = false;
    this.artTextures.clear();
    this.artRoot.removeChildren();
    this.hairBackSprite = null;
    this.bodySprite = null;
    this.nudeDetailSprite = null;
    this.underwearSprite = null;
    this.bottomSprite = null;
    this.topSprite = null;
    this.faceSprite = null;
    this.hairFrontSprite = null;

    const root = resolveArtRoot(packId);
    let manifest: ArtManifest;
    try {
      const res = await fetch(artUrl(root, "manifest.json"), { cache: "no-cache" });
      if (!res.ok) return;
      manifest = (await res.json()) as ArtManifest;
    } catch {
      return;
    }

    this.artThresholds = { ...DEFAULT_THRESHOLDS, ...(manifest.thresholds || {}) };
    this.fullBodyStates = !!manifest.fullBodyStates;
    this.lastFullBodyFile = null;
    this.artAnchor = {
      x: manifest.anchor?.x ?? 0.5,
      y: manifest.anchor?.y ?? 0.62,
    };
    this.artCanvas = {
      w: manifest.canvas?.w ?? 1024,
      h: manifest.canvas?.h ?? 1536,
    };
    this.artBaseScale = spriteWorldScale(this.artCanvas.h);

    // Probe required body_base first — if missing, keep Graphics (no Asset spam).
    try {
      const probe = await fetch(artUrl(root, "body_base.png"), { method: "HEAD", cache: "no-cache" });
      if (!probe.ok) {
        // Some static hosts reject HEAD — try a ranged GET
        const get = await fetch(artUrl(root, "body_base.png"), { cache: "no-cache" });
        if (!get.ok) return;
      }
    } catch {
      return;
    }

    const candidates = [
      "body_base.png",
      "hair_back.png",
      "hair_front.png",
      "body_nude_detail.png",
      "face_awake.png",
      "face_sleep.png",
      "top_straps_both_up.png",
      "top_left_down.png",
      "top_right_down.png",
      "top_both_down.png",
      "top_pulled_mid.png",
      "top_pulled_low.png",
      "bottom_up.png",
      "bottom_mid.png",
      "bottom_low.png",
      "underwear_up.png",
      "underwear_mid.png",
      "underwear_low.png",
    ];

    for (const file of candidates) {
      const url = artUrl(root, file);
      try {
        // Skip known-missing optionals quickly via HEAD when possible
        if (file !== "body_base.png") {
          try {
            const head = await fetch(url, { method: "HEAD", cache: "no-cache" });
            if (!head.ok) continue;
          } catch {
            /* fall through to Assets.load */
          }
        }
        const tex = (await Assets.load(url)) as Texture;
        if (!tex || !tex.source || tex.width < 1 || tex.height < 1) continue;
        this.artTextures.set(file, tex);
      } catch {
        // missing optional layer — skip
      }
    }

    if (!this.artTextures.has("body_base.png")) {
      this.artTextures.clear();
      return;
    }

    const mk = (file: string | null): Sprite | null => {
      if (!file) return null;
      const tex = this.artTextures.get(file);
      if (!tex) return null;
      // Skip near-empty placeholders (tiny opaque content)
      if (tex.width < 8 || tex.height < 8) return null;
      const s = new Sprite(tex);
      s.anchor.set(this.artAnchor.x, this.artAnchor.y);
      s.scale.set(this.artBaseScale);
      s.position.set(0, 0);
      return s;
    };

    if (this.fullBodyStates) {
      // One primary full-body sprite; hide empty garment/hair layers.
      this.bodySprite =
        mk("top_straps_both_up.png") ??
        mk("body_base.png") ??
        mk("face_awake.png");
      this.hairBackSprite = null;
      this.nudeDetailSprite = null;
      this.underwearSprite = null;
      this.bottomSprite = null;
      this.topSprite = null;
      this.faceSprite = null;
      this.hairFrontSprite = null;
      if (!this.bodySprite) {
        this.artTextures.clear();
        return;
      }
      this.artRoot.addChild(this.bodySprite);
      this.artReady = true;
      this.lastFullBodyFile = this.fileOf(this.bodySprite);
      this.lastTopFile = null;
      this.lastBottomFile = null;
      this.lastUnderwearFile = null;
      this.lastFaceFile = null;
      return;
    }

    this.hairBackSprite = mk("hair_back.png");
    this.bodySprite = mk("body_base.png");
    this.nudeDetailSprite = mk("body_nude_detail.png");
    this.underwearSprite = mk("underwear_up.png") ?? mk("underwear_low.png");
    this.bottomSprite = mk("bottom_up.png") ?? mk("bottom_low.png");
    this.topSprite =
      mk("top_straps_both_up.png") ??
      mk("top_both_down.png") ??
      mk("top_pulled_low.png");
    this.faceSprite = mk("face_awake.png") ?? mk("face_sleep.png");
    this.hairFrontSprite = mk("hair_front.png");

    if (!this.bodySprite) {
      this.artTextures.clear();
      return;
    }

    const stack = [
      this.hairBackSprite,
      this.bodySprite,
      this.nudeDetailSprite,
      this.underwearSprite,
      this.bottomSprite,
      this.topSprite,
      this.faceSprite,
      this.hairFrontSprite,
    ];
    for (const s of stack) {
      if (s) this.artRoot.addChild(s);
    }
    if (this.nudeDetailSprite) this.nudeDetailSprite.alpha = 0;

    this.artReady = true;
    this.lastTopFile = this.topSprite ? this.fileOf(this.topSprite) : null;
    this.lastBottomFile = this.bottomSprite ? this.fileOf(this.bottomSprite) : null;
    this.lastUnderwearFile = this.underwearSprite
      ? this.fileOf(this.underwearSprite)
      : null;
    this.lastFaceFile = this.faceSprite ? this.fileOf(this.faceSprite) : null;
  }

  private fileOf(sprite: Sprite): string | null {
    for (const [file, tex] of this.artTextures) {
      if (sprite.texture === tex) return file;
    }
    return null;
  }

  private pickTex(preferred: string | null, fallbacks: string[]): Texture | null {
    if (preferred && this.artTextures.has(preferred)) {
      return this.artTextures.get(preferred)!;
    }
    for (const f of fallbacks) {
      if (this.artTextures.has(f)) return this.artTextures.get(f)!;
    }
    return null;
  }

  private setSpriteTexture(sprite: Sprite | null, tex: Texture | null, crossfade = false) {
    if (!sprite || !tex) {
      if (sprite) sprite.visible = false;
      return;
    }
    sprite.visible = true;
    if (sprite.texture === tex) return;
    if (crossfade && this.artCrossfadeMs > 0) {
      sprite.texture = tex;
      sprite.alpha = 0.35;
      this.artFade = {
        sprite,
        from: 0.35,
        to: 1,
        t: 0,
        dur: this.artCrossfadeMs,
      };
    } else {
      sprite.texture = tex;
      sprite.alpha = 1;
    }
  }

  private syncSpritesFromSim(a: CharacterAppearance, sleeping: boolean) {
    const t = this.artThresholds;
    const top = a.outfit.top;
    const bot = a.outfit.bottom;
    const und = a.outfit.underwear;
    const topOff = top.removed || top.type === "none";
    const botOff = bot.removed || bot.type === "none";
    const undOff = und.removed || und.type === "none";

    const straps = strapState(top.leftStrap, top.rightStrap, t.strapDown);
    const pBand = pullBand(top.pullDown, topOff, t);
    const bBand = slideBand(
      bot.pulledDown,
      botOff,
      t.bottomMid,
      t.bottomLow,
      t.removed,
    );
    const uBand = slideBand(
      und.pulledDown,
      undOff,
      t.underwearMid,
      t.underwearLow,
      t.removed,
    );

    if (this.fullBodyStates) {
      const name = fullBodyFileFor({
        sleeping,
        straps,
        pull: pBand,
        bottom: bBand,
        underwear: uBand,
        topOff,
        botOff,
        undOff,
      });
      const tex = this.pickTex(name, [
        "top_straps_both_up.png",
        "body_base.png",
        "face_sleep.png",
        "top_pulled_low.png",
        "bottom_low.png",
        "underwear_low.png",
        "top_both_down.png",
        "top_left_down.png",
        "top_right_down.png",
      ]);
      const changed = name !== this.lastFullBodyFile;
      this.setSpriteTexture(this.bodySprite, tex, changed);
      this.lastFullBodyFile = name;
      if (this.bodySprite && this.bodySprite.visible) {
        const stretch = Math.max(
          top.leftStrap,
          top.rightStrap,
          top.pullDown,
          bot.pulledDown,
          und.pulledDown,
        );
        const sy =
          this.drag && stretch > 1
            ? this.artBaseScale * (1 + Math.min(0.04, (stretch - 1) * 0.08))
            : this.artBaseScale;
        this.bodySprite.scale.set(this.artBaseScale, sy);
        this.bodySprite.y =
          this.drag && stretch > 1 ? Math.min(6, (stretch - 1) * 8) : 0;
        // Full-body art already includes hair/skin/clothes — keep tint neutral.
        this.bodySprite.tint = 0xffffff;
      }
      return;
    }

    // --- Layered mode (garment stacks) ---
    if (this.hairBackSprite) {
      this.hairBackSprite.tint = tintFor(hexToNum(a.hair.color), PACK_BASE.hair);
    }
    if (this.hairFrontSprite) {
      this.hairFrontSprite.tint = tintFor(hexToNum(a.hair.color), PACK_BASE.hair);
    }
    if (this.bodySprite) {
      this.bodySprite.tint = tintFor(hexToNum(a.skinTone), PACK_BASE.skin);
    }
    if (this.nudeDetailSprite) {
      this.nudeDetailSprite.tint = tintFor(hexToNum(a.skinTone), PACK_BASE.skin);
    }
    if (this.topSprite) {
      this.topSprite.tint = tintFor(hexToNum(a.outfit.top.color), PACK_BASE.top);
    }
    if (this.bottomSprite) {
      this.bottomSprite.tint = tintFor(hexToNum(a.outfit.bottom.color), PACK_BASE.bottom);
    }
    if (this.underwearSprite) {
      this.underwearSprite.tint = tintFor(
        hexToNum(a.outfit.underwear.color),
        PACK_BASE.underwear,
      );
    }

    const faceName = faceFile(sleeping);
    const faceTex = this.pickTex(faceName, ["face_awake.png", "face_sleep.png"]);
    this.setSpriteTexture(
      this.faceSprite,
      faceTex,
      faceName !== this.lastFaceFile,
    );
    this.lastFaceFile = faceName;

    let topName = topFileFor(pBand, straps);
    const topTex = this.pickTex(
      topName,
      [
        "top_pulled_low.png",
        "top_pulled_mid.png",
        "top_straps_both_up.png",
        "top_both_down.png",
        "top_left_down.png",
        "top_right_down.png",
      ],
    );
    if (pBand === "removed" || topOff) {
      if (this.topSprite) this.topSprite.visible = false;
      this.lastTopFile = null;
    } else {
      const changed = topName !== this.lastTopFile;
      this.setSpriteTexture(this.topSprite, topTex, changed);
      if (topName && topTex) this.lastTopFile = topName;
      if (this.topSprite && this.topSprite.visible) {
        const stretch = Math.max(
          top.leftStrap,
          top.rightStrap,
          top.pullDown,
        );
        const sy =
          this.drag && stretch > 1
            ? this.artBaseScale * (1 + Math.min(0.04, (stretch - 1) * 0.08))
            : this.artBaseScale;
        this.topSprite.scale.set(this.artBaseScale, sy);
        this.topSprite.y = this.drag && stretch > 1 ? Math.min(6, (stretch - 1) * 8) : 0;
      }
    }

    const botName = slideFile("bottom", bBand);
    if (bBand === "removed" || botOff) {
      if (this.bottomSprite) this.bottomSprite.visible = false;
      this.lastBottomFile = null;
    } else {
      const botTex = this.pickTex(botName, ["bottom_up.png", "bottom_low.png", "bottom_mid.png"]);
      this.setSpriteTexture(this.bottomSprite, botTex, botName !== this.lastBottomFile);
      this.lastBottomFile = botName;
      if (this.bottomSprite && this.bottomSprite.visible) {
        const stretch = bot.pulledDown;
        const sy =
          this.drag === "bottom" && stretch > 1
            ? this.artBaseScale * (1 + Math.min(0.04, (stretch - 1) * 0.08))
            : this.artBaseScale;
        this.bottomSprite.scale.set(this.artBaseScale, sy);
      }
    }

    const undName = slideFile("underwear", uBand);
    if (uBand === "removed" || undOff) {
      if (this.underwearSprite) this.underwearSprite.visible = false;
      this.lastUnderwearFile = null;
    } else {
      const undTex = this.pickTex(undName, [
        "underwear_up.png",
        "underwear_low.png",
        "underwear_mid.png",
      ]);
      this.setSpriteTexture(
        this.underwearSprite,
        undTex,
        undName !== this.lastUnderwearFile,
      );
      this.lastUnderwearFile = undName;
    }

    const reveal = topOff
      ? 1
      : Math.max(top.leftStrap, top.rightStrap) * 0.25 + top.pullDown;
    if (this.nudeDetailSprite) {
      const show = reveal > 0.42 || topOff || pBand === "low" || pBand === "removed";
      this.nudeDetailSprite.visible = true;
      this.nudeDetailSprite.alpha = show ? Math.min(1, 0.35 + reveal) : 0;
    }
  }

  private placeHits(L: BodyLayout, a: CharacterAppearance) {
    const top = a.outfit.top;
    const bot = a.outfit.bottom;
    const und = a.outfit.underwear;
    const topOff = top.removed || top.type === "none";
    const botOff = bot.removed || bot.type === "none";
    const undOff = und.removed || und.type === "none";
    const sway = this.sim.hemSway;
    const leftT = top.leftStrap;
    const rightT = top.rightStrap;
    const leftX = leftT < 0.15 ? -L.shoulderW + 4 : -(L.shoulderW + 8 + leftT * 16);
    const leftY =
      leftT < 0.15 ? L.shoulderY + 4 : L.shoulderY + 18 + leftT * 88;
    const rightX = rightT < 0.15 ? L.shoulderW - 4 : L.shoulderW + 8 + rightT * 16;
    const rightY =
      rightT < 0.15 ? L.shoulderY + 4 : L.shoulderY + 18 + rightT * 88;

    const h = this.handles;
    const gem = 0xf4d38a;
    if (!topOff) {
      h.circle(leftX, leftY, 10).fill(gem);
      h.circle(leftX, leftY, 10).stroke({ width: 1.6, color: 0x2a1810 });
      h.circle(rightX, rightY, 10).fill(gem);
      h.circle(rightX, rightY, 10).stroke({ width: 1.6, color: 0x2a1810 });
      h.circle(0, L.bustY + 26 + top.pullDown * 30, 9).fill(0xf4d38a);
      h.circle(0, L.bustY + 26 + top.pullDown * 30, 9).stroke({
        width: 1.4,
        color: 0x2a1810,
      });
    }
    if (!botOff) {
      h.circle(0, L.hipsY + 8 + bot.pulledDown * 40, 9).fill(0xd4b06a);
    }
    if (!undOff && (botOff || bot.pulledDown > 0.35)) {
      h.circle(0, L.hipsY + 16 + und.pulledDown * 46, 9).fill(0xe8a0b8);
    }

    this.paintHit(this.leftHit, leftX, leftY, 52);
    this.paintHit(this.rightHit, rightX, rightY, 52);
    this.paintHit(this.topHit, 0, L.bustY + 18 + top.pullDown * 28, 58);
    this.paintHit(this.bottomHit, 0, L.hipsY + 10 + bot.pulledDown * 40, 52);
    this.paintHit(this.underwearHit, 0, L.hipsY + 16 + und.pulledDown * 46, 48);

    this.leftHit.visible = !topOff;
    this.rightHit.visible = !topOff;
    this.topHit.visible = !topOff;
    this.bottomHit.visible = !botOff;
    this.underwearHit.visible = !undOff && (botOff || bot.pulledDown > 0.35);
  }

  private paintHit(g: Graphics, x: number, y: number, r: number) {
    g.circle(x, y, r).fill({ color: 0xffffff, alpha: 0.001 });
    g.hitArea = new Circle(x, y, r);
    g.eventMode = "static";
  }
}
