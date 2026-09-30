// GTM consent-szinkron: a 360 Consent admin besorolása alapján a GTM tagek consent-feltételének ellenőrzése és beállítása.
// Helyben fut (a Google-token nem kerülhet a szerverre), az eredményt feltölti az adminba (GTM fül).
//
// Használat:
//   node tools/gtm-sync.mjs                    minden domain, ahol az adminban be van kapcsolva a szinkron – csak jelentés
//   node tools/gtm-sync.mjs --host domain.hu   egy domain (akkor is, ha nincs bekapcsolva) – csak jelentés
//   node tools/gtm-sync.mjs --apply            a hiányzó consent-feltételek beállítása (csak bekapcsolt szinkronnál)
//   --account pengemedia@gmail.com             melyik Google-fiók tokenjével (alap: pengemedia@gmail.com)
//   --test clarity=marketing                   tesztelés: helyi átsorolás + bekapcsolt szinkron, közzététel nélkül (csak --host-tal)
//
// Titkok: ~/.config/360-consent/admin.env (admin belépés), ~/marveen/store/google-tokens/<fiók>.json (refresh token),
// ~/.gmail-mcp/gcp-oauth.keys.json (OAuth kliens). Semmit nem ír ki belőlük.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const APPLY = args.includes('--apply');
const ONLY = opt('--host', null);
const ACCOUNT = opt('--account', 'pengemedia@gmail.com');
const TEST = ONLY && opt('--test', null) ? Object.fromEntries([opt('--test').split('=')]) : null;
const HOME = homedir();
const PROVIDERS = JSON.parse(readFileSync(new URL('../data/providers.json', import.meta.url), 'utf8'));
const BY_ID = Object.fromEntries(PROVIDERS.map((p) => [p.id, p]));

const CONSENT_REQ = { necessary: [], preferences: ['personalization_storage'], statistics: ['analytics_storage'], marketing: ['ad_storage'] };
const GOOGLE_TYPES = new Set(['googtag', 'gaawe', 'gaawc', 'awct', 'sp', 'gclidw', 'flc', 'fls', 'ua', 'awcc', 'awud', 'cegg']);
const PAGE_TRIGGERS = new Set(['2147479553', '2147479573']); // All Pages, Initialization – All Pages
const TYPE_NAMES = { googtag: 'Google tag', gaawe: 'GA4 esemény', awct: 'Google Ads konverzió', sp: 'Google Ads remarketing', gclidw: 'Konverziós linker', html: 'Egyéni HTML', img: 'Egyéni kép' };

// --- admin ---
const env = Object.fromEntries(readFileSync(`${HOME}/.config/360-consent/admin.env`, 'utf8').split('\n').filter(Boolean).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
const ADMIN = env.C360_ADMIN_URL;
let cookie = '', csrf = '';
async function adminLogin() {
  const jar = (r) => (r.headers.getSetCookie?.() || []).forEach((c) => { if (c.startsWith('c360adm=')) cookie = c.split(';')[0]; });
  let r = await fetch(ADMIN, { redirect: 'manual' }); jar(r);
  const t = (await r.text()).match(/name="csrf" value="([^"]+)"/)?.[1];
  r = await fetch(ADMIN, { method: 'POST', redirect: 'manual', headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ user: env.C360_ADMIN_USER, pass: env.C360_ADMIN_PASSWORD, csrf: t }) }); jar(r);
  if (r.status !== 303) throw new Error('Admin belépés sikertelen');
  csrf = (await (await fetch(ADMIN, { headers: { cookie } })).text()).match(/data-csrf="([^"]+)"/)?.[1];
}
async function admin(action, body, q = '') {
  const r = await fetch(`${ADMIN}api.php?a=${action}${q}`, { method: body ? 'POST' : 'GET',
    headers: { cookie, ...(body ? { 'content-type': 'application/json', 'x-csrf': csrf } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json();
  if (!r.ok) throw new Error(`admin ${action}: ${j.error || r.status}`);
  return j;
}

// --- GTM API ---
let token = null;
async function gtoken() {
  if (token) return token;
  const t = JSON.parse(readFileSync(`${HOME}/marveen/store/google-tokens/${ACCOUNT}.json`, 'utf8'));
  const k = JSON.parse(readFileSync(`${HOME}/.gmail-mcp/gcp-oauth.keys.json`, 'utf8')).installed;
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ client_id: k.client_id, client_secret: k.client_secret, refresh_token: t.refresh_token, grant_type: 'refresh_token' }) });
  token = (await r.json()).access_token;
  if (!token) throw new Error('Google-token frissítése sikertelen');
  return token;
}
async function gtm(method, path, body, tries = 3) {
  const r = await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${path}`, { method,
    headers: { authorization: `Bearer ${await gtoken()}`, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const txt = await r.text();
  const j = txt ? JSON.parse(txt) : {};
  if (r.status === 429 && tries > 1) { // percenkénti kvóta – várunk, és újra
    await new Promise((res) => setTimeout(res, 61000));
    return gtm(method, path, body, tries - 1);
  }
  if (!r.ok) { const e = new Error(`GTM ${method} ${path.split('/').slice(-2).join('/')}: ${r.status} ${j.error?.message || ''}`); e.status = r.status; throw e; }
  return j;
}
async function findContainer(publicId) {
  const { account = [] } = await gtm('GET', 'accounts');
  for (const a of account) {
    const { container = [] } = await gtm('GET', `${a.path}/containers`);
    const c = container.find((x) => x.publicId === publicId);
    if (c) return c;
  }
  return null;
}

// --- besorolás ---
function textProviders(text) {
  return PROVIDERS.filter((p) => (p.gtm || []).some((g) => (g.startsWith('re:') ? new RegExp(g.slice(3)).test(text) : text.includes(g))));
}
function param(tag, key) { return (tag.parameter || []).find((p) => p.key === key)?.value || ''; }
function classify(tag, live, siteCfg) {
  const type = tag.type.startsWith('cvt_') ? 'cvt' : tag.type;
  const out = { id: tag.tagId, name: tag.name, type: TYPE_NAMES[type] || (type === 'cvt' ? 'Egyéni sablon' : type), paused: !!tag.paused };
  if (GOOGLE_TYPES.has(type)) { out.builtin = true; if (type === 'gaawe' || type === 'googtag') out.service = 'ga4'; if (['awct', 'sp', 'gclidw'].includes(type)) out.service = 'google-ads'; }
  else {
    let text = type === 'html' ? param(tag, 'html') : type === 'img' ? param(tag, 'url') : JSON.stringify(tag.parameter || []);
    if (type === 'cvt') {
      const tpl = (live.customTemplate || []).find((t) => tag.type === `cvt_${t.containerId}_${t.templateId}`);
      if (tpl) { text += '\n' + tpl.templateData; out.type = 'Sablon: ' + tpl.name; }
    }
    const p = textProviders(text)[0];
    if (p) out.service = p.id;
  }
  const override = (siteCfg.services || []).find((s) => s.id === out.service);
  out.cat = override?.cat || BY_ID[out.service]?.cat || null;
  const cs = tag.consentSettings || {};
  out.consent = cs.consentStatus === 'needed' ? (cs.consentType?.list || []).map((x) => x.value) : [];
  const pageLevel = (tag.firingTriggerId || []).some((id) => PAGE_TRIGGERS.has(id) ||
    ['pageview', 'domReady', 'windowLoaded'].includes((live.trigger || []).find((t) => t.triggerId === id)?.type));
  out.required = out.cat ? CONSENT_REQ[out.cat] : null;
  if (out.paused) out.status = 'paused';
  else if (out.builtin || out.service === 'c360' || (out.required && !out.required.length)) out.status = 'skip';
  else if (!out.service) out.status = out.consent.length ? 'ok' : 'unknown';
  else {
    const sameSet = out.required.length === out.consent.length && out.required.every((x) => out.consent.includes(x));
    out.needsTrigger = pageLevel;
    out.status = sameSet ? 'ok' : 'missing';
  }
  return out;
}

async function syncSite(site) {
  const host = site.host;
  let settings = site.gtmSync?.settings || {};
  if (TEST) { // csak helyben: átsorolás és bekapcsolt szinkron, közzététel nélkül; az admin adatai nem változnak
    settings = { enabled: true, autoPublish: false };
    site.config = { ...(site.config || {}), services: Object.entries(TEST).map(([id, cat]) => ({ id, cat })) };
  }
  const publicId = site.scan?.gtm?.[0] || site.gtmSync?.snapshot?.container;
  if (!publicId) { console.log(`${host}: nincs ismert GTM konténer (előbb szkennelés kell)`); return; }
  const prev = site.gtmSync?.snapshot;
  const c = prev?.container === publicId && prev.accountId && prev.containerId
    ? { accountId: prev.accountId, containerId: prev.containerId, path: `accounts/${prev.accountId}/containers/${prev.containerId}` }
    : await findContainer(publicId);
  if (!c) { console.log(`${host}: ${publicId} nem érhető el a(z) ${ACCOUNT} fiókkal`); return; }
  const live = await gtm('GET', `${c.path}/versions:live`);
  const tags = (live.tag || []).map((t) => classify(t, live, site.config || {}));
  const todo = tags.filter((t) => t.status === 'missing');
  let pending = false, changes = 0, workspaceId = null;
  const log = [];

  if (APPLY && settings.enabled && todo.length) {
    // Egyetlen, újrahasznált munkaterület (ingyenes GTM-ben legfeljebb 3 lehet; közzétételkor a GTM megszünteti).
    const { workspace = [] } = await gtm('GET', `${c.path}/workspaces`);
    let ws = workspace.find((x) => x.name.startsWith('360 Consent szinkron'));
    if (ws) { try { await gtm('POST', `${ws.path}:sync`); } catch (e) { log.push('Munkaterület frissítése: ' + e.message); } }
    else ws = await gtm('POST', `${c.path}/workspaces`, { name: '360 Consent szinkron', description: 'Consent-feltételek a 360 Consent admin besorolása szerint' });
    workspaceId = ws.workspaceId;
    const { trigger = [] } = await gtm('GET', `${ws.path}/triggers`);
    let upd = trigger.find((t) => t.type === 'customEvent' && JSON.stringify(t.customEventFilter || []).includes('gtm_consent_update'));
    if (!upd) upd = await gtm('POST', `${ws.path}/triggers`, { name: 'gtm_consent_update', type: 'customEvent',
      customEventFilter: [{ type: 'equals', parameter: [{ type: 'template', key: 'arg0', value: '{{_event}}' }, { type: 'template', key: 'arg1', value: 'gtm_consent_update' }] }] });
    for (const t of todo) {
      const cur = await gtm('GET', `${ws.path}/tags/${t.id}`);
      cur.consentSettings = { consentStatus: 'needed', consentType: { type: 'list', list: t.required.map((v) => ({ type: 'template', value: v })) } };
      if (t.needsTrigger && !(cur.firingTriggerId || []).includes(upd.triggerId)) cur.firingTriggerId = [...(cur.firingTriggerId || []), upd.triggerId];
      if (t.needsTrigger) cur.tagFiringOption = 'oncePerLoad';
      await gtm('PUT', cur.path, cur);
      t.status = 'fixed'; t.consent = t.required; changes++;
      log.push(`#${t.id} ${t.name}: ${t.required.join(', ')}`);
    }
    pending = true;
    if (settings.autoPublish) {
      try {
        const v = await gtm('POST', `${ws.path}:create_version`, { name: '360 Consent szinkron', notes: log.join('\n') });
        await gtm('POST', `${v.containerVersion.path}:publish`);
        pending = false;
        log.push(`Közzétéve: v${v.containerVersion.containerVersionId}`);
      } catch (e) {
        log.push(`Automatikus közzététel nem sikerült (${e.status === 403 ? 'a tokennek nincs verziókészítési joga' : e.message}); a GTM-ben kell közzétenni.`);
      }
    }
  }

  const snapshot = { container: publicId, accountId: c.accountId, containerId: c.containerId, liveVersion: live.containerVersionId,
    syncedAt: new Date().toISOString(), applied: APPLY && !!settings.enabled, pending, workspaceId, changes, log,
    tags: tags.map(({ needsTrigger, required, ...t }) => t) };
  if (!TEST) await admin('gtm-snapshot', { host, snapshot });
  else console.log(`  (teszt: az admin pillanatképe nem frissült; munkaterület: ${workspaceId || '–'})`);

  const count = (s) => tags.filter((t) => t.status === s).length;
  console.log(`${host} (${publicId}, élő v${live.containerVersionId}): ${tags.length} tag – rendben ${count('ok')}, nem kell ${count('skip')}, szünetel ${count('paused')}, ismeretlen ${count('unknown')}, hiányzó ${count('missing')}${changes ? `, javítva ${changes}` : ''}`);
  for (const t of tags.filter((x) => ['missing', 'fixed', 'unknown'].includes(x.status))) console.log(`  ${t.status.padEnd(8)} #${t.id} ${t.name} (${t.service || 'ismeretlen'})`);
  for (const l of log) console.log('  ' + l);
  if (todo.length && !APPLY) console.log('  → javításhoz: --apply (és az adminban bekapcsolt szinkron)');
}

await adminLogin();
const { sites } = await admin('sites');
for (const s of sites) {
  if (ONLY && s.host !== ONLY.replace(/^www\./, '')) continue;
  const { site } = await admin('site', null, `&host=${encodeURIComponent(s.host)}`);
  if (!ONLY && !site.gtmSync?.settings?.enabled) continue;
  try { await syncSite(site); } catch (e) { console.log(`${s.host}: HIBA – ${e.message}`); }
}
