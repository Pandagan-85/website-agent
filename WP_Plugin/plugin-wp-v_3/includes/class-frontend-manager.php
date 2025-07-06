<?php
/**
 * Frontend Manager Class
 * Estratto da veronica-chatbot.php (righe 801-1200 circa)
 * Gestisce caricamento script, rendering frontend e logica di visualizzazione
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit('Direct access forbidden.');
}

/**
 * Frontend Manager Class
 */
class Veronica_Chatbot_Frontend_Manager {

    /**
     * Settings manager instance
     */
    private $settings_manager;

    /**
     * Constructor
     */
    public function __construct($settings_manager) {
        $this->settings_manager = $settings_manager;
        
        // Setup frontend hooks
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_footer', array($this, 'render_chatbot'));
    }

    /**
     * Enqueue scripts and styles
     * Estratto dal metodo enqueue_scripts() originale
     */
    public function enqueue_scripts() {
        // Check if chatbot should be loaded on this page
        if (!$this->should_load_chatbot()) {
            return;
        }

        $options = $this->settings_manager->get_options();

        // Load React from CDN (production)
        wp_enqueue_script(
            'react',
            'https://unpkg.com/react@18/umd/react.production.min.js',
            array(),
            '18.2.0',
            true
        );

        wp_enqueue_script(
            'react-dom',
            'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
            array('react'),
            '18.2.0',
            true
        );

        // Load chatbot script
        wp_enqueue_script(
            'veronica-chatbot',
            VERONICA_CHATBOT_URL . 'assets/js/chatbot.js',
            array('react', 'react-dom'),
            VERONICA_CHATBOT_VERSION,
            true
        );

        // ✅ AGGIUNGI TYPE=MODULE AL SCRIPT CHATBOT
        add_filter('script_loader_tag', array($this, 'add_type_module_to_script'), 10, 3);

        // Localize script with configuration
        wp_localize_script('veronica-chatbot', 'veronicaChatbotConfig', array(
            'apiUrl' => esc_url($options['api_url']),
            'theme' => sanitize_text_field($options['theme']),
            'position' => sanitize_text_field($options['position']),
            'sessionDuration' => intval($options['session_duration']) * 24 * 60 * 60 * 1000,
            'conversationTimeout' => intval($options['conversation_timeout']) * 60 * 60 * 1000,
            'maxMessages' => intval($options['max_messages']),
            'enablePersistence' => (bool)$options['enable_persistence'],
            'enableCrossPageSync' => (bool)$options['enable_cross_page_sync'],
            'debugMode' => (bool)$options['debug_mode'],
            'nonce' => wp_create_nonce('veronica_chatbot_nonce'),
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'version' => VERONICA_CHATBOT_VERSION
        ));

        // Add inline CSS for better loading
        $this->add_inline_styles();
    }

    /**
     * Add type="module" to chatbot script
     * Estratto dal filtro add_filter nel metodo enqueue_scripts() originale
     */
    public function add_type_module_to_script($tag, $handle, $src) {
        if ($handle === 'veronica-chatbot') {
            // Sostituisci il tag script normale con uno module
            return str_replace('<script ', '<script type="module" ', $tag);
        }
        return $tag;
    }

