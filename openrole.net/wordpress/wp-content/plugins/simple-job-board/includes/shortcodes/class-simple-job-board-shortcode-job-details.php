<?php
if (!defined('ABSPATH')) {
    exit;
} // Exit if accessed directly

/**
 * Simple_Job_Board_Shortcode_job_details Details Page
 *
 * This class lists the jobs on frontend for SJB detail widget
 *
 * @link        https://wordpress.org/plugins/simple-job-board
 * @since       2.9.6
 * @since       2.10.0   Changed defined templates to do_actions.
 * @package     Simple_Job_Board
 * @author      PressTigers <support@presstigers.com>
 */
class Simple_Job_Board_Shortcode_job_details
{

    public function __construct()
    {

        // Hook -> Add Job "Job details" widget
        add_shortcode('job_details', array($this, 'sjb_job_form_function'));
    }

    public function sjb_job_form_function($atts)
    {
        global $post;

        $atts = shortcode_atts([
            'show_job_features'     => 'yes',
            'show_job_meta'         => 'yes',
            'show_job_form'         => 'yes',
            'job_form_description'  => '',
            'job_id'                => 0,
        ], $atts);

        // Get buffer condition through hook
        $should_buffer = apply_filters('sjb_should_buffer_output', true, $post);
        
        if ($should_buffer) {
            ob_start();
        }

        do_action('sjb_enqueue_scripts');
        do_action('sjb_single_job_content_start');
        
        $original_post = null;
        if (!empty($atts['job_id'])) {
            $job_post = get_post(intval($atts['job_id']));
            if ($job_post && $job_post->post_type === 'jobpost') {
                global $post;
                $original_post = $post;
                $post = $job_post;
                setup_postdata($post);
            }
        }
        
        if( isset( $atts['job_form_description'] ) && 'yes' === $atts['job_form_description'] ){
            echo '<div class="sjb-job-description">'.$post->post_content.'</div>';
            
        }

        if (is_singular('jobpost') || (!empty($atts['job_id']) && isset($post))) {
            if ($atts['show_job_meta'] === 'yes') {
                do_action('sjb_single_job_listing_start', 'sjb_job_listing_meta_display', 20);
            } else {
                remove_action('sjb_single_job_listing_start', 'sjb_job_listing_meta_display', 30);
            }

            if ($atts['show_job_features'] === 'yes') {
                add_action('sjb_single_job_listing_end', 'sjb_job_listing_features', 20);
            } else {
                remove_action('sjb_single_job_listing_end', 'sjb_job_listing_features', 20);
            }

            if ($atts['show_job_form'] === 'yes') {
                add_action('sjb_single_job_listing_end', 'sjb_job_listing_application_form', 30);
            } else {
                remove_action('sjb_single_job_listing_end', 'sjb_job_listing_application_form', 30);
            }

            do_action('sjb_single_job_listing_end');
        }

        do_action('sjb_single_job_content_end');
        
        if ($original_post) {
            global $post;
            $post = $original_post;
            wp_reset_postdata();
        }

        return $should_buffer ? ob_get_clean() : '';
    }
}