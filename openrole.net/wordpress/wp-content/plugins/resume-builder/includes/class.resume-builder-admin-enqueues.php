<?php
/**
 * Admin Enqueues
 *
 * @package     Resume Builder
 * @subpackage  Admin Enqueues
 * @since       2.0.0
*/

// Exit if accessed directly
if (! defined('ABSPATH')) {
    exit;
}

/**
 * Resume_Builder_Post_Types Class
 *
 * This class handles the post type creation.
 *
 * @since 3.0.0
 */
class Resume_Builder_Admin_Enqueues
{
    public static $admin_colors;

    public function __construct()
    {
        add_action('admin_enqueue_scripts', array(&$this, 'admin_enqueues'), 10, 1);
    }

    public function admin_enqueues($hook)
    {
        if (in_array($hook, ['toplevel_page_rbuilder_main','resumes_page_rbuilder_welcome'])) {
        
            $_rbuilder_settings = get_option( 'rbuilder_settings' );
            $rbuilder_js_vars = array(
                'rest_url' => get_rest_url(),
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce( 'wp_rest' ),
                'display_defaults' => Resume_Builder_Resumes::default_display_settings(),
                
                'i18n_save_resume' => __('Save Resume', 'resume-builder'),
                'i18n_go_back' => __('Go Back', 'resume-builder'),
                'i18n_styling_options' => __('Styling Options', 'resume-builder'),
                'i18n_introduction' => __('Introduction', 'resume-builder'),
                'i18n_history' => __('History', 'resume-builder'),
                'i18n_heading' => __('Heading', 'resume-builder'),
                'i18n_details' => __('Details', 'resume-builder'),
                'i18n_text' => __('Text', 'resume-builder'),
                'i18n_skill' => __('Skill', 'resume-builder'),
                'i18n_skills' => __('Skills', 'resume-builder'),
                'i18n_title' => __('Title', 'resume-builder'),
                'i18n_rating' => __('Rating', 'resume-builder'),
                'i18n_optional' => __('optional', 'resume-builder'),
                'i18n_star' => __('Star', 'resume-builder'),
                'i18n_stars' => __('Stars', 'resume-builder'),
                'i18n_company_school' => __('Company/School', 'resume-builder'),
                'i18n_degree_job_title' => __('Degree/Job Title', 'resume-builder'),
                'i18n_date_range' => __('Date Range', 'resume-builder'),
                'i18n_resume_wrapper' => __('Resume Wrapper', 'resume-builder'),
                'i18n_no_container' => __('No Container', 'resume-builder'),
                'i18n_contained' => __('Contained', 'resume-builder'),
                'i18n_background_color' => __('Background Color', 'resume-builder'),
                'i18n_padding' => __('Padding', 'resume-builder'),
                'i18n_max_width' => __('Max Width', 'resume-builder'),
                'i18n_percent' => __('Percent', 'resume-builder'),
                'i18n_pixels' => __('Pixels', 'resume-builder'),
                'i18n_radius' => __('Radius', 'resume-builder'),
                'i18n_shadow' => __('Shadow', 'resume-builder'),
                'i18n_no' => __('No', 'resume-builder'),
                'i18n_yes' => __('Yes', 'resume-builder'),
                'i18n_photo_size' => __('Photo Size', 'resume-builder'),
                'i18n_small' => __('Small', 'resume-builder'),
                'i18n_medium' => __('Medium', 'resume-builder'),
                'i18n_large' => __('Large', 'resume-builder'),
                'i18n_skills_position' => __('Skills Position', 'resume-builder'),
                'i18n_left' => __('Left', 'resume-builder'),
                'i18n_right' => __('Right', 'resume-builder'),
                'i18n_skills_ratings' => __('Skills Ratings', 'resume-builder'),
                'i18n_hide' => __('Hide', 'resume-builder'),
                'i18n_show' => __('Show', 'resume-builder'),
                'i18n_text_color' => __('Text Color', 'resume-builder'),
                'i18n_highlight_color' => __('Highlight Color', 'resume-builder'),
                'i18n_star_color' => __('Star Color', 'resume-builder'),
                'i18n_remove' => __('Remove', 'resume-builder'),
                'i18n_replace' => __('Replace', 'resume-builder'),
                'i18n_upload_photo' => __('Upload Photo', 'resume-builder'),
                'i18n_name' => __('Name', 'resume-builder'),
                'i18n_email' => __('Email', 'resume-builder'),
                'i18n_phone' => __('Phone', 'resume-builder'),
                'i18n_website' => __('Website', 'resume-builder'),
                'i18n_location' => __('Location', 'resume-builder'),
                'i18n_confirm_close_resume' => __('Are you sure you want to close this resume? You will lose any changes you made since opening it.', 'resume-builder'),
                'i18n_yes_close_it' => __('Yes, close it', 'resume-builder'),
                'i18n_required_fields' => __('Required Fields', 'resume-builder'),
                'i18n_required_fields_desc' => __('"Name" and "Title" are required.', 'resume-builder'),
                'i18n_okay' => __('Okay', 'resume-builder'),
                'i18n_create_a_resume' => __('Create a Resume', 'resume-builder'),
                'i18n_no_resumes_found' => __('No resumes found.', 'resume-builder'),
                'i18n_untrash' => __('Untrash', 'resume-builder'),
                'i18n_delete' => __('Delete', 'resume-builder'),
                'i18n_view' => __('View', 'resume-builder'),
                'i18n_duplicate' => __('Duplicate', 'resume-builder'),
                'i18n_move_to_trash' => __('Move to Trash', 'resume-builder'),
                'i18n_copied' => __('Copied!', 'resume-builder'),
                'i18n_copy_shortcode' => __('Copy Shortcode', 'resume-builder'),
                'i18n_confirm_delete_resume' => __('Are you sure you want to permanently delete this resume? It cannot be undone.', 'resume-builder'),
                'i18n_yes_delete_it' => __('Yes, delete it', 'resume-builder'),
                'i18n_use_this_photo' => __( 'Use this Photo', 'resume-builder' ),
                'i18n_select_photo' => __( 'Select or Upload a photo for this resume', 'resume-builder' ),
                'i18n_attachment' => __( 'Attachment', 'resume-builder' ),
                'i18n_add_attachment' => __( 'Add Attachment', 'resume-builder' ),
                'i18n_select_attachment' => __( 'Select or Upload a file attachment for this resume', 'resume-builder' ),
                'i18n_attachment_button_text' => __( 'Attachment Button Text', 'resume-builder' ),
            );
            
            wp_enqueue_script('jquery');

            // Resume Builder Admin Style Assets
            wp_enqueue_style('rbuilder-main', RBUILDER_URL . 'dist/main.css', array(), RBUILDER_VERSION);
            wp_enqueue_style('wp-color-picker');
        
            // Resume Builder Admin Script Assets
            wp_enqueue_media();
        
            // Resume Builder Admin Script
            wp_register_script('rbuilder-functions', RBUILDER_URL . 'dist/main.js', array(), RBUILDER_VERSION, true);
            wp_localize_script('rbuilder-functions', 'rbuilder_js_vars', $rbuilder_js_vars);
            wp_enqueue_script('rbuilder-functions');
            
        }
    }
}