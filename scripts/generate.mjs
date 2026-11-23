#!/usr/bin/env node
// Draws the two animated profile images:
//   dist/batcave.svg  - header: a cave workstation with your name on the screens
//   dist/skyline.svg  - your contribution calendar as a 3D night skyline,
//                       with a web-slinger swinging across the rooftops
// No dependencies. Needs Node 18+.
//   GITHUB_TOKEN set  -> real contribution data for GITHUB_USER (or config.username)
//   no token / --demo -> random demo data, handy for previewing locally
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(ROOT, 'theme.config.json'), 'utf8'));
const USER = process.env.GITHUB_USER || cfg.username;
const OUT = process.env.OUT_DIR || join(ROOT, 'dist');
const DEMO = process.argv.includes('--demo') || !process.env.GITHUB_TOKEN;
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace";

// ---------- helpers ----------
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const r1 = (n) => Math.round(n * 10) / 10;
const pts = (a) => a.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ');
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lerp = (a, b, t) => {
  const A = hex(a), B = hex(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
};

// An original bat silhouette, centred on 0,0, about 100 x 30 units.
function batPath(k = 1) {
  const S = [0, -5];
  const segs = [
    ['L', [3.5, -13]], ['L', [6, -5.5]],
    ['C', [14, -7], [23, -15], [31, -17]],
    ['C', [39, -13], [47, -6], [50, 4]],
    ['C', [44, 0], [38, 1], [34, 8]],
    ['C', [30, 3], [25, 3], [20, 10]],
    ['C', [15, 5], [9, 7], [5, 15]],
    ['L', [0, 10]],
  ];
  const P = (p) => `${r1(p[0] * k)} ${r1(p[1] * k)}`;
  const m = (p) => [-p[0], p[1]];
  const end = (s) => s[s.length - 1];
  let d = `M${P(S)}`;
  for (const s of segs) d += s[0] === 'L' ? `L${P(s[1])}` : `C${P(s[1])} ${P(s[2])} ${P(s[3])}`;
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = segs[i];
    const prev = i === 0 ? S : end(segs[i - 1]);
    d += s[0] === 'L' ? `L${P(m(prev))}` : `C${P(m(s[2]))} ${P(m(s[1]))} ${P(m(prev))}`;
  }
  return d + 'Z';
}

