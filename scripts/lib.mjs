// Shared helpers: seeded randomness, colour maths, a bat outline, and a tiny
// pixel-art raster that turns painted pixels into compact SVG paths.

export const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace";

export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const r1 = (n) => Math.round(n * 10) / 10;
export const pts = (a) => a.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ');
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const lerp = (a, b, t) => {
  const A = hex(a), B = hex(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
};
export const seedOf = (s) => [...String(s)].reduce((a, ch) => Math.imul(a ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261);

// An original bat outline (right half, mirrored), centred on 0,0, ~100 x 30 units.
const BAT_S = [0, -5];
const BAT_SEGS = [
  ['L', [3.5, -13]], ['L', [6, -5.5]],
  ['C', [14, -7], [23, -15], [31, -17]],
  ['C', [39, -13], [47, -6], [50, 4]],
  ['C', [44, 0], [38, 1], [34, 8]],
  ['C', [30, 3], [25, 3], [20, 10]],
  ['C', [15, 5], [9, 7], [5, 15]],
  ['L', [0, 10]],
];
export function batPoly(k = 1, n = 8) {
  const m = (p) => [-p[0], p[1]];
  const end = (s) => s[s.length - 1];
  const segs = [];
  let prev = BAT_S;
  for (const s of BAT_SEGS) { segs.push([prev, s]); prev = end(s); }
  for (let i = BAT_SEGS.length - 1; i >= 0; i--) {
    const s = BAT_SEGS[i], p0 = i === 0 ? BAT_S : end(BAT_SEGS[i - 1]);
    const rev = s[0] === 'L' ? ['L', m(p0)] : ['C', m(s[2]), m(s[1]), m(p0)];
    segs.push([prev, rev]); prev = end(rev);
  }
  const out = [BAT_S];
  for (const [from, s] of segs) {
    if (s[0] === 'L') { out.push(s[1]); continue; }
    for (let t = 1; t <= n; t++) {
      const u = t / n, a = (1 - u) ** 3, b = 3 * u * (1 - u) ** 2, c = 3 * u * u * (1 - u), d = u ** 3;
      out.push([a * from[0] + b * s[1][0] + c * s[2][0] + d * s[3][0], a * from[1] + b * s[1][1] + c * s[2][1] + d * s[3][1]]);
    }
  }
  return out.map(([x, y]) => [x * k, y * k]);
}

export const pip = (poly) => (x, y) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

// smooth value noise in [0,1]
export function vnoise(seed, cell, w, h) {
  const r = rng(seed);
  const gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2;
  const g = Array.from({ length: gw * gh }, r);
  const s = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const gx = x / cell, gy = y / cell, ix = Math.floor(gx), iy = Math.floor(gy), fx = s(gx - ix), fy = s(gy - iy);
    const a = g[iy * gw + ix], b = g[iy * gw + ix + 1], c = g[(iy + 1) * gw + ix], d = g[(iy + 1) * gw + ix + 1];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}

// ordered (Bayer) dithering between palette steps; only dithers near the middle of a step
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export function dpick(v, x, y, n, band = 0.22) {
  const f = Math.max(0, Math.min(0.9999, v)) * (n - 1);
  const base = Math.floor(f), frac = f - base;
  const thr = 0.5 + (BAYER[(y & 3) * 4 + (x & 3)] - 0.5) * 2 * band;
  return Math.min(n - 1, base + (frac > thr ? 1 : 0));
}

// ---------- pixel fonts ----------
const F5 = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'], B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'], D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'], F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'], H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'], J: ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'], L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'], N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'], R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'], T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'], V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'], X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'], Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'], 1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'], 3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'], 5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'], 7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'], 9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'], '.': ['.....', '.....', '.....', '.....', '.....', '.....', '..#..'],
  '-': ['.....', '.....', '.....', '.###.', '.....', '.....', '.....'],
};
const F3 = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'], D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'], G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'], J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '###', '#.#', '#.#'], N: ['##.', '#.#', '#.#', '#.#', '#.#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'], P: ['##.', '#.#', '##.', '#..', '#..'],
  Q: ['.#.', '#.#', '#.#', '##.', '.##'], R: ['##.', '#.#', '##.', '#.#', '#.#'], S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'], V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#.#', '#.#', '###', '###', '#.#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'], 3: ['##.', '..#', '.#.', '..#', '##.'],
  4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'], 6: ['.##', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'],
  8: ['###', '#.#', '###', '#.#', '###'], 9: ['###', '#.#', '###', '..#', '##.'],
  ' ': ['...', '...', '...', '...', '...'], '.': ['...', '...', '...', '...', '.#.'], '-': ['...', '...', '###', '...', '...'],
  '>': ['#..', '.#.', '..#', '.#.', '#..'], '/': ['..#', '..#', '.#.', '#..', '#..'], ':': ['...', '.#.', '...', '.#.', '...'],
  '!': ['.#.', '.#.', '.#.', '...', '.#.'], '@': ['###', '#.#', '#.#', '#..', '.##'], '_': ['...', '...', '...', '...', '###'],
  '·': ['...', '...', '.#.', '...', '...'], '+': ['...', '.#.', '###', '.#.', '...'], '#': ['#.#', '###', '#.#', '###', '#.#'],
};
export const FONTS = { big: { w: 5, h: 7, g: F5 }, small: { w: 3, h: 5, g: F3 } };
export const textWidth = (str, font) => String(str).length * (font.w + 1) - 1;

