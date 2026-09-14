export type SimKey = "leftStrap" | "rightStrap" | "top" | "bottom" | "underwear";

export type ClothMaterial = "thin_elastic" | "soft_fabric" | "heavier_cloth" | "lace";

export interface MaterialDef {
  mass: number;
  stiffness: number;
  damping: number;
  stretch: number;
  removeThreshold: number;
  offForce: number;
  escapeVel: number;
}

export const MATERIALS: Record<ClothMaterial, MaterialDef> = {
  thin_elastic: {
    mass: 0.3,
    stiffness: 240,
    damping: 0.8,
    stretch: 0.42,
    removeThreshold: 0.68,
    offForce: 6.2,
    escapeVel: 2.1,
  },
  soft_fabric: {
    mass: 0.78,
    stiffness: 58,
    damping: 0.9,
    stretch: 0.16,
    removeThreshold: 0.76,
    offForce: 3.3,
    escapeVel: 1.05,
  },
  heavier_cloth: {
    mass: 1.65,
    stiffness: 22,
    damping: 0.945,
    stretch: 0.05,
    removeThreshold: 0.8,
    offForce: 2.05,
    escapeVel: 0.62,
  },
  lace: {
    mass: 0.4,
    stiffness: 120,
    damping: 0.85,
    stretch: 0.24,
    removeThreshold: 0.72,
    offForce: 4.1,
    escapeVel: 1.45,
  },
};

export interface VerletPoint {
  x: number;
  y: number;
  px: number;
  py: number;
  pinned: boolean;
}

export interface Slider {
  key: SimKey;
  material: MaterialDef;
  value: number;
  vel: number;
  target: number | null;
  removed: boolean;
  settling: boolean;
}

export interface VisualState {
  leftStrap: number;
  rightStrap: number;
  pullDown: number;
  bottomPulled: number;
  underwearPulled: number;
  topRemoved: boolean;
  bottomRemoved: boolean;
  underwearRemoved: boolean;
  leftRope: VerletPoint[];
  rightRope: VerletPoint[];
  hemSway: number;
}

export interface ClothCommit {
  leftStrap: number;
  rightStrap: number;
  pullDown: number;
  bottomPulled: number;
  underwearPulled: number;
  topRemoved: boolean;
  bottomRemoved: boolean;
  underwearRemoved: boolean;
}

function slider(key: SimKey, material: MaterialDef, value = 0, removed = false): Slider {
  return { key, material, value, vel: 0, target: null, removed, settling: false };
}

export class ClothSim {
  left = slider("leftStrap", MATERIALS.thin_elastic);
  right = slider("rightStrap", MATERIALS.thin_elastic);
  top = slider("top", MATERIALS.soft_fabric);
  bottom = slider("bottom", MATERIALS.heavier_cloth);
  underwear = slider("underwear", MATERIALS.lace);
  leftRope: VerletPoint[] = [];
  rightRope: VerletPoint[] = [];
  hemSway = 0;
  hemVel = 0;
  private lastCommit = "";

  all(): Slider[] {
    return [this.left, this.right, this.top, this.bottom, this.underwear];
  }

  byKey(key: SimKey): Slider {
    if (key === "leftStrap") return this.left;
    if (key === "rightStrap") return this.right;
    if (key === "top") return this.top;
    if (key === "bottom") return this.bottom;
    return this.underwear;
  }

  configureMaterials(topType: string, bottomType: string) {
    this.left.material = MATERIALS.thin_elastic;
    this.right.material = MATERIALS.thin_elastic;
    this.top.material = topType === "spaghetti-strap" ? MATERIALS.soft_fabric : MATERIALS.soft_fabric;
    if (topType === "tank") this.top.material = MATERIALS.soft_fabric;
    this.bottom.material =
      bottomType === "skirt" ? MATERIALS.heavier_cloth : MATERIALS.heavier_cloth;
    if (bottomType === "shorts") {
      this.bottom.material = { ...MATERIALS.heavier_cloth, mass: 1.35, stiffness: 30 };
    }
    this.underwear.material = MATERIALS.lace;
  }

