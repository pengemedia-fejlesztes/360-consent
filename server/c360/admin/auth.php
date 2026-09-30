<?php
// 360 Consent admin – belépés, munkamenet, CSRF, próbálkozás-korlát.
declare(strict_types=1);
require __DIR__ . '/../lib.php';

header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store');

session_name('c360adm');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/c360/admin/',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

const C360_IDLE = 8 * 3600;

function c360_users(): array
{
    return c360_read(C360_DATA . '/users.json', []);
}

function c360_user(): ?string
{
    $u = $_SESSION['user'] ?? null;
    if (!$u || (time() - (int)($_SESSION['seen'] ?? 0)) > C360_IDLE || !isset(c360_users()[$u])) return null;
    $_SESSION['seen'] = time();
    return $u;
}

function c360_csrf(): string
{
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}

function c360_check_csrf(string $token): bool
{
    return !empty($_SESSION['csrf']) && hash_equals($_SESSION['csrf'], $token);
}

// Legfeljebb 5 hibás próbálkozás 15 percenként, IP-nként (az IP-t csak hash-elve, rövid ideig tároljuk).
function c360_throttled(): bool
{
    $key = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|c360');
    $a = c360_read(C360_DATA . '/attempts.json', []);
    $now = time();
    foreach ($a as $k => $v) if ($v['t'] < $now - 900) unset($a[$k]);
    return ($a[$key]['n'] ?? 0) >= 5;
}

function c360_fail(): void
{
    $key = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|c360');
    $a = c360_read(C360_DATA . '/attempts.json', []);
    $now = time();
    foreach ($a as $k => $v) if ($v['t'] < $now - 900) unset($a[$k]);
    $a[$key] = ['n' => ($a[$key]['n'] ?? 0) + 1, 't' => $now];
    c360_write(C360_DATA . '/attempts.json', $a);
}

function c360_login(string $user, string $pass): bool
{
    $users = c360_users();
    $hash = $users[$user]['hash'] ?? '$2y$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
    $ok = password_verify($pass, $hash) && isset($users[$user]);
    if (!$ok) return false;
    session_regenerate_id(true);
    $_SESSION['user'] = $user;
    $_SESSION['seen'] = time();
    unset($_SESSION['csrf']);
    return true;
}
