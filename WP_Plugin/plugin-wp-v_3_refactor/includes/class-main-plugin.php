<?php
/**
 * Main Plugin Class - Orchestrator
 * Estratto da veronica-chatbot.php (righe 51-200 circa)
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit('Direct access forbidden.');
}

/**
 * Main Plugin Orchestrator Class
 */
class Veronica_Chatbot_Main_Plugin {

    /**
     * Admin interface instance
     */
    private $admin;

    /**
     * Frontend manager instance
     */
    private $frontend;

    /**
     * AJAX handlers instance
     */
    private $ajax_handlers;

    /**
     * Settings manager instance
     */
    private $settings_manager;

    /**
     * Utility functions instance
     */
    private $utilities;

    /**
     * Constructor - Inizializza tutti i moduli
     */
    public function __construct() {
        // Initialize core actions
        add_action('init', array($this, 'init'));
        
        // Initialize modules
        $this->init_modules();
        
        // Setup hooks
        $this->setup_hooks();
        
        // Log initialization
        error_log('Veronica Chatbot Plugin v3.0 initialized - Modular Edition');
    }

    /**
     * Initialize plugin modules
     */
    private function init_modules() {
        // Initialize settings manager first
        $this->settings_manager = new Veronica_Chatbot_Settings_Manager();
        
        // Initialize admin interface
        $this->admin = new Veronica_Chatbot_Admin_Interface($this->settings_manager);
        
        // Initialize frontend manager
        $this->frontend = new Veronica_Chatbot_Frontend_Manager($this->settings_manager);
        
        // Initialize AJAX handlers
        $this->ajax_handlers = new Veronica_Chatbot_Ajax_Handlers($this->settings_manager);
        
        // Initialize utilities
        $this->utilities = new Veronica_Chatbot_Utility_Functions($this->settings_manager);
    }

    /**
     * Setup WordPress hooks
     */
    private function setup_hooks() {
        // Activation/Deactivation hooks
        add_action('veronica_chatbot_activate', array($this, 'activate'));
        add_action('veronica_chatbot_deactivate', array($this, 'deactivate'));
    }

    /**
     * Initialize plugin
     */
    public function init() {
        // Load text domain for translations
        load_plugin_textdomain('veronica-chatbot', false, dirname(VERONICA_CHATBOT_BASENAME) . '/languages');
        
        // Trigger initialization in all modules
        do_action('veronica_chatbot_modules_init');
    }

    /**
     * Plugin activation
     */
    public function activate() {
        // Initialize default options via settings manager
        $this->settings_manager->init_default_options();
        
        // Initialize stats via utilities
        $this->utilities->init_default_stats();

        // Log activation
        error_log('Veronica Chatbot Plugin activated - Version ' . VERONICA_CHATBOT_VERSION);
        
        // Trigger activation hook
        do_action('veronica_chatbot_activated');
    }

    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clean up scheduled events if any
        wp_clear_scheduled_hook('veronica_chatbot_cleanup');
        
        // Log deactivation
        error_log('Veronica Chatbot Plugin deactivated');
        
        // Trigger deactivation hook
        do_action('veronica_chatbot_deactivated');
    }

    /**
     * Get admin interface instance
     */
    public function get_admin() {
        return $this->admin;
    }

    /**
     * Get frontend manager instance
     */
    public function get_frontend() {
        return $this->frontend;
    }

    /**
     * Get settings manager instance
     */
    public function get_settings_manager() {
        return $this->settings_manager;
    }

    /**
     * Get utilities instance
     */
    public function get_utilities() {
        return $this->utilities;
    }
}