    /**
     * Add inline styles for loading and base styles
     * Estratto dalla sezione wp_add_inline_style del metodo originale
     */
    private function add_inline_styles() {
        wp_add_inline_style('wp-block-library', '
            #veronica-chatbot-container {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            .veronica-chatbot-loading {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #f66061, #8b5cf6);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
                z-index: 999998;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.7; }
                100% { opacity: 1; }
            }
        ');
    }

    /**
     * Check if chatbot should be loaded on current page
     * Estratto dal metodo should_load_chatbot() originale
     */
    private function should_load_chatbot() {
        $options = $this->settings_manager->get_options();
        
        // Check if enabled
        if (!$options['enabled']) {
            return false;
        }

        // Check admin pages
        if (is_admin()) {
            return false;
        }

        // Check page restrictions
        $pages_setting = $options['pages'];
        
        if ($pages_setting === 'none') {
            return false;
        } elseif ($pages_setting === 'home' && !is_home() && !is_front_page()) {
            return false;
        } elseif ($pages_setting === 'posts' && !is_single()) {
            return false;
        } elseif ($pages_setting === 'pages' && !is_page()) {
            return false;
        }
        // 'all' loads everywhere

        return true;
    }

    /**
     * Render chatbot in footer
     * Estratto dal metodo render_chatbot() originale
     */
    public function render_chatbot() {
        if (!$this->should_load_chatbot()) {
            return;
        }

        // Add loading indicator while React loads
        echo '<div id="veronica-chatbot-loading" class="veronica-chatbot-loading">💬</div>';
        
        // Add container for React component
        echo '<div id="veronica-chatbot-container"></div>';
        
        // Hide loading indicator when chatbot loads
        echo '<script>
            document.addEventListener("DOMContentLoaded", function() {
                setTimeout(function() {
                    var loading = document.getElementById("veronica-chatbot-loading");
                    if (loading) {
                        loading.style.display = "none";
                    }
                }, 2000);
            });
        </script>';
    }

    /**
     * Get chatbot configuration for JavaScript
     * Utility method per ottenere config formattata
     */
    public function get_js_config() {
        $options = $this->settings_manager->get_options();
        
        return array(
            'apiUrl' => esc_url($options['api_url']),
            'theme' => sanitize_text_field($options['theme']),
            'position' => sanitize_text_field($options['position']),
            'sessionDuration' => intval($options['session_duration']) * 24 * 60 * 60 * 1000,
            'conversationTimeout' => intval($options['conversation_timeout']) * 60 * 60 * 1000,
            'maxMessages' => intval($options['max_messages']),
            'enablePersistence' => (bool)$options['enable_persistence'],
            'enableCrossPageSync' => (bool)$options['enable_cross_page_sync'],
            'debugMode' => (bool)$options['debug_mode'],
            'nonce' => wp_create_nonce('veronica_chatbot_nonce'),
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'version' => VERONICA_CHATBOT_VERSION
        );
    }

    /**
     * Check if we're on a supported page type
     * Utility method per verificare il tipo di pagina
     */
    public function is_supported_page_type($page_type) {
        switch ($page_type) {
            case 'home':
                return is_home() || is_front_page();
            case 'posts':
                return is_single();
            case 'pages':
                return is_page();
            case 'all':
                return true;
            case 'none':
            default:
                return false;
        }
    }

    /**
     * Get current page type
     * Utility method per ottenere il tipo di pagina corrente
     */
    public function get_current_page_type() {
        if (is_admin()) {
            return 'admin';
        } elseif (is_home() || is_front_page()) {
            return 'home';
        } elseif (is_single()) {
            return 'post';
        } elseif (is_page()) {
            return 'page';
        } elseif (is_category() || is_tag() || is_archive()) {
            return 'archive';
        } else {
            return 'other';
        }
    }

    /**
     * Enqueue conditional assets based on page type
     * Method aggiuntivo per caricamento condizionale future features
     */
    public function enqueue_conditional_assets() {
        $page_type = $this->get_current_page_type();
        $options = $this->settings_manager->get_options();

        // Carica asset specifici per tipo di pagina se necessario
        switch ($page_type) {
            case 'home':
                // Asset specifici per homepage
                break;
            case 'post':
                // Asset specifici per post
                break;
            case 'page':
                // Asset specifici per pagine
                break;
        }

        // Hook per estensioni future
        do_action('veronica_chatbot_enqueue_conditional_assets', $page_type, $options);
    }

    /**
     * Get loading indicator HTML
     * Utility method per ottenere HTML indicator
     */
    public function get_loading_indicator_html() {
        return '<div id="veronica-chatbot-loading" class="veronica-chatbot-loading">💬</div>';
    }

    /**
     * Get container HTML
     * Utility method per ottenere HTML container
     */
    public function get_container_html() {
        return '<div id="veronica-chatbot-container"></div>';
    }

    /**
     * Get initialization script
     * Utility method per ottenere script di inizializzazione
     */
    public function get_initialization_script() {
        return '<script>
            document.addEventListener("DOMContentLoaded", function() {
                setTimeout(function() {
                    var loading = document.getElementById("veronica-chatbot-loading");
                    if (loading) {
                        loading.style.display = "none";
                    }
                }, 2000);
            });
        </script>';
    }

    /**
     * Check if assets should be loaded
     * Method pubblico per verifiche esterne
     */
    public function should_load_assets() {
        return $this->should_load_chatbot();
    }

    /**
     * Get enqueued scripts info
     * Debug method per vedere script caricati
     */
    public function get_enqueued_scripts_info() {
        return array(
            'react_loaded' => wp_script_is('react', 'enqueued'),
            'react_dom_loaded' => wp_script_is('react-dom', 'enqueued'),
            'chatbot_loaded' => wp_script_is('veronica-chatbot', 'enqueued'),
            'should_load' => $this->should_load_chatbot(),
            'page_type' => $this->get_current_page_type(),
            'options' => $this->settings_manager->get_option('pages')
        );
    }
}