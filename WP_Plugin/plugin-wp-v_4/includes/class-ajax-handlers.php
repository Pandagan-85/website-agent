<?php
/**
 * AJAX Handlers Class
 * Estratto da veronica-chatbot.php (righe 1201-1500 circa)
 * Gestisce tutti gli endpoint AJAX del plugin
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit('Direct access forbidden.');
}

/**
 * AJAX Handlers Class
 */
class Veronica_Chatbot_Ajax_Handlers {

    /**
     * Settings manager instance
     */
    private $settings_manager;

    /**
     * Constructor
     */
    public function __construct($settings_manager) {
        $this->settings_manager = $settings_manager;
        
        // Setup AJAX hooks
        $this->setup_ajax_hooks();
    }

    /**
     * Setup AJAX hooks
     */
    private function setup_ajax_hooks() {
        // AJAX endpoints for admin
        add_action('wp_ajax_veronica_chatbot_test', array($this, 'test_api_connection'));
        add_action('wp_ajax_veronica_chatbot_reset_stats', array($this, 'reset_usage_stats'));
        
        // Hook per future estensioni AJAX
        do_action('veronica_chatbot_ajax_hooks_setup', $this);
    }

    /**
     * Test API connection
     * Estratto dal metodo test_api_connection() originale
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

        $options = $this->settings_manager->get_options();
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
     * Estratto dal metodo reset_usage_stats() originale
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

    /**
     * Validate AJAX request security
     * Utility method per validazione sicurezza
     */
    private function validate_ajax_request($nonce_action, $capability = 'manage_options') {
        // Check if it's an AJAX request
        if (!wp_doing_ajax()) {
            return false;
        }

        // Verify nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], $nonce_action)) {
            return false;
        }

        // Check permissions
        if (!current_user_can($capability)) {
            return false;
        }

