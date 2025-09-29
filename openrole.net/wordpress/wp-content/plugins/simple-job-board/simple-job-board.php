<?php
/**
 * The plugin bootstrap file
 *
 * This file is read by WordPress to generate the plugin information in the plugin
 * admin area. This file also includes all of the dependencies used by the plugin,
 * registers the activation and deactivation functions, and defines a function
 * that starts the plugin.
 *
 * @link              https://wordpress.org/plugins/simple-job-board
 * @since             1.0.0
 * @package           Simple_Job_Board
 *
 * @wordpress-plugin
 * Plugin Name:       Simple Job Board
 * Plugin URI:        https://market.presstigers.com
 * Description:       Powerful & Robust plugin to create a Job Board on your website in simple & elegant way.
 * Version:           2.13.8
 * Author:            PressTigers
 * Author URI:        https://market.presstigers.com
 * License:           GPL-3.0+
 * License URI:       http://www.gnu.org/licenses/gpl-3.0.txt
 * Text Domain:       simple-job-board
 * Domain Path:       /languages
 */
// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

// Define Plugin Contant
if (!defined('SJB_PLUGIN_VERSION')) {
    define('SJB_PLUGIN_VERSION', '2.13.8');
}

// Place in your main plugin file or admin-functions.php
add_action('admin_notices', 'show_template_update_notice');
function show_template_update_notice() {
    if (!current_user_can('manage_options')) return;
    
    $message = sprintf(
        '<strong>%s</strong> %s',
        __('Simple Job Board:', 'simple-job-board'),
        __('we\'ve updated the templates for job application form. If you\'ve overridden templates in your theme, please update your templates to reflect the latest changes.', 'simple-job-board')
    );
    
    echo '<div class="notice notice-warning is-dismissible">';
    echo '<p>' . wp_kses_post($message) . '</p>';
    echo '</div>';
}

add_action('upgrader_process_complete', 'sjb_clean_options_on_update', 10, 2);
function sjb_clean_options_on_update($upgrader_object, $options) {
    // Only run on plugin updates
    if ($options['action'] !== 'update' || $options['type'] !== 'plugin') {
        return;
    }

    // Check if Simple Job Board is being updated
    foreach ($options['plugins'] as $plugin) {
        if (strpos($plugin, 'simple-job-board') !== false) {
            // Get current SJB version
            $sjb_version = defined('SJB_PLUGIN_VERSION') ? SJB_PLUGIN_VERSION : 0;
            if($sjb_version != 0){
                // Only proceed if version is 2.13.6 or lower
                if (version_compare($sjb_version, '2.13.6', '<=')) {
                    // Delete the specific option
                    delete_option('sjb_csrf_token_disable');
                }
            }
            break;
        }
    }
}


// Define Plugin Upload DIR
if (!defined('SJB_UPLOAD_DIR')) {
    
    define('SJB_UPLOAD_DIR',  trailingslashit( wp_upload_dir()['basedir'] ) . 'jobpost/');
}

update_option('sjb_version', SJB_PLUGIN_VERSION);

/**
 *  Show SJB Upgrade Notice
 */
function sjb_showUpgradeNotification($currentPluginMetadata, $newPluginMetadata)
{

    // check "upgrade_notice"
    if (isset($newPluginMetadata->upgrade_notice) && strlen(trim($newPluginMetadata->upgrade_notice)) > 0) {
        echo '<br><br><strong>Important Upgrade Notice:</strong> ' . esc_attr( $newPluginMetadata->upgrade_notice ) . '';
    }
}

// Show SJB Upgrade Notice
add_action('in_plugin_update_message-simple-job-board/simple-job-board.php', 'sjb_showUpgradeNotification', 10, 2);

/**
 * The code that runs during plugin activation.
 * This action is documented in includes/class-simple-job-board-activator.php
 */
function activate_simple_job_board()
{
    require_once plugin_dir_path(__FILE__) . 'includes/class-simple-job-board-activator.php';
    Simple_Job_Board_Activator::activate();
}

function sjb_wp_upe_upgrade_completed( $upgrader_object, $options ) {

 // The path to our plugin's main file
 $our_plugin = 'simple-job-board/simple-job-board.php';


 // If an update has tken place and the updated type is plugins and the plugins element exists
 if( $options['action'] == 'update' && $options['type'] == 'plugin' && isset( $options['plugins'] ) ) {
  // Iterate through the plugins being updated and check if ours is there
  foreach( $options['plugins'] as $plugin ) {
   if( $plugin == $our_plugin ) {

    update_option( 'sjb_update_ui_notice', 'Versi0n 2.4 is Updated' );

        $sjbrObj = new Simple_Job_Board_Rewrite();
        $sjbrObj->job_board_rewrite(); 
   }
  }
 }
}
add_action( 'upgrader_process_complete', 'sjb_wp_upe_upgrade_completed', 10, 2 );


/**
 * The code that runs during plugin deactivation.
 * This action is documented in includes/class-simple-job-board-deactivator.php
 */
function deactivate_simple_job_board()
{
    require_once plugin_dir_path(__FILE__) . 'includes/class-simple-job-board-deactivator.php';
    Simple_Job_Board_Deactivator::deactivate();
}

register_activation_hook(__FILE__, 'activate_simple_job_board');
register_deactivation_hook(__FILE__, 'deactivate_simple_job_board');

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require plugin_dir_path(__FILE__) . 'includes/class-simple-job-board.php';

/**
 * Helper functions
 */
require plugin_dir_path(__FILE__) . 'includes/helper-functions.php';

/*
 * Initialize Job Board Shortcode Block
 */
require_once plugin_dir_path(__FILE__) . 'sjb-block/src/init.php';

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 */
function run_simple_job_board()
{
    $plugin = new Simple_Job_Board();
    $plugin->run();
}

run_simple_job_board();