export class Raster {
  constructor(w, h) { this.w = w; this.h = h; this.c = new Array(w * h).fill(null); }
  in(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  set(x, y, col) { x = Math.floor(x); y = Math.floor(y); if (this.in(x, y)) this.c[y * this.w + x] = col; }
  get(x, y) { return this.in(x, y) ? this.c[y * this.w + x] : null; }
  rect(x, y, w, h, col) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, col); }
  // fill a region; top/left edge pixels get `hi`, bottom/right get `lo`, and a 1px `line` goes around it
  shape(test, [x0, y0, x1, y1], { fill, hi, lo, line } = {}) {
    x0 = Math.floor(x0); y0 = Math.floor(y0); x1 = Math.ceil(x1); y1 = Math.ceil(y1);
    const inside = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && test(x + 0.5, y + 0.5);
    const px = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inside(x, y)) px.push([x, y]);
    for (const [x, y] of px) {
      let col = fill;
      if (lo && (!inside(x + 1, y) || !inside(x, y + 1))) col = lo;
      if (hi && (!inside(x - 1, y) || !inside(x, y - 1))) col = hi;
      if (col) this.set(x, y, col);
    }
    if (line) for (const [x, y] of px) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!inside(x + dx, y + dy)) this.set(x + dx, y + dy, line);
    return { px, inside };
  }
  ellipse(cx, cy, rx, ry, o) { return this.shape((x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1, [cx - rx, cy - ry, cx + rx, cy + ry], o); }
  box(x, y, w, h, o, r = 0) {
    const t = (px, py) => {
      const dx = Math.max(x + r - px, 0, px - (x + w - r)), dy = Math.max(y + r - py, 0, py - (y + h - r));
      return r === 0 || dx * dx + dy * dy <= r * r;
    };
    return this.shape(t, [x, y, x + w - 1, y + h - 1], o);
  }
  poly(p, o) {
    const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
    return this.shape(pip(p), [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], o);
  }
  line(x0, y0, x1, y1, col) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) this.set(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), col);
  }
  sprite(x, y, rows, pal) { rows.forEach((r, j) => [...r].forEach((ch, i) => { if (pal[ch]) this.set(x + i, y + j, pal[ch]); })); }
  text(x, y, str, font, col) {
    let cx = x;
    for (const ch of String(str).toUpperCase()) {
      const g = font.g[ch];
      if (g) g.forEach((row, j) => [...row].forEach((b, i) => { if (b === '#') this.set(cx + i, y + j, col); }));
      cx += font.w + 1;
    }
  }
  // merge equal-colour runs into rectangles (vertically too) and emit one <path> per colour
  emit(ox = 0, oy = 0) {
    const byColor = new Map();
    let open = new Map();
    for (let y = 0; y < this.h; y++) {
      const next = new Map();
      for (let x = 0; x < this.w;) {
        const c = this.c[y * this.w + x];
        if (c == null) { x++; continue; }
        let x2 = x + 1;
        while (x2 < this.w && this.c[y * this.w + x2] === c) x2++;
        const key = `${x},${x2 - x},${c}`;
        let r = open.get(key);
        if (r) r.h++;
        else { r = { x, y, w: x2 - x, h: 1 }; if (!byColor.has(c)) byColor.set(c, []); byColor.get(c).push(r); }
        next.set(key, r);
        x = x2;
      }
      open = next;
    }
    return [...byColor].map(([c, rs]) => `<path fill="${c}" d="${rs.map((r) => `M${r.x + ox} ${r.y + oy}h${r.w}v${r.h}h-${r.w}z`).join('')}"/>`).join('');
  }
}

// cycle through raster frames in place (discrete, so pixels stay crisp)
export function frames(list, dur, ox = 0, oy = 0, attrs = '') {
  const n = list.length;
  const kt = list.map((_, j) => (j / n).toFixed(4)).join(';');
  return `<g ${attrs}>` + list.map((r, i) => {
    const vals = list.map((_, j) => (j === i ? 1 : 0)).join(';');
    return `<g opacity="${i === 0 ? 1 : 0}"><animate attributeName="opacity" values="${vals}" keyTimes="${kt}" calcMode="discrete" dur="${dur}s" repeatCount="indefinite"/>${r.emit(ox, oy)}</g>`;
  }).join('') + '</g>';
}
