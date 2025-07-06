<?php
/**
 * Utility Functions Class
 * Estratto da veronica-chatbot.php (righe 1801-2395 circa)
 * Gestisce funzioni helper, REST API e statistiche
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit('Direct access forbidden.');
}

/**
 * Utility Functions Class
 */
class Veronica_Chatbot_Utility_Functions {

    /**
     * Settings manager instance
     */
    private $settings_manager;

    /**
     * Constructor
     */
    public function __construct($settings_manager) {
        $this->settings_manager = $settings_manager;
        
        // Setup utility hooks
        $this->setup_utility_hooks();
        
        // Initialize REST API
        add_action('rest_api_init', array($this, 'register_rest_routes'));
    }

    /**
     * Setup utility hooks
     */
    private function setup_utility_hooks() {
        // No specific hooks needed for utilities
        // Future extensions can add hooks here
        do_action('veronica_chatbot_utility_hooks_setup', $this);
    }

    /**
     * Initialize default stats
     * Estratto dalla logica di inizializzazione stats nel metodo activate() originale
     */
    public function init_default_stats() {
        if (!get_option('veronica_chatbot_stats')) {
            add_option('veronica_chatbot_stats', array(
                'total_conversations' => 0,
                'total_messages' => 0,
                'active_sessions' => 0,
                'last_activity' => null
            ));
        }
    }

    /**
     * Update chatbot statistics
     * Estratto dalla funzione veronica_chatbot_update_stats() originale
     */
    public function update_stats($type, $increment = 1) {
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
        
        return $stats;
    }

    /**
     * Get chatbot statistics
     */
    public function get_stats() {
        return get_option('veronica_chatbot_stats', array(
            'total_conversations' => 0,
            'total_messages' => 0,
            'active_sessions' => 0,
            'last_activity' => null
        ));
    }

    /**
     * Reset chatbot statistics
     */
    public function reset_stats() {
        $default_stats = array(
            'total_conversations' => 0,
            'total_messages' => 0,
            'active_sessions' => 0,
            'last_activity' => null
        );

        update_option('veronica_chatbot_stats', $default_stats);
        return $default_stats;
    }

