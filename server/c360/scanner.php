<?php
// 360 Consent – szerveroldali oldal-feltérképezés (a tools/scan.mjs PHP-változata).
// A sitemap oldalait és a GTM konténert nézi át; eredmény: site['scan'].
declare(strict_types=1);

const C360_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36 360-consent-scan';
const C360_GOOGLE_TAGS = ['__googtag' => 'Google tag', '__gaawe' => 'GA4 esemény', '__awct' => 'Google Ads konverzió', '__sp' => 'Google Ads remarketing',
    '__gclidw' => 'Konverziós linker', '__flc' => 'Floodlight számláló', '__fls' => 'Floodlight értékesítés', '__ua' => 'Universal Analytics', '__baut' => 'Microsoft Ads UET'];
const C360_LISTENERS = ['__lcl' => 'Link-kattintás figyelő', '__sdl' => 'Görgetés figyelő', '__fsl' => 'Űrlapküldés figyelő', '__cl' => 'Kattintás figyelő', '__tl' => 'Időzítő', '__evl' => 'Láthatóság figyelő', '__ytl' => 'YouTube figyelő', '__hl' => 'Előzmény figyelő', '__jel' => 'JS-hiba figyelő'];

function c360_fetch_many(array $urls, int $timeout = 12): array
{
    $out = [];
    foreach (array_chunk($urls, 6) as $chunk) {
        $mh = curl_multi_init();
        $hs = [];
        foreach ($chunk as $u) {
            $ch = curl_init($u);
            curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 4,
                CURLOPT_TIMEOUT => $timeout, CURLOPT_CONNECTTIMEOUT => 6, CURLOPT_USERAGENT => C360_UA, CURLOPT_ENCODING => '',
                CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS]);
            curl_multi_add_handle($mh, $ch);
            $hs[$u] = $ch;
        }
        do { $st = curl_multi_exec($mh, $run); if ($run) curl_multi_select($mh, 1.0); } while ($run && $st === CURLM_OK);
        foreach ($hs as $u => $ch) {
            $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $body = curl_multi_getcontent($ch);
            $out[$u] = ($code >= 200 && $code < 300 && is_string($body)) ? substr($body, 0, 3000000) : null;
            curl_multi_remove_handle($mh, $ch);
            if (PHP_VERSION_ID < 80000) curl_close($ch);
        }
        curl_multi_close($mh);
    }
    return $out;
}

function c360_fetch(string $url): ?string
{
    return c360_fetch_many([$url])[$url] ?? null;
}

// --- a böngészős kóddal azonos felismerés ---
function c360_parse_url(string $u, string $base): ?array
{
    if (strpos($u, '//') === 0) $u = 'https:' . $u;
    elseif (!preg_match('~^https?://~i', $u)) {
        if ($u === '' || $u[0] === '#' || stripos($u, 'data:') === 0 || stripos($u, 'javascript:') === 0) return null;
        $b = parse_url($base);
        $u = ($b['scheme'] ?? 'https') . '://' . ($b['host'] ?? '') . ($u[0] === '/' ? $u : '/' . $u);
    }
    $p = parse_url($u);
    if (!$p || empty($p['host'])) return null;
    return ['host' => preg_replace('/^www\./', '', strtolower($p['host'])), 'path' => ($p['path'] ?? '/') . (isset($p['query']) ? '?' . $p['query'] : '')];
}

function c360_match_url(string $u, string $base, string $self): ?array
{
    $p = c360_parse_url($u, $base);
    if (!$p || !preg_match('/^[a-z0-9.-]+$/', $p['host'])) return null;
    foreach (c360_providers() as $prov) {
        foreach ($prov['hosts'] ?? [] as $pat) {
            $s = strpos($pat, '/');
            $ph = $s === false ? $pat : substr($pat, 0, $s);
            $pp = $s === false ? '' : substr($pat, $s);
            $ok = $ph === '@self' ? $p['host'] === $self : ($p['host'] === $ph || substr($p['host'], -strlen($ph) - 1) === '.' . $ph);
            if ($ok && ($pp === '' || strpos($p['path'], $pp) === 0)) return $prov;
        }
    }
    return null;
}