// ---------- data ----------
async function getCalendar() {
  if (DEMO) {
    const rand = rng(2710);
    const weeks = [];
    const start = new Date();
    start.setDate(start.getDate() - 364 - start.getDay());
    let mood = 0.5;
    for (let w = 0; w < 53; w++) {
      mood = Math.min(1, Math.max(0.05, mood + (rand() - 0.5) * 0.5));
      const days = [];
      for (let d = 0; d < 7; d++) {
        const dt = new Date(start); dt.setDate(start.getDate() + w * 7 + d);
        const c = rand() < mood ? Math.floor(rand() * 14 * mood + 1) : 0;
        days.push({ c, wd: d, date: dt.toISOString().slice(0, 10) });
      }
      weeks.push(days);
    }
    return { total: weeks.flat().reduce((a, d) => a + d.c, 0), weeks, demo: true };
  }
  const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{contributionCount date weekday}}}}}}`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'batcave-skyline-theme' },
    body: JSON.stringify({ query, variables: { login: USER } }),
  });
  const j = await res.json();
  if (j.errors || !j.data?.user) throw new Error('GitHub API: ' + JSON.stringify(j.errors || j));
  const cal = j.data.user.contributionsCollection.contributionCalendar;
  return {
    total: cal.totalContributions,
    weeks: cal.weeks.map((w) => w.contributionDays.map((d) => ({ c: d.contributionCount, wd: d.weekday, date: d.date }))),
  };
}

// ---------- skyline ----------
function skyline(cal) {
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
  const seedOf = (s) => [...String(s)].reduce((a, ch) => Math.imul(a ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261);
  const height = (d) => (d.c === 0 ? 6 + rng(seedOf(d.date))() * 16 : 28 + 175 * Math.pow(Math.min(1, d.c / cap), 0.65));

  const defs = [];
  const body = [];

  // window patterns: one per (row, level), lights-on fraction grows with activity
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

  // sky, moon, stars
  defs.push(`<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03050c"/><stop offset=".45" stop-color="#0a1330"/><stop offset=".8" stop-color="#231a40"/><stop offset="1" stop-color="#3a2246"/></linearGradient>`);
  defs.push(`<radialGradient id="moonGlow"><stop offset="0" stop-color="#fff3cf" stop-opacity=".35"/><stop offset="1" stop-color="#fff3cf" stop-opacity="0"/></radialGradient>`);
  defs.push(`<linearGradient id="beam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffe9a8" stop-opacity="0"/><stop offset="1" stop-color="#ffe9a8" stop-opacity=".28"/></linearGradient>`);
  defs.push(`<radialGradient id="spot"><stop offset="0" stop-color="#fff4c2" stop-opacity=".75"/><stop offset=".7" stop-color="#ffe08a" stop-opacity=".45"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient>`);
  defs.push(`<linearGradient id="street" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1222"/><stop offset="1" stop-color="#05070d"/></linearGradient>`);

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

  // the signal in the clouds
  const horizon = yg(0) - 2;
  const src = [150, horizon - 70], spotC = [255, 92];
  body.push(`<g class="sig"><polygon points="${pts([[src[0] - 2, src[1]], [src[0] + 2, src[1]], [spotC[0] + 50, spotC[1] + 4], [spotC[0] - 46, spotC[1] - 6]])}" fill="url(#beam)"/>` +
    `<ellipse cx="${spotC[0] - 10}" cy="${spotC[1] - 4}" rx="80" ry="16" fill="#9aa6c8" opacity=".06"/>` +
    `<ellipse cx="${spotC[0]}" cy="${spotC[1]}" rx="50" ry="23" fill="url(#spot)"/>` +
    `<path d="${batPath(0.72)}" transform="translate(${spotC[0]} ${spotC[1] + 1})" fill="#0b0f1d" opacity=".85"/></g>`);

  // far skyline silhouette, with two landmark-style towers
  let far = `M0 ${horizon}`;
  for (let x = 0; x < W;) {
    const w = 14 + rand() * 30, h = 30 + rand() * 95;
    far += `V${r1(horizon - h)}H${r1(Math.min(W, x + w))}`;
    x += w;
  }
  far += `V${horizon}Z`;
  body.push(`<path d="${far}" fill="#131a33"/>`);
  const tower = (cx, base, steps, spire) => {
    let s = '', y = base;
    for (const [w, h] of steps) { s += `<rect x="${r1(cx - w / 2)}" y="${r1(y - h)}" width="${w}" height="${h}"/>`; y -= h; }
    return s + `<rect x="${cx - 1}" y="${r1(y - spire)}" width="2" height="${spire}"/>`;
  };
  // the rooftop the signal shines from
  body.push(`<rect x="${src[0] - 16}" y="${src[1] + 4}" width="34" height="${horizon - src[1] - 4}" fill="#161d38"/><path d="M${src[0] - 6} ${src[1] + 5}l3-8h6l3 8z" fill="#2a3352"/>`);
  body.push(`<g fill="#18203d">${tower(W * 0.63, horizon, [[44, 120], [34, 40], [24, 26], [14, 18], [8, 12]], 34)}${tower(W * 0.36, horizon, [[30, 150], [22, 30], [12, 20]], 46)}</g>`);
  body.push(`<circle class="blink" cx="${r1(W * 0.63)}" cy="${r1(horizon - 216 - 34)}" r="2" fill="#ff3b3b"/><circle class="blink b2" cx="${r1(W * 0.36)}" cy="${r1(horizon - 200 - 46)}" r="2" fill="#ff3b3b"/>`);
  let farLights = '';
  for (let i = 0; i < 90; i++) farLights += `<rect x="${r1(rand() * W)}" y="${r1(horizon - 10 - rand() * 80)}" width="1.6" height="1.6"/>`;
  body.push(`<g fill="#e8c77a" opacity=".35">${farLights}</g>`);

  // the contribution city: back row (Sunday) to front row (Saturday)
  // ground under the whole city, so gaps between blocks read as streets
  body.push(`<rect x="0" y="${horizon}" width="${W}" height="${G - horizon}" fill="#0b1020"/>`);
  const all = [];
  weeks.forEach((wk, c) => wk.forEach((d) => all.push({ ...d, col: c, h: height(d) })));
  const tallest = new Set([...all].filter((d) => d.c > 0).sort((a, b) => b.c - a.c).slice(0, 3).map((d) => `${d.col}-${d.wd}`));
  const city = [];
  const tw = [];
  for (let r = 0; r < ROWS; r++) {
    const t = r / (ROWS - 1);
    const front = lerp('#2a3456', '#161d33', t), side = lerp('#1a2140', '#0c1122', t), top = lerp('#56679a', '#3a4878', t);
    const qFront = lerp('#1b2240', '#10162b', t), qSide = lerp('#121833', '#090d1b', t), qTop = lerp('#2c375c', '#222b4a', t);
    for (const d of all.filter((d) => d.wd === r)) {
      const x = xo(r) + d.col * P, yb = yg(r), yt = yb - d.h;
      const lv = level(d.c);
      city.push(`<polygon points="${pts([[x + BW, yt], [x + BW + BDX, yt - BDY], [x + BW + BDX, yb - BDY], [x + BW, yb]])}" fill="${d.c ? side : qSide}"/>`);
      city.push(`<polygon points="${pts([[x, yt], [x + BDX, yt - BDY], [x + BW + BDX, yt - BDY], [x + BW, yt]])}" fill="${d.c ? top : qTop}"/>`);
      city.push(`<rect x="${x}" y="${r1(yt)}" width="${BW}" height="${r1(d.h)}" fill="${d.c ? front : qFront}"><title>${d.date}: ${d.c} contribution${d.c === 1 ? '' : 's'}</title></rect>`);
      if (d.h > 9) city.push(`<rect x="${x}" y="${r1(yt + 3)}" width="${BW}" height="${r1(d.h - 3)}" fill="url(#w${r}${lv})"/>`);
      if (tallest.has(`${d.col}-${d.wd}`)) {
        const ax = x + BW / 2 + BDX / 2, ay = yt - BDY / 2;
        city.push(`<line x1="${r1(ax)}" y1="${r1(ay)}" x2="${r1(ax)}" y2="${r1(ay - 18)}" stroke="#8da0c8" stroke-width="1.2"/><circle class="blink" cx="${r1(ax)}" cy="${r1(ay - 19)}" r="1.8" fill="#ff3b3b"/>`);
      }
      if (lv >= 2 && d.h > 40 && rand() < 0.35) {
        const wx = x + [2, 5.5, 9][Math.floor(rand() * 3)];
        const fl = Math.floor((yt + 6 + rand() * (d.h - 12)) / 5) * 5 + 1.5;
        tw.push(`<rect class="tw" style="animation-delay:-${r1(rand() * 6)}s" x="${wx}" y="${fl}" width="2" height="2.4"/>`);
      }
    }
  }
  body.push(`<g>${city.join('')}</g>`, `<g fill="#fff6d6">${tw.join('')}</g>`);
  body.push(`<rect x="0" y="${G}" width="${W}" height="${H - G}" fill="url(#street)"/>`);
  body.push(`<line x1="0" y1="${G + 8}" x2="${W}" y2="${G + 8}" stroke="#e0b64a" stroke-width="1" stroke-dasharray="10 12" opacity=".35"/>`);

  // the web-slinger: chained pendulum swings, end of one = start of the next
  const L = 122, A = 46, AY = 12, T = 1.05;
  const half = L * Math.sin((A * Math.PI) / 180), span = 2 * half;
  const startX = -60, n = Math.ceil((W + 120) / span);
  const D = r1(n * T + 3.2);
  defs.push(`<g id="hero"><line x1="0" y1="0" x2="0" y2="${L}" stroke="#eef3fb" stroke-width="1.1" opacity=".9"/>` +
    `<g transform="translate(0 ${L}) scale(1.3)">` +
    `<path d="M0 0L1.2 7.5" stroke="#d81f2a" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="M-1.4 13.4Q2 12.2 5.4 13.4L4.9 23Q2 24.6-.9 23Z" fill="#1f4fd6"/>` +
    `<path d="M.6 13Q2 12.6 3.4 13L3 23.5Q2 23.9 1 23.5Z" fill="#d81f2a"/>` +
    `<circle cx="2" cy="9.8" r="4.3" fill="#d81f2a"/>` +
    `<ellipse cx=".5" cy="10.1" rx="1.3" ry="1.9" transform="rotate(-25 .5 10.1)" fill="#fff" stroke="#111" stroke-width=".6"/>` +
    `<ellipse cx="3.5" cy="10.1" rx="1.3" ry="1.9" transform="rotate(25 3.5 10.1)" fill="#fff" stroke="#111" stroke-width=".6"/>` +
    `<path d="M4.6 14.6L9.6 18.6L12.4 15.4" fill="none" stroke="#d81f2a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M.4 22.6L-2.2 29.6L.8 34.4" fill="none" stroke="#1f4fd6" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M3.8 22.6L8.2 28.4L6.4 33.6" fill="none" stroke="#1f4fd6" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx=".8" cy="34.4" r="1.4" fill="#d81f2a"/><circle cx="6.4" cy="33.6" r="1.4" fill="#d81f2a"/>` +
    `</g></g>`);
  defs.push(`<g id="splat" stroke="#eef3fb" stroke-width=".8" opacity=".8"><line x1="-5" y1="0" x2="5" y2="0"/><line x1="0" y1="-5" x2="0" y2="5"/><line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5"/><line x1="-3.5" y1="3.5" x2="3.5" y2="-3.5"/><circle r="2.2" fill="none"/></g>`);
  const hero = [];
  for (let i = 0; i < n; i++) {
    const ax = startX + half + i * span;
    const t0 = (i * T) / D, t1 = ((i + 1) * T) / D;
    const kt = (a) => a.map((v) => +v.toFixed(4)).join(';');
    let rv, rk, rs, ov, ok;
    if (i === 0) { rv = `${A};${-A};${-A}`; rk = kt([0, t1, 1]); rs = '.42 0 .58 1;0 0 1 1'; ov = '1;0'; ok = kt([0, t1]); }
    else { rv = `${A};${A};${-A};${-A}`; rk = kt([0, t0, t1, 1]); rs = '0 0 1 1;.42 0 .58 1;0 0 1 1'; ov = '0;1;0'; ok = kt([0, t0, t1]); }
    hero.push(`<g transform="translate(${r1(ax)} ${AY})" opacity="${i === 0 ? 1 : 0}">` +
      `<animate attributeName="opacity" values="${ov}" keyTimes="${ok}" calcMode="discrete" dur="${D}s" repeatCount="indefinite"/>` +
      `<use xlink:href="#splat"/>` +
      `<g transform="rotate(${A})"><animateTransform attributeName="transform" type="rotate" values="${rv}" keyTimes="${rk}" calcMode="spline" keySplines="${rs}" dur="${D}s" repeatCount="indefinite"/><use xlink:href="#hero"/></g></g>`);
  }
  body.push(`<g>${hero.join('')}</g>`);

  // captions
  body.push(`<text x="18" y="${H - 16}" fill="#c9d4f2" font-family="${MONO}" font-size="12">@${esc(USER)} · ${cal.total.toLocaleString('en-US')} contributions in the last year${cal.demo ? ' (demo data)' : ''}</text>`);
  body.push(`<text x="${W - 18}" y="${H - 16}" text-anchor="end" fill="#7f8db8" font-family="${MONO}" font-size="11">1 building = 1 day · taller + brighter = busier</text>`);

  const css = `.t1,.t2,.t3{animation:tw 3s ease-in-out infinite}.t2{animation-duration:4.5s}.t3{animation-duration:2.2s}@keyframes tw{0%,100%{opacity:.25}50%{opacity:1}}` +
    `.tw{animation:wl 6s steps(1) infinite}@keyframes wl{0%,100%{opacity:0}40%{opacity:1}75%{opacity:0}}` +
    `.blink{animation:bl 1.6s steps(1) infinite}.b2{animation-delay:-.8s}@keyframes bl{0%,100%{opacity:1}50%{opacity:.15}}` +
    `.sig{animation:sg 5s ease-in-out infinite}@keyframes sg{0%,100%{opacity:.9}50%{opacity:.65}}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(USER)}'s contribution graph as a night city skyline">` +
    `<title>${esc(USER)} · contribution skyline</title><style>${css}</style><defs>${defs.join('')}</defs>${body.join('')}</svg>`;
}

