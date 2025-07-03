<?php
/**
 * Plugin Name: Veronica Schembri AI Chatbot
 * Plugin URI: https://www.veronicaschembri.com
 * Description: AI-powered chatbot that represents Veronica Schembri using her website content
 * Version: 1.0.0
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
    private $version = '1.0.0';
    
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
        
        // Localize script with settings
        wp_localize_script('veronica-chatbot', 'veronicaChatbotConfig', array(
            'apiEndpoint' => $settings['api_endpoint'] ?? get_rest_url(null, 'veronica-chatbot/v1/chat'),
            'theme' => $settings['theme'] ?? 'light',
            'position' => $settings['position'] ?? 'bottom-right',
            'initialMessage' => $settings['initial_message'] ?? 'Ciao! Sono Veronica Schembri, AI Engineer e Data Scientist. Come posso aiutarti oggi?',
            'enabled' => $settings['enabled'] ?? false,
            'nonce' => wp_create_nonce('wp_rest')
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
            $settings = array(
                'enabled' => isset($_POST['enabled']),
                'api_endpoint' => sanitize_url($_POST['api_endpoint']),
                'theme' => sanitize_text_field($_POST['theme']),
                'position' => sanitize_text_field($_POST['position']),
                'initial_message' => sanitize_textarea_field($_POST['initial_message']),
                'show_on_pages' => sanitize_text_field($_POST['show_on_pages'])
            );
            
            update_option('veronica_chatbot_settings', $settings);
            echo '<div class="notice notice-success"><p>' . __('Settings saved!', 'veronica-chatbot') . '</p></div>';
        }
        
        $settings = get_option('veronica_chatbot_settings', array());
        ?>
        <div class="wrap">
            <h1><?php _e('Veronica Chatbot Settings', 'veronica-chatbot'); ?></h1>
            
            <form method="post" action="">
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
                        <th scope="row"><?php _e('API Endpoint', 'veronica-chatbot'); ?></th>
                        <td>
                            <input type="url" name="api_endpoint" class="regular-text" 
                                   value="<?php echo esc_attr($settings['api_endpoint'] ?? ''); ?>"
                                   placeholder="https://your-backend.com/api/chat">
                            <p class="description"><?php _e('URL of your chatbot backend API', 'veronica-chatbot'); ?></p>
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
                            <textarea name="initial_message" class="large-text" rows="3"><?php 
                                echo esc_textarea($settings['initial_message'] ?? 'Ciao! Sono Veronica Schembri, AI Engineer e Data Scientist. Come posso aiutarti oggi?'); 
                            ?></textarea>
                            <p class="description"><?php _e('First message shown to users', 'veronica-chatbot'); ?></p>
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
                    'sanitize_callback' => 'sanitize_text_field'
                ),
                'history' => array(
                    'required' => false,
                    'type' => 'array',
                    'default' => array()
                )
            )
        ));
    }
    
    public function handle_chat_request($request) {
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
        
        // Forward request to external API
        $response = wp_remote_post($api_endpoint, array(
            'headers' => array(
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode(array(
                'message' => $message,
                'history' => $history
            )),
            'timeout' => 30
        ));
        
        if (is_wp_error($response)) {
            return new WP_Error(
                'api_request_failed',
                __('Failed to connect to chatbot API', 'veronica-chatbot'),
                array('status' => 500)
            );
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return new WP_Error(
                'invalid_response',
                __('Invalid response from chatbot API', 'veronica-chatbot'),
                array('status' => 500)
            );
        }
        
        return rest_ensure_response($data);
    }
}

// Initialize the plugin
new VeronicaChatbotPlugin();

// Create the JavaScript file for the frontend
function veronica_chatbot_create_js_file() {
    $js_content = "
// Veronica Chatbot Frontend Component
(function() {
    'use strict';
    
    const { createElement: h, useState, useEffect, useRef } = React;
    const { render } = ReactDOM;
    
    function VeronicaChatbot(props) {
        const config = props.config || window.veronicaChatbotConfig || {};
        const [isOpen, setIsOpen] = useState(config.position === 'embedded');
        const [isMinimized, setIsMinimized] = useState(false);
        const [messages, setMessages] = useState([
            {
                id: '1',
                role: 'assistant',
                content: config.initialMessage || 'Ciao! Come posso aiutarti?',
                timestamp: new Date()
            }
        ]);
        const [inputValue, setInputValue] = useState('');
        const [isLoading, setIsLoading] = useState(false);
        const messagesEndRef = useRef(null);
        const inputRef = useRef(null);
        
        const scrollToBottom = () => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        };
        
        useEffect(() => {
            scrollToBottom();
        }, [messages]);
        
        const sendMessage = async (message) => {
            if (!message.trim() || isLoading) return;
            
            const userMessage = {
                id: Date.now().toString(),
                role: 'user',
                content: message,
                timestamp: new Date()
            };
            
            setMessages(prev => [...prev, userMessage]);
            setInputValue('');
            setIsLoading(true);
            
            try {
                const response = await fetch(config.apiEndpoint || '/wp-json/veronica-chatbot/v1/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': config.nonce
                    },
                    body: JSON.stringify({
                        message,
                        history: messages.map(msg => ({
                            role: msg.role,
                            content: msg.content
                        }))
                    })
                });
                
                const data = await response.json();
                
                const assistantMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.response || 'Mi dispiace, non sono riuscita a processare la tua richiesta.',
                    timestamp: new Date()
                };
                
                setMessages(prev => [...prev, assistantMessage]);
            } catch (error) {
                console.error('Error:', error);
                const errorMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: 'Mi dispiace, c\\'è stato un errore. Riprova più tardi.',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMessage]);
            } finally {
                setIsLoading(false);
            }
        };
        
        const handleSubmit = (e) => {
            e.preventDefault();
            sendMessage(inputValue);
        };
        
        if (config.position === 'embedded') {
            return h('div', {
                className: 'veronica-chatbot-embedded w-full h-full flex flex-col border rounded-lg shadow-lg ' + 
                          (config.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900')
            }, [
                // Header
                h('div', {
                    key: 'header',
                    className: 'p-4 border-b ' + (config.theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50')
                }, [
                    h('div', { className: 'flex items-center space-x-3' }, [
                        h('div', {
                            className: 'w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center'
                        }, h('span', { className: 'text-white font-bold text-sm' }, 'VS')),
                        h('div', {}, [
                            h('h3', { className: 'font-semibold' }, 'Veronica Schembri'),
                            h('p', { className: 'text-sm opacity-75' }, 'AI Engineer & Data Scientist')
                        ])
                    ])
                ]),
                
                // Messages
                h('div', {
                    key: 'messages',
                    className: 'flex-1 overflow-y-auto p-4 space-y-4'
                }, [
                    ...messages.map(message => 
                        h('div', {
                            key: message.id,
                            className: 'flex ' + (message.role === 'user' ? 'justify-end' : 'justify-start')
                        }, [
                            h('div', {
                                className: 'max-w-[80%] rounded-lg px-4 py-2 ' +
                                          (message.role === 'user' 
                                            ? 'bg-blue-600 text-white'
                                            : config.theme === 'dark' 
                                              ? 'bg-gray-700 text-white' 
                                              : 'bg-gray-100 text-gray-900')
                            }, [
                                h('div', { 
                                    dangerouslySetInnerHTML: { 
                                        __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                    }
                                }),
                                h('div', {
                                    className: 'text-xs mt-1 opacity-50'
                                }, message.timestamp.toLocaleTimeString())
                            ])
                        ])
                    ),
                    isLoading && h('div', {
                        className: 'flex justify-start'
                    }, [
                        h('div', {
                            className: 'rounded-lg px-4 py-2 ' + (config.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100')
                        }, '⏳ Pensando...')
                    ]),
                    h('div', { ref: messagesEndRef })
                ]),
                
                // Input
                h('div', {
                    key: 'input',
                    className: 'p-4 border-t ' + (config.theme === 'dark' ? 'border-gray-700' : 'border-gray-200')
                }, [
                    h('form', { onSubmit: handleSubmit, className: 'flex space-x-2' }, [
                        h('input', {
                            ref: inputRef,
                            type: 'text',
                            value: inputValue,
                            onChange: (e) => setInputValue(e.target.value),
                            placeholder: 'Scrivi la tua domanda...',
                            disabled: isLoading,
                            className: 'flex-1 rounded-lg px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 ' +
                                     (config.theme === 'dark' 
                                       ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                       : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500')
                        }),
                        h('button', {
                            type: 'submit',
                            disabled: !inputValue.trim() || isLoading,
                            className: 'bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50'
                        }, '💬')
                    ])
                ])
            ]);
        }
        
        // Floating widget
        return h('div', {}, [
            !isOpen && h('button', {
                key: 'trigger',
                onClick: () => setIsOpen(true),
                className: 'fixed ' + (config.position === 'bottom-left' ? 'bottom-6 left-6' : 'bottom-6 right-6') +
                          ' w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50'
            }, '💬'),
            
            isOpen && h('div', {
                key: 'chat',
                className: 'fixed ' + (config.position === 'bottom-left' ? 'bottom-6 left-6' : 'bottom-6 right-6') +
                          ' w-96 ' + (isMinimized ? 'h-16' : 'h-[600px]') +
                          ' bg-white rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300'
            }, [
                // Header with controls
                h('div', {
                    className: 'p-4 bg-gray-50 border-b flex items-center justify-between'
                }, [
                    h('div', { className: 'flex items-center space-x-3' }, [
                        h('div', {
                            className: 'w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center'
                        }, h('span', { className: 'text-white font-bold text-xs' }, 'VS')),
                        h('div', {}, [
                            h('h3', { className: 'font-semibold text-sm' }, 'Veronica Schembri'),
                            h('p', { className: 'text-xs opacity-75' }, 'AI Engineer')
                        ])
                    ]),
                    h('div', { className: 'flex space-x-2' }, [
                        h('button', {
                            onClick: () => setIsMinimized(!isMinimized),
                            className: 'p-1 rounded hover:bg-gray-200'
                        }, isMinimized ? '🔼' : '🔽'),
                        h('button', {
                            onClick: () => setIsOpen(false),
                            className: 'p-1 rounded hover:bg-gray-200'
                        }, '✖')
                    ])
                ]),
                
                // Chat content (same as embedded)
                !isMinimized && h('div', { className: 'flex-1 flex flex-col overflow-hidden' }, [
                    // Same message content as embedded version...
                    h('div', { className: 'flex-1 overflow-y-auto p-4 space-y-4' }, [
                        ...messages.map(message => 
                            h('div', {
                                key: message.id,
                                className: 'flex ' + (message.role === 'user' ? 'justify-end' : 'justify-start')
                            }, [
                                h('div', {
                                    className: 'max-w-[80%] rounded-lg px-3 py-2 text-sm ' +
                                              (message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900')
                                }, message.content)
                            ])
                        ),
                        h('div', { ref: messagesEndRef })
                    ]),
                    
                    h('div', { className: 'p-3 border-t' }, [
                        h('form', { onSubmit: handleSubmit, className: 'flex space-x-2' }, [
                            h('input', {
                                type: 'text',
                                value: inputValue,
                                onChange: (e) => setInputValue(e.target.value),
                                placeholder: 'Scrivi qui...',
                                className: 'flex-1 rounded-lg px-3 py-2 text-sm border focus:outline-none'
                            }),
                            h('button', {
                                type: 'submit',
                                disabled: !inputValue.trim(),
                                className: 'bg-blue-600 text-white rounded-lg px-3 py-2'
                            }, '💬')
                        ])
                    ])
                ])
            ])
        ]);
    }
    
    // Initialize chatbot when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        const container = document.getElementById('veronica-chatbot-container');
        if (container && window.veronicaChatbotConfig && window.veronicaChatbotConfig.enabled) {
            render(h(VeronicaChatbot, { config: window.veronicaChatbotConfig }), container);
        }
    });
    
    // Expose for shortcode usage
    window.VeronicaChatbot = {
        render: function(container, config) {
            render(h(VeronicaChatbot, { config: config }), container);
        }
    };
})();
";
    
    $upload_dir = wp_upload_dir();
    $plugin_assets_dir = $upload_dir['basedir'] . '/veronica-chatbot-assets/';
    
    if (!file_exists($plugin_assets_dir)) {
        wp_mkdir_p($plugin_assets_dir);
    }
    
    file_put_contents($plugin_assets_dir . 'chatbot.js', $js_content);
}

// Create assets on plugin activation
register_activation_hook(__FILE__, 'veronica_chatbot_create_js_file');

?>