  snapshot(): VisualState {
    return {
      leftStrap: this.left.removed ? 1 : this.left.value,
      rightStrap: this.right.removed ? 1 : this.right.value,
      pullDown: this.top.removed ? 1 : this.top.value,
      bottomPulled: this.bottom.removed ? 1 : this.bottom.value,
      underwearPulled: this.underwear.removed ? 1 : this.underwear.value,
      topRemoved: this.top.removed,
      bottomRemoved: this.bottom.removed,
      underwearRemoved: this.underwear.removed,
      leftRope: this.leftRope,
      rightRope: this.rightRope,
      hemSway: this.hemSway,
    };
  }

  commitPayload(): ClothCommit {
    return {
      leftStrap: this.left.removed ? 1 : Math.min(1, Math.max(0, this.left.value)),
      rightStrap: this.right.removed ? 1 : Math.min(1, Math.max(0, this.right.value)),
      pullDown: this.top.removed ? 1 : Math.min(1, Math.max(0, this.top.value)),
      bottomPulled: this.bottom.removed ? 1 : Math.min(1, Math.max(0, this.bottom.value)),
      underwearPulled: this.underwear.removed ? 1 : Math.min(1, Math.max(0, this.underwear.value)),
      topRemoved: this.top.removed,
      bottomRemoved: this.bottom.removed,
      underwearRemoved: this.underwear.removed,
    };
  }

  beginDrag(key: SimKey) {
    const s = this.byKey(key);
    if (s.removed) return;
    s.target = s.value;
    s.settling = false;
  }

  dragTo(key: SimKey, next: number) {
    const s = this.byKey(key);
    if (s.removed) return;
    const max = 1 + s.material.stretch;
    s.target = Math.min(max, Math.max(-0.04, next));
  }

  release(key: SimKey) {
    const s = this.byKey(key);
    s.target = null;
    s.settling = true;
    const m = s.material;
    if (s.value >= m.removeThreshold || s.vel > m.escapeVel) {
      s.vel = Math.max(s.vel, m.offForce * 0.35);
    } else {
      s.vel *= 0.55;
    }
  }

  /** External button / save sync. Animates toward committed dress state. */
  reconcile(committed: ClothCommit, forceSnap = false) {
    const map: [Slider, number, boolean][] = [
      [this.left, committed.leftStrap, false],
      [this.right, committed.rightStrap, false],
      [this.top, committed.pullDown, committed.topRemoved],
      [this.bottom, committed.bottomPulled, committed.bottomRemoved],
      [this.underwear, committed.underwearPulled, committed.underwearRemoved],
    ];
    for (const [s, value, removed] of map) {
      if (s.target !== null) continue;
      if (forceSnap) {
        s.removed = removed || value >= 0.98;
        s.value = s.removed ? 1.12 : value;
        s.vel = 0;
        s.settling = false;
        continue;
      }
      if (removed && !s.removed) {
        s.settling = true;
        s.vel = Math.max(s.vel, s.material.offForce * 0.5);
      } else if (!removed && s.removed) {
        s.removed = false;
        s.value = 0.92;
        s.vel = -1.4;
        s.settling = true;
      } else if (!removed && Math.abs(s.value - value) > 0.55 && !s.settling) {
        s.settling = true;
        s.vel += (value - s.value) * 0.8;
      }
    }
    this.lastCommit = JSON.stringify(committed);
  }

  step(dtMs: number): boolean {
    const dt = Math.min(dtMs / 1000, 1 / 30);
    let changed = false;
    for (const s of this.all()) {
      if (this.integrate(s, dt)) changed = true;
    }
    const pull = this.top.removed ? 0 : this.top.vel;
    this.hemVel += (-this.hemSway * 18 + pull * 4 - this.hemVel * 6.5) * dt;
    this.hemSway += this.hemVel * dt;
    this.hemSway *= 0.992;
    return changed;
  }

