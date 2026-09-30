// Teljes oldal feltérképezése: milyen JS / követőkód fut az oldalon, és honnan töltődik be.
// Végigmegy a sitemap oldalain és a megtalált GTM konténereken, majd:
//   - riportot ír a konzolra (Markdown táblázat),
//   - elmenti a sites/<domain>.json fájlt, amit a banner a „Részletek” listához használ.
// Használat: node tools/scan.mjs https://domain.hu [--max 40] [--no-write]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const start = args.find((a) => /^https?:\/\//.test(a));
if (!start) { console.error('Használat: node tools/scan.mjs https://domain.hu [--max 40] [--no-write]'); process.exit(1); }
const maxPages = Number(args[args.indexOf('--max') + 1]) || 40;
const write = !args.includes('--no-write');

const root = new URL('..', import.meta.url);
const PROVIDERS = JSON.parse(readFileSync(new URL('data/providers.json', root), 'utf8'));
const base = new URL(start);
const SELF = base.hostname.replace(/^www\./, '');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36 360-consent-scan';

async function get(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    return r.ok ? await r.text() : null;
  } catch { return null; }
}

// --- a böngészős kóddal azonos felismerés ---
function parseUrl(u, rel) {
  try { const x = new URL(u, rel || base); return { host: x.hostname.replace(/^www\./, ''), path: x.pathname + x.search }; }
  catch { return null; }
}
const hostMatch = (h, p) => h === p || h.endsWith('.' + p);
function matchUrl(u, rel) {
  const p = parseUrl(u, rel);
  if (!p || !/^[a-z0-9.-]+$/i.test(p.host)) return null;
  for (const prov of PROVIDERS) for (const pat of prov.hosts || []) {
    const s = pat.indexOf('/'), ph = s < 0 ? pat : pat.slice(0, s), pp = s < 0 ? '' : pat.slice(s);
    const ok = ph === '@self' ? p.host === SELF : hostMatch(p.host, ph);
    if (ok && (!pp || p.path.startsWith(pp))) return prov;
  }
  return null;
}
const textMatch = (t, pat) => (pat.startsWith('re:') ? new RegExp(pat.slice(3)).test(t) : t.includes(pat));

const found = new Map();   // id -> { prov, html:Set(oldal), gtm:Set(konténer) }
const unknown = new Map(); // host -> Set(hol)
function hit(prov, where, place) {
  if (!prov || prov.cat === 'infra') return;
  const f = found.get(prov.id) || { prov, html: new Set(), gtm: new Set() };
  f[where].add(place);
  found.set(prov.id, f);
}
function url(u, where, place, rel) {
  if (!u || u.startsWith('data:') || u.startsWith('#')) return;
  const prov = matchUrl(u, rel);
  if (prov) { hit(prov, where, place); return; }
  const p = parseUrl(u, rel);
  if (p && p.host && p.host !== SELF && /^(https?:)?\/\//.test(u)) {
    const s = unknown.get(p.host) || new Set(); s.add(where === 'gtm' ? place : 'html'); unknown.set(p.host, s);
  }
}
function text(t, where, place) {
  for (const prov of PROVIDERS) if ((prov.gtm || []).some((g) => textMatch(t, g))) hit(prov, where, place);
}

// --- oldalak összegyűjtése a sitemapból ---
async function sitemapUrls() {
  const robots = (await get(new URL('/robots.txt', base))) || '';
  const maps = [...robots.matchAll(/^sitemap:\s*(\S+)/gim)].map((m) => m[1]);
  if (!maps.length) maps.push(new URL('/sitemap_index.xml', base).href, new URL('/sitemap.xml', base).href, new URL('/wp-sitemap.xml', base).href);
  const pages = new Set(), seen = new Set();
  while (maps.length && seen.size < 30) {
    const m = maps.shift();
    if (seen.has(m)) continue;
    seen.add(m);
    const xml = await get(m);
    if (!xml) continue;
    for (const [, loc] of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
      const l = loc.replace(/&amp;/g, '&');
      if (/\.xml(\?|$)/.test(l)) maps.push(l); else pages.add(l);
    }
  }
  return [...pages];
}
function sample(list, n) {
  if (list.length <= n) return list;
  const out = [], step = list.length / n;
  for (let i = 0; i < n; i++) out.push(list[Math.floor(i * step)]);
  return out;
}

const all = await sitemapUrls();
const pages = [...new Set([base.href, ...sample(all, maxPages - 1)])];
console.error(`${SELF}: ${all.length} URL a sitemapban, ebből ${pages.length} oldalt nézek meg…`);

