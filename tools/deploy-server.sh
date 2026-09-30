#!/bin/bash
# A szerveroldal (server/c360) feltöltése a 360-marketing.hu tárhelyére: https://360-marketing.hu/c360/
# A data/ mappához (felhasználók, domainek) NEM nyúl. 8 KB-os darabokban tölt fel (a nagy fájl egyben elakad),
# és minden fájl méretét ellenőrzi a szerveren.
# Használat: node tools/build.mjs && tools/deploy-server.sh
set -euo pipefail
F="$HOME/.config/360-marketing/tools/ftpc"
L="$(cd "$(dirname "$0")/.." && pwd)/server/c360"
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
fail=0
for f in .htaccess lib.php providers.json c360-consent.js api/config.php api/ping.php \
         admin/.htaccess admin/auth.php admin/index.php admin/api.php admin/app.js admin/app.css admin/defaults.json; do
  rm -f "$T"/p_*; split -b 8000 "$L/$f" "$T/p_"; first=1
  for p in "$T"/p_*; do
    for i in 1 2 3; do
      if [ $first = 1 ]; then c=$("$F" "c360/$f" -T "$p" --ftp-create-dirs -o /dev/null -w "%{http_code}" 2>/dev/null || true)
      else c=$("$F" "c360/$f" -T "$p" --append -o /dev/null -w "%{http_code}" 2>/dev/null || true); fi
      [ "$c" = "226" ] && break; sleep 2
    done
    first=0
  done
  r=$("$F" "c360/$f" -I 2>/dev/null | grep -i content-length | tr -dc 0-9 || true)
  l=$(wc -c < "$L/$f" | tr -d ' ')
  if [ "$r" = "$l" ]; then echo "OK    $f"; else echo "HIBA  $f (szerver=$r, helyi=$l)"; fail=1; fi
done
exit $fail
