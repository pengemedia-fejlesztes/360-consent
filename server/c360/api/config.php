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
$cfg['pingRate'] = ($last && strtotime($last) > time() - 12 * 3600) ? 0.02 : 0.25;
if ($site && ($site['status'] ?? '') === 'disabled') $cfg['pingRate'] = 0;

c360_json(['host' => $host, 'config' => (object)$cfg]);
