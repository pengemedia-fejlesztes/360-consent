<?php
/**
 * Plugin Name: 360 Consent – first-party betöltő
 * Description: A 360 Consent süti-bannert TELJESEN first-party módon tölti be: a konfigurációt ÉS a
 *              popup JS-ét is az oldal SAJÁT doménjéről szolgálja ki, így a böngészőnek NINCS kereszt-domain
 *              kérése, és Safari privát mód / fejlett követésvédelem esetén is megjelenik.
 *              A JS-t és a configot egy ütemezett feladat 15 percenként húzza le a git/jsDelivr-ből és a
 *              360-marketing.hu-ról, és STATIKUS FÁJLBA írja (wp-content/uploads/c360/). Oldalbetöltéskor
 *              nincs adatbázis-írás és nincs külső kérés, így egy kiadás minden oldalon automatikusan
 *              megjelenik, transient-lejáratos deadlock nélkül. Az asset-URL tartalom-hash alapú verziójelet
 *              kap (?v=), így új kiadáskor a böngésző-cache automatikusan megújul. A GTM megkerülve.
 * Version: 4.0.0
 * Author: Penge Média / 360 Marketing
 *
 * Telepítés: wp-content/mu-plugins/360-consent-firstparty.php (mu-plugin = mindig aktív).
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('C360_POLICY_URL')) {
    define('C360_POLICY_URL', '/adatkezelesi-tajekoztato/');
}
// Melyik git-ágról/verzióról frissüljön a popup JS (jsDelivr): pl. '1' (major), 'main', vagy pontos tag.
if (!defined('C360_CHANNEL')) {
    define('C360_CHANNEL', '1');
}

const C360_FP_CRON_HOOK = 'c360_fp_refresh';

function c360_fp_channel()
{
    return preg_replace('/[^a-zA-Z0-9._-]/', '', (string) C360_CHANNEL) ?: '1';
}

function c360_fp_host()
{
    $host = strtolower((string) wp_parse_url(home_url(), PHP_URL_HOST));
    $host = preg_replace('/^www\./', '', $host);
    return preg_replace('/[^a-z0-9.\-]/', '', $host);
}

/** A statikus fájlok helye: [könyvtár, URL]. */
function c360_fp_dir()
{
    $up = wp_upload_dir(null, false);
    return [trailingslashit($up['basedir']) . 'c360', trailingslashit($up['baseurl']) . 'c360'];
}

function c360_fp_paths()
{
    list($dir, $url) = c360_fp_dir();
    $ch = c360_fp_channel();
    return [
        'dir' => $dir,
        'js' => $dir . '/c360-consent-' . $ch . '.js',
        'js_url' => $url . '/c360-consent-' . $ch . '.js',
        'cfg' => $dir . '/config-' . md5(c360_fp_host()) . '.js',
        'lock' => $dir . '/.refresh.lock',
    ];
}

/** Atomi írás: ideiglenes fájlba ír, majd átnevez, így olvasó soha nem lát félkész fájlt. */
function c360_fp_write($path, $data)
{
    $tmp = $path . '.' . getmypid() . '.tmp';
    if (@file_put_contents($tmp, $data) === false) {
        return false;
    }
    if (!@rename($tmp, $path)) {
        @unlink($tmp);
        return false;
    }
    return true;
}

/**
 * Lehúzza a popup JS-t és a configot, és csak akkor írja felül a fájlt, ha a tartalom változott.
 * Egyszerre csak egy folyamat frissít (flock), a többi azonnal kilép.
 */
function c360_fp_refresh()
{
    $p = c360_fp_paths();
    if (!wp_mkdir_p($p['dir'])) {
        return;
    }
    $lock = @fopen($p['lock'], 'c');
    if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
        return;
    }
    try {
        $resp = wp_remote_get('https://cdn.jsdelivr.net/gh/pengemedia-fejlesztes/360-consent@' . c360_fp_channel() . '/dist/c360-consent.js', ['timeout' => 8]);
        if (!is_wp_error($resp) && (int) wp_remote_retrieve_response_code($resp) === 200) {
            $body = (string) wp_remote_retrieve_body($resp);
            if (strlen($body) > 1000 && (!is_file($p['js']) || md5_file($p['js']) !== md5($body))) {
                c360_fp_write($p['js'], $body);
            }
        }
        $host = c360_fp_host();
        if ($host !== '') {
            $resp = wp_remote_get('https://360-marketing.hu/c360/api/loader.php?host=' . rawurlencode($host), [
                'timeout' => 5,
                'headers' => ['Accept' => 'application/javascript'],
            ]);
            if (!is_wp_error($resp) && (int) wp_remote_retrieve_response_code($resp) === 200) {
                $body = (string) wp_remote_retrieve_body($resp);
                if (strpos($body, 'C360_REMOTE') !== false && (!is_file($p['cfg']) || md5_file($p['cfg']) !== md5($body))) {
                    c360_fp_write($p['cfg'], $body);
                }
            }
        }
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
    // A 3.x transient-cache maradékát egyszer eltakarítjuk.
    if (!get_option('c360_fp_v4')) {
        delete_transient('c360_js_' . md5(c360_fp_channel()));
        delete_transient('c360_jsver_' . md5(c360_fp_channel()));
        delete_transient('c360_remote_' . md5(c360_fp_host()));
        update_option('c360_fp_v4', 1, false);
    }
}

