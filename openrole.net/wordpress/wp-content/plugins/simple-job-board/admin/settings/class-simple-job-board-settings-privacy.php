<?php
if (!defined('ABSPATH')) {
    exit;
} // Exit if accessed directly
/**
 * Simple_Job_Board_GDPR_Settings Class
 * 
 * This file used to define the settings for the GDPR Settings. User can enable/disable
 * GDPR Settings and set the content for Privacy Policy and Terms & Conditions.
 *
 * @link        https://wordpress.org/plugins/simple-job-board
 * @since       2.6.0
 *
 * @package     Simple_Job_Board
 * @subpackage  Simple_Job_Board/admin/settings
 * @author     PressTigers <support@presstigers.com>
 */

class Simple_Job_Board_Privacy {

    /**
     * Initialize the class and set its properties.
     *
     * @since   2.6.0
     */
    public function __construct() {

        // Filter -> Add GDPR Settings Tab
        add_filter('sjb_settings_tab_menus', array($this, 'sjb_add_settings_tab'), 80);

        // Action -> Add GDPR Settings Section 
        add_action('sjb_settings_tab_section', array($this, 'sjb_add_settings_section'), 80);

        // Action -> Save GDPR Settings Section 
        add_action('sjb_save_setting_sections', array($this, 'sjb_save_settings_section'));
    }

    /**
     * Add GDPR Settings Tab.
     *
     * @since    2.6.0
     * 
     * @param    array  $tabs  Settings Tab
     * @return   array  $tabs  Merge array of Settings Tab with "GDPR Settings" Tab.
     */
    public function sjb_add_settings_tab($tabs) {

        $tabs['privacy_settings'] = esc_html__('Privacy', 'simple-job-board');
        return $tabs;
    }

