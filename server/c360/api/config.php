<?php
// Nyilvános: egy domain banner-beállításai. GET ?host=domain.hu
declare(strict_types=1);
require __DIR__ . '/../lib.php';

c360_cors();
header('Cache-Control: public, max-age=300');

$host = c360_host($_GET['host'] ?? '');
if ($host === '') c360_json(['error' => 'host'], 400);

$site = c360_load_site($host);
$cfg = [];
if ($site && ($site['status'] ?? '') === 'active') {
    $cfg = is_array($site['config'] ?? null) ? $site['config'] : [];
}
foreach (['texts', 'categories'] as $k) if (isset($cfg[$k]) && !$cfg[$k]) $cfg[$k] = (object)[];
// Ha régóta nem jött jelzés, több látogató jelezzen vissza, hogy a nyilvántartás gyorsan frissüljön.
$last = $site['install']['lastSeen'] ?? null;
$base = isset($cfg['pingRate']) ? (float)$cfg['pingRate'] : 0.02; // az adminban állított mintavétel
$cfg['pingRate'] = ($last && strtotime($last) > time() - 12 * 3600) ? $base : max($base, 0.25);
if ($site && ($site['status'] ?? '') === 'disabled') $cfg['pingRate'] = 0;

// A választ nem tartja fel: az esedékes ütemezett szkennelés a válasz lezárása után fut.
$due = false;
if ($site) {
    require_once __DIR__ . '/../scanner.php';
    $due = c360_scan_due($site);
}
if (!$due) c360_json(['host' => $host, 'config' => (object)$cfg]);
http_response_code(200);
header('Content-Type: application/json; charset=utf-8');
$out = json_encode(['host' => $host, 'config' => (object)$cfg], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
header('Content-Length: ' . strlen($out));
header('Connection: close');
echo $out;
c360_finish_response();
c360_run_scan($host);
