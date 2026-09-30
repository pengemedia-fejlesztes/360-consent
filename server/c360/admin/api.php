<?php
// 360 Consent admin – JSON API (csak belépve; írásnál CSRF-fejléc kell).
declare(strict_types=1);
require __DIR__ . '/auth.php';

$user = c360_user();
if (!$user) c360_json(['error' => 'auth'], 401);

$a = (string)($_GET['a'] ?? '');
$post = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$body = [];
if ($post) {
    if (!c360_check_csrf((string)($_SERVER['HTTP_X_CSRF'] ?? ''))) c360_json(['error' => 'csrf'], 403);
    $body = json_decode((string)file_get_contents('php://input', false, null, 0, 262144), true) ?: [];
}

switch ($a) {
    case 'sites':
        $out = [];
        foreach (c360_list_hosts() as $host) {
            $s = c360_load_site($host);
            if (!$s) continue;
            $out[] = [
                'host' => $host,
                'status' => $s['status'] ?? 'discovered',
                'lastSeen' => $s['install']['lastSeen'] ?? null,
                'pings' => $s['install']['pings'] ?? 0,
                'pages' => count((array)($s['install']['pages'] ?? [])),
                'versions' => array_keys((array)($s['install']['versions'] ?? [])),
                'services' => count((array)($s['detected']['services'] ?? [])),
                'unknownCookies' => count((array)($s['detected']['cookies'] ?? [])),
                'placement' => $s['config']['placement'] ?? null,
            ];
        }
        c360_json(['sites' => $out]);

    case 'site':
        $host = c360_host($_GET['host'] ?? '');
        $s = $host ? c360_load_site($host) : null;
        if (!$s) c360_json(['error' => 'notfound'], 404);
        // A szkenner eredménye (tools/scan.mjs) is látszódjon, ha van.
        $scan = @file_get_contents('https://cdn.jsdelivr.net/gh/pengemedia-fejlesztes/360-consent@main/sites/' . $host . '.json', false, stream_context_create(['http' => ['timeout' => 4]]));
        $s['scan'] = $scan ? json_decode($scan, true) : null;
        c360_json(['site' => $s]);

    case 'create':
        if (!$post) c360_json(['error' => 'method'], 405);
        $host = c360_host($body['host'] ?? '');
        if ($host === '') c360_json(['error' => 'Érvénytelen domain.'], 400);
        $s = c360_load_site($host) ?: c360_new_site($host, 'active');
        $s['status'] = 'active';
        $s['updated'] = gmdate('c');
        c360_write(c360_site_file($host), $s);
        c360_json(['ok' => true, 'host' => $host]);

    case 'save':
        if (!$post) c360_json(['error' => 'method'], 405);
        $host = c360_host($body['host'] ?? '');
        $s = $host ? c360_load_site($host) : null;
        if (!$s) c360_json(['error' => 'notfound'], 404);
        if (in_array($body['status'] ?? '', ['active', 'discovered', 'disabled'], true)) $s['status'] = $body['status'];
        $s['config'] = c360_clean_config($body['config'] ?? []);
        $s['updated'] = gmdate('c');
        $s['updatedBy'] = $user;
        c360_write(c360_site_file($host), $s);
        c360_json(['ok' => true, 'config' => $s['config'], 'status' => $s['status']]);

    case 'delete':
        if (!$post) c360_json(['error' => 'method'], 405);
        $host = c360_host($body['host'] ?? '');
        if ($host && is_file(c360_site_file($host))) unlink(c360_site_file($host));
        c360_json(['ok' => true]);

    case 'password':
        if (!$post) c360_json(['error' => 'method'], 405);
        $users = c360_users();
        if (!password_verify((string)($body['old'] ?? ''), $users[$user]['hash'] ?? '')) c360_json(['error' => 'A jelenlegi jelszó nem stimmel.'], 400);
        $new = (string)($body['new'] ?? '');
        if (strlen($new) < 12) c360_json(['error' => 'Az új jelszó legalább 12 karakter legyen.'], 400);
        $users[$user]['hash'] = password_hash($new, PASSWORD_DEFAULT);
        $users[$user]['changed'] = gmdate('c');
        c360_write(C360_DATA . '/users.json', $users);
        c360_json(['ok' => true]);

    case 'logout':
        if (!$post) c360_json(['error' => 'method'], 405);
        $_SESSION = [];
        session_destroy();
        c360_json(['ok' => true]);

    default:
        c360_json(['error' => 'unknown'], 404);
}
