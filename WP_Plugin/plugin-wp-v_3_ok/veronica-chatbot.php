<?php
/**
 * Plugin Name: Veronica Schembri Chatbot v3.0 - Modular Edition
 * Plugin URI: https://www.veronicaschembri.com
 * Description: AI Chatbot intelligente con LangGraph e persistenza sessioni - Architettura modulare
 * Version: 3.0.0
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
define('VERONICA_CHATBOT_VERSION', '3.0.0');
define('VERONICA_CHATBOT_PATH', plugin_dir_path(__FILE__));
define('VERONICA_CHATBOT_URL', plugin_dir_url(__FILE__));
define('VERONICA_CHATBOT_BASENAME', plugin_basename(__FILE__));

/**
 * Load required classes
 */
require_once VERONICA_CHATBOT_PATH . 'includes/class-main-plugin.php';
require_once VERONICA_CHATBOT_PATH . 'includes/class-admin-interface.php';
require_once VERONICA_CHATBOT_PATH . 'includes/class-frontend-manager.php';
require_once VERONICA_CHATBOT_PATH . 'includes/class-ajax-handlers.php';
require_once VERONICA_CHATBOT_PATH . 'includes/class-settings-manager.php';
require_once VERONICA_CHATBOT_PATH . 'includes/class-utility-functions.php';

/**
 * Initialize the plugin
 */
function veronica_chatbot_init() {
    new Veronica_Chatbot_Main_Plugin();
}

// Hook into WordPress
add_action('plugins_loaded', 'veronica_chatbot_init');

/**
 * Activation hook
 */
register_activation_hook(__FILE__, function() {
    do_action('veronica_chatbot_activate');
});

/**
 * Deactivation hook  
 */
register_deactivation_hook(__FILE__, function() {
    do_action('veronica_chatbot_deactivate');
});

/**
 * Add settings link in plugins page
 */
function veronica_chatbot_settings_link($links) {
    $settings_link = '<a href="options-general.php?page=veronica-chatbot">' . __('Impostazioni', 'veronica-chatbot') . '</a>';
    array_unshift($links, $settings_link);
    return $links;
}
add_filter('plugin_action_links_' . VERONICA_CHATBOT_BASENAME, 'veronica_chatbot_settings_link');

/**
 * Add plugin meta links
 */
function veronica_chatbot_meta_links($links, $file) {
    if ($file === VERONICA_CHATBOT_BASENAME) {
        $links[] = '<a href="https://www.veronicaschembri.com" target="_blank">' . __('Supporto', 'veronica-chatbot') . '</a>';
        $links[] = '<a href="https://github.com/veronica-schembri/chatbot" target="_blank">' . __('GitHub', 'veronica-chatbot') . '</a>';
    }
    return $links;
}
add_filter('plugin_row_meta', 'veronica_chatbot_meta_links', 10, 2);