function c360_text_match(string $t, string $pat): bool
{
    return strpos($pat, 're:') === 0 ? (bool)preg_match('/' . str_replace('/', '\/', substr($pat, 3)) . '/', $t) : strpos($t, $pat) !== false;
}

function c360_text_providers(string $t): array
{
    $out = [];
    foreach (c360_providers() as $prov) {
        foreach ($prov['gtm'] ?? [] as $g) if (c360_text_match($t, $g)) { $out[] = $prov; break; }
    }
    return $out;
}

function c360_sitemap_urls(string $base): array
{
    $robots = c360_fetch($base . '/robots.txt') ?: '';
    preg_match_all('/^sitemap:\s*(\S+)/im', $robots, $m);
    $maps = $m[1] ?: [$base . '/sitemap_index.xml', $base . '/sitemap.xml', $base . '/wp-sitemap.xml'];
    $pages = []; $seen = [];
    while ($maps && count($seen) < 20) {
        $sm = array_shift($maps);
        if (isset($seen[$sm])) continue;
        $seen[$sm] = 1;
        $xml = c360_fetch($sm);
        if (!$xml) continue;
        preg_match_all('~<loc>\s*([^<\s]+)\s*</loc>~', $xml, $mm);
        foreach ($mm[1] as $loc) {
            $loc = html_entity_decode($loc);
            if (preg_match('/\.xml(\?|$)/', $loc)) $maps[] = $loc; else $pages[$loc] = 1;
        }
    }
    return array_keys($pages);
}

// A gtm.js konténer-konfigurációja ("blob" előtti rész) és a tagek listája.
function c360_gtm_parse(string $js): array
{
    $cut = strpos($js, '"blob":{');
    if ($cut === false) $cut = strpos($js, '"security_groups"');
    if ($cut === false) return ['conf' => '', 'tags' => []];
    $conf = substr($js, 0, $cut);
    $tags = [];
    $i = strpos($conf, '"tags":[');
    $seg = $i === false ? '' : substr($conf, $i, 400000);
    if (preg_match_all('/\{"function":"(__[a-z0-9_]+)"(.*?)"tag_id":(\d+)\}/s', $seg, $mm, PREG_SET_ORDER)) {
        foreach ($mm as $m) {
            $fn = $m[1]; $body = $m[2];
            $consent = [];
            if (preg_match('/"consent":\["list",([^\]]*)\]/', $body, $c)) {
                preg_match_all('/"([a-z_]+)"/', $c[1], $cc);
                $consent = $cc[1];
            }
            $tag = ['id' => (int)$m[3], 'function' => $fn, 'consent' => $consent, 'paused' => $fn === '__paused'];
            $html = '';
            if (preg_match('/"vtp_html":(\["[^"]*",)?"((?:[^"\\\\]|\\\\.)*)"/s', $body, $h)) $html = (string)json_decode('"' . $h[2] . '"');
            if ($fn === '__paused') $tag['type'] = 'Szüneteltetett tag';
            elseif (isset(C360_GOOGLE_TAGS[$fn])) { $tag['type'] = C360_GOOGLE_TAGS[$fn]; $tag['google'] = true; }
            elseif (isset(C360_LISTENERS[$fn])) { $tag['type'] = C360_LISTENERS[$fn]; $tag['listener'] = true; }
            elseif ($fn === '__html') $tag['type'] = 'Egyéni HTML';
            elseif (strpos($fn, '__cvt_') === 0) $tag['type'] = 'Egyéni sablon';
            else $tag['type'] = $fn;
            $provs = c360_text_providers($html . "\n" . str_replace('\\/', '/', $body));
            if ($fn === '__gaawe' || ($fn === '__googtag' && preg_match('/G-[A-Z0-9]{6,}/', $body))) $provs = [c360_providers()['ga4']];
            if ($fn === '__awct' || $fn === '__sp' || $fn === '__gclidw') $provs = [c360_providers()['google-ads']];
            if ($provs) { $tag['service'] = $provs[0]['id']; $tag['cat'] = $provs[0]['cat']; }
            $tags[] = $tag;
            if (count($tags) >= 300) break;
        }
    }
    return ['conf' => $conf, 'tags' => $tags];
}