    /**
     * Register REST API endpoints
     * Estratto dalla funzione veronica_chatbot_register_rest_routes() originale
     */
    public function register_rest_routes() {
        register_rest_route('veronica-chatbot/v1', '/stats/update', array(
            'methods' => 'POST',
            'callback' => array($this, 'rest_update_stats'),
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

        // Additional REST endpoint for getting stats
        register_rest_route('veronica-chatbot/v1', '/stats', array(
            'methods' => 'GET',
            'callback' => array($this, 'rest_get_stats'),
            'permission_callback' => array($this, 'check_stats_permission')
        ));

        // REST endpoint for plugin info
        register_rest_route('veronica-chatbot/v1', '/info', array(
            'methods' => 'GET',
            'callback' => array($this, 'rest_get_plugin_info'),
            'permission_callback' => '__return_true'
        ));
    }

    /**
     * REST API callback for updating stats
     * Estratto dalla funzione veronica_chatbot_rest_update_stats() originale
     */
    public function rest_update_stats($request) {
        $type = $request->get_param('type');
        $increment = $request->get_param('increment');
        
        $updated_stats = $this->update_stats($type, $increment);
        
        return new WP_REST_Response(array(
            'success' => true,
            'message' => "Stats updated: $type +$increment",
            'stats' => $updated_stats
        ), 200);
    }

    /**
     * REST API callback for getting stats
     */
    public function rest_get_stats($request) {
        $stats = $this->get_stats();
        
        return new WP_REST_Response(array(
            'success' => true,
            'stats' => $stats,
            'timestamp' => current_time('timestamp')
        ), 200);
    }

    /**
     * REST API callback for plugin info
     */
    public function rest_get_plugin_info($request) {
        $options = $this->settings_manager->get_options();
        
        return new WP_REST_Response(array(
            'success' => true,
            'plugin' => array(
                'name' => 'Veronica Schembri Chatbot',
                'version' => VERONICA_CHATBOT_VERSION,
                'description' => 'AI Chatbot intelligente con LangGraph e persistenza sessioni',
                'author' => 'Veronica Schembri',
                'website' => 'https://www.veronicaschembri.com'
            ),
            'settings' => array(
                'enabled' => $options['enabled'],
                'theme' => $options['theme'],
                'position' => $options['position'],
                'pages' => $options['pages']
            ),
            'endpoints' => array(
                'stats_update' => rest_url('veronica-chatbot/v1/stats/update'),
                'stats_get' => rest_url('veronica-chatbot/v1/stats'),
                'info' => rest_url('veronica-chatbot/v1/info')
            )
        ), 200);
    }

    /**
     * Check permission for stats endpoint
     */
    public function check_stats_permission($request) {
        // Allow if user can manage options or if it's a frontend request
        return current_user_can('manage_options') || !is_admin();
    }

    /**
     * Get plugin performance data
     * Utility method per dati performance
     */
    public function get_performance_data() {
        $stats = $this->get_stats();
        $options = $this->settings_manager->get_options();
        
        return array(
            'stats' => $stats,
            'settings' => array(
                'enabled' => $options['enabled'],
                'persistence' => $options['enable_persistence'],
                'cross_page_sync' => $options['enable_cross_page_sync'],
                'debug_mode' => $options['debug_mode']
            ),
            'system' => array(
                'wp_version' => get_bloginfo('version'),
                'plugin_version' => VERONICA_CHATBOT_VERSION,
                'php_version' => phpversion(),
                'memory_limit' => ini_get('memory_limit'),
                'time_limit' => ini_get('max_execution_time')
            ),
            'last_test' => get_option('veronica_chatbot_last_test', null)
        );
    }

    /**
     * Clean up old data
     * Utility method per pulizia dati vecchi
     */
    public function cleanup_old_data() {
        // Remove old backup stats (older than 30 days)
        $options = wp_load_alloptions();
        $cutoff_time = time() - (30 * DAY_IN_SECONDS);
        
        foreach ($options as $option_name => $option_value) {
            if (strpos($option_name, 'veronica_chatbot_stats_backup_') === 0) {
                // Extract timestamp from option name
                $timestamp_str = str_replace('veronica_chatbot_stats_backup_', '', $option_name);
                $timestamp = strtotime(str_replace('_', ' ', $timestamp_str));
                
                if ($timestamp && $timestamp < $cutoff_time) {
                    delete_option($option_name);
                }
            }
        }
    }

    /**
     * Get system requirements check
     * Utility method per controllo requisiti sistema
     */
    public function check_system_requirements() {
        $requirements = array(
            'php_version' => array(
                'required' => '7.4',
                'current' => phpversion(),
                'met' => version_compare(phpversion(), '7.4', '>=')
            ),
            'wp_version' => array(
                'required' => '5.0',
                'current' => get_bloginfo('version'),
                'met' => version_compare(get_bloginfo('version'), '5.0', '>=')
            ),
            'memory_limit' => array(
                'required' => '128M',
                'current' => ini_get('memory_limit'),
                'met' => $this->convert_to_bytes(ini_get('memory_limit')) >= $this->convert_to_bytes('128M')
            ),
            'curl_extension' => array(
                'required' => true,
                'current' => extension_loaded('curl'),
                'met' => extension_loaded('curl')
            ),
            'json_extension' => array(
                'required' => true,
                'current' => extension_loaded('json'),
                'met' => extension_loaded('json')
            )
        );

        return $requirements;
    }

    /**
     * Convert memory size to bytes
     * Helper method per conversione memoria
     */
    private function convert_to_bytes($size) {
        $size = trim($size);
        $last = strtolower($size[strlen($size) - 1]);
        $value = (int) $size;

        switch ($last) {
            case 'g':
                $value *= 1024;
            case 'm':
                $value *= 1024;
            case 'k':
                $value *= 1024;
        }

        return $value;
    }

    /**
     * Get debug information
     * Utility method per informazioni debug
     */
    public function get_debug_info() {
        return array(
            'plugin' => array(
                'version' => VERONICA_CHATBOT_VERSION,
                'path' => VERONICA_CHATBOT_PATH,
                'url' => VERONICA_CHATBOT_URL,
                'basename' => VERONICA_CHATBOT_BASENAME
            ),
            'settings' => $this->settings_manager->get_options(),
            'stats' => $this->get_stats(),
            'performance' => $this->get_performance_data(),
            'requirements' => $this->check_system_requirements(),
            'constants' => array(
                'WP_DEBUG' => defined('WP_DEBUG') ? WP_DEBUG : false,
                'WP_DEBUG_LOG' => defined('WP_DEBUG_LOG') ? WP_DEBUG_LOG : false,
                'SCRIPT_DEBUG' => defined('SCRIPT_DEBUG') ? SCRIPT_DEBUG : false
            )
        );
    }

    /**
     * Export plugin data
     * Utility method per export dati
     */
    public function export_plugin_data() {
        return array(
            'export_info' => array(
                'timestamp' => current_time('timestamp'),
                'version' => VERONICA_CHATBOT_VERSION,
                'wp_version' => get_bloginfo('version'),
                'site_url' => get_site_url()
            ),
            'settings' => $this->settings_manager->get_options(),
            'stats' => $this->get_stats(),
            'performance_data' => $this->get_performance_data()
        );
    }

    /**
     * Import plugin data
     * Utility method per import dati
     */
    public function import_plugin_data($data) {
        if (!is_array($data) || !isset($data['settings'])) {
            return false;
        }

        // Validate and import settings
        if (isset($data['settings']) && is_array($data['settings'])) {
            $validated_settings = $this->settings_manager->validate_options($data['settings']);
            update_option('veronica_chatbot_options', $validated_settings);
        }

        // Import stats if present
        if (isset($data['stats']) && is_array($data['stats'])) {
            update_option('veronica_chatbot_stats', $data['stats']);
        }

        return true;
    }

    /**
     * Schedule cleanup task
     * Utility method per schedulare pulizia
     */
    public function schedule_cleanup() {
        if (!wp_next_scheduled('veronica_chatbot_cleanup')) {
            wp_schedule_event(time(), 'daily', 'veronica_chatbot_cleanup');
        }
    }

    /**
     * Unschedule cleanup task
     * Utility method per deschedular pulizia
     */
    public function unschedule_cleanup() {
        wp_clear_scheduled_hook('veronica_chatbot_cleanup');
    }

    /**
     * Get available REST endpoints
     * Utility method per lista endpoint
     */
    public function get_rest_endpoints() {
        return array(
            'stats_update' => array(
                'url' => rest_url('veronica-chatbot/v1/stats/update'),
                'method' => 'POST',
                'params' => array('type', 'increment'),
                'description' => 'Update chatbot statistics'
            ),
            'stats_get' => array(
                'url' => rest_url('veronica-chatbot/v1/stats'),
                'method' => 'GET',
                'params' => array(),
                'description' => 'Get current statistics'
            ),
            'info' => array(
                'url' => rest_url('veronica-chatbot/v1/info'),
                'method' => 'GET',
                'params' => array(),
                'description' => 'Get plugin information'
            )
        );
    }
}