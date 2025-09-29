<?php
/**
 * Simple_Job_Board_Activator Class
 * 
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @link       https://wordpress.org/plugins/simple-job-board
 * @since      1.0.0
 *
 * @package    Simple_Job_Board
 * @subpackage Simple_Job_Board/includes
 * @author     PressTigers <support@presstigers.com>
 */

class Simple_Job_Board_Activator {

    /**
     * Add WP Options for Job Board Settings.
     *
     * @since    1.0.0
     */
    public static function activate() {
        // Create custom page
        self::create_jobpost_page();

        // Options-> General Settings -> List Jobs with Logo & Detail
        add_option('job_board_jobpost_slug', 'jobs' );
        add_option('job_board_job_category_slug', 'job-category');
        add_option('job_board_job_type_slug', 'job-type');
        add_option('job_board_job_location_slug', 'job-location');
        
        // Options-> Appearance Settings -> Enable SJB Fonts
        add_option( 'sjb_fonts', 'enable-fonts' );
        
	    // Options-> Appearance Settings -> Enable SJB Quick Apply
        add_option( 'sjb_quick_apply', 'enable-quick-apply' );
        // Options-> Appearance Settings -> List Jobs with Logo & Detail
        add_option('job_board_listing', 'logo-detail');
        add_option('job_board_listing_view', 'list-view');

        // Options-> Search filters
        add_option('job_board_category_filter', 'yes', '');
        add_option('job_board_jobtype_filter', 'yes', '');
        add_option('job_board_location_filter', 'yes', '');
        add_option('job_board_search_bar', 'yes', '');

        // Options-> Notifications
        add_option('job_board_admin_notification', 'yes');
        add_option('job_board_applicant_notification', 'yes');
        add_option('job_board_hr_notification', 'no');

        // Options-> Uploaded File Extensions
        add_option('job_board_all_extensions_check', 'yes');
        add_option('job_board_anti_hotlinking', 'yes');
        update_option('job_board_allowed_extensions', array('pdf', 'doc', 'docx', 'odt', 'rtf', 'txt'));
        $sjb_layout = get_option('job_board_pages_layout');
        if(empty($sjb_layout)){
            $sjb_layout = 'theme-layout';
            update_option('job_board_pages_layout',$sjb_layout);
        }
        $default_fields = array(
            'jobapp_name' => array(
                'label' => 'Name',
                'type' => 'text',
                'optional' => 'checked',
                'applicant_column' => 'unchecked'
            ),
            'jobapp_email' => array(
                'label' => 'Email',
                'type' => 'email',
                'optional' => 'checked',
                'applicant_column' => 'unchecked'
            ),
            'jobapp_phone' => array(
                'label' => 'Phone',
                'type' => 'phone',
                'optional' => 'checked',
                'applicant_column' => 'unchecked'
            ),
            'jobapp_cover_letter' => array(
                'label' => 'Cover Letter',
                'type' => 'text_area',
                'optional' => 'checked',
                'applicant_column' => 'unchecked'
            )
        );

        $jobapp_fields = get_option('jobapp_settings_options');
        if(empty($jobapp_fields)){
            update_option('jobapp_settings_options', $default_fields);
            update_option('default_fields_count', 1);
        }
        // .htaccess Anti-Hotlinking Rules
        $sjbrObj = new Simple_Job_Board_Rewrite();
        $sjbrObj->job_board_rewrite(); 

        // Flush Rewrite Rules 
        flush_rewrite_rules();
    }

    private static function create_jobpost_page()
    {
        
        $existing_page_id = get_option('sjb_job_post_page_id');

        
        if (!$existing_page_id) 
         {
            // Proceed with creating the page if it does not exist or is trashed
            $page_title = __('Current Jobs', 'simple-job-board');
            $page_content = '[jobpost]'; 

            $page = array(
                'post_title'     => $page_title,
                'post_content'   => $page_content,
                'post_status'    => 'publish',
                'post_type'      => 'page',
                'post_author'    => 1,
            );
            
            $page_id = wp_insert_post($page);

            if ($page_id) {
                // Save the newly created page ID in the options
                update_option('sjb_job_post_page_id', $page_id);
            }
        }    

        
    }


}