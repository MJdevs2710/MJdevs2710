// Pixel-art bat cave header (320 x 180 pixels, shown at 3x): a hooded developer at a
// three-screen desk, a neon bat sign, a shelf of hackathon trophies, a waterfall, a round
// cave opening onto the night city, server racks and bats. Everything is drawn from code.
import { rng, esc, batPoly, pip, vnoise, dpick, Raster, FONTS, textWidth, frames } from './lib.mjs';

const C = {
  void: '#060914', r0: '#0b1024', r1: '#111833', r2: '#192245', r3: '#232f5c', r4: '#33437e', line: '#03050b',
  neon: '#ffd43b', neonDim: '#a8801a',
  scr: '#061430', bar: '#0d2c55', blue: '#3aa0ff', blueHi: '#a8d8ff', blueDk: '#163e74', white: '#eef6ff',
  red: '#e23636', redHi: '#ff7b7b', redDk: '#8f1d25', green: '#3bdc6a',
  gold: '#ffc933', goldHi: '#fff1a6', goldDk: '#b07a10',
  metal: '#262f57', metalHi: '#3d4a85', metalDk: '#151b38',
  water: '#1d4f96', water2: '#3f86e0', foam: '#cfe6ff',
  hood: '#2c3770', hoodHi: '#4b5cae', hoodLo: '#1b2350',
};