    /**
     * Add GDPR Settings section.
     *
     * @since   2.6.0
     * @since   2.9.5   Corrected spelling mistakes.
     */
    public function sjb_add_settings_section() {
        ?>

        <!-- Filters Setting -->
        <div data-id="settings-privacy_settings" class="sjb-admin-settings tab">

            <ul class="sjb-privacy-subtabs">
                <li class="sjb-privacy-subtab active" data-subtab="privacy-options"><?php echo esc_html__('Privacy Policy', 'simple-job-board'); ?></li>
                <li class="sjb-privacy-subtab" data-subtab="term-conditions"><?php echo esc_html__('Terms & Conditions', 'simple-job-board'); ?></li>
                <li class="sjb-privacy-subtab" data-subtab="erase-personal-data"><?php echo esc_html__('Erase Personal Data', 'simple-job-board'); ?></li>
            </ul>
            <form method="post" id="privacy-settings-form">
                <?php 
                    //Enable GDPR Settings
                    $sjb_privacy_settings = get_option('job_board_privacy_settings', 'no');
                    $sjb_privacy_checkbox_settings = get_option('job_board_privacy_checkbox_settings', 'no');
                    $sjb_terms_conditions = get_option('job_board_terms_condition_settings', 'no');
                    //Enable Settings to Remove Personal Data from the Applicants
                    $remove_applicant_data = get_option('sjb_erasure_request_removes_applicant_data', 'no');

                    $job_board_privacy_policy_label = get_option('job_board_privacy_policy_label', '');
                    $job_board_privacy_policy_content = get_option('job_board_privacy_policy_content', '');

                    $job_board_term_conditions_label = get_option('job_board_term_conditions_label', '');
                    $job_board_term_conditions_content = get_option('job_board_term_conditions_content', '');
                ?>
                <!-- Privacy Options -->
                <div id="privacy-options" class="sjb-privacy-subtab-content active">
                    <?php
                    /**
                     * Action -> Add new section before GDPR settings .  
                     * 
                     * @since 2.6.0 
                     */
                    do_action('sjb_privacy_settings_section_start');
                    
                    ?>
                    <!-- <h4 class="first"><?php esc_html_e('Configure Privacy Policy Settings', 'simple-job-board'); ?></h4> -->
                    
                        <div class="sjb-section">
                            <div class="sjb-content">
                                <?php
                                /**
                                 * Action -> Add new fields at the start of GDPR settings section.  
                                 * 
                                 * @since 2.6.0 
                                 */
                                do_action('sjb_privacy_settings_start');
                                
                                ?>
                                
                                <div class="sjp-form-field-note">
                                    <span><?php echo esc_html__('Note:
                                    The privacy label and content entered here will appear as plain text in the application form on the job detail page if you did not check the "Enable Privacy Policy Checkbox".
                                    Please make sure to add content if you check the "Enable Privacy Policy Checkbox"', 'simple-job-board'); ?></span>
                                    
                                </div>
                                <div class="sjb-form-group">
                                    <input type="checkbox" name="job_privacy_settings" id="enable-terms" value="yes"  <?php checked('yes', esc_attr($sjb_privacy_settings)); ?> />
                                    <label for="enable-terms"><?php echo esc_html__('Enable Privacy Policy', 'simple-job-board'); ?></label>
                                    <input type='hidden' name="empty_privacy_settings" value="empty_privacy_settings" >
                                </div>
                                <div class="sjb-form-group">
                                    <input type="checkbox" name="job_privacy_checkbox_settings" id="enable-privacy-cb" value="yes"  <?php checked('yes', esc_attr($sjb_privacy_checkbox_settings)); ?> />
                                    <label for="enable-privacy-cb"><?php echo esc_html__('Enable Privacy Policy Checkbox', 'simple-job-board'); ?></label>
                                    <input type='hidden' name="empty_privacy_checkbox_settings" value="empty_privacy_checkbox_settings" >
                                </div>
                                <div class="sjb-form-group">
                                    <label class="font-bold"><?php echo esc_html__('Privacy Policy Label (Opt.)', 'simple-job-board'); ?></label>
                                </div>
                                <div>
                                    <input type="text" id="setting_privacy_policy_label" name="privacy_policy_label" class="form-control full-width" value="<?php echo esc_attr( $job_board_privacy_policy_label ); ?>" >
                                    
                                </div>
                                <div class="sjb-form-group">
                                    <label class="font-bold"><?php echo esc_html__('Privacy Policy Content', 'simple-job-board'); ?></label>
                                </div>
                                <div>
                                    <?php wp_editor('' . stripslashes_deep(trim(implode("", explode("\\", $job_board_privacy_policy_content)))) . '', 'privacy_policy_content'); ?>
                                    
                                </div>

                                <?php
                                /**
                                 * Action -> Add new fields at the end of GDPR settings section.  
                                 * 
                                 * @since 2.6.0 
                                 */
                                do_action('sjb_privacy_settings_end');
                                ?>
                            </div>
                        </div>
                    </div>

                <!-- Term&Conditions Options -->
                <div id="term-conditions" class="sjb-privacy-subtab-content">
                    <div class="sjb-section">
                        <div class="sjb-content">
                            <?php
                            /**
                             * Action -> Add new fields at the start of GDPR settings section.  
                             * 
                             * @since 2.6.0 
                             */
                            do_action('sjb_privacy_settings_start');
                            ?>
                            <div class="sjp-form-field-note">
                                    <span><?php echo esc_html__('Note: The terms & conditions label and content entered here will appear as a checkbox in the application form on the job detail page.', 'simple-job-board'); ?></span>
                            </div>
                            <div class="sjb-form-group">
                                    <input type="checkbox" name="job_terms_conditions_settings" id="enable-terms" value="yes"  <?php checked('yes', esc_attr($sjb_terms_conditions)); ?> />
                                    <label for="enable-terms"><?php echo esc_html__('Enable Terms & Conditions', 'simple-job-board'); ?></label>
                                    <input type='hidden' name="empty_tems_condition_settings" value="empty_tems_condition_settings" >
                                </div>
                            <div class="sjb-form-group">
                                <label class="font-bold"><?php echo esc_html__('Terms & Conditions Label (Opt.)', 'simple-job-board'); ?></label>
                            </div>
                            <div>
                                <input type="text" id="setting_term_conditions_label" name="term_conditions_label" class="form-control full-width" value="<?php echo esc_attr($job_board_term_conditions_label); ?>">
                            </div>
                            <div class="sjb-form-group">
                                <label class="font-bold"><?php echo esc_html__('Terms & Conditions Content', 'simple-job-board'); ?></label>
                            </div>
                            <div>
                                <?php wp_editor('' . stripslashes_deep(trim(implode("", explode("\\", $job_board_term_conditions_content)))) . '', 'term_conditions_content'); ?>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Erase Personal Data Options -->
                <div id="erase-personal-data" class="sjb-privacy-subtab-content">

                    <?php
                    /**
                     * Action -> Add new section before Remove Personal Data Settings settings.  
                     * 
                     * @since 2.6.0 
                     */
                    do_action('sjb_eraser_applicant_data_section_start');
                    ?>
                    
                    <div class="sjb-section">
                        <div class="sjb-content">
                            <div class="sjp-form-field-note">
                                    <span><?php echo esc_html__('Note: This will work with WordPress native tool of removing personal data.', 'simple-job-board'); ?></span>
                            </div>
                            <!-- <h4 class = "first"><?php esc_html_e('Remove Personal Data Settings', 'simple-job-board'); ?></h4> -->
                            <div class = "sjb-form-group">
                                <input type = "checkbox" id="remove-personal-data" name = "job_remove_applicant_data_settings" value = "yes" <?php checked('yes', esc_attr($remove_applicant_data)); ?> />
                                <label for="remove-personal-data"><?php echo esc_html__('Remove personal data from applications including resumes.', 'simple-job-board'); ?></label>
                                <input type='hidden' name="empty_remove_applicant_data_settings" value="empty_remove_applicant_data_settings" >
                            </div>
                        </div>
                    </div>
                    <?php
                    /**
                     * Action -> Add new section after Remove Personal Data Settings settings. 
                     * 
                     * @since 2.6.0 
                     */
                    do_action('sjb_eraser_applicant_data_section_end');
                    ?>
                </div>

                <input type="hidden" value="1" name="admin_notices" />
                <input type="hidden" name="settings_privacy_nonce" value="<?php echo wp_create_nonce('jobpost_privacy_settings'); ?>" >
                <input type="submit" name="privacysettings_submit" id="privacy_settings" class="button button-primary" value="<?php echo esc_html__('Save Changes', 'simple-job-board'); ?>" />
            </form>
        </div>
        <?php
    }

    /**
     * Save Settings GDPR Settings Section.
     * 
     * This function is used to save the job filters settings. User can 
     * enable/disable the job filters on frontend for keyword search, category, job
     * type & job location filters.
     *
     * @since    2.6.0
     */
    public function sjb_save_settings_section() {

        // Check if nonce is set.
        if ( NULL == filter_input( INPUT_POST, 'settings_privacy_nonce' ) ) {
            return;
        }
        
        // Verify that the nonce is valid.
        check_admin_referer( 'jobpost_privacy_settings', 'settings_privacy_nonce' );
        $privacy_policy_label = isset($_POST['privacy_policy_label']) ? sanitize_text_field($_POST['privacy_policy_label']) : '';
        $privacy_policy_content = isset( $_POST['privacy_policy_content']) ? wp_kses_post($_POST['privacy_policy_content']) : '';

        $term_conditions_label = isset($_POST['term_conditions_label']) ? sanitize_text_field($_POST['term_conditions_label']) : '';
        $term_conditions_content = isset($_POST['term_conditions_content']) ? wp_kses_post($_POST['term_conditions_content']) : '';

        $sjb_privacy_settings = isset($_POST['job_privacy_settings']) ? sanitize_text_field($_POST['job_privacy_settings']) : '';
        $empty_privacy_settings = isset($_POST['empty_privacy_settings']) ? sanitize_text_field($_POST['empty_privacy_settings']) : '';
        $privacy_settings = 0;

        $sjb_privacy_checkbox_settings = isset($_POST['job_privacy_checkbox_settings']) ? sanitize_text_field($_POST['job_privacy_checkbox_settings']) : '';
        $empty_privacy_checkbox_settings = isset($_POST['empty_privacy_checkbox_settings']) ? sanitize_text_field($_POST['empty_privacy_checkbox_settings']) : '';
        $privacy_checkbox_settings = 0;

        $sjb_terms_condition_settings = isset($_POST['job_terms_conditions_settings']) ? sanitize_text_field($_POST['job_terms_conditions_settings']) : '';
        $empty_terms_condition_settings = isset($_POST['empty_tems_condition_settings']) ? sanitize_text_field($_POST['empty_tems_condition_settings']) : '';
        $terms_condition_settings = 0;

        $enable_applicant_erasure = isset($_POST['job_remove_applicant_data_settings']) ? sanitize_text_field($_POST['job_remove_applicant_data_settings']) : '';
        $empty_applicant_settings = isset($_POST['empty_remove_applicant_data_settings']) ? sanitize_text_field($_POST['empty_remove_applicant_data_settings']) : '';
        $applicant_settings = 0;

        // Save GDPR Settings
        if (!empty($empty_privacy_settings)) {

            if (!empty($sjb_privacy_settings)) {
                update_option('job_board_privacy_settings', sanitize_text_field( $sjb_privacy_settings ) );
                $privacy_settings = 1;
            }

            if (0 === $privacy_settings) {
                update_option('job_board_privacy_settings', 'no');
            }

            if (!empty($sjb_privacy_checkbox_settings)) {
                update_option('job_board_privacy_checkbox_settings', sanitize_text_field( $sjb_privacy_checkbox_settings ) );
                $privacy_checkbox_settings = 1;
            }

            if (0 === $privacy_checkbox_settings) {
                update_option('job_board_privacy_checkbox_settings', 'no');
            }

            //Save Privacy Policy Label Settings
            if (!empty($privacy_policy_label)) {
                update_option('job_board_privacy_policy_label', sanitize_text_field( stripslashes( $privacy_policy_label) ) );
            } elseif ('' === $privacy_policy_label) {
                update_option('job_board_privacy_policy_label', sanitize_text_field( $privacy_policy_label) );
            }

            // Update Privacy Policy Content
            if (!empty($privacy_policy_content)) {
                update_option('job_board_privacy_policy_content', wp_kses_post( $privacy_policy_content ) );
            } elseif ('' === $privacy_policy_content) {
                update_option('job_board_privacy_policy_content', sanitize_text_field( $privacy_policy_content ) );
            }

            

            // Save GDPR Remove Application Data Settings
            if (!empty($empty_applicant_settings)) {
                if (!empty($enable_applicant_erasure)) {
                    update_option('sjb_erasure_request_removes_applicant_data', sanitize_text_field( $enable_applicant_erasure ) );
                    $applicant_settings = 1;
                }

                if (0 === $applicant_settings) {
                    update_option('sjb_erasure_request_removes_applicant_data', 'no');
                }
            }
        }

        if (!empty($empty_terms_condition_settings)) {

            if (!empty($sjb_terms_condition_settings)) {
                update_option('job_board_terms_condition_settings', sanitize_text_field( $sjb_terms_condition_settings ) );
                $terms_condition_settings = 1;
            }
    
            if (0 === $terms_condition_settings) {
                update_option('job_board_terms_condition_settings', 'no');
            }
    
            // Update T&C Label
            if (!empty($term_conditions_label)) {
                update_option('job_board_term_conditions_label', sanitize_text_field( stripslashes(  $term_conditions_label) ) );
            } elseif ('' === $term_conditions_label) {
                update_option('job_board_term_conditions_label', sanitize_text_field( $term_conditions_label ) );
            }
    
            // Update T&C Content
            if (!empty($term_conditions_content)) {
                update_option('job_board_term_conditions_content', wp_kses_post( $term_conditions_content ) );
            } elseif ('' === $term_conditions_content) {
                update_option('job_board_term_conditions_content', sanitize_text_field( $term_conditions_content ) );
            }
        }
        

    }
}
