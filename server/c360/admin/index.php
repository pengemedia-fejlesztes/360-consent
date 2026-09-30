<?php
// 360 Consent admin – belépés és a felület váza.
declare(strict_types=1);
require __DIR__ . '/auth.php';

$err = '';
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['user'])) {
    if (!c360_check_csrf((string)($_POST['csrf'] ?? ''))) {
        $err = 'A munkamenet lejárt, próbáld újra.';
    } elseif (c360_throttled()) {
        $err = 'Túl sok sikertelen próbálkozás. Próbáld újra 15 perc múlva.';
    } elseif (c360_login(trim((string)$_POST['user']), (string)($_POST['pass'] ?? ''))) {
        header('Location: ./', true, 303);
        exit;
    } else {
        c360_fail();
        $err = 'Hibás felhasználónév vagy jelszó.';
    }
}
$user = c360_user();
$h = function ($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); };
?><!doctype html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>360 Consent admin</title>
<link rel="stylesheet" href="app.css?v=<?= $h(@filemtime(__DIR__ . '/app.css')) ?>">
</head>
<body>
<?php if (!$user): ?>
<main class="login">
  <form method="post" class="card">
    <h1><span class="logo">360</span> Consent admin</h1>
    <?php if ($err): ?><p class="alert"><?= $h($err) ?></p><?php endif; ?>
    <label>Felhasználónév<input name="user" autocomplete="username" required autofocus></label>
    <label>Jelszó<input name="pass" type="password" autocomplete="current-password" required></label>
    <input type="hidden" name="csrf" value="<?= $h(c360_csrf()) ?>">
    <button class="btn primary">Belépés</button>
  </form>
</main>
<?php else: ?>
<div id="app" data-csrf="<?= $h(c360_csrf()) ?>" data-user="<?= $h($user) ?>"></div>
<script src="app.js?v=<?= $h(@filemtime(__DIR__ . '/app.js')) ?>"></script>
<?php endif; ?>
</body>
</html>
