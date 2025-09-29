<?php if (!defined('ABSPATH')) {
    exit;
} // Exit if accessed directly
/**
 * Simple_Job_Board_Settings_General Class
 * 
 * This file saves the slugs of custom post type and taxonomies. User can 
 * defined the "jopost" custom post type, "job category", "job type" & 
 * "job location" taxonomies slugs according to your site requirements. 
 *
 * @link        https://wordpress.org/plugins/simple-job-board
 * @since       2.2.3
 * @since       2.4.0   Revised Inputs & Outputs Sanitization & Escaping
 *
 * @package     Simple_Job_Board
 * @subpackage  Simple_Job_Board/admin/settings
 * @author      PressTigers <support@presstigers.com>
 */

class Simple_Job_Board_Settings_General
{

    /**
     * Initialize the class and set its properties.
     *
     * @since   2.2.3
     */
    public function __construct()
    {

        // Filter -> Add Settings General Tab
        add_filter('sjb_settings_tab_menus', array($this, 'sjb_add_settings_tab'), 20);

        // Action -> Add Settings General Section 
        add_action('sjb_settings_tab_section', array($this, 'sjb_add_settings_section'), 20);

        // Action -> Save Settings General Section 
        add_action('sjb_save_setting_sections', array($this, 'sjb_save_settings_section'));
    }

    /**
     * Add Settings General Tab.
     *
     * @since    2.2.3
     * 
     * @param    array  $tabs  Settings Tab
     * @return   array  $tabs  Merge array of Settings Tab with General Tab.
     */
    public function sjb_add_settings_tab($tabs)
    {

        $tabs['general'] = esc_html__('General', 'simple-job-board');
        
        return $tabs;
    }

    
    /**
     * Add Settings General Section.
     *
     * This function is used to display settings general section & also display 
     * the stored settings.
     *  
     * @since    2.2.3
     * @since    2.10.0 Added settings for date format.
     */
  
