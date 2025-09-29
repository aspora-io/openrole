<?php
/**
 * Post Types
 *
 * @package     Resume Builder
 * @subpackage  Post Types
 * @since       2.0.0
*/

// Exit if accessed directly
if (! defined('ABSPATH')) {
    exit;
}

class Resume_Builder_Post_Type
{
    public function __construct()
    {
        register_activation_hook(RBUILDER_PLUGIN_FILE, array( &$this, 'activation' ));
        register_deactivation_hook(RBUILDER_PLUGIN_FILE, array( &$this, 'deactivation' ));
        add_action('init', array( &$this, 'init' ));
    }

    public function activation()
    {
        self::init();
        flush_rewrite_rules();
    }

    public function deactivation()
    {
        flush_rewrite_rules();
    }

    public function init()
    {
        
        add_image_size('rb-resume-thumbnail', 800, 800, true);

        $resume_slug = apply_filters( 'rb_resume_slug', 'resume' );

        register_post_type(
            'rb_resume',
            array(
                'labels' => array(
                    'name'               => __('Resumes', 'resume-builder'),
                    'singular_name'      => __('Resume', 'resume-builder'),
                    'menu_name'          => __('Resumes', 'resume-builder'),
                    'name_admin_bar'     => __('Resume', 'resume-builder'),
                    'add_new'            => __('Add New', 'resume-builder'),
                    'add_new_item'       => __('Add New Resume', 'resume-builder'),
                    'new_item'           => __('New Resume', 'resume-builder'),
                    'edit_item'          => __('Edit Resume', 'resume-builder'),
                    'view_item'          => __('View Resume', 'resume-builder'),
                    'all_items'          => __('All Resumes', 'resume-builder'),
                    'search_items'       => __('Search Resumes', 'resume-builder'),
                    'not_found'          => __('No Resumes found.', 'resume-builder'),
                    'not_found_in_trash' => __('No Resumes found in Trash.', 'resume-builder')
                ),
                'description' => __('Resumes', 'resume-builder'),
                'public' => true,
                'show_in_admin_bar' => false,
                'show_in_menu' => false,
                'show_in_rest' => true,
                'rest_base'    => 'resumes',
                'has_archive' => false,
                'menu_position' => 25,
                'supports' => array( 'title', 'thumbnail' ),
                'rewrite' => array(
                    'with_front' => false,
                    'slug' => $resume_slug
                )

            )
        );
    }

}
