/*
 * Tangram engine
 * ---------------
 * Seven canonical pieces (the real tangram set):
 *   - 2 large right-isosceles triangles (legs = 2)
 *   - 1 medium right-isosceles triangle (legs = sqrt2)
 *   - 2 small right-isosceles triangles (legs = 1)
 *   - 1 square (side = 1)
 *   - 1 parallelogram (sides 1 and sqrt2)
 *
 * A "figure" (person, cat, ...) is just a placement for each of the 7 pieces:
 * every piece keeps its shape and size; only translation / rotation / flip
 * change. Morphing between two figures interpolates those rigid transforms,
 * so on screen you see the same pieces glide and spin into a new picture.
 */

const SQRT2 = Math.SQRT2;

// Canonical local geometry for each piece. Order is fixed and shared by every
// figure so piece i always maps to the same physical tan.
const PIECES = [
  { id: 'L1', kind: 'largeTri', points: [[0, 0], [2, 0], [0, 2]] },
  { id: 'L2', kind: 'largeTri', points: [[0, 0], [2, 0], [0, 2]] },
  { id: 'M',  kind: 'medTri',   points: [[0, 0], [SQRT2, 0], [0, SQRT2]] },
  { id: 'S1', kind: 'smallTri', points: [[0, 0], [1, 0], [0, 1]] },
  { id: 'S2', kind: 'smallTri', points: [[0, 0], [1, 0], [0, 1]] },
  { id: 'SQ', kind: 'square',   points: [[0, 0], [1, 0], [1, 1], [0, 1]] },
  { id: 'P',  kind: 'para',     points: [[0, 0], [1, 0], [2, 1], [1, 1]] },
];

const PIECE_INDEX = Object.fromEntries(PIECES.map((p, i) => [p.id, i]));

// Placement helper: p(x, y, rot, flipX, flipY)
const p = (x, y, rot = 0, flipX = 0, flipY = 0) => ({ x, y, rot, flipX, flipY });

/*
 * FIGURES: verified tangram tilings (from TangramTikz), converted to tan units.
 * Each figure uses all seven pieces edge-to-edge with no overlap.
 */
export const FIGURES = {
  cube: {
    L1: p(2, 0, 225),
    L2: p(2, 0, 315),
    SQ: p(2, 0, 45),
    S1: p(2.71, 0.71, 45),
    S2: p(2, 0, 135),
    P:  p(1.29, 0.71, 225),
    M:  p(0.59, 1.41, 270),
  },
  person: {
    SQ: p(0, 0, 225),
    L1: p(0, 2, 180),
    L2: p(1.41, 1.41, 135),
    P:  p(0, 2.41, 135, 0, 1),
    S1: p(-0.17, 5, 180),
    S2: p(1.71, 4.3, 135),
    M:  p(0, 2.83, 315),
  },
  candle: {
    L1: p(1.41, -1.41, 45),
    L2: p(2.12, -2.12, 135),
    M:  p(1.41, -2.83, 225),
    S1: p(1.41, -1.41, 315),
    S2: p(1.41, -2.83, 315),
    SQ: p(0.91, -3.83, 270),
    P:  p(0.91, -4.83, 270, 0, 1),
  },
  cat: {
    L1: p(2, 0, 180),
    L2: p(2, -2, 135),
    M:  p(-0.41, -2.41, 315),
    S1: p(0.59, -4.83, 135),
    S2: p(0.59, -4.83, 315),
    SQ: p(0.59, -3.41, 225),
    P:  p(2, 0, 0, 0, 1),
  },
  rocket: {
    L1: p(2, 0, 180),
    L2: p(0, -2, 0),
    M:  p(1, -3, 45),
    S1: p(0.5, 1, 180),
    S2: p(-0.5, 1, 0),
    SQ: p(0.5, 1, 270),
    P:  p(1.5, 0, 90, 0, 1),
  },
  sailboat: {
    L1: p(1.41, -1.41, 135),
    L2: p(0, -0.35, 180),
    S1: p(0.71, -0.71, 45),
    SQ: p(0.71, -0.71, 315),
    M:  p(0.41, 1, 225),
    S2: p(0, -2.83, 270),
    P:  p(-1.59, 0, 0),
  },
};

export const FIGURE_ORDER = ['cube', 'person', 'candle', 'cat', 'rocket', 'sailboat'];

// Default palette — distinct enough to track each piece through a morph,
// harmonious enough to work as a logo.
export const PALETTE = {
  L1: '#E86A5C', // coral red
  L2: '#F2A93B', // amber
  M:  '#4FB6A6', // teal
  S1: '#5B8DEF', // blue
  S2: '#B47CE0', // violet
  SQ: '#EA5C97', // pink
  P:  '#3FC7C0', // cyan
};

/* ---------- geometry helpers ---------- */

function transformPoint([lx, ly], pl) {
  const sx = pl.flipX ? -1 : 1;
  const sy = pl.flipY ? -1 : 1;
  let x = lx * sx;
  let y = ly * sy;
  const r = (pl.rot * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  const rx = x * c - y * s;
  const ry = x * s + y * c;
  return [rx + pl.x, ry + pl.y];
}

// Bounding box of a whole figure in tan-unit space.
function figureBounds(figure) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const piece of PIECES) {
    const pl = figure[piece.id];
    for (const pt of piece.points) {
      const [x, y] = transformPoint(pt, pl);
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2,
           w: maxX - minX, h: maxY - minY };
}

/* ---------- easing + angle helpers ---------- */

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Interpolate an angle taking the shortest rotational path.
function lerpAngle(a, b, t) {
  let d = (b - a) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return a + d * t;
}