     public function sjb_add_settings_section()
     {
         ?>
         
         <div data-id="settings-general" class="sjb-admin-settings tab tab-active">
             
             <ul class="sjb-general-subtabs">
                 <li class="sjb-general-subtab active" data-subtab="general-options"><?php echo esc_html__('General Options', 'simple-job-board'); ?></li>
                 <li class="sjb-general-subtab" data-subtab="shortcode"><?php echo esc_html__('Shortcodes', 'simple-job-board'); ?></li>
             </ul>
             <form method="post" id="general_options_form">
                <!-- General Options Section -->
                <div id="general-options" class="sjb-general-subtab-content active">
                    <?php
                    // Get Custom Post Type & Taxonomies Options
                    $jobpost_slug = get_option('job_board_jobpost_slug') ? esc_html(get_option('job_board_jobpost_slug')) : esc_html__('jobs', 'simple-job-board');
                    $job_archives_name = get_option('job_archives_name') !== false ? esc_html(get_option('job_archives_name')) : esc_html__('Job Archives', 'simple-job-board');
                    $category_slug = get_option('job_board_job_category_slug') ? esc_html(get_option('job_board_job_category_slug')) : esc_html__('job-category', 'simple-job-board');
                    $job_type_slug = get_option('job_board_job_type_slug') ? esc_html(get_option('job_board_job_type_slug')) : esc_html__('job-type', 'simple-job-board');
                    $job_location_slug = get_option('job_board_job_location_slug') ? esc_html(get_option('job_board_job_location_slug')) : esc_html__('job-location', 'simple-job-board');
                    $date_format = get_option('sjb_date_format') ? esc_html(get_option('sjb_date_format')) : esc_html__('d-m-y', 'simple-job-board');
                    $set = get_option('sjb_date_format_text') ? esc_html(get_option('sjb_date_format_text')) : '';
        
        
                    $d_m_y = '';
                    $y_m_d = '';
                    $m_d_y = '';
                    $mdy = '';
                    $dmy = '';
                    $custom = '';
                    
                    // Check Date Format Settings
                    if ('d-m-Y' === $date_format) {
                        $d_m_y = 'checked';
                    } elseif ('Y-m-d' === $date_format) {
                        $y_m_d = 'checked';
                    } elseif ('m-d-Y' === $date_format) {
                        $m_d_y = 'checked';
                    } elseif ('m/d/Y' === $date_format) {
                        $mdy = 'checked';
                    } elseif ('d/m/Y' === $date_format) {
                        $dmy = 'checked';
                    } else {
                        $custom = 'checked';
                    }
                    ?>
                        <?php
                        /**
                         * Action -> Add new section before general section content.  
                        * 
                        * @since   2.2.0 
                        */
                        do_action('sjb_general_options_before');
                        ?>
                        <div class="sjb-section general">
                            <div class="sjb-content">
        
                                <?php
                                /**
                                 * Action -> Add new fields at start of general section.  
                                * 
                                * @since   2.2.0 
                                */
                                do_action('sjb_general_options_start');
        
                                $site_url = get_site_url();
                                ?>
                                <div class="sjb-form-group">
                                    <div class="col-md-3">
                                        <label><?php echo esc_html__('Jobs Listing Page:', 'simple-job-board'); ?></label>
                                    </div>
                                    <div class="col-md-4">
                                        <select name="job_post_page" class="jobpost-page-selector">
                                            <option value=""><?php echo esc_html__('Select JobPost Page', 'sjb-job-alert'); ?></option>
                                            <?php
                                            $pages = get_pages();
                                            $jobpost_page_id = get_option('sjb_job_post_page_id'); 
                                            $jobpost_page_slug = get_post_field('post_name', $jobpost_page_id);
                                            foreach ($pages as $page) : ?>
                                                <option value="<?php echo esc_attr($page->ID); ?>" <?php selected($jobpost_page_id, $page->ID); ?>>
                                                    <?php echo esc_html($page->post_title); ?>
                                                </option>
                                            <?php endforeach; ?>
                                        </select>
                                        <div class="sjb-preview-url">
                                            <i class="fa fa-globe"></i>
                                            <a href="<?php echo esc_url($site_url) ?>/<?php echo esc_attr($jobpost_page_slug); ?>/" target="_blank">
                                                <span><?php echo esc_url($site_url) ?>/<?php echo esc_attr($jobpost_page_slug); ?>/</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div class="sjb-form-group">
                                    <div class="col-md-3">
                                        <label><?php echo esc_html__('Jobs Listing Custom Post Type Slug:', 'simple-job-board'); ?></label>
                                    </div>
                                    <div class="col-md-4">
                                        <input type="text" name="jobpost_slug" value="<?php echo esc_attr($jobpost_slug); ?>" size="30" maxlength="25" class="sjb-form-control">
                                        <div class="sjb-preview-url">
                                            <i class="fa fa-globe"></i>
                                            <a href="<?php echo esc_url($site_url) ?>/<?php echo esc_attr($jobpost_slug); ?>/" target="_blank">
                                                <span><?php echo esc_url($site_url) ?>/<?php echo esc_attr($jobpost_slug); ?>/</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
        
                                <div class="sjb-form-group">
                                    <div class="col-md-3">
                                        <label><?php echo esc_html__('Job Archives Page Title:', 'simple-job-board'); ?></label>
                                    </div>
                                    <div class="col-md-4">
                                        <input type="text" name="job_archives_name" value="<?php echo esc_attr($job_archives_name); ?>" size="30" maxlength="25" />
                                        <div class="sjb-preview-url"></div>
                                    </div>
                                </div>
                                <div class="sjb-form-group">
                                    <div class="col-md-3">
                                        <label><?php echo esc_html__('Date Field Format:', 'simple-job-board'); ?></label>
                                    </div>
                                    <div class="col-md-4">
                                        <!-- Datepicker Date Format -->
                                        <ul class="sjb-date-format-list">
                                            <li class="sjb-form-group right-align">
                                                <label>
                                                    <input type="radio" name="sjb_date_format" value="d-m-Y"<?php echo esc_attr($d_m_y); ?>>
                                                    <span><?php echo esc_attr(date('d-m-Y', time())); ?></span>
                                                    <code><?php echo esc_attr("d-m-Y"); ?></code>
                                                </label>
                                            </li> 
                                            <li class="sjb-form-group right-align">
                                                <label>
                                                    <input type="radio" name="sjb_date_format" value="m-d-Y"<?php echo esc_attr($m_d_y); ?>>
                                                    <span><?php echo esc_attr(date('m-d-Y', time())); ?></span>
                                                    <code><?php echo esc_attr("m-d-Y"); ?></code>
                                                </label>
                                            </li>
                                            <li class="sjb-form-group right-align">
                                                <label>
                                                    <input type="radio" name="sjb_date_format" value="Y-m-d"<?php echo esc_attr($y_m_d); ?>>
                                                    <span><?php echo esc_attr(date('Y-m-d', time())); ?></span>
                                                    <code><?php echo esc_attr("Y-m-d"); ?></code>
                                                </label>
                                            </li>            
                                            <li class="sjb-form-group right-align">
                                                <label>
                                                    <input type="radio" name="sjb_date_format" value="m/d/Y"<?php echo esc_attr($mdy); ?>>
                                                    <span><?php echo esc_attr(date('m/d/Y', time())); ?></span>
                                                    <code><?php echo esc_attr("m/d/Y"); ?></code>
                                                </label>
                                            </li>
                                            <li class="sjb-form-group right-align">
                                                <label>
                                                    <input type="radio" name="sjb_date_format" value="d/m/Y"<?php echo esc_attr($dmy); ?>>
                                                    <span><?php echo esc_attr(date('d/m/Y', time())); ?></span>
                                                    <code><?php echo esc_attr("d/m/Y"); ?></code>
                                                </label>
                                            </li>
                                            <li class="sjb-form-group right-align">
                                                <label>
                                                    <input type="radio" name="sjb_date_format" id="sjb_date_format_custom" value="<?php echo esc_attr($set); ?>"<?php echo esc_attr($custom); ?> ><?php echo esc_html__('Custom', 'simple-job-board'); ?>:
                                                    <input type="text" name="sjb_date_format_custom_text" id="sjb_date_format_text" value="<?php echo esc_attr($set); ?>">
                                                </label>
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="sjb-clearfix"></div>
                                    <div class="sjb-form-group">
                                        <hr>
                                        <div class="col-md-3">
                                            <label for="delete_data_on_uninstall"><?php echo esc_html__('Delete Data On Uninstall:', 'simple-job-board'); ?></label>
                                        </div>
                                        <div class="col-md-4">
                                            <input type="checkbox" name="delete_data_on_uninstall" id="delete_data_on_uninstall" value="1"<?php if ('yes' === get_option('delete_data_on_uninstall')) echo 'checked="checked"'; ?> />
                                            <label for="delete_data_on_uninstall" class="sjb-delete-data-label"><?php echo esc_html__('Delete SJB data on plugin uninstall.', 'simple-job-board'); ?></label>
                                            <span class="delete-warning"><?php echo esc_html__('WARNING: All associated information, including settings, configurations, and records, will be permanently removed from the database. Please ensure that you have backed up any critical data before proceeding, as restoration will not be possible once deletion is complete.', 'simple-job-board'); ?></span>
                                        </div>
                                    </div>
                                </div>
        
                                <?php
                                /**
                                 * Action -> Add new fields at the end of general section.  
                                * 
                                * @since   2.2.0 
                                */
                                do_action('sjb_general_options_end');
                                ?>
        
                            </div>
                        </div>
                        <?php
                        /**
                         * Action -> Add new section after general section content .  
                        * 
                        * @since   2.2.0 
                        */
                        do_action('sjb_general_options_after');
                        ?>
                        <input type="hidden" value="1" name="admin_notices">
                        <input type="hidden" name="settings_general_nonce" value="<?php echo wp_create_nonce('jobpost_general_settings'); ?>" >
                        <input type="submit" name="general_options_submit" id="general-options-form-submit" class="button button-primary" value="<?php echo esc_html__('Save Changes', 'simple-job-board'); ?>">                
                    
                </div>
        
                <!-- Shortcode Section -->
                <div id="shortcode" class="sjb-general-subtab-content">
                    <div class="sjb-section general">
                        <div class="sjb-content sjb-content-shortcodes">
                            <?php
                                /**
                                 * Action -> Add new fields at start of shortcode section.  
                                * 
                                * @since   2.2.0 
                                */
                                do_action('sjb_general_shortcode_start');
        
                                $site_url = get_site_url();
                                ?>
                                <div class="sjb-shortcodes-heading">
                                        <h4><?php echo esc_html__('[jobpost]', 'simple-job-board'); ?></h4>
                                </div>

                                <div class="sjb-form-group">
                                    <div class="col-md-12 sjb-shortcodes-description">
                                            <label><?php echo esc_html__('Use this shortcode to show jobs on a page, along with search form.', 'simple-job-board'); ?></label>
                                    </div>
                                </div>
                                
                                <div class="sjb-shortcodes-heading">
                                        <h4><?php echo esc_html__('[jobpost layout="grid"]', 'simple-job-board'); ?></h4>
                                </div>

                                <div class="sjb-form-group">
                                    <div class="col-md-12 sjb-shortcodes-description">
                                            <label><?php echo esc_html__('To list all the jobs as a grid view.', 'simple-job-board'); ?></label>
                                    </div>
                                </div>
                                
                                <div class="sjb-shortcodes-heading">
                                        <h4><?php echo esc_html__('[jobpost category="category-slug"]', 'simple-job-board'); ?></h4>
                                </div>
                                
                                <div class="sjb-form-group">
                                    <div class="col-md-12 sjb-shortcodes-description">
                                            <label><?php echo esc_html__('To list jobs for a particular category.', 'simple-job-board'); ?></label>
                                    </div>
                                </div>
                                
                                <div class="sjb-shortcodes-heading">
                                        <h4><?php echo esc_html__('[jobpost type="type-slug"]', 'simple-job-board'); ?></h4>
                                </div>
                                
                                <div class="sjb-form-group">
                                    <div class="col-md-12 sjb-shortcodes-description">
                                            <label><?php echo esc_html__('To list jobs for a particular type.', 'simple-job-board'); ?></label>
                                    </div>
                                </div>
                                
                                <div class="sjb-shortcodes-heading">
                                        <h4><?php echo esc_html__('[jobpost location="location-slug"]', 'simple-job-board'); ?></h4>
                                </div>
                                
                                <div class="sjb-form-group">
                                    <div class="col-md-12 sjb-shortcodes-description">
                                            <label><?php echo esc_html__('To list jobs for a particular location.', 'simple-job-board'); ?></label>
                                    </div>
                                </div>
                                
                                <div class="sjb-shortcodes-heading">
                                        <h4><?php echo esc_html__('[jobpost location="location-slug" category="category-slug" type="type-slug"]', 'simple-job-board'); ?></h4>
                                        
                                </div>
                                <div class="sjb-form-group">
                                    <div class="col-md-12 sjb-shortcodes-description">
                                            <label><?php echo esc_html__('To list jobs with a combinations of taxonomies and terms.', 'simple-job-board'); ?></label>
                                    </div>
                                </div>
                                
                                <div class="sjb-shortcodes-heading">
                                        <h4><?php echo esc_html__('[jobpost posts="5"]', 'simple-job-board'); ?></h4>
                                        
                                </div>
                                <div class="sjb-form-group">
                                    <div class="col-md-12 sjb-shortcodes-description">
                                            <label><?php echo esc_html__('To limit the number of jobs per page with pagination.', 'simple-job-board'); ?></label>
                                    </div>
                                </div>
                            
                                <div class="sjb-shortcodes-heading">
                                        <h4><?php echo esc_html__('[job_details job_id=”123″ show_job_form=”yes” show_job_features=”no” job_form_description=”yes” show_job_meta=”no”]', 'simple-job-board'); ?></h4>
                                        
                                </div>
                                <div class="sjb-form-group">
                                    <div class="col-md-12 sjb-shortcodes-description">
                                            <label><?php echo esc_html__('To show individual job anywhere.', 'simple-job-board'); ?></label>
                                    </div>
                                </div>
                                <?php
                                /**
                                 * Action -> Add new fields at the end of general section.  
                                * 
                                * @since   2.2.0 
                                */
                                do_action('sjb_general_shortcode_end');
                                ?>
                        </div>
                    </div>
                </div>
             </form>
         </div>
         <?php
     }