        return true;
    }

    /**
     * Send standardized AJAX error response
     * Utility method per risposte errore standardizzate
     */
    private function send_ajax_error($message, $data = null) {
        $response = array(
            'success' => false,
            'message' => $message,
            'timestamp' => current_time('timestamp')
        );

        if ($data !== null) {
            $response['data'] = $data;
        }

        wp_send_json_error($response);
    }

    /**
     * Send standardized AJAX success response
     * Utility method per risposte successo standardizzate
     */
    private function send_ajax_success($message, $data = null) {
        $response = array(
            'success' => true,
            'message' => $message,
            'timestamp' => current_time('timestamp')
        );

        if ($data !== null) {
            $response['data'] = $data;
        }

        wp_send_json_success($response);
    }

    /**
     * Log AJAX activity
     * Utility method per logging attività AJAX
     */
    private function log_ajax_activity($action, $status, $details = '') {
        if ($this->settings_manager->get_option('debug_mode', false)) {
            error_log(sprintf(
                'Veronica Chatbot AJAX: %s - %s - %s - User: %d',
                $action,
                $status,
                $details,
                get_current_user_id()
            ));
        }
    }

    /**
     * Get API connection test data
     * Utility method per preparare dati test API
     */
    private function get_api_test_data() {
        return array(
            'message' => 'Test connection from WordPress',
            'thread_id' => 'wordpress_test_' . time(),
            'source' => 'wordpress_admin',
            'timestamp' => current_time('timestamp'),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
            'wp_version' => get_bloginfo('version'),
            'plugin_version' => VERONICA_CHATBOT_VERSION
        );
    }

    /**
     * Enhanced API connection test with detailed logging
     * Versione migliorata del test API con logging dettagliato
     */
    public function enhanced_api_test() {
        // Validate request
        if (!$this->validate_ajax_request('veronica_chatbot_test')) {
            $this->log_ajax_activity('api_test', 'security_failed', 'Invalid nonce or permissions');
            $this->send_ajax_error('Security validation failed');
            return;
        }

        $options = $this->settings_manager->get_options();
        $api_url = $options['api_url'];

        if (empty($api_url)) {
            $this->log_ajax_activity('api_test', 'config_error', 'No API URL configured');
            $this->send_ajax_error('API URL not configured');
            return;
        }

        $this->log_ajax_activity('api_test', 'started', "Testing: $api_url");

        // Prepare test data
        $test_data = $this->get_api_test_data();

        // Make API request
        $start_time = microtime(true);
        $response = wp_remote_post($api_url, array(
            'method' => 'POST',
            'timeout' => 15,
            'headers' => array(
                'Content-Type' => 'application/json',
                'User-Agent' => 'WordPress-VeronicaChatbot/' . VERONICA_CHATBOT_VERSION
            ),
            'body' => json_encode($test_data)
        ));
        $response_time = round((microtime(true) - $start_time) * 1000, 2);

        if (is_wp_error($response)) {
            $error_message = $response->get_error_message();
            $this->log_ajax_activity('api_test', 'wp_error', $error_message);
            $this->send_ajax_error('Connection failed: ' . $error_message);
            return;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);
        $response_headers = wp_remote_retrieve_headers($response);

        // Log detailed response info
        $this->log_ajax_activity('api_test', 'completed', sprintf(
            'Code: %d, Time: %sms, Size: %d bytes',
            $response_code,
            $response_time,
            strlen($response_body)
        ));

        if ($response_code === 200) {
            // Update last successful test
            update_option('veronica_chatbot_last_test', time());
            
            $success_data = array(
                'response_time' => $response_time . 'ms',
                'response_size' => strlen($response_body) . ' bytes',
                'server' => $response_headers['server'] ?? 'Unknown',
                'content_type' => $response_headers['content-type'] ?? 'Unknown'
            );

            $this->send_ajax_success('API connection successful (HTTP 200)', $success_data);
        } else {
            $error_data = array(
                'http_code' => $response_code,
                'response_time' => $response_time . 'ms',
                'response_preview' => substr($response_body, 0, 200)
            );

            $this->send_ajax_error("API returned HTTP $response_code", $error_data);
        }
    }

    /**
     * Enhanced stats reset with backup
     * Versione migliorata del reset stats con backup
     */
    public function enhanced_stats_reset() {
        // Validate request
        if (!$this->validate_ajax_request('veronica_chatbot_reset_stats')) {
            $this->log_ajax_activity('stats_reset', 'security_failed', 'Invalid nonce or permissions');
            $this->send_ajax_error('Security validation failed');
            return;
        }

        // Create backup of current stats
        $current_stats = get_option('veronica_chatbot_stats', array());
        $backup_key = 'veronica_chatbot_stats_backup_' . date('Y_m_d_H_i_s');
        update_option($backup_key, $current_stats);

        $this->log_ajax_activity('stats_reset', 'backup_created', $backup_key);

        // Reset stats
        $default_stats = array(
            'total_conversations' => 0,
            'total_messages' => 0,
            'active_sessions' => 0,
            'last_activity' => null,
            'reset_date' => current_time('timestamp'),
            'reset_by' => get_current_user_id()
        );

        update_option('veronica_chatbot_stats', $default_stats);

        $this->log_ajax_activity('stats_reset', 'completed', 'Stats reset successfully');

        $success_data = array(
            'backup_key' => $backup_key,
            'reset_time' => current_time('mysql'),
            'previous_stats' => $current_stats
        );

        $this->send_ajax_success('Statistics reset successfully', $success_data);
    }

    /**
     * Get AJAX endpoints info
     * Debug method per vedere endpoint disponibili
     */
    public function get_ajax_endpoints_info() {
        return array(
            'endpoints' => array(
                'veronica_chatbot_test' => array(
                    'method' => 'POST',
                    'capability' => 'manage_options',
                    'nonce' => 'veronica_chatbot_test',
                    'description' => 'Test API connection'
                ),
                'veronica_chatbot_reset_stats' => array(
                    'method' => 'POST',
                    'capability' => 'manage_options', 
                    'nonce' => 'veronica_chatbot_reset_stats',
                    'description' => 'Reset usage statistics'
                )
            ),
            'ajax_url' => admin_url('admin-ajax.php'),
            'current_user_can_manage' => current_user_can('manage_options'),
            'debug_mode' => $this->settings_manager->get_option('debug_mode', false)
        );
    }

    /**
     * Handle generic AJAX error
     * Utility method per gestire errori generici
     */
    public function handle_ajax_error($action, $error) {
        $this->log_ajax_activity($action, 'error', $error);
        
        if (wp_doing_ajax()) {
            $this->send_ajax_error('An error occurred: ' . $error);
        }
    }

    /**
     * Register additional AJAX handlers
     * Method per registrare handler AJAX aggiuntivi in future
     */
    public function register_additional_handlers() {
        // Hook per estensioni future
        do_action('veronica_chatbot_register_ajax_handlers', $this);
    }
}