/*!
 * 360 Marketing – Google Consent Mode v2 süti popup
 * Verzió: __VERSION__
 * Ezt a fájlt a tools/build.mjs generálja a src/ és a data/ mappából – ne kézzel szerkeszd.
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
    showBranding: true,
    // Teljes oldal-szkennelés eredménye (tools/scan.mjs). A {host} helyére az oldal domainje kerül (www. nélkül).
    // Csak a „Testreszabás” megnyitásakor töltődik le; false = kikapcsolva.
    siteData: 'https://cdn.jsdelivr.net/gh/pengemedia-fejlesztes/360-consent@main/sites/{host}.json',
    scanGtm: true                   // a betöltött GTM konténer(ek) tartalmából is felismeri a szolgáltatásokat
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

  // Kategórialeírások és a felismert szolgáltatások listájának feliratai (1.1.0)
  var I18N_DETAILS = {
    hu: ['Az oldal alapvető működéséhez szükségesek (pl. biztonság, a süti-döntés megjegyzése). Nem kapcsolhatók ki.',
      'Megjegyzik a beállításait (pl. nyelv, chat), hogy kényelmesebb legyen az oldal használata.',
      'Névtelen statisztikák arról, hogyan használják a látogatók az oldalt, hogy fejleszthessük.',
      'Hirdetések méréséhez és személyre szabásához, akár más weboldalakon is.',
      'Részletek', 'Ezen az oldalon nem észleltünk ilyen szolgáltatást.', 'munkamenet'],
    en: ['Required for the basic operation of the site (e.g. security, remembering your cookie choice). They cannot be switched off.',
      'Remember your settings (e.g. language, chat) to make the site easier to use.',
      'Anonymous statistics on how visitors use the site, so we can improve it.',
      'Used to measure and personalise advertising, including on other websites.',
      'Details', 'No such service was detected on this site.', 'session'],
    de: ['Für den grundlegenden Betrieb der Website erforderlich (z. B. Sicherheit, Speicherung Ihrer Cookie-Auswahl). Sie können nicht deaktiviert werden.',
      'Speichern Ihre Einstellungen (z. B. Sprache, Chat), um die Nutzung der Website zu erleichtern.',
      'Anonyme Statistiken darüber, wie Besucher die Website nutzen, damit wir sie verbessern können.',
      'Zur Messung und Personalisierung von Werbung, auch auf anderen Websites.',
      'Details', 'Auf dieser Website wurde kein solcher Dienst erkannt.', 'Sitzung'],
    es: ['Necesarias para el funcionamiento básico del sitio (p. ej., seguridad, recordar su elección de cookies). No se pueden desactivar.',
      'Recuerdan sus ajustes (p. ej., idioma, chat) para facilitar el uso del sitio.',
      'Estadísticas anónimas sobre cómo los visitantes usan el sitio, para poder mejorarlo.',
      'Sirven para medir y personalizar la publicidad, también en otros sitios web.',
      'Detalles', 'No se ha detectado ningún servicio de este tipo en este sitio.', 'sesión'],
    fr: ['Nécessaires au fonctionnement de base du site (p. ex. sécurité, mémorisation de votre choix de cookies). Ils ne peuvent pas être désactivés.',
      'Mémorisent vos paramètres (p. ex. langue, chat) pour faciliter l’utilisation du site.',
      'Statistiques anonymes sur l’utilisation du site par les visiteurs, afin de l’améliorer.',
      'Servent à mesurer et à personnaliser la publicité, y compris sur d’autres sites.',
      'Détails', 'Aucun service de ce type n’a été détecté sur ce site.', 'session'],
    it: ['Necessari per il funzionamento di base del sito (ad es. sicurezza, memorizzazione della scelta sui cookie). Non possono essere disattivati.',
      'Memorizzano le tue impostazioni (ad es. lingua, chat) per rendere più comodo l’uso del sito.',
      'Statistiche anonime su come i visitatori usano il sito, per poterlo migliorare.',
      'Servono a misurare e personalizzare la pubblicità, anche su altri siti.',
      'Dettagli', 'Su questo sito non è stato rilevato alcun servizio di questo tipo.', 'sessione'],
    pt: ['Necessários para o funcionamento básico do site (p. ex., segurança, memorizar a sua escolha de cookies). Não podem ser desativados.',
      'Memorizam as suas definições (p. ex., idioma, chat) para facilitar a utilização do site.',
      'Estatísticas anónimas sobre a forma como os visitantes utilizam o site, para o podermos melhorar.',
      'Servem para medir e personalizar a publicidade, inclusive noutros sites.',
      'Detalhes', 'Não foi detetado nenhum serviço deste tipo neste site.', 'sessão'],
    ro: ['Necesare pentru funcționarea de bază a site-ului (de ex. securitate, reținerea alegerii privind cookie-urile). Nu pot fi dezactivate.',
      'Rețin setările dumneavoastră (de ex. limbă, chat) pentru a face site-ul mai ușor de folosit.',
      'Statistici anonime despre modul în care vizitatorii folosesc site-ul, pentru a-l putea îmbunătăți.',
      'Folosite pentru măsurarea și personalizarea publicității, inclusiv pe alte site-uri.',
      'Detalii', 'Pe acest site nu a fost detectat niciun astfel de serviciu.', 'sesiune'],
    sk: ['Potrebné na základné fungovanie stránky (napr. bezpečnosť, zapamätanie vašej voľby cookies). Nedajú sa vypnúť.',
      'Zapamätajú si vaše nastavenia (napr. jazyk, chat), aby sa stránka používala pohodlnejšie.',
      'Anonymné štatistiky o tom, ako návštevníci používajú stránku, aby sme ju mohli zlepšovať.',
      'Slúžia na meranie a prispôsobenie reklamy, aj na iných webových stránkach.',
      'Podrobnosti', 'Na tejto stránke sme nezistili žiadnu takúto službu.', 'relácia'],
    bg: ['Необходими за основната работа на сайта (напр. сигурност, запомняне на избора ви за бисквитки). Не могат да бъдат изключени.',
      'Запомнят вашите настройки (напр. език, чат), за да е по-удобно използването на сайта.',
      'Анонимна статистика за това как посетителите използват сайта, за да можем да го подобряваме.',
      'Използват се за измерване и персонализиране на рекламите, включително на други сайтове.',
      'Подробности', 'На този сайт не е открита такава услуга.', 'сесия'],
    hr: ['Potrebni za osnovni rad stranice (npr. sigurnost, pamćenje vašeg odabira kolačića). Ne mogu se isključiti.',
      'Pamte vaše postavke (npr. jezik, chat) kako bi korištenje stranice bilo jednostavnije.',
      'Anonimna statistika o tome kako posjetitelji koriste stranicu, kako bismo je mogli poboljšati.',
      'Služe za mjerenje i prilagodbu oglasa, i na drugim web-stranicama.',
      'Detalji', 'Na ovoj stranici nije otkrivena takva usluga.', 'sesija'],
    cs: ['Nezbytné pro základní fungování webu (např. zabezpečení, zapamatování vaší volby cookies). Nelze je vypnout.',
      'Pamatují si vaše nastavení (např. jazyk, chat), aby se web používal pohodlněji.',
      'Anonymní statistiky o tom, jak návštěvníci web používají, abychom ho mohli zlepšovat.',
      'Slouží k měření a přizpůsobení reklamy, i na jiných webech.',
      'Podrobnosti', 'Na tomto webu nebyla zjištěna žádná taková služba.', 'relace'],
    pl: ['Niezbędne do podstawowego działania strony (np. bezpieczeństwo, zapamiętanie wyboru dotyczącego cookie). Nie można ich wyłączyć.',
      'Zapamiętują Twoje ustawienia (np. język, czat), aby korzystanie ze strony było wygodniejsze.',
      'Anonimowe statystyki dotyczące sposobu korzystania ze strony, abyśmy mogli ją ulepszać.',
      'Służą do pomiaru i personalizacji reklam, także na innych stronach.',
      'Szczegóły', 'Na tej stronie nie wykryto takiej usługi.', 'sesja'],
    ja: ['サイトの基本的な動作に必要です（セキュリティ、Cookie設定の保存など）。無効にすることはできません。',
      '言語やチャットなどの設定を保存し、サイトを使いやすくします。',
      '訪問者によるサイトの利用状況に関する匿名の統計で、サイトの改善に役立てます。',
      '他のウェブサイトを含め、広告の測定とパーソナライズに使用されます。',
      '詳細', 'このサイトではこの種類のサービスは検出されませんでした。', 'セッション']
  };
  for (var il in I18N_DETAILS) {
    if (!I18N[il]) continue;
    var dx = I18N_DETAILS[il];
    I18N[il].desc_necessary = dx[0]; I18N[il].desc_preferences = dx[1];
    I18N[il].desc_statistics = dx[2]; I18N[il].desc_marketing = dx[3];
    I18N[il].details = dx[4]; I18N[il].noneFound = dx[5]; I18N[il].session = dx[6];
  }

  var CATS = ['necessary', 'preferences', 'statistics', 'marketing'];

  // --- Szolgáltatás-felismerés ---
  // Az adatbázis a data/providers.json-ból kerül ide build közben.
  var PROVIDERS = /*__PROVIDERS__*/[];
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

  function newReport() { return { services: {}, unknownHosts: {} }; }
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
    var r = newReport(), i, list;
    list = d.querySelectorAll('script[src],iframe[src],img[src],link[rel=preconnect],link[rel=dns-prefetch],[data-src],[data-lazy-src]');
    for (i = 0; i < list.length; i++) {
      var el = list[i];
      addUrl(r, el.getAttribute('src') ? el.src : el.href || el.getAttribute('data-src') || el.getAttribute('data-lazy-src'), el.tagName.toLowerCase());
    }
    if (w.performance && performance.getEntriesByType) {
      list = performance.getEntriesByType('resource');
      for (i = 0; i < list.length; i++) addUrl(r, list[i].name, 'network');
    }
    var names = d.cookie ? d.cookie.split(/;\s*/).map(function (c) { return c.split('=')[0]; }) : [];
    for (i = 0; i < PROVIDERS.length; i++) {
      var cs = PROVIDERS[i].cookies || [];
      for (var j = 0; j < cs.length; j++) {
        var re = cookieRe(cs[j][0]), hit = false;
        for (var k = 0; k < names.length; k++) if (re.test(names[k])) { hit = true; break; }
        if (hit) { addService(r, PROVIDERS[i], 'cookie'); break; }
      }
    }
    for (i = 0; i < PROVIDERS.length; i++) if (PROVIDERS[i].id === 'c360') addService(r, PROVIDERS[i], 'self');
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
      for (var i = 0; i < ids.length; i++) {
        var id = typeof ids[i] === 'string' ? ids[i] : ids[i].id;
        for (var j = 0; j < PROVIDERS.length; j++) if (PROVIDERS[j].id === id) addService(r, PROVIDERS[j], 'site-scan');
      }
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

  function fmtDur(spec) {
    if (spec === 's') return T.session;
    var m = /^(\d+)(min|h|d|mo|y)$/.exec(spec || '');
    if (!m) return '';
    try { return new Intl.NumberFormat(lang, { style: 'unit', unit: DUR_UNIT[m[2]], unitDisplay: 'long' }).format(+m[1]); }
    catch (e) { return m[1] + ' ' + m[2]; }
  }

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
    '#c360 .c360-cat{padding:11px 0;border-bottom:1px solid #e6eaee}' +
    '#c360 .c360-cat-head{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:15px;font-weight:600;color:#1f2a33;cursor:pointer}' +
    '#c360 .c360-cat-head small{font-size:12px;font-weight:600;color:' + C + '}' +
    '#c360 .c360-desc{margin-top:3px;font-size:13px;color:#5b6873}' +
    '#c360 .c360-more{margin-top:4px;padding:2px 0;border:0;background:none;color:' + C + ';font-size:13px;font-weight:600;text-decoration:underline;cursor:pointer}' +
    '#c360 .c360-more:focus-visible{outline:2px solid ' + C + ';outline-offset:2px}' +
    '#c360 .c360-list{list-style:none;margin-top:6px;padding:6px 10px;background:#f4f7f9;border-radius:8px;font-size:13px;color:#1f2a33}' +
    '#c360 .c360-list li{padding:5px 0}' +
    '#c360 .c360-list li+li{border-top:1px solid #e1e6ea}' +
    '#c360 .c360-list b{display:block;font-weight:700}' +
    '#c360 .c360-list small{display:block;font-size:12px;color:#5b6873;word-break:break-word}' +
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
    return '<div class="c360-cat">' +
      '<label class="c360-cat-head"><span>' + esc(T[k]) + (locked ? ' <small>' + esc(T.alwaysOn) + '</small>' : '') + '</span>' +
      '<span class="c360-sw"><input type="checkbox" role="switch" data-cat="' + k + '"' + (locked ? ' checked disabled' : '') + '><span></span></span></label>' +
      '<p class="c360-desc">' + esc(T['desc_' + k]) + '</p>' +
      '<button type="button" class="c360-more" data-act="more" data-more="' + k + '" aria-expanded="false" aria-controls="c360-list-' + k + '">' +
        esc(T.details) + ' <span data-count="' + k + '"></span></button>' +
      '<ul class="c360-list" id="c360-list-' + k + '" hidden></ul>' +
    '</div>';
  }

  // A felismert szolgáltatások kategóriánként, sütikkel és élettartammal.
  function renderDetails(r) {
    for (var c = 0; c < CATS.length; c++) {
      var k = CATS[c], items = [];
      for (var id in r.services) if (r.services[id].cat === k) items.push(r.services[id]);
      items.sort(function (a, b) { return a.name < b.name ? -1 : 1; });
      var ul = $('#c360-list-' + k), cnt = $('[data-count="' + k + '"]');
      cnt.textContent = '(' + items.length + ')';
      ul.innerHTML = items.length ? items.map(function (s) {
        var ck = s.cookies.map(function (x) { var t = fmtDur(x[1]); return x[0] + (t ? ' (' + t + ')' : ''); }).join(', ');
        return '<li><b>' + esc(s.name) + '</b>' + (ck ? '<small>' + esc(ck) + '</small>' : '') + '</li>';
      }).join('') : '<li><small>' + esc(T.noneFound) + '</small></li>';
    }
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
    if (on) runScan(function (r) { renderDetails(r); });
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
    else if (act === 'more') {
      var ul = $('#c360-list-' + t.getAttribute('data-more')), show = ul.hidden;
      ul.hidden = !show;
      t.setAttribute('aria-expanded', show ? 'true' : 'false');
    }
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
    version: '__VERSION__',
    open: function () { open(true); },
    get: readState,
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
        }
      });
    },
    reset: function () {
      d.cookie = CONFIG.cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (CONFIG.cookieDomain ? '; domain=' + CONFIG.cookieDomain : '');
      hasDecision = false;
      open(false);
    }
  };

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
