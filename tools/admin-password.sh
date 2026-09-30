#!/bin/bash
# A 360 Consent admin jelszavának beállítása belépés nélkül (elfelejtett jelszó, kizárás).
# A jelszót itt, a terminálban kell megadni; csak a hash-e kerül a szerverre.
# A 15 perces belépési tiltást is feloldja, és frissíti a ~/.config/360-consent/admin.env fájlt.
# Használat: tools/admin-password.sh [felhasználónév]   (alap: laci360)
set -euo pipefail
U="${1:-laci360}"
F="$HOME/.config/360-marketing/tools/ftpc"
ENVF="$HOME/.config/360-consent/admin.env"
umask 077
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT

read -r -s -p "Új jelszó ($U, legalább 12 karakter): " P1; echo
read -r -s -p "Új jelszó még egyszer: " P2; echo
[ "$P1" = "$P2" ] || { echo "A két jelszó nem egyezik."; exit 1; }
[ ${#P1} -ge 12 ] || { echo "Legalább 12 karakter legyen."; exit 1; }

# A meglévő felhasználók megtartása, csak ennek a jelszava változik.
"$F" "c360/data/users.json" -o "$T/users.json" 2>/dev/null || echo '{}' > "$T/users.json"
printf '%s' "$P1" | php -r '
  $u = json_decode((string)file_get_contents($argv[1]), true) ?: [];
  $u[$argv[2]] = ($u[$argv[2]] ?? []) + ["created" => gmdate("c")];
  $u[$argv[2]]["hash"] = password_hash(stream_get_contents(STDIN), PASSWORD_DEFAULT);
  $u[$argv[2]]["changed"] = gmdate("c");
  file_put_contents($argv[1], json_encode($u, JSON_PRETTY_PRINT));
' "$T/users.json" "$U"

"$F" "c360/data/users.json" -T "$T/users.json" -o /dev/null
r=$("$F" "c360/data/users.json" -I 2>/dev/null | grep -i content-length | tr -dc 0-9)
[ "$r" = "$(wc -c < "$T/users.json" | tr -d ' ')" ] || { echo "HIBA: a feltöltött fájl mérete eltér, próbáld újra."; exit 1; }
echo '{}' > "$T/attempts.json"
"$F" "c360/data/attempts.json" -T "$T/attempts.json" -o /dev/null   # belépési tiltás feloldása

mkdir -p "$(dirname "$ENVF")"
printf 'C360_ADMIN_URL=https://360-marketing.hu/c360/admin/\nC360_ADMIN_USER=%s\nC360_ADMIN_PASSWORD=%s\n' "$U" "$P1" > "$ENVF"
chmod 600 "$ENVF"
echo "Kész: $U új jelszava él, a tiltás feloldva. Belépés: https://360-marketing.hu/c360/admin/"
