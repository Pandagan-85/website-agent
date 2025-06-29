<?php
/**
 * Plugin Name: Veronica Schembri Chatbot
 * Plugin URI: https://www.veronicaschembri.com
 * Description: AI Chatbot intelligente con LangGraph e persistenza sessioni
 * Version: 2.1.0
 * Author: Veronica Schembri
 * Author URI: https://www.veronicaschembri.com
 * License: MIT
 * Requires at least: 5.0
 * Requires PHP: 7.4
 * Text Domain: veronica-chatbot
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit('Direct access forbidden.');
}

// Plugin constants
define('VERONICA_CHATBOT_VERSION', '2.1.0');
define('VERONICA_CHATBOT_PATH', plugin_dir_path(__FILE__));
define('VERONICA_CHATBOT_URL', plugin_dir_url(__FILE__));
define('VERONICA_CHATBOT_BASENAME', plugin_basename(__FILE__));

/**
 * Main Plugin Class
 */
class VeronicaChatbotPlugin {

    /**
     * Constructor
     */
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'admin_init'));
        add_action('wp_footer', array($this, 'render_chatbot'));
        
        // AJAX endpoints for admin
        add_action('wp_ajax_veronica_chatbot_test', array($this, 'test_api_connection'));
        add_action('wp_ajax_veronica_chatbot_reset_stats', array($this, 'reset_usage_stats'));
        
        // Activation/Deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }

    /**
     * Initialize plugin
     */
    public function init() {
        // Load text domain for translations
        load_plugin_textdomain('veronica-chatbot', false, dirname(VERONICA_CHATBOT_BASENAME) . '/languages');
        
        // Initialize default options
        $this->init_default_options();
    }

    /**
     * Initialize default options
     */
    private function init_default_options() {
        $default_options = array(
            'api_url' => 'https://your-backend-url.com/chat',
            'theme' => 'light',
            'position' => 'bottom-right',
            'enabled' => true,
            'pages' => 'all',
            'session_duration' => 7, // giorni
            'conversation_timeout' => 24, // ore
            'max_messages' => 100,
            'enable_persistence' => true,
            'enable_cross_page_sync' => true,
            'debug_mode' => false
        );

        $current_options = get_option('veronica_chatbot_options', array());
        $options = array_merge($default_options, $current_options);
        update_option('veronica_chatbot_options', $options);
    }

    /**
     * Enqueue scripts and styles
     */
    public function enqueue_scripts() {
        // Check if chatbot should be loaded on this page
        if (!$this->should_load_chatbot()) {
            return;
        }

        $options = get_option('veronica_chatbot_options');

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
            VERONICA_CHATBOT_URL . 'assets/chatbot.js',
            array('react', 'react-dom'),
            VERONICA_CHATBOT_VERSION,
            true
        );

        // Localize script with configuration
        wp_localize_script('veronica-chatbot', 'veronicaChatbotConfig', array(
            'apiUrl' => esc_url($options['api_url']),
            'theme' => sanitize_text_field($options['theme']),
            'position' => sanitize_text_field($options['position']),
            'sessionDuration' => intval($options['session_duration']) * 24 * 60 * 60 * 1000, // Convert to milliseconds
            'conversationTimeout' => intval($options['conversation_timeout']) * 60 * 60 * 1000, // Convert to milliseconds
            'maxMessages' => intval($options['max_messages']),
            'enablePersistence' => (bool)$options['enable_persistence'],
            'enableCrossPageSync' => (bool)$options['enable_cross_page_sync'],
            'debugMode' => (bool)$options['debug_mode'],
            'nonce' => wp_create_nonce('veronica_chatbot_nonce'),
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'version' => VERONICA_CHATBOT_VERSION
        ));

        // Add inline CSS for better loading
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
     */
    private function should_load_chatbot() {
        $options = get_option('veronica_chatbot_options');
        
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
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            __('Veronica Chatbot Settings', 'veronica-chatbot'),
            __('Veronica Chatbot', 'veronica-chatbot'),
            'manage_options',
            'veronica-chatbot',
            array($this, 'admin_page')
        );
    }

    /**
     * Admin settings initialization
     */
    public function admin_init() {
        register_setting('veronica_chatbot_options', 'veronica_chatbot_options', array($this, 'validate_options'));

        // Main Settings Section
        add_settings_section(
            'veronica_chatbot_main',
            __('Configurazione Principale', 'veronica-chatbot'),
            array($this, 'section_main_callback'),
            'veronica-chatbot'
        );

        // API Settings
        add_settings_field(
            'api_url',
            __('URL API Backend', 'veronica-chatbot'),
            array($this, 'field_api_url_callback'),
            'veronica-chatbot',
            'veronica_chatbot_main'
        );

        add_settings_field(
            'enabled',
            __('Abilita Chatbot', 'veronica-chatbot'),
            array($this, 'field_enabled_callback'),
            'veronica-chatbot',
            'veronica_chatbot_main'
        );

        // Appearance Settings Section
        add_settings_section(
            'veronica_chatbot_appearance',
            __('Aspetto e Posizione', 'veronica-chatbot'),
            array($this, 'section_appearance_callback'),
            'veronica-chatbot'
        );

        add_settings_field(
            'theme',
            __('Tema', 'veronica-chatbot'),
            array($this, 'field_theme_callback'),
            'veronica-chatbot',
            'veronica_chatbot_appearance'
        );

        add_settings_field(
            'position',
            __('Posizione', 'veronica-chatbot'),
            array($this, 'field_position_callback'),
            'veronica-chatbot',
            'veronica_chatbot_appearance'
        );

        // Display Settings Section
        add_settings_section(
            'veronica_chatbot_display',
            __('Impostazioni Visualizzazione', 'veronica-chatbot'),
            array($this, 'section_display_callback'),
            'veronica-chatbot'
        );

        add_settings_field(
            'pages',
            __('Mostra su Pagine', 'veronica-chatbot'),
            array($this, 'field_pages_callback'),
            'veronica-chatbot',
            'veronica_chatbot_display'
        );

        // Persistence Settings Section
        add_settings_section(
            'veronica_chatbot_persistence',
            __('Gestione Persistenza', 'veronica-chatbot'),
            array($this, 'section_persistence_callback'),
            'veronica-chatbot'
        );

        add_settings_field(
            'session_duration',
            __('Durata Sessione (giorni)', 'veronica-chatbot'),
            array($this, 'field_session_duration_callback'),
            'veronica-chatbot',
            'veronica_chatbot_persistence'
        );

        add_settings_field(
            'conversation_timeout',
            __('Timeout Conversazione (ore)', 'veronica-chatbot'),
            array($this, 'field_conversation_timeout_callback'),
            'veronica-chatbot',
            'veronica_chatbot_persistence'
        );

        add_settings_field(
            'max_messages',
            __('Massimo Messaggi in Memoria', 'veronica-chatbot'),
            array($this, 'field_max_messages_callback'),
            'veronica-chatbot',
            'veronica_chatbot_persistence'
        );

        add_settings_field(
            'enable_persistence',
            __('Abilita Persistenza', 'veronica-chatbot'),
            array($this, 'field_enable_persistence_callback'),
            'veronica-chatbot',
            'veronica_chatbot_persistence'
        );

        add_settings_field(
            'enable_cross_page_sync',
            __('Sincronizzazione Cross-Page', 'veronica-chatbot'),
            array($this, 'field_enable_cross_page_sync_callback'),
            'veronica-chatbot',
            'veronica_chatbot_persistence'
        );

        // Debug Settings Section
        add_settings_section(
            'veronica_chatbot_debug',
            __('Debug e Sviluppo', 'veronica-chatbot'),
            array($this, 'section_debug_callback'),
            'veronica-chatbot'
        );

        add_settings_field(
            'debug_mode',
            __('Modalità Debug', 'veronica-chatbot'),
            array($this, 'field_debug_mode_callback'),
            'veronica-chatbot',
            'veronica_chatbot_debug'
        );
    }

    /**
     * Validate options
     */
    public function validate_options($input) {
        $validated = array();
        
        $validated['api_url'] = esc_url_raw($input['api_url']);
        $validated['theme'] = in_array($input['theme'], array('light', 'dark')) ? $input['theme'] : 'light';
        $validated['position'] = in_array($input['position'], array('bottom-right', 'bottom-left')) ? $input['position'] : 'bottom-right';
        $validated['enabled'] = isset($input['enabled']) ? true : false;
        $validated['pages'] = in_array($input['pages'], array('all', 'home', 'posts', 'pages', 'none')) ? $input['pages'] : 'all';
        
        // Persistence settings
        $validated['session_duration'] = max(1, min(30, intval($input['session_duration'])));
        $validated['conversation_timeout'] = max(1, min(168, intval($input['conversation_timeout'])));
        $validated['max_messages'] = max(10, min(500, intval($input['max_messages'])));
        $validated['enable_persistence'] = isset($input['enable_persistence']) ? true : false;
        $validated['enable_cross_page_sync'] = isset($input['enable_cross_page_sync']) ? true : false;
        
        // Debug
        $validated['debug_mode'] = isset($input['debug_mode']) ? true : false;

        return $validated;
    }

    /**
     * Admin page HTML
     */
    public function admin_page() {
        $options = get_option('veronica_chatbot_options');
        ?>
        <div class="wrap">
            <h1><?php echo esc_html__('Veronica Chatbot Settings', 'veronica-chatbot'); ?></h1>
            
            <div class="notice notice-info">
                <p>
                    <strong><?php echo esc_html__('Veronica Schembri AI Chatbot', 'veronica-chatbot'); ?></strong> - 
                    <?php echo esc_html__('Versione', 'veronica-chatbot'); ?> <?php echo VERONICA_CHATBOT_VERSION; ?>
                </p>
                <p><?php echo esc_html__('Chatbot intelligente con persistenza sessioni e sincronizzazione cross-page.', 'veronica-chatbot'); ?></p>
            </div>

            <?php if (isset($_GET['settings-updated'])): ?>
                <div class="notice notice-success is-dismissible">
                    <p><?php echo esc_html__('Impostazioni salvate!', 'veronica-chatbot'); ?></p>
                </div>
            <?php endif; ?>

            <div id="poststuff">
                <div id="post-body" class="metabox-holder columns-2">
                    <div id="post-body-content">
                        <form method="post" action="options.php">
                            <?php
                            settings_fields('veronica_chatbot_options');
                            do_settings_sections('veronica-chatbot');
                            submit_button();
                            ?>
                        </form>
                    </div>
                    
                    <div id="postbox-container-1" class="postbox-container">
                        <!-- Info Box -->
                        <div class="postbox">
                            <h2 class="hndle"><span><?php echo esc_html__('Informazioni', 'veronica-chatbot'); ?></span></h2>
                            <div class="inside">
                                <p><strong><?php echo esc_html__('Stato:', 'veronica-chatbot'); ?></strong> 
                                    <span style="color: <?php echo $options['enabled'] ? 'green' : 'red'; ?>">
                                        <?php echo $options['enabled'] ? esc_html__('Attivo', 'veronica-chatbot') : esc_html__('Disattivo', 'veronica-chatbot'); ?>
                                    </span>
                                </p>
                                <p><strong><?php echo esc_html__('API URL:', 'veronica-chatbot'); ?></strong><br>
                                    <code><?php echo esc_html($options['api_url']); ?></code>
                                </p>
                                <p><strong><?php echo esc_html__('Tema:', 'veronica-chatbot'); ?></strong> <?php echo esc_html(ucfirst($options['theme'])); ?></p>
                                <p><strong><?php echo esc_html__('Posizione:', 'veronica-chatbot'); ?></strong> <?php echo esc_html($options['position']); ?></p>
                                
                                <hr>
                                
                                <h4><?php echo esc_html__('Persistenza', 'veronica-chatbot'); ?></h4>
                                <p><strong><?php echo esc_html__('Durata Sessione:', 'veronica-chatbot'); ?></strong> <?php echo esc_html($options['session_duration']); ?> giorni</p>
                                <p><strong><?php echo esc_html__('Timeout Conversazione:', 'veronica-chatbot'); ?></strong> <?php echo esc_html($options['conversation_timeout']); ?> ore</p>
                                <p><strong><?php echo esc_html__('Max Messaggi:', 'veronica-chatbot'); ?></strong> <?php echo esc_html($options['max_messages']); ?></p>
                                
                                <hr>
                                
                                <button type="button" id="test-api" class="button button-secondary">
                                    <?php echo esc_html__('Testa Connessione API', 'veronica-chatbot'); ?>
                                </button>
                                
                                <div id="api-test-result" style="margin-top: 10px;"></div>
                            </div>
                        </div>

                        <!-- Usage Stats Box -->
                        <div class="postbox">
                            <h2 class="hndle"><span><?php echo esc_html__('Statistiche Utilizzo', 'veronica-chatbot'); ?></span></h2>
                            <div class="inside">
                                <?php $this->display_usage_stats(); ?>
                                
                                <button type="button" id="reset-stats" class="button button-secondary">
                                    <?php echo esc_html__('Reset Statistiche', 'veronica-chatbot'); ?>
                                </button>
                            </div>
                        </div>

                        <!-- Documentation Box -->
                        <div class="postbox">
                            <h2 class="hndle"><span><?php echo esc_html__('Documentazione', 'veronica-chatbot'); ?></span></h2>
                            <div class="inside">
                                <h4><?php echo esc_html__('Come funziona la persistenza:', 'veronica-chatbot'); ?></h4>
                                <ul>
                                    <li><strong>Sessioni:</strong> Ogni utente ha una sessione univoca che persiste per X giorni</li>
                                    <li><strong>Messaggi:</strong> La cronologia chat viene salvata nel localStorage del browser</li>
                                    <li><strong>Cross-Page:</strong> La conversazione continua tra pagine diverse del sito</li>
                                    <li><strong>Reset Automatico:</strong> Le sessioni si resettano dopo inattività prolungata</li>
                                </ul>
                                
                                <h4><?php echo esc_html__('Debug:', 'veronica-chatbot'); ?></h4>
                                <p>In modalità debug, sono disponibili funzioni di debugging nella console:</p>
                                <code>window.VeronicaChatbotDebug.showSessionInfo()</code>
                                
                                <hr>
                                
                                <p><strong><?php echo esc_html__('Supporto:', 'veronica-chatbot'); ?></strong><br>
                                    <a href="https://www.veronicaschembri.com" target="_blank">www.veronicaschembri.com</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <script>
            jQuery(document).ready(function($) {
                // Test API connection
                $('#test-api').click(function() {
                    var button = $(this);
                    var result = $('#api-test-result');
                    
                    button.prop('disabled', true).text('<?php echo esc_js(__('Testing...', 'veronica-chatbot')); ?>');
                    result.html('<div class="notice notice-info inline"><p>Testing API connection...</p></div>');
                    
                    $.post(ajaxurl, {
                        action: 'veronica_chatbot_test',
                        nonce: '<?php echo wp_create_nonce('veronica_chatbot_test'); ?>'
                    })
                    .done(function(response) {
                        if (response.success) {
                            result.html('<div class="notice notice-success inline"><p>✅ API connection successful!</p></div>');
                        } else {
                            result.html('<div class="notice notice-error inline"><p>❌ API connection failed: ' + response.data + '</p></div>');
                        }
                    })
                    .fail(function() {
                        result.html('<div class="notice notice-error inline"><p>❌ Test failed - check network connection</p></div>');
                    })
                    .always(function() {
                        button.prop('disabled', false).text('<?php echo esc_js(__('Testa Connessione API', 'veronica-chatbot')); ?>');
                    });
                });

                // Reset stats
                $('#reset-stats').click(function() {
                    if (confirm('<?php echo esc_js(__('Sei sicuro di voler resettare le statistiche?', 'veronica-chatbot')); ?>')) {
                        var button = $(this);
                        button.prop('disabled', true).text('<?php echo esc_js(__('Resetting...', 'veronica-chatbot')); ?>');
                        
                        $.post(ajaxurl, {
                            action: 'veronica_chatbot_reset_stats',
                            nonce: '<?php echo wp_create_nonce('veronica_chatbot_reset_stats'); ?>'
                        })
                        .done(function(response) {
                            if (response.success) {
                                location.reload();
                            }
                        })
                        .always(function() {
                            button.prop('disabled', false).text('<?php echo esc_js(__('Reset Statistiche', 'veronica-chatbot')); ?>');
                        });
                    }
                });
            });
            </script>
        </div>
        <?php
    }

    /**
     * Display usage statistics
     */
    private function display_usage_stats() {
        $stats = get_option('veronica_chatbot_stats', array(
            'total_conversations' => 0,
            'total_messages' => 0,
            'active_sessions' => 0,
            'last_activity' => null
        ));
        ?>
        <p><strong><?php echo esc_html__('Conversazioni Totali:', 'veronica-chatbot'); ?></strong> <?php echo esc_html($stats['total_conversations']); ?></p>
        <p><strong><?php echo esc_html__('Messaggi Totali:', 'veronica-chatbot'); ?></strong> <?php echo esc_html($stats['total_messages']); ?></p>
        <p><strong><?php echo esc_html__('Sessioni Attive:', 'veronica-chatbot'); ?></strong> <?php echo esc_html($stats['active_sessions']); ?></p>
        <?php if ($stats['last_activity']): ?>
            <p><strong><?php echo esc_html__('Ultima Attività:', 'veronica-chatbot'); ?></strong> <?php echo esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), $stats['last_activity'])); ?></p>
        <?php endif; ?>
        <?php
    }

    // =====================================
    // SECTION CALLBACKS
    // =====================================

    public function section_main_callback() {
        echo '<p>' . esc_html__('Configurazione principale del chatbot.', 'veronica-chatbot') . '</p>';
    }

    public function section_appearance_callback() {
        echo '<p>' . esc_html__('Personalizza aspetto e posizionamento del chatbot.', 'veronica-chatbot') . '</p>';
    }

    public function section_display_callback() {
        echo '<p>' . esc_html__('Controlla dove viene visualizzato il chatbot.', 'veronica-chatbot') . '</p>';
    }

    public function section_persistence_callback() {
        echo '<p>' . esc_html__('Gestisce la persistenza delle conversazioni e sessioni utente.', 'veronica-chatbot') . '</p>';
    }

    public function section_debug_callback() {
        echo '<p>' . esc_html__('Opzioni per debugging e sviluppo.', 'veronica-chatbot') . '</p>';
    }

    // =====================================
    // FIELD CALLBACKS
    // =====================================

    public function field_api_url_callback() {
        $options = get_option('veronica_chatbot_options');
        echo '<input type="url" id="api_url" name="veronica_chatbot_options[api_url]" value="' . esc_attr($options['api_url']) . '" class="regular-text" required />';
        echo '<p class="description">' . esc_html__('URL del tuo backend API (es: https://your-api.com/chat)', 'veronica-chatbot') . '</p>';
    }

    public function field_enabled_callback() {
        $options = get_option('veronica_chatbot_options');
        echo '<input type="checkbox" id="enabled" name="veronica_chatbot_options[enabled]" value="1"' . checked(1, $options['enabled'], false) . ' />';
        echo '<label for="enabled">' . esc_html__('Abilita il chatbot sul sito', 'veronica-chatbot') . '</label>';
    }

    public function field_theme_callback() {
        $options = get_option('veronica_chatbot_options');
        $themes = array(
            'light' => __('Chiaro', 'veronica-chatbot'),
            'dark' => __('Scuro', 'veronica-chatbot')
        );
        
        echo '<select id="theme" name="veronica_chatbot_options[theme]">';
        foreach ($themes as $value => $label) {
            echo '<option value="' . esc_attr($value) . '"' . selected($value, $options['theme'], false) . '>' . esc_html($label) . '</option>';
        }
        echo '</select>';
    }

    public function field_position_callback() {
        $options = get_option('veronica_chatbot_options');
        $positions = array(
            'bottom-right' => __('Basso a destra', 'veronica-chatbot'),
            'bottom-left' => __('Basso a sinistra', 'veronica-chatbot')
        );
        
        echo '<select id="position" name="veronica_chatbot_options[position]">';
        foreach ($positions as $value => $label) {
            echo '<option value="' . esc_attr($value) . '"' . selected($value, $options['position'], false) . '>' . esc_html($label) . '</option>';
        }
        echo '</select>';
    }

    public function field_pages_callback() {
        $options = get_option('veronica_chatbot_options');
        $page_options = array(
            'all' => __('Tutte le pagine', 'veronica-chatbot'),
            'home' => __('Solo homepage', 'veronica-chatbot'),
            'posts' => __('Solo articoli', 'veronica-chatbot'),
            'pages' => __('Solo pagine statiche', 'veronica-chatbot'),
            'none' => __('Nessuna pagina (disabilitato)', 'veronica-chatbot')
        );
        
        echo '<select id="pages" name="veronica_chatbot_options[pages]">';
        foreach ($page_options as $value => $label) {
            echo '<option value="' . esc_attr($value) . '"' . selected($value, $options['pages'], false) . '>' . esc_html($label) . '</option>';
        }
        echo '</select>';
    }

    public function field_session_duration_callback() {
        $options = get_option('veronica_chatbot_options');
        echo '<input type="number" id="session_duration" name="veronica_chatbot_options[session_duration]" value="' . esc_attr($options['session_duration']) . '" min="1" max="30" />';
        echo '<p class="description">' . esc_html__('Durata massima di una sessione in giorni (1-30)', 'veronica-chatbot') . '</p>';
    }

    public function field_conversation_timeout_callback() {
        $options = get_option('veronica_chatbot_options');
        echo '<input type="number" id="conversation_timeout" name="veronica_chatbot_options[conversation_timeout]" value="' . esc_attr($options['conversation_timeout']) . '" min="1" max="168" />';
        echo '<p class="description">' . esc_html__('Ore di inattività prima del reset conversazione (1-168)', 'veronica-chatbot') . '</p>';
    }

    public function field_max_messages_callback() {
        $options = get_option('veronica_chatbot_options');
        echo '<input type="number" id="max_messages" name="veronica_chatbot_options[max_messages]" value="' . esc_attr($options['max_messages']) . '" min="10" max="500" />';
        echo '<p class="description">' . esc_html__('Numero massimo di messaggi salvati in memoria (10-500)', 'veronica-chatbot') . '</p>';
    }

    public function field_enable_persistence_callback() {
        $options = get_option('veronica_chatbot_options');
        echo '<input type="checkbox" id="enable_persistence" name="veronica_chatbot_options[enable_persistence]" value="1"' . checked(1, $options['enable_persistence'], false) . ' />';
        echo '<label for="enable_persistence">' . esc_html__('Abilita persistenza sessioni e messaggi', 'veronica-chatbot') . '</label>';
        echo '<p class="description">' . esc_html__('Salva le conversazioni nel browser dell\'utente', 'veronica-chatbot') . '</p>';
    }

    public function field_enable_cross_page_sync_callback() {
        $options = get_option('veronica_chatbot_options');
        echo '<input type="checkbox" id="enable_cross_page_sync" name="veronica_chatbot_options[enable_cross_page_sync]" value="1"' . checked(1, $options['enable_cross_page_sync'], false) . ' />';
        echo '<label for="enable_cross_page_sync">' . esc_html__('Abilita sincronizzazione tra pagine', 'veronica-chatbot') . '</label>';
        echo '<p class="description">' . esc_html__('Mantiene la conversazione aperta quando l\'utente naviga', 'veronica-chatbot') . '</p>';
    }

    public function field_debug_mode_callback() {
        $options = get_option('veronica_chatbot_options');
        echo '<input type="checkbox" id="debug_mode" name="veronica_chatbot_options[debug_mode]" value="1"' . checked(1, $options['debug_mode'], false) . ' />';
        echo '<label for="debug_mode">' . esc_html__('Abilita modalità debug', 'veronica-chatbot') . '</label>';
        echo '<p class="description">' . esc_html__('Aggiunge funzioni di debugging alla console browser', 'veronica-chatbot') . '</p>';
    }

    // =====================================
    // AJAX HANDLERS
    // =====================================

    /**
     * Test API connection
     */
    public function test_api_connection() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'veronica_chatbot_test')) {
            wp_die('Security check failed');
        }

        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_die('Insufficient permissions');
        }

        $options = get_option('veronica_chatbot_options');
        $api_url = $options['api_url'];

        if (empty($api_url)) {
            wp_send_json_error('API URL not configured');
            return;
        }

        // Test API connection
        $response = wp_remote_post($api_url, array(
            'method' => 'POST',
            'timeout' => 15,
            'headers' => array(
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode(array(
                'message' => 'Test connection from WordPress',
                'thread_id' => 'wordpress_test_' . time()
            ))
        ));

        if (is_wp_error($response)) {
            wp_send_json_error('Connection failed: ' . $response->get_error_message());
            return;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);

        if ($response_code === 200) {
            // Update last successful test
            update_option('veronica_chatbot_last_test', time());
            wp_send_json_success('API connection successful (HTTP 200)');
        } else {
            wp_send_json_error("API returned HTTP $response_code: " . substr($response_body, 0, 100));
        }
    }

    /**
     * Reset usage statistics
     */
    public function reset_usage_stats() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'veronica_chatbot_reset_stats')) {
            wp_die('Security check failed');
        }

        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_die('Insufficient permissions');
        }

        // Reset stats
        $default_stats = array(
            'total_conversations' => 0,
            'total_messages' => 0,
            'active_sessions' => 0,
            'last_activity' => null
        );

        update_option('veronica_chatbot_stats', $default_stats);
        wp_send_json_success('Statistics reset successfully');
    }

    // =====================================
    // ACTIVATION/DEACTIVATION
    // =====================================

    /**
     * Plugin activation
     */
    public function activate() {
        // Initialize default options
        $this->init_default_options();
        
        // Initialize stats
        if (!get_option('veronica_chatbot_stats')) {
            add_option('veronica_chatbot_stats', array(
                'total_conversations' => 0,
                'total_messages' => 0,
                'active_sessions' => 0,
                'last_activity' => null
            ));
        }

        // Log activation
        error_log('Veronica Chatbot Plugin activated - Version ' . VERONICA_CHATBOT_VERSION);
    }

    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clean up scheduled events if any
        wp_clear_scheduled_hook('veronica_chatbot_cleanup');
        
        // Log deactivation
        error_log('Veronica Chatbot Plugin deactivated');
    }
}