// ---------- bat cave header ----------
function batcave(cal) {
  const W = 1000, H = 400;
  const rand = rng(99);
  const defs = [], body = [];

  defs.push(`<radialGradient id="bg" cx=".5" cy=".45" r=".65"><stop offset="0" stop-color="#10223a"/><stop offset=".55" stop-color="#070a10"/><stop offset="1" stop-color="#020304"/></radialGradient>`);
  defs.push(`<radialGradient id="glow"><stop offset="0" stop-color="#2b8cff" stop-opacity=".35"/><stop offset="1" stop-color="#2b8cff" stop-opacity="0"/></radialGradient>`);
  defs.push(`<linearGradient id="scr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a2a4a"/><stop offset="1" stop-color="#051526"/></linearGradient>`);
  defs.push(`<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0e15"/><stop offset="1" stop-color="#020304"/></linearGradient>`);
  defs.push(`<linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3fb0ff" stop-opacity="0"/><stop offset="1" stop-color="#3fb0ff" stop-opacity=".55"/></linearGradient>`);
  defs.push(`<filter id="gl" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
  defs.push(`<path id="bat" d="${batPath(1)}"/>`);

  body.push(`<rect width="${W}" height="${H}" fill="url(#bg)"/>`);
  body.push(`<ellipse cx="500" cy="175" rx="420" ry="150" fill="url(#glow)"/>`);

  // ceiling: two layers of stalactites, kept short over the screens
  const ceiling = (seed, base, fill, op) => {
    const rr = rng(seed);
    let d = `M0 0H${W}V${base}`;
    let x = W;
    while (x > 0) {
      const w = 18 + rr() * 40, xm = x - w / 2;
      const centre = Math.abs(xm - 500) < 360;
      const tip = base + (centre ? 8 + rr() * 26 : 20 + rr() * 85);
      d += `L${r1(x - w * 0.15)} ${r1(base + rr() * 8)}L${r1(xm)} ${r1(tip)}L${r1(x - w * 0.85)} ${r1(base + rr() * 8)}`;
      x -= w;
    }
    return `<path d="${d}L0 ${base}Z" fill="${fill}" opacity="${op}"/>`;
  };
  body.push(ceiling(7, 34, '#111722', 1), ceiling(11, 22, '#07090d', 1));

  // walls
  body.push(`<path d="M0 0V${H}H44L30 330L52 262L24 196L46 130L18 70L28 0Z" fill="#06070a"/>`);
  body.push(`<path d="M${W} 0V${H}H${W - 44}L${W - 26} 320L${W - 50} 250L${W - 22} 186L${W - 44} 118L${W - 16} 64L${W - 30} 0Z" fill="#06070a"/>`);

  // water drips
  for (const [x, y, delay] of [[118, 96, 0], [872, 104, 1.7], [228, 70, 3.1]]) {
    body.push(`<circle cx="${x}" cy="${y}" r="1.6" fill="#7cc0ff" opacity="0"><animate attributeName="cy" values="${y};${y};370" keyTimes="0;.55;1" dur="4.2s" begin="${delay}s" repeatCount="indefinite" calcMode="spline" keySplines="0 0 1 1;.5 0 1 1"/><animate attributeName="opacity" values="0;.9;.9;0" keyTimes="0;.5;.97;1" dur="4.2s" begin="${delay}s" repeatCount="indefinite"/></circle>`);
  }

  // screens
  const frame = (p, id) => {
    defs.push(`<clipPath id="${id}"><polygon points="${pts(p)}"/></clipPath>`);
    return `<polygon points="${pts(p)}" fill="url(#scr)" stroke="#2a3446" stroke-width="4" stroke-linejoin="round"/><polygon points="${pts(p)}" fill="none" stroke="#3fa7ff" stroke-opacity=".35" stroke-width="1"/>`;
  };
  const C = [[350, 82], [650, 82], [650, 250], [350, 250]];
  const IL = [[182, 100], [338, 90], [338, 242], [182, 232]];
  const IR = [[662, 90], [818, 100], [818, 232], [662, 242]];
  const OL = [[62, 126], [170, 114], [170, 222], [62, 212]];
  const OR = [[830, 114], [938, 126], [938, 212], [830, 222]];
  // stands
  body.push(`<g fill="#151a24">${[[500, 250, 262], [260, 238, 262], [740, 238, 262], [116, 218, 262], [884, 218, 262]].map(([x, a, b]) => `<rect x="${x - 4}" y="${a}" width="8" height="${b - a}"/>`).join('')}</g>`);
  body.push(frame(OL, 'cOL'), frame(IL, 'cIL'), frame(OR, 'cOR'), frame(IR, 'cIR'), frame(C, 'cC'));

  // centre screen: name, tagline, typing terminal
  const name = String(cfg.name || USER).toUpperCase();
  const nameSize = Math.min(30, Math.floor(262 / (name.length * 0.62)));
  const tag = String(cfg.tagline || '').toUpperCase();
  const tagSize = Math.min(11, Math.max(6, Math.floor((272 / Math.max(1, tag.length) - 0.5) / 0.62)));
  let c = `<rect x="350" y="82" width="300" height="15" fill="#0d2c4b"/>`;
  c += `<text x="358" y="93" fill="#7cc4ff" font-family="${MONO}" font-size="8.5" letter-spacing="1.5">CAVE//OS v2.7 · SECURE LINK</text>`;
  c += `<text x="642" y="93" text-anchor="end" fill="#ff4d4d" font-family="${MONO}" font-size="8.5" class="blink">● LIVE</text>`;
  c += `<text x="500" y="136" text-anchor="middle" fill="#eaf4ff" font-family="${MONO}" font-weight="700" font-size="${nameSize}" letter-spacing="2" filter="url(#gl)">${esc(name)}</text>`;
  c += `<text x="500" y="157" text-anchor="middle" fill="#ffd43b" font-family="${MONO}" font-size="${tagSize}" letter-spacing=".5">${esc(tag)}</text>`;
  c += `<line x1="362" y1="168" x2="638" y2="168" stroke="#3fa7ff" stroke-opacity=".35"/>`;
  const lines = (cfg.terminal || []).slice(0, 4);
  const TD = 9, per = 1.6;
  lines.forEach((ln, i) => {
    const y = 185 + i * 16, wFull = Math.min(276, ln.length * 6.7 + 4);
    const a = (i * per) / TD, b = ((i + 1) * per - 0.2) / TD;
    defs.push(`<clipPath id="ty${i}"><rect x="360" y="${y - 10}" height="14" width="0"><animate attributeName="width" values="0;0;${r1(wFull)};${r1(wFull)};0" keyTimes="0;${a.toFixed(3)};${b.toFixed(3)};.96;1" dur="${TD}s" repeatCount="indefinite"/></rect></clipPath>`);
    const isCmd = ln.startsWith('>');
    c += `<text x="362" y="${y}" clip-path="url(#ty${i})" fill="${isCmd ? '#7cc4ff' : '#cfe6ff'}" font-family="${MONO}" font-size="11">${esc(ln)}</text>`;
  });
  c += `<rect x="362" y="${185 + lines.length * 16 - 9}" width="6" height="11" fill="#7cc4ff" class="cur"/>`;
  body.push(`<g clip-path="url(#cC)">${c}</g>`);

  // inner left: radar
  const [rx, ry] = [260, 168];
  let rad = `<g stroke="#2f8de0" stroke-opacity=".55" fill="none"><circle cx="${rx}" cy="${ry}" r="18"/><circle cx="${rx}" cy="${ry}" r="36"/><circle cx="${rx}" cy="${ry}" r="54"/><line x1="${rx - 60}" y1="${ry}" x2="${rx + 60}" y2="${ry}"/><line x1="${rx}" y1="${ry - 60}" x2="${rx}" y2="${ry + 60}"/></g>`;
  rad += `<path d="M${rx} ${ry}L${rx + 54} ${ry}A54 54 0 0 0 ${r1(rx + 54 * Math.cos(-0.7))} ${r1(ry + 54 * Math.sin(-0.7))}Z" fill="url(#sweep)"><animateTransform attributeName="transform" type="rotate" from="0 ${rx} ${ry}" to="360 ${rx} ${ry}" dur="4s" repeatCount="indefinite"/></path>`;
  for (let i = 0; i < 4; i++) {
    const ang = rand() * Math.PI * 2, dist = 12 + rand() * 38;
    rad += `<circle class="blink" style="animation-delay:-${r1(rand() * 2)}s" cx="${r1(rx + dist * Math.cos(ang))}" cy="${r1(ry + dist * Math.sin(ang))}" r="2" fill="#ff4d4d"/>`;
  }
  rad += `<text x="192" y="113" fill="#7cc4ff" font-family="${MONO}" font-size="8" letter-spacing="1">SCAN // ${esc(String(cfg.location || 'EARTH').toUpperCase())}</text>`;
  body.push(`<g clip-path="url(#cIL)">${rad}</g>`);

  // inner right: real activity, last 12 months in 4-week bins
  const flat = cal.weeks.map((w) => w.reduce((a, d) => a + d.c, 0));
  const wk = [];
  for (let i = flat.length; i > 0 && wk.length < 13; i -= 4) wk.unshift(flat.slice(Math.max(0, i - 4), i).reduce((a, b) => a + b, 0));
  const mx = Math.max(1, ...wk);
  let bars = `<text x="672" y="112" fill="#7cc4ff" font-family="${MONO}" font-size="8" letter-spacing="1">ACTIVITY // 12 MONTHS</text>`;
  wk.forEach((v, i) => {
    const h = r1(3 + (v / mx) * 82), x = 677 + i * 10, base = 210;
    bars += `<rect x="${x}" y="${base - h}" width="7" height="${h}" fill="${i === wk.length - 1 ? '#ffd43b' : '#3fa7ff'}" opacity=".85"><animate attributeName="height" values="0;${h};${h}" keyTimes="0;.12;1" dur="9s" repeatCount="indefinite"/><animate attributeName="y" values="${base};${base - h};${base - h}" keyTimes="0;.12;1" dur="9s" repeatCount="indefinite"/></rect>`;
  });
  bars += `<text x="672" y="226" fill="#ffd43b" font-family="${MONO}" font-size="8.5">Σ ${cal.total.toLocaleString('en-US')} THIS YEAR</text>`;
  body.push(`<g clip-path="url(#cIR)">${bars}</g>`);

  // outer left: scrolling hex
  const hexLines = Array.from({ length: 12 }, () => '0x' + Math.floor(rand() * 0xffff).toString(16).padStart(4, '0') + ' ' + Array.from({ length: 4 }, () => Math.floor(rand() * 256).toString(16).padStart(2, '0')).join(' '));
  const hx = [...hexLines, ...hexLines].map((l, i) => `<text x="70" y="${132 + i * 10}">${l}</text>`).join('');
  body.push(`<g clip-path="url(#cOL)"><g fill="#3fa7ff" opacity=".75" font-family="${MONO}" font-size="7.5">${hx}<animateTransform attributeName="transform" type="translate" values="0 0;0 -120" dur="6s" repeatCount="indefinite"/></g></g>`);

  // outer right: city grid map
  let map = '<g stroke="#2f8de0" stroke-opacity=".35">';
  for (let x = 838; x < 940; x += 12) map += `<line x1="${x}" y1="110" x2="${x}" y2="226"/>`;
  for (let y = 128; y < 226; y += 12) map += `<line x1="826" y1="${y}" x2="942" y2="${y}"/>`;
  map += '</g><path d="M836 222C858 190 850 160 880 140S920 120 936 118" stroke="#1a5fa8" stroke-width="7" fill="none" opacity=".6"/>';
  map += `<circle cx="902" cy="176" r="3" fill="#ff4d4d" class="blink"/><circle cx="902" cy="176" r="3" fill="none" stroke="#ff4d4d"><animate attributeName="r" values="3;14" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1.6s" repeatCount="indefinite"/></circle>`;
  map += `<text x="838" y="138" fill="#7cc4ff" font-family="${MONO}" font-size="7.5" letter-spacing="1">NYC // PATROL</text>`;
  body.push(`<g clip-path="url(#cOR)">${map}</g>`);

  // desk and keyboard
  body.push(`<polygon points="150,262 850,262 905,300 95,300" fill="#0d1118"/><line x1="150" y1="262" x2="850" y2="262" stroke="#3fa7ff" stroke-opacity=".5" stroke-width="1.5" filter="url(#gl)"/><rect x="95" y="300" width="810" height="16" fill="#07090d"/>`);
  let keys = '';
  for (let row = 0; row < 3; row++) for (let k = 0; k < 22; k++) {
    const lit = rand() < 0.12;
    keys += `<rect x="${r1(392 + k * 9.6 - row * 3)}" y="${269 + row * 7}" width="7.6" height="4.6" rx="1" fill="${lit ? '#3fa7ff' : '#16263b'}"${lit ? ` class="blink" style="animation-delay:-${r1(rand() * 2)}s"` : ''}/>`;
  }
  body.push(`<g>${keys}</g>`);

  // floor, reflection, chair
  body.push(`<rect x="0" y="316" width="${W}" height="${H - 316}" fill="url(#floor)"/><ellipse cx="500" cy="330" rx="330" ry="16" fill="#2b8cff" opacity=".1"/>`);
  body.push(`<path d="M452 382L449 306Q447 280 470 278H530Q553 280 551 306L548 382Z" fill="#030405" stroke="#1d3654" stroke-width="1.5"/><rect x="496" y="382" width="8" height="8" fill="#030405"/><path d="M462 394L500 388L538 394" stroke="#1d3654" stroke-width="3" fill="none" stroke-linecap="round"/>`);

  // drifting mist
  body.push(`<g fill="#a9c2e6" opacity=".05"><ellipse cx="200" cy="350" rx="260" ry="24"><animateTransform attributeName="transform" type="translate" values="-40 0;60 0;-40 0" dur="18s" repeatCount="indefinite"/></ellipse><ellipse cx="760" cy="362" rx="300" ry="22"><animateTransform attributeName="transform" type="translate" values="40 0;-60 0;40 0" dur="22s" repeatCount="indefinite"/></ellipse></g>`);

  // flying bats
  for (let i = 0; i < 8; i++) {
    const y = 48 + rand() * 30, s = r1(0.18 + rand() * 0.22), dur = r1(9 + rand() * 9), ltr = i % 2 === 0;
    const [x0, x1] = ltr ? [-60, W + 60] : [W + 60, -60];
    const path = `M${x0} ${r1(y)}C${r1(W * 0.3)} ${r1(y - 25 + rand() * 30)} ${r1(W * 0.7)} ${r1(y - 25 + rand() * 30)} ${x1} ${r1(y + (rand() - 0.5) * 20)}`;
    body.push(`<g><animateMotion path="${path}" dur="${dur}s" begin="-${r1(rand() * dur)}s" repeatCount="indefinite"/><g transform="scale(${s})"><use xlink:href="#bat" fill="#020203" stroke="#1d2c40" stroke-width="2"><animateTransform attributeName="transform" type="scale" values="1 1;1 .25;1 1" dur="${r1(0.28 + rand() * 0.2)}s" repeatCount="indefinite"/></use></g></g>`);
  }

  // corner captions
  body.push(`<text x="60" y="384" fill="#34445e" font-family="${MONO}" font-size="10" letter-spacing="2">SECTOR: ${esc(String(cfg.location || '').toUpperCase())}</text>`);
  body.push(`<text x="940" y="384" text-anchor="end" fill="#34445e" font-family="${MONO}" font-size="10" letter-spacing="2">@${esc(USER.toUpperCase())}</text>`);

  const css = `.blink{animation:bl 1.4s steps(1) infinite}@keyframes bl{0%,100%{opacity:1}50%{opacity:.15}}.cur{animation:bl 1s steps(1) infinite}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(cfg.name || USER)}'s cave workstation">` +
    `<title>${esc(cfg.name || USER)}</title><style>${css}</style><defs>${defs.join('')}</defs>${body.join('')}</svg>`;
}

// ---------- main ----------
const cal = await getCalendar();
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'skyline.svg'), skyline(cal));
writeFileSync(join(OUT, 'batcave.svg'), batcave(cal));
console.log(`${DEMO ? 'demo' : USER}: ${cal.total} contributions, ${cal.weeks.length} weeks -> ${OUT}`);
