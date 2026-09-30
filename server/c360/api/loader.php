<?php
// Nyilvános betöltő: a GTM-tag ezt tölti be (?host=domain). Egy kérésben adja a domain beállításait és
// a popup pontos, aktuális verzióját a jsDelivr-ről (az örökre cache-elhető, így új kiadás azonnal mindenhol él).
declare(strict_types=1);
require __DIR__ . '/../lib.php';

header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: no-cache');
header('Access-Control-Allow-Origin: *');
header('X-Content-Type-Options: nosniff');

$host = c360_host($_GET['host'] ?? '');
$site = $host !== '' ? c360_load_site($host) : null;
$cfg = $host !== '' ? c360_public_config($site) : [];
$ver = (string)(c360_read(__DIR__ . '/../version.json', [])['version'] ?? '1');
if (!preg_match('/^\d+(\.\d+){0,2}$/', $ver)) $ver = '1';
$src = 'https://cdn.jsdelivr.net/gh/pengemedia-fejlesztes/360-consent@' . $ver . '/dist/c360-consent.min.js';
$flags = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP;

$due = false;
if ($site) {
    require_once __DIR__ . '/../scanner.php';
    $due = c360_scan_due($site);
}
$out = '/*! 360 Consent betöltő ' . $ver . " */\n"
    . 'window.C360_REMOTE=' . json_encode(['host' => $host, 'config' => (object)$cfg], $flags) . ";\n"
    . '(function(d){if(d.getElementById("c360-js"))return;var s=d.createElement("script");s.id="c360-js";s.async=true;s.src=' . json_encode($src, $flags) . ';d.head.appendChild(s);})(document);' . "\n";
if (!$due) { echo $out; exit; }
header('Content-Length: ' . strlen($out));
header('Connection: close');
echo $out;
c360_finish_response(); // az esedékes ütemezett szkennelés a válasz után fut
c360_run_scan($host);