  private integrate(s: Slider, dt: number): boolean {
    if (s.removed) {
      s.value = 1.12;
      s.vel = 0;
      return false;
    }
    const m = s.material;
    if (s.target !== null) {
      const err = s.target - s.value;
      const acc = (m.stiffness * err - (1 - m.damping) * 70 * s.vel) / m.mass;
      s.vel += acc * dt;
      s.value += s.vel * dt;
      const max = 1 + m.stretch;
      if (s.value > max) {
        s.value = max;
        s.vel *= -0.25;
      }
      if (s.value < -0.05) {
        s.value = -0.05;
        s.vel *= -0.2;
      }
      return true;
    }

    const shouldSlide = s.value >= m.removeThreshold || s.vel > m.escapeVel;
    if (shouldSlide) {
      s.vel += m.offForce * dt;
      s.vel *= 1 - 0.35 * dt;
      s.value += s.vel * dt;
      if (s.value >= 1.08) {
        s.value = 1.12;
        s.vel = 0;
        s.removed = true;
        s.settling = false;
        return true;
      }
      return true;
    }

    const err = 0 - s.value;
    const acc = (m.stiffness * 0.85 * err - (1 - m.damping) * 55 * s.vel) / m.mass;
    s.vel += acc * dt;
    s.value += s.vel * dt;
    if (Math.abs(s.value) < 0.006 && Math.abs(s.vel) < 0.05) {
      s.value = 0;
      s.vel = 0;
      s.settling = false;
      return false;
    }
    return true;
  }

  ensureRopes() {
    if (this.leftRope.length === 0) this.leftRope = this.blankRope();
    if (this.rightRope.length === 0) this.rightRope = this.blankRope();
  }

  private blankRope(): VerletPoint[] {
    return Array.from({ length: 6 }, () => ({ x: 0, y: 0, px: 0, py: 0, pinned: false }));
  }

  stepRopes(
    left: { sx: number; sy: number; ex: number; ey: number; taut: number },
    right: { sx: number; sy: number; ex: number; ey: number; taut: number },
    dtMs: number,
  ) {
    this.ensureRopes();
    this.stepRope(this.leftRope, left, dtMs, this.left);
    this.stepRope(this.rightRope, right, dtMs, this.right);
  }

  private stepRope(
    pts: VerletPoint[],
    ends: { sx: number; sy: number; ex: number; ey: number; taut: number },
    dtMs: number,
    slider: Slider,
  ) {
    const n = pts.length;
    if (n < 2) return;
    const dt = Math.min(dtMs / 1000, 1 / 30);
    const stretch = 1 + Math.max(0, slider.value) * 0.55 + Math.max(0, slider.vel) * 0.04;
    const rest = Math.hypot(ends.ex - ends.sx, ends.ey - ends.sy) / (n - 1) || 8;
    const restLen = rest * stretch;

    if (pts[0].x === 0 && pts[0].y === 0 && pts[1].x === 0) {
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const x = ends.sx + (ends.ex - ends.sx) * t;
        const y = ends.sy + (ends.ey - ends.sy) * t;
        pts[i].x = x;
        pts[i].y = y;
        pts[i].px = x;
        pts[i].py = y;
      }
    }

    pts[0].pinned = true;
    pts[0].x = ends.sx;
    pts[0].y = ends.sy;
    pts[n - 1].pinned = true;
    pts[n - 1].x = ends.ex;
    pts[n - 1].y = ends.ey;

    const g = 420 * (0.35 + (1 - ends.taut) * 0.85);
    const bounce = slider.material === MATERIALS.thin_elastic ? 1 : 0.7;

    for (let i = 1; i < n - 1; i++) {
      const p = pts[i];
      const vx = p.x - p.px;
      const vy = p.y - p.py;
      p.px = p.x;
      p.py = p.y;
      p.x += vx * 0.97;
      p.y += vy * 0.97 + g * dt * dt * bounce;
    }

    for (let iter = 0; iter < 3; iter++) {
      for (let i = 0; i < n - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.hypot(dx, dy) || 0.0001;
        const diff = (dist - restLen) / dist;
        const k = slider.material.stretch > 0.3 ? 0.42 : 0.5;
        if (!a.pinned) {
          a.x += dx * diff * k;
          a.y += dy * diff * k;
        }
        if (!b.pinned) {
          b.x -= dx * diff * k;
          b.y -= dy * diff * k;
        }
      }
      pts[0].x = ends.sx;
      pts[0].y = ends.sy;
      pts[n - 1].x = ends.ex;
      pts[n - 1].y = ends.ey;
    }
  }
}
