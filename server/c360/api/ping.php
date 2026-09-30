<?php
// Nyilvános: telepítés-visszajelzés a popupból (sendBeacon, text/plain JSON).
// Tárolja, hol fut a popup (domain, oldalak, verzió, nyelv) és mit ismert fel (szolgáltatások, süti-nevek).
// Süti-értéket, IP-címet és query stringet nem tárol.
declare(strict_types=1);
require __DIR__ . '/../lib.php';

c360_cors();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') c360_json(['error' => 'method'], 405);

$raw = file_get_contents('php://input', false, null, 0, 16384);
$p = json_decode((string)$raw, true);
if (!is_array($p)) c360_json(['error' => 'body'], 400);

$host = c360_host($p['host'] ?? '');
if ($host === '') c360_json(['error' => 'host'], 400);

// Csak arról a domainről fogadjuk el, amelyikről szól (Origin, ennek hiányában Referer).
$from = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
$fromHost = c360_host((string)parse_url((string)$from, PHP_URL_HOST));
if ($fromHost !== $host) c360_json(['error' => 'origin'], 403);

$site = c360_load_site($host);
if (!$site) {
    if (count(c360_list_hosts()) >= C360_MAX_SITES) c360_json(['error' => 'limit'], 429);
    $site = c360_new_site($host, 'discovered');
}
if (($site['status'] ?? '') === 'disabled') c360_json(['ok' => true], 202);

// Ugyanarról a domainről legfeljebb 20 másodpercenként írunk.
$last = $site['install']['lastWrite'] ?? null;
if ($last && strtotime($last) > time() - 20) c360_json(['ok' => true, 'throttled' => true], 202);

$now = gmdate('c');
$in = &$site['install'];
$in['firstSeen'] = $in['firstSeen'] ?? $now;
$in['lastSeen'] = $now;
$in['lastWrite'] = $now;
$in['pings'] = (int)($in['pings'] ?? 0) + 1;

$bump = function (&$map, string $key, int $cap) use ($now) {
    $map = (array)$map;
    $map[$key] = $now;
    if (count($map) > $cap) { arsort($map); $map = array_slice($map, 0, $cap, true); }
};
$ver = (string)($p['version'] ?? '');
if (preg_match('/^\d+\.\d+\.\d+$/', $ver)) $bump($in['versions'], $ver, 10);
$lang = (string)($p['lang'] ?? '');
if (in_array($lang, C360_LANGS, true)) $bump($in['langs'], $lang, 20);
$path = (string)($p['path'] ?? '');
if ($path !== '' && $path[0] === '/' && strlen($path) <= 200 && !preg_match('/[\s<>"]/', $path)) $bump($in['pages'], $path, 100);
if (in_array($p['placement'] ?? '', C360_PLACEMENTS, true)) $in['placement'] = $p['placement'];
unset($in);

$det = &$site['detected'];
$prov = c360_providers();
$svcs = (array)$det['services'];
foreach (is_array($p['services'] ?? null) ? array_slice($p['services'], 0, 60) : [] as $s) {
    $id = (string)($s['id'] ?? '');
    if (!isset($prov[$id])) continue;
    $via = array_values(array_intersect(['self', 'gtm', 'script', 'iframe', 'img', 'link', 'div', 'network', 'cookie', 'site-scan'], (array)($s['via'] ?? [])));
    $old = $svcs[$id] ?? ['firstSeen' => $now, 'via' => []];
    $svcs[$id] = ['firstSeen' => $old['firstSeen'], 'lastSeen' => $now, 'via' => array_values(array_unique(array_merge($old['via'], $via)))];
}
$det['services'] = $svcs;
$cookies = (array)$det['cookies'];
foreach (is_array($p['cookies'] ?? null) ? array_slice($p['cookies'], 0, 40) : [] as $name) {
    $name = (string)$name;
    if (!preg_match('/^[\w.\-:%@]{1,80}$/u', $name)) continue;
    $old = $cookies[$name] ?? ['firstSeen' => $now, 'count' => 0];
    $cookies[$name] = ['firstSeen' => $old['firstSeen'], 'lastSeen' => $now, 'count' => (int)$old['count'] + 1];
}
if (count($cookies) > 200) { uasort($cookies, function ($a, $b) { return strcmp($b['lastSeen'], $a['lastSeen']); }); $cookies = array_slice($cookies, 0, 200, true); }
$det['cookies'] = $cookies;
$hosts = (array)$det['hosts'];
foreach (is_array($p['hosts'] ?? null) ? array_slice($p['hosts'], 0, 30) : [] as $h) {
    $h = c360_host($h);
    if ($h !== '') $hosts[$h] = $now;
}
if (count($hosts) > 100) { arsort($hosts); $hosts = array_slice($hosts, 0, 100, true); }
$det['hosts'] = $hosts;
unset($det);

c360_write(c360_site_file($host), $site);
c360_json(['ok' => true], 202);