function c360_scan_site(string $host, int $maxPages): array
{
    $maxPages = max(1, min(100, $maxPages));
    $base = 'https://' . $host;
    $home = c360_fetch($base . '/');
    if ($home === null) { $base = 'https://www.' . $host; $home = c360_fetch($base . '/'); }
    $all = c360_sitemap_urls($base);
    $pages = [$base . '/'];
    if ($all) {
        $step = max(1, count($all) / max(1, $maxPages - 1));
        for ($i = 0.0; $i < count($all) && count($pages) < $maxPages; $i += $step) $pages[] = $all[(int)$i];
    }
    $pages = array_values(array_unique($pages));
    $found = []; $unknown = []; $gtmIds = [];
    $hit = function (array $prov, string $where, string $place) use (&$found) {
        if (($prov['cat'] ?? '') === 'infra') return;
        $f = $found[$prov['id']] ?? ['id' => $prov['id'], 'html' => [], 'gtm' => []];
        $f[$where][$place] = 1;
        $found[$prov['id']] = $f;
    };
    $bodies = c360_fetch_many($pages);
    if ($home !== null) $bodies[$base . '/'] = $home;
    foreach ($bodies as $url => $html) {
        if ($html === null) continue;
        $path = parse_url($url, PHP_URL_PATH) ?: '/';
        $markup = preg_replace('~(<script\b[^>]*>)[\s\S]*?</script>~i', '$1</script>', $html);
        preg_match_all('~<(?:script|iframe|img|embed|div|video)\b[^>]*?\s(?:src|data-src|data-lazy-src)=["\']([^"\']+)["\']~i', $markup, $m1);
        preg_match_all('~<link\b[^>]*rel=["\'](?:preconnect|dns-prefetch|preload)["\'][^>]*href=["\']([^"\']+)["\']~i', $markup, $m2);
        foreach (array_merge($m1[1], $m2[1]) as $u) {
            $u = html_entity_decode($u);
            $prov = c360_match_url($u, $url, $host);
            if ($prov) { $hit($prov, 'html', $path); continue; }
            $p = c360_parse_url($u, $url);
            if ($p && $p['host'] !== $host && preg_match('~^(https?:)?//~', $u)) $unknown[$p['host']] = 1;
        }
        preg_match_all('~<script\b(?![^>]*\ssrc=)[^>]*>([\s\S]*?)</script>~i', $html, $m3);
        foreach ($m3[1] as $body) if (trim($body) !== '') foreach (c360_text_providers($body) as $prov) $hit($prov, 'html', $path);
        preg_match_all('/GTM-[A-Z0-9]{4,9}/', $html, $m4);
        foreach ($m4[0] as $id) $gtmIds[$id] = 1;
    }
    $gtmTags = [];
    foreach (array_keys($gtmIds) as $id) {
        $js = c360_fetch('https://www.googletagmanager.com/gtm.js?id=' . $id);
        if (!$js) continue;
        $g = c360_gtm_parse($js);
        foreach (c360_text_providers($g['conf']) as $prov) $hit($prov, 'gtm', $id);
        preg_match_all('~https?://[a-z0-9.-]+\.[a-z]{2,}[^\s"\'<>\\\\)]*~i', str_replace('\\/', '/', $g['conf']), $mu);
        foreach ($mu[0] as $u) {
            $prov = c360_match_url($u, $base, $host);
            if ($prov) $hit($prov, 'gtm', $id);
            else { $p = c360_parse_url($u, $base); if ($p && $p['host'] !== $host) $unknown[$p['host']] = 1; }
        }
        foreach ($g['tags'] as $t) { $t['container'] = $id; $gtmTags[] = $t; if (!empty($t['service']) && empty($t['paused'])) $hit(c360_providers()[$t['service']], 'gtm', $id); }
    }
    $prov = c360_providers();
    $services = []; $warnings = [];
    foreach ($found as $id => $f) {
        $p = $prov[$id];
        $services[$id] = ['via' => array_values(array_filter([$f['gtm'] ? 'gtm' : null, $f['html'] ? 'html' : null])), 'pages' => count($f['html'])];
        $self = (bool)array_filter($p['hosts'] ?? [], function ($h) { return strpos($h, '@self') === 0; });
        if ($f['html'] && ($p['cat'] ?? '') !== 'necessary' && empty($p['gcm']) && !$self) {
            $warnings[] = $p['name'] . ': közvetlenül az oldal kódjában van (pl. ' . array_key_first($f['html']) . '), a süti popup ezt NEM tartja vissza. '
                . (!empty($p['embed']) ? 'Beágyazás: youtube-nocookie.com vagy kattintásra betöltés javasolt.' : 'Tedd át GTM-be consent-feltétellel.');
        }
    }
    $cmps = array_filter(array_keys($found), function ($id) use ($prov) { return !empty($prov[$id]['cmp']) || $id === 'c360'; });
    if (count($cmps) > 1) array_unshift($warnings, 'Több süti kezelő fut egyszerre: ' . implode(', ', array_map(function ($id) use ($prov) { return $prov[$id]['name']; }, $cmps)) . '.');
    // Nem Google-os, nem figyelő tag consent-feltétel nélkül
    foreach ($gtmTags as $t) {
        if (!empty($t['paused']) || !empty($t['google']) || !empty($t['listener']) || empty($t['service'])) continue;
        $need = C360_CAT_CONSENT[$t['cat']] ?? [];
        if ($need && !array_intersect($need, $t['consent'])) $warnings[] = 'GTM tag #' . $t['id'] . ' (' . $prov[$t['service']]['name'] . '): nincs ' . implode('/', $need) . ' consent-feltétele.';
    }
    ksort($unknown);
    return ['scannedAt' => gmdate('c'), 'pages' => count(array_filter($bodies)), 'gtm' => array_keys($gtmIds), 'services' => $services,
        'gtmTags' => $gtmTags, 'unknownHosts' => array_slice(array_keys($unknown), 0, 60), 'warnings' => $warnings];
}

