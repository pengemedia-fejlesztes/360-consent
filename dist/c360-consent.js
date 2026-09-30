/*!
 * 360 Marketing – Google Consent Mode v2 süti popup
 * Verzió: 1.3.0
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
    size: 0,                        // center/left/right: szélesség a képernyő %-ában (0 = alap)
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

// 360 Consent – felületi szövegek 14 nyelven. A build a src/c360-consent.js /*__I18N__*/ helyére illeszti.
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

  // 1.2.0: részletező panel, nyelvválasztó
  // [panel címe, bezárás, süti, időtartam, leírás, nyelv]
  var I18N_PANEL = {
    hu: ['Engedélyek beállítása', 'Bezárás', 'Süti', 'Időtartam', 'Leírás', 'Nyelv'],
    en: ['Consent preferences', 'Close', 'Cookie', 'Duration', 'Description', 'Language'],
    de: ['Einwilligungseinstellungen', 'Schließen', 'Cookie', 'Dauer', 'Beschreibung', 'Sprache'],
    es: ['Preferencias de consentimiento', 'Cerrar', 'Cookie', 'Duración', 'Descripción', 'Idioma'],
    fr: ['Préférences de consentement', 'Fermer', 'Cookie', 'Durée', 'Description', 'Langue'],
    it: ['Preferenze di consenso', 'Chiudi', 'Cookie', 'Durata', 'Descrizione', 'Lingua'],
    pt: ['Preferências de consentimento', 'Fechar', 'Cookie', 'Duração', 'Descrição', 'Idioma'],
    ro: ['Preferințe de consimțământ', 'Închide', 'Cookie', 'Durată', 'Descriere', 'Limbă'],
    sk: ['Nastavenia súhlasu', 'Zavrieť', 'Cookie', 'Trvanie', 'Popis', 'Jazyk'],
    bg: ['Настройки на съгласието', 'Затвори', 'Бисквитка', 'Продължителност', 'Описание', 'Език'],
    hr: ['Postavke privole', 'Zatvori', 'Kolačić', 'Trajanje', 'Opis', 'Jezik'],
    cs: ['Nastavení souhlasu', 'Zavřít', 'Cookie', 'Doba trvání', 'Popis', 'Jazyk'],
    pl: ['Ustawienia zgody', 'Zamknij', 'Plik cookie', 'Czas trwania', 'Opis', 'Język'],
    ja: ['同意設定', '閉じる', 'Cookie', '期間', '説明', '言語']
  };
  for (var ip in I18N_PANEL) {
    if (!I18N[ip]) continue;
    var px = I18N_PANEL[ip];
    I18N[ip].panelTitle = px[0]; I18N[ip].close = px[1]; I18N[ip].cookie = px[2];
    I18N[ip].duration = px[3]; I18N[ip].description = px[4]; I18N[ip].language = px[5];
  }
  var LANG_NAMES = { hu: 'Magyar', en: 'English', de: 'Deutsch', es: 'Español', fr: 'Français', it: 'Italiano',
    pt: 'Português', ro: 'Română', sk: 'Slovenčina', bg: 'Български', hr: 'Hrvatski', cs: 'Čeština', pl: 'Polski', ja: '日本語' };


  var CATS = ['necessary', 'preferences', 'statistics', 'marketing'];
  var VERSION = '1.3.0';

  w.dataLayer = w.dataLayer || [];
  function gtag() { w.dataLayer.push(arguments); }

  // --- Szolgáltatás-felismerés ---
  // Az adatbázis a data/providers.json-ból kerül ide build közben.
  var PROVIDERS = [{"id":"c360","name":"360 Consent","cat":"necessary","hosts":["cdn.jsdelivr.net/gh/pengemedia-fejlesztes/360-consent"],"gtm":["360-consent@","c360_consent"],"cookies":[["c360_consent","1y"]],"desc":{"hu":"A látogató süti-döntését tárolja, hogy ne kelljen minden oldalon újra megadnia.","en":"Stores the visitor’s cookie choice so it does not have to be made again on every page."}},{"id":"gtm","name":"Google Tag Manager","cat":"necessary","hosts":["googletagmanager.com/gtm.js"],"gtm":[],"cookies":[],"desc":{"hu":"Címkekezelő: a hozzájárulásnak megfelelően tölti be a mérő- és hirdetési kódokat. Önmagában nem tesz sütit.","en":"Tag manager that loads measurement and advertising code according to your consent. Sets no cookies itself."}},{"id":"cookieyes","name":"CookieYes","cat":"necessary","cmp":true,"hosts":["cdn-cookieyes.com","log.cookieyes.com","@self/wp-content/plugins/cookie-law-info/"],"gtm":["cdn-cookieyes.com"],"cookies":[["cookieyes-consent","1y"]],"desc":{"hu":"Süti-hozzájárulás kezelő; a látogató döntését tárolja.","en":"Consent management platform; stores the visitor’s choice."}},{"id":"cookiebot","name":"Cookiebot","cat":"necessary","cmp":true,"hosts":["consent.cookiebot.com","consentcdn.cookiebot.com"],"gtm":["consent.cookiebot.com"],"cookies":[["CookieConsent","1y"]],"desc":{"hu":"Süti-hozzájárulás kezelő; a látogató döntését tárolja.","en":"Consent management platform; stores the visitor’s choice."}},{"id":"onetrust","name":"OneTrust","cat":"necessary","cmp":true,"hosts":["cdn.cookielaw.org","geolocation.onetrust.com"],"gtm":["cdn.cookielaw.org"],"cookies":[["OptanonConsent","1y"],["OptanonAlertBoxClosed","1y"]],"desc":{"hu":"Süti-hozzájárulás kezelő; a látogató döntését tárolja.","en":"Consent management platform; stores the visitor’s choice."}},{"id":"usercentrics","name":"Usercentrics","cat":"necessary","cmp":true,"hosts":["app.usercentrics.eu","web.cmp.usercentrics.eu"],"gtm":["usercentrics.eu"],"cookies":[],"desc":{"hu":"Süti-hozzájárulás kezelő; a látogató döntését tárolja.","en":"Consent management platform; stores the visitor’s choice."}},{"id":"iubenda","name":"iubenda","cat":"necessary","cmp":true,"hosts":["cdn.iubenda.com","cs.iubenda.com"],"gtm":["cdn.iubenda.com"],"cookies":[["_iub_cs-*","1y"]],"desc":{"hu":"Süti-hozzájárulás kezelő; a látogató döntését tárolja.","en":"Consent management platform; stores the visitor’s choice."}},{"id":"complianz","name":"Complianz","cat":"necessary","cmp":true,"hosts":["@self/wp-content/plugins/complianz-gdpr/","@self/wp-content/plugins/complianz-gdpr-premium/"],"gtm":[],"cookies":[["cmplz_*","1y"]],"desc":{"hu":"Süti-hozzájárulás kezelő; a látogató döntését tárolja.","en":"Consent management platform; stores the visitor’s choice."}},{"id":"borlabs","name":"Borlabs Cookie","cat":"necessary","cmp":true,"hosts":["@self/wp-content/plugins/borlabs-cookie/"],"gtm":[],"cookies":[["borlabs-cookie","1y"]],"desc":{"hu":"Süti-hozzájárulás kezelő; a látogató döntését tárolja.","en":"Consent management platform; stores the visitor’s choice."}},{"id":"wordpress","name":"WordPress","cat":"necessary","hosts":["@self/wp-content/","@self/wp-includes/"],"gtm":[],"cookies":[["wordpress_test_cookie","s"],["wp-settings-*","1y"],["wp-settings-time-*","1y"]],"desc":{"hu":"A weboldal motorja; a sütik a bejelentkezéshez és a böngésző képességeinek ellenőrzéséhez kellenek.","en":"The website’s CMS; its cookies are used for login and to check browser capabilities."}},{"id":"woocommerce","name":"WooCommerce","cat":"necessary","hosts":["@self/wp-content/plugins/woocommerce/"],"gtm":[],"cookies":[["woocommerce_cart_hash","s"],["woocommerce_items_in_cart","s"],["wp_woocommerce_session_*","2d"]],"desc":{"hu":"Webáruház-motor; a kosár tartalmát és a vásárlási munkamenetet tárolja.","en":"Online store engine; stores the cart contents and the shopping session."}},{"id":"recaptcha","name":"Google reCAPTCHA","cat":"necessary","hosts":["google.com/recaptcha","gstatic.com/recaptcha","recaptcha.net"],"gtm":[],"cookies":[["_GRECAPTCHA","6mo"]],"desc":{"hu":"A Google reCAPTCHA az űrlapokat védi a spam és a robotok ellen.","en":"Google reCAPTCHA protects forms against spam and bots."}},{"id":"cloudflare","name":"Cloudflare","cat":"necessary","hosts":["challenges.cloudflare.com","cdnjs.cloudflare.com/cdn-cgi"],"gtm":[],"cookies":[["__cf_bm","30min"],["cf_clearance","1y"],["_cfuvid","s"]],"desc":{"hu":"A Cloudflare a weboldal biztonságát és a robotok kiszűrését szolgálja.","en":"Cloudflare is used for website security and bot protection."}},{"id":"polylang","name":"Polylang / WPML","cat":"preferences","hosts":["@self/wp-content/plugins/polylang","@self/wp-content/plugins/sitepress-multilingual-cms"],"gtm":[],"cookies":[["pll_language","1y"],["wp-wpml_current_language","s"]],"desc":{"hu":"A kiválasztott nyelvet jegyzi meg.","en":"Remembers the selected language."}},{"id":"tawk","name":"Tawk.to chat","cat":"preferences","hosts":["embed.tawk.to","va.tawk.to"],"gtm":["embed.tawk.to"],"cookies":[["TawkConnectionTime","s"],["twk_uuid_*","6mo"]],"desc":{"hu":"Élő chat; a beszélgetés folytonosságát biztosítja.","en":"Live chat; keeps the conversation going across pages."}},{"id":"crisp","name":"Crisp chat","cat":"preferences","hosts":["client.crisp.chat"],"gtm":["client.crisp.chat"],"cookies":[["crisp-client/*","6mo"]],"desc":{"hu":"Élő chat; a beszélgetés folytonosságát biztosítja.","en":"Live chat; keeps the conversation going across pages."}},{"id":"tidio","name":"Tidio chat","cat":"preferences","hosts":["code.tidio.co"],"gtm":["code.tidio.co"],"cookies":[],"desc":{"hu":"Élő chat; a beszélgetés folytonosságát biztosítja.","en":"Live chat; keeps the conversation going across pages."}},{"id":"ga4","name":"Google Analytics","cat":"statistics","gcm":true,"hosts":["google-analytics.com","analytics.google.com","googletagmanager.com/gtag/js?id=G-"],"gtm":["re:G-[A-Z0-9]{6,12}"],"cookies":[["_ga","2y"],["_ga_*","2y"],["_gid","1d"],["_gat*","1min"]],"desc":{"hu":"A Google Analytics névtelen statisztikát készít arról, hogyan használják a látogatók az oldalt (látogatások, forrás, oldalmegtekintések).","en":"Google Analytics collects anonymous statistics on how visitors use the site (visits, sources, page views)."}},{"id":"clarity","name":"Microsoft Clarity","cat":"statistics","hosts":["clarity.ms","clarity.microsoft.com"],"gtm":["clarity.ms"],"cookies":[["_clck","1y"],["_clsk","1d"],["CLID","1y"]],"desc":{"hu":"A Microsoft Clarity hőtérképekkel és munkamenet-visszajátszással mutatja meg, hogyan használják az oldalt.","en":"Microsoft Clarity shows how the site is used through heatmaps and session replays."}},{"id":"hotjar","name":"Hotjar","cat":"statistics","hosts":["hotjar.com","hotjar.io"],"gtm":["static.hotjar.com","hjid:"],"cookies":[["_hjSessionUser_*","1y"],["_hjSession_*","30min"]],"desc":{"hu":"A Hotjar hőtérképekkel és felvételekkel elemzi az oldal használatát.","en":"Hotjar analyses site usage with heatmaps and recordings."}},{"id":"matomo","name":"Matomo","cat":"statistics","hosts":["matomo.cloud","@self/matomo.js","@self/piwik.js"],"gtm":["_paq.push","matomo.js"],"cookies":[["_pk_id.*","13mo"],["_pk_ses.*","30min"]],"desc":{"hu":"A Matomo névtelen látogatottsági statisztikát készít.","en":"Matomo collects anonymous visitor statistics."}},{"id":"yandex","name":"Yandex Metrica","cat":"statistics","hosts":["mc.yandex.ru","mc.yandex.com"],"gtm":["mc.yandex.ru"],"cookies":[["_ym_uid","1y"],["_ym_d","1y"]],"desc":{"hu":"A Yandex Metrica látogatottsági statisztikát készít.","en":"Yandex Metrica collects visitor statistics."}},{"id":"smartlook","name":"Smartlook","cat":"statistics","hosts":["smartlook.com"],"gtm":["smartlook.com"],"cookies":[],"desc":{"hu":"A Smartlook munkamenet-felvételekkel elemzi az oldal használatát.","en":"Smartlook analyses site usage with session recordings."}},{"id":"vimeo","name":"Vimeo","cat":"statistics","hosts":["player.vimeo.com","vimeocdn.com"],"gtm":[],"cookies":[["vuid","2y"]],"embed":true,"desc":{"hu":"A Vimeo a beágyazott videók lejátszásához és méréséhez használja.","en":"Used by Vimeo to play and measure embedded videos."}},{"id":"google-ads","name":"Google Ads","cat":"marketing","gcm":true,"hosts":["googleadservices.com","googleads.g.doubleclick.net","googletagmanager.com/gtag/js?id=AW-","google.com/pagead","google.com/ccm"],"gtm":["re:AW-[0-9]{6,}","\"__awct\"","\"__sp\""],"cookies":[["_gcl_au","3mo"],["_gcl_aw","3mo"]],"desc":{"hu":"A Google Ads a hirdetésekre kattintást és a konverziókat méri.","en":"Google Ads measures ad clicks and conversions."}},{"id":"doubleclick","name":"Google DoubleClick / Floodlight","cat":"marketing","gcm":true,"hosts":["doubleclick.net","fls.doubleclick.net"],"gtm":["re:DC-[0-9]{6,}","\"__flc\""],"cookies":[["IDE","13mo"],["test_cookie","15min"]],"desc":{"hu":"A Google hirdetési hálózata a hirdetések megjelenítéséhez és méréséhez használja.","en":"Used by Google’s ad network to show and measure ads."}},{"id":"adsense","name":"Google AdSense","cat":"marketing","gcm":true,"hosts":["googlesyndication.com","adservice.google.com"],"gtm":["pagead2.googlesyndication.com"],"cookies":[["__gads","13mo"],["__gpi","13mo"]],"desc":{"hu":"A Google AdSense hirdetéseket jelenít meg és mér.","en":"Google AdSense shows and measures ads."}},{"id":"meta","name":"Meta (Facebook) Pixel","cat":"marketing","hosts":["connect.facebook.net","facebook.com/tr"],"gtm":["connect.facebook.net","fbq("],"cookies":[["_fbp","3mo"],["_fbc","3mo"]],"desc":{"hu":"A Meta (Facebook) Pixel a hirdetések mérésére és a korábbi látogatóknak szóló hirdetésekre szolgál a Facebookon és az Instagramon.","en":"Meta (Facebook) Pixel measures ads and enables ads to past visitors on Facebook and Instagram."}},{"id":"tiktok","name":"TikTok Pixel","cat":"marketing","hosts":["analytics.tiktok.com"],"gtm":["analytics.tiktok.com","ttq.load"],"cookies":[["_ttp","13mo"],["_tt_enable_cookie","13mo"]],"desc":{"hu":"A TikTok Pixel a TikTok-hirdetések mérésére és célzására szolgál.","en":"TikTok Pixel measures and targets TikTok ads."}},{"id":"linkedin","name":"LinkedIn Insight Tag","cat":"marketing","hosts":["snap.licdn.com","px.ads.linkedin.com"],"gtm":["snap.licdn.com","_linkedin_partner_id"],"cookies":[["li_sugr","3mo"],["li_fat_id","1mo"],["bcookie","1y"],["lidc","1d"]],"desc":{"hu":"A LinkedIn Insight Tag a LinkedIn-hirdetések mérésére és célzására szolgál.","en":"LinkedIn Insight Tag measures and targets LinkedIn ads."}},{"id":"bing-ads","name":"Microsoft Advertising (UET)","cat":"marketing","hosts":["bat.bing.com"],"gtm":["bat.bing.com"],"cookies":[["_uetsid","1d"],["_uetvid","13mo"],["MUID","1y"]],"desc":{"hu":"A Microsoft Advertising a Bing-hirdetések konverzióit méri.","en":"Microsoft Advertising measures Bing ad conversions."}},{"id":"pinterest","name":"Pinterest Tag","cat":"marketing","hosts":["s.pinimg.com/ct","ct.pinterest.com"],"gtm":["pintrk("],"cookies":[["_pinterest_ct_ua","1y"],["_pin_unauth","1y"]],"desc":{"hu":"A Pinterest Tag a Pinterest-hirdetések mérésére szolgál.","en":"Pinterest Tag measures Pinterest ads."}},{"id":"x-ads","name":"X (Twitter) Pixel","cat":"marketing","hosts":["static.ads-twitter.com","analytics.twitter.com","t.co/i/adsct"],"gtm":["static.ads-twitter.com","twq("],"cookies":[["personalization_id","13mo"],["muc_ads","13mo"]],"desc":{"hu":"Az X (Twitter) Pixel az X-hirdetések mérésére szolgál.","en":"X (Twitter) Pixel measures X ads."}},{"id":"snapchat","name":"Snap Pixel","cat":"marketing","hosts":["sc-static.net","tr.snapchat.com"],"gtm":["sc-static.net","snaptr("],"cookies":[["_scid","13mo"]],"desc":{"hu":"A Snap Pixel a Snapchat-hirdetések mérésére szolgál.","en":"Snap Pixel measures Snapchat ads."}},{"id":"hubspot","name":"HubSpot","cat":"marketing","hosts":["js.hs-scripts.com","js.hs-analytics.net","js.hsforms.net","track.hubspot.com"],"gtm":["hs-scripts.com"],"cookies":[["__hstc","13mo"],["hubspotutk","13mo"],["__hssc","30min"],["__hssrc","s"]],"desc":{"hu":"A HubSpot a látogatókat és az érdeklődőket követi a marketing-automatizáláshoz.","en":"HubSpot tracks visitors and leads for marketing automation."}},{"id":"youtube","name":"YouTube","cat":"marketing","hosts":["youtube.com/embed","youtube.com/iframe_api","youtube-nocookie.com"],"gtm":[],"cookies":[["YSC","s"],["VISITOR_INFO1_LIVE","6mo"],["VISITOR_PRIVACY_METADATA","6mo"]],"embed":true,"desc":{"hu":"A YouTube a beágyazott videók lejátszásához, a nézettség méréséhez és a hirdetések személyre szabásához használja.","en":"Used by YouTube to play embedded videos, measure views and personalise ads."}},{"id":"google-maps","name":"Google Maps","cat":"marketing","hosts":["maps.googleapis.com","maps.google.com","google.com/maps"],"gtm":[],"cookies":[["NID","6mo"]],"embed":true,"desc":{"hu":"A Google Térkép a beágyazott térkép megjelenítéséhez és a beállítások megjegyzéséhez használja.","en":"Used by Google Maps to show the embedded map and remember preferences."}},{"id":"infra","name":"Könyvtárak, betűtípusok, CDN","cat":"infra","hosts":["fonts.googleapis.com","fonts.gstatic.com","cdn.jsdelivr.net","cdnjs.cloudflare.com","unpkg.com","ajax.googleapis.com","code.jquery.com","s.w.org","ytimg.com","secure.gravatar.com","gstatic.com","googleapis.com","google.com","google.hu","googletagmanager.com","use.fontawesome.com","kit.fontawesome.com","use.typekit.net"],"gtm":[],"cookies":[],"desc":{"hu":"Betűtípusok, könyvtárak és tartalomkiszolgálók; sütit nem tesznek.","en":"Fonts, libraries and CDNs; they set no cookies."}}];
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
  function setCookie(name, value, days) {
    var exp = new Date(Date.now() + days * 864e5).toUTCString();
    try { d.cookie = name + '=' + value + '; expires=' + exp + '; path=/; SameSite=Lax' +
      (CONFIG.cookieDomain ? '; domain=' + CONFIG.cookieDomain : '') +
      (location.protocol === 'https:' ? '; Secure' : ''); } catch (e) { /* sandbox */ }
  }
  function writeState(s) {
    setCookie(CONFIG.cookieName, ['v1', s.preferences ? 1 : 0, s.statistics ? 1 : 0, s.marketing ? 1 : 0].join('.'), CONFIG.cookieDays);
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
  function serviceList(report) {
    var out = {}, i, id;
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

  function buildCss() {
    C = CONFIG.brandColor;
    var side = CONFIG.position === 'right' ? 'right' : 'left';
    var pl = CONFIG.placement, size = +CONFIG.size || 0;
    var dlgW = pl === 'center' ? (size ? size + 'vw' : '560px') : pl === 'left' || pl === 'right' ? (size ? size + 'vw' : '420px') : '100%';
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
      '@media (max-width:640px){#c360{padding:0;align-items:flex-end!important;justify-content:center!important}' +
      '#c360 .c360-dlg{width:100%!important;min-width:0!important;height:auto!important;max-height:88vh!important;border-radius:14px 14px 0 0!important;padding:20px 16px}' +
      '#c360.c360--prefs .c360-dlg{padding:0}' +
      '#c360 .c360-title{font-size:19px}#c360 .c360-text{font-size:15px}' +
      '#c360 .c360-btns .c360-btn,#c360 .c360-btns--lg .c360-btn{flex:1 1 100%}' +
      '#c360 .c360-row{grid-template-columns:90px 1fr}#c360 .c360-desc,#c360 .c360-list{margin-left:0}}' +
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

  function noticeHtml() {
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
        CATS.filter(catEnabled).map(function (k) { return catHtml(k, svcs); }).join('') + '</div>' +
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
    var s = readState();
    draft = { preferences: !!(s && s.preferences), statistics: !!(s && s.statistics), marketing: !!(s && s.marketing) };
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
    else if (act === 'save') { collectDraft(); decide({ preferences: draft.preferences, statistics: draft.statistics, marketing: draft.marketing }); }
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