// Ütemezés: 15 percenként frissít a háttérben (WP-Cron).
add_filter('cron_schedules', function ($s) {
    $s['c360_15min'] = ['interval' => 15 * MINUTE_IN_SECONDS, 'display' => '360 Consent – 15 perc'];
    return $s;
});
add_action(C360_FP_CRON_HOOK, 'c360_fp_refresh');
add_action('init', function () {
    if (!wp_next_scheduled(C360_FP_CRON_HOOK)) {
        wp_schedule_event(time() + 60, 'c360_15min', C360_FP_CRON_HOOK);
    }
}, 20);

/** A popup JS verziójele: a fájl tartalom-hash-e (csak olvasás). */
function c360_fp_js_ver()
{
    $p = c360_fp_paths();
    return is_file($p['js']) ? substr((string) md5_file($p['js']), 0, 8) : '';
}

/**
 * Same-origin tartalék-végpont: /?c360_asset=js  – ha a statikus fájl még nem létezik (első betöltés),
 * itt egyszer lehúzzuk; utána már a statikus fájlt szolgálja ki. Visszafelé kompatibilis a régi URL-lel.
 */
add_action('init', function () {
    if (!isset($_GET['c360_asset']) || $_GET['c360_asset'] !== 'js') {
        return;
    }
    $p = c360_fp_paths();
    $fresh = isset($_GET['fresh']) && (string) $_GET['fresh'] === c360_fp_channel();
    if ($fresh || !is_file($p['js'])) {
        c360_fp_refresh();
    }
    header('Content-Type: application/javascript; charset=utf-8');
    if (!is_file($p['js'])) {
        status_header(502);
        echo "/* 360 Consent: a popup JS ideiglenesen nem elérhető */";
        exit;
    }
    header('Cache-Control: public, max-age=86400');
    readfile($p['js']);
    exit;
}, 0);

add_action('wp_head', function () {
    if (c360_fp_host() === '') {
        return;
    }
    $p = c360_fp_paths();
    $ver = c360_fp_js_ver();
    // Ha a statikus fájl megvan, közvetlenül azt kapja a böngésző (PHP nélkül); különben a tartalék-végpontot.
    $assetUrl = $ver !== '' ? $p['js_url'] . '?v=' . $ver : home_url('/?c360_asset=js');

    $cfgJs = is_file($p['cfg']) ? (string) @file_get_contents($p['cfg']) : '';
    if ($cfgJs === '' || !is_file($p['js'])) {
        // Első futás: a frissítést a háttérbe ütemezzük, az oldalbetöltés nem vár rá.
        if (!wp_next_scheduled('c360_fp_refresh_once')) {
            wp_schedule_single_event(time(), 'c360_fp_refresh_once');
        }
    }

    echo "\n<!-- 360 Consent first-party loader (saját domén, statikus fájl, hash-verzió) -->\n";
    echo "<!--noptimize-->\n";
    if ($cfgJs !== '') {
        // A jsDelivr hivatkozást a SAJÁT doménes, verziózott fájlra cseréljük.
        $cfgJs = preg_replace('~https://cdn\.jsdelivr\.net/gh/pengemedia-fejlesztes/360-consent@[^/]+/dist/c360-consent(\.min)?\.js~', $assetUrl, $cfgJs);
        echo "<script data-noptimize=\"1\" data-cfasync=\"false\">\n" . $cfgJs . "\n</script>\n";
    } else {
        // Tartalék: ha a config még nincs meg, a kliens tölti a saját doménes JS-t.
        $policy = wp_json_encode(C360_POLICY_URL);
        $asset = wp_json_encode($assetUrl);
        ?>
<script data-noptimize="1" data-cfasync="false">
window.C360_CONFIG = window.C360_CONFIG || { policyUrl: <?php echo $policy; ?> };
(function (d) {
  if (d.getElementById('c360-js')) return;
  var s = d.createElement('script');
  s.id = 'c360-js';
  s.async = true;
  s.src = <?php echo $asset; ?>;
  d.head.appendChild(s);
})(document);
</script>
<?php
    }
    echo "<!--/noptimize-->\n";
}, 1);
add_action('c360_fp_refresh_once', 'c360_fp_refresh');
