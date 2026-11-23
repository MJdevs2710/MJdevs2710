// Contribution calendar as a 3D night skyline: one building per day, back row = Sunday.
// A web-slinger swings across, moving toward the viewer (bigger, in front of the city)
// and away (smaller, behind the front rows), left to right and back again.
import { rng, esc, r1, pts, lerp, seedOf, MONO } from './lib.mjs';

export function skyline(cal, USER) {
  const W = 1040, H = 470;
  const P = 17, BW = 13, DX = 4, DY = 7, BDX = 4, BDY = 5, ROWS = 7, G = 410;
  const weeks = cal.weeks, nW = weeks.length;
  const X0 = Math.round((W - ((ROWS - 1) * DX + (nW - 1) * P + BW + BDX)) / 2);
  const xo = (r) => X0 + (ROWS - 1 - r) * DX;
  const yg = (r) => G - (ROWS - 1 - r) * DY;
  const rand = rng(1337);

  const nonzero = weeks.flat().map((d) => d.c).filter((c) => c > 0).sort((a, b) => a - b);
  const cap = Math.max(4, nonzero.length ? nonzero[Math.floor((nonzero.length - 1) * 0.95)] : 4);
  const level = (c) => (c === 0 ? 0 : c <= cap * 0.25 ? 1 : c <= cap * 0.5 ? 2 : c <= cap * 0.75 ? 3 : 4);
  // quiet days are short dark buildings (height fixed per date), active days rise and light up
  const height = (d) => (d.c === 0 ? 6 + rng(seedOf(d.date))() * 16 : 28 + 175 * Math.pow(Math.min(1, d.c / cap), 0.65));

  const defs = [];
  const body = [];

  // window patterns: one per (row, level); more lights on at higher levels
  const FRAC = [0.03, 0.2, 0.36, 0.58, 0.82];
  for (let r = 0; r < ROWS; r++) {
    for (let lv = 0; lv <= 4; lv++) {
      const pr = rng(r * 31 + lv * 7 + 5);
      let lit = '', off = '';
      for (let k = 0; k < 5; k++) for (const jx of [2, 5.5, 9]) for (let i = 0; i < 6; i++) {
        const seg = `M${k * P + jx} ${i * 5 + 1.5}h2v2.4h-2z`;
        if (pr() < FRAC[lv]) lit += seg; else off += seg;
      }
      defs.push(`<pattern id="w${r}${lv}" patternUnits="userSpaceOnUse" x="${xo(r)}" y="0" width="${P * 5}" height="30"><path d="${off}" fill="#070b18" opacity=".7"/><path d="${lit}" fill="#ffd27a"/></pattern>`);
    }
  }

  defs.push(`<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02030a"/><stop offset=".4" stop-color="#0a1432"/><stop offset=".72" stop-color="#2a1d4c"/><stop offset=".9" stop-color="#55304e"/><stop offset="1" stop-color="#6e3a48"/></linearGradient>`);
  defs.push(`<radialGradient id="moonGlow"><stop offset="0" stop-color="#fff3cf" stop-opacity=".35"/><stop offset="1" stop-color="#fff3cf" stop-opacity="0"/></radialGradient>`);
  defs.push(`<linearGradient id="street" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1222"/><stop offset="1" stop-color="#05070d"/></linearGradient>`);
  defs.push(`<linearGradient id="slG" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#d6e4ff" stop-opacity=".26"/><stop offset="1" stop-color="#d6e4ff" stop-opacity="0"/></linearGradient>`);
  defs.push(`<linearGradient id="heliG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2f6ff" stop-opacity=".35"/><stop offset="1" stop-color="#f2f6ff" stop-opacity="0"/></linearGradient>`);
  defs.push(`<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2654" stop-opacity="0"/><stop offset="1" stop-color="#1c2654" stop-opacity=".6"/></linearGradient>`);
  defs.push(`<linearGradient id="suitR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4652"/><stop offset="1" stop-color="#a30d1b"/></linearGradient>`);
  defs.push(`<linearGradient id="suitB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a86ff"/><stop offset="1" stop-color="#142f8c"/></linearGradient>`);
  defs.push(`<filter id="sb" x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>`);
  defs.push(`<filter id="hb" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="28"/></filter>`);
  defs.push(`<linearGradient id="cloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4778"/><stop offset=".35" stop-color="#1d2650"/><stop offset="1" stop-color="#141b3d"/></linearGradient>`);

  // sky, moon, stars, drifting clouds
  body.push(`<rect width="${W}" height="${H}" fill="url(#sky)"/>`);
  const moon = [W - 120, 70];
  body.push(`<circle cx="${moon[0]}" cy="${moon[1]}" r="95" fill="url(#moonGlow)"/>`);
  body.push(`<circle cx="${moon[0]}" cy="${moon[1]}" r="28" fill="#f4ecd2"/><circle cx="${moon[0] - 9}" cy="${moon[1] - 6}" r="5" fill="#e2d8b8"/><circle cx="${moon[0] + 8}" cy="${moon[1] + 9}" r="3.5" fill="#e2d8b8"/><circle cx="${moon[0] + 10}" cy="${moon[1] - 10}" r="2.5" fill="#e2d8b8"/>`);
  let stars = '';
  for (let i = 0; i < 80; i++) {
    const x = rand() * W, y = rand() * 230;
    if (Math.hypot(x - moon[0], y - moon[1]) < 50) continue;
    stars += `<circle class="t${1 + (i % 3)}" style="animation-delay:-${r1(rand() * 4)}s" cx="${r1(x)}" cy="${r1(y)}" r="${r1(0.5 + rand() * 0.9)}"/>`;
  }
  body.push(`<g fill="#dfe7ff">${stars}</g>`);
  const cloud = (y, s, dur, delay) => `<g opacity=".7"><animateTransform attributeName="transform" type="translate" values="-260 0;${W + 260} 0" dur="${dur}s" begin="-${delay}s" repeatCount="indefinite"/>` +
    `<g transform="translate(0 ${y}) scale(${s})" fill="url(#cloud)"><ellipse cx="0" cy="0" rx="62" ry="10"/><ellipse cx="-22" cy="-7" rx="24" ry="10"/><ellipse cx="12" cy="-11" rx="26" ry="13"/><ellipse cx="36" cy="-3" rx="18" ry="8"/></g></g>`;
  body.push(cloud(60, 1.2, 140, 30), cloud(118, 0.9, 110, 80), cloud(36, 0.7, 170, 120));
  body.push(`<g><animateMotion path="M${W + 80} 150C${W * 0.62} 118 ${W * 0.3} 176 -80 138" dur="48s" begin="-14s" repeatCount="indefinite"/>` +
    `<polygon points="-2,4 2,4 46,170 -46,170" fill="url(#heliG)" filter="url(#sb)"/>` +
    `<ellipse cx="0" cy="1" rx="7.5" ry="3.4" fill="#05070f"/><rect x="5" y="-.2" width="13" height="1.6" fill="#05070f"/><rect x="16.5" y="-2.5" width="1.5" height="4" fill="#05070f"/><path d="M-5 4.6h9" stroke="#05070f" stroke-width=".8"/>` +
    `<line x1="-13" y1="-3.2" x2="11" y2="-3.2" stroke="#4a5682" stroke-width=".7"><animate attributeName="x1" values="-13;-1;-13" dur=".14s" repeatCount="indefinite"/><animate attributeName="x2" values="11;1;11" dur=".14s" repeatCount="indefinite"/></line>` +
    `<circle class="blink" cx="18" cy="-2.6" r="1.3" fill="#ff3b3b"/><circle class="blink b2" cx="-6" cy="3" r="1" fill="#ffffff"/></g>`);

  // far skyline with two landmark-style towers
  const horizon = yg(0) - 2;
  body.push(`<ellipse cx="${W / 2}" cy="${horizon}" rx="${W * 0.62}" ry="80" fill="#ff8a5a" opacity=".16" filter="url(#hb)"/>`);
  const searchlight = (x, a0, a1, dur) => `<g transform="translate(${x} ${horizon - 30})"><g><animateTransform attributeName="transform" type="rotate" values="${a0};${a1};${a0}" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="${dur}s" repeatCount="indefinite"/><polygon points="-4,0 4,0 38,-440 -38,-440" fill="url(#slG)" filter="url(#sb)"/></g></g>`;
  body.push(searchlight(W * 0.2, -28, 14, 13), searchlight(W * 0.82, 22, -16, 17));
  let far = `M0 ${horizon}`;
  for (let x = 0; x < W;) {
    const w = 14 + rand() * 30, h = 30 + rand() * 95;
    far += `V${r1(horizon - h)}H${r1(Math.min(W, x + w))}`;
    x += w;
  }
  body.push(`<path d="${far}V${horizon}Z" fill="#131a33"/>`);
  const tower = (cx, base, steps, spire) => {
    let s = '', y = base;
    for (const [w, h] of steps) { s += `<rect x="${r1(cx - w / 2)}" y="${r1(y - h)}" width="${w}" height="${h}"/>`; y -= h; }
    return s + `<rect x="${r1(cx - 1)}" y="${r1(y - spire)}" width="2" height="${spire}"/>`;
  };
  body.push(`<g fill="#18203d">${tower(W * 0.63, horizon, [[44, 120], [34, 40], [24, 26], [14, 18], [8, 12]], 34)}${tower(W * 0.36, horizon, [[30, 150], [22, 30], [12, 20]], 46)}</g>`);
  body.push(`<circle class="blink" cx="${r1(W * 0.63)}" cy="${r1(horizon - 216 - 34)}" r="2" fill="#ff3b3b"/><circle class="blink b2" cx="${r1(W * 0.36)}" cy="${r1(horizon - 200 - 46)}" r="2" fill="#ff3b3b"/>`);
  let farLights = '';
  for (let i = 0; i < 90; i++) farLights += `<rect x="${r1(rand() * W)}" y="${r1(horizon - 10 - rand() * 80)}" width="1.6" height="1.6"/>`;
  body.push(`<g fill="#e8c77a" opacity=".35">${farLights}</g>`);
  body.push(`<rect x="0" y="${horizon}" width="${W}" height="${G - horizon}" fill="#0b1020"/>`);

  // ---- the city, one row per weekday ----
  const all = [];
  weeks.forEach((wk, c) => wk.forEach((d) => all.push({ ...d, col: c, h: height(d) })));
  const crowns = new Set([...all].filter((d) => d.c > 0).sort((a, b) => b.c - a.c).slice(0, 9).map((d) => `${d.col}-${d.wd}`));
  const glows = [];
  const tallest = new Set([...all].filter((d) => d.c > 0).sort((a, b) => b.c - a.c).slice(0, 3).map((d) => `${d.col}-${d.wd}`));
  const rows = [];
  for (let r = 0; r < ROWS; r++) {
    const out = [];
    const t = r / (ROWS - 1);
    const front = lerp('#2a3456', '#161d33', t), side = lerp('#1a2140', '#0c1122', t), top = lerp('#56679a', '#3a4878', t);
    const qFront = lerp('#1b2240', '#10162b', t), qSide = lerp('#121833', '#090d1b', t), qTop = lerp('#2c375c', '#222b4a', t);
    for (const d of all.filter((d) => d.wd === r)) {
      const x = xo(r) + d.col * P, yb = yg(r), yt = yb - d.h;
      const lv = level(d.c);
      out.push(`<polygon points="${pts([[x + BW, yt], [x + BW + BDX, yt - BDY], [x + BW + BDX, yb - BDY], [x + BW, yb]])}" fill="${d.c ? side : qSide}"/>`);
      out.push(`<polygon points="${pts([[x, yt], [x + BDX, yt - BDY], [x + BW + BDX, yt - BDY], [x + BW, yt]])}" fill="${d.c ? top : qTop}"/>`);
      out.push(`<rect x="${x}" y="${r1(yt)}" width="${BW}" height="${r1(d.h)}" fill="${d.c ? front : qFront}"><title>${d.date}: ${d.c} contribution${d.c === 1 ? '' : 's'}</title></rect>`);
      if (d.h > 9) out.push(`<rect x="${x}" y="${r1(yt + 3)}" width="${BW}" height="${r1(d.h - 3)}" fill="url(#w${r}${lv})"/>`);
      const key = `${d.col}-${d.wd}`;
      let roof = yt;
      if (crowns.has(key)) {
        let inset = 2;
        for (let k = 0; k < 2; k++) {
          const w = BW - inset * 2, h = 7 - k * 2, xx = x + inset, y0 = roof;
          out.push(`<polygon points="${pts([[xx + w, y0 - h], [xx + w + BDX, y0 - h - BDY], [xx + w + BDX, y0 - BDY], [xx + w, y0]])}" fill="${side}"/>`);
          out.push(`<polygon points="${pts([[xx, y0 - h], [xx + BDX, y0 - h - BDY], [xx + w + BDX, y0 - h - BDY], [xx + w, y0 - h]])}" fill="${top}"/>`);
          out.push(`<rect x="${xx}" y="${r1(y0 - h)}" width="${w}" height="${h}" fill="${front}"/><rect x="${xx + 1}" y="${r1(y0 - h + 2)}" width="${w - 2}" height="1.4" fill="#ffd27a" opacity=".7"/>`);
          roof -= h; inset += 2;
        }
      }
      if (lv >= 3) glows.push(`<ellipse cx="${r1(x + BW / 2)}" cy="${r1(yt + d.h * 0.45)}" rx="11" ry="${r1(d.h * 0.45)}"/>`);
      if (d.c && lv >= 2 && !crowns.has(key) && d.h > 50 && rand() < 0.25) {
        const cx = x + BW / 2 + BDX / 2, cy = yt - BDY / 2;
        out.push(`<g fill="#0b0f1f" stroke="#43507c" stroke-width=".5"><line x1="${r1(cx - 3)}" y1="${r1(cy)}" x2="${r1(cx - 3)}" y2="${r1(cy - 5)}"/><line x1="${r1(cx + 3)}" y1="${r1(cy)}" x2="${r1(cx + 3)}" y2="${r1(cy - 5)}"/><rect x="${r1(cx - 4)}" y="${r1(cy - 12)}" width="8" height="7" rx="1"/><polygon points="${pts([[cx - 4.6, cy - 12], [cx, cy - 16.5], [cx + 4.6, cy - 12]])}"/></g>`);
      }
      if (tallest.has(key)) {
        const ax = x + BW / 2 + BDX / 2, ay = roof - BDY / 2;
        out.push(`<line x1="${r1(ax)}" y1="${r1(ay)}" x2="${r1(ax)}" y2="${r1(ay - 18)}" stroke="#8da0c8" stroke-width="1.2"/><circle class="blink" cx="${r1(ax)}" cy="${r1(ay - 19)}" r="1.8" fill="#ff3b3b"/>`);
      }
      if (lv >= 2 && d.h > 40 && rand() < 0.35) {
        const wx = x + [2, 5.5, 9][Math.floor(rand() * 3)];
        const fl = Math.floor((yt + 6 + rand() * (d.h - 12)) / 5) * 5 + 1.5;
        out.push(`<rect class="tw" style="animation-delay:-${r1(rand() * 6)}s" x="${wx}" y="${fl}" width="2" height="2.4" fill="#fff6d6"/>`);
      }
    }
    rows.push(out.join(''));
  }

  // ---- the web-slinger ----
  // Chained pendulum swings. Each swing animates its angle, its scale (depth) and its pivot
  // height together; the hand position at the end of one swing equals the start of the next.
  const L = 122, A = 46, sinA = Math.sin((A * Math.PI) / 180);
  const pivotY = (s) => r1(Math.max(14, 214 - 100 * s));
  const depth = (k, ph) => 1.2 + 0.75 * Math.sin(ph + (k * Math.PI) / 2.2);
  const pass = (dir, ph) => {
    const out = [];
    let k = 0, s = depth(0, ph);
    let hand = dir > 0 ? -90 : W + 90;
    let ax = hand + dir * s * L * sinA;
    while (dir > 0 ? hand < W + 90 : hand > -90) {
      const s1 = depth(++k, ph);
      out.push({ dir, ax: r1(ax), s0: +s.toFixed(3), s1: +s1.toFixed(3), T: 0.5 + 0.5 * Math.sqrt((s + s1) / 2) });
      hand = ax + dir * s1 * L * sinA;
      ax += dir * 2 * s1 * L * sinA;
      s = s1;
    }
    return out;
  };
  const seq = [...pass(1, 0.3), { gap: 1.6 }, ...pass(-1, 2.2), { gap: 1.6 }];
  const D = +seq.reduce((a, s) => a + (s.gap ?? s.T), 0).toFixed(3);
  const layers = { far: [], mid: [], front: [] };
  let clock = 0;
  for (const s of seq) {
    if (s.gap) { clock += s.gap; continue; }
    const t0 = clock / D, t1 = (clock + s.T) / D;
    clock += s.T;
    const first = t0 === 0;
    const KT = (first ? [0, t1, 1] : [0, t0, t1, 1]).map((n) => +n.toFixed(5)).join(';');
    const v = (a, b) => (first ? [a, b, b] : [a, a, b, b]).join(';');
    const ks = (first ? ['.42 0 .58 1', '0 0 1 1'] : ['0 0 1 1', '.42 0 .58 1', '0 0 1 1']).join(';');
    const anim = (type, values) => `<animateTransform attributeName="transform" type="${type}" values="${values}" keyTimes="${KT}" calcMode="spline" keySplines="${ks}" dur="${D}s" repeatCount="indefinite"/>`;
    const a0 = s.dir > 0 ? A : -A, a1 = -a0;
    const py0 = pivotY(s.s0), py1 = pivotY(s.s1);
    const vis = first ? ['1;0', `0;${+t1.toFixed(5)}`] : ['0;1;0', `0;${+t0.toFixed(5)};${+t1.toFixed(5)}`];
    const avg = (s.s0 + s.s1) / 2;
    layers[avg < 0.85 ? 'far' : avg < 1.3 ? 'mid' : 'front'].push(
      `<g opacity="${first ? 1 : 0}"><animate attributeName="opacity" values="${vis[0]}" keyTimes="${vis[1]}" calcMode="discrete" dur="${D}s" repeatCount="indefinite"/>` +
      `<g transform="translate(${s.ax} ${py0})">${anim('translate', v(`${s.ax} ${py0}`, `${s.ax} ${py1}`))}` +
      `<g transform="scale(${s.s0})">${anim('scale', v(s.s0, s.s1))}<use xlink:href="#splat"/>` +
      `<g transform="rotate(${a0})">${anim('rotate', v(a0, a1))}<use xlink:href="#${s.dir > 0 ? 'heroR' : 'heroL'}"/></g></g></g></g>`);
  }

  const body1 = `<g id="spBody" stroke-linecap="round" stroke-linejoin="round">` +
    `<g fill="none" stroke="#0a0b16"><path d="M0 0L.4 8L2 17.2" stroke-width="4.6"/><path d="M9 18.5L14 22L18.5 19" stroke-width="4.4"/><path d="M3 31L0 38L3 45" stroke-width="5.2"/><path d="M7 31L12.5 36L10.5 43" stroke-width="5.2"/></g>` +
    `<g fill="none"><path d="M0 0L.4 8L2 17.2" stroke="url(#suitR)" stroke-width="3.1"/><path d="M9 18.5L14 22L18.5 19" stroke="url(#suitR)" stroke-width="2.9"/>` +
    `<path d="M3 31L0 38" stroke="url(#suitB)" stroke-width="3.8"/><path d="M0 38L3 45" stroke="url(#suitR)" stroke-width="3.5"/>` +
    `<path d="M7 31L12.5 36" stroke="url(#suitB)" stroke-width="3.8"/><path d="M12.5 36L10.5 43" stroke="url(#suitR)" stroke-width="3.5"/></g>` +
    `<path d="M.8 17.6Q5 15.8 9.8 17.6L9 31.2Q5 32.8 1.4 31.2Z" fill="url(#suitB)" stroke="#0a0b16" stroke-width=".7"/>` +
    `<path d="M2.6 17.2Q5 16.3 7.6 17.2L6.8 31.6Q5 32.1 3.4 31.6Z" fill="url(#suitR)"/>` +
    `<path d="M5 17v14M3 20.5Q5 19.8 7 20.5M3.2 24.5Q5 23.8 6.8 24.5M3.4 28.5Q5 27.8 6.6 28.5" stroke="#5a0710" stroke-width=".3" fill="none"/>` +
    `<path d="M1.4 29.6Q5 31 9.1 29.6" stroke="#c41626" stroke-width="1.6" fill="none"/>` +
    `<path d="M3.5 20.6L6.5 23.6M6.5 20.6L3.5 23.6M3.2 22.1H6.8" stroke="#0a0b16" stroke-width=".5"/><ellipse cx="5" cy="22.1" rx=".75" ry="1.15" fill="#0a0b16"/>` +
    `<ellipse cx="5" cy="12.4" rx="4.9" ry="5.5" fill="url(#suitR)" stroke="#0a0b16" stroke-width=".7"/>` +
    `<path d="M5 6.9v11M1 10.5Q5 9.4 9 10.5M.5 13.6Q5 12.4 9.5 13.6M1.4 16.1Q5 15 8.6 16.1M2 8.5Q5 10 8 8.5" stroke="#5a0710" stroke-width=".33" fill="none"/>` +
    `<path d="M1 12.6Q2.2 9.6 4.5 12.1Q3.5 15 1 12.6Z" fill="#fff" stroke="#0a0b16" stroke-width=".9"/>` +
    `<path d="M5.5 12.1Q7.8 9.6 9 12.6Q6.5 15 5.5 12.1Z" fill="#fff" stroke="#0a0b16" stroke-width=".9"/>` +
    `<ellipse cx="3.6" cy="7.6" rx="1.6" ry=".7" fill="#ffffff" opacity=".35"/>` +
    `<circle cx="0" cy="0" r="1.8" fill="url(#suitR)" stroke="#0a0b16" stroke-width=".6"/><circle cx="18.5" cy="19" r="1.7" fill="url(#suitR)" stroke="#0a0b16" stroke-width=".6"/></g>`;
  // the figure plus two faint trailing copies for a motion-blur feel
  const figure = `<g id="spidey"><use xlink:href="#spBody" transform="translate(-8 0)" opacity=".14"/><use xlink:href="#spBody" transform="translate(-4 0)" opacity=".28"/><use xlink:href="#spBody"/></g>`;
  defs.push(body1);
  const web = `<line x1="0" y1="0" x2="0" y2="${L}" stroke="#dfe9ff" stroke-width="3.2" opacity=".14"/><line x1="0" y1="0" x2="0" y2="${L}" stroke="#f4f8ff" stroke-width="1.1" opacity=".95"/>`;
  defs.push(`<g id="heroR">${web}<g transform="translate(0 ${L}) scale(1.1)">${figure}</g></g>`);
  defs.push(`<g id="heroL">${web}<g transform="translate(0 ${L}) scale(-1.1 1.1)"><use xlink:href="#spidey"/></g></g>`);
  defs.push(`<g id="splat" stroke="#eef3fb" stroke-width=".8" opacity=".8"><line x1="-5" y1="0" x2="5" y2="0"/><line x1="0" y1="-5" x2="0" y2="5"/><line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5"/><line x1="-3.5" y1="3.5" x2="3.5" y2="-3.5"/><circle r="2.2" fill="none"/></g>`);

  // paint back to front, slipping the web-slinger in at his depth
  const haze = (r) => `<rect x="0" y="${yg(r) - 80}" width="${W}" height="80" fill="url(#haze)" opacity=".55"/>`;
  body.push(rows[0], haze(0), rows[1], haze(1), `<g opacity=".85">${layers.far.join('')}</g>`, rows[2], haze(2), rows[3], haze(3), rows[4], `<g>${layers.mid.join('')}</g>`, rows[5], rows[6]);
  body.push(`<g fill="#ffb24a" opacity=".1" filter="url(#sb)">${glows.join('')}</g>`);
  body.push(`<rect x="0" y="${G}" width="${W}" height="${H - G}" fill="url(#street)"/>`);
  body.push(`<rect x="0" y="${G + 11}" width="${W}" height="2" fill="#fff0c8" opacity=".22" filter="url(#sb)"/><rect x="0" y="${G + 24}" width="${W}" height="2" fill="#ff3a3a" opacity=".28" filter="url(#sb)"/>`);
  body.push(`<line x1="0" y1="${G + 18}" x2="${W}" y2="${G + 18}" stroke="#e0b64a" stroke-width="1" stroke-dasharray="10 12" opacity=".3"/>`);
  const lane = (y, col, dir, n, dur) => {
    let cars = '';
    for (let i = 0; i < n; i++) {
      const x = r1(rand() * W);
      for (const off of [0, W]) cars += `<g transform="translate(${r1(x + off)} ${y})"><ellipse cx="${dir > 0 ? 9 : -9}" cy="0" rx="14" ry="1.6" fill="${col}" opacity=".3"/><circle cx="0" cy="0" r="1.4" fill="${col}"/><circle cx="${dir > 0 ? -4 : 4}" cy="0" r="1.4" fill="${col}"/></g>`;
    }
    const v = dir > 0 ? `-${W} 0;0 0` : `0 0;-${W} 0`;
    return `<g><animateTransform attributeName="transform" type="translate" values="${v}" dur="${dur}s" repeatCount="indefinite"/>${cars}</g>`;
  };
  body.push(lane(G + 12, '#fff3d0', 1, 14, 38), lane(G + 25, '#ff4040', -1, 12, 44));
  body.push(`<g>${layers.front.join('')}</g>`);

  body.push(`<text x="18" y="${H - 16}" fill="#c9d4f2" font-family="${MONO}" font-size="12">@${esc(USER)} · ${cal.total.toLocaleString('en-US')} contributions in the last year${cal.demo ? ' (demo data)' : ''}</text>`);
  body.push(`<text x="${W - 18}" y="${H - 16}" text-anchor="end" fill="#7f8db8" font-family="${MONO}" font-size="11">1 building = 1 day · taller + brighter = busier</text>`);

  const css = `.t1,.t2,.t3{animation:tw 3s ease-in-out infinite}.t2{animation-duration:4.5s}.t3{animation-duration:2.2s}@keyframes tw{0%,100%{opacity:.25}50%{opacity:1}}` +
    `.tw{animation:wl 6s steps(1) infinite}@keyframes wl{0%,100%{opacity:0}40%{opacity:1}75%{opacity:0}}` +
    `.blink{animation:bl 1.6s steps(1) infinite}.b2{animation-delay:-.8s}@keyframes bl{0%,100%{opacity:1}50%{opacity:.15}}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(USER)}'s contribution graph as a night city skyline">` +
    `<title>${esc(USER)} · contribution skyline</title><style>${css}</style><defs>${defs.join('')}</defs>${body.join('')}</svg>`;
}