const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- the renderer ---------- */

export class Tangram {
  /**
   * @param {SVGElement} svg  an <svg> element to render into
   * @param {object} opts     { padding, colors }
   */
  constructor(svg, opts = {}) {
    this.svg = svg;
    this.padding = opts.padding ?? 0.12;
    this.colors = opts.colors ?? PALETTE;
    this.NS = 'http://www.w3.org/2000/svg';

    // One <g> that centres/scales the whole figure; children are the pieces.
    this.root = document.createElementNS(this.NS, 'g');
    this.svg.appendChild(this.root);

    this.polys = {};
    for (const piece of PIECES) {
      const poly = document.createElementNS(this.NS, 'polygon');
      poly.setAttribute('points',
        piece.points.map((pt) => pt.join(',')).join(' '));
      poly.setAttribute('fill', this.colors[piece.id]);
      poly.setAttribute('stroke', 'rgba(0,0,0,0.14)');
      poly.setAttribute('stroke-width', '0.03');
      poly.setAttribute('stroke-linejoin', 'round');
      poly.dataset.piece = piece.id;
      this.root.appendChild(poly);
      this.polys[piece.id] = poly;
    }

    this._computeGlobalScale();
    this.current = this._snapshot(FIGURES[FIGURE_ORDER[0]]);
    this._apply(this.current);
    this.anim = null;
  }

  // Uniform scale so the largest figure fits the viewport with padding.
  _computeGlobalScale() {
    const vb = this.svg.viewBox.baseVal;
    this.view = { w: vb.width || 100, h: vb.height || 100 };
    let maxW = 0, maxH = 0;
    for (const name of FIGURE_ORDER) {
      const b = figureBounds(FIGURES[name]);
      if (b.w > maxW) maxW = b.w;
      if (b.h > maxH) maxH = b.h;
    }
    const availW = this.view.w * (1 - this.padding * 2);
    const availH = this.view.h * (1 - this.padding * 2);
    this.scale = Math.min(availW / maxW, availH / maxH);
  }

  // A morph state = per-piece placement + the figure centre to keep it framed.
  _snapshot(figure) {
    const b = figureBounds(figure);
    const state = { cx: b.cx, cy: b.cy, pieces: {} };
    for (const piece of PIECES) state.pieces[piece.id] = { ...figure[piece.id] };
    return state;
  }

  _pieceTransform(pl) {
    const sx = pl.flipX ? -1 : 1;
    const sy = pl.flipY ? -1 : 1;
    return `translate(${pl.x} ${pl.y}) rotate(${pl.rot}) scale(${sx} ${sy})`;
  }

  _apply(state) {
    const vx = this.view.w / 2;
    const vy = this.view.h / 2;
    this.root.setAttribute('transform',
      `translate(${vx} ${vy}) scale(${this.scale}) translate(${-state.cx} ${-state.cy})`);
    for (const piece of PIECES) {
      this.polys[piece.id].setAttribute('transform',
        this._pieceTransform(state.pieces[piece.id]));
    }
  }

  // Jump straight to a figure with no animation.
  set(name) {
    if (this.anim) { cancelAnimationFrame(this.anim); this.anim = null; }
    this.current = this._snapshot(FIGURES[name]);
    this._apply(this.current);
    this.currentName = name;
  }

  /**
   * Animate from the current state to a named figure.
   * @returns {Promise<void>} resolves when the morph completes
   */
  morphTo(name, { duration = 1100, stagger = 40 } = {}) {
    if (this.anim) { cancelAnimationFrame(this.anim); this.anim = null; }
    const from = this.current;
    const to = this._snapshot(FIGURES[name]);
    this.currentName = name;

    return new Promise((resolve) => {
      const start = performance.now();
      const total = duration + stagger * (PIECES.length - 1);

      const frame = (now) => {
        const elapsed = now - start;
        const state = { cx: 0, cy: 0, pieces: {} };
        const gt = easeInOutCubic(Math.min(1, elapsed / total));
        state.cx = lerp(from.cx, to.cx, gt);
        state.cy = lerp(from.cy, to.cy, gt);

        PIECES.forEach((piece, i) => {
          const pieceStart = stagger * i;
          const local = Math.min(1, Math.max(0, (elapsed - pieceStart) / duration));
          const t = easeInOutCubic(local);
          const a = from.pieces[piece.id];
          const b = to.pieces[piece.id];
          state.pieces[piece.id] = {
            x: lerp(a.x, b.x, t),
            y: lerp(a.y, b.y, t),
            rot: lerpAngle(a.rot, b.rot, t),
            flipX: t < 0.5 ? a.flipX : b.flipX,
            flipY: t < 0.5 ? a.flipY : b.flipY,
          };
        });

        this._applyMorph(state);

        if (elapsed < total) {
          this.anim = requestAnimationFrame(frame);
        } else {
          this.current = to;
          this._apply(to);
          this.anim = null;
          resolve();
        }
      };
      this.anim = requestAnimationFrame(frame);
    });
  }

  // Like _apply but snaps mirror axes at the midpoint of each piece morph.
  _applyMorph(state) {
    const vx = this.view.w / 2;
    const vy = this.view.h / 2;
    this.root.setAttribute('transform',
      `translate(${vx} ${vy}) scale(${this.scale}) translate(${-state.cx} ${-state.cy})`);
    for (const piece of PIECES) {
      this.polys[piece.id].setAttribute('transform',
        this._pieceTransform(state.pieces[piece.id]));
    }
  }
}

