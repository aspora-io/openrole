<?php

/**
 * Simple_Job_Board_Addons_Main Class
 * 
 * This is the main file to handle add-on update and activations
 *
 * @link       https://wordpress.org/plugins/simple-job-board
 * @since      2.10.0
 * 
 * @package    Simple_Job_Board
 * @subpackage Simple_Job_Board/admin
 * @author     PressTigers <support@presstigers.com>
 */
class Simple_Job_Board_Extensions_Package {

    private $base_url = 'https://market.presstigers.com/';

    public function __construct() {
        /**
         * Load all dependencies
         */
        $this->load_dependencies();

        /**
         * Hook the scripts 
         */
        $this->init();

        /**
         * 
         */
        add_action("wp_ajax_validate_request_update", array($this, "validate_request_update"));
    }

    /**
     * Initialize the scripts hook for specifically plugins.php page 
     * in admin panel
     * 
     * @since 2.10.0
     */
    public function init() {
        global $pagenow;
        if ($pagenow == 'plugins.php') {
            add_action('admin_enqueue_scripts', array($this, 'enqueue_scripts'));

            add_filter('plugin_row_meta', array($this, 'license_row_meta'), 20, 2);
        }
    }

    /**
     * Private method to load all relevant files
     * 
     * @since 2.10.0
     */
    private function load_dependencies() {

        require_once plugin_dir_path(__FILE__) . 'extensions/class-simple-job-board-admin-extensions.php';
        require_once plugin_dir_path(__FILE__) . 'extensions/class-simple-job-board-extensions-options.php';
    }

    public function get_value($option) {
        $options = get_option($option);
        if (empty($options) || !is_array($options)) {
            return false;
        }

        if (
                !array_key_exists('status', $options) || !array_key_exists('license_key', $options) || $options['status'] === 0
        )
            return false;

        return $options;
    }

    public function license_row_meta($links, $file) {
        $extensions = Simple_Job_Board_Addons_Extensions::instance()->extensions();

        $active_plugins = (array) get_option("active_plugins");

        if (!is_array($extensions)) {
            return $links;
        }

        foreach ($extensions as $slug => $value) {

            if (!in_array($value->basename, $active_plugins))
                continue;

            if ($value->basename != $file)
                continue;

            if (false === $this->get_value($value->option)) {
                $links['licensing'] = $this->license_form($value->slug);
                continue;
            }

            $options = get_option($value->option);

            if (!isset($options['license_key']) || empty($options['license_key'])) {
                $links['licensing'] = $this->license_form($value->slug);
                continue;
            }

            if (isset($options['status']) && $options['status'] != 1) {
                $links['licensing'] = $this->license_form($value->slug);
                continue;
            }

            $this->keys[] = $options['license_key'];
        }


        return $links;
    }

    /**
     * Enqueue relevant style and script files 
     * 
     * @since 2.10.0
     */
    public function enqueue_scripts() {
        wp_enqueue_style('sjb-licensing', plugin_dir_url(dirname(__FILE__)) . 'admin/css/licensing.css', array(), rand(), 'all');
        wp_enqueue_script('sjb-licensing-admin', plugin_dir_url(dirname(__FILE__)) . 'admin/js/licensing.js', array('jquery'), null, true);
        wp_localize_script("sjb-licensing-admin", "sjbl", array(
            "site_url" => site_url(),
            "ajax_url" => admin_url('admin-ajax.php'),
            "license_activation" => $this->base_url . 'wp-json/sjb/v1/activate_license',
        ));
    }

    /**
     * Private method
     * License form 
     * 
     * @since 2.10.0
     */
    private function license_form($slug) {
      
        $nonce = wp_create_nonce('license_activation_nonce');

        return '<div class="sjb-addon-license-meta">'
                . '<div class="activation-input-controls">'
                . '<input type="text" placeholder="License Key" class="sjb-license-key">'
                . ' <input type="email" class="sjb-email-addr" placeholder="Activation Email">'
                . ' <a href="#" class="button button-primary activate_license" data-addon="' . esc_attr( $slug ) . '">Activate License</a>'
                . '<input type="hidden" class="license-activation-nonce" name="license_activation_nonce" value="' . esc_attr($nonce) . '">'
                . '</div>'
                . '<p class="' .esc_attr( $slug ). '-error sjb-error d-none"></p><p class="' . esc_attr( $slug ) . '-success sjb-success d-none"></p>'
                . '</div>';
    }

    /**
     * 
     */
    public function validate_request_update() {

        if (isset($_POST['license_activation_nonce']) && wp_verify_nonce($_POST['license_activation_nonce'], 'license_activation_nonce')) {

            $data = array_map( 'sanitize_text_field', $_POST['data'] );
            $addon = sanitize_text_field( $_POST['addon'] );

            if (!is_array($data) || !is_string($addon) || empty($addon)) {
                return wp_send_json(array("An error occurred. Please try again later."), 401);
            }

            if (array_key_exists("user_id", $data))
                unset($data['user_id']);

            if (!array_key_exists('license_key', $data) ||
                    !array_key_exists('registered_email', $data) ||
                    !array_key_exists('domain', $data) ||
                    !array_key_exists('status', $data) ||
                    !array_key_exists('remaining_days', $data)) {
                return wp_send_json(array("An error occurred. Please try again later."), 401);
            }

            $option_name = str_replace("-", "_", $addon);
            $option_name = $option_name . "_options";

            $options = get_option($option_name);

            if (is_array($options)) {
                $data = array_merge($options, $data);
            }

            if (update_option($option_name, $data)) {
                
                $list_addons = get_option("sjba_addons");
                
                if (false == $list_addons) {
                    $list_addons = array();
                }
                
                $list_addons[] = $addon;
                update_option("sjba_addons", $list_addons);
                wp_send_json(array("activated" => true, "message" => __("Your license is activated successfully.", "simple-job-board")), 200);
            } else {
                wp_send_json(array("activated" => false, "message" => __("Your license activation failed.", "simple-job-board")), 401);
            }
        } else {
            
            // Nonce verification failed; handle the error or redirect as needed
            wp_die(__('Request verification failed', 'simple-job-board'));
        }
    }

}

new Simple_Job_Board_Extensions_Package ();