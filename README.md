# 360 Consent – Google Consent Mode v2 süti popup

A 360 Marketing saját, ingyenes GCMv2 süti bannere. Google Tag Managerből töltődik be, a kódot a jsDelivr szolgálja ki ebből a repóból, így egy új kiadás minden ügyféloldalon automatikusan megjelenik.

## Felépítés

| Fájl | Szerep | Frissítés |
|---|---|---|
| `dist/c360-consent.js` | A popup (generált: `node tools/build.mjs`) | Globális, a jsDelivr `@1` aliasán át |
| `src/c360-consent.js` | A popup forrása | – |
| `data/providers.json` | Ismert szolgáltatások: domainek, GTM-minták, sütik, kategória | Globális, a következő kiadással |
| `sites/<domain>.json` | Egy oldal szkennelt JS-térképe (`tools/scan.mjs`) | Azonnal, a `@main`-ről (cache-ürítés után) |
| `gtm/loader-tag.html` | GTM Custom HTML betöltő, benne az oldalankénti `C360_CONFIG` | Oldalanként, ritkán |
| `gtm/360-consent-init.tpl` | GTM tag template, Consent Initialization: default + mentett döntés visszaállítása | Oldalanként, ritkán |

## Telepítés egy új oldalra (GTM)

1. Importáld a `gtm/360-consent-init.tpl` fájlt, majd tagként tedd a **Consent Initialization – All Pages** triggerre.
2. Hozz létre egy **Constant** változót `DataPolicyURL` néven, az adatkezelési tájékoztató URL-jével.
3. Tedd be a `gtm/loader-tag.html` tartalmát Custom HTML tagként az **Initialization – All Pages** triggerre.
4. Hozz létre egy **Custom Event** triggert `gtm_consent_update` néven.
5. A nem Google-os tageknél (Meta, TikTok, LinkedIn, Clarity, Hotjar…) állítsd be a consent feltételt (`ad_storage` vagy `analytics_storage`), add hozzá a `gtm_consent_update` triggert, és állítsd be: *Once per page*.
6. Kapcsold ki a régi CMP-t (CookieYes, Cookiebot stb.) és minden más `gtag('consent','default')` kódot. Egy oldalon csak egy consent default futhat.
7. Ürítsd a cache-t, majd teszteld inkognitóban, GTM Preview-val.

## Admin

**https://360-marketing.hu/c360/admin/** – a belépési adatok helyben: `~/.config/360-consent/admin.env`.

- **Domainek:** minden domain, ahol a popup fut. A popup a látogatások kis mintájából visszajelez, így az új telepítések „Felfedezett” állapotban maguktól megjelennek. Az itt megadott beállítások csak **Aktív** állapotban érvényesülnek.
- **Telepítés:** mely oldalakon, milyen verzióval és nyelven fut; a GTM-telepítés kódja.
- **Megjelenés:** elhelyezés (középen / fent / lent / bal / jobb), szélesség, gombok, szín, tájékoztató URL.
- **Nyelv és szöveg:** automatikus vagy rögzített nyelv, nyelvválasztó, felkínált nyelvek, szövegek felülírása nyelvenként.
- **Kategóriák:** ki/be kapcsolás, leírás nyelvenként, mi tartozik bele.
- **Szolgáltatások és sütik:** átsorolás másik kategóriába, elrejtés, leírás; az ismeretlen sütik besorolása. Az átsorolás a banner besorolását módosítja, a tényleges betöltést a GTM tag consent-feltétele szabja meg, ezért azt is igazítsd.
- A beállítás mentés után legfeljebb 5 percen belül él (a böngészők ennyi ideig cache-elik).

Szerveroldal: `server/c360/` (PHP 7.4+, JSON-tárolás a `data/` mappában, amely kívülről tiltott). Frissítés: `node tools/build.mjs && tools/deploy-server.sh` (a `data/`-hoz nem nyúl).

Nyilvános végpontok: `api/config.php?host=domain.hu` (a banner beállításai, 5 perc cache) és `api/ping.php` (telepítés-visszajelzés, csak a saját domainről, domainenként legfeljebb 20 mp-enként).

