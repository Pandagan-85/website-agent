<?php
/**
 * Settings Manager Class
 * Estratto da veronica-chatbot.php (righe 1501-1800 circa)
 * Gestisce tutte le impostazioni del plugin
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit('Direct access forbidden.');
}

/**
 * Settings Manager Class
 */
class Veronica_Chatbot_Settings_Manager {

    /**
     * Constructor
     */
    public function __construct() {
        // Initialize default options on construct
        $this->init_default_options();
    }

    /**
     * Initialize default options
     * Estratto dal metodo init_default_options() originale
     */
    public function init_default_options() {
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
     * Validate options
     * Estratto dal metodo validate_options() originale
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
     * Get chatbot options with defaults
     * Estratto dalla funzione veronica_chatbot_get_options() originale
     */
    public function get_options() {
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
     * Check if chatbot is enabled
     * Estratto dalla funzione veronica_chatbot_is_enabled() originale
     */
    public function is_enabled() {
        $options = $this->get_options();
        return $options['enabled'];
    }

    /**
     * Update specific option
     */
    public function update_option($key, $value) {
        $options = $this->get_options();
        $options[$key] = $value;
        return update_option('veronica_chatbot_options', $options);
    }

    /**
     * Get specific option
     */
    public function get_option($key, $default = null) {
        $options = $this->get_options();
        return isset($options[$key]) ? $options[$key] : $default;
    }

    /**
     * Reset all options to defaults
     */
    public function reset_options() {
        delete_option('veronica_chatbot_options');
        $this->init_default_options();
    }
}