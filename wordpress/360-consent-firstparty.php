<?php
/**
 * Plugin Name: 360 Consent – first-party betöltő
 * Description: A 360 Consent süti-bannert first-party módon tölti be. A per-domain konfigurációt
 *              a SZERVER oldja fel (PHP), inline-ba teszi, a popup kódját pedig a jsDelivr CDN-ről
 *              tölti – így a böngészőnek NINCS kereszt-domain kérése a 360-marketing.hu felé, és a
 *              banner Safari privát módban (fejlett követésvédelem) is megjelenik. A GTM megkerülve.
 * Version: 2.0.0
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

add_action('wp_head', function () {
    $host = preg_replace('/^www\./', '', strtolower((string) ($_SERVER['HTTP_HOST'] ?? '')));
    $host = preg_replace('/[^a-z0-9.\-]/', '', $host);
    if ($host === '') {
        return;
    }

    // A per-domain konfigurációt (C360_REMOTE) a szerver kéri le és cache-eli 1 órára,
    // így a böngészőnek nincs 360-marketing.hu-s kérése – ezt blokkolja a Safari követésvédelem.
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

    echo "\n<!-- 360 Consent first-party loader (szerver-oldali config, GTM nélkül) -->\n";
    echo "<!--noptimize-->\n";
    if (is_string($js) && $js !== '') {
        // Szerver-oldalon feloldott config + jsDelivr popup – nulla böngészős 360-marketing.hu kérés.
        echo "<script data-noptimize=\"1\" data-cfasync=\"false\">\n" . $js . "\n</script>\n";
    } else {
        // Tartalék: ha a szerver nem érte el a configot, a kliens tölti be (ekkor van 360-marketing.hu kérés).
        $policy = wp_json_encode(C360_POLICY_URL);
        ?>
<script data-noptimize="1" data-cfasync="false">
window.C360_CONFIG = window.C360_CONFIG || { policyUrl: <?php echo $policy; ?> };
(function (d, h) {
  if (d.getElementById('c360-loader')) return;
  var s = d.createElement('script');
  s.id = 'c360-loader';
  s.async = true;
  s.src = 'https://360-marketing.hu/c360/api/loader.php?host=' + encodeURIComponent(h);
  s.onerror = function () {
    var f = d.createElement('script');
    f.async = true;
    f.src = 'https://cdn.jsdelivr.net/gh/pengemedia-fejlesztes/360-consent@1/dist/c360-consent.min.js';
    d.head.appendChild(f);
  };
  d.head.appendChild(s);
})(document, location.hostname);
</script>
<?php
    }
    echo "<!--/noptimize-->\n";
}, 1);
