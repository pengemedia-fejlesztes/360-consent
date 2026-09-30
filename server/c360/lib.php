<?php
// 360 Consent – szerveroldali közös függvények (PHP 7.4+). Tárolás: JSON fájlok a data/ mappában (kívülről tiltva).
declare(strict_types=1);

const C360_DATA = __DIR__ . '/data';
const C360_CATS = ['necessary', 'preferences', 'statistics', 'marketing'];
const C360_LANGS = ['hu', 'en', 'de', 'es', 'fr', 'it', 'pt', 'ro', 'sk', 'bg', 'hr', 'cs', 'pl', 'ja'];
const C360_PLACEMENTS = ['center', 'top', 'bottom', 'left', 'right'];
const C360_MAX_SITES = 1000;
// Kategória -> a GTM tag consent-feltétele (további jóváhagyás)
const C360_CAT_CONSENT = ['necessary' => [], 'preferences' => ['personalization_storage'], 'statistics' => ['analytics_storage'], 'marketing' => ['ad_storage']];

function c360_host($h): string
{
    $h = strtolower(trim((string)$h));
    $h = preg_replace('/^www\./', '', $h);
    return (preg_match('/^[a-z0-9-]+(\.[a-z0-9-]+)+$/', $h) && strlen($h) <= 253) ? $h : '';
}

function c360_read(string $file, $default)
{
    if (!is_file($file)) return $default;
    $fp = fopen($file, 'rb');
    if (!$fp) return $default;
    flock($fp, LOCK_SH);
    $raw = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    $data = json_decode((string)$raw, true);
    return is_array($data) ? $data : $default;
}

function c360_write(string $file, $data): void
{
    $dir = dirname($file);
    if (!is_dir($dir)) mkdir($dir, 0750, true);
    $tmp = $file . '.' . bin2hex(random_bytes(4)) . '.tmp';
    file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT), LOCK_EX);
    rename($tmp, $file); // atomikus csere
}

function c360_site_file(string $host): string
{
    return C360_DATA . '/sites/' . $host . '.json';
}

function c360_load_site(string $host): ?array
{
    $f = c360_site_file($host);
    return is_file($f) ? c360_read($f, null) : null;
}

function c360_list_hosts(): array
{
    $out = [];
    foreach (glob(C360_DATA . '/sites/*.json') ?: [] as $f) $out[] = basename($f, '.json');
    sort($out);
    return $out;
}

function c360_new_site(string $host, string $status): array
{
    $now = gmdate('c');
    return [
        'host' => $host,
        'status' => $status, // active | discovered | disabled
        'created' => $now,
        'updated' => $now,
        'config' => (object)[],
        'install' => ['firstSeen' => null, 'lastSeen' => null, 'pings' => 0, 'versions' => (object)[], 'langs' => (object)[], 'pages' => (object)[], 'placement' => null],
        'detected' => ['services' => (object)[], 'cookies' => (object)[], 'hosts' => (object)[]],
    ];
}

function c360_providers(): array
{
    static $p = null;
    if ($p === null) {
        $p = [];
        foreach (c360_read(__DIR__ . '/providers.json', []) as $x) $p[$x['id']] = $x;
    }
    return $p;
}

