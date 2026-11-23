#!/usr/bin/env node
// Draws the two animated profile images from your GitHub contribution calendar:
//   dist/batcave.svg  - pixel-art bat cave header (scripts/batcave.mjs)
//   dist/skyline.svg  - 3D night skyline with a web-slinger (scripts/skyline.mjs)
// No dependencies. Needs Node 18+.
//   GITHUB_TOKEN set  -> real data for GITHUB_USER (or config.username)
//   no token / --demo -> random demo data, handy for previewing locally
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rng } from './lib.mjs';
import { skyline } from './skyline.mjs';
import { batcave } from './batcave.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(readFileSync(join(ROOT, 'theme.config.json'), 'utf8'));
const USER = process.env.GITHUB_USER || cfg.username;
const OUT = process.env.OUT_DIR || join(ROOT, 'dist');
const DEMO = process.argv.includes('--demo') || !process.env.GITHUB_TOKEN;

async function getCalendar() {
  if (DEMO) {
    const rand = rng(2710);
    const start = new Date();
    start.setDate(start.getDate() - 364 - start.getDay());
    const weeks = [];
    let mood = 0.5;
    for (let w = 0; w < 53; w++) {
      mood = Math.min(1, Math.max(0.05, mood + (rand() - 0.5) * 0.5));
      const days = [];
      for (let d = 0; d < 7; d++) {
        const dt = new Date(start);
        dt.setDate(start.getDate() + w * 7 + d);
        days.push({ c: rand() < mood ? Math.floor(rand() * 14 * mood + 1) : 0, wd: d, date: dt.toISOString().slice(0, 10) });
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

const cal = await getCalendar();
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'skyline.svg'), skyline(cal, USER));
writeFileSync(join(OUT, 'batcave.svg'), batcave(cal, cfg, USER));
console.log(`${DEMO ? 'demo' : USER}: ${cal.total} contributions, ${cal.weeks.length} weeks -> ${OUT}`);
