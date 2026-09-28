<?php
/**
 * Plugin Name:       Alphaa Connector
 * Plugin URI:        https://alphaa.app
 * Description:       Lets your Alphaa agent publish the pages, structured data and llms.txt you approve — and undo them in one tap. Also tells you when ChatGPT, Perplexity, Claude or Gemini send you a visitor.
 * Version:           1.2.0
 * Requires at least: 5.6
 * Requires PHP:      7.4
 * Author:            Alphaa
 * Author URI:        https://alphaa.app
 * License:           GPL-2.0-or-later
 * Text Domain:       alphaa-connector
 */

if (!defined('ABSPATH')) exit;

define('ALPHAA_VERSION', '1.2.0');
if (!defined('ALPHAA_API')) define('ALPHAA_API', 'https://alphaa.app');

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function alphaa_key() { return (string) get_option('alphaa_key', ''); }
function alphaa_site_id() { $k = alphaa_key(); $p = strpos($k, '.'); return $p ? substr($k, 0, $p) : ''; }
function alphaa_home_path() { $p = wp_parse_url(home_url('/'), PHP_URL_PATH); return $p ? rtrim($p, '/') : ''; }
function alphaa_request_path() {
  $p = wp_parse_url(isset($_SERVER['REQUEST_URI']) ? wp_unslash($_SERVER['REQUEST_URI']) : '/', PHP_URL_PATH);
  $home = alphaa_home_path();
  if ($home && strpos($p, $home) === 0) $p = substr($p, strlen($home));
  return $p ? $p : '/';
}

function alphaa_changes() { $c = get_option('alphaa_changes', array()); return is_array($c) ? $c : array(); }
function alphaa_log_change($op, $data) {
  $c = alphaa_changes();
  $id = $op . '-' . wp_generate_password(10, false, false);
  $c[$id] = array_merge(array('op' => $op, 'at' => time()), $data);
  if (count($c) > 200) $c = array_slice($c, -200, null, true);
  update_option('alphaa_changes', $c, false);
  return $id;
}

/* ─── Signed REST API (only Alphaa, holding your key, can call it) ────── */

function alphaa_verify(WP_REST_Request $req) {
  $key = alphaa_key();
  if (!$key) return new WP_Error('alphaa_not_connected', 'Alphaa is not connected on this site yet.', array('status' => 403));
  $ts = $req->get_header('x-alphaa-timestamp');
  $sig = $req->get_header('x-alphaa-signature');
  if (!$ts || !$sig || abs(time() - intval($ts)) > 300) return new WP_Error('alphaa_stale', 'Request expired.', array('status' => 401));
  $want = hash_hmac('sha256', $ts . '.' . $req->get_body(), $key);
  if (!hash_equals($want, $sig)) return new WP_Error('alphaa_sig', 'Bad signature.', array('status' => 401));
  return true;
}

add_action('rest_api_init', function () {
  $routes = array(
    'status' => 'alphaa_rest_status',
    'page'   => 'alphaa_rest_page',
    'schema' => 'alphaa_rest_schema',
    'llms'   => 'alphaa_rest_llms',
    'robots' => 'alphaa_rest_robots',
    'undo'   => 'alphaa_rest_undo',
    'post'   => 'alphaa_rest_post',
    'meta'   => 'alphaa_rest_meta',
    'sitemap' => 'alphaa_rest_sitemap',
    'headers' => 'alphaa_rest_headers',
  );
  foreach ($routes as $route => $cb) {
    register_rest_route('alphaa/v1', '/' . $route, array(
      'methods' => 'POST',
      'callback' => $cb,
      'permission_callback' => 'alphaa_verify',
    ));
  }
});

function alphaa_rest_status() {
  return array(
    'ok' => true,
    'version' => ALPHAA_VERSION,
    'wp' => get_bloginfo('version'),
    'schema' => (bool) get_option('alphaa_schema'),
    'llms' => (bool) get_option('alphaa_llms'),
    'robots' => (bool) get_option('alphaa_robots'),
    'physicalRobots' => file_exists(ABSPATH . 'robots.txt'),
    'physicalLlms' => file_exists(ABSPATH . 'llms.txt'),
    'searchVisible' => (bool) get_option('blog_public'),
    'indexnow' => (string) get_option('alphaa_indexnow', ''),
    'seoPlugin' => alphaa_seo_plugin(),
    'sitemap' => alphaa_sitemap_url(),
  );
}

