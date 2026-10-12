<?php
/**
 * Plugin Name: 360 Consent – first-party betöltő
 * Description: A 360 Consent süti-bannert KÖZVETLENÜL az oldal fejlécébe tölti be, a GTM megkerülésével.
 *              Így Safari privát mód / fejlett követésvédelem (ami a Google Tag Managert blokkolja) esetén is megjelenik.
 * Version: 1.0.0
 * Author: Penge Média / 360 Marketing
 *
 * Telepítés: wp-content/mu-plugins/360-consent-firstparty.php (mu-plugin = mindig aktív).
 * A {{DataPolicyURL}}-nak megfelelő adatvédelmi oldal relatív útját a C360_POLICY_URL állítja.
 * A loader guard-olt (ha a GTM-es c360-loader már fut, nem tölt kétszer).
 */

if (!defined('ABSPATH')) {
    exit;
}

// Az adatkezelési tájékoztató relatív útja (a bannerben a „Részletek" link ide mutat).
if (!defined('C360_POLICY_URL')) {
    define('C360_POLICY_URL', '/adatkezelesi-tajekoztato/');
}

add_action('wp_head', function () {
    $policy = wp_json_encode(C360_POLICY_URL);
    ?>
<!-- 360 Consent first-party loader (GTM nélkül – Safari privát módhoz is) -->
<script>
window.C360_CONFIG = window.C360_CONFIG || { policyUrl: <?php echo $policy; ?> };
(function (d, h) {
  if (d.getElementById('c360-loader')) return; // a GTM-es változat már betöltötte
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
}, 1); // korai prioritás, hogy a banner a lehető leghamarabb megjelenjen
