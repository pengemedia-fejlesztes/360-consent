# Változásnapló

## 1.4.0 – 2026-09-30
- A méret a teljes látható képernyő %-a: középen szélességre és magasságra is (négyzetes képernyőn négyzetes), fent/lent a sáv magassága.
- A beállítás azonnal él: a konfiguráció ETag-gel, cache nélkül megy (304, ha nem változott).
- Csak a tartalommal rendelkező kategóriák jelennek meg (a szerver ismert szolgáltatásai alapján); kikapcsolható.
- Admin: „Minden kapcsoló alapból bekapcsolva” (figyelmeztetéssel).
- Anonim mérés elutasításkor: url_passthrough és ads_data_redaction az adminból, a GTM Init tagbe a szinkronnal.
- A 360 Consent sütije elfogadáskor 1 évig, elutasításkor csak a böngésző bezárásáig él.
- A Google Tag Manager a Statisztika kategóriában jelenik meg.

## 1.3.0 – 2026-09-30
- **Szerveroldali feltérképezés:** a szerver maga szkenneli az oldalt (sitemap + GTM konténer), domainenként állítható gyakorisággal (naponta … havonta) és léptékkel (5–100 oldal); a látogatói visszajelzés aránya is állítható. „Szkennelés most” gomb az adminban. Az ütemezett szkennelés a konfiguráció-kérés után, a válasz lezárása után fut.
- **GTM fül:** a konténer tagjei típussal, szolgáltatással, kategóriával és consent-feltétellel.
- **Automatikus consent a GTM-ben** (`tools/gtm-sync.mjs`): a besorolás alapján beállítja a tagek consent-feltételét, a `gtm_consent_update` triggert és az oldalankénti egyszeri futást; egyetlen „360 Consent szinkron” munkaterületet használ.
- **Saját dizájn:** CSS és JS domainenként; a JS a `render` és a `decision` eseményre is feliratkozhat.
- Az „Összes elutasítása” a panelen is kikapcsolható.

## 1.2.0 – 2026-09-30
- **Admin** (https://360-marketing.hu/c360/admin/): domainenkénti beállítások belépéssel, a telepítések nyilvántartása (mely domainen, mely oldalakon, milyen verzióval fut), a felismert szolgáltatások és ismeretlen sütik kezelése, élő előnézet.
- Elhelyezés: középen, fent, lent, bal vagy jobb oldalt, állítható szélességgel.
- Nagy „Összes elfogadása”, kicsi „Testreszabás” (és kikapcsolható első rétegbeli elutasítás).
- Nyelvválasztó a bannerben; a látogató választását a `c360_lang` süti jegyzi meg.
- „Engedélyek beállítása” panel: lenyitható kategóriák, Süti / Időtartam / Leírás tábla; a szolgáltatások magyar és angol leírást kaptak.
- Az adminban kategóriák ki/be kapcsolhatók, a szolgáltatások átsorolhatók, a szövegek nyelvenként felülírhatók.
- Telepítés-visszajelzés: a látogatások kis mintája (alapból 2%) jelzi, hol fut a popup és mit ismert fel (süti-érték és IP nélkül).

## 1.1.0 – 2026-09-30
- Szolgáltatás-felismerés: a „Testreszabás” nézetben kategóriánként látszik, milyen szolgáltatások (GA4, Clarity, Meta Pixel, YouTube…) futnak az oldalon, a sütijeikkel és azok élettartamával együtt. Forrás: betöltött szkriptek, iframe-ek, hálózati kérések, sütik, a GTM konténer konfigurációja és a `sites/<domain>.json`.
- Kategórialeírások 14 nyelven.
- `C360Consent.scan()`: konzolos táblázat a felismert JS-ekről és az ismeretlen külső domainekről.
- `tools/scan.mjs`: a teljes oldal feltérképezése (sitemap + GTM), riport figyelmeztetésekkel, és a `sites/<domain>.json` elkészítése.
- `data/providers.json`: 38 ismert szolgáltatás (köztük a régi CMP-k: CookieYes, Cookiebot, OneTrust…); a `dist/` fájlt a `tools/build.mjs` állítja elő.

## 1.0.0 – 2026-09-30
- Első kiadás: Consent Mode v2 popup, 4 kategória, 14 nyelv, `c360_consent` süti, `gtm_consent_update` esemény.