function alphaa_seo_plugin() {
  if (defined('WPSEO_VERSION')) return 'yoast';
  if (defined('RANK_MATH_VERSION')) return 'rankmath';
  if (defined('AIOSEO_VERSION')) return 'aioseo';
  return '';
}

function alphaa_sitemap_url() {
  $seo = alphaa_seo_plugin();
  if ($seo === 'yoast' || $seo === 'rankmath') return home_url('/sitemap_index.xml');
  if ($seo === 'aioseo') return home_url('/sitemap.xml');
  if (function_exists('get_sitemap_url') && apply_filters('wp_sitemaps_enabled', (bool) get_option('blog_public'))) return get_sitemap_url('index');
  return '';
}

/** Post id for a URL on this site; 0 for a front page that lists posts. */
function alphaa_resolve_url($url) {
  $path = wp_parse_url($url, PHP_URL_PATH);
  $home = alphaa_home_path();
  if ($home && strpos((string) $path, $home) === 0) $path = substr($path, strlen($home));
  if (!$path || $path === '/') return get_option('show_on_front') === 'page' ? intval(get_option('page_on_front')) : 0;
  return intval(url_to_postid($url));
}

function alphaa_rest_page(WP_REST_Request $req) {
  $p = $req->get_json_params();
  $title = isset($p['title']) ? sanitize_text_field($p['title']) : '';
  $html = isset($p['html']) ? wp_kses_post($p['html']) : '';
  if (!$title || !$html) return new WP_Error('alphaa_bad', 'Missing title or content.', array('status' => 400));
  $post_id = wp_insert_post(array(
    'post_type' => 'page',
    'post_status' => 'publish',
    'post_title' => $title,
    'post_content' => $html,
    'post_name' => isset($p['slug']) ? sanitize_title($p['slug']) : sanitize_title($title),
  ), true);
  if (is_wp_error($post_id)) return $post_id;
  update_post_meta($post_id, '_alphaa', 1);
  if (!empty($p['jsonld']) && is_array($p['jsonld'])) update_post_meta($post_id, '_alphaa_schema', wp_json_encode($p['jsonld']));
  $id = alphaa_log_change('page', array('post_id' => $post_id));
  return array('ok' => true, 'id' => $id, 'url' => get_permalink($post_id));
}

function alphaa_rest_post(WP_REST_Request $req) {
  $p = $req->get_json_params();
  $title = isset($p['title']) ? sanitize_text_field($p['title']) : '';
  $html = isset($p['html']) ? wp_kses_post($p['html']) : '';
  if (!$title || !$html) return new WP_Error('alphaa_bad', 'Missing title or content.', array('status' => 400));
  $post_id = wp_insert_post(array(
    'post_type' => 'post',
    'post_status' => 'publish',
    'post_title' => $title,
    'post_content' => $html,
    'post_excerpt' => isset($p['excerpt']) ? sanitize_text_field($p['excerpt']) : '',
  ), true);
  if (is_wp_error($post_id)) return $post_id;
  update_post_meta($post_id, '_alphaa', 1);
  if (!empty($p['jsonld']) && is_array($p['jsonld'])) update_post_meta($post_id, '_alphaa_schema', wp_json_encode($p['jsonld']));
  // Featured image, fetched from Alphaa's signed URL into the media library.
  if (!empty($p['image']['url'])) {
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $att = media_sideload_image(esc_url_raw($p['image']['url']), $post_id, isset($p['image']['alt']) ? sanitize_text_field($p['image']['alt']) : $title, 'id');
    if (!is_wp_error($att)) {
      set_post_thumbnail($post_id, $att);
      update_post_meta($att, '_wp_attachment_image_alt', isset($p['image']['alt']) ? sanitize_text_field($p['image']['alt']) : $title);
    }
  }
  $id = alphaa_log_change('post', array('post_id' => $post_id));
  return array('ok' => true, 'id' => $id, 'url' => get_permalink($post_id));
}

