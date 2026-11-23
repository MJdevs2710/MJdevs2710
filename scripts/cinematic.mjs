// Cinematic bat cave header (1600 x 800 SVG). Uses the tricks CGI relies on, all in plain
// SVG: lit procedural rock, volumetric light with dust, emissive screens with bloom,
// depth-of-field blur on near objects, mist, vignette and film grain.
import { rng, esc, batPoly } from './lib.mjs';

const SANS = "Inter,'Segoe UI','Helvetica Neue',Arial,sans-serif";

export function cinematicCave(cal, cfg, USER) {
  const W = 1600, H = 800;
  const R = rng(808);
  const f = (n) => Math.round(n * 10) / 10;
  const defs = [], s = [];
  const batD = 'M' + batPoly(1).map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + 'Z';

  // ---------- shared defs ----------
  defs.push(`<path id="bat" d="${batD}"/>`);
  defs.push(`<linearGradient id="bgG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03050b"/><stop offset=".55" stop-color="#0a1428"/><stop offset="1" stop-color="#04060c"/></linearGradient>`);
  defs.push(`<filter id="rock" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.015" numOctaves="5" seed="11" result="n"/><feDiffuseLighting in="n" lighting-color="#5b7cc0" surfaceScale="10" diffuseConstant="1.1"><feDistantLight azimuth="250" elevation="36"/></feDiffuseLighting></filter>`);
  defs.push(`<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="3"/><feColorMatrix type="saturate" values="0"/></filter>`);
  for (const b of [1, 2, 3, 6, 12, 20, 32]) defs.push(`<filter id="b${b}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${b}"/></filter>`);
  defs.push(`<filter id="glow" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="3.5" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
  defs.push(`<radialGradient id="vig" cx=".5" cy=".5" r=".72"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".8"/></radialGradient>`);
  defs.push(`<radialGradient id="shade" cx=".5" cy=".52" r=".7"><stop offset="0" stop-color="#02040a" stop-opacity=".05"/><stop offset=".7" stop-color="#02040a" stop-opacity=".6"/><stop offset="1" stop-color="#02040a" stop-opacity=".95"/></radialGradient>`);
  defs.push(`<linearGradient id="beamG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8dcff" stop-opacity=".42"/><stop offset=".7" stop-color="#9fbcff" stop-opacity=".08"/><stop offset="1" stop-color="#9fbcff" stop-opacity="0"/></linearGradient>`);
  defs.push(`<linearGradient id="scrG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e4686"/><stop offset="1" stop-color="#06203f"/></linearGradient>`);
  defs.push(`<linearGradient id="wfG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1d4c96" stop-opacity=".25"/><stop offset=".5" stop-color="#9cc8ff" stop-opacity=".6"/><stop offset="1" stop-color="#1d4c96" stop-opacity=".25"/></linearGradient>`);
  defs.push(`<linearGradient id="glassG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a3c78" stop-opacity=".45"/><stop offset="1" stop-color="#07122a" stop-opacity=".6"/></linearGradient>`);
  defs.push(`<linearGradient id="rimG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fc4ff" stop-opacity=".95"/><stop offset=".5" stop-color="#4d8ce0" stop-opacity=".3"/><stop offset="1" stop-color="#4d8ce0" stop-opacity="0"/></linearGradient>`);
  defs.push(`<linearGradient id="carG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e2846"/><stop offset=".45" stop-color="#0b1020"/><stop offset="1" stop-color="#04060c"/></linearGradient>`);
  defs.push(`<linearGradient id="specG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfe0ff" stop-opacity=".1"/><stop offset=".45" stop-color="#e8f1ff" stop-opacity=".9"/><stop offset="1" stop-color="#cfe0ff" stop-opacity=".15"/></linearGradient>`);
  defs.push(`<linearGradient id="canG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f7fd0"/><stop offset="1" stop-color="#0a1830"/></linearGradient>`);
  defs.push(`<radialGradient id="copperG" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#f2b878"/><stop offset=".45" stop-color="#b0672e"/><stop offset="1" stop-color="#4a260f"/></radialGradient>`);
  defs.push(`<linearGradient id="goldG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1a6"/><stop offset=".45" stop-color="#ffc933"/><stop offset="1" stop-color="#9a6a0c"/></linearGradient>`);
  defs.push(`<radialGradient id="spill" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#2f8cff" stop-opacity=".45"/><stop offset="1" stop-color="#2f8cff" stop-opacity="0"/></radialGradient>`);
  defs.push(`<radialGradient id="warm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>`);
  defs.push(`<radialGradient id="flare" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff8dc" stop-opacity=".95"/><stop offset=".25" stop-color="#ffe9a6" stop-opacity=".45"/><stop offset="1" stop-color="#ffe9a6" stop-opacity="0"/></radialGradient>`);
  defs.push(`<radialGradient id="burn" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff2c8"/><stop offset=".35" stop-color="#ff9a3c" stop-opacity=".8"/><stop offset="1" stop-color="#ff5a1c" stop-opacity="0"/></radialGradient>`);
  defs.push(`<linearGradient id="floorG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1222"/><stop offset="1" stop-color="#020306"/></linearGradient>`);
  defs.push(`<linearGradient id="daisG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a2848"/><stop offset="1" stop-color="#070b16"/></linearGradient>`);
  defs.push(`<pattern id="scan" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".35"/></pattern>`);

  // ---------- back wall: lit procedural rock under a dark falloff ----------
  s.push(`<rect width="${W}" height="${H}" fill="url(#bgG)"/>`);
  s.push(`<rect width="${W}" height="${H}" filter="url(#rock)" opacity=".78"/>`);
  s.push(`<rect width="${W}" height="${H}" fill="#0a1a3a" opacity=".22"/>`);
  s.push(`<rect width="${W}" height="${H}" fill="url(#shade)"/>`);
  s.push(`<ellipse cx="800" cy="400" rx="640" ry="300" fill="#2a7fff" opacity=".16" filter="url(#b32)"/>`);

  // ---------- ceiling and stalactites ----------
  const ceiling = (seed, base, depth, fill, blur) => {
    const r = rng(seed);
    let d = `M0 0H${W}V${base}`;
    for (let x = W; x > 0;) {
      const w = 24 + r() * 70, tip = base + 20 + r() * depth;
      d += `L${f(x - w * 0.2)} ${f(base + r() * 14)}L${f(x - w / 2 + (r() - 0.5) * 8)} ${f(tip)}L${f(x - w * 0.8)} ${f(base + r() * 14)}`;
      x -= w;
    }
    return `<path d="${d}L0 ${base}Z" fill="${fill}"${blur ? ` filter="url(#b${blur})"` : ''}/>`;
  };
  s.push(ceiling(5, 40, 90, '#0b1224'), ceiling(9, 18, 60, '#050811'));

  // ---------- moonlight shaft with dust ----------
  s.push(`<polygon points="1078,0 1196,0 1170,26 1102,32" fill="#d6e6ff" opacity=".85" filter="url(#b2)"/>`);
  s.push(`<polygon points="1088,18 1186,18 1390,800 870,800" fill="url(#beamG)" filter="url(#b12)"><animate attributeName="opacity" values=".75;1;.75" dur="9s" repeatCount="indefinite"/></polygon>`);
  let dust = '';
  for (let i = 0; i < 46; i++) {
    const t = R(), y = 60 + t * 700, half = 49 + t * 211, x = 1137 + (t * 3) + (R() - 0.5) * 2 * half * 0.85;
    const dur = (6 + R() * 8).toFixed(1);
    dust += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.8 + R() * 1.6)}" fill="#e6f0ff"><animate attributeName="opacity" values="0;.8;0" dur="${dur}s" begin="-${(R() * 8).toFixed(1)}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;${f((R() - 0.5) * 30)} ${f(-10 - R() * 30)}" dur="${dur}s" begin="-${(R() * 8).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
  }
  s.push(`<g>${dust}</g>`);

  // ---------- neon bat over the trophy wall ----------
  s.push(`<g class="flick"><use xlink:href="#bat" transform="translate(800 92) scale(1.9)" fill="none" stroke="#ffcf3a" stroke-width="2" filter="url(#b6)" opacity=".9"/><use xlink:href="#bat" transform="translate(800 92) scale(1.9)" fill="#ffcf3a" fill-opacity=".08" stroke="#ffe680" stroke-width="1.3"/></g>`);

  // ---------- hall of wins: a backlit case with one trophy per hackathon win ----------
  const nT = Math.max(0, Math.min(12, Number(cfg.trophies ?? 12)));
  s.push(`<rect x="560" y="146" width="480" height="146" rx="6" fill="#060a15" stroke="#1d2c4d" stroke-width="2"/>`);
  s.push(`<rect x="566" y="152" width="468" height="134" fill="url(#warm)" opacity=".35"/>`);
  s.push(`<text x="800" y="170" text-anchor="middle" fill="#ffcf5a" font-family="${SANS}" font-size="12" font-weight="700" letter-spacing="6" opacity=".9">HALL OF WINS</text>`);
  const cup = 'M-9 0h18c0 9-4 14-7 15v6h5v4h-14v-4h5v-6c-3-1-7-6-7-15zM-9 2h-4c0 5 3 7 5 7M9 2h4c0 5-3 7-5 7';
  let tro = '';
  [218, 276].forEach((sy, shelf) => {
    tro += `<rect x="574" y="${sy}" width="452" height="3" fill="#2c3f68"/><rect x="574" y="${sy}" width="452" height="1" fill="#7fa6e8" opacity=".6"/>`;
    for (let i = 0; i < 6 && shelf * 6 + i < nT; i++) {
      const x = 612 + i * 75;
      tro += `<path transform="translate(${x} ${sy - 26})" d="${cup}" fill="url(#goldG)" stroke="#ffe69a" stroke-width=".6" stroke-opacity=".6"/>`;
      tro += `<ellipse cx="${x}" cy="${sy - 2}" rx="18" ry="3" fill="#ffc933" opacity=".18" filter="url(#b3)"/>`;
      if ((shelf * 6 + i) % 3 === 1) tro += `<g class="glint" style="animation-delay:-${(R() * 4).toFixed(1)}s"><path transform="translate(${x - 4} ${sy - 22})" d="M0-6L1.2-1.2 6 0 1.2 1.2 0 6-1.2 1.2-6 0-1.2-1.2Z" fill="#fff"/></g>`;
    }
  });
  s.push(`<g>${tro}</g>`);

  // ---------- giant penny and robot T-rex, deep right ----------
  s.push(`<path d="M1300 300L1330 262L1380 255L1410 270L1418 292L1405 305L1360 306L1395 318L1392 332L1350 328L1410 340Q1440 360 1460 380Q1500 360 1560 330L1600 312L1600 384Q1560 402 1530 432Q1520 470 1505 500L1520 592L1488 598L1476 520Q1460 515 1440 520L1450 592L1416 598L1408 510Q1394 470 1400 430Q1390 402 1380 372L1365 382L1372 394L1358 394L1350 374Q1330 346 1318 330L1300 318Z" fill="#070a15" stroke="#26385f" stroke-width="1.6" stroke-opacity=".8"/>`);
  s.push(`<path d="M1362 307l4 7 4-7 4 7 4-7 4 7 4-7 4 7" fill="none" stroke="#d8dce8" stroke-width="1.4" opacity=".55"/>`);
  s.push(`<g class="eye"><circle cx="1352" cy="272" r="7" fill="#ff3b3b" opacity=".5" filter="url(#b3)"/><circle cx="1352" cy="272" r="2.4" fill="#ff6b6b"/></g>`);
  s.push(`<rect x="1224" y="520" width="22" height="50" fill="#0c1222"/><rect x="1196" y="566" width="78" height="10" rx="2" fill="#141d36" stroke="#2c4170"/>`);
  s.push(`<circle cx="1235" cy="452" r="72" fill="url(#copperG)"/><circle cx="1235" cy="452" r="72" fill="none" stroke="#f6c48c" stroke-width="2" stroke-opacity=".55"/><circle cx="1235" cy="452" r="58" fill="none" stroke="#5e3214" stroke-width="2" opacity=".55"/>`);
  s.push(`<text x="1235" y="470" text-anchor="middle" fill="#6a3a18" font-family="Georgia,serif" font-size="52" font-weight="700" opacity=".55">1</text>`);
  s.push(`<g class="glint" style="animation-delay:-1.3s"><path transform="translate(1206 410) scale(1.6)" d="M0-6L1.2-1.2 6 0 1.2 1.2 0 6-1.2 1.2-6 0-1.2-1.2Z" fill="#fff4dc"/></g>`);

  // ---------- waterfall, far left ----------
  s.push(`<path d="M150 0L250 0L238 70L162 70Z" fill="#04070f"/>`);
  s.push(`<path d="M164 64C152 250 178 450 150 606L252 606C226 450 248 250 236 64Z" fill="url(#wfG)"/>`);
  let streaks = '';
  for (let i = 0; i < 16; i++) {
    const x = 166 + i * 4.4 + (R() - 0.5) * 3, dash = 30 + R() * 60, gap = 40 + R() * 80, dur = (0.6 + R() * 0.5).toFixed(2);
    streaks += `<line x1="${f(x)}" y1="66" x2="${f(x + (R() - 0.5) * 10)}" y2="604" stroke="#e6f2ff" stroke-width="${f(1 + R() * 2)}" stroke-opacity="${f(0.2 + R() * 0.35)}" stroke-dasharray="${f(dash)} ${f(gap)}"><animate attributeName="stroke-dashoffset" values="0;-${f(dash + gap)}" dur="${dur}s" repeatCount="indefinite"/></line>`;
  }
  s.push(`<g filter="url(#b1)">${streaks}</g>`);
  s.push(`<ellipse cx="200" cy="618" rx="120" ry="18" fill="#123063"/><ellipse cx="200" cy="614" rx="112" ry="12" fill="#2a5aa8" opacity=".45"/>`);
  for (let i = 0; i < 3; i++) s.push(`<ellipse cx="200" cy="614" rx="20" ry="4" fill="none" stroke="#bfe0ff" stroke-width="1.5"><animate attributeName="rx" values="20;115" dur="3s" begin="${i}s" repeatCount="indefinite"/><animate attributeName="ry" values="4;14" dur="3s" begin="${i}s" repeatCount="indefinite"/><animate attributeName="opacity" values=".6;0" dur="3s" begin="${i}s" repeatCount="indefinite"/></ellipse>`);
  for (let i = 0; i < 4; i++) s.push(`<ellipse cx="${200 + (i - 1.5) * 30}" cy="${596 - i * 6}" rx="70" ry="30" fill="#cfe4ff" opacity=".12" filter="url(#b20)"><animate attributeName="opacity" values=".06;.18;.06" dur="${4 + i}s" repeatCount="indefinite"/></ellipse>`);

  // ---------- glass case with a dark armoured suit ----------
  s.push(`<ellipse cx="350" cy="292" rx="60" ry="18" fill="#9fc4ff" opacity=".35" filter="url(#b12)"/>`);
  s.push(`<rect x="300" y="290" width="100" height="330" rx="4" fill="url(#glassG)" stroke="#6f9be0" stroke-opacity=".55" stroke-width="1.5"/>`);
  s.push(`<polygon points="340,292 360,292 396,616 304,616" fill="#dbe8ff" opacity=".07" filter="url(#b6)"/>`);
  const suit = `M338 352L340 334L346 349L354 349L360 334L362 352Q364 369 350 373Q336 369 338 352Z` +
    `M330 380Q350 372 370 380L384 404L378 470L372 470L370 540L362 600L353 600L350 520L347 600L338 600L330 540L328 470L322 470L316 404Z`;
  s.push(`<path d="M326 384Q350 374 374 384L392 600L308 600Z" fill="#03050a" stroke="#4f7fd0" stroke-opacity=".35"/>`);
  s.push(`<path d="${suit}" fill="#05070f" stroke="url(#rimG)" stroke-width="1.4"/>`);
  s.push(`<rect x="331" y="458" width="38" height="6" rx="1.5" fill="url(#goldG)"/>`);
  s.push(`<circle cx="346" cy="355" r="1.3" fill="#bfe0ff"/><circle cx="354" cy="355" r="1.3" fill="#bfe0ff"/>`);
  s.push(`<line x1="306" y1="440" x2="352" y2="300" stroke="#ffffff" stroke-opacity=".12" stroke-width="5"/><line x1="320" y1="560" x2="394" y2="350" stroke="#ffffff" stroke-opacity=".07" stroke-width="3"/>`);
  s.push(`<rect x="290" y="618" width="120" height="16" rx="2" fill="#10172b" stroke="#2d4170"/>`);

  // ---------- dais and floor ----------
  s.push(`<rect x="0" y="640" width="${W}" height="${H - 640}" fill="url(#floorG)"/>`);
  s.push(`<ellipse cx="800" cy="650" rx="430" ry="52" fill="url(#daisG)" stroke="#2d4a80" stroke-opacity=".6" stroke-width="1.5"/>`);
  s.push(`<ellipse cx="800" cy="610" rx="420" ry="70" fill="url(#spill)"/>`);
  s.push(`<ellipse cx="800" cy="720" rx="300" ry="16" fill="#3a8cff" opacity=".18" filter="url(#b12)"/>`);

  // ---------- the workstation: three screens with bloom ----------
  const C = [[640, 330], [960, 330], [960, 505], [640, 505]];
  const IL = [[455, 350], [625, 334], [625, 500], [455, 486]];
  const IR = [[975, 334], [1145, 350], [1145, 486], [975, 500]];
  const P = (a) => a.map(([x, y]) => `${x},${y}`).join(' ');
  s.push(`<g filter="url(#b32)" opacity=".55">${[C, IL, IR].map((q) => `<polygon points="${P(q)}" fill="#2a8cff"/>`).join('')}</g>`);
  for (const [q, id] of [[IL, 'cIL'], [IR, 'cIR'], [C, 'cC']]) {
    defs.push(`<clipPath id="${id}"><polygon points="${P(q)}"/></clipPath>`);
    s.push(`<polygon points="${P(q)}" fill="url(#scrG)" stroke="#121b30" stroke-width="7" stroke-linejoin="round"/>`);
  }
  // left: radar
  let rad = `<g fill="none" stroke="#3a8fe0" stroke-opacity=".5"><circle cx="540" cy="420" r="22"/><circle cx="540" cy="420" r="44"/><circle cx="540" cy="420" r="66"/><path d="M466 420H614M540 346V494"/></g>`;
  defs.push(`<linearGradient id="sweepG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5fb4ff" stop-opacity="0"/><stop offset="1" stop-color="#5fb4ff" stop-opacity=".6"/></linearGradient>`);
  rad += `<path d="M540 420L606 420A66 66 0 0 0 590.6 377.6Z" fill="url(#sweepG)"><animateTransform attributeName="transform" type="rotate" from="0 540 420" to="360 540 420" dur="4s" repeatCount="indefinite"/></path>`;
  [[566, 400], [512, 446], [556, 452]].forEach(([x, y], i) => { rad += `<circle class="blink" style="animation-delay:-${i * 0.5}s" cx="${x}" cy="${y}" r="3" fill="#ff4d4d"/>`; });
  rad += `<text x="470" y="370" fill="#8fc6ff" font-family="${SANS}" font-size="11" letter-spacing="2">SCAN // ${esc(String(cfg.location || 'EARTH').toUpperCase())}</text>`;
  s.push(`<g clip-path="url(#cIL)">${rad}<rect x="450" y="330" width="180" height="175" fill="url(#scan)"/></g>`);
  // right: patrol grid
  let grid = '<g stroke="#3a8fe0" stroke-opacity=".3">';
  for (let x = 985; x < 1145; x += 18) grid += `<line x1="${x}" y1="334" x2="${x}" y2="500"/>`;
  for (let y = 360; y < 500; y += 18) grid += `<line x1="975" y1="${y}" x2="1145" y2="${y}"/>`;
  grid += `</g><path d="M985 490C1020 440 1010 400 1060 380S1120 360 1140 356" stroke="#1d66c0" stroke-width="10" fill="none" opacity=".55"/>`;
  grid += `<circle cx="1082" cy="432" r="4" fill="#ff4d4d"/><circle cx="1082" cy="432" r="4" fill="none" stroke="#ff4d4d" stroke-width="2"><animate attributeName="r" values="4;22" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1.6s" repeatCount="indefinite"/></circle>`;
  grid += `<text x="988" y="372" fill="#8fc6ff" font-family="${SANS}" font-size="11" letter-spacing="2">PATROL GRID</text>`;
  s.push(`<g clip-path="url(#cIR)">${grid}<rect x="970" y="330" width="180" height="175" fill="url(#scan)"/></g>`);
  // centre: name, lines, live activity bars
  const name = String(cfg.name || USER).toUpperCase();
  const fs = Math.min(40, Math.floor(290 / (name.length * 0.68)));
  let cen = `<rect x="640" y="330" width="320" height="26" fill="#0c3466" opacity=".9"/>`;
  cen += `<text x="654" y="348" fill="#9fd0ff" font-family="${SANS}" font-size="11" letter-spacing="3">CAVE OS · SECURE LINK</text>`;
  cen += `<g class="blink"><circle cx="912" cy="344" r="4" fill="#ff4040"/><text x="922" y="348" fill="#ff8080" font-family="${SANS}" font-size="11" letter-spacing="1">REC</text></g>`;
  cen += `<text x="800" y="400" text-anchor="middle" fill="#eef7ff" font-family="${SANS}" font-weight="800" font-size="${fs}" letter-spacing="4" filter="url(#glow)">${esc(name)}</text>`;
  (cfg.screen || []).slice(0, 2).forEach((ln, i) => { cen += `<text x="800" y="${428 + i * 20}" text-anchor="middle" fill="${i ? '#a8d8ff' : '#ffd43b'}" font-family="${SANS}" font-size="14" font-weight="600" letter-spacing="2">${esc(String(ln).toUpperCase())}</text>`; });
  const weekly = cal.weeks.map((w) => w.reduce((a, d) => a + d.c, 0));
  const bins = [];
  for (let i = weekly.length; i > 0 && bins.length < 13; i -= 4) bins.unshift(weekly.slice(Math.max(0, i - 4), i).reduce((a, b) => a + b, 0));
  const mx = Math.max(1, ...bins);
  bins.forEach((v, i) => {
    const h = f(3 + (v / mx) * 30), x = 668 + i * 21, base = 496;
    cen += `<rect x="${x}" y="${base - h}" width="13" height="${h}" rx="1.5" fill="${i === bins.length - 1 ? '#ffd43b' : '#4aa6ff'}" opacity=".9"><animate attributeName="height" values="0;${h};${h}" keyTimes="0;.12;1" dur="9s" repeatCount="indefinite"/><animate attributeName="y" values="${base};${base - h};${base - h}" keyTimes="0;.12;1" dur="9s" repeatCount="indefinite"/></rect>`;
  });
  s.push(`<g clip-path="url(#cC)">${cen}<rect x="640" y="330" width="320" height="175" fill="url(#scan)"/><rect x="640" y="330" width="320" height="175" fill="#fff" opacity="0"><animate attributeName="opacity" values="0;0;.05;0;0" keyTimes="0;.5;.52;.55;1" dur="6s" repeatCount="indefinite"/></rect></g>`);
  // desk console + keyboard glow
  s.push(`<path d="M430 512Q800 548 1170 512L1194 548Q800 596 406 548Z" fill="#0b1222" stroke="#3d6fb8" stroke-opacity=".55" stroke-width="1.5"/>`);
  s.push(`<rect x="736" y="527" width="128" height="11" rx="3" fill="#0b1a33" stroke="#3aa0ff" stroke-opacity=".5"/><rect x="742" y="531" width="116" height="3" fill="#3aa0ff" opacity=".4" class="kb"/>`);

  // ---------- the developer: hood with bat ears, rim-lit by the screens ----------
  const PX = 872;
  const person = `M${PX - 58} 572Q${PX - 50} 530 ${PX} 526Q${PX + 50} 530 ${PX + 60} 572Z` +
    `M${PX - 26} 476L${PX - 22} 446L${PX - 10} 468Q${PX} 464 ${PX + 10} 468L${PX + 22} 446L${PX + 26} 476Q${PX + 32} 512 ${PX} 530Q${PX - 32} 512 ${PX - 26} 476Z`;
  s.push(`<path d="${person}" fill="#04060d"/><path d="${person}" fill="none" stroke="url(#rimG)" stroke-width="2.2" filter="url(#b1)"/>`);
  s.push(`<rect x="${PX - 33}" y="488" width="7" height="16" rx="3" fill="#c62b2b"/><rect x="${PX + 26}" y="488" width="7" height="16" rx="3" fill="#c62b2b"/><ellipse cx="${PX + 29}" cy="496" rx="8" ry="10" fill="#ff4040" opacity=".25" filter="url(#b3)"/>`);
  const chair = `M${PX - 40} 668L${PX - 44} 580Q${PX - 44} 550 ${PX - 12} 548L${PX + 12} 548Q${PX + 44} 550 ${PX + 44} 580L${PX + 40} 668Z`;
  s.push(`<path d="${chair}" fill="#03050a"/><path d="${chair}" fill="none" stroke="url(#rimG)" stroke-width="1.8"/>`);
  s.push(`<use xlink:href="#bat" transform="translate(${PX} 596) scale(.3)" fill="#b38b1d" opacity=".75"/>`);
  s.push(`<rect x="${PX - 4}" y="668" width="8" height="26" fill="#0c1222"/><path d="M${PX - 40} 704L${PX} 694L${PX + 40} 704" stroke="#1a2644" stroke-width="5" fill="none" stroke-linecap="round"/>`);

  // ---------- the car on its turntable ----------
  s.push(`<ellipse cx="1272" cy="704" rx="224" ry="30" fill="#0b1222" stroke="#22365e" stroke-width="2"/>`);
  s.push(`<ellipse cx="1272" cy="704" rx="214" ry="26" fill="none" stroke="#3aa0ff" stroke-width="3" stroke-dasharray="22 14" filter="url(#b2)"><animate attributeName="stroke-dashoffset" values="0;-72" dur="2.4s" repeatCount="indefinite"/></ellipse>`);
  s.push(`<ellipse cx="1272" cy="704" rx="214" ry="26" fill="none" stroke="#9fd0ff" stroke-width="1" stroke-dasharray="22 14" opacity=".8"><animate attributeName="stroke-dashoffset" values="0;-72" dur="2.4s" repeatCount="indefinite"/></ellipse>`);
  s.push(`<ellipse cx="1272" cy="700" rx="200" ry="16" fill="#000" opacity=".6" filter="url(#b6)"/>`);
  s.push(`<path d="M1432 616L1450 612L1454 650Z" fill="#05070d"/>`);
  s.push(`<path d="M1085 682L1100 668Q1150 655 1200 650L1240 628Q1270 616 1310 616L1350 622L1400 640L1440 610L1458 608L1462 650L1466 676Q1440 690 1400 692L1110 694Q1088 692 1085 682Z" fill="url(#carG)" stroke="#05070d" stroke-width="1.5"/>`);
  s.push(`<path d="M1100 668Q1150 655 1200 650L1240 628Q1270 616 1310 616L1350 622L1400 640L1440 610L1458 608" fill="none" stroke="url(#specG)" stroke-width="2.2"/>`);
  s.push(`<path d="M1232 632Q1265 619 1305 619L1345 625L1318 641L1240 643Z" fill="url(#canG)" stroke="#8fb6f0" stroke-opacity=".6"/>`);
  s.push(`<path d="M1120 676L1420 672" stroke="#22325a" stroke-width="2"/><use xlink:href="#bat" transform="translate(1290 662) scale(.24)" fill="#c9a227" opacity=".85"/>`);
  for (const [cx, r] of [[1150, 26], [1396, 29]]) s.push(`<circle cx="${cx}" cy="690" r="${r}" fill="#020306" stroke="#1c2948" stroke-width="4"/><circle cx="${cx}" cy="690" r="${r * 0.42}" fill="#1a2440" stroke="#5f7fc0" stroke-opacity=".6"/><circle cx="${cx}" cy="690" r="3" fill="#8fb6f0"/>`);
  s.push(`<g class="hl"><ellipse cx="1090" cy="677" rx="70" ry="40" fill="url(#flare)"/><ellipse cx="1050" cy="677" rx="95" ry="3" fill="#fff6d0" opacity=".45" filter="url(#b2)"/><ellipse cx="1090" cy="677" rx="5" ry="3" fill="#fffbe8"/></g>`);
  s.push(`<ellipse cx="1474" cy="662" rx="22" ry="12" fill="url(#burn)"><animate attributeName="rx" values="18;26;20;24;18" dur=".5s" repeatCount="indefinite"/><animate attributeName="opacity" values=".8;1;.7;1;.8" dur=".35s" repeatCount="indefinite"/></ellipse>`);

  // ---------- bats: hanging, flying, and close ones crossing the lens ----------
  const hangD = 'M-1 0L1 0Q6 6 5 12L4 18L2 15L-2 15L-4 18L-5 12Q-6 6-1 0Z';
  for (let i = 0; i < 9; i++) {
    const x = 120 + R() * 1360, y = 40 + R() * 50, k = 0.9 + R() * 0.8;
    if (x > 1060 && x < 1210) continue;
    s.push(`<g transform="translate(${f(x)} ${f(y)}) scale(${f(k)})"><path d="${hangD}" fill="#020306"/><g class="eye" style="animation-delay:-${(R() * 4).toFixed(1)}s" fill="#ff3b3b"><circle cx="-1.6" cy="12" r=".7"/><circle cx="1.6" cy="12" r=".7"/></g></g>`);
  }
  const flyer = (scale, y, dur, delay, ltr, blur, op) => {
    const [x0, x1] = ltr ? [-80, W + 80] : [W + 80, -80];
    return `<g opacity="${op}"${blur ? ` filter="url(#b${blur})"` : ''}><animateMotion path="M${x0} ${f(y)}C${W * 0.3} ${f(y - 40)} ${W * 0.65} ${f(y + 50)} ${x1} ${f(y + 10)}" dur="${dur}s" begin="-${delay}s" repeatCount="indefinite"/><g transform="scale(${scale})"><use xlink:href="#bat" fill="#010204"><animateTransform attributeName="transform" type="scale" values="1 1;1 .2;1 1" dur="${(0.22 + R() * 0.12).toFixed(2)}s" repeatCount="indefinite"/></use></g></g>`;
  };
  for (let i = 0; i < 8; i++) s.push(flyer(f(0.16 + R() * 0.16), 90 + R() * 160, f(10 + R() * 8), f(R() * 14), i % 2 === 0, 0, 0.85));

  // ---------- drifting floor mist ----------
  for (let i = 0; i < 3; i++) s.push(`<ellipse cx="${300 + i * 500}" cy="${730 + i * 12}" rx="520" ry="34" fill="#a9c2ea" opacity=".06" filter="url(#b20)"><animateTransform attributeName="transform" type="translate" values="-80 0;80 0;-80 0" dur="${26 + i * 6}s" repeatCount="indefinite"/></ellipse>`);

  // ---------- foreground: out-of-focus rock and bats close to the lens ----------
  s.push(`<path d="M0 800V610Q40 600 70 640Q110 660 150 700Q190 740 260 760Q300 780 320 800Z" fill="#010204" filter="url(#b3)"/>`);
  s.push(`<path d="M1600 800V560Q1570 590 1540 640Q1510 690 1470 730Q1440 770 1400 800Z" fill="#010204" filter="url(#b3)"/>`);
  s.push(ceiling(21, 0, 70, '#010204', 6));
  s.push(flyer(0.9, 300, 7, 2, true, 6, 0.95), flyer(0.7, 520, 9, 6, false, 4, 0.9));

  // ---------- grade: vignette, grain, captions ----------
  s.push(`<rect width="${W}" height="${H}" fill="url(#vig)"/>`);
  s.push(`<rect width="${W}" height="${H}" filter="url(#grain)" opacity=".06"/>`);
  const loc = String(cfg.location || '').toUpperCase();
  s.push(`<text x="40" y="776" fill="#6d80aa" font-family="${SANS}" font-size="13" letter-spacing="5">@${esc(USER.toUpperCase())}</text>`);
  if (loc) s.push(`<text x="${W - 40}" y="776" text-anchor="end" fill="#6d80aa" font-family="${SANS}" font-size="13" letter-spacing="5">SECTOR · ${esc(loc)}</text>`);

  const css = `.flick{animation:fl 7s infinite}@keyframes fl{0%,61%,64%,67%,100%{opacity:1}62%{opacity:.25}65%{opacity:.4}}` +
    `.blink{animation:bl 1.4s steps(1) infinite}@keyframes bl{0%,100%{opacity:1}50%{opacity:.15}}` +
    `.eye{animation:ey 4s steps(1) infinite}@keyframes ey{0%,90%,96%,100%{opacity:1}92%{opacity:0}}` +
    `.glint{animation:gl 4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes gl{0%,70%,100%{opacity:0;transform:scale(.4)}80%{opacity:1;transform:scale(1)}}` +
    `.hl{animation:hl 5s ease-in-out infinite}@keyframes hl{0%,100%{opacity:.9}50%{opacity:1}}` +
    `.kb{animation:kb .5s steps(2) infinite}@keyframes kb{0%{opacity:.25}100%{opacity:.6}}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(cfg.name || USER)} at a glowing workstation in a cinematic bat cave">` +
    `<title>${esc(cfg.name || USER)}</title><style>${css}</style><defs>${defs.join('')}</defs>${s.join('')}</svg>`;
}
