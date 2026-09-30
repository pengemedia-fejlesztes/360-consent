/* 360 Consent admin – felület (vanilla JS). Minden szöveg textContent-tel kerül a DOM-ba. */
(function () {
  'use strict';
  var app = document.getElementById('app');
  var CSRF = app.getAttribute('data-csrf');
  var LANGS = ['hu', 'en', 'de', 'es', 'fr', 'it', 'pt', 'ro', 'sk', 'bg', 'hr', 'cs', 'pl', 'ja'];
  var LANG_NAMES = { hu: 'Magyar', en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano', pt: 'Português', ro: 'Română', sk: 'Slovenčina', bg: 'Български', hr: 'Hrvatski', cs: 'Čeština', pl: 'Polski', ja: '日本語' };
  var CATS = { necessary: 'Elengedhetetlen', preferences: 'Személyre szabás', statistics: 'Statisztika', marketing: 'Marketing' };
  var CONSENT = { necessary: 'functionality_storage, security_storage', preferences: 'personalization_storage', statistics: 'analytics_storage', marketing: 'ad_storage, ad_user_data, ad_personalization' };
  var PLACES = { top: 'Fent', bottom: 'Lent', left: 'Bal oldalt', right: 'Jobb oldalt', center: 'Középen' };
  var TEXT_KEYS = { title: 'Cím', text: 'Szöveg', acceptAll: '„Összes elfogadása” gomb', customize: '„Testreszabás” gomb', rejectAll: '„Összes elutasítása” gomb', save: '„Mentés” gomb', panelTitle: 'Beállítások panel címe' };
  var DUR = { s: 'munkamenet', min: 'perc', h: 'óra', d: 'nap', mo: 'hónap', y: 'év' };

  var providers = {}, defaults = {}, site = null, cfg = null, dirty = false, tab = 'install', editLang = 'hu';

  // --- segédek ---
  function h(tag, attrs) {
    var el = document.createElement(tag);
    for (var k in attrs || {}) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === 'text') el.textContent = v;
      else if (k === 'class') el.className = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  function api(action, body, q) {
    return fetch('api.php?a=' + action + (q || ''), {
      method: body ? 'POST' : 'GET',
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json', 'X-CSRF': CSRF } : {},
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      if (r.status === 401) { location.reload(); throw new Error('auth'); }
      return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || r.status); return j; });
    });
  }
  function ago(iso) {
    if (!iso) return '–';
    var s = (Date.now() - Date.parse(iso)) / 1000;
    if (s < 90) return 'most';
    if (s < 3600) return Math.round(s / 60) + ' perce';
    if (s < 86400) return Math.round(s / 3600) + ' órája';
    return Math.round(s / 86400) + ' napja';
  }
  function fmtDate(iso) { return iso ? new Date(iso).toLocaleString('hu-HU') : '–'; }
  function dur(spec) {
    var m = /^(\d+)(min|h|d|mo|y)$/.exec(spec || '');
    return spec === 's' ? DUR.s : m ? m[1] + ' ' + DUR[m[2]] : spec || '';
  }
  function toast(msg, bad) {
    var t = h('div', { class: 'toast' + (bad ? ' bad' : ''), text: msg, role: 'status' });
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3500);
  }
  function touch() { dirty = true; var b = document.getElementById('savebar'); if (b) b.classList.add('dirty'); }
  window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  // --- keret ---
  function shell(content) {
    app.textContent = '';
    add(app, h('header', { class: 'top' },
      h('a', { href: '#', class: 'brand', onclick: function (e) { e.preventDefault(); go(''); } }, h('span', { class: 'logo', text: '360' }), ' Consent admin'),
      h('nav', null,
        h('span', { class: 'muted', text: app.getAttribute('data-user') }),
        h('button', { class: 'btn ghost', text: 'Jelszócsere', onclick: passwordDialog }),
        h('button', { class: 'btn ghost', text: 'Kilépés', onclick: function () { api('logout', {}).then(function () { location.reload(); }); } }))));
    add(app, h('main', { class: 'wrap' }, content));
  }

  function go(host) {
    if (dirty && !confirm('Van mentetlen módosítás. Biztosan elhagyod?')) return;
    dirty = false;
    location.hash = host ? '#/' + host : '#/';
  }
  window.addEventListener('hashchange', route);

  function route() {
    var m = /^#\/(.+)$/.exec(location.hash);
    if (m) loadSite(decodeURIComponent(m[1])); else listView();
  }

  // --- domainlista ---
  var STATUS = { active: ['Aktív', 'ok'], discovered: ['Felfedezett', 'warn'], disabled: ['Kikapcsolva', 'off'] };
  function badge(st) { var s = STATUS[st] || STATUS.discovered; return h('span', { class: 'badge ' + s[1], text: s[0] }); }

  function listView() {
    shell(h('p', { class: 'muted', text: 'Betöltés…' }));
    api('sites').then(function (j) {
      var input = h('input', { placeholder: 'pl. domain.hu', 'aria-label': 'Új domain' });
      var form = h('form', { class: 'inline', onsubmit: function (e) {
        e.preventDefault();
        api('create', { host: input.value }).then(function (r) { go(r.host); }, function (err) { toast(err.message, true); });
      } }, input, h('button', { class: 'btn primary', text: 'Domain hozzáadása' }));
      var rows = j.sites.map(function (s) {
        return h('tr', { class: 'click', tabindex: '0', onclick: function () { go(s.host); }, onkeydown: function (e) { if (e.key === 'Enter') go(s.host); } },
          h('td', null, h('strong', { text: s.host })),
          h('td', null, badge(s.status)),
          h('td', { text: s.placement ? PLACES[s.placement] : 'alap' }),
          h('td', { text: s.versions.join(', ') || '–' }),
          h('td', { text: ago(s.lastSeen), title: fmtDate(s.lastSeen) }),
          h('td', { class: 'num', text: s.pages }),
          h('td', { class: 'num', text: s.services }),
          h('td', { class: 'num', text: s.unknownCookies || '–' }));
      });
      shell([
        h('div', { class: 'row between' }, h('h1', { text: 'Domainek' }), form),
        h('p', { class: 'muted', text: 'A popup a látogatások kis mintájából visszajelzi, hol fut. A felfedezett domaineket aktiválni kell, hogy az itt megadott beállítások érvényesüljenek.' }),
        j.sites.length ? h('div', { class: 'card flush' }, h('table', { class: 'grid' },
          h('thead', null, h('tr', null, ['Domain', 'Állapot', 'Elhelyezés', 'Verzió', 'Utolsó jelzés', 'Oldalak', 'Szolgáltatások', 'Ismeretlen sütik'].map(function (x, i) { return h('th', { class: i > 4 ? 'num' : null, text: x }); }))),
          h('tbody', null, rows))) : h('div', { class: 'card empty', text: 'Még nincs domain. Add hozzá az elsőt fent, vagy várd meg, amíg egy telepített popup jelez.' })
      ]);
    }, function (e) { toast('Hiba: ' + e.message, true); });
  }

  // --- egy domain ---
  function loadSite(host) {
    shell(h('p', { class: 'muted', text: 'Betöltés…' }));
    api('site', null, '&host=' + encodeURIComponent(host)).then(function (j) {
      site = j.site;
      cfg = JSON.parse(JSON.stringify(site.config && !Array.isArray(site.config) ? site.config : {}));
      cfg.texts = cfg.texts && !Array.isArray(cfg.texts) ? cfg.texts : {};
      cfg.categories = cfg.categories && !Array.isArray(cfg.categories) ? cfg.categories : {};
      cfg.services = Array.isArray(cfg.services) ? cfg.services : [];
      dirty = false;
      siteView();
    }, function (e) { toast('Nem található: ' + e.message, true); go(''); });
  }

  function val(k, def) { return cfg[k] === undefined ? def : cfg[k]; }
  function set(k, v) { cfg[k] = v; touch(); }

  function siteView() {
    var tabs = { install: 'Telepítés', look: 'Megjelenés', lang: 'Nyelv és szöveg', cats: 'Kategóriák', svcs: 'Szolgáltatások és sütik', scan: 'Szkennelés', gtm: 'GTM' };
    var body = h('div', { class: 'tabbody' });
    var nav = h('div', { class: 'tabs', role: 'tablist' }, Object.keys(tabs).map(function (k) {
      return h('button', { role: 'tab', 'aria-selected': String(k === tab), class: k === tab ? 'on' : '', text: tabs[k], onclick: function () { tab = k; siteView(); } });
    }));
    var status = h('select', { onchange: function () { site.status = this.value; touch(); } },
      Object.keys(STATUS).map(function (k) { return h('option', { value: k, text: STATUS[k][0], selected: site.status === k ? 'selected' : null }); }));
    shell([
      h('a', { href: '#/', class: 'back', text: '← Domainek', onclick: function (e) { e.preventDefault(); go(''); } }),
      h('div', { class: 'row between' }, h('h1', { text: site.host }), h('label', { class: 'inline' }, 'Állapot ', status)),
      nav, body,
      h('div', { id: 'savebar', class: 'savebar' + (dirty ? ' dirty' : '') },
        h('span', { class: 'muted', text: 'Utoljára mentve: ' + fmtDate(site.updated) + (site.updatedBy ? ' (' + site.updatedBy + ')' : '') }),
        h('button', { class: 'btn', text: 'Előnézet', onclick: preview }),
        h('button', { class: 'btn primary', text: 'Mentés', onclick: save }))
    ]);
    ({ install: tabInstall, look: tabLook, lang: tabLang, cats: tabCats, svcs: tabSvcs, scan: tabScan, gtm: tabGtm })[tab](body);
  }

  function save() {
    api('save', { host: site.host, status: site.status, config: cfg, scanSettings: site.scanSettings, gtmSettings: site.gtmSync.settings }).then(function (r) {
      site.config = r.config; site.status = r.status; site.updated = new Date().toISOString();
      if (r.scanSettings) site.scanSettings = r.scanSettings;
      if (r.gtmSettings) site.gtmSync.settings = r.gtmSettings;
      dirty = false; siteView();
      toast('Mentve. A látogatók legfeljebb 5 percen belül az új beállítást látják.');
    }, function (e) { toast('Mentés sikertelen: ' + e.message, true); });
  }

  // 1. Telepítés – hol van elhelyezve
  function tabInstall(body) {
    var ins = site.install || {}, pages = ins.pages || {};
    var list = Object.keys(pages).sort(function (a, b) { return pages[b] < pages[a] ? -1 : 1; });
    var loader = "<script>\nwindow.C360_CONFIG = { policyUrl: {{DataPolicyURL}} };\n(function (d) {\n  if (d.getElementById('c360-loader')) return;\n  var s = d.createElement('script');\n  s.id = 'c360-loader'; s.async = true;\n  s.src = 'https://cdn.jsdelivr.net/gh/pengemedia-fejlesztes/360-consent@1/dist/c360-consent.min.js';\n  d.head.appendChild(s);\n})(document);\n</script>";
    add(body, [
      h('div', { class: 'stats' },
        stat('Első jelzés', fmtDate(ins.firstSeen)), stat('Utolsó jelzés', ago(ins.lastSeen)),
        stat('Jelzések', ins.pings || 0), stat('Verzió', Object.keys(ins.versions || {}).join(', ') || '–'),
        stat('Látogatói nyelvek', Object.keys(ins.langs || {}).join(', ') || '–'), stat('Elhelyezés (jelzett)', ins.placement ? PLACES[ins.placement] : '–')),
      site.status !== 'active' ? h('p', { class: 'alert', text: 'Ez a domain nem aktív: az itt megadott beállítások csak aktív állapotban érvényesülnek.' }) : null,
      h('div', { class: 'card' }, h('h2', { text: 'Oldalak, ahol a popup fut (' + list.length + ')' }),
        list.length ? h('table', { class: 'grid' }, h('thead', null, h('tr', null, h('th', { text: 'Oldal' }), h('th', { text: 'Utoljára' }))),
          h('tbody', null, list.slice(0, 100).map(function (p) {
            return h('tr', null, h('td', null, h('a', { href: 'https://' + site.host + p, target: '_blank', rel: 'noopener', text: p })), h('td', { text: ago(pages[p]), title: fmtDate(pages[p]) }));
          })))
          : h('p', { class: 'muted', text: 'Még nem érkezett jelzés erről a domainről. A telepítés után az első látogatásokból pár percen belül megjelenik.' })),
      h('div', { class: 'card' }, h('h2', { text: 'Telepítés GTM-mel' }),
        h('ol', null,
          h('li', { text: 'Importáld a „360 Marketing – Consent Mode v2 Init” template-et, és tedd a Consent Initialization – All Pages triggerre.' }),
          h('li', { text: 'Hozz létre egy DataPolicyURL nevű Constant változót az adatkezelési tájékoztató címével.' }),
          h('li', { text: 'Tedd be az alábbi kódot Custom HTML tagként az Initialization – All Pages triggerre.' }),
          h('li', { text: 'Custom Event trigger: gtm_consent_update; a nem Google-os tagekre consent-feltétel + ez a trigger.' })),
        h('pre', { class: 'code', text: loader }),
        h('button', { class: 'btn', text: 'Kód másolása', onclick: function () { navigator.clipboard.writeText(loader).then(function () { toast('Kimásolva.'); }); } }))
    ]);
    if (site.scan) add(body, h('div', { class: 'card' }, h('h2', { text: 'Utolsó teljes szkennelés' }),
      h('p', { class: 'muted', text: fmtDate(site.scan.scannedAt) + ' · ' + site.scan.pages + ' oldal · GTM: ' + (site.scan.gtm || []).join(', ') }),
      (site.scan.warnings || []).length ? h('ul', { class: 'warn' }, site.scan.warnings.map(function (w) { return h('li', { text: w }); })) : h('p', { text: 'Figyelmeztetés nincs.' })));
  }
  function stat(k, v) { return h('div', { class: 'stat' }, h('span', { class: 'muted', text: k }), h('strong', { text: String(v) })); }

  // 2. Megjelenés
  function tabLook(body) {
    var pl = val('placement', 'center');
    var cards = Object.keys(PLACES).map(function (k) {
      return h('label', { class: 'place' + (pl === k ? ' on' : '') },
        h('input', { type: 'radio', name: 'pl', value: k, checked: pl === k, onchange: function () { set('placement', k); siteView(); } }),
        h('span', { class: 'mini mini-' + k }, h('i')), h('span', { text: PLACES[k] }));
    });
    var size = +val('size', 0);
    var sizeOut = h('output', { text: size ? size + '%' : 'alap' });
    var sizeRow = h('label', null, (pl === 'center' ? 'Méret a látható képernyő %-ában (szélesség és magasság is; 0 = alap)' : pl === 'top' || pl === 'bottom' ? 'Sáv magassága a képernyő %-ában' : 'Panel szélessége a képernyő %-ában') + ' ',
        h('input', { type: 'range', min: '0', max: '100', step: '5', value: String(size), oninput: function () { set('size', +this.value); sizeOut.textContent = +this.value ? this.value + '%' : 'alap'; } }), ' ', sizeOut);
    add(body, [
      h('div', { class: 'card' }, h('h2', { text: 'Elhelyezés' }), h('div', { class: 'places' }, cards), sizeRow),
      h('div', { class: 'card' }, h('h2', { text: 'Gombok' }),
        check('acceptLarge', true, 'Nagy „Összes elfogadása” gomb, kicsi „Testreszabás”'),
        check('showReject', true, '„Összes elutasítása” gomb már az első rétegben'),
        check('showRejectPanel', true, '„Összes elutasítása” gomb a Testreszabás panelen'),
        val('showReject', true) ? null : h('p', { class: 'alert', text: 'Figyelem: a NAIH és az EDPB gyakorlata szerint az elutasításnak ugyanolyan könnyűnek kell lennie, mint az elfogadásnak. Elutasítás gomb nélkül a banner kifogásolható.' })),
      designCard(),
      h('div', { class: 'card' }, h('h2', { text: 'Arculat és linkek' }),
        h('div', { class: 'form2' },
          h('label', null, 'Fő szín', h('input', { type: 'color', value: val('brandColor', '#287FAA'), oninput: function () { set('brandColor', this.value); } })),
          h('label', null, 'Adatkezelési tájékoztató URL', h('input', { value: val('policyUrl', ''), placeholder: '/adatkezelesi-tajekoztato/ (üresen a GTM-ben megadott)', oninput: function () { set('policyUrl', this.value.trim()); } })),
          h('label', null, 'Süti beállítás ikon helye', h('select', { onchange: function () { set('position', this.value); } },
            h('option', { value: 'left', text: 'Bal alsó sarok', selected: val('position', 'left') === 'left' ? 'selected' : null }),
            h('option', { value: 'right', text: 'Jobb alsó sarok', selected: val('position', 'left') === 'right' ? 'selected' : null })))),
        check('showBranding', true, '„360 Marketing” jelölés a bannerben'))
    ]);
  }
  function check(k, def, label) {
    return h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: val(k, def), onchange: function () { set(k, this.checked); if (k === 'showReject' || k === 'preChecked') siteView(); } }), ' ' + label);
  }

  // Saját CSS és JS a banner dizájnjához
  function designCard() {
    var cssHelp = '#c360 .c360-dlg { border-radius: 4px; }\n#c360 .c360-title { font-family: Georgia, serif; }\n#c360 .c360-btn--primary { background: #e30613; border-color: #e30613; }';
    var jsHelp = "// Elérhető: root (a banner elem), config, api (C360Consent), on(esemény, fn)\non('render', function (e, root) {\n  if (e.view === 'notice') root.querySelector('.c360-title').insertAdjacentHTML('afterbegin', '🍪 ');\n});\non('decision', function (e) { console.log('döntés', e.state); });";
    return h('div', { class: 'card' }, h('h2', { text: 'Saját dizájn (CSS és JS)' }),
      h('p', { class: 'muted', text: 'A CSS a banner saját stílusai után töltődik be, így felülírhatja őket (a banner elemei: #c360, .c360-dlg, .c360-title, .c360-text, .c360-btn, .c360-btn--primary, .c360-cat, #c360-fab). A JS a banner felépítése után fut; az on(\'render\') minden megjelenítéskor, az on(\'decision\') döntéskor hívódik.' }),
      h('label', { class: 'block' }, 'CSS', h('textarea', { class: 'mono', rows: '8', spellcheck: 'false', value: val('customCss', ''), placeholder: cssHelp, oninput: function () { set('customCss', this.value); } })),
      h('label', { class: 'block' }, 'JavaScript', h('textarea', { class: 'mono', rows: '8', spellcheck: 'false', value: val('customJs', ''), placeholder: jsHelp, oninput: function () { set('customJs', this.value); } })),
      h('p', { class: 'alert', text: 'A JS minden látogató böngészőjében lefut ezen a domainen. Csak megbízható kódot írj ide, és mentés előtt nézd meg az Előnézetben.' }));
  }

  // Szkennelés: gyakoriság, lépték, eredmény
  function tabScan(body) {
    var st = site.scanSettings, sc = site.scan;
    var pr = Math.round((cfg.pingRate === undefined ? 0.02 : cfg.pingRate) * 1000) / 10;
    var runBtn = h('button', { class: 'btn primary', text: 'Szkennelés most', onclick: function () {
      runBtn.disabled = true; runBtn.textContent = 'Szkennelés folyamatban… (akár 1–2 perc)';
      api('scan', { host: site.host }).then(function (r) { site.scan = r.scan; toast('Szkennelés kész.'); siteView(); },
        function (e) { toast('Szkennelés sikertelen: ' + e.message, true); runBtn.disabled = false; runBtn.textContent = 'Szkennelés most'; });
    } });
    add(body, [
      h('div', { class: 'card' }, h('h2', { text: 'Ütemezett feltérképezés' }),
        h('p', { class: 'muted', text: 'A szerver végigmegy az oldal sitemapjában szereplő oldalakon és a GTM konténeren, és feltérképezi, milyen JS és süti fut. Az eredmény a bannerben és a többi fülön is megjelenik.' }),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: st.enabled, onchange: function () { st.enabled = this.checked; touch(); } }), ' Ütemezett szkennelés bekapcsolva'),
        h('div', { class: 'form2' },
          h('label', null, 'Gyakoriság', h('select', { onchange: function () { st.everyDays = +this.value; touch(); } },
            [[1, 'Naponta'], [3, '3 naponta'], [7, 'Hetente'], [14, 'Kéthetente'], [30, 'Havonta']].map(function (o) { return h('option', { value: String(o[0]), text: o[1], selected: st.everyDays === o[0] ? 'selected' : null }); }))),
          h('label', null, 'Lépték: átnézett oldalak száma (5–100)', h('input', { type: 'number', min: '5', max: '100', value: String(st.maxPages), oninput: function () { st.maxPages = Math.max(5, Math.min(100, +this.value || 20)); touch(); } })),
          h('label', null, 'Látogatói visszajelzés: a látogatások hány %-a jelezzen (0–100)', h('input', { type: 'number', min: '0', max: '100', step: '0.5', value: String(pr), oninput: function () { set('pingRate', Math.max(0, Math.min(100, +this.value || 0)) / 100); } }))),
        h('p', { class: 'muted small', text: 'A látogatói visszajelzés süti-neveket és felismert szolgáltatásokat küld (értéket és IP-címet nem). Alacsony forgalmú oldalon, ha 12 órája nem jött jelzés, átmenetileg 25%-ra emelkedik.' }),
        h('div', { class: 'row' }, runBtn, h('span', { class: 'muted', text: sc ? 'Utolsó: ' + fmtDate(sc.scannedAt) + (st.enabled ? ' · következő: kb. ' + fmtDate(new Date(Date.parse(sc.scannedAt) + st.everyDays * 864e5).toISOString()) : '') : 'Még nem volt szkennelés.' }))),
      sc ? h('div', { class: 'card' }, h('h2', { text: 'Eredmény' }),
        h('div', { class: 'stats' }, stat('Átnézett oldalak', sc.pages), stat('GTM konténer', (sc.gtm || []).join(', ') || 'nincs'), stat('Szolgáltatások', Object.keys(sc.services || {}).length), stat('Ismeretlen domainek', (sc.unknownHosts || []).length)),
        (sc.warnings || []).length ? h('ul', { class: 'warn' }, sc.warnings.map(function (w) { return h('li', { text: w }); })) : h('p', { text: '✓ Figyelmeztetés nincs.' }),
        h('table', { class: 'grid' }, h('thead', null, h('tr', null, ['Szolgáltatás', 'Kategória', 'Honnan töltődik'].map(function (x) { return h('th', { text: x }); }))),
          h('tbody', null, Object.keys(sc.services || {}).map(function (id) {
            var p = providers[id] || { name: id, cat: '' }, v = sc.services[id];
            return h('tr', null, h('td', { text: p.name }), h('td', { text: CATS[p.cat] || p.cat }), h('td', { text: (v.via || []).map(function (x) { return x === 'html' ? 'oldal kódja (' + v.pages + ' oldal)' : 'GTM'; }).join(' + ') }));
          }))),
        (sc.unknownHosts || []).length ? h('p', { class: 'muted', text: 'Ismeretlen külső domainek: ' + sc.unknownHosts.join(', ') }) : null) : null
    ]);
  }

  // GTM: tagek és consent-feltételek, automatikus szinkron
  var CONSENT_REQ = { necessary: [], preferences: ['personalization_storage'], statistics: ['analytics_storage'], marketing: ['ad_storage'] };
  function tabGtm(body) {
    var g = site.gtmSync || {}, st = g.settings || {}, snap = g.snapshot;
    var cats = allServices();
    add(body, h('div', { class: 'card' }, h('h2', { text: 'Automatikus consent a GTM-ben' }),
      h('p', { class: 'muted', text: 'Bekapcsolva a szinkron a GTM tageket a szolgáltatások besorolása szerint állítja be: a tag consent-feltételt kap (Statisztika → analytics_storage, Marketing → ad_storage, Személyre szabás → personalization_storage), a gtm_consent_update triggert, és oldalanként egyszer fut. A Google saját tagjei beépített consent-kezelést használnak, ezekhez nem nyúl.' }),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: st.enabled, onchange: function () { site.gtmSync.settings.enabled = this.checked; touch(); } }), ' Consent-feltételek automatikus beállítása a GTM-ben'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: st.autoPublish, onchange: function () { site.gtmSync.settings.autoPublish = this.checked; touch(); } }), ' A módosításokat automatikusan közzé is teszi (különben a GTM munkaterületen publikálásra várnak)'),
      h('p', { class: 'muted small', text: 'A szinkront a 360 gépén futó eszköz végzi a Google-fiók jogosultságával (tools/gtm-sync.mjs). Az eredménye alább jelenik meg.' })));
    add(body, h('div', { class: 'card' }, h('h2', { text: 'Mérés elutasításkor (Consent Mode advanced)' }),
      h('p', { class: 'muted', text: 'A Google tagek (GA4, Google tag, Ads) hozzájárulás nélkül is lefutnak, de sütit nem tesznek: névtelen, süti nélküli jeleket küldenek, amiből a Google modellezi a látogatásokat és konverziókat. Ehhez a Google tagekre nem szabad külön consent-feltételt tenni (a szinkron ezt így hagyja).' }),
      check('urlPassthrough', false, 'url_passthrough: a hirdetési kattintás és a mérési azonosító az oldalak közti linkekben megy tovább (_gl=… paraméter), így elutasításkor is követhető a látogatás útja'),
      check('adsRedaction', true, 'ads_data_redaction: elutasításkor a hirdetési adatok kitakarása'),
      h('p', { class: 'muted small', text: 'Ez a két beállítás a GTM „360 Consent – Init” tagjébe kerül a szinkronnal (a Consent Initialization előtt kell érvényesülnie).' })));
    var sc = site.scan || {};
    if (snap) {
      add(body, h('div', { class: 'card flush' }, h('div', { class: 'pad' }, h('h2', { text: 'GTM tagek – ' + snap.container + ' (élő: v' + snap.liveVersion + ')' }),
        h('p', { class: 'muted', text: 'Utolsó szinkron: ' + fmtDate(snap.syncedAt) + (snap.pending ? ' · ⚠ módosítások publikálásra várnak a GTM-ben' : '') + (snap.changes ? ' · ' + snap.changes + ' módosítás' : '') })),
        h('table', { class: 'grid' }, h('thead', null, h('tr', null, ['Tag', 'Típus', 'Szolgáltatás', 'Kategória', 'Consent-feltétel', 'Állapot'].map(function (x) { return h('th', { text: x }); }))),
          h('tbody', null, snap.tags.map(function (t) {
            var cat = t.service && cats[t.service] ? cats[t.service].cat : t.cat;
            return h('tr', { class: t.paused ? 'faded' : '' }, h('td', null, h('strong', { text: t.name }), h('div', { class: 'muted small', text: '#' + t.id })),
              h('td', { class: 'small', text: t.type }), h('td', { text: t.service ? (providers[t.service] || {}).name || t.service : '–' }),
              h('td', { text: cat ? CATS[cat] : '–' }), h('td', { class: 'small', text: t.consent && t.consent.length ? t.consent.join(', ') : (t.builtin ? 'beépített (Google)' : 'nincs') }),
              h('td', null, h('span', { class: 'badge ' + (t.status === 'ok' ? 'ok' : t.status === 'fixed' ? 'warn' : t.status === 'missing' ? 'bad' : 'off'), text: { ok: 'Rendben', fixed: 'Javítva', missing: 'Hiányzik', skip: 'Nem kell', paused: 'Szünetel' }[t.status] || t.status })));
          })))));
    } else if (sc.gtmTags) {
      add(body, h('div', { class: 'card' }, h('h2', { text: 'GTM tagek a nyilvános konténerből' }),
        h('p', { class: 'muted', text: 'Még nem futott szinkron; ezek a szkennelésből származnak (tag-nevek nélkül).' }),
        h('table', { class: 'grid' }, h('tbody', null, sc.gtmTags.map(function (t) {
          return h('tr', null, h('td', { text: '#' + t.id + ' ' + t.type }), h('td', { text: t.service ? (providers[t.service] || {}).name : '–' }), h('td', { class: 'small', text: (t.consent || []).join(', ') || (t.google ? 'beépített (Google)' : '–') }));
        })))));
    } else add(body, h('div', { class: 'card empty', text: 'Még nincs GTM-adat. Futtass szkennelést vagy szinkront.' }));
  }

  // 3. Nyelv és szöveg
  function langPicker(onchange) {
    return h('select', { class: 'langpick', onchange: function () { editLang = this.value; onchange(); } },
      LANGS.map(function (l) { return h('option', { value: l, text: LANG_NAMES[l], selected: l === editLang ? 'selected' : null }); }));
  }
  function tabLang(body) {
    var auto = !cfg.forceLang;
    var langs = cfg.languages && cfg.languages.length ? cfg.languages : LANGS.slice();
    var tx = cfg.texts[editLang] || {};
    var def = defaults[editLang] || {};
    add(body, [
      h('div', { class: 'card' }, h('h2', { text: 'Nyelv' }),
        h('label', { class: 'check' }, h('input', { type: 'radio', name: 'lm', checked: auto, onchange: function () { delete cfg.forceLang; touch(); siteView(); } }),
          ' Automatikus: az oldal nyelve (<html lang>), ennek hiányában a böngésző nyelve'),
        h('label', { class: 'check' }, h('input', { type: 'radio', name: 'lm', checked: !auto, onchange: function () { set('forceLang', 'hu'); siteView(); } }), ' Rögzített nyelv: ',
          h('select', { disabled: auto, onchange: function () { set('forceLang', this.value); } }, LANGS.map(function (l) { return h('option', { value: l, text: LANG_NAMES[l], selected: cfg.forceLang === l ? 'selected' : null }); }))),
        check('langSwitcher', true, 'Nyelvválasztó a bannerben (a látogató átválthat)'),
        h('p', { class: 'muted', text: 'Felkínált nyelvek:' }),
        h('div', { class: 'chips' }, LANGS.map(function (l) {
          return h('label', { class: 'chip' }, h('input', { type: 'checkbox', checked: langs.indexOf(l) !== -1, onchange: function () {
            var cur = cfg.languages && cfg.languages.length ? cfg.languages.slice() : LANGS.slice();
            if (this.checked) { if (cur.indexOf(l) === -1) cur.push(l); } else cur = cur.filter(function (x) { return x !== l; });
            if (!cur.length) { this.checked = true; toast('Legalább egy nyelv kell.', true); return; }
            set('languages', cur.length === LANGS.length ? [] : LANGS.filter(function (x) { return cur.indexOf(x) !== -1; }));
          } }), ' ' + LANG_NAMES[l]);
        }))),
      h('div', { class: 'card' },
        h('div', { class: 'row between' }, h('h2', { text: 'Szövegek' }), langPicker(siteView)),
        h('p', { class: 'muted', text: 'Üresen hagyva az alapszöveg jelenik meg (szürkén látod). A tájékoztató linkje a szöveg végére kerül.' }),
        Object.keys(TEXT_KEYS).map(function (k) {
          var multi = k === 'text';
          var input = h(multi ? 'textarea' : 'input', { rows: multi ? '5' : null, value: tx[k] || '', placeholder: def[k] || '', oninput: function () {
            cfg.texts[editLang] = cfg.texts[editLang] || {};
            if (this.value.trim()) cfg.texts[editLang][k] = this.value; else delete cfg.texts[editLang][k];
            touch();
          } });
          return h('label', { class: 'block' }, TEXT_KEYS[k], input);
        }))
    ]);
  }

  // Összes szolgáltatás: felismert + admin által felvett, a végleges kategóriával.
  function allServices() {
    var out = {}, det = site.detected && site.detected.services || {}, id;
    for (id in det) if (providers[id]) out[id] = { id: id, p: providers[id], det: det[id] };
    var ss = site.scan && site.scan.services || {};
    (Array.isArray(ss) ? ss.map(function (x) { return x.id; }) : Object.keys(ss)).forEach(function (sid) { if (providers[sid] && !out[sid]) out[sid] = { id: sid, p: providers[sid], scan: true }; });
    cfg.services.forEach(function (a) { out[a.id] = out[a.id] || { id: a.id, p: providers[a.id] || null }; out[a.id].o = a; });
    Object.keys(out).forEach(function (k) {
      var s = out[k];
      s.cat = s.o && s.o.cat || s.p && s.p.cat || 'necessary';
      s.name = s.o && s.o.name ? (typeof s.o.name === 'object' ? s.o.name.hu || s.o.name.en : s.o.name) : s.p ? s.p.name : k;
      s.hidden = !!(s.o && s.o.hidden);
    });
    return out;
  }
  function override(id) {
    var o = cfg.services.filter(function (x) { return x.id === id; })[0];
    if (!o) { o = { id: id }; cfg.services.push(o); }
    return o;
  }

  // 4. Kategóriák
  function tabCats(body) {
    var svcs = allServices();
    add(body, h('div', { class: 'card' }, h('h2', { text: 'Megjelenítés' }),
      check('hideEmpty', true, 'Csak az a kategória jelenjen meg, amelyikben van felismert szolgáltatás'),
      check('preChecked', false, 'Minden kapcsoló alapból bekapcsolva (a látogató első megnyitásakor)'),
      val('preChecked', false) ? h('p', { class: 'alert', text: 'Figyelem: az EU Bíróság (C-673/17, Planet49) szerint az előre bejelölt hozzájárulás érvénytelen. Ha a látogató a bekapcsolt állapotot menti, a hozzájárulás jogilag vitatható.' }) : null));
    add(body, [h('div', { class: 'row between' }, h('p', { class: 'muted', text: 'Minden kategória egy Consent Mode jóváhagyásnak felel meg. A leírás a bannerben a kategória alatt jelenik meg.' }), langPicker(siteView))]);
    Object.keys(CATS).forEach(function (k) {
      var c = cfg.categories[k] || {}, en = k === 'necessary' || c.enabled !== false;
      var list = Object.keys(svcs).filter(function (id) { return svcs[id].cat === k && !svcs[id].hidden; });
      add(body, h('div', { class: 'card' + (en ? '' : ' faded') },
        h('div', { class: 'row between' }, h('h2', null, CATS[k], h('small', { class: 'muted', text: '  ' + CONSENT[k] })),
          k === 'necessary' ? h('span', { class: 'badge ok', text: 'Mindig aktív' }) :
            h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: en, onchange: function () {
              cfg.categories[k] = cfg.categories[k] || {};
              cfg.categories[k].enabled = this.checked; touch(); siteView();
            } }), ' Megjelenik a bannerben')),
        en ? null : h('p', { class: 'muted', text: 'Kikapcsolva: a kategória nem jelenik meg, és mindig elutasítottnak számít.' }),
        h('label', { class: 'block' }, 'Leírás (' + LANG_NAMES[editLang] + ')', h('textarea', { rows: '3', value: (c.desc || {})[editLang] || '', placeholder: (defaults[editLang] || {})['desc_' + k] || '', oninput: function () {
          cfg.categories[k] = cfg.categories[k] || {};
          cfg.categories[k].desc = cfg.categories[k].desc || {};
          if (this.value.trim()) cfg.categories[k].desc[editLang] = this.value; else delete cfg.categories[k].desc[editLang];
          touch();
        } })),
        h('p', { class: 'muted', text: 'Ide tartozik:' }),
        list.length ? h('div', { class: 'chips' }, list.map(function (id) { return h('span', { class: 'chip ro', text: svcs[id].name }); })) : h('p', { class: 'muted', text: 'Nincs ide sorolt szolgáltatás.' })));
    });
  }

  // 5. Szolgáltatások és sütik
  function tabSvcs(body) {
    var svcs = allServices();
    var ids = Object.keys(svcs).sort(function (a, b) { return Object.keys(CATS).indexOf(svcs[a].cat) - Object.keys(CATS).indexOf(svcs[b].cat) || (svcs[a].name > svcs[b].name ? 1 : -1); });
    add(body, h('p', { class: 'alert info', text: 'A kategória átsorolása a bannerben megjelenő besorolást módosítja. A tényleges betöltést a GTM tag consent-feltétele szabja meg, ezért a GTM-ben is ennek megfelelően állítsd be (pl. marketing → ad_storage).' }));
    add(body, h('div', { class: 'card flush' }, h('table', { class: 'grid' },
      h('thead', null, h('tr', null, ['Szolgáltatás', 'Honnan ismertük fel', 'Kategória', 'Látszik', ''].map(function (x) { return h('th', { text: x }); }))),
      h('tbody', null, ids.map(function (id) {
        var s = svcs[id], det = s.det;
        var cell = h('td', { colspan: '5' }), detail = h('tr', { class: 'detail', hidden: true }, cell);
        var catSel = h('select', { onchange: function () {
          var o = override(id);
          if (s.p && this.value === s.p.cat) delete o.cat; else o.cat = this.value;
          touch(); siteView();
        } }, Object.keys(CATS).map(function (k) { return h('option', { value: k, text: CATS[k], selected: s.cat === k ? 'selected' : null }); }));
        var changed = s.p && s.cat !== s.p.cat;
        return [h('tr', { class: s.hidden ? 'faded' : '' },
          h('td', null, h('strong', { text: s.name }), h('div', { class: 'muted small', text: id + (s.p ? '' : ' · kézzel felvett') })),
          h('td', { class: 'small', text: det ? det.via.join(', ') + ' · ' + ago(det.lastSeen) : s.scan ? 'teljes szkennelés' : s.p ? 'kézzel' : 'kézzel felvett' }),
          h('td', null, catSel, changed ? h('div', { class: 'small warntext', text: 'Alapból: ' + CATS[s.p.cat] + ' – a GTM-ben is állítsd át!' }) : null),
          h('td', null, h('input', { type: 'checkbox', checked: !s.hidden, 'aria-label': 'Látszik a bannerben', onchange: function () {
            var o = override(id); if (this.checked) delete o.hidden; else o.hidden = true; touch(); siteView();
          } })),
          h('td', null, h('button', { class: 'btn small', text: 'Leírás, sütik', onclick: function () {
            if (!cell.firstChild) add(cell, svcDetail(s));
            detail.hidden = !detail.hidden;
          } }))), detail];
      })))));
    add(body, unknownCookies());
  }

  function svcDetail(s) {
    var o = override(s.id), wrap = h('div', { class: 'svcdetail' });
    var pdesc = s.p && s.p.desc || {};
    add(wrap, h('div', { class: 'form2' }, ['hu', 'en'].map(function (l) {
      return h('label', { class: 'block' }, 'Leírás (' + LANG_NAMES[l] + ')', h('textarea', { rows: '3', value: (o.desc || {})[l] || '', placeholder: pdesc[l] || '', oninput: function () {
        o.desc = o.desc || {}; if (this.value.trim()) o.desc[l] = this.value; else delete o.desc[l]; touch();
      } }));
    })));
    var cookies = o.cookies && o.cookies.length ? o.cookies : s.p ? s.p.cookies || [] : [];
    add(wrap, h('p', { class: 'muted', text: 'Sütik:' }));
    add(wrap, cookies.length ? h('table', { class: 'grid small' }, h('tbody', null, cookies.map(function (c) {
      return h('tr', null, h('td', null, h('code', { text: c[0] })), h('td', { text: dur(c[1]) }));
    }))) : h('p', { class: 'muted', text: 'Nincs ismert sütije.' }));
    if (!s.p) add(wrap, h('button', { class: 'btn small danger', text: 'Szolgáltatás törlése', onclick: function () {
      cfg.services = cfg.services.filter(function (x) { return x.id !== s.id; }); touch(); siteView();
    } }));
    return wrap;
  }

  // Ismeretlen sütik: a popup által talált, egyik szolgáltatáshoz sem illő süti-nevek.
  function unknownCookies() {
    var det = site.detected && site.detected.cookies || {};
    var assigned = {};
    cfg.services.forEach(function (s) { (s.cookies || []).forEach(function (c) { assigned[c[0]] = s.id; }); });
    var names = Object.keys(det).filter(function (n) { return !assigned[n]; }).sort();
    var card = h('div', { class: 'card' }, h('h2', { text: 'Ismeretlen sütik (' + names.length + ')' }),
      h('p', { class: 'muted', text: 'A popup ezeket a süti-neveket találta az oldalon, de egyik ismert szolgáltatáshoz sem tartoznak. Sorold be őket, és a bannerben „A weboldal saját sütijei” alatt jelennek meg.' }));
    if (!names.length) { add(card, h('p', { text: 'Nincs besorolatlan süti.' })); return card; }
    add(card, h('table', { class: 'grid' },
      h('thead', null, h('tr', null, ['Süti', 'Láttuk', 'Kategória', 'Élettartam', 'Leírás (magyar)', ''].map(function (x) { return h('th', { text: x }); }))),
      h('tbody', null, names.map(function (n) {
        var cat = h('select', null, Object.keys(CATS).map(function (k) { return h('option', { value: k, text: CATS[k], selected: k === 'necessary' ? 'selected' : null }); }));
        var num = h('input', { type: 'number', min: '1', value: '1', class: 'narrow' });
        var unit = h('select', null, ['s', 'min', 'h', 'd', 'mo', 'y'].map(function (u) { return h('option', { value: u, text: DUR[u], selected: u === 'y' ? 'selected' : null }); }));
        var desc = h('input', { placeholder: 'Mire való?' });
        return h('tr', null, h('td', null, h('code', { text: n })), h('td', { class: 'small', text: det[n].count + '× · ' + ago(det[n].lastSeen) }),
          h('td', null, cat), h('td', null, num, ' ', unit), h('td', null, desc),
          h('td', null, h('button', { class: 'btn small primary', text: 'Besorolás', onclick: function () {
            var id = 'own-' + cat.value, o = override(id);
            o.cat = cat.value;
            o.name = o.name || { hu: 'A weboldal saját sütijei', en: 'Website’s own cookies' };
            o.cookies = o.cookies || [];
            var row = [n, unit.value === 's' ? 's' : Math.max(1, +num.value || 1) + unit.value];
            if (desc.value.trim()) row.push({ hu: desc.value.trim() });
            o.cookies.push(row);
            touch(); siteView();
          } })));
      }))));
    return card;
  }

  // Előnézet: a popup az aktuális (mentetlen) beállításokkal, elszigetelt iframe-ben.
  function preview() {
    var svcs = allServices(), list = [];
    Object.keys(svcs).forEach(function (id) {
      var s = svcs[id], o = s.o || {};
      if (s.hidden) return;
      list.push({ id: id, name: o.name || (s.p ? s.p.name : id), cat: s.cat, cookies: o.cookies && o.cookies.length ? o.cookies : s.p ? s.p.cookies : [], desc: o.desc && Object.keys(o.desc).length ? o.desc : s.p ? s.p.desc : null });
    });
    var c = JSON.parse(JSON.stringify(cfg));
    c.services = list; c.api = ''; c.siteData = false; c.scanGtm = false; c.pingRate = 0;
    if (!c.policyUrl) c.policyUrl = '#';
    var lang = c.forceLang || editLang;
    var src = '<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font:16px system-ui;background:#eef1f4;color:#334}main{max-width:900px;margin:0 auto;padding:40px 20px}.b{height:14px;background:#d9dfe5;border-radius:4px;margin:12px 0}</style></head><body><main><h1>' +
      site.host.replace(/[<>&]/g, '') + ' – előnézet</h1>' + new Array(14).join('<div class="b"></div>') + '</main>' +
      '<script>window.C360_CONFIG=' + JSON.stringify(c).replace(/</g, '\\u003c') + ';</' + 'script><script src="' + location.origin + '/c360/c360-consent.js?v=' + Date.now() + '"></' + 'script></body></html>';
    var frame = h('iframe', { sandbox: 'allow-scripts', title: 'Előnézet', class: 'pframe' });
    frame.srcdoc = src;
    var size = h('select', { onchange: function () { frame.style.width = this.value; } },
      h('option', { value: '100%', text: 'Asztali' }), h('option', { value: '768px', text: 'Tablet' }), h('option', { value: '390px', text: 'Mobil' }));
    var dlg = h('div', { class: 'modal', role: 'dialog', 'aria-label': 'Előnézet' },
      h('div', { class: 'modalbox wide' }, h('div', { class: 'row between' }, h('h2', { text: 'Előnézet (' + LANG_NAMES[lang] + ')' }),
        h('div', null, size, ' ', h('button', { class: 'btn', text: 'Bezárás', onclick: function () { dlg.remove(); } }))), frame));
    document.body.appendChild(dlg);
  }

  function passwordDialog() {
    var o = h('input', { type: 'password', autocomplete: 'current-password' }), n = h('input', { type: 'password', autocomplete: 'new-password', minlength: '12' });
    var dlg = h('div', { class: 'modal', role: 'dialog', 'aria-label': 'Jelszócsere' }, h('form', { class: 'modalbox', onsubmit: function (e) {
      e.preventDefault();
      api('password', { old: o.value, new: n.value }).then(function () { dlg.remove(); toast('Jelszó megváltoztatva.'); }, function (err) { toast(err.message, true); });
    } }, h('h2', { text: 'Jelszócsere' }), h('label', { class: 'block' }, 'Jelenlegi jelszó', o), h('label', { class: 'block' }, 'Új jelszó (min. 12 karakter)', n),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', text: 'Mentés' }), h('button', { type: 'button', class: 'btn', text: 'Mégse', onclick: function () { dlg.remove(); } }))));
    document.body.appendChild(dlg);
    o.focus();
  }

  Promise.all([
    fetch('../providers.json').then(function (r) { return r.json(); }),
    fetch('defaults.json').then(function (r) { return r.json(); })
  ]).then(function (r) {
    r[0].forEach(function (p) { providers[p.id] = p; });
    defaults = r[1];
    route();
  }, function () { toast('Az alapadatok nem tölthetők be.', true); route(); });
})();