// Esedékes-e az ütemezett szkennelés?
function c360_scan_due(array $site): bool
{
    $s = c360_clean_scan_settings($site['scanSettings'] ?? ['enabled' => true]); // alapból hetente, 20 oldal
    if (empty($s['enabled']) || ($site['status'] ?? '') !== 'active') return false;
    $last = $site['scan']['scannedAt'] ?? null;
    $every = max(1, (int)($s['everyDays'] ?? 7));
    return !$last || strtotime($last) < time() - $every * 86400;
}

// Szkennelés zárral (egyszerre csak egy fut domainenként), az eredmény a site-ba kerül.
function c360_run_scan(string $host): ?array
{
    $lock = C360_DATA . '/scan-' . $host . '.lock';
    $fp = fopen($lock, 'c');
    if (!$fp || !flock($fp, LOCK_EX | LOCK_NB)) return null;
    @set_time_limit(180);
    $site = c360_load_site($host);
    $scan = c360_scan_site($host, c360_clean_scan_settings($site['scanSettings'] ?? [])['maxPages']);
    $site = c360_load_site($host) ?: $site; // közben változhatott
    $site['scan'] = $scan;
    c360_write(c360_site_file($host), $site);
    flock($fp, LOCK_UN);
    fclose($fp);
    return $scan;
}

// A válasz lezárása, hogy a háttérmunka ne tartsa fel a kérőt.
function c360_finish_response(): void
{
    ignore_user_abort(true);
    if (function_exists('fastcgi_finish_request')) { fastcgi_finish_request(); return; }
    if (function_exists('litespeed_finish_request')) { litespeed_finish_request(); return; }
    @ob_end_flush();
    flush();
}
