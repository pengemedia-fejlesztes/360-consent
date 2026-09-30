/*!
 * 360 Marketing – Google Consent Mode v2 süti popup
 * Verzió: 1.0.0 (2026-09-30)
 * Forrás: https://github.com/pengemedia-fejlesztes/360-consent
 * https://360-marketing.hu
 *
 * CDN-ről betöltött szkript (jsDelivr). Beállítás: window.C360_CONFIG a GTM betöltő tagben.
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
    policyUrl: '',                  // adatkezelési tájékoztató URL; üresen a link nem jelenik meg
    cookieName: 'c360_consent',     // a GTM Init template is ezt olvassa – csak együtt módosítsd
    cookieDays: 365,
    cookieDomain: '',               // pl. '.domain.hu', ha aldomainek között is közös legyen
    defaultLang: 'en',
    forceLang: '',                  // pl. 'hu' – üresen a <html lang> / böngésző nyelve dönt
    position: 'left',               // a süti beállítás gomb helye: 'left' | 'right'
    brandColor: '#287FAA',
    brandUrl: 'https://360-marketing.hu/',
    showBranding: true
  };
  var UC = w.C360_CONFIG || {};
  for (var ck in UC) if (Object.prototype.hasOwnProperty.call(UC, ck) && UC[ck] !== undefined && UC[ck] !== null) CONFIG[ck] = UC[ck];

  var I18N = {
    hu: {
      title: 'Ez a weboldal sütiket használ',
      text: 'Az oldal működéséhez bizonyos sütik elengedhetetlenek. Az Ön hozzájárulásával statisztikai, marketingmérési és hirdetési célú sütiket is használunk – ezek csak akkor töltődnek be, ha engedélyezi őket. Döntését bármikor módosíthatja a sarokban lévő süti ikonra kattintva.',
      policy: 'Adatkezelési tájékoztató',
      necessary: 'Elengedhetetlen', preferences: 'Személyre szabás', statistics: 'Statisztika', marketing: 'Marketing',
      alwaysOn: 'Mindig aktív', customize: 'Testreszabás', save: 'Választás mentése',
      rejectAll: 'Összes elutasítása', acceptAll: 'Összes elfogadása', settings: 'Süti beállítások'
    },
    en: {
      title: 'This website uses cookies',
      text: 'Some cookies are essential for the website to work. With your permission, we also use cookies for statistics, marketing measurement and advertising – these only load if you allow them. You can change your choice at any time via the cookie icon in the corner.',
      policy: 'Privacy Policy',
      necessary: 'Necessary', preferences: 'Preferences', statistics: 'Statistics', marketing: 'Marketing',
      alwaysOn: 'Always on', customize: 'Customize', save: 'Save choices',
      rejectAll: 'Reject all', acceptAll: 'Accept all', settings: 'Cookie settings'
    },
    de: {
      title: 'Diese Website verwendet Cookies',
      text: 'Einige Cookies sind für den Betrieb der Website unerlässlich. Mit Ihrer Zustimmung verwenden wir außerdem Cookies für Statistik, Marketingmessung und Werbung – diese werden nur geladen, wenn Sie sie erlauben. Sie können Ihre Auswahl jederzeit über das Cookie-Symbol in der Ecke ändern.',
      policy: 'Datenschutzerklärung',
      necessary: 'Notwendig', preferences: 'Personalisierung', statistics: 'Statistik', marketing: 'Marketing',
      alwaysOn: 'Immer aktiv', customize: 'Anpassen', save: 'Auswahl speichern',
      rejectAll: 'Alle ablehnen', acceptAll: 'Alle akzeptieren', settings: 'Cookie-Einstellungen'
    },
    es: {
      title: 'Este sitio web utiliza cookies',
      text: 'Algunas cookies son imprescindibles para el funcionamiento del sitio. Con su consentimiento, también utilizamos cookies de estadística, medición de marketing y publicidad, que solo se cargan si usted las permite. Puede cambiar su elección en cualquier momento desde el icono de cookie de la esquina.',
      policy: 'Política de privacidad',
      necessary: 'Necesarias', preferences: 'Personalización', statistics: 'Estadísticas', marketing: 'Marketing',
      alwaysOn: 'Siempre activas', customize: 'Personalizar', save: 'Guardar selección',
      rejectAll: 'Rechazar todo', acceptAll: 'Aceptar todo', settings: 'Configuración de cookies'
    },
    fr: {
      title: 'Ce site utilise des cookies',
      text: 'Certains cookies sont indispensables au fonctionnement du site. Avec votre accord, nous utilisons également des cookies de statistiques, de mesure marketing et de publicité ; ils ne sont chargés que si vous les autorisez. Vous pouvez modifier votre choix à tout moment via l’icône cookie dans le coin.',
      policy: 'Politique de confidentialité',
      necessary: 'Nécessaires', preferences: 'Personnalisation', statistics: 'Statistiques', marketing: 'Marketing',
      alwaysOn: 'Toujours actifs', customize: 'Personnaliser', save: 'Enregistrer mes choix',
      rejectAll: 'Tout refuser', acceptAll: 'Tout accepter', settings: 'Paramètres des cookies'
    },
    it: {
      title: 'Questo sito utilizza i cookie',
      text: 'Alcuni cookie sono indispensabili per il funzionamento del sito. Con il tuo consenso utilizziamo anche cookie statistici, di misurazione marketing e pubblicitari, che vengono caricati solo se li autorizzi. Puoi modificare la tua scelta in qualsiasi momento tramite l’icona dei cookie nell’angolo.',
      policy: 'Informativa sulla privacy',
      necessary: 'Necessari', preferences: 'Personalizzazione', statistics: 'Statistiche', marketing: 'Marketing',
      alwaysOn: 'Sempre attivi', customize: 'Personalizza', save: 'Salva preferenze',
      rejectAll: 'Rifiuta tutto', acceptAll: 'Accetta tutto', settings: 'Impostazioni cookie'
    },
    pt: {
      title: 'Este site utiliza cookies',
      text: 'Alguns cookies são essenciais para o funcionamento do site. Com o seu consentimento, utilizamos também cookies de estatística, medição de marketing e publicidade, que só são carregados se os permitir. Pode alterar a sua escolha a qualquer momento através do ícone de cookie no canto.',
      policy: 'Política de privacidade',
      necessary: 'Necessários', preferences: 'Personalização', statistics: 'Estatísticas', marketing: 'Marketing',
      alwaysOn: 'Sempre ativos', customize: 'Personalizar', save: 'Guardar preferências',
      rejectAll: 'Rejeitar tudo', acceptAll: 'Aceitar tudo', settings: 'Definições de cookies'
    },
    ro: {
      title: 'Acest site folosește cookie-uri',
      text: 'Unele cookie-uri sunt esențiale pentru funcționarea site-ului. Cu acordul dumneavoastră, folosim și cookie-uri pentru statistici, măsurarea marketingului și publicitate – acestea se încarcă doar dacă le permiteți. Vă puteți modifica alegerea oricând, din pictograma cookie din colț.',
      policy: 'Politica de confidențialitate',
      necessary: 'Necesare', preferences: 'Personalizare', statistics: 'Statistici', marketing: 'Marketing',
      alwaysOn: 'Întotdeauna active', customize: 'Configurează', save: 'Salvează preferințele',
      rejectAll: 'Respinge toate', acceptAll: 'Acceptă toate', settings: 'Setări cookie-uri'
    },
    sk: {
      title: 'Táto webová stránka používa súbory cookie',
      text: 'Niektoré súbory cookie sú nevyhnutné na fungovanie stránky. S vaším súhlasom používame aj súbory cookie na štatistiku, meranie marketingu a reklamu – načítajú sa iba vtedy, ak ich povolíte. Svoju voľbu môžete kedykoľvek zmeniť pomocou ikony cookie v rohu.',
      policy: 'Zásady ochrany osobných údajov',
      necessary: 'Nevyhnutné', preferences: 'Personalizácia', statistics: 'Štatistika', marketing: 'Marketing',
      alwaysOn: 'Vždy aktívne', customize: 'Prispôsobiť', save: 'Uložiť výber',
      rejectAll: 'Odmietnuť všetko', acceptAll: 'Prijať všetko', settings: 'Nastavenia cookies'
    },
    bg: {
      title: 'Този уебсайт използва бисквитки',
      text: 'Някои бисквитки са необходими за работата на сайта. С вашето съгласие използваме и бисквитки за статистика, маркетингово измерване и реклама – те се зареждат само ако ги разрешите. Можете да промените избора си по всяко време чрез иконата с бисквитка в ъгъла.',
      policy: 'Политика за поверителност',
      necessary: 'Необходими', preferences: 'Персонализация', statistics: 'Статистика', marketing: 'Маркетинг',
      alwaysOn: 'Винаги активни', customize: 'Настройки', save: 'Запазване на избора',
      rejectAll: 'Отхвърляне на всички', acceptAll: 'Приемане на всички', settings: 'Настройки за бисквитки'
    },
    hr: {
      title: 'Ova web stranica koristi kolačiće',
      text: 'Neki kolačići nužni su za rad stranice. Uz vašu privolu koristimo i kolačiće za statistiku, mjerenje marketinga i oglašavanje – učitavaju se samo ako ih dopustite. Svoj odabir možete promijeniti u bilo kojem trenutku putem ikone kolačića u kutu.',
      policy: 'Pravila privatnosti',
      necessary: 'Nužni', preferences: 'Personalizacija', statistics: 'Statistika', marketing: 'Marketing',
      alwaysOn: 'Uvijek aktivni', customize: 'Prilagodi', save: 'Spremi odabir',
      rejectAll: 'Odbij sve', acceptAll: 'Prihvati sve', settings: 'Postavke kolačića'
    },
    cs: {
      title: 'Tento web používá soubory cookie',
      text: 'Některé soubory cookie jsou nezbytné pro fungování webu. S vaším souhlasem používáme také soubory cookie pro statistiku, měření marketingu a reklamu – načtou se pouze tehdy, pokud je povolíte. Svou volbu můžete kdykoli změnit pomocí ikony cookie v rohu.',
      policy: 'Zásady ochrany osobních údajů',
      necessary: 'Nezbytné', preferences: 'Personalizace', statistics: 'Statistika', marketing: 'Marketing',
      alwaysOn: 'Vždy aktivní', customize: 'Přizpůsobit', save: 'Uložit výběr',
      rejectAll: 'Odmítnout vše', acceptAll: 'Přijmout vše', settings: 'Nastavení cookies'
    },
    pl: {
      title: 'Ta strona korzysta z plików cookie',
      text: 'Niektóre pliki cookie są niezbędne do działania strony. Za Twoją zgodą używamy również plików cookie do statystyk, pomiaru marketingu i reklamy – ładują się one tylko wtedy, gdy na to pozwolisz. Swój wybór możesz zmienić w dowolnym momencie za pomocą ikony cookie w rogu.',
      policy: 'Polityka prywatności',
      necessary: 'Niezbędne', preferences: 'Personalizacja', statistics: 'Statystyka', marketing: 'Marketing',
      alwaysOn: 'Zawsze aktywne', customize: 'Dostosuj', save: 'Zapisz wybór',
      rejectAll: 'Odrzuć wszystkie', acceptAll: 'Akceptuj wszystkie', settings: 'Ustawienia cookie'
    },
    ja: {
      title: 'このウェブサイトはCookieを使用しています',
      text: 'サイトの運営に不可欠なCookieがあります。お客様の同意がある場合に限り、統計、マーケティング測定、広告のためのCookieも使用します。これらは許可された場合にのみ読み込まれます。選択内容は画面隅のCookieアイコンからいつでも変更できます。',
      policy: 'プライバシーポリシー',
      necessary: '必須', preferences: 'パーソナライズ', statistics: '統計', marketing: 'マーケティング',
      alwaysOn: '常に有効', customize: 'カスタマイズ', save: '選択を保存',
      rejectAll: 'すべて拒否', acceptAll: 'すべて同意', settings: 'Cookie設定'
    }
  };

  var CATS = ['necessary', 'preferences', 'statistics', 'marketing'];

  w.dataLayer = w.dataLayer || [];
  function gtag() { w.dataLayer.push(arguments); }

  function pickLang() {
    var cands = [CONFIG.forceLang, d.documentElement.lang, (navigator.languages || [])[0], navigator.language];
    for (var i = 0; i < cands.length; i++) {
      var l = String(cands[i] || '').slice(0, 2).toLowerCase();
      if (I18N[l]) return l;
    }
    return CONFIG.defaultLang;
  }
  var lang = pickLang();
  var T = I18N[lang];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // --- tárolás ---
  function readState() {
    var m = d.cookie.match(new RegExp('(?:^|; )' + CONFIG.cookieName + '=([^;]*)'));
    if (!m) return null;
    var p = decodeURIComponent(m[1]).split('.');
    if (p.length !== 4 || p[0] !== 'v1') return null;
    return { necessary: true, preferences: p[1] === '1', statistics: p[2] === '1', marketing: p[3] === '1' };
  }
  function writeState(s) {
    var v = ['v1', s.preferences ? 1 : 0, s.statistics ? 1 : 0, s.marketing ? 1 : 0].join('.');
    var exp = new Date(Date.now() + CONFIG.cookieDays * 864e5).toUTCString();
    d.cookie = CONFIG.cookieName + '=' + v + '; expires=' + exp + '; path=/; SameSite=Lax' +
      (CONFIG.cookieDomain ? '; domain=' + CONFIG.cookieDomain : '') +
      (location.protocol === 'https:' ? '; Secure' : '');
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

  // --- UI ---
  var C = CONFIG.brandColor;
  var side = CONFIG.position === 'right' ? 'right' : 'left';
  var css =
    '#c360,#c360 *{box-sizing:border-box;margin:0;padding:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.5;letter-spacing:normal;text-transform:none}' +
    '#c360[hidden],#c360 [hidden]{display:none!important}' +
    '#c360{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,32,.45)}' +
    '#c360 .c360-dlg{width:100%;max-width:540px;max-height:calc(100vh - 32px);overflow:auto;background:#fff;color:#1f2a33;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.25);padding:24px;animation:c360in .25s ease-out}' +
    '@keyframes c360in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}' +
    '#c360 .c360-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:10px}' +
    '#c360 .c360-title{font-size:18px;font-weight:700;color:#1f2a33}' +
    '#c360 .c360-brand{flex:none;display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:' + C + ';font-size:12px;font-weight:700;opacity:.9}' +
    '#c360 .c360-brand svg{width:22px;height:22px}' +
    '#c360 .c360-text{font-size:14px;color:#46535e}' +
    '#c360 .c360-policy{display:inline-block;margin-top:8px;font-size:14px;font-weight:600;color:' + C + ';text-decoration:underline}' +
    '#c360 .c360-cats{margin-top:16px;border-top:1px solid #e6eaee}' +
    '#c360 .c360-cat{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid #e6eaee;font-size:15px;font-weight:600;color:#1f2a33;cursor:pointer}' +
    '#c360 .c360-cat small{font-size:12px;font-weight:600;color:' + C + '}' +
    '#c360 .c360-sw{position:relative;flex:none;width:42px;height:24px}' +
    '#c360 .c360-sw input{position:absolute;opacity:0;width:100%;height:100%;cursor:pointer;z-index:1}' +
    '#c360 .c360-sw span{position:absolute;inset:0;border-radius:24px;background:#c5cdd4;transition:background .2s}' +
    '#c360 .c360-sw span:after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.25)}' +
    '#c360 .c360-sw input:checked+span{background:' + C + '}' +
    '#c360 .c360-sw input:checked+span:after{transform:translateX(18px)}' +
    '#c360 .c360-sw input:focus-visible+span{outline:2px solid ' + C + ';outline-offset:2px}' +
    '#c360 .c360-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px}' +
    '#c360 .c360-btn{flex:1 1 140px;min-height:44px;padding:10px 14px;border-radius:8px;border:2px solid ' + C + ';background:#fff;color:' + C + ';font-size:14px;font-weight:700;cursor:pointer;transition:filter .15s}' +
    '#c360 .c360-btn:hover{filter:brightness(.93)}' +
    '#c360 .c360-btn:focus-visible{outline:2px solid #1f2a33;outline-offset:2px}' +
    '#c360 .c360-btn--primary{background:' + C + ';color:#fff}' +
    '#c360-fab{position:fixed;bottom:16px;' + side + ':16px;z-index:2147482999;width:44px;height:44px;border-radius:50%;border:0;background:' + C + ';color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.2);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}' +
    '#c360-fab[hidden]{display:none}' +
    '#c360-fab svg{width:24px;height:24px}' +
    '#c360-fab:focus-visible{outline:2px solid #1f2a33;outline-offset:2px}' +
    '@media (max-width:560px){#c360{align-items:flex-end;padding:0}#c360 .c360-dlg{border-radius:14px 14px 0 0;max-height:90vh;padding:20px 16px}#c360 .c360-btn{flex-basis:100%}}';

  var cookieSvg = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5zm-4.5 9a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm3 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5-1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM9 6.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>';
  var brandSvg = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="72 16" transform="rotate(-60 16 16)"/><text x="16" y="20" text-anchor="middle" font-size="10" font-weight="800" fill="currentColor" font-family="system-ui,sans-serif">360</text></svg>';

  function catRow(k) {
    var locked = k === 'necessary';
    return '<label class="c360-cat"><span>' + esc(T[k]) + (locked ? ' <small>' + esc(T.alwaysOn) + '</small>' : '') + '</span>' +
      '<span class="c360-sw"><input type="checkbox" role="switch" data-cat="' + k + '"' + (locked ? ' checked disabled' : '') + '><span></span></span></label>';
  }

  var html =
    '<div class="c360-dlg" role="dialog" aria-modal="true" aria-labelledby="c360-title" aria-describedby="c360-text" lang="' + lang + '">' +
      '<div class="c360-head"><h2 class="c360-title" id="c360-title">' + esc(T.title) + '</h2>' +
        (CONFIG.showBranding ? '<a class="c360-brand" href="' + esc(CONFIG.brandUrl) + '" target="_blank" rel="noopener" aria-label="360 Marketing">' + brandSvg + '<span>360 Marketing</span></a>' : '') +
      '</div>' +
      '<p class="c360-text" id="c360-text">' + esc(T.text) + '</p>' +
      (CONFIG.policyUrl ? '<a class="c360-policy" href="' + esc(CONFIG.policyUrl) + '" target="_blank" rel="noopener">' + esc(T.policy) + '</a>' : '') +
      '<div class="c360-cats" hidden>' + CATS.map(catRow).join('') + '</div>' +
      '<div class="c360-btns">' +
        '<button type="button" class="c360-btn" data-act="reject">' + esc(T.rejectAll) + '</button>' +
        '<button type="button" class="c360-btn" data-act="customize">' + esc(T.customize) + '</button>' +
        '<button type="button" class="c360-btn" data-act="save" hidden>' + esc(T.save) + '</button>' +
        '<button type="button" class="c360-btn c360-btn--primary" data-act="accept">' + esc(T.acceptAll) + '</button>' +
      '</div>' +
    '</div>';

  var root, fab, lastFocus, hasDecision = false;

  function $(sel) { return root.querySelector(sel); }
  function boxes() { return root.querySelectorAll('input[data-cat]'); }

  function syncBoxes(s) {
    var b = boxes();
    for (var i = 0; i < b.length; i++) b[i].checked = b[i].disabled || !!(s && s[b[i].getAttribute('data-cat')]);
  }

  function showCats(on) {
    $('.c360-cats').hidden = !on;
    $('[data-act="customize"]').hidden = on;
    $('[data-act="save"]').hidden = !on;
  }

  function open(expanded) {
    var s = readState();
    syncBoxes(s);
    showCats(!!expanded);
    lastFocus = d.activeElement;
    root.hidden = false;
    fab.hidden = true;
    var first = $('[data-act="' + (expanded ? 'save' : 'accept') + '"]');
    if (first) first.focus();
  }

  function close() {
    root.hidden = true;
    fab.hidden = false;
    if (lastFocus && lastFocus.focus && lastFocus !== d.body) lastFocus.focus();
  }

  function decide(s) {
    s.necessary = true;
    writeState(s);
    applyState(s);
    hasDecision = true;
    close();
  }

  function onClick(e) {
    var t = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!t) return;
    var act = t.getAttribute('data-act');
    if (act === 'accept') decide({ preferences: true, statistics: true, marketing: true });
    else if (act === 'reject') decide({ preferences: false, statistics: false, marketing: false });
    else if (act === 'customize') { showCats(true); $('input[data-cat="preferences"]').focus(); }
    else if (act === 'save') {
      var s = {}, b = boxes();
      for (var i = 0; i < b.length; i++) s[b[i].getAttribute('data-cat')] = b[i].checked;
      decide(s);
    }
  }

  function onKey(e) {
    if (e.key === 'Escape' && hasDecision) { close(); return; }
    if (e.key !== 'Tab') return;
    var f = [].filter.call(root.querySelectorAll('a[href],button,input:not([disabled])'), function (el) {
      return !el.hidden && el.offsetParent !== null;
    });
    if (!f.length) return;
    var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && d.activeElement === a) { z.focus(); e.preventDefault(); }
    else if (!e.shiftKey && d.activeElement === z) { a.focus(); e.preventDefault(); }
  }

  function init() {
    if (d.getElementById('c360')) return;
    var st = d.createElement('style');
    st.id = 'c360-style';
    st.appendChild(d.createTextNode(css));
    d.head.appendChild(st);

    root = d.createElement('div');
    root.id = 'c360';
    root.hidden = true;
    root.innerHTML = html;
    d.body.appendChild(root);
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKey);

    fab = d.createElement('button');
    fab.id = 'c360-fab';
    fab.type = 'button';
    fab.hidden = true;
    fab.setAttribute('aria-label', T.settings);
    fab.title = T.settings;
    fab.innerHTML = cookieSvg;
    fab.addEventListener('click', function () { open(true); });
    d.body.appendChild(fab);

    // bármely elem a weboldalon megnyithatja: <a href="#" data-c360-open>Süti beállítások</a>
    d.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-c360-open]') : null;
      if (t) { e.preventDefault(); open(true); }
    });

    // Visszatérő látogatónál a consentet már a GTM Init template visszaállította.
    hasDecision = !!readState();
    if (hasDecision) fab.hidden = false;
    else open(false);
  }

  w.C360Consent = {
    version: '1.0.0',
    open: function () { open(true); },
    get: readState,
    reset: function () {
      d.cookie = CONFIG.cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (CONFIG.cookieDomain ? '; domain=' + CONFIG.cookieDomain : '');
      hasDecision = false;
      open(false);
    }
  };

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
