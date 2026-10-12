<?php
/**
 * Plugin Name: 360 Consent – first-party betöltő
 * Description: A 360 Consent süti-bannert TELJESEN first-party módon tölti be: a konfigurációt ÉS a
 *              popup JS-ét is az oldal SAJÁT doménjéről szolgálja ki (a szerver a git/jsDelivr-ből húzza
 *              és cache-eli), így a böngészőnek NINCS kereszt-domain kérése, és Safari privát mód /
 *              fejlett követésvédelem esetén is megjelenik. A git-frissítések automatikusan átjönnek.
 * Version: 3.0.0
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

/**
 * Same-origin asset-végpont: az oldal saját doménjén szolgálja ki a popup JS-ét,
 * amit a szerver a jsDelivr-ből (git) húz le és 1 órára cache-el. Így a böngésző csak
 * az oldal saját doménjét hívja, a frissítés mégis a gitből automatikus.
 * URL:  /?c360_asset=js
 */
add_action('init', function () {
    if (!isset($_GET['c360_asset']) || $_GET['c360_asset'] !== 'js') {
        return;
    }
    $channel = preg_replace('/[^a-zA-Z0-9._-]/', '', (string) C360_CHANNEL) ?: '1';
    $cacheKey = 'c360_js_' . md5($channel);
    $js = get_transient($cacheKey);
    if ($js === false) {
        $resp = wp_remote_get('https://cdn.jsdelivr.net/gh/pengemedia-fejlesztes/360-consent@' . $channel . '/dist/c360-consent.min.js', ['timeout' => 8]);
        if (!is_wp_error($resp) && (int) wp_remote_retrieve_response_code($resp) === 200) {
            $js = (string) wp_remote_retrieve_body($resp);
            if (strlen($js) > 1000) {
                set_transient($cacheKey, $js, HOUR_IN_SECONDS);
            }
        }
    }
    if (!is_string($js) || $js === '') {
        status_header(502);
        header('Content-Type: application/javascript; charset=utf-8');
        echo "/* 360 Consent: a popup JS ideiglenesen nem elérhető */";
        exit;
    }
    header('Content-Type: application/javascript; charset=utf-8');
    header('Cache-Control: public, max-age=3600');
    echo $js;
    exit;
}, 0);

add_action('wp_head', function () {
    $host = preg_replace('/^www\./', '', strtolower((string) ($_SERVER['HTTP_HOST'] ?? '')));
    $host = preg_replace('/[^a-z0-9.\-]/', '', $host);
    if ($host === '') {
        return;
    }
    $assetUrl = home_url('/?c360_asset=js');

    // A per-domain configot a szerver kéri le (1h cache) és inline-ba tesszük – nincs böngészős 360-marketing.hu kérés.
    $cacheKey = 'c360_remote_' . md5($host);
    $js = get_transient($cacheKey);
    if ($js === false) {
        $resp = wp_remote_get('https://360-marketing.hu/c360/api/loader.php?host=' . rawurlencode($host), [
            'timeout' => 5,
            'headers' => ['Accept' => 'application/javascript'],
        ]);
        if (!is_wp_error($resp) && (int) wp_remote_retrieve_response_code($resp) === 200) {
            $body = (string) wp_remote_retrieve_body($resp);
            if (strpos($body, 'C360_REMOTE') !== false) {
                $js = $body;
                set_transient($cacheKey, $js, HOUR_IN_SECONDS);
            }
        }
    }

    echo "\n<!-- 360 Consent first-party loader (saját domén, git-szinkron) -->\n";
    echo "<!--noptimize-->\n";
    if (is_string($js) && $js !== '') {
        // A jsDelivr min.js hivatkozást a SAJÁT doménes végpontra cseréljük – nulla böngészős kereszt-domain kérés.
        $js = preg_replace('~https://cdn\.jsdelivr\.net/gh/pengemedia-fejlesztes/360-consent@[^/]+/dist/c360-consent\.min\.js~', $assetUrl, $js);
        echo "<script data-noptimize=\"1\" data-cfasync=\"false\">\n" . $js . "\n</script>\n";
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