// Page title + meta description. Written where the site's SEO plugin reads
// them (Yoast / Rank Math), otherwise served by this plugin.
function alphaa_rest_meta(WP_REST_Request $req) {
  $p = $req->get_json_params();
  $url = isset($p['url']) ? esc_url_raw($p['url']) : home_url('/');
  $title = isset($p['title']) ? sanitize_text_field($p['title']) : '';
  $desc = isset($p['description']) ? sanitize_text_field($p['description']) : '';
  if (!$title && !$desc) return new WP_Error('alphaa_bad', 'Nothing to change.', array('status' => 400));
  $pid = alphaa_resolve_url($url);
  $seo = alphaa_seo_plugin();
  $prev = array();
  if ($pid && ($seo === 'yoast' || $seo === 'rankmath')) {
    $tk = $seo === 'yoast' ? '_yoast_wpseo_title' : 'rank_math_title';
    $dk = $seo === 'yoast' ? '_yoast_wpseo_metadesc' : 'rank_math_description';
    $prev = array('store' => 'postmeta', 'post_id' => $pid, 'tk' => $tk, 'dk' => $dk, 'title' => get_post_meta($pid, $tk, true), 'desc' => get_post_meta($pid, $dk, true));
    if ($title) update_post_meta($pid, $tk, $title);
    if ($desc) update_post_meta($pid, $dk, $desc);
  } else {
    $key = $pid ? 'p' . $pid : 'home';
    $all = get_option('alphaa_meta', array());
    if (!is_array($all)) $all = array();
    $prev = array('store' => 'option', 'key' => $key, 'value' => isset($all[$key]) ? $all[$key] : null);
    $all[$key] = array('title' => $title, 'description' => $desc);
    update_option('alphaa_meta', $all, true);
  }
  $id = alphaa_log_change('meta', array('prev' => $prev));
  return array('ok' => true, 'id' => $id, 'url' => $pid ? get_permalink($pid) : home_url('/'), 'via' => $seo ? $seo : 'alphaa');
}

function alphaa_rest_sitemap() {
  update_option('alphaa_sitemap', 1, false);
  $id = alphaa_log_change('sitemap', array());
  return array('ok' => true, 'id' => $id, 'url' => alphaa_sitemap_url() ? alphaa_sitemap_url() : get_sitemap_url('index'));
}

function alphaa_rest_headers() {
  update_option('alphaa_headers', 1, false);
  $id = alphaa_log_change('headers', array());
  return array('ok' => true, 'id' => $id, 'url' => home_url('/'));
}

function alphaa_rest_schema(WP_REST_Request $req) {
  $p = $req->get_json_params();
  if (empty($p['blocks']) || !is_array($p['blocks'])) return new WP_Error('alphaa_bad', 'No structured data sent.', array('status' => 400));
  update_option('alphaa_schema_prev', get_option('alphaa_schema', ''), false);
  update_option('alphaa_schema', wp_json_encode($p['blocks']), true);
  $id = alphaa_log_change('schema', array());
  return array('ok' => true, 'id' => $id, 'url' => home_url('/'));
}

function alphaa_rest_llms(WP_REST_Request $req) {
  $p = $req->get_json_params();
  $text = isset($p['text']) ? (string) $p['text'] : '';
  if (!$text) return new WP_Error('alphaa_bad', 'Empty llms.txt.', array('status' => 400));
  update_option('alphaa_llms_prev', get_option('alphaa_llms', ''), false);
  update_option('alphaa_llms', wp_strip_all_tags($text, false), false);
  $id = alphaa_log_change('llms', array());
  return array('ok' => true, 'id' => $id, 'url' => home_url('/llms.txt'), 'shadowed' => file_exists(ABSPATH . 'llms.txt'));
}

function alphaa_rest_robots() {
  update_option('alphaa_robots', 1, false);
  $id = alphaa_log_change('robots', array());
  return array('ok' => true, 'id' => $id, 'url' => home_url('/robots.txt'), 'shadowed' => file_exists(ABSPATH . 'robots.txt'));
}

function alphaa_rest_undo(WP_REST_Request $req) {
  $p = $req->get_json_params();
  $c = alphaa_changes();
  $id = isset($p['id']) ? (string) $p['id'] : '';
  if (!$id || !isset($c[$id])) return new WP_Error('alphaa_unknown', 'Nothing to undo with that id.', array('status' => 404));
  $ch = $c[$id];
  switch ($ch['op']) {
    case 'page':   wp_trash_post(intval($ch['post_id'])); break; // Trash, not delete — restorable from WordPress.
    case 'schema': update_option('alphaa_schema', get_option('alphaa_schema_prev', ''), true); break;
    case 'llms':   update_option('alphaa_llms', get_option('alphaa_llms_prev', ''), false); break;
    case 'robots': update_option('alphaa_robots', 0, false); break;
    case 'post':   wp_trash_post(intval($ch['post_id'])); break;
    case 'sitemap': update_option('alphaa_sitemap', 0, false); break;
    case 'headers': update_option('alphaa_headers', 0, false); break;
    case 'meta':
      $pv = isset($ch['prev']) ? $ch['prev'] : array();
      if (isset($pv['store']) && $pv['store'] === 'postmeta') {
        update_post_meta(intval($pv['post_id']), $pv['tk'], $pv['title']);
        update_post_meta(intval($pv['post_id']), $pv['dk'], $pv['desc']);
      } elseif (isset($pv['store']) && $pv['store'] === 'option') {
        $all = get_option('alphaa_meta', array());
        if ($pv['value'] === null) unset($all[$pv['key']]); else $all[$pv['key']] = $pv['value'];
        update_option('alphaa_meta', $all, true);
      }
      break;
  }
  unset($c[$id]);
  update_option('alphaa_changes', $c, false);
  return array('ok' => true);
}

