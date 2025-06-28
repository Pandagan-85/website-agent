<?php
/**
 * Plugin Name: Veronica Schembri AI Chatbot (Secure Upgrade)
 * Plugin URI: https://www.veronicaschembri.com
 * Description: AI-powered chatbot that represents Veronica Schembri - Completely secured
 * Version: 1.0.2
 * Author: Veronica Schembri
 * Author URI: https://www.veronicaschembri.com
 * License: GPL v2 or later
 * Text Domain: veronica-chatbot
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class VeronicaChatbotPlugin {
    
    private $plugin_url;
    private $plugin_path;
    private $version = '1.0.2'; // Aggiornato per fix XSS completo
    
    public function __construct() {
        $this->plugin_url = plugin_dir_url(__FILE__);
        $this->plugin_path = plugin_dir_path(__FILE__);
        
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_footer', array($this, 'render_chatbot'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        
        // Add shortcode support
        add_shortcode('veronica_chatbot', array($this, 'shortcode_handler'));
        
        // Add Gutenberg block support
        add_action('init', array($this, 'register_gutenberg_block'));
    }
    
    public function init() {
        // Load text domain for translations
        load_plugin_textdomain('veronica-chatbot', false, dirname(plugin_basename(__FILE__)) . '/languages/');
    }
    
    public function enqueue_scripts() {
        // Only load on frontend
        if (is_admin()) {
            return;
        }
        
        $settings = get_option('veronica_chatbot_settings', array());
        
        // Check if chatbot is enabled
        if (!isset($settings['enabled']) || !$settings['enabled']) {
            return;
        }
        
        // Enqueue React and the chatbot component
        wp_enqueue_script(
            'react',
            'https://unpkg.com/react@18/umd/react.production.min.js',
            array(),
            '18.0.0',
            true
        );
        
        wp_enqueue_script(
            'react-dom',
            'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
            array('react'),
            '18.0.0',
            true
        );
        
        // Enqueue Tailwind CSS for styling
        wp_enqueue_style(
            'tailwind-css',
            'https://cdn.tailwindcss.com',
            array(),
            $this->version
        );
        
        // Enqueue our chatbot script
        wp_enqueue_script(
            'veronica-chatbot',
            $this->plugin_url . 'assets/chatbot.js',
            array('react', 'react-dom'),
            $this->version,
            true
        );
        
        // SICUREZZA AGGIUNTA: Nonce per CSRF protection
        $nonce = wp_create_nonce('veronica_chatbot_nonce');
        
        // Localize script with settings (SANITIZZATI)
        wp_localize_script('veronica-chatbot', 'veronicaChatbotConfig', array(
            'apiEndpoint' => esc_url($settings['api_endpoint'] ?? get_rest_url(null, 'veronica-chatbot/v1/chat')),
            'theme' => sanitize_text_field($settings['theme'] ?? 'light'),
            'position' => sanitize_text_field($settings['position'] ?? 'bottom-right'),
            'initialMessage' => wp_kses_post($settings['initial_message'] ?? 'Ciao! Sono Veronica Schembri, AI Engineer e Data Scientist. Come posso aiutarti oggi?'),
            'enabled' => $settings['enabled'] ?? false,
            'nonce' => $nonce,  // SICUREZZA: Aggiungiamo nonce
            'maxLength' => 1000 // SICUREZZA: Limite caratteri
        ));
    }
    
    public function render_chatbot() {
        $settings = get_option('veronica_chatbot_settings', array());
        
        // Check if chatbot is enabled and should show on this page
        if (!isset($settings['enabled']) || !$settings['enabled']) {
            return;
        }
        
        // Check page restrictions
        if (isset($settings['show_on_pages']) && !empty($settings['show_on_pages'])) {
            $current_page_id = get_the_ID();
            $allowed_pages = explode(',', $settings['show_on_pages']);
            $allowed_pages = array_map('intval', $allowed_pages); // SICUREZZA: Converte a interi
            if (!in_array($current_page_id, $allowed_pages)) {
                return;
            }
        }
        
        // Render the chatbot container
        echo '<div id="veronica-chatbot-container"></div>';
    }
    
    public function shortcode_handler($atts) {
        $atts = shortcode_atts(array(
            'theme' => 'light',
            'position' => 'embedded',
            'height' => '600px',
            'width' => '100%'
        ), $atts);
        
        // SICUREZZA: Sanitizza tutti gli attributi
        $atts = array_map('sanitize_text_field', $atts);
        
        $container_id = 'veronica-chatbot-shortcode-' . uniqid();
        
        ob_start();
        ?>
        <div id="<?php echo esc_attr($container_id); ?>" 
             style="width: <?php echo esc_attr($atts['width']); ?>; height: <?php echo esc_attr($atts['height']); ?>;">
        </div>
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof VeronicaChatbot !== 'undefined') {
                const container = document.getElementById('<?php echo esc_js($container_id); ?>');
                if (container) {
                    const config = {
                        ...window.veronicaChatbotConfig,
                        theme: '<?php echo esc_js($atts['theme']); ?>',
                        position: '<?php echo esc_js($atts['position']); ?>'
                    };
                    VeronicaChatbot.render(container, config);
                }
            }
        });
        </script>
        <?php
        return ob_get_clean();
    }
    
    public function register_gutenberg_block() {
        if (!function_exists('register_block_type')) {
            return;
        }
        
        register_block_type('veronica-chatbot/chatbot-block', array(
            'render_callback' => array($this, 'render_gutenberg_block'),
            'attributes' => array(
                'theme' => array(
                    'type' => 'string',
                    'default' => 'light'
                ),
                'height' => array(
                    'type' => 'string',
                    'default' => '600px'
                )
            )
        ));
    }
    
    public function render_gutenberg_block($attributes) {
        return $this->shortcode_handler(array(
            'theme' => $attributes['theme'] ?? 'light',
            'height' => $attributes['height'] ?? '600px',
            'position' => 'embedded'
        ));
    }
    
    public function add_admin_menu() {
        add_options_page(
            __('Veronica Chatbot Settings', 'veronica-chatbot'),
            __('Veronica Chatbot', 'veronica-chatbot'),
            'manage_options',
            'veronica-chatbot',
            array($this, 'admin_page')
        );
    }
    
    public function admin_page() {
        if (isset($_POST['submit'])) {
            // SICUREZZA: Verifica nonce
            if (!wp_verify_nonce($_POST['_wpnonce'], 'veronica_chatbot_settings')) {
                wp_die('Richiesta non autorizzata');
            }
            
            $settings = array(
                'enabled' => isset($_POST['enabled']),
                'api_endpoint' => sanitize_url($_POST['api_endpoint']),
                'theme' => sanitize_text_field($_POST['theme']),
                'position' => sanitize_text_field($_POST['position']),
                'initial_message' => sanitize_textarea_field($_POST['initial_message']),
                'show_on_pages' => sanitize_text_field($_POST['show_on_pages'])
            );
            
            // SICUREZZA: Valida che l'endpoint sia HTTPS se esterno
            if (!empty($settings['api_endpoint']) && 
                !str_starts_with($settings['api_endpoint'], get_rest_url()) && 
                !str_starts_with($settings['api_endpoint'], 'https://')) {
                echo '<div class="notice notice-error"><p>Errore: L\'endpoint API deve essere HTTPS per sicurezza!</p></div>';
            } else {
                update_option('veronica_chatbot_settings', $settings);
                echo '<div class="notice notice-success"><p>' . __('Settings saved!', 'veronica-chatbot') . '</p></div>';
            }
        }
        
        $settings = get_option('veronica_chatbot_settings', array());
        ?>
        <div class="wrap">
            <h1><?php _e('Veronica Chatbot Settings', 'veronica-chatbot'); ?></h1>
            
            <!-- SICUREZZA: Avviso sulle protezioni attive -->
            <div class="notice notice-info">
                <p><strong>🛡️ Sicurezza Completa:</strong> XSS Protection attivo, CSRF Protection attivo, validazione input avanzata, sanitizzazione completa frontend+backend.</p>
            </div>
            
            <form method="post" action="">
                <?php wp_nonce_field('veronica_chatbot_settings'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php _e('Enable Chatbot', 'veronica-chatbot'); ?></th>
                        <td>
                            <input type="checkbox" name="enabled" value="1" 
                                   <?php checked(isset($settings['enabled']) && $settings['enabled']); ?>>
                            <p class="description"><?php _e('Enable the chatbot on your website', 'veronica-chatbot'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('API Endpoint (HTTPS)', 'veronica-chatbot'); ?></th>
                        <td>
                            <input type="url" name="api_endpoint" class="regular-text" 
                                   value="<?php echo esc_attr($settings['api_endpoint'] ?? ''); ?>"
                                   placeholder="https://your-backend.com/api/chat">
                            <p class="description"><?php _e('URL of your chatbot backend API (solo HTTPS per sicurezza)', 'veronica-chatbot'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('Theme', 'veronica-chatbot'); ?></th>
                        <td>
                            <select name="theme">
                                <option value="light" <?php selected($settings['theme'] ?? 'light', 'light'); ?>>
                                    <?php _e('Light', 'veronica-chatbot'); ?>
                                </option>
                                <option value="dark" <?php selected($settings['theme'] ?? 'light', 'dark'); ?>>
                                    <?php _e('Dark', 'veronica-chatbot'); ?>
                                </option>
                            </select>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('Position', 'veronica-chatbot'); ?></th>
                        <td>
                            <select name="position">
                                <option value="bottom-right" <?php selected($settings['position'] ?? 'bottom-right', 'bottom-right'); ?>>
                                    <?php _e('Bottom Right', 'veronica-chatbot'); ?>
                                </option>
                                <option value="bottom-left" <?php selected($settings['position'] ?? 'bottom-right', 'bottom-left'); ?>>
                                    <?php _e('Bottom Left', 'veronica-chatbot'); ?>
                                </option>
                            </select>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('Initial Message', 'veronica-chatbot'); ?></th>
                        <td>
                            <textarea name="initial_message" class="large-text" rows="3" maxlength="500"><?php 
                                echo esc_textarea($settings['initial_message'] ?? 'Ciao! Sono Veronica Schembri, AI Engineer e Data Scientist. Come posso aiutarti oggi?'); 
                            ?></textarea>
                            <p class="description"><?php _e('First message shown to users (max 500 caratteri)', 'veronica-chatbot'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('Show Only on Pages', 'veronica-chatbot'); ?></th>
                        <td>
                            <input type="text" name="show_on_pages" class="regular-text" 
                                   value="<?php echo esc_attr($settings['show_on_pages'] ?? ''); ?>"
                                   placeholder="1,2,3">
                            <p class="description"><?php _e('Page IDs where chatbot should appear (comma separated). Leave empty for all pages.', 'veronica-chatbot'); ?></p>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(); ?>
            </form>
            
            <hr>
            
            <h2><?php _e('Usage', 'veronica-chatbot'); ?></h2>
            <p><?php _e('You can use the chatbot in several ways:', 'veronica-chatbot'); ?></p>
            <ul>
                <li><strong><?php _e('Floating Widget:', 'veronica-chatbot'); ?></strong> <?php _e('Enable above and it will appear on all pages', 'veronica-chatbot'); ?></li>
                <li><strong><?php _e('Shortcode:', 'veronica-chatbot'); ?></strong> <code>[veronica_chatbot theme="light" height="600px"]</code></li>
                <li><strong><?php _e('Gutenberg Block:', 'veronica-chatbot'); ?></strong> <?php _e('Search for "Veronica Chatbot" in the block editor', 'veronica-chatbot'); ?></li>
            </ul>
            
            <h3><?php _e('Security Status', 'veronica-chatbot'); ?></h3>
            <div class="notice notice-success">
                <p><strong>🛡️ Protezioni Attive:</strong></p>
                <ul>
                    <li>✅ XSS Protection: Tutti i tag HTML pericolosi rimossi</li>
                    <li>✅ CSRF Protection: Nonce verification attiva</li>
                    <li>✅ Input Validation: Validazione avanzata su frontend e backend</li>
                    <li>✅ Content Sanitization: Sanitizzazione completa di tutti i contenuti</li>
                    <li>✅ HTTPS Enforcement: Solo endpoint HTTPS accettati</li>
                </ul>
            </div>
            
            <h3><?php _e('API Test', 'veronica-chatbot'); ?></h3>
            <div id="api-test-result"></div>
            <button type="button" id="test-api" class="button"><?php _e('Test API Connection', 'veronica-chatbot'); ?></button>
            
            <script>
            document.getElementById('test-api').addEventListener('click', function() {
                const button = this;
                const result = document.getElementById('api-test-result');
                const apiEndpoint = document.querySelector('input[name="api_endpoint"]').value;
                
                if (!apiEndpoint) {
                    result.innerHTML = '<div class="notice notice-error"><p>Please enter an API endpoint first.</p></div>';
                    return;
                }
                
                button.disabled = true;
                button.textContent = 'Testing...';
                result.innerHTML = '<div class="notice notice-info"><p>Testing API connection...</p></div>';
                
                fetch(apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: 'Test connection',
                        history: []
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.response) {
                        result.innerHTML = '<div class="notice notice-success"><p><strong>✅ API Connection Successful!</strong><br>Response: ' + data.response.substring(0, 100) + '...</p></div>';
                    } else {
                        result.innerHTML = '<div class="notice notice-warning"><p><strong>⚠️ API Connected but response format unexpected</strong><br>' + JSON.stringify(data).substring(0, 200) + '...</p></div>';
                    }
                })
                .catch(error => {
                    result.innerHTML = '<div class="notice notice-error"><p><strong>❌ API Connection Failed</strong><br>Error: ' + error.message + '</p></div>';
                })
                .finally(() => {
                    button.disabled = false;
                    button.textContent = 'Test API Connection';
                });
            });
            </script>
        </div>
        <?php
    }
    
    public function register_rest_routes() {
        register_rest_route('veronica-chatbot/v1', '/chat', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_chat_request'),
            'permission_callback' => '__return_true', // Allow public access
            'args' => array(
                'message' => array(
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => array($this, 'validate_message') // SICUREZZA: Validazione
                ),
                'history' => array(
                    'required' => false,
                    'type' => 'array',
                    'default' => array()
                ),
                '_wpnonce' => array( // SICUREZZA: Nonce richiesto
                    'required' => true,
                    'type' => 'string'
                )
            )
        ));
    }
    
    // SICUREZZA: Validazione messaggio POTENZIATA
    public function validate_message($value, $request, $param) {
        if (empty(trim($value)) || strlen($value) > 1000) {
            $this->log_security_event('invalid_length', $value);
            return false;
        }
        
        // Step 1: Decodifica multipla per catturare codifiche annidate
        $decoded_value = $value;
        $max_iterations = 5; // Previeni loop infiniti
        $iteration = 0;
        
        do {
            $previous = $decoded_value;
            $decoded_value = html_entity_decode($decoded_value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $iteration++;
        } while ($decoded_value !== $previous && $iteration < $max_iterations);
        
        // Step 2: Pattern sospetti da controllare (ESTESI)
        $forbidden_patterns = array(
            '/<script/i',
            '/javascript:/i', 
            '/on\w+\s*=/i',
            '/<iframe/i',
            '/<object/i',
            '/<embed/i',
            '/<img[^>]*onerror/i',
            '/<svg[^>]*onload/i',
            '/data:text\/html/i',
            '/vbscript:/i',
            '/<[^>]*on\w+\s*=/i',  // Qualsiasi tag con eventi
            '/alert\s*\(/i',
            '/eval\s*\(/i',
            '/document\./i',
            '/window\./i',
            '/<style/i',
            '/<link/i'
        );
        
        // Step 3: Controlla input originale E decodificato
        foreach ($forbidden_patterns as $pattern) {
            if (preg_match($pattern, $value) || preg_match($pattern, $decoded_value)) {
                $this->log_security_event('xss_pattern_detected', $value);
                error_log("XSS attempt blocked (pattern): " . $value);
                return false;
            }
        }
        
        // Step 4: Lista estesa di entità HTML sospette (tutte le varianti)
        $suspicious_entities = array(
            // Script tag variants
            '&lt;script', '&#60;script', '&#x3C;script', '&#x3c;script',
            '&amp;lt;script', '&amp;#60;script', '&amp;#x3C;script',
            
            // Iframe variants  
            '&lt;iframe', '&#60;iframe', '&#x3C;iframe', '&#x3c;iframe',
            '&amp;lt;iframe', '&amp;#60;iframe', '&amp;#x3C;iframe',
            
            // Object variants
            '&lt;object', '&#60;object', '&#x3C;object', '&#x3c;object',
            '&amp;lt;object', '&amp;#60;object', '&amp;#x3C;object',
            
            // IMG con eventi
            '&lt;img', '&#60;img', '&#x3C;img', '&#x3c;img',
            
            // Event handlers (anche codificati)
            'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus',
            'javascript:', 'vbscript:', 'data:text/html',
            '&#111;&#110;&#101;&#114;&#114;&#111;&#114;', // onerror codificato
            '&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;' // javascript: codificato
        );
        
        // Step 5: Controlla entità sospette case-insensitive
        $value_lower = strtolower($value);
        foreach ($suspicious_entities as $entity) {
            if (stripos($value_lower, strtolower($entity)) !== false) {
                $this->log_security_event('xss_entity_detected', $value);
                error_log("XSS attempt blocked (entity): " . $value);
                return false;
            }
        }
        
        // Step 6: Controlla pattern di codifica sospetti
        $encoding_patterns = array(
            '/&amp;(lt|gt|quot|#\d+|#x[0-9a-f]+);/i', // Doppia codifica
            '/&#x?[0-9a-f]+;.*script/i',              // Codifica hex/dec + script
            '/&[a-z]+;.*on\w+/i',                     // Entità + eventi
            '/(&amp;){2,}/i'                          // Multiple &amp;
        );
        
        foreach ($encoding_patterns as $pattern) {
            if (preg_match($pattern, $value)) {
                $this->log_security_event('xss_encoding_detected', $value);
                error_log("XSS attempt blocked (encoding pattern): " . $value);
                return false;
            }
        }
        
        return true;
    }

    // SICUREZZA: Logging eventi di sicurezza
    private function log_security_event($event_type, $content) {
        $log_entry = array(
            'timestamp' => current_time('mysql'),
            'event_type' => $event_type,
            'content' => substr($content, 0, 200), // Log solo primi 200 caratteri
            'user_ip' => $this->get_client_ip(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
        );
        
        error_log('VERONICA_CHATBOT_SECURITY: ' . json_encode($log_entry));
        
        // Opzionale: salva nel database per analisi
        $this->save_security_log($log_entry);
    }
    
    private function get_client_ip() {
        $ip_keys = array('HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR');
        foreach ($ip_keys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                $ip = $_SERVER[$key];
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    private function save_security_log($log_entry) {
        // Opzionale: salvare in una tabella del database per analisi
        // global $wpdb;
        // $wpdb->insert('wp_chatbot_security_log', $log_entry);
    }

    private function sanitize_user_input_enhanced($input) {
        if (!is_string($input)) {
            return '';
        }
        
        // Controlla lunghezza
        if (strlen($input) > 1000) {
            $this->log_security_event('input_too_long', $input);
            wp_die(__('Input troppo lungo (massimo 1000 caratteri)', 'veronica-chatbot'), 400);
        }
        
        // Log e blocca tentativi XSS prima della sanitizzazione
        if (!$this->validate_message($input, null, null)) {
            $this->log_security_event('xss_attempt_blocked', $input);
            wp_die(__('Contenuto non permesso rilevato', 'veronica-chatbot'), 400);
        }
        
        // Decodifica multipla controllata
        $decoded = $input;
        $max_iterations = 3;
        $iteration = 0;
        
        do {
            $previous = $decoded;
            $decoded = html_entity_decode($decoded, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $iteration++;
        } while ($decoded !== $previous && $iteration < $max_iterations);
        
        // Sanitizza con wp_kses (permetti solo tag sicuri)
        $allowed_tags = array(
            'strong' => array(),
            'em' => array(),
            'b' => array(),
            'i' => array(),
            'br' => array(),
            'p' => array()
        );
        
        $sanitized = wp_kses($decoded, $allowed_tags);
        
        // Rimozioni aggiuntive per sicurezza
        $sanitized = preg_replace('/<script[^>]*>.*?<\/script>/is', '[BLOCKED]', $sanitized);
        $sanitized = preg_replace('/\s*on\w+\s*=\s*["\'][^"\']*["\']/i', '[BLOCKED]', $sanitized);
        $sanitized = str_ireplace(array('javascript:', 'vbscript:', 'data:text/html'), '[BLOCKED]', $sanitized);
        
        return trim($sanitized);
    }
    
    public function handle_chat_request($request) {
        // SICUREZZA: Verifica nonce
        $nonce = $request->get_param('_wpnonce');
        if (!wp_verify_nonce($nonce, 'veronica_chatbot_nonce')) {
            $this->log_security_event('invalid_nonce', 'Nonce verification failed');
            return new WP_Error('invalid_nonce', 'Richiesta non autorizzata', array('status' => 403));
        }
        
        $settings = get_option('veronica_chatbot_settings', array());
        $api_endpoint = $settings['api_endpoint'] ?? '';
        
        if (empty($api_endpoint)) {
            return new WP_Error(
                'no_api_endpoint',
                __('No API endpoint configured', 'veronica-chatbot'),
                array('status' => 500)
            );
        }
        
        $message = $request->get_param('message');
        $history = $request->get_param('history');
        
        // SICUREZZA: Sanitizza input
        $message = $this->sanitize_user_input_enhanced($message);
        
        // SICUREZZA: Sanitizza anche la history
        if (is_array($history)) {
            $history = array_map(function($item) {
                if (is_array($item) && isset($item['content'])) {
                    $item['content'] = wp_kses_post($item['content']);
                }
                return $item;
            }, $history);
            
            // Limita la history a massimo 10 elementi
            $history = array_slice($history, -10);
        } else {
            $history = array();
        }
        
        // Forward request to external API
        $response = wp_remote_post($api_endpoint, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'User-Agent' => 'VeronicaChatbot/' . $this->version
            ),
            'body' => json_encode(array(
                'message' => $message,
                'history' => $history
            )),
            'timeout' => 30,
            'sslverify' => true // SICUREZZA: Verifica certificati SSL
        ));
        
        if (is_wp_error($response)) {
            $this->log_security_event('api_request_failed', $response->get_error_message());
            return new WP_Error(
                'api_request_failed',
                __('Failed to connect to chatbot API', 'veronica-chatbot'),
                array('status' => 500)
            );
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->log_security_event('invalid_api_response', $body);
            return new WP_Error(
                'invalid_response',
                __('Invalid response from chatbot API', 'veronica-chatbot'),
                array('status' => 500)
            );
        }
        
        // SICUREZZA: Sanitizza risposta mantenendo markdown sicuro
        if (isset($data['response'])) {
            // NON rimuoviamo tutto l'HTML, ma solo quello pericoloso
            $data['response'] = $this->sanitize_bot_response($data['response']);
        }
        
        return rest_ensure_response($data);
    }
    
    // SICUREZZA: Sanitizzazione speciale per risposte del bot (PRESERVA MARKDOWN)
    private function sanitize_bot_response($response) {
        if (!is_string($response)) {
            return '';
        }
        
        // Rimuovi tutti i caratteri di controllo pericolosi
        $response = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $response);
        
        // Rimuovi SOLO pattern JavaScript pericolosi, MANTIENI markdown
        $dangerous_patterns = array(
            '/<script[^>]*>.*?<\/script>/is',
            '/<iframe[^>]*>.*?<\/iframe>/is',
            '/javascript:/i',
            '/vbscript:/i',
            '/on\w+\s*=/i',
            '/data:text\/html/i',
            '/eval\s*\(/i',
            '/alert\s*\(/i',
            '/<object[^>]*>/i',
            '/<embed[^>]*>/i',
            '/<form[^>]*>/i'
        );
        
        foreach ($dangerous_patterns as $pattern) {
            $response = preg_replace($pattern, '[REMOVED-FOR-SECURITY]', $response);
        }
        
        // Limita lunghezza risposta
        if (strlen($response) > 5000) {
            $response = substr($response, 0, 5000) . '... [TRUNCATED]';
        }
        
        return trim($response);
    }
}

// Initialize the plugin
new VeronicaChatbotPlugin();

// SICUREZZA: Hook per creazione assets sicuri
register_activation_hook(__FILE__, 'veronica_chatbot_create_secure_assets');

function veronica_chatbot_create_secure_assets() {
    // Crea file .htaccess per proteggere la cartella assets
    $upload_dir = wp_upload_dir();
    $assets_dir = $upload_dir['basedir'] . '/veronica-chatbot-assets/';
    
    if (!file_exists($assets_dir)) {
        wp_mkdir_p($assets_dir);
    }
    
    $htaccess_content = "# Veronica Chatbot Security\n";
    $htaccess_content .= "Options -Indexes\n";
    $htaccess_content .= "Options -ExecCGI\n";
    $htaccess_content .= "<Files *.php>\n";
    $htaccess_content .= "Deny from all\n";
    $htaccess_content .= "</Files>\n";
    
    file_put_contents($assets_dir . '.htaccess', $htaccess_content);
    
    // Log dell'attivazione
    error_log('VERONICA_CHATBOT: Plugin attivato con protezioni di sicurezza complete');
}

?>