// =====================================
// UTILITY FUNCTIONS
// =====================================

/**
 * Get chatbot options with defaults
 */
function veronica_chatbot_get_options() {
    $defaults = array(
        'api_url' => 'https://your-backend-url.com/chat',
        'theme' => 'light',
        'position' => 'bottom-right',
        'enabled' => true,
        'pages' => 'all',
        'session_duration' => 7,
        'conversation_timeout' => 24,
        'max_messages' => 100,
        'enable_persistence' => true,
        'enable_cross_page_sync' => true,
        'debug_mode' => false
    );

    $options = get_option('veronica_chatbot_options', array());
    return array_merge($defaults, $options);
}

/**
 * Update chatbot statistics
 */
function veronica_chatbot_update_stats($type, $increment = 1) {
    $stats = get_option('veronica_chatbot_stats', array(
        'total_conversations' => 0,
        'total_messages' => 0,
        'active_sessions' => 0,
        'last_activity' => null
    ));

    switch ($type) {
        case 'conversation':
            $stats['total_conversations'] += $increment;
            break;
        case 'message':
            $stats['total_messages'] += $increment;
            break;
        case 'session':
            $stats['active_sessions'] += $increment;
            break;
    }

    $stats['last_activity'] = time();
    update_option('veronica_chatbot_stats', $stats);
}

