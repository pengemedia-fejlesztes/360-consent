/*!
 * 360 Marketing – Google Consent Mode v2 süti popup
 * Verzió: __VERSION__
 * Ezt a fájlt a tools/build.mjs generálja a src/ és a data/ mappából – ne kézzel szerkeszd.
 * Forrás: https://github.com/pengemedia-fejlesztes/360-consent
 * https://360-marketing.hu
 *
 * CDN-ről betöltött szkript (jsDelivr). Beállítás: 1) a 360 Consent admin (domainenként),
 * 2) window.C360_CONFIG a GTM betöltő tagben, 3) az alábbi alapértékek – ebben a sorrendben.
 * Párja: "360 Marketing – Consent Mode v2 Init" template (Consent Initialization).
 * Kategóriák -> Consent Mode paraméterek:
 *   necessary   -> functionality_storage, security_storage (mindig granted)
 *   preferences -> personalization_storage
 *   statistics  -> analytics_storage
 *   marketing   -> ad_storage, ad_user_data, ad_personalization
 * A döntés a "c360_consent" sütiben tárolódik ("v1.<p>.<s>.<m>", pl. "v1.1.0.1").
 */
(function (w, d) {
  if (w.C360Consent) return;

  var CONFIG = {
    api: 'https://360-marketing.hu/c360/api/', // admin: domainenkénti beállítások + telepítés-nyilvántartás; '' = ki
    policyUrl: '',                  // adatkezelési tájékoztató URL; üresen a link nem jelenik meg
    cookieName: 'c360_consent',     // a GTM Init template is ezt olvassa – csak együtt módosítsd
    cookieDays: 365,
    cookieDomain: '',               // pl. '.domain.hu', ha aldomainek között is közös legyen
    defaultLang: 'en',
    forceLang: '',                  // pl. 'hu' – üresen a <html lang> / böngésző nyelve dönt
    languages: [],                  // a nyelvválasztóban felkínált nyelvek; üres = mind
    langSwitcher: true,             // nyelvválasztó a bannerben
    placement: 'center',            // a banner helye: 'center' | 'top' | 'bottom' | 'left' | 'right'
    size: 0,                        // a képernyő %-a: középen szélesség ÉS magasság, bal/jobb: szélesség, fent/lent: magasság (0 = alap)
    preChecked: false,              // a Testreszabás panelen a kapcsolók alapból bekapcsolva (első látogatáskor)
    hideEmpty: true,                // csak az a kategória jelenik meg, amelyikben van felismert szolgáltatás
    known: [],                      // a szerver által ismert szolgáltatások (szkennelés + visszajelzések)
    acceptLarge: true,              // nagy „Összes elfogadása”, kicsi „Testreszabás”
    showReject: true,               // „Összes elutasítása” már az első rétegben
    showRejectPanel: true,          // „Összes elutasítása” a Testreszabás panelen
    customCss: '',                  // saját CSS a banner stílusai után (az adminból)
    customJs: '',                   // saját JS a banner felépítése után; elérhető: root, config, api, on(esemény, fn)
    position: 'left',               // a süti beállítás gomb (ikon) helye: 'left' | 'right'
    brandColor: '#287FAA',
    brandUrl: 'https://360-marketing.hu/',
    showBranding: true,
    texts: {},                      // { hu: { title: '…', text: '…' } } – felülírja az alapszövegeket
    categories: {},                 // { marketing: { enabled: false, desc: { hu: '…' } } }
    services: [],                   // az admin által jóváhagyott/átsorolt szolgáltatások
    pingRate: 0.02,                 // a látogatások ekkora hányada jelzi vissza a telepítést és a felismert sütiket
    // Teljes oldal-szkennelés eredménye (tools/scan.mjs). A {host} helyére az oldal domainje kerül (www. nélkül).
    siteData: 'https://cdn.jsdelivr.net/gh/pengemedia-fejlesztes/360-consent@main/sites/{host}.json',
    scanGtm: true                   // a betöltött GTM konténer(ek) konfigurációjából is felismeri a szolgáltatásokat
  };
  function merge(src) {
    for (var k in src) {
      if (!Object.prototype.hasOwnProperty.call(src, k)) continue;
      var v = src[k];
      if (v === undefined || v === null || v === '') continue;
      if (k === 'placement' && v !== 'center' && v !== 'top' && v !== 'bottom' && v !== 'left' && v !== 'right') continue;
      CONFIG[k] = v;
    }
  }
  merge(w.C360_CONFIG || {});
  // Régi (1.0) beállítás: a position a süti ikon helye volt – ez maradt.

/*__I18N__*/

  var CATS = ['necessary', 'preferences', 'statistics', 'marketing'];
  var VERSION = '__VERSION__';

  w.dataLayer = w.dataLayer || [];
  function gtag() { w.dataLayer.push(arguments); }

  // --- Szolgáltatás-felismerés ---
  // Az adatbázis a data/providers.json-ból kerül ide build közben.
  var PROVIDERS = /*__PROVIDERS__*/[];
  var BY_ID = {};
  for (var pi = 0; pi < PROVIDERS.length; pi++) BY_ID[PROVIDERS[pi].id] = PROVIDERS[pi];
  var DUR_UNIT = { min: 'minute', h: 'hour', d: 'day', mo: 'month', y: 'year' };
  var SELF = location.hostname.replace(/^www\./, '');

  function parseUrl(u) {
    try { var x = new URL(u, location.href); return { host: x.hostname.replace(/^www\./, ''), path: x.pathname + x.search }; }
    catch (e) { return null; }
  }
  function hostMatch(host, pat) {
    return host === pat || host.slice(-pat.length - 1) === '.' + pat;
  }
  // URL -> szolgáltatás (az első találat nyer, ezért a konkrétabb minták előrébb vannak)
  function matchUrl(u) {
    var p = parseUrl(u);
    if (!p || !/^[a-z0-9.-]+$/i.test(p.host)) return null;
    for (var i = 0; i < PROVIDERS.length; i++) {
      var hs = PROVIDERS[i].hosts || [];
      for (var j = 0; j < hs.length; j++) {
        var s = hs[j].indexOf('/'), ph = s < 0 ? hs[j] : hs[j].slice(0, s), pp = s < 0 ? '' : hs[j].slice(s);
        var ok = ph === '@self' ? p.host === SELF : hostMatch(p.host, ph);
        if (ok && (!pp || p.path.indexOf(pp) === 0)) return PROVIDERS[i];
      }
    }
    return null;
  }
  function cookieRe(pat) {
    return new RegExp('^' + pat.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
  }
  function textMatch(text, pat) {
    return pat.indexOf('re:') === 0 ? new RegExp(pat.slice(3)).test(text) : text.indexOf(pat) !== -1;
  }

  var scanCache = { gtm: {}, site: null };

  function newReport() { return { services: {}, unknownHosts: {}, unknownCookies: [] }; }
  function addService(r, p, via) {
    if (!p || p.cat === 'infra') return;
    var s = r.services[p.id] || (r.services[p.id] = { id: p.id, name: p.name, cat: p.cat, cookies: p.cookies || [], via: [] });
    if (s.via.indexOf(via) === -1) s.via.push(via);
  }
  function addUrl(r, u, via) {
    var p = matchUrl(u);
    if (p) { addService(r, p, via); return; }
    var x = parseUrl(u);
    if (x && x.host && x.host !== SELF && /^https?:/.test(u)) r.unknownHosts[x.host] = (r.unknownHosts[x.host] || 0) + 1;
  }
  function scanText(r, text, via) {
    for (var i = 0; i < PROVIDERS.length; i++) {
      var g = PROVIDERS[i].gtm || [];
      for (var j = 0; j < g.length; j++) if (textMatch(text, g[j])) { addService(r, PROVIDERS[i], via); break; }
    }
  }

  // Szinkron rész: betöltött szkriptek, iframe-ek, hálózati erőforrások, olvasható sütik.
  function scanPage() {
    var r = newReport(), i, j, list;
    list = d.querySelectorAll('script[src],iframe[src],img[src],link[rel=preconnect],link[rel=dns-prefetch],[data-src],[data-lazy-src]');
    for (i = 0; i < list.length; i++) {
      var el = list[i];
      addUrl(r, el.getAttribute('src') ? el.src : el.href || el.getAttribute('data-src') || el.getAttribute('data-lazy-src'), el.tagName.toLowerCase());
    }
    if (w.performance && performance.getEntriesByType) {
      list = performance.getEntriesByType('resource');
      for (i = 0; i < list.length; i++) addUrl(r, list[i].name, 'network');
    }
    var ck = cookieStr(), names = ck ? ck.split(/;\s*/).map(function (c) { return c.split('=')[0]; }) : [];
    var known = {};
    for (i = 0; i < PROVIDERS.length; i++) {
      var cs = PROVIDERS[i].cookies || [], hit = false;
      for (j = 0; j < cs.length; j++) {
        var re = cookieRe(cs[j][0]);
        for (var k = 0; k < names.length; k++) if (re.test(names[k])) { hit = true; known[names[k]] = 1; }
      }
      if (hit) addService(r, PROVIDERS[i], 'cookie');
    }
    // Az admin által kézzel felvett sütik sem ismeretlenek.
    var sv = CONFIG.services || [];
    for (i = 0; i < sv.length; i++) for (j = 0; j < (sv[i].cookies || []).length; j++) {
      var cr = cookieRe(String(sv[i].cookies[j][0]));
      for (k = 0; k < names.length; k++) if (cr.test(names[k])) known[names[k]] = 1;
    }
    for (i = 0; i < names.length; i++) {
      if (names[i] && !known[names[i]] && names[i] !== 'c360_lang' && r.unknownCookies.length < 40) r.unknownCookies.push(names[i]);
    }
    if (BY_ID.c360) addService(r, BY_ID.c360, 'self');
    return r;
  }

  function gtmUrls() {
    var out = {}, i, list = d.querySelectorAll('script[src*="gtm.js"]');
    for (i = 0; i < list.length; i++) out[list[i].src] = 1;
    var gtm = w.google_tag_manager || {};
    for (var id in gtm) if (/^GTM-[A-Z0-9]+$/.test(id)) {
      var known = false;
      for (var u in out) if (u.indexOf(id) !== -1) known = true;
      if (!known) out['https://www.googletagmanager.com/gtm.js?id=' + id] = 1;
    }
    return Object.keys(out);
  }

  function fetchText(url, cb) {
    if (!w.fetch) { cb(null); return; }
    fetch(url, { credentials: 'omit' }).then(function (res) { return res.ok ? res.text() : null; })
      .then(cb, function () { cb(null); });
  }

  // Teljes felismerés: a szinkron rész után a GTM konténer(ek) és a szkenner-adat (sites/<host>.json) is.
  // cb(report, done) – először azonnal hívódik, a letöltések végén done=true-val még egyszer.
  function runScan(cb) {
    var r = scanPage(), jobs = [];
    function mergeSite(data) {
      var ids = (data && data.services) || [];
      for (var i = 0; i < ids.length; i++) addService(r, BY_ID[typeof ids[i] === 'string' ? ids[i] : ids[i].id], 'site-scan');
    }
    if (CONFIG.scanGtm) gtmUrls().forEach(function (u) {
      jobs.push(function (next) {
        if (scanCache.gtm[u] !== undefined) { if (scanCache.gtm[u]) scanText(r, scanCache.gtm[u], 'gtm'); next(); return; }
        fetchText(u, function (t) {
          // Csak a konténer saját konfigurációja (tagek, változók, template-ek). A "blob" a GTM minden
          // konténerben azonos beállítása, utána pedig a Google általános könyvtára jön.
          var cut = t ? t.indexOf('"blob":{') : -1;
          if (cut < 0 && t) cut = t.indexOf('"security_groups"');
          scanCache.gtm[u] = cut > 0 ? t.slice(0, cut) : '';
          if (scanCache.gtm[u]) scanText(r, scanCache.gtm[u], 'gtm');
          next();
        });
      });
    });
    if (CONFIG.siteData) jobs.push(function (next) {
      if (scanCache.site !== null) { mergeSite(scanCache.site); next(); return; }
      fetchText(String(CONFIG.siteData).replace('{host}', SELF), function (t) {
        try { scanCache.site = t ? JSON.parse(t) : {}; } catch (e) { scanCache.site = {}; }
        mergeSite(scanCache.site); next();
      });
    });
    cb(r, !jobs.length);
    var left = jobs.length;
    jobs.forEach(function (job) { job(function () { if (--left === 0) cb(r, true); }); });
  }

  // --- Nyelv ---
  function cookieStr() {
    try { return d.cookie || ''; } catch (e) { return ''; } // sandbox iframe-ben (admin előnézet) nincs süti
  }
  function readCookie(name) {
    var m = cookieStr().match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }
  function langs() {
    var l = CONFIG.languages && CONFIG.languages.length ? CONFIG.languages : Object.keys(I18N);
    return l.filter(function (x) { return !!I18N[x]; });
  }
  function pickLang() {
    var ok = langs();
    // A látogató által a nyelvválasztóban kiválasztott nyelv (c360_lang) az első.
    var cands = [readCookie('c360_lang'), CONFIG.forceLang, d.documentElement.lang, (navigator.languages || [])[0], navigator.language];
    for (var i = 0; i < cands.length; i++) {
      var l = String(cands[i] || '').slice(0, 2).toLowerCase();
      if (I18N[l] && ok.indexOf(l) !== -1) return l;
    }
    return ok.indexOf(CONFIG.defaultLang) !== -1 ? CONFIG.defaultLang : ok[0] || 'en';
  }
  var lang = 'en';
  function t(key) {
    var ov = (CONFIG.texts && CONFIG.texts[lang]) || {};
    return ov[key] || (I18N[lang] || {})[key] || I18N.en[key] || '';
  }
  function loc(obj) { // { hu: '…', en: '…' } -> a látogató nyelvén, angol tartalékkal
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj.en || obj.hu || '';
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // --- Tárolás ---
  function readState() {
    var v = readCookie(CONFIG.cookieName);
    if (!v) return null;
    var p = v.split('.');
    if (p.length !== 4 || p[0] !== 'v1') return null;
    return { necessary: true, preferences: p[1] === '1', statistics: p[2] === '1', marketing: p[3] === '1' };
  }
  function setCookie(name, value, days) { // days = 0: munkamenet-süti (a böngésző bezárásáig)
    var exp = days ? '; expires=' + new Date(Date.now() + days * 864e5).toUTCString() : '';
    try { d.cookie = name + '=' + value + exp + '; path=/; SameSite=Lax' +
      (CONFIG.cookieDomain ? '; domain=' + CONFIG.cookieDomain : '') +
      (location.protocol === 'https:' ? '; Secure' : ''); } catch (e) { /* sandbox */ }
  }
  function writeState(s) {
    // Hozzájárulás esetén 1 évig marad; teljes elutasításnál csak a böngésző bezárásáig, utána újra megkérdezzük.
    var any = s.preferences || s.statistics || s.marketing;
    setCookie(CONFIG.cookieName, ['v1', s.preferences ? 1 : 0, s.statistics ? 1 : 0, s.marketing ? 1 : 0].join('.'), any ? CONFIG.cookieDays : 0);
  }

  // --- Consent Mode v2 update + GTM esemény ---
  function applyState(s) {
    var g = function (b) { return b ? 'granted' : 'denied'; };
    gtag('consent', 'update', {
      functionality_storage: 'granted',
      security_storage: 'granted',
      personalization_storage: g(s.preferences),
      analytics_storage: g(s.statistics),
      ad_storage: g(s.marketing),
      ad_user_data: g(s.marketing),
      ad_personalization: g(s.marketing)
    });
    w.dataLayer.push({
      event: 'gtm_consent_update',
      consent_preferences: g(s.preferences),
      consent_statistics: g(s.statistics),
      consent_marketing: g(s.marketing)
    });
  }

  // --- Megjelenítendő szolgáltatások: felismert + admin által felvett, az admin besorolásával ---
  function catEnabled(k) {
    return k === 'necessary' || !(CONFIG.categories[k] && CONFIG.categories[k].enabled === false);
  }
  // Megjelenik-e a panelen: be van kapcsolva, és (ha az üresek rejtve vannak) van benne szolgáltatás.
  function catVisible(k, svcs) {
    if (k === 'necessary') return true;
    if (!catEnabled(k)) return false;
    if (!CONFIG.hideEmpty) return true;
    for (var id in svcs) if (svcs[id].cat === k) return true;
    return false;
  }
  function serviceList(report) {
    var out = {}, i, id;
    for (i = 0; i < (CONFIG.known || []).length; i++) {
      var kp = BY_ID[CONFIG.known[i]];
      if (kp && kp.cat !== 'infra') out[kp.id] = { id: kp.id, name: kp.name, cat: kp.cat, cookies: kp.cookies || [], desc: kp.desc };
    }
    for (id in report.services) {
      var p = BY_ID[id] || report.services[id];
      out[id] = { id: id, name: p.name, cat: p.cat, cookies: p.cookies || [], desc: p.desc };
    }
    var sv = CONFIG.services || [];
    for (i = 0; i < sv.length; i++) {
      var a = sv[i], base = out[a.id] || BY_ID[a.id] || {};
      if (a.hidden) { delete out[a.id]; continue; }
      out[a.id] = {
        id: a.id,
        name: loc(a.name) || base.name || a.id,
        cat: a.cat || base.cat || 'necessary',
        cookies: a.cookies && a.cookies.length ? a.cookies : base.cookies || [],
        desc: a.desc && loc(a.desc) ? a.desc : base.desc
      };
    }
    return out;
  }

  // --- UI ---
  var C = CONFIG.brandColor;
  var root, fab, lastFocus, hasDecision = false, view = 'notice', draft = null, openCats = {}, lastReport = null;

  function rgba(hex, a) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    var n = m ? parseInt(m[1], 16) : 0x287faa;
    return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  // Nagy, középre igazított elrendezés: középen, a képernyő legalább felén.
  function isHero() { return CONFIG.placement === 'center' && +CONFIG.size >= 50; }

  function buildCss() {
    C = CONFIG.brandColor;
    var side = CONFIG.position === 'right' ? 'right' : 'left';
    var pl = CONFIG.placement, size = +CONFIG.size || 0;
    var dlgW = pl === 'center' ? (size ? size + 'vw' : '560px') : pl === 'left' || pl === 'right' ? (size ? size + 'vw' : '420px') : '100%';
    // A megadott % a teljes látható képernyőre vonatkozik: középen szélességre és magasságra is (négyzetes képernyőn négyzetes lesz).
    var sized = pl === 'center' && size ? '#c360.c360--center .c360-dlg,#c360.c360--prefs .c360-dlg{width:' + size + 'vw!important;height:' + size + 'vh!important;max-height:' + size + 'vh!important;min-width:0!important;max-width:' + size + 'vw!important}' +
      '#c360.c360--center .c360-dlg{display:flex;flex-direction:column;justify-content:center}' : '';
    if ((pl === 'top' || pl === 'bottom') && size) sized = '#c360.c360--' + pl + ' .c360-dlg{height:' + size + 'vh;max-height:' + size + 'vh!important;display:flex;flex-direction:column;justify-content:center}';
    return '#c360,#c360 *{box-sizing:border-box;margin:0;padding:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.5;letter-spacing:normal;text-transform:none}' +
      '#c360[hidden],#c360 [hidden]{display:none!important}' +
      '#c360{position:fixed;inset:0;z-index:2147483000;display:flex;padding:16px;pointer-events:none}' +
      '#c360.c360--dim{background:rgba(15,23,32,.5);pointer-events:auto}' +
      '#c360.c360--center,#c360.c360--prefs{align-items:center;justify-content:center}' +
      '#c360.c360--bottom{align-items:flex-end;justify-content:center;padding:0}' +
      '#c360.c360--top{align-items:flex-start;justify-content:center;padding:0}' +
      '#c360.c360--left{justify-content:flex-start;padding:0}' +
      '#c360.c360--right{justify-content:flex-end;padding:0}' +
      '#c360 .c360-dlg{pointer-events:auto;width:' + dlgW + ';max-width:100%;max-height:calc(100vh - 32px);overflow:auto;background:#fff;color:#1f2a33;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.25);padding:28px;animation:c360in .25s ease-out}' +
      '#c360.c360--center .c360-dlg{min-width:min(100%,360px)}' +
      '#c360.c360--bottom .c360-dlg,#c360.c360--top .c360-dlg{border-radius:0;max-height:70vh}' +
      '#c360.c360--left .c360-dlg,#c360.c360--right .c360-dlg{height:100vh;max-height:100vh;border-radius:0;min-width:min(100%,320px)}' +
      '#c360.c360--prefs .c360-dlg{width:min(900px,' + (size && pl === 'center' ? size + 'vw' : '90vw') + ');min-width:min(100%,360px);padding:0;display:flex;flex-direction:column;max-height:90vh;border-radius:14px;height:auto}' +
      '@keyframes c360in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}' +
      '#c360 .c360-bar{max-width:1200px;margin:0 auto;display:flex;gap:24px;align-items:center;flex-wrap:wrap}' +
      '#c360 .c360-bar>.c360-body{flex:1 1 420px}' +
      '#c360 .c360-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}' +
      '#c360 .c360-title{font-size:22px;font-weight:700;color:#1f2a33;line-height:1.3}' +
      '#c360 .c360-tools{display:flex;align-items:center;gap:10px;flex:none}' +
      '#c360 .c360-lang{font-size:13px;padding:4px 6px;border:1px solid #cfd7de;border-radius:6px;background:#fff;color:#1f2a33;max-width:130px}' +
      '#c360 .c360-brand{display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:' + C + ';font-size:12px;font-weight:700;opacity:.9}' +
      '#c360 .c360-brand svg{width:22px;height:22px}' +
      '#c360 .c360-text{font-size:16px;color:#3b4852}' +
      '#c360 .c360-text a,#c360 .c360-intro a{color:' + C + ';font-weight:600;text-decoration:underline}' +
      '#c360 .c360-btns{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}' +
      '#c360 .c360-bar .c360-btns{margin-top:0;flex:0 1 auto}' +
      '#c360 .c360-btn{flex:1 1 140px;min-height:48px;padding:10px 16px;border-radius:6px;border:2px solid ' + C + ';background:#fff;color:' + C + ';font-size:16px;font-weight:600;cursor:pointer;transition:filter .15s}' +
      '#c360 .c360-btn:hover{filter:brightness(.93)}' +
      '#c360 .c360-btn:focus-visible{outline:2px solid #1f2a33;outline-offset:2px}' +
      '#c360 .c360-btn--primary{background:' + C + ';color:#fff}' +
      '#c360 .c360-btns--lg .c360-btn{flex:0 1 auto}' +
      '#c360 .c360-btns--lg .c360-btn--primary{flex:1 1 55%;min-height:54px;font-size:17px}' +
      '#c360 .c360-phead{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 24px;border-bottom:1px solid #e6eaee}' +
      '#c360 .c360-pbody{padding:8px 24px 16px;overflow:auto;flex:1 1 auto}' +
      '#c360 .c360-pfoot{padding:16px 24px;border-top:1px solid #e6eaee}' +
      '#c360 .c360-pfoot .c360-btns{margin-top:0}' +
      '#c360 .c360-x{border:0;background:none;font-size:28px;line-height:1;color:#6b7780;cursor:pointer;padding:0 4px}' +
      '#c360 .c360-intro{font-size:15px;color:#3b4852;padding:12px 0 16px;border-bottom:1px solid #e6eaee}' +
      '#c360 .c360-cat{padding:16px 0;border-bottom:1px solid #e6eaee}' +
      '#c360 .c360-cat-head{display:flex;align-items:center;gap:10px}' +
      '#c360 .c360-chev{border:0;background:none;cursor:pointer;display:flex;align-items:center;gap:10px;flex:1 1 auto;text-align:left;color:#1f2a33;font-size:18px;font-weight:700;padding:0}' +
      '#c360 .c360-chev:before{content:"";width:8px;height:8px;border-right:2px solid #1f2a33;border-bottom:2px solid #1f2a33;transform:rotate(-45deg);transition:transform .15s;flex:none;margin-right:4px}' +
      '#c360 .c360-chev[aria-expanded="true"]:before{transform:rotate(45deg)}' +
      '#c360 .c360-chev:focus-visible{outline:2px solid ' + C + ';outline-offset:2px}' +
      '#c360 .c360-count{font-size:13px;font-weight:500;color:#6b7780}' +
      '#c360 .c360-always{font-size:15px;font-weight:700;color:#138a36;flex:none}' +
      '#c360 .c360-desc{margin:6px 0 0 26px;font-size:15px;color:#3b4852}' +
      '#c360 .c360-list{margin:12px 0 0 26px}' +
      '#c360 .c360-svc{background:#f3f4f5;border-radius:8px;padding:12px 16px;margin-top:10px}' +
      '#c360 .c360-svc h4{font-size:14px;font-weight:700;color:#1f2a33;margin-bottom:4px}' +
      '#c360 .c360-row{display:grid;grid-template-columns:110px 1fr;gap:4px 16px;padding:8px 0;font-size:14px;color:#3b4852}' +
      '#c360 .c360-row+.c360-row{border-top:1px solid #e1e4e7}' +
      '#c360 .c360-row dt{font-weight:600;color:#1f2a33}' +
      '#c360 .c360-row dd{word-break:break-word}' +
      '#c360 .c360-none{font-size:14px;color:#6b7780}' +
      '#c360 .c360-sw{position:relative;flex:none;width:48px;height:28px}' +
      '#c360 .c360-sw input{position:absolute;opacity:0;width:100%;height:100%;cursor:pointer;z-index:1;margin:0}' +
      '#c360 .c360-sw span{position:absolute;inset:0;border-radius:28px;background:#d3d8dc;transition:background .2s}' +
      '#c360 .c360-sw span:after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.25)}' +
      '#c360 .c360-sw input:checked+span{background:' + C + '}' +
      '#c360 .c360-sw input:checked+span:after{transform:translateX(20px)}' +
      '#c360 .c360-sw input:focus-visible+span{outline:2px solid ' + C + ';outline-offset:2px}' +
      '#c360-fab{position:fixed;bottom:16px;' + side + ':16px;z-index:2147482999;width:44px;height:44px;border-radius:50%;border:0;background:' + C + ';color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.2);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}' +
      '#c360-fab[hidden]{display:none}' +
      '#c360-fab svg{width:24px;height:24px}' +
      '#c360-fab:focus-visible{outline:2px solid #1f2a33;outline-offset:2px}' +
      (sized && pl === 'center' ? '@media (max-width:640px){#c360 .c360-dlg{padding:20px 16px}}' :
      '@media (max-width:640px){#c360{padding:0;align-items:flex-end!important;justify-content:center!important}' +
      '#c360 .c360-dlg{width:100%!important;min-width:0!important;height:auto!important;max-height:88vh!important;border-radius:14px 14px 0 0!important;padding:20px 16px}}') +
      '@media (max-width:640px){' +
      '#c360.c360--prefs .c360-dlg{padding:0}' +
      '#c360 .c360-title{font-size:19px}#c360 .c360-text{font-size:15px}' +
      '#c360 .c360-btns .c360-btn,#c360 .c360-btns--lg .c360-btn{flex:1 1 100%}' +
      '#c360 .c360-row{grid-template-columns:90px 1fr}#c360 .c360-desc,#c360 .c360-list{margin-left:0}}' +
      sized +
      // --- nagy elrendezés ---
      '#c360 .c360-dlg--hero{position:relative;padding:56px 40px 48px;background:#fff radial-gradient(120% 55% at 50% 0%,' + rgba(C, 0.11) + ',rgba(255,255,255,0) 65%)}' +
      '#c360 .c360-top{position:absolute;top:18px;right:22px;left:22px;display:flex;justify-content:flex-end}' +
      '#c360 .c360-hero{width:100%;max-width:760px;margin:auto;display:flex;flex-direction:column;align-items:center;text-align:center}' +
      '#c360 .c360-icon{width:88px;height:88px;border-radius:50%;background:' + rgba(C, 0.12) + ';color:' + C + ';display:flex;align-items:center;justify-content:center;margin-bottom:28px;box-shadow:0 0 0 10px ' + rgba(C, 0.05) + '}' +
      '#c360 .c360-icon svg{width:46px;height:46px}' +
      '#c360 .c360-hero .c360-title{font-size:clamp(26px,2.7vw,42px);line-height:1.18;letter-spacing:-.015em;margin-bottom:18px}' +
      '#c360 .c360-hero .c360-text{font-size:clamp(16px,1.15vw,19px);line-height:1.65;color:#4a5763;max-width:680px}' +
      '#c360 .c360-policy{margin-top:14px;font-size:15px}' +
      '#c360 .c360-policy a{color:' + C + ';font-weight:600;text-decoration:underline;text-underline-offset:3px}' +
      '#c360 .c360-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:26px}' +
      '#c360 .c360-chip{display:inline-flex;align-items:center;gap:7px;padding:6px 14px;border-radius:999px;background:#f1f4f6;color:#33414c;font-size:13px;font-weight:600}' +
      '#c360 .c360-chip i{width:8px;height:8px;border-radius:50%;background:' + C + '}' +
      '#c360 .c360-chip--necessary i{background:#138a36}' +
      '#c360 .c360-btns--hero{width:100%;max-width:580px;margin:34px auto 0;justify-content:center}' +
      '#c360 .c360-btns--hero .c360-btn{flex:0 1 auto;border-radius:10px}' +
      '#c360 .c360-btns--hero .c360-btn--primary{flex:1 1 55%;min-height:58px;font-size:18px;box-shadow:0 8px 20px ' + rgba(C, 0.28) + '}' +
      '@media (max-width:640px){#c360 .c360-dlg--hero{padding:64px 20px 28px}#c360 .c360-icon{width:64px;height:64px;margin-bottom:18px}#c360 .c360-icon svg{width:34px;height:34px}#c360 .c360-btns--hero .c360-btn{flex:1 1 100%}#c360 .c360-btns--hero .c360-btn--primary{order:-1}}' +
      (CONFIG.customCss ? '\n/* saját CSS */\n' + String(CONFIG.customCss) : '');
  }

  // Események a saját JS-nek és a weboldalnak: c360:render (detail.view), c360:decision (detail.state)
  function emit(name, detail) {
    try {
      var ev;
      if (typeof w.CustomEvent === 'function') ev = new w.CustomEvent(name, { detail: detail });
      else { ev = d.createEvent('CustomEvent'); ev.initCustomEvent(name, false, false, detail); }
      d.dispatchEvent(ev);
    } catch (e) { /* nem kritikus */ }
  }
  function runCustomJs() {
    if (!CONFIG.customJs) return;
    try {
      new Function('root', 'config', 'api', 'on', String(CONFIG.customJs))(root, CONFIG, w.C360Consent, function (name, fn) {
        d.addEventListener('c360:' + name, function (e) { fn(e.detail, root); });
      });
    } catch (e) { if (w.console) console.warn('360 Consent – saját JS hiba:', e); }
  }

  var cookieSvg = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5zm-4.5 9a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm3 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5-1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM9 6.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>';
  var brandSvg = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="72 16" transform="rotate(-60 16 16)"/><text x="16" y="20" text-anchor="middle" font-size="10" font-weight="800" fill="currentColor" font-family="system-ui,sans-serif">360</text></svg>';

  function fmtDur(spec) {
    if (spec === 's') return t('session');
    var m = /^(\d+)(min|h|d|mo|y)$/.exec(spec || '');
    if (!m) return spec || '';
    try { return new Intl.NumberFormat(lang, { style: 'unit', unit: DUR_UNIT[m[2]], unitDisplay: 'long' }).format(+m[1]); }
    catch (e) { return m[1] + ' ' + m[2]; }
  }

  function toolsHtml() {
    var ls = langs(), sel = '';
    if (CONFIG.langSwitcher && ls.length > 1) {
      sel = '<select class="c360-lang" data-lang aria-label="' + esc(t('language')) + '">' + ls.map(function (l) {
        return '<option value="' + l + '"' + (l === lang ? ' selected' : '') + '>' + esc(LANG_NAMES[l] || l) + '</option>';
      }).join('') + '</select>';
    }
    var brand = CONFIG.showBranding ? '<a class="c360-brand" href="' + esc(CONFIG.brandUrl) + '" target="_blank" rel="noopener" aria-label="360 Marketing">' + brandSvg + '<span>360 Marketing</span></a>' : '';
    return '<div class="c360-tools">' + sel + brand + '</div>';
  }
  function policyLink() {
    return CONFIG.policyUrl ? ' <a href="' + esc(CONFIG.policyUrl) + '" target="_blank" rel="noopener">' + esc(t('policy')) + '</a>' : '';
  }
  function btn(act, label, primary) {
    return '<button type="button" class="c360-btn' + (primary ? ' c360-btn--primary' : '') + '" data-act="' + act + '">' + esc(label) + '</button>';
  }

  function heroHtml() {
    var svcs = serviceList(lastReport || newReport());
    var chips = CATS.filter(function (k) { return catVisible(k, svcs); }).map(function (k) {
      return '<span class="c360-chip c360-chip--' + k + '"><i></i>' + esc(t(k)) + '</span>';
    }).join('');
    return '<div class="c360-dlg c360-dlg--hero" role="dialog" aria-modal="true" aria-labelledby="c360-title" aria-describedby="c360-text" lang="' + lang + '">' +
      '<div class="c360-top">' + toolsHtml() + '</div>' +
      '<div class="c360-hero">' +
        '<div class="c360-icon" aria-hidden="true">' + cookieSvg + '</div>' +
        '<h2 class="c360-title" id="c360-title">' + esc(t('title')) + '</h2>' +
        '<p class="c360-text" id="c360-text">' + esc(t('text')) + '</p>' +
        (CONFIG.policyUrl ? '<p class="c360-policy"><a href="' + esc(CONFIG.policyUrl) + '" target="_blank" rel="noopener">' + esc(t('policy')) + '</a></p>' : '') +
        (chips ? '<div class="c360-chips">' + chips + '</div>' : '') +
        '<div class="c360-btns c360-btns--hero">' + btn('customize', t('customize')) + (CONFIG.showReject ? btn('reject', t('rejectAll')) : '') + btn('accept', t('acceptAll'), true) + '</div>' +
      '</div></div>';
  }

  function noticeHtml() {
    if (isHero()) return heroHtml();
    var bar = CONFIG.placement === 'top' || CONFIG.placement === 'bottom';
    var btns = '<div class="c360-btns' + (CONFIG.acceptLarge ? ' c360-btns--lg' : '') + '">' +
      btn('customize', t('customize')) + (CONFIG.showReject ? btn('reject', t('rejectAll')) : '') + btn('accept', t('acceptAll'), true) + '</div>';
    var body = '<div class="c360-body"><div class="c360-head"><h2 class="c360-title" id="c360-title">' + esc(t('title')) + '</h2>' + toolsHtml() + '</div>' +
      '<p class="c360-text" id="c360-text">' + esc(t('text')) + policyLink() + '</p></div>';
    return '<div class="c360-dlg" role="dialog" aria-modal="' + (CONFIG.placement === 'center') + '" aria-labelledby="c360-title" aria-describedby="c360-text" lang="' + lang + '">' +
      (bar ? '<div class="c360-bar">' + body + btns + '</div>' : body + btns) + '</div>';
  }

  function catHtml(k, svcs) {
    var locked = k === 'necessary', items = [];
    for (var id in svcs) if (svcs[id].cat === k) items.push(svcs[id]);
    items.sort(function (a, b) { return a.name < b.name ? -1 : 1; });
    var cdesc = CONFIG.categories[k] && loc(CONFIG.categories[k].desc) || t('desc_' + k);
    var list = items.length ? items.map(function (s) {
      var sd = loc(s.desc), rows = s.cookies.length ? s.cookies.map(function (c) {
        return '<dl class="c360-row"><dt>' + esc(t('cookie')) + '</dt><dd>' + esc(c[0]) + '</dd>' +
          '<dt>' + esc(t('duration')) + '</dt><dd>' + esc(fmtDur(c[1])) + '</dd>' +
          ((loc(c[2]) || sd) ? '<dt>' + esc(t('description')) + '</dt><dd>' + esc(loc(c[2]) || sd) + '</dd>' : '') + '</dl>';
      }).join('') : (sd ? '<dl class="c360-row"><dt>' + esc(t('description')) + '</dt><dd>' + esc(sd) + '</dd></dl>' : '');
      return '<div class="c360-svc"><h4>' + esc(s.name) + '</h4>' + rows + '</div>';
    }).join('') : '<p class="c360-none">' + esc(t('noneFound')) + '</p>';
    var on = locked || (draft && draft[k]);
    return '<div class="c360-cat"><div class="c360-cat-head">' +
      '<button type="button" class="c360-chev" data-act="more" data-more="' + k + '" aria-expanded="' + !!openCats[k] + '" aria-controls="c360-list-' + k + '">' +
        esc(t(k)) + ' <span class="c360-count">(' + items.length + ')</span></button>' +
      (locked ? '<span class="c360-always">' + esc(t('alwaysOn')) + '</span>'
        : '<span class="c360-sw"><input type="checkbox" role="switch" data-cat="' + k + '" aria-label="' + esc(t(k)) + '"' + (on ? ' checked' : '') + '><span></span></span>') +
      '</div><p class="c360-desc">' + esc(cdesc) + '</p>' +
      '<div class="c360-list" id="c360-list-' + k + '"' + (openCats[k] ? '' : ' hidden') + '>' + list + '</div></div>';
  }

  function prefsHtml() {
    var svcs = serviceList(lastReport || newReport());
    return '<div class="c360-dlg" role="dialog" aria-modal="true" aria-labelledby="c360-ptitle" lang="' + lang + '">' +
      '<div class="c360-phead"><h2 class="c360-title" id="c360-ptitle">' + esc(t('panelTitle')) + '</h2>' +
        '<div class="c360-tools">' + toolsHtml().replace(/^<div class="c360-tools">|<\/div>$/g, '') +
        '<button type="button" class="c360-x" data-act="close" aria-label="' + esc(t('close')) + '">&times;</button></div></div>' +
      '<div class="c360-pbody"><p class="c360-intro">' + esc(t('text')) + policyLink() + '</p>' +
        CATS.filter(function (k) { return catVisible(k, svcs); }).map(function (k) { return catHtml(k, svcs); }).join('') + '</div>' +
      '<div class="c360-pfoot"><div class="c360-btns">' + (CONFIG.showRejectPanel ? btn('reject', t('rejectAll')) : '') + btn('save', t('save')) + btn('accept', t('acceptAll'), true) + '</div></div>' +
    '</div>';
  }

  function $(sel) { return root.querySelector(sel); }

  function render(focusSel) {
    var pl = CONFIG.placement;
    root.className = view === 'prefs' ? 'c360--prefs c360--dim' : 'c360--' + pl + (pl === 'center' ? ' c360--dim' : '');
    root.innerHTML = view === 'prefs' ? prefsHtml() : noticeHtml();
    var f = focusSel && $(focusSel);
    if (f) f.focus();
    emit('c360:render', { view: view, lang: lang });
  }

  function collectDraft() {
    var b = root.querySelectorAll('input[data-cat]');
    for (var i = 0; i < b.length; i++) draft[b[i].getAttribute('data-cat')] = b[i].checked;
  }

  function open(prefs) {
    var s = readState(), pre = !s && !!CONFIG.preChecked;
    draft = { preferences: pre || !!(s && s.preferences), statistics: pre || !!(s && s.statistics), marketing: pre || !!(s && s.marketing) };
    view = prefs ? 'prefs' : 'notice';
    lastFocus = d.activeElement;
    root.hidden = false;
    fab.hidden = true;
    render(prefs ? '[data-act="save"]' : '[data-act="accept"]');
    if (prefs) scanForPrefs();
  }

  function scanForPrefs() {
    runScan(function (r) {
      lastReport = r;
      if (view !== 'prefs' || root.hidden) return;
      var active = d.activeElement && d.activeElement.getAttribute && d.activeElement.getAttribute('data-act');
      var more = d.activeElement && d.activeElement.getAttribute && d.activeElement.getAttribute('data-more');
      collectDraft();
      render(more ? '[data-more="' + more + '"]' : active ? '[data-act="' + active + '"]' : null);
    });
  }

  function close() {
    root.hidden = true;
    fab.hidden = false;
    if (lastFocus && lastFocus.focus && lastFocus !== d.body) lastFocus.focus();
  }

  function decide(s) {
    for (var i = 1; i < CATS.length; i++) if (!catEnabled(CATS[i])) s[CATS[i]] = false;
    s.necessary = true;
    writeState(s);
    applyState(s);
    hasDecision = true;
    close();
    emit('c360:decision', { state: s });
  }

  function onClick(e) {
    var tg = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!tg) return;
    var act = tg.getAttribute('data-act');
    if (act === 'accept') decide({ preferences: true, statistics: true, marketing: true });
    else if (act === 'reject') decide({ preferences: false, statistics: false, marketing: false });
    else if (act === 'customize') { view = 'prefs'; render('[data-act="save"]'); scanForPrefs(); }
    else if (act === 'save') {
      collectDraft();
      var sv = serviceList(lastReport || newReport()); // a nem látható (üres) kategória nem kap hozzájárulást
      decide({ preferences: catVisible('preferences', sv) && draft.preferences, statistics: catVisible('statistics', sv) && draft.statistics, marketing: catVisible('marketing', sv) && draft.marketing });
    }
    else if (act === 'close') { if (hasDecision) close(); else { view = 'notice'; render('[data-act="customize"]'); } }
    else if (act === 'more') {
      var k = tg.getAttribute('data-more'), ul = $('#c360-list-' + k);
      openCats[k] = ul.hidden;
      ul.hidden = !openCats[k];
      tg.setAttribute('aria-expanded', openCats[k] ? 'true' : 'false');
    }
  }

  function onChange(e) {
    if (e.target.hasAttribute('data-lang')) {
      if (view === 'prefs') collectDraft();
      lang = e.target.value;
      setCookie('c360_lang', lang, 365); // a látogató kifejezett választása
      render('[data-lang]');
    } else if (e.target.hasAttribute('data-cat')) {
      draft[e.target.getAttribute('data-cat')] = e.target.checked;
    }
  }

  function onKey(e) {
    if (e.key === 'Escape') {
      if (view === 'prefs' && !hasDecision) { view = 'notice'; render('[data-act="customize"]'); return; }
      if (hasDecision) { close(); return; }
    }
    if (e.key !== 'Tab') return;
    var f = [].filter.call(root.querySelectorAll('a[href],button,input:not([disabled]),select'), function (el) {
      return el.offsetParent !== null;
    });
    if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && d.activeElement === a) { z.focus(); e.preventDefault(); }
    else if (!e.shiftKey && d.activeElement === z) { a.focus(); e.preventDefault(); }
  }

  // --- Telepítés-nyilvántartás: a látogatások kis mintája visszajelzi, hol fut és mit ismert fel ---
  function ping() {
    if (!CONFIG.api || !navigator.sendBeacon || Math.random() >= +CONFIG.pingRate) return;
    setTimeout(function () {
      runScan(function (r, done) {
        if (!done) return;
        var sv = [];
        for (var id in r.services) sv.push({ id: id, via: r.services[id].via });
        var body = JSON.stringify({
          host: SELF, path: location.pathname.slice(0, 200), version: VERSION, lang: lang,
          placement: CONFIG.placement, services: sv, cookies: r.unknownCookies,
          hosts: Object.keys(r.unknownHosts).slice(0, 30), consent: readState()
        });
        try { navigator.sendBeacon(CONFIG.api + 'ping.php', new Blob([body], { type: 'text/plain' })); } catch (e) { /* nem kritikus */ }
      });
    }, 4000);
  }

  // --- Admin-beállítások betöltése (legfeljebb 2,5 mp; utána alapértékekkel indul) ---
  function loadRemote(cb) {
    // Az új betöltő (360-marketing.hu/c360/api/loader.php) már beírta a beállításokat – nincs külön kérés.
    if (w.C360_REMOTE && w.C360_REMOTE.config) { merge(w.C360_REMOTE.config); cb(); return; }
    if (!CONFIG.api || !w.fetch) { cb(); return; }
    var done = false;
    var finish = function () { if (!done) { done = true; cb(); } };
    setTimeout(finish, 2500);
    fetch(CONFIG.api + 'config.php?host=' + encodeURIComponent(SELF), { credentials: 'omit' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (j) { if (!done && j && j.config) merge(j.config); finish(); }, finish);
  }

  function init() {
    if (d.getElementById('c360')) return;
    lang = pickLang();
    var st = d.createElement('style');
    st.id = 'c360-style';
    st.appendChild(d.createTextNode(buildCss()));
    d.head.appendChild(st);

    root = d.createElement('div');
    root.id = 'c360';
    root.hidden = true;
    d.body.appendChild(root);
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    root.addEventListener('keydown', onKey);

    fab = d.createElement('button');
    fab.id = 'c360-fab';
    fab.type = 'button';
    fab.hidden = true;
    fab.setAttribute('aria-label', t('settings'));
    fab.title = t('settings');
    fab.innerHTML = cookieSvg;
    fab.addEventListener('click', function () { open(true); });
    d.body.appendChild(fab);
    runCustomJs();

    // bármely elem a weboldalon megnyithatja: <a href="#" data-c360-open>Süti beállítások</a>
    d.addEventListener('click', function (e) {
      var tg = e.target.closest ? e.target.closest('[data-c360-open]') : null;
      if (tg) { e.preventDefault(); open(true); }
    });

    // Visszatérő látogatónál a consentet már a GTM Init template visszaállította.
    hasDecision = !!readState();
    if (hasDecision) fab.hidden = false;
    else open(false);
    ping();
  }

  w.C360Consent = {
    version: VERSION,
    open: function () { open(true); },
    get: readState,
    setLang: function (l) { if (I18N[l]) { lang = l; if (root && !root.hidden) render(); } },
    config: function () { return CONFIG; },
    // Oldal-felmérés a konzolból: C360Consent.scan() -> táblázat a felismert JS-ekről és az ismeretlen külső domainekről.
    scan: function (cb) {
      runScan(function (r, done) {
        if (!done) return;
        if (cb) { cb(r); return; }
        var rows = [];
        for (var id in r.services) {
          var s = r.services[id];
          rows.push({ szolgaltatas: s.name, kategoria: s.cat, forras: s.via.join(', '), sutik: s.cookies.map(function (x) { return x[0]; }).join(', ') });
        }
        if (w.console && console.table) {
          console.table(rows);
          if (Object.keys(r.unknownHosts).length) { console.log('Ismeretlen külső domainek:'); console.table(r.unknownHosts); }
          if (r.unknownCookies.length) console.log('Ismeretlen sütik:', r.unknownCookies.join(', '));
        }
      });
    },
    reset: function () {
      setCookie(CONFIG.cookieName, '', -1);
      hasDecision = false;
      open(false);
    }
  };

  function start() { loadRemote(init); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start);
  else start();
})(window, document);
