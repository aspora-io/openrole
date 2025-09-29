<?php
/**
 * Admin Menus
 *
 * @package     Resume Builder
 * @subpackage  Admin Menus
 * @since       2.0.0
*/

// Exit if accessed directly
if (! defined('ABSPATH')) {
    exit;
}

class Resume_Builder_Admin_Menus
{
    public function __construct()
    {
        add_action('admin_menu', array(&$this, 'add_menu'));
    }

    public function add_menu()
    {
        add_menu_page(esc_html__('Resumes', 'resume-builder'), esc_html__('Resumes', 'resume-builder'), 'administrator', 'rbuilder_main', '', 'dashicons-text-page', 58);
        add_submenu_page('rbuilder_main', esc_html__('Resumes', 'resume-builder'), esc_html__('Resumes', 'resume-builder'), 'administrator', 'rbuilder_main', array(&$this, 'rbuilder_resumes_page'));
        add_submenu_page('rbuilder_main', esc_html__("What's New?", "resume-builder"), esc_html__("What's New?", "resume-builder"), 'administrator', 'rbuilder_welcome', array(&$this, 'rbuilder_welcome_content'));
    }

    // Resumes Panel
    public function rbuilder_resumes_page()
    {
        if (!current_user_can('administrator')) {
            wp_die( esc_html__('You do not have sufficient permissions to access this page.', 'resume-builder') );
        }
        include(RBUILDER_DIR . 'templates/admin/resumes.php');
    }

    // What's New?
    public function rbuilder_welcome_content()
    {
        if (!current_user_can('administrator')) {
            wp_die( esc_html__('You do not have sufficient permissions to access this page.', 'resume-builder') );
        }
        include(RBUILDER_DIR . 'templates/admin/welcome.php');
    }
}