/**
 * Check if chatbot is enabled
 */
function veronica_chatbot_is_enabled() {
    $options = veronica_chatbot_get_options();
    return $options['enabled'];
}

// =====================================
// REST API ENDPOINTS (Optional)
// =====================================

/**
 * Register REST API endpoints for frontend stats tracking
 */
function veronica_chatbot_register_rest_routes() {
    register_rest_route('veronica-chatbot/v1', '/stats/update', array(
        'methods' => 'POST',
        'callback' => 'veronica_chatbot_rest_update_stats',
        'permission_callback' => '__return_true', // Public endpoint
        'args' => array(
            'type' => array(
                'required' => true,
                'type' => 'string',
                'enum' => array('conversation', 'message', 'session')
            ),
            'increment' => array(
                'default' => 1,
                'type' => 'integer',
                'minimum' => 1
            )
        )
    ));
}

/**
 * REST API callback for updating stats
 */
function veronica_chatbot_rest_update_stats($request) {
    $type = $request->get_param('type');
    $increment = $request->get_param('increment');
    
    veronica_chatbot_update_stats($type, $increment);
    
    return new WP_REST_Response(array(
        'success' => true,
        'message' => "Stats updated: $type +$increment"
    ), 200);
}

// Register REST routes
add_action('rest_api_init', 'veronica_chatbot_register_rest_routes');

// =====================================
// INITIALIZE PLUGIN
// =====================================

// Initialize the plugin
function veronica_chatbot_init() {
    new VeronicaChatbotPlugin();
}

// Hook into WordPress
add_action('plugins_loaded', 'veronica_chatbot_init');

// Add settings link in plugins page
function veronica_chatbot_settings_link($links) {
    $settings_link = '<a href="options-general.php?page=veronica-chatbot">' . __('Impostazioni', 'veronica-chatbot') . '</a>';
    array_unshift($links, $settings_link);
    return $links;
}
add_filter('plugin_action_links_' . VERONICA_CHATBOT_BASENAME, 'veronica_chatbot_settings_link');

// Add plugin meta links
function veronica_chatbot_meta_links($links, $file) {
    if ($file === VERONICA_CHATBOT_BASENAME) {
        $links[] = '<a href="https://www.veronicaschembri.com" target="_blank">' . __('Supporto', 'veronica-chatbot') . '</a>';
        $links[] = '<a href="https://github.com/veronica-schembri/chatbot" target="_blank">' . __('GitHub', 'veronica-chatbot') . '</a>';
    }
    return $links;
}
add_filter('plugin_row_meta', 'veronica_chatbot_meta_links', 10, 2);

?>