<?php
/**
 * Plugin Name: 360 Consent – first-party betöltő
 * Description: A 360 Consent süti-bannert TELJESEN first-party módon tölti be: a konfigurációt ÉS a
 *              popup JS-ét is az oldal SAJÁT doménjéről szolgálja ki (a szerver a git/jsDelivr-ből húzza
 *              és cache-eli), így a böngészőnek NINCS kereszt-domain kérése, és Safari privát mód /
 *              fejlett követésvédelem esetén is megjelenik. A git-frissítések automatikusan átjönnek.
 *              Az asset-URL tartalom-hash alapú verziójelet kap (&v=), így új kiadáskor a böngésző-cache
 *              automatikusan megújul. A GTM megkerülve.
 * Version: 3.1.0
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

function c360_fp_channel()
{
    return preg_replace('/[^a-zA-Z0-9._-]/', '', (string) C360_CHANNEL) ?: '1';
}

/**
 * A popup JS-ét a jsDelivr-ből (git) húzza le és 15 percre cache-eli, a tartalom-hash-sel együtt.
 * Visszatérés: [ js vagy '', 8 karakteres tartalom-hash vagy '' ].
 */
function c360_fp_get_js($fresh = false)
{
    $channel = c360_fp_channel();
    $jsKey = 'c360_js_' . md5($channel);
    $verKey = 'c360_jsver_' . md5($channel);
    $js = $fresh ? false : get_transient($jsKey);
    if ($js === false) {
        $resp = wp_remote_get('https://cdn.jsdelivr.net/gh/pengemedia-fejlesztes/360-consent@' . $channel . '/dist/c360-consent.min.js', ['timeout' => 8]);
        if (!is_wp_error($resp) && (int) wp_remote_retrieve_response_code($resp) === 200) {
            $body = (string) wp_remote_retrieve_body($resp);
            if (strlen($body) > 1000) {
                $js = $body;
                set_transient($jsKey, $js, 15 * MINUTE_IN_SECONDS);
                set_transient($verKey, substr(md5($js), 0, 8), DAY_IN_SECONDS);
            }
        }
    }
    $ver = get_transient($verKey);
    if (!$ver && is_string($js) && $js !== '') {
        $ver = substr(md5($js), 0, 8);
        set_transient($verKey, $ver, DAY_IN_SECONDS);
    }
    return [is_string($js) ? $js : '', is_string($ver) ? $ver : ''];
}

/**
 * Same-origin asset-végpont: /?c360_asset=js[&v=hash]  – az oldal saját doménjén szolgálja ki a popup JS-ét.
 */
add_action('init', function () {
    if (!isset($_GET['c360_asset']) || $_GET['c360_asset'] !== 'js') {
        return;
    }
    $fresh = isset($_GET['fresh']) && (string) $_GET['fresh'] === c360_fp_channel();
    list($js, $ver) = c360_fp_get_js($fresh);
    if ($js === '') {
        status_header(502);
        header('Content-Type: application/javascript; charset=utf-8');
        echo "/* 360 Consent: a popup JS ideiglenesen nem elérhető */";
        exit;
    }
    header('Content-Type: application/javascript; charset=utf-8');
    // A verziójel miatt a tartalom immutábilis erre az URL-re; hosszú cache, új kiadáskor új URL.
    header('Cache-Control: public, max-age=86400');
    echo $js;
    exit;
}, 0);

add_action('wp_head', function () {
    $host = preg_replace('/^www\./', '', strtolower((string) ($_SERVER['HTTP_HOST'] ?? '')));
    $host = preg_replace('/[^a-z0-9.\-]/', '', $host);
    if ($host === '') {
        return;
    }

    list(, $ver) = c360_fp_get_js(false);
    $assetUrl = home_url('/?c360_asset=js' . ($ver ? '&v=' . $ver : ''));

    // A per-domain configot a szerver kéri le (1h cache) és inline-ba tesszük – nincs böngészős 360-marketing.hu kérés.
    $cacheKey = 'c360_remote_' . md5($host);
    $cfgJs = get_transient($cacheKey);
    if ($cfgJs === false) {
        $resp = wp_remote_get('https://360-marketing.hu/c360/api/loader.php?host=' . rawurlencode($host), [
            'timeout' => 5,
            'headers' => ['Accept' => 'application/javascript'],
        ]);
        if (!is_wp_error($resp) && (int) wp_remote_retrieve_response_code($resp) === 200) {
            $body = (string) wp_remote_retrieve_body($resp);
            if (strpos($body, 'C360_REMOTE') !== false) {
                $cfgJs = $body;
                set_transient($cacheKey, $cfgJs, HOUR_IN_SECONDS);
            }
        }
    }

    echo "\n<!-- 360 Consent first-party loader (saját domén, git-szinkron, hash-verzió) -->\n";
    echo "<!--noptimize-->\n";
    if (is_string($cfgJs) && $cfgJs !== '') {
        // A jsDelivr min.js hivatkozást a SAJÁT doménes, verziózott végpontra cseréljük.
        $cfgJs = preg_replace('~https://cdn\.jsdelivr\.net/gh/pengemedia-fejlesztes/360-consent@[^/]+/dist/c360-consent\.min\.js~', $assetUrl, $cfgJs);
        echo "<script data-noptimize=\"1\" data-cfasync=\"false\">\n" . $cfgJs . "\n</script>\n";
    } else {
        // Tartalék: ha a szerver nem érte el a configot, a kliens tölti a saját doménes JS-t.
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