/* ─── What visitors and crawlers see ─────────────────────────────────── */

// Structured data in <head>: site-wide blocks plus any page-specific FAQ.
add_action('wp_head', function () {
  $out = array();
  $site = json_decode((string) get_option('alphaa_schema', ''), true);
  if (is_array($site)) $out = $site;
  if (is_singular()) {
    $page = json_decode((string) get_post_meta(get_the_ID(), '_alphaa_schema', true), true);
    if (is_array($page)) $out = array_merge($out, $page);
  }
  foreach ($out as $block) {
    if (!is_array($block)) continue;
    echo "\n<script type=\"application/ld+json\">" . wp_json_encode($block, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "</script>\n";
  }
}, 5);

// Titles/descriptions set through Alphaa when no SEO plugin handles them.
function alphaa_current_meta() {
  if (alphaa_seo_plugin()) return null;
  $all = get_option('alphaa_meta', array());
  if (!is_array($all) || !$all) return null;
  if (is_front_page() && !is_page()) return isset($all['home']) ? $all['home'] : null;
  $pid = get_queried_object_id();
  return ($pid && isset($all['p' . $pid])) ? $all['p' . $pid] : null;
}
add_filter('pre_get_document_title', function ($t) {
  $m = alphaa_current_meta();
  return ($m && !empty($m['title'])) ? $m['title'] : $t;
}, 99);
add_action('wp_head', function () {
  $m = alphaa_current_meta();
  if ($m && !empty($m['description'])) echo '<meta name="description" content="' . esc_attr($m['description']) . '" />' . "\n";
}, 1);

// Basic security headers, when the owner approved them. HSTS only over HTTPS
// and without includeSubDomains, so it can't break a subdomain.
add_action('send_headers', function () {
  if (!get_option('alphaa_headers') || headers_sent()) return;
  header('X-Content-Type-Options: nosniff');
  header('X-Frame-Options: SAMEORIGIN');
  header('Referrer-Policy: strict-origin-when-cross-origin');
  if (is_ssl()) header('Strict-Transport-Security: max-age=31536000');
});

// Make sure WordPress's built-in sitemap is on when the owner approved it.
add_filter('wp_sitemaps_enabled', function ($on) { return get_option('alphaa_sitemap') ? true : $on; }, 99);

// /llms.txt and the IndexNow key file, served without touching the filesystem.
add_action('parse_request', function () {
  $path = alphaa_request_path();
  if ($path === '/llms.txt') {
    $text = (string) get_option('alphaa_llms', '');
    if (!$text) return;
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: public, max-age=3600');
    echo $text; exit;
  }
  // WordPress only routes /robots.txt itself with pretty permalinks; serve it
  // here too so the AI-bot rules apply on sites using plain permalinks.
  if ($path === '/robots.txt' && get_option('alphaa_robots') && !get_option('permalink_structure')) {
    do_robots(); exit;
  }
  $ix = (string) get_option('alphaa_indexnow', '');
  if ($ix && $path === '/' . $ix . '.txt') {
    header('Content-Type: text/plain; charset=utf-8');
    echo $ix; exit;
  }
}, 0);

// Let AI search assistants in. Each bot gets its own group, so WordPress's
// default admin rules are repeated for it.
add_filter('robots_txt', function ($output, $public) {
  if (!$public || !get_option('alphaa_robots')) return $output;
  $bots = array('OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User');
  $add = "\n# Added by Alphaa: let AI search assistants read this site\n";
  foreach ($bots as $b) $add .= "User-agent: $b\nDisallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php\nAllow: /\n\n";
  return $output . $add;
}, 99, 2);

// Count visitors that arrive from an AI assistant. Sends only the assistant's
// name and the page path — no cookies, no IP, nothing about the visitor.
add_action('wp_footer', function () {
  $site = alphaa_site_id();
  if (!$site) return;
  $endpoint = esc_url_raw(ALPHAA_API . '/api/connect/visit');
  ?>
<script>(function(){try{var r=document.referrer||"",u=(new URLSearchParams(location.search)).get("utm_source")||"",m=(r+" "+u).match(/chatgpt\.com|chat\.openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com/i);if(!m)return;var k="alphaa_v_"+m[0];try{if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,"1")}catch(e){}navigator.sendBeacon(<?php echo wp_json_encode($endpoint); ?>,JSON.stringify({s:<?php echo wp_json_encode($site); ?>,src:m[0].toLowerCase(),p:location.pathname}))}catch(e){}})();</script>
  <?php
}, 99);

