# 360 Consent – first-party betöltő (WordPress)

## Miért kell
A consent-bannert alapból a GTM Custom HTML tag tölti be. A **Safari privát mód** (és a
fejlett követésvédelem) a Google Tag Managert ismert követőként **blokkolja**, így a GTM-en
át érkező consent ott nem jelenik meg. Ez a mu-plugin a loadert **közvetlenül** az oldal
`<head>`-jébe teszi (first-party), a GTM megkerülésével — így Safari inkognitóban is feljön.

A GTM-es tag maradhat: a loader guard-olt (`c360-loader` id), nem tölt kétszer.

## Telepítés
Másold a fájlt az oldal `wp-content/mu-plugins/` mappájába:

```
wp-content/mu-plugins/360-consent-firstparty.php
```

Az mu-plugin mindig aktív, nem kell bekapcsolni. Ha az adatkezelési tájékoztató útja más,
a `wp-config.php`-ban felülírható:

```php
define('C360_POLICY_URL', '/adatkezelesi-tajekoztato/');
```

## Működés (4.0.0)
A popup JS-t és a domain-configot egy WP-Cron feladat 15 percenként lehúzza (jsDelivr + 360-marketing.hu) és
statikus fájlba írja: `wp-content/uploads/c360/`. Oldalbetöltéskor csak a fájl olvasása történik, adatbázis-írás
nincs. Kiadás után a jsDelivr ág-cache-ét üríteni kell, különben az új verzió órákig késhet:
`https://purge.jsdelivr.net/gh/pengemedia-fejlesztes/360-consent@1/dist/c360-consent.js`

## Érintett oldalak (4.0.0 telepítve: 2026-11-04)
- fuvarozas-szallitmanyozas.com (pengemed cPanel)
- mrbighungary.hu (mrbighun cPanel)
