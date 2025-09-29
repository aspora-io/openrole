<?php

/*

Plugin Name:    Resume Builder
Plugin URI:     https://wordpress.org/plugins/resume-builder/
Description:    Create beautiful resumes with ease.
Author:         Justin Scheetz
Author URI:     https://resumebuilder.studio
Version:        3.2
Text Domain:    resume-builder
Domain Path:    languages
License:        GPL2

Resume Builder is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
any later version.

Resume Builder is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Resume Builder. If not, see http://www.gnu.org/licenses/.

*/

// Plugin Version Definition
if (! defined('RBUILDER_VERSION')) {
    define('RBUILDER_VERSION', '3.2' );
}

// Exit if accessed directly.
if (! defined('ABSPATH')) {
    exit;
}

if (! class_exists('Resume_Builder_Plugin')) :

/**
 * Resume_Builder Class.
 *
 * @since 2.0.0
 */
final class Resume_Builder_Plugin
{
    private static $instance;

    /**
     * Main Resume_Builder Instance.
     *
     * Insures that only one instance of Resume_Builder exists in memory at any one
     * time. Also prevents needing to define globals everywhere.
     */
    public static function instance()
    {
        if (! isset(self::$instance) && ! (self::$instance instanceof Resume_Builder_Plugin)) {
            self::$instance = new Resume_Builder_Plugin;
            self::$instance->setup_constants();

            add_action('plugins_loaded', array( self::$instance, 'load_textdomain' ));

            self::$instance->includes();
            self::$instance->post_type = new Resume_Builder_Post_Type();
            self::$instance->core = new Resume_Builder_Core();
            self::$instance->resume_shortcodes = new Resume_Builder_Shortcodes();
            self::$instance->widgets = new Resume_Builder_Widgets();

            if (is_admin()):
                self::$instance->admin_enqueues = new Resume_Builder_Admin_Enqueues();
            self::$instance->admin_menus = new Resume_Builder_Admin_Menus(); else:
                self::$instance->enqueues = new Resume_Builder_Enqueues();
            endif;
        }
        return self::$instance;
    }

    public function __clone()
    {
        // Nope, can't do that.
        return false;
    }

    public function __wakeup()
    {
        // Nope, can't do that either.
        return false;
    }

    /**
     * Setup plugin constants.
     *
     * @access private
     * @since 2.0.0
     * @return void
     */
    private function setup_constants()
    {

        // Plugin Folder Path.
        if (! defined('RBUILDER_DIR')) {
            define('RBUILDER_DIR', plugin_dir_path(__FILE__));
        }

        // Plugin Root File.
        if (! defined('RBUILDER_PLUGIN_FILE')) {
            define('RBUILDER_PLUGIN_FILE', __FILE__);
        }

        // Plugin Folder URL.
        if (! defined('RBUILDER_URL')) {
            define('RBUILDER_URL', trailingslashit(plugin_dir_url(__FILE__)));
        }

        // WordPress Ajax URL.
        if (! defined('RBUILDER_AJAX_URL')) {
            define('RBUILDER_AJAX_URL', admin_url('admin-ajax.php'));
        }

    }

    /**
     * Include required files.
     *
     * @access private
     * @since 2.0.0
     * @return void
     */
    private function includes()
    {
        require_once RBUILDER_DIR . 'includes/class.resume-builder-functions.php';
        require_once RBUILDER_DIR . 'includes/class.resume-builder-post-type.php';
        require_once RBUILDER_DIR . 'includes/class.resume-builder-resumes.php';
        require_once RBUILDER_DIR . 'includes/class.resume-builder-core.php';
        require_once RBUILDER_DIR . 'includes/class.resume-builder-admin-enqueues.php';
        require_once RBUILDER_DIR . 'includes/class.resume-builder-enqueues.php';
        require_once RBUILDER_DIR . 'includes/class.resume-builder-admin-menus.php';
        require_once RBUILDER_DIR . 'includes/class.resume-builder-shortcodes.php';
        require_once RBUILDER_DIR . 'includes/class.resume-builder-widgets.php';
        require_once RBUILDER_DIR . 'includes/api.php';
    }

    /**
     * Loads the plugin language files.
     *
     * @access public
     * @since 2.0.0
     * @return void
     */
    public function load_textdomain()
    {

        /*
         * When translating Resume Builder, be sure to move your language file into the proper location:
         *
         * - wp-content/languages/plugins/rbuilder
         *
         * If you do not move custom language files here, they will be lost when updating Resume Builder. Boxy Studio
         * recommends Loco Translate for easy translations: https://boxystudio.ticksy.com/article/3235/
         */

        // Set filter for plugin's languages directory.
        $resume_builder_lang_dir = RBUILDER_DIR . 'languages/';
        $resume_builder_lang_dir = apply_filters('resume_builder_languages_directory', $resume_builder_lang_dir);

        // Traditional WordPress plugin locale filter.
        $locale = apply_filters('plugin_locale', get_locale(), 'resume-builder');
        $mofile = sprintf('%1$s-%2$s.mo', 'resume-builder', $locale);

        // Look in wp-content/languages/plugins/resume-builder
        $lang_file_ext = WP_LANG_DIR . '/plugins/resume-builder/' . $mofile;

        if (file_exists($lang_file_ext)) {

            // Load the externally located language files.
            load_textdomain('resume-builder', $lang_file_ext);
        } else {

            // Load the default language files.
            load_plugin_textdomain('resume-builder', false, $resume_builder_lang_dir);
        }
    }
}

endif; // End if class_exists check.


/**
 * The main function for that returns Resume_Builder_Plugin
 *
 * The main function responsible for returning the Resume_Builder_Plugin
 * Instance to functions everywhere.
 *
 * Use this function like you would a global variable, except without needing
 * to declare the global.
 *
 * Example: <?php $resume_builder = Resume_Builder(); ?>
*
* @since 3.0.0
* @return object|Resume_Builder_Plugin
*/
function Resume_Builder()
{
    return Resume_Builder_Plugin::instance();
}

// Let's go!
$resume_builder = Resume_Builder();