function c360_json($data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function c360_str($v, int $max): string
{
    $s = trim((string)$v);
    return function_exists('mb_substr') ? mb_substr($s, 0, $max) : substr($s, 0, $max);
}

// { hu: '…', en: '…' } – csak ismert nyelvek, hosszkorláttal
function c360_loc($v, int $max): array
{
    $out = [];
    if (!is_array($v)) return $out;
    foreach (C360_LANGS as $l) {
        if (isset($v[$l]) && trim((string)$v[$l]) !== '') $out[$l] = c360_str($v[$l], $max);
    }
    return $out;
}

// Az adminból érkező beállítás tisztítása – csak ismert kulcsok és értékek maradnak.
function c360_clean_config($c): array
{
    $c = is_array($c) ? $c : [];
    $o = [];
    if (in_array($c['placement'] ?? '', C360_PLACEMENTS, true)) $o['placement'] = $c['placement'];
    if (isset($c['size']) && is_numeric($c['size'])) $o['size'] = max(0, min(100, (int)$c['size']));
    foreach (['acceptLarge', 'showReject', 'showRejectPanel', 'langSwitcher', 'showBranding', 'preChecked', 'hideEmpty', 'urlPassthrough', 'adsRedaction'] as $k) if (isset($c[$k])) $o[$k] = (bool)$c[$k];
    if (isset($c['pingRate']) && is_numeric($c['pingRate'])) $o['pingRate'] = max(0, min(1, (float)$c['pingRate']));
    // Saját dizájn: CSS a banner stílusai után, JS a banner felépítése után fut (csak adminból állítható).
    if (isset($c['customCss']) && trim((string)$c['customCss']) !== '') $o['customCss'] = substr((string)$c['customCss'], 0, 20000);
    if (isset($c['customJs']) && trim((string)$c['customJs']) !== '') $o['customJs'] = substr((string)$c['customJs'], 0, 20000);
    if (isset($c['position']) && in_array($c['position'], ['left', 'right'], true)) $o['position'] = $c['position'];
    if (isset($c['brandColor']) && preg_match('/^#[0-9a-fA-F]{6}$/', (string)$c['brandColor'])) $o['brandColor'] = $c['brandColor'];
    if (isset($c['policyUrl']) && preg_match('~^(https?://|/)[^\s"<>]*$~', (string)$c['policyUrl'])) $o['policyUrl'] = c360_str($c['policyUrl'], 300);
    if (isset($c['forceLang']) && in_array($c['forceLang'], C360_LANGS, true)) $o['forceLang'] = $c['forceLang'];
    if (isset($c['languages']) && is_array($c['languages'])) $o['languages'] = array_values(array_intersect(C360_LANGS, $c['languages']));
    $texts = [];
    foreach (C360_LANGS as $l) {
        $t = $c['texts'][$l] ?? null;
        if (!is_array($t)) continue;
        $e = [];
        foreach (['title' => 200, 'text' => 2000, 'acceptAll' => 60, 'customize' => 60, 'rejectAll' => 60, 'save' => 60, 'panelTitle' => 120] as $k => $max) {
            if (isset($t[$k]) && trim((string)$t[$k]) !== '') $e[$k] = c360_str($t[$k], $max);
        }
        if ($e) $texts[$l] = $e;
    }
    $o['texts'] = (object)$texts;
    $cats = [];
    foreach (['preferences', 'statistics', 'marketing', 'necessary'] as $k) {
        $x = $c['categories'][$k] ?? null;
        if (!is_array($x)) continue;
        $e = [];
        if ($k !== 'necessary' && isset($x['enabled'])) $e['enabled'] = (bool)$x['enabled'];
        $desc = c360_loc($x['desc'] ?? null, 600);
        if ($desc) $e['desc'] = $desc;
        if ($e) $cats[$k] = $e;
    }
    $o['categories'] = (object)$cats;
    $svcs = [];
    foreach (is_array($c['services'] ?? null) ? $c['services'] : [] as $s) {
        if (!is_array($s) || !preg_match('/^[a-z0-9:_-]{1,60}$/', (string)($s['id'] ?? ''))) continue;
        $e = ['id' => $s['id']];
        if (in_array($s['cat'] ?? '', C360_CATS, true)) $e['cat'] = $s['cat'];
        if (!empty($s['hidden'])) $e['hidden'] = true;
        $name = is_array($s['name'] ?? null) ? c360_loc($s['name'], 80) : c360_str($s['name'] ?? '', 80);
        if ($name) $e['name'] = $name;
        $desc = c360_loc($s['desc'] ?? null, 600);
        if ($desc) $e['desc'] = $desc;
        $cookies = [];
        foreach (is_array($s['cookies'] ?? null) ? $s['cookies'] : [] as $ck) {
            if (!is_array($ck) || !preg_match('/^[\w.\-*:%@\/]{1,80}$/u', (string)($ck[0] ?? ''))) continue;
            $dur = preg_match('/^(s|\d{1,4}(min|h|d|mo|y))$/', (string)($ck[1] ?? '')) ? $ck[1] : 's';
            $row = [$ck[0], $dur];
            $cd = c360_loc($ck[2] ?? null, 400);
            if ($cd) $row[] = $cd;
            $cookies[] = $row;
            if (count($cookies) >= 50) break;
        }
        if ($cookies) $e['cookies'] = $cookies;
        $svcs[] = $e;
        if (count($svcs) >= 200) break;
    }
    $o['services'] = $svcs;
    return $o;
}

// Domain-szintű, nem a bannerbe kerülő beállítások
function c360_clean_scan_settings($x): array
{
    $x = is_array($x) ? $x : [];
    $every = (int)($x['everyDays'] ?? 7);
    return [
        'enabled' => !empty($x['enabled']),
        'everyDays' => in_array($every, [1, 3, 7, 14, 30], true) ? $every : 7,
        'maxPages' => max(5, min(100, (int)($x['maxPages'] ?? 20))),
    ];
}

function c360_clean_gtm_settings($x): array
{
    $x = is_array($x) ? $x : [];
    return ['enabled' => !empty($x['enabled']), 'autoPublish' => !empty($x['autoPublish'])];
}

function c360_cors(): void
{
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
}