/* ─── Settings screen: paste your key once ───────────────────────────── */

add_action('admin_menu', function () {
  add_options_page('Alphaa', 'Alphaa', 'manage_options', 'alphaa', 'alphaa_settings_page');
});

add_filter('plugin_action_links_' . plugin_basename(__FILE__), function ($links) {
  array_unshift($links, '<a href="' . esc_url(admin_url('options-general.php?page=alphaa')) . '">Connect</a>');
  return $links;
});

function alphaa_hello($key) {
  $res = wp_remote_post(ALPHAA_API . '/api/connect/wp/hello', array(
    'timeout' => 20,
    'headers' => array('Content-Type' => 'application/json'),
    'body' => wp_json_encode(array(
      'key' => $key,
      'siteUrl' => home_url('/'),
      'restUrl' => rest_url('alphaa/v1/'),
      'version' => ALPHAA_VERSION,
    )),
  ));
  if (is_wp_error($res)) return $res->get_error_message();
  $body = json_decode(wp_remote_retrieve_body($res), true);
  if (wp_remote_retrieve_response_code($res) !== 200 || empty($body['ok'])) return isset($body['error']) ? $body['error'] : 'Alphaa did not accept that key.';
  if (!empty($body['indexnow'])) update_option('alphaa_indexnow', sanitize_key($body['indexnow']), false);
  return true;
}

function alphaa_settings_page() {
  if (!current_user_can('manage_options')) return;
  $msg = ''; $ok = false;
  if (isset($_POST['alphaa_key']) && check_admin_referer('alphaa_connect')) {
    $key = sanitize_text_field(wp_unslash($_POST['alphaa_key']));
    $prev = alphaa_key();
    update_option('alphaa_key', $key, false);
    $r = alphaa_hello($key);
    if ($r === true) { $ok = true; $msg = 'Connected. Go back to Alphaa — your agent can see your site now.'; }
    else { update_option('alphaa_key', $prev, false); $msg = 'Couldn’t connect: ' . $r; }
  }
  $connected = (bool) alphaa_key();
  ?>
  <div class="wrap" style="max-width:640px">
    <h1>Alphaa</h1>
    <?php if ($msg): ?><div class="notice <?php echo $ok ? 'notice-success' : 'notice-error'; ?>"><p><?php echo esc_html($msg); ?></p></div><?php endif; ?>
    <p style="font-size:14px">Paste the connection key from your Alphaa agent. After that, nothing goes live on this site until you approve it in Alphaa, and every change can be undone there in one tap.</p>
    <form method="post">
      <?php wp_nonce_field('alphaa_connect'); ?>
      <p><input name="alphaa_key" type="text" class="regular-text code" style="width:100%" value="<?php echo esc_attr(alphaa_key()); ?>" placeholder="Paste your key" autocomplete="off" /></p>
      <p><button class="button button-primary"><?php echo $connected ? 'Reconnect' : 'Connect'; ?></button></p>
    </form>
    <p style="color:#646970">Status: <?php echo $connected ? '<strong>connected</strong>' : 'not connected'; ?></p>
  </div>
  <?php
}

register_uninstall_hook(__FILE__, 'alphaa_uninstall');
function alphaa_uninstall() {
  foreach (array('alphaa_key', 'alphaa_schema', 'alphaa_schema_prev', 'alphaa_llms', 'alphaa_llms_prev', 'alphaa_robots', 'alphaa_changes', 'alphaa_indexnow', 'alphaa_meta', 'alphaa_sitemap', 'alphaa_headers') as $o) delete_option($o);
}
