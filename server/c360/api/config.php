<?php
// Nyilvános: egy domain banner-beállításai. GET ?host=domain.hu
declare(strict_types=1);
require __DIR__ . '/../lib.php';

c360_cors();
// Minden oldalbetöltéskor újraellenőrzi (ETag / 304), így a mentett beállítás azonnal él.
header('Cache-Control: no-cache');

$host = c360_host($_GET['host'] ?? '');
if ($host === '') c360_json(['error' => 'host'], 400);

$site = c360_load_site($host);
$cfg = c360_public_config($site);
$due = false;
if ($site) {
    require_once __DIR__ . '/../scanner.php';
    $due = c360_scan_due($site);
}
$out = json_encode(['host' => $host, 'config' => (object)$cfg], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$etag = '"' . substr(sha1($out), 0, 16) . '"';
header('ETag: ' . $etag);
if (!$due && trim((string)($_SERVER['HTTP_IF_NONE_MATCH'] ?? '')) === $etag) { http_response_code(304); exit; }
if (!$due) { header('Content-Type: application/json; charset=utf-8'); echo $out; exit; }
http_response_code(200);
header('Content-Type: application/json; charset=utf-8');
header('Content-Length: ' . strlen($out));
header('Connection: close');
echo $out;
c360_finish_response();
c360_run_scan($host);