    /**
     * Save Settings General Section.
     * 
     * This function save the custom post type & taxonomies slugs in WP options.
     *
     * @since    2.2.3
     * @since    2.10.0 Saved date format settings.
     */
    public function sjb_save_settings_section()
    {
        if ( NULL == filter_input( INPUT_POST, 'settings_general_nonce' ) ) {
            return;
        }
        
        // Verify that the nonce is valid.
        check_admin_referer( 'jobpost_general_settings', 'settings_general_nonce' );
        
        $jobpost_slug = filter_input(INPUT_POST, 'jobpost_slug');
        $sjb_date_format = filter_input(INPUT_POST, 'sjb_date_format');
        $sjb_date_format_text = filter_input(INPUT_POST, 'sjb_date_format_custom_text');
        $job_archives_name = filter_input(INPUT_POST, 'job_archives_name');
        $delete_data_on_uninstall = filter_input(INPUT_POST, 'delete_data_on_uninstall');
        $jobpost_page_id = get_option('sjb_job_post_page_id'); 
        $selected_page = isset($_POST['job_post_page']) ? sanitize_text_field($_POST['job_post_page']) : $jobpost_page_id;
        
        if (isset($jobpost_slug) ||   isset($sjb_date_format) || isset($sjb_date_format_text) || isset($job_archives_name)) {
            
            // Save Custom Post Type Slug in WP Option
            (!empty($jobpost_slug)) ? update_option('job_board_jobpost_slug', sanitize_text_field( $jobpost_slug ) ) : update_option('job_board_jobpost_slug', '');

            // Save Category Taxonomy Slug in WP Option
            (!empty($job_category_slug)) ? update_option('job_board_job_category_slug', sanitize_text_field( $job_category_slug) ): update_option('job_board_job_category_slug', '');

            // Save Job Type Taxonomy Slug in WP Option
            (!empty($job_type_slug)) ? update_option('job_board_job_type_slug', sanitize_text_field( $job_type_slug) ) : update_option('job_board_job_type_slug', '');

            // Save Job Location Taxonomy Slug in WP Option
            (!empty($job_location_slug)) ? update_option('job_board_job_location_slug', sanitize_text_field( $job_location_slug ) ) : update_option('job_board_job_location_slug', '');

            // Save SJB date format in WP Option
            (!empty($sjb_date_format)) ? update_option('sjb_date_format', sanitize_text_field( $sjb_date_format ) ) : update_option('sjb_date_format', 'd-m-Y');

            // Save SJB date format text in WP Option
            (!empty($sjb_date_format_text)) ? update_option('sjb_date_format_text', sanitize_text_field( $sjb_date_format_text ) ) : '';

            // Save Custom Post Type Slug in WP Option
            (!empty($job_archives_name)) ? update_option('job_archives_name', sanitize_text_field( $job_archives_name ) ) : update_option('job_archives_name', '');
            (!empty($delete_data_on_uninstall)) ? update_option('delete_data_on_uninstall','yes' ) : update_option('delete_data_on_uninstall', '');
        }
        if (isset($_POST['job_post_page'])) {
            $selected_page = intval($_POST['job_post_page']); 
            update_option('sjb_job_post_page_id', $selected_page); 
        }
    }
}
