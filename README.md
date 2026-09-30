# 360 Consent – Google Consent Mode v2 süti popup

A 360 Marketing saját, ingyenes GCMv2 süti bannere. Google Tag Managerből töltődik be, a kódot a jsDelivr szolgálja ki ebből a repóból, így egy új kiadás minden ügyféloldalon automatikusan megjelenik.

## Felépítés

| Fájl | Szerep | Frissítés |
|---|---|---|
| `dist/c360-consent.js` | A popup | Globális, a jsDelivr `@1` aliasán át |
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

## `C360_CONFIG` beállítások

`policyUrl`, `brandColor`, `position` (`left`/`right`), `cookieDomain`, `forceLang`, `defaultLang`, `showBranding`, `brandUrl`, `cookieDays`.

## Kiadás (globális frissítés)

1. Módosítsd a `dist/c360-consent.js` fájlt, emeld a `version` értékét, és írd be a változást a `CHANGELOG.md`-be.
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