export function batcave(cal, cfg, USER) {
  const W = 320, H = 180;
  const R = rng(4242);
  const F3 = FONTS.small, F5 = FONTS.big;
  const bg = new Raster(W, H), fg = new Raster(W, H);
  const defs = [], mid = [], top = [];
  const rock = { fill: C.r2, hi: C.r3, lo: C.r0, line: C.line };

  // ---------- cave wall: lit by the monitors and the cave mouth, darker at the edges ----------
  const n1 = vnoise(1, 14, W, H), n2 = vnoise(2, 5, W, H);
  const shaft = pip([[246, 70], [262, 78], [214, 164], [170, 164]]);
  const ramp = [C.void, C.r0, C.r1, C.r2, C.r3];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const lm = Math.max(0, 1 - Math.hypot((x - 160) / 1.8, (y - 108) * 1.2) / 110);
    const lw = Math.max(0, 1 - Math.hypot(x - 272, y - 48) / 60);
    let v = 0.2 + lm * 0.5 + lw * 0.25 + (n1(x, y) - 0.5) * 0.4 + (n2(x, y) - 0.5) * 0.15;
    if (shaft(x + 0.5, y + 0.5)) v += 0.14;
    v *= 0.5 + 0.5 * Math.min(1, Math.min(x, W - x) / 60);
    bg.set(x, y, ramp[dpick(v, x, y, ramp.length)]);
  }

  // floor
  for (let y = 164; y < H; y++) for (let x = 0; x < W; x++) {
    const v = 0.4 + 0.3 * Math.max(0, 1 - Math.abs(x - 170) / 160) - (y - 164) * 0.018 + (n2(x, y) - 0.5) * 0.25;
    bg.set(x, y, [C.void, C.r0, C.r1, C.r2][dpick(v, x, y, 4)]);
  }
  bg.rect(0, 164, W, 1, C.r3);
  for (let i = 0; i < 16; i++) bg.ellipse(R() * W, 168 + R() * 10, 1.5 + R() * 2.5, 1 + R(), { fill: C.r2, hi: C.r3, lo: C.r0 });

  // ceiling and stalactites
  bg.rect(0, 0, W, 3, C.void);
  const tips = [];
  for (let x = -3; x < W;) {
    const w = 6 + Math.floor(R() * 12);
    const len = 6 + Math.floor(R() * (x > 120 && x < 236 ? 10 : 22));
    const tx = x + w / 2 + (R() - 0.5) * 3;
    bg.poly([[x, 0], [x + w, 0], [tx, len]], { fill: C.void, hi: C.r1 });
    tips.push([Math.round(tx), len]);
    x += w - 2;
  }

  // ---------- waterfall ----------
  const WF = { x: 12, w: 16, y0: 16, y1: 150 };
  for (let y = WF.y0; y < WF.y1; y++) for (let x = WF.x; x < WF.x + WF.w; x++) {
    const e = Math.min(x - WF.x, WF.x + WF.w - 1 - x);
    bg.set(x, y, e === 0 ? C.water2 : C.water);
  }
  bg.ellipse(20, 13, 12, 5, rock);
  bg.ellipse(20, 154, 19, 5, { fill: C.water, hi: C.water2, line: C.line });
  bg.ellipse(3, 156, 6, 6, rock);
  bg.ellipse(38, 158, 5, 4, rock);
  const tileH = 16, streak = new Raster(WF.w, WF.y1 - WF.y0 + tileH);
  const wr = rng(77), tile = [];
  for (let i = 0; i < 16; i++) tile.push([1 + Math.floor(wr() * (WF.w - 2)), Math.floor(wr() * tileH), 2 + Math.floor(wr() * 5), wr() < 0.4 ? C.foam : C.water2]);
  for (let k = 0; k * tileH < streak.h; k++) for (const [x, y, l, c] of tile) for (let j = 0; j < l; j++) streak.set(x, k * tileH + y + j, c);
  defs.push(`<clipPath id="wfc"><rect x="${WF.x}" y="${WF.y0 + 2}" width="${WF.w}" height="${WF.y1 - WF.y0 - 2}"/></clipPath>`);
  mid.push(`<g clip-path="url(#wfc)"><g><animateTransform attributeName="transform" type="translate" values="${Array.from({ length: tileH }, (_, i) => `0 ${i}`).join(';')}" calcMode="discrete" dur=".7s" repeatCount="indefinite"/>${streak.emit(WF.x, WF.y0 - tileH)}</g></g>`);
  const splash = [0, 1].map((f) => {
    const r = new Raster(W, H), sr = rng(31 + f);
    for (let i = 0; i < 22; i++) r.set(6 + Math.floor(sr() * 28), 147 + Math.floor(sr() * 9), sr() < 0.5 ? C.foam : C.water2);
    return r;
  });
  mid.push(frames(splash, 0.5));

  // ---------- glass case with a dark suit ----------
  const suit = { fill: '#0e1430', hi: '#2c3c78', lo: '#070a16', line: C.line };
  bg.box(35, 84, 26, 4, { fill: C.metal, hi: C.metalHi, lo: C.metalDk, line: C.line });
  bg.box(36, 88, 24, 70, { fill: '#0c1838', line: C.line });
  for (let y = 88; y < 158; y++) for (let x = 36; x < 60; x++) if (Math.abs(x - 48) < 3 + (y - 88) * 0.17 && ((x + y) & 1) === 0) bg.set(x, y, '#16295a');
  bg.poly([[40, 108], [56, 108], [60, 154], [36, 154]], { fill: '#070a16', hi: '#1d2a5a', line: C.line });
  bg.ellipse(48, 112, 8, 3.5, suit);
  bg.box(43, 112, 11, 20, suit);
  bg.box(44, 132, 4, 20, suit);
  bg.box(49, 132, 4, 20, suit);
  bg.rect(43, 126, 11, 2, C.goldDk);
  bg.rect(44, 126, 9, 1, C.gold);
  bg.poly([[44, 101], [45, 94], [47.5, 99]], suit);
  bg.poly([[48.5, 99], [51, 94], [52, 101]], suit);
  bg.ellipse(48, 103, 4, 5, suit);
  bg.set(46, 103, C.blueHi); bg.set(50, 103, C.blueHi);
  bg.line(37, 118, 58, 97, '#223f80');
  bg.line(37, 124, 50, 111, '#1b3470');
  bg.box(34, 158, 28, 6, { fill: C.metal, hi: C.metalHi, lo: C.metalDk, line: C.line });

  // ---------- neon bat sign (hung from the ceiling) ----------
  bg.rect(80, 3, 1, 33, C.r3);
  bg.rect(112, 3, 1, 33, C.r3);
  const inBat = pip(batPoly(0.64).map(([x, y]) => [x + 96, y + 46]));
  const isIn = (x, y) => inBat(x + 0.5, y + 0.5);
  const neon = new Raster(W, H);
  for (let y = 26; y < 68; y++) for (let x = 58; x < 136; x++) {
    if (isIn(x, y)) {
      const edge = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]].some(([dx, dy]) => !isIn(x + dx, y + dy));
      if (edge) { bg.set(x, y, C.neonDim); neon.set(x, y, C.neon); } else bg.set(x, y, y % 2 ? '#5c440b' : '#33260a');
    } else if (isIn(x - 1, y) || isIn(x + 1, y) || isIn(x, y - 1) || isIn(x, y + 1)) bg.set(x, y, C.line);
  }
  const neonPx = neon.emit();
  mid.push(`<g class="flick"><g filter="url(#glow)">${neonPx}</g>${neonPx}</g>`);

  // ---------- hall of wins: plaque, shelves and one trophy per hackathon win ----------
  const nT = Math.max(0, Math.min(12, Number(cfg.trophies ?? 12)));
  bg.box(152, 34, 56, 9, { fill: C.metalDk, hi: C.metal, line: C.line });
  bg.text(180 - Math.floor(textWidth('HALL OF WINS', F3) / 2), 36, 'HALL OF WINS', F3, C.neon);
  const TROPHY = ['HHHHHHH', 'gHggggd', 'gHggggd', '.gggdd.', '..ggd..', '...d...', '..ggd..', '.bbbbb.'];
  const tPal = { H: C.goldHi, g: C.gold, d: C.goldDk, b: C.metalHi };
  const trophySpots = [];
  [56, 74].forEach((sy, shelf) => {
    bg.box(134, sy, 92, 2, { fill: C.metalHi, line: C.line });
    bg.rect(134, sy + 2, 92, 1, C.metalDk);
    bg.poly([[140, sy + 2], [146, sy + 2], [140, sy + 8]], { fill: C.metal, line: C.line });
    bg.poly([[214, sy + 2], [220, sy + 2], [220, sy + 8]], { fill: C.metal, line: C.line });
    for (let i = 0; i < 6; i++) {
      if (shelf * 6 + i >= nT) break;
      const x = 138 + i * 15, y = sy - 8;
      bg.sprite(x, y, TROPHY, tPal);
      bg.rect(x - 1, y + 1, 1, 2, C.gold);
      bg.rect(x + 7, y + 1, 1, 2, C.goldDk);
      trophySpots.push([x + 1, y]);
    }
  });
  trophySpots.filter((_, i) => i % 4 === 1).forEach(([x, y], i) => {
    top.push(`<g class="sp" style="animation-delay:-${(i * 1.1).toFixed(1)}s" fill="#ffffff"><rect x="${x}" y="${y - 1}" width="1" height="3"/><rect x="${x - 1}" y="${y}" width="3" height="1"/></g>`);
  });

  // ---------- round cave mouth onto the night city ----------
  const WX = 272, WY = 48, WR = 28;
  const sky = ['#0a1330', '#111f48', '#1a2b5e', '#243a74'];
  const cr = rng(9), city = [];
  for (let bx = WX - WR; bx < WX + WR;) { const w = 3 + Math.floor(cr() * 5); city.push([bx, w, 5 + Math.floor(cr() * 14)]); bx += w; }
  for (let y = WY - WR - 6; y <= WY + WR + 6; y++) for (let x = WX - WR - 6; x <= WX + WR + 6; x++) {
    const d = Math.hypot(x + 0.5 - WX, y + 0.5 - WY);
    const ang = Math.atan2(y - WY, x - WX);
    const rim = WR + 3.2 + 1.3 * Math.sin(ang * 5) + 0.8 * Math.sin(ang * 11 + 1);
    if (d <= WR) {
      let col = sky[dpick(((y - (WY - WR)) / (2 * WR)) * 0.95, x, y, sky.length)];
      const b = city.find(([bx, w]) => x >= bx && x < bx + w);
      if (b && y >= WY + WR - b[2]) col = (x % 2 === 0 && y % 2 === 0 && (x * 7 + y * 13) % 5 === 0) ? '#ffd27a' : '#070b1c';
      bg.set(x, y, col);
    } else if (d <= rim) bg.set(x, y, d < WR + 1.2 ? C.r4 : ang < -0.5 && ang > -2.6 ? C.r3 : C.r2);
    else if (d <= rim + 1) bg.set(x, y, C.line);
  }
  bg.ellipse(283, 35, 6, 6, { fill: '#f1e8c9', lo: '#cfc39d' });
  bg.set(281, 34, '#d8ccaa'); bg.set(285, 37, '#d8ccaa'); bg.set(282, 38, '#d8ccaa');
  [[256, 30], [262, 40], [292, 52], [250, 46], [276, 26], [266, 32]].forEach(([x, y]) => bg.set(x, y, '#dfe7ff'));
  [[259, 36], [288, 46], [270, 40], [254, 52]].forEach(([x, y], i) => mid.push(`<rect class="tw" style="animation-delay:-${i * 0.8}s" x="${x}" y="${y}" width="1" height="1" fill="#ffffff"/>`));
  // a tiny red-and-blue web-slinger swinging past the window
  defs.push(`<clipPath id="win"><circle cx="${WX}" cy="${WY}" r="${WR}"/></clipPath>`);
  mid.push(`<g clip-path="url(#win)"><g transform="translate(264 30)"><g><animateTransform attributeName="transform" type="rotate" values="42;-42;42" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="2.8s" repeatCount="indefinite"/>` +
    `<line x1="0" y1="0" x2="0" y2="15" stroke="#dfe7ff" stroke-width=".4"/><rect x="-1" y="15" width="2" height="2" fill="#e23636"/><rect x="-1" y="17" width="2" height="2" fill="#1f4fd6"/><rect x="-1" y="19" width="1" height="1" fill="#e23636"/><rect x="0" y="19" width="1" height="1" fill="#e23636"/></g></g></g>`);

  // ---------- three monitors ----------
  const mon = (x, y, w, h) => { bg.box(x, y, w, h, { fill: '#1b2246', hi: '#2e3a70', lo: '#10152e', line: C.line }); bg.rect(x + 2, y + 2, w - 4, h - 4, C.scr); };
  mon(70, 96, 42, 30); mon(114, 78, 92, 48); mon(208, 96, 42, 30);

  // centre: name, two lines, typing code
  bg.rect(116, 80, 88, 7, C.bar);
  bg.text(118, 81, 'CAVE OS', F3, C.blueHi);
  bg.text(192, 81, 'REC', F3, C.redHi);
  mid.push(`<rect class="blink" x="188" y="82" width="2" height="2" fill="${C.red}"/>`);
  const name = String(cfg.name || USER).toUpperCase();
  const nf = textWidth(name, F5) <= 84 ? F5 : F3;
  const nx = 160 - Math.floor(textWidth(name, nf) / 2);
  bg.text(nx, 90, name, nf, C.blue);
  bg.text(nx, 89, name, nf, C.white);
  (cfg.screen || []).slice(0, 2).forEach((ln, i) => bg.text(118, 99 + i * 6, String(ln).slice(0, 21), F3, i === 0 ? C.neon : C.blueHi));
  const cr2 = rng(5), segs = [], syn = [C.blue, C.blueHi, C.neon, C.redHi, '#7ee0a0'];
  for (let l = 0; l < 3; l++) {
    let x = 118 + (l === 1 ? 4 : 0);
    const y = 112 + l * 4;
    while (true) { const w = 3 + Math.floor(cr2() * 9); if (x + w > 199) break; segs.push({ x, y, w, c: syn[Math.floor(cr2() * syn.length)] }); x += w + 2; }
  }
  mid.push(segs.map((s, i) => `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="2" fill="${s.c}" opacity="0"><animate attributeName="opacity" values="0;1;0" keyTimes="0;${(0.04 + (0.82 * i) / segs.length).toFixed(3)};.95" calcMode="discrete" dur="7s" repeatCount="indefinite"/></rect>`).join(''));

  // left: radar
  bg.text(74, 99, 'SCAN', F3, C.blueHi);
  const [RX, RY] = [96, 113];
  for (let y = 98; y < 124; y++) for (let x = 72; x < 110; x++) {
    const d = Math.hypot(x + 0.5 - RX, y + 0.5 - RY);
    if ([4, 7.5, 10.5].some((r) => Math.abs(d - r) < 0.5)) bg.set(x, y, C.blueDk);
    else if ((x === RX || y === RY) && d < 11) bg.set(x, y, '#0f2d57');
  }
  bg.text(74, 118, String(cfg.location || '').slice(0, 3), F3, C.blue);
  const sweep = Array.from({ length: 12 }, (_, k) => {
    const r = new Raster(W, H), a = (k * Math.PI) / 6;
    for (const [da, col] of [[-0.5, C.blueDk], [-0.25, C.blue], [0, C.blueHi]]) {
      for (let t = 1; t <= 10; t++) r.set(RX + Math.round(Math.cos(a + da) * t), RY + Math.round(Math.sin(a + da) * t), col);
    }
    return r;
  });
  mid.push(frames(sweep, 2.4));
  [[99, 108], [91, 116], [102, 117]].forEach(([x, y], i) => mid.push(`<rect class="blink" style="animation-delay:-${i * 0.5}s" x="${x}" y="${y}" width="1" height="1" fill="${C.red}"/>`));

  // right: real activity over the last 12 months
  bg.text(211, 99, 'ACTIVITY', F3, C.blueHi);
  bg.rect(210, 123, 38, 1, C.blueDk);
  const weekly = cal.weeks.map((w) => w.reduce((a, d) => a + d.c, 0));
  const bins = [];
  for (let i = weekly.length; i > 0 && bins.length < 13; i -= 4) bins.unshift(weekly.slice(Math.max(0, i - 4), i).reduce((a, b) => a + b, 0));
  const mx = Math.max(1, ...bins);
  const bars = new Raster(W, H);
  bins.forEach((v, i) => {
    const h = 1 + Math.round((v / mx) * 14), x = 210 + i * 3;
    bars.rect(x, 123 - h, 2, h, i === bins.length - 1 ? C.neon : C.blue);
    bars.rect(x, 123 - h, 2, 1, i === bins.length - 1 ? '#fff1a6' : C.blueHi);
  });
  const steps = Array.from({ length: 16 }, (_, k) => k);
  const kt = steps.map((k) => (k * 0.012).toFixed(3)).join(';');
  defs.push(`<clipPath id="barclip"><rect x="210" y="123" width="40" height="0"><animate attributeName="y" values="${steps.map((k) => 123 - k).join(';')}" keyTimes="${kt}" calcMode="discrete" dur="8s" repeatCount="indefinite"/><animate attributeName="height" values="${steps.join(';')}" keyTimes="${kt}" calcMode="discrete" dur="8s" repeatCount="indefinite"/></rect></clipPath>`);
  mid.push(`<g clip-path="url(#barclip)">${bars.emit()}</g>`);

  // ---------- desk, keyboard, server racks ----------
  bg.rect(62, 126, 240, 1, '#4a5896');
  bg.rect(62, 127, 240, 2, '#2e3866');
  bg.rect(62, 129, 240, 2, '#1d2449');
  bg.rect(62, 131, 240, 1, C.line);
  bg.rect(64, 132, 236, 32, '#070a17');
  bg.box(64, 132, 3, 32, { fill: C.metal, hi: C.metalHi, line: C.line });
  bg.box(297, 132, 3, 32, { fill: C.metal, hi: C.metalHi, line: C.line });
  bg.box(160, 122, 46, 4, { fill: '#1a2446', hi: '#2e3c70', line: C.line });
  for (let k = 0; k < 14; k++) bg.rect(162 + k * 3, 123, 2, 1, '#3a4a84');
  for (let k = 0; k < 13; k++) bg.rect(163 + k * 3, 124, 2, 1, '#3a4a84');
  for (let i = 0; i < 7; i++) {
    const k = Math.floor(R() * 8), row = Math.floor(R() * 2);
    top.push(`<rect class="kf" style="animation-delay:-${(R() * 0.6).toFixed(2)}s" x="${162 + row + k * 3}" y="${123 + row}" width="2" height="1" fill="${C.blueHi}"/>`);
  }
  const leds = [];
  for (const x of [76, 236]) {
    bg.box(x, 138, 34, 26, { fill: '#121833', hi: '#25305c', lo: '#0b0f22', line: C.line });
    for (let s = 0; s < 4; s++) {
      bg.rect(x + 3, 141 + s * 6, 28, 4, '#0c1128');
      bg.rect(x + 3, 141 + s * 6, 28, 1, '#1b2448');
      for (let v = 0; v < 6; v++) bg.rect(x + 5 + v * 3, 143 + s * 6, 2, 1, '#1b2448');
      leds.push([x + 26, 142 + s * 6, s % 2 ? C.green : C.blue], [x + 28, 142 + s * 6, s === 2 ? C.red : C.green]);
    }
  }
  mid.push(leds.map(([x, y, c], i) => `<rect class="l${1 + (i % 3)}" style="animation-delay:-${(R() * 2).toFixed(2)}s" x="${x}" y="${y}" width="1" height="2" fill="${c}"/>`).join(''));

  // ---------- hanging bats with blinking eyes ----------
  const HANG = ['..o..', '.ooo.', 'ooooo', 'o.o.o', '.ooo.', 'o.o.o'];
  for (const want of [52, 128, 232]) {
    const [tx, ty] = tips.reduce((best, t) => (Math.abs(t[0] - want) < Math.abs(best[0] - want) ? t : best));
    bg.sprite(tx - 2, ty, HANG, { o: '#020309' });
    top.push(`<g class="eye" style="animation-delay:-${(R() * 4).toFixed(1)}s" fill="#ff3b3b"><rect x="${tx - 1}" y="${ty + 3}" width="1" height="1"/><rect x="${tx + 1}" y="${ty + 3}" width="1" height="1"/></g>`);
  }

  // ---------- foreground: the developer, chair and desk toys ----------
  const hood = { fill: C.hood, hi: C.hoodHi, lo: C.hoodLo, line: C.line };
  const PX = 200;
  fg.ellipse(PX, 124, 13, 7, hood);
  fg.poly([[PX - 7.5, 105], [PX - 6.5, 96.5], [PX - 2.5, 102]], hood);
  fg.poly([[PX + 2.5, 102], [PX + 6.5, 96.5], [PX + 7.5, 105]], hood);
  fg.ellipse(PX, 110, 8.5, 9, hood);
  for (let y = 103; y <= 118; y++) fg.set(PX, y, C.hoodLo);
  fg.ellipse(PX - 8.5, 111, 2, 3, { fill: C.red, hi: C.redHi, lo: C.redDk, line: C.line });
  fg.ellipse(PX + 8.5, 111, 2, 3, { fill: C.red, hi: C.redHi, lo: C.redDk, line: C.line });
  fg.box(PX - 13, 124, 27, 30, { fill: '#10152c', hi: '#28325f', lo: '#090c1b', line: C.line }, 4);
  fg.sprite(PX - 3, 134, ['y.....y', 'yy.y.yy', '.yyyyy.'], { y: '#b38b1d' });
  fg.rect(PX - 1, 154, 3, 6, C.metal);
  fg.rect(PX - 11, 160, 23, 2, C.metal);
  for (const dx of [-12, -1, 10]) fg.rect(PX + dx, 162, 3, 2, C.line);
  const elbows = [[0, 1], [1, 0]].map(([a, b]) => {
    const r = new Raster(W, H);
    r.ellipse(PX - 14, 121 + a, 2.6, 2.2, hood);
    r.ellipse(PX + 14, 121 + b, 2.6, 2.2, hood);
    return r;
  });
  fg.sprite(254, 120, ['wccccw..', 'wwwwwWww', 'wrrrrW.w', 'wwwwwWww', 'wwwwwW..', '.WWWW...'], { w: '#d9e3f2', W: '#8fa0bd', c: '#4a2c1a', r: C.red });
  fg.sprite(266, 120, ['...yyy.', '...yeyO', 'y..yyyO', 'yyyyyy.', 'yYYYYy.', '.yyyy..'], { y: C.neon, Y: '#d9a816', e: '#111111', O: '#ff8a3d' });
  fg.sprite(280, 117, ['.rrr.', 'rWrWr', '.rrr.', 'brrrb', 'brrrb', '.b.b.', '.b.b.', 'rr.rr'], { r: C.red, W: '#ffffff', b: '#1f4fd6' });
  fg.rect(279, 125, 7, 1, C.metalDk);
  const steam = [[[257, 117], [256, 115], [257, 113]], [[258, 116], [257, 114], [258, 112]], [[256, 116], [257, 114], [256, 112]]].map((p) => {
    const r = new Raster(W, H);
    p.forEach(([x, y]) => r.set(x, y, '#9fb0c8'));
    return r;
  });

  // ---------- flying bats ----------
  const BAT_UP = ['o.........o', 'oo.......oo', '.ooo.o.ooo.', '..ooooooo..', '....ooo....'];
  const BAT_DN = ['....o.o....', '...ooooo...', '..ooooooo..', '.ooo...ooo.', 'oo.......oo'];
  const batFrames = [BAT_UP, BAT_DN].map((sp) => { const r = new Raster(11, 5); r.sprite(0, 0, sp, { o: '#020309' }); return r; });
  for (let i = 0; i < 4; i++) {
    const y = 10 + R() * 26, ltr = i % 2 === 0, dur = (7 + R() * 6).toFixed(1);
    const [x0, x1] = ltr ? [-20, W + 10] : [W + 10, -20];
    top.push(`<g><animateMotion path="M${x0} ${y.toFixed(0)}C${W * 0.3} ${(y - 8).toFixed(0)} ${W * 0.7} ${(y + 10).toFixed(0)} ${x1} ${(y + 2).toFixed(0)}" dur="${dur}s" begin="-${(R() * 10).toFixed(1)}s" repeatCount="indefinite"/>${frames(batFrames, 0.28)}</g>`);
  }

  // water drips
  for (const want of [60, 240]) {
    const [tx, ty] = tips.reduce((best, t) => (Math.abs(t[0] - want) < Math.abs(best[0] - want) ? t : best));
    top.push(`<rect x="${tx}" y="${ty}" width="1" height="2" fill="#7fb6ff" opacity="0"><animate attributeName="y" values="${ty};${ty};163" keyTimes="0;.6;1" dur="3.6s" begin="${(R() * 3).toFixed(1)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.55;.97;1" dur="3.6s" begin="${(R() * 3).toFixed(1)}s" repeatCount="indefinite"/></rect>`);
  }

  // captions on the floor
  const loc = String(cfg.location || '').toUpperCase();
  if (loc) bg.text(6, 172, `SECTOR ${loc}`, F3, C.r4);
  const handle = `@${USER}`.toUpperCase();
  bg.text(W - 6 - textWidth(handle, F3), 172, handle, F3, C.r4);

  defs.push(`<filter id="glow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="2.4"/></filter>`);
  defs.push(`<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>`);
  const glows = `<ellipse cx="160" cy="104" rx="90" ry="34" fill="#3aa0ff" opacity=".09" filter="url(#soft)"/><circle cx="272" cy="48" r="32" fill="#9fb8ff" opacity=".07" filter="url(#soft)"/><ellipse cx="96" cy="46" rx="40" ry="16" fill="#ffd43b" opacity=".06" filter="url(#soft)"/>`;

  const css = `.flick{animation:fl 7s infinite}@keyframes fl{0%,61%,64%,67%,100%{opacity:1}62%{opacity:.15}65%{opacity:.3}}` +
    `.blink{animation:bl 1.4s steps(1) infinite}@keyframes bl{0%,100%{opacity:1}50%{opacity:.1}}` +
    `.l1{animation:bl .9s steps(1) infinite}.l2{animation:bl 1.7s steps(1) infinite}.l3{animation:bl 2.6s steps(1) infinite}` +
    `.eye{animation:ey 4s steps(1) infinite}@keyframes ey{0%,90%,96%,100%{opacity:1}92%{opacity:0}}` +
    `.tw{animation:tw 3s ease-in-out infinite}@keyframes tw{0%,100%{opacity:.15}50%{opacity:1}}` +
    `.kf{animation:kf .6s steps(1) infinite}@keyframes kf{0%,100%{opacity:0}50%{opacity:1}}` +
    `.sp{animation:sp 3.3s steps(1) infinite}@keyframes sp{0%,100%{opacity:0}8%{opacity:1}16%{opacity:0}}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W * 3}" height="${H * 3}" shape-rendering="crispEdges" role="img" aria-label="${esc(cfg.name || USER)} coding in a pixel-art bat cave">` +
    `<title>${esc(cfg.name || USER)}</title><style>${css}</style><defs>${defs.join('')}</defs>` +
    bg.emit() + glows + mid.join('') + fg.emit() + frames(elbows, 0.36) + frames(steam, 0.9) + top.join('') + `</svg>`;
}