## Az oldal JS-térképe (szolgáltatás-felismerés)

A banner „Testreszabás” nézetében kategóriánként, a sütikkel és az élettartamokkal együtt látszik, milyen szolgáltatások futnak az oldalon. Ez csak a nézet megnyitásakor fut, így az oldalbetöltést nem lassítja. Források:

1. az oldalon betöltött szkriptek, iframe-ek, lusta betöltésű beágyazások (`data-src`), hálózati kérések és olvasható sütik;
2. a betöltött GTM konténer konfigurációja (tagek, template-ek), így az is látszik, ami a hozzájárulás hiánya miatt még nem töltődött be;
3. a `sites/<domain>.json`, azaz a teljes oldal szkennelésének eredménye.

**Teljes oldal feltérképezése** (új ügyfélnél, és utána negyedévente):

```bash
node tools/scan.mjs https://domain.hu --max 40
```

A szkenner a sitemap oldalait és a GTM konténert nézi át, Markdown riportot ír, és elmenti a `sites/<domain>.json`-t (ezt commitold, majd ürítsd a cache-t: `curl https://purge.jsdelivr.net/gh/pengemedia-fejlesztes/360-consent@main/sites/<domain>.json`). Figyelmeztet, ha:
- egy nem szükséges kód közvetlenül az oldal kódjában van, tehát a popup nem tudja visszatartani;
- a 360 Consent mellett egy másik süti kezelő (CookieYes, Cookiebot…) is fut.

Az ismeretlen külső domaineket a `data/providers.json`-ba kell felvenni, új kiadással.

Böngészőből, bármelyik telepített oldalon: `C360Consent.scan()` a konzolban.

## `C360_CONFIG` beállítások

`api` (az admin API címe, `''` = ki), `placement` (`center`/`top`/`bottom`/`left`/`right`), `size` (szélesség %), `acceptLarge`, `showReject`, `langSwitcher`, `languages`, `texts`, `categories`, `services`, `pingRate`, `policyUrl`, `brandColor`, `position` (a süti ikon helye: `left`/`right`), `cookieDomain`, `forceLang`, `defaultLang`, `showBranding`, `brandUrl`, `cookieDays`, `siteData` (a szkennelt JSON címe, `false` = ki), `scanGtm` (`false` = a GTM konténert nem elemzi).

## Kiadás (globális frissítés)

1. Módosítsd a `src/` vagy a `data/` fájlt, emeld a `package.json` `version` értékét, írd be a változást a `CHANGELOG.md`-be, és futtasd a `node tools/build.mjs`-t (a `dist/` generált, kézzel ne szerkeszd).
2. Teszteld a `cdn.jsdelivr.net/gh/pengemedia-fejlesztes/360-consent@<commit>/dist/c360-consent.js` URL-lel egy teszt GTM Preview-ban.
3. Adj ki tagot: `git tag v1.0.1 && git push --tags`.
4. Ürítsd a jsDelivr cache-t, különben a `@1` alias akár 12 órán át a régi verziót adja:
   `curl https://purge.jsdelivr.net/gh/pengemedia-fejlesztes/360-consent@1/dist/c360-consent.min.js`
5. Törő (breaking) változás esetén (pl. új sütiformátum vagy a template-tel együtt változó logika) **v2.0.0** legyen a tag. A `@1`-es oldalak ilyenkor nem kapják meg automatikusan, oldalanként kell átállítani őket.

## Szabályok

- A `main` ág és a `v*` tagek védettek. Kiadott taget ne írj felül, inkább adj ki újat.
- A sütiformátum (`v1.p.s.m`) és a `cookieName` a GTM template-tel közös szerződés. Ezt csak major verzióban szabad megváltoztatni.
- Ha a CDN nem elérhető, a popup nem jelenik meg, és minden consent `denied` marad. Ez a biztonságos irány.

## Telepítve

| Oldal | GTM | Dátum |
|---|---|---|
| fuvarozas-szallitmanyozas.com | GTM-P3TPBVVC | 2026-09-30 |

© 360 Marketing. Minden jog fenntartva.
