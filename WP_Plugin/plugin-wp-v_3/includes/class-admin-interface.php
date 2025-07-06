<?php
/**
 * Admin Interface Class
 * Estratto da veronica-chatbot.php (righe 201-800 circa)
 * Gestisce tutta l'interfaccia amministrativa del plugin
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit('Direct access forbidden.');
}

/**
 * Admin Interface Manager Class
 */
class Veronica_Chatbot_Admin_Interface {

    /**
     * Settings manager instance
     */
    private $settings_manager;

    /**
     * Constructor
     */
    public function __construct($settings_manager) {
        $this->settings_manager = $settings_manager;
        
        // Setup admin hooks
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'admin_init'));
    }

    /**
     * Add admin menu
     * Estratto dal metodo add_admin_menu() originale
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
     * Estratto dal metodo admin_init() originale
     */
    public function admin_init() {
        register_setting('veronica_chatbot_options', 'veronica_chatbot_options', array($this->settings_manager, 'validate_options'));

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
     * Admin page HTML
     * Estratto dal metodo admin_page() originale
     */
    public function admin_page() {
        $options = $this->settings_manager->get_options();
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
                        <?php $this->render_info_sidebar($options); ?>
                    </div>
                </div>
            </div>

            <?php $this->render_admin_scripts(); ?>
        </div>
        <?php
    }

    /**
     * Render info sidebar
     * Estratto dalla sezione sidebar dell'admin_page() originale
     */
    private function render_info_sidebar($options) {
        ?>
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
        <?php
    }

    /**
     * Display usage statistics
     * Estratto dal metodo display_usage_stats() originale
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

    /**
     * Render admin scripts
     * Estratto dalla sezione script dell'admin_page() originale
     */
    private function render_admin_scripts() {
        ?>
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
        $options = $this->settings_manager->get_options();
        echo '<input type="url" id="api_url" name="veronica_chatbot_options[api_url]" value="' . esc_attr($options['api_url']) . '" class="regular-text" required />';
        echo '<p class="description">' . esc_html__('URL del tuo backend API (es: https://your-api.com/chat)', 'veronica-chatbot') . '</p>';
    }

    public function field_enabled_callback() {
        $options = $this->settings_manager->get_options();
        echo '<input type="checkbox" id="enabled" name="veronica_chatbot_options[enabled]" value="1"' . checked(1, $options['enabled'], false) . ' />';
        echo '<label for="enabled">' . esc_html__('Abilita il chatbot sul sito', 'veronica-chatbot') . '</label>';
    }

    public function field_theme_callback() {
        $options = $this->settings_manager->get_options();
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
        $options = $this->settings_manager->get_options();
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
        $options = $this->settings_manager->get_options();
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
        $options = $this->settings_manager->get_options();
        echo '<input type="number" id="session_duration" name="veronica_chatbot_options[session_duration]" value="' . esc_attr($options['session_duration']) . '" min="1" max="30" />';
        echo '<p class="description">' . esc_html__('Durata massima di una sessione in giorni (1-30)', 'veronica-chatbot') . '</p>';
    }

    public function field_conversation_timeout_callback() {
        $options = $this->settings_manager->get_options();
        echo '<input type="number" id="conversation_timeout" name="veronica_chatbot_options[conversation_timeout]" value="' . esc_attr($options['conversation_timeout']) . '" min="1" max="168" />';
        echo '<p class="description">' . esc_html__('Ore di inattività prima del reset conversazione (1-168)', 'veronica-chatbot') . '</p>';
    }

    public function field_max_messages_callback() {
        $options = $this->settings_manager->get_options();
        echo '<input type="number" id="max_messages" name="veronica_chatbot_options[max_messages]" value="' . esc_attr($options['max_messages']) . '" min="10" max="500" />';
        echo '<p class="description">' . esc_html__('Numero massimo di messaggi salvati in memoria (10-500)', 'veronica-chatbot') . '</p>';
    }

    public function field_enable_persistence_callback() {
        $options = $this->settings_manager->get_options();
        echo '<input type="checkbox" id="enable_persistence" name="veronica_chatbot_options[enable_persistence]" value="1"' . checked(1, $options['enable_persistence'], false) . ' />';
        echo '<label for="enable_persistence">' . esc_html__('Abilita persistenza sessioni e messaggi', 'veronica-chatbot') . '</label>';
        echo '<p class="description">' . esc_html__('Salva le conversazioni nel browser dell\'utente', 'veronica-chatbot') . '</p>';
    }

    public function field_enable_cross_page_sync_callback() {
        $options = $this->settings_manager->get_options();
        echo '<input type="checkbox" id="enable_cross_page_sync" name="veronica_chatbot_options[enable_cross_page_sync]" value="1"' . checked(1, $options['enable_cross_page_sync'], false) . ' />';
        echo '<label for="enable_cross_page_sync">' . esc_html__('Abilita sincronizzazione tra pagine', 'veronica-chatbot') . '</label>';
        echo '<p class="description">' . esc_html__('Mantiene la conversazione aperta quando l\'utente naviga', 'veronica-chatbot') . '</p>';
    }

    public function field_debug_mode_callback() {
        $options = $this->settings_manager->get_options();
        echo '<input type="checkbox" id="debug_mode" name="veronica_chatbot_options[debug_mode]" value="1"' . checked(1, $options['debug_mode'], false) . ' />';
        echo '<label for="debug_mode">' . esc_html__('Abilita modalità debug', 'veronica-chatbot') . '</label>';
        echo '<p class="description">' . esc_html__('Aggiunge funzioni di debugging alla console browser', 'veronica-chatbot') . '</p>';
    }
}