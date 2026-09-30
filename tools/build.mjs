// dist/c360-consent.js előállítása: src/c360-consent.js + data/providers.json + verzió a package.json-ból.
// Használat: node tools/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const providers = JSON.parse(readFileSync(new URL('data/providers.json', root), 'utf8'));
const src = readFileSync(new URL('src/c360-consent.js', root), 'utf8');

const cats = new Set(['necessary', 'preferences', 'statistics', 'marketing', 'infra']);
const ids = new Set();
for (const p of providers) {
  if (!p.id || !p.name || !cats.has(p.cat)) throw new Error(`Hibás szolgáltatás: ${JSON.stringify(p).slice(0, 120)}`);
  if (ids.has(p.id)) throw new Error(`Duplikált id: ${p.id}`);
  ids.add(p.id);
  for (const [name, dur] of p.cookies || []) {
    if (!/^(s|\d+(min|h|d|mo|y))$/.test(dur)) throw new Error(`Hibás élettartam: ${p.id} ${name} ${dur}`);
  }
}

if (!src.includes('/*__PROVIDERS__*/[]')) throw new Error('Hiányzik a /*__PROVIDERS__*/[] jelölő a forrásból');
const out = src
  .replace('/*__PROVIDERS__*/[]', JSON.stringify(providers))
  .replaceAll('__VERSION__', pkg.version);

mkdirSync(new URL('dist', root), { recursive: true });
writeFileSync(new URL('dist/c360-consent.js', root), out);
new Function(out); // szintaxis-ellenőrzés
console.log(`dist/c360-consent.js – ${pkg.version}, ${providers.length} szolgáltatás, ${out.length} bájt`);
