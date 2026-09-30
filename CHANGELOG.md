# Változásnapló

## 1.1.0 – 2026-09-30
- Szolgáltatás-felismerés: a „Testreszabás” nézetben kategóriánként látszik, milyen szolgáltatások (GA4, Clarity, Meta Pixel, YouTube…) futnak az oldalon, a sütijeikkel és azok élettartamával együtt. Forrás: betöltött szkriptek, iframe-ek, hálózati kérések, sütik, a GTM konténer konfigurációja és a `sites/<domain>.json`.
- Kategórialeírások 14 nyelven.
- `C360Consent.scan()`: konzolos táblázat a felismert JS-ekről és az ismeretlen külső domainekről.
- `tools/scan.mjs`: a teljes oldal feltérképezése (sitemap + GTM), riport figyelmeztetésekkel, és a `sites/<domain>.json` elkészítése.
- `data/providers.json`: 38 ismert szolgáltatás (köztük a régi CMP-k: CookieYes, Cookiebot, OneTrust…); a `dist/` fájlt a `tools/build.mjs` állítja elő.

## 1.0.0 – 2026-09-30
- Első kiadás: Consent Mode v2 popup, 4 kategória, 14 nyelv, `c360_consent` süti, `gtm_consent_update` esemény.