const gtmIds = new Set();
let done = 0;
async function scanPage(p) {
  const html = await get(p);
  done++;
  if (!html) return;
  const path = new URL(p).pathname;
  // A beágyazott <script> tartalmát kivesszük, hogy a JS-sablonokban lévő (pl. WP Rocket lazyload) HTML-töredékek ne adjanak hamis találatot.
  const markup = html.replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi, '$1</script>');
  for (const [, u] of markup.matchAll(/<(?:script|iframe|img|embed|div|video)\b[^>]*?\s(?:src|data-src|data-lazy-src)=["']([^"']+)["']/gi)) url(u.replace(/&amp;/g, '&'), 'html', path, p);
  for (const [, u] of html.matchAll(/<link\b[^>]*rel=["'](?:preconnect|dns-prefetch|preload)["'][^>]*href=["']([^"']+)["']/gi)) url(u, 'html', path, p);
  for (const [, body] of html.matchAll(/<script\b(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (body.trim()) text(body, 'html', path);
  }
  for (const [id] of html.matchAll(/GTM-[A-Z0-9]{4,9}/g)) gtmIds.add(id);
}
const queue = [...pages];
await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) await scanPage(queue.shift()); }));

for (const id of gtmIds) {
  const js = await get(`https://www.googletagmanager.com/gtm.js?id=${id}`);
  if (!js) continue;
  // Csak a konténer saját konfigurációja (tagek, változók, template-ek) számít. A "blob" a GTM minden
  // konténerben azonos beállítása (pl. adservice.google.com), utána pedig a Google általános könyvtára jön.
  let cut = js.indexOf('"blob":{');
  if (cut < 0) cut = js.indexOf('"security_groups"');
  if (cut < 0) { console.error(`${id}: nem ismert gtm.js szerkezet, kihagyom`); continue; }
  const conf = js.slice(0, cut);
  text(conf, 'gtm', id);
  const flat = conf.replace(/\\\//g, '/');
  for (const [u] of flat.matchAll(/https?:\/\/[a-z0-9.-]+\.[a-z]{2,}[^\s"'<>\\)]*/gi)) url(u, 'gtm', id);
}

// --- riport ---
const CAT = { necessary: 'Elengedhetetlen', preferences: 'Személyre szabás', statistics: 'Statisztika', marketing: 'Marketing' };
const order = Object.keys(CAT);
const rows = [...found.values()].sort((a, b) => order.indexOf(a.prov.cat) - order.indexOf(b.prov.cat) || a.prov.name.localeCompare(b.prov.name));
const warnings = [];
console.log(`\n# JS-térkép: ${SELF} (${new Date().toISOString().slice(0, 10)}, ${pages.length} oldal, GTM: ${[...gtmIds].join(', ') || 'nincs'})\n`);
console.log('| Szolgáltatás | Kategória | Honnan töltődik | Sütik |\n|---|---|---|---|');
for (const f of rows) {
  const where = [];
  if (f.gtm.size) where.push('GTM');
  if (f.html.size) where.push(`HTML (${f.html.size} oldal)`);
  console.log(`| ${f.prov.name} | ${CAT[f.prov.cat]} | ${where.join(' + ')} | ${(f.prov.cookies || []).map((c) => c[0]).join(', ') || '–'} |`);
  // A GTM-en kívül, közvetlenül a HTML-be épített nem szükséges kódot a popup nem tudja visszatartani.
  if (f.html.size && f.prov.cat !== 'necessary' && !f.prov.gcm && !(f.prov.hosts || []).some((h) => h.startsWith('@self'))) {
    const hint = f.prov.embed
      ? 'Beágyazás: használj youtube-nocookie.com-ot, vagy kattintásra töltsd be (pl. WP Rocket előnézet).'
      : 'Tedd át GTM-be consent-feltétellel.';
    warnings.push(`${f.prov.name}: közvetlenül az oldal kódjában van (pl. ${[...f.html][0]}), a süti popup ezt NEM tartja vissza. ${hint}`);
  }
}
const cmps = rows.filter((f) => f.prov.cmp || f.prov.id === 'c360');
if (cmps.length > 1) warnings.unshift(`Több süti kezelő fut egyszerre: ${cmps.map((f) => f.prov.name).join(', ')}. Egy oldalon csak egy maradhat, a régit kapcsold ki.`);
if (warnings.length) console.log('\n## Figyelmeztetések\n\n' + warnings.map((w) => `- ⚠ ${w}`).join('\n'));
if (unknown.size) {
  console.log('\n## Ismeretlen külső domainek (kézzel kell besorolni, vagy fel kell venni a data/providers.json-ba)\n');
  for (const [h, w] of [...unknown].sort()) console.log(`- ${h} (${[...w].join(', ')})`);
}

if (write) {
  mkdirSync(new URL('sites', root), { recursive: true });
  const out = {
    host: SELF,
    scannedAt: new Date().toISOString(),
    pages: pages.length,
    gtm: [...gtmIds],
    services: rows.map((f) => ({ id: f.prov.id, via: [...(f.gtm.size ? ['gtm'] : []), ...(f.html.size ? ['html'] : [])] })),
    unknownHosts: [...unknown.keys()].sort(),
    warnings,
  };
  writeFileSync(new URL(`sites/${SELF}.json`, root), JSON.stringify(out, null, 2) + '\n');
  console.error(`\nMentve: sites/${SELF}.json`);
}
