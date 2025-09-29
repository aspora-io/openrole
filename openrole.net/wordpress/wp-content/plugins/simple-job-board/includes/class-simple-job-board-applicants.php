<?php
if (!defined('ABSPATH')) {
    exit;
} // Exit if accessed directly
/**
 * Simple_Job_Board_Applicants Class
 * 
 * This is used to display the applicant details in WP admin. It also display the 
 * applicant data & resume. 
 *
 * @link        https://wordpress.org/plugins/simple-job-board
 * @since       1.0.0
 * @since       2.3.0   Added "sjb_resume_link_after" and "sjb_applicant_name" hooks.
 * 
 * @package     Simple_Job_Board
 * @subpackage  Simple_Job_Board/includes
 * @author      PressTigers <support@presstigers.com>
 */

class Simple_Job_Board_Applicants {

    /**
     * Initialize the class and set its properties.
     *
     * @since   1.0.0
     */
    public function __construct() {

        // Hook -> Job Applicants Data
        add_action('edit_form_after_title', array($this, 'jobpost_applicants_detail_page_content'));
    }

    /**
     * Create Detail Page for Applicants
     * 
     * @since   1.0.0
     */
    public function jobpost_applicants_detail_page_content() {
        global $post;
        
      
        $allowed_tags = sjb_get_allowed_html_tags();

        if (!empty($post) and 'jobpost_applicants' === $post->post_type):

            $keys = get_post_custom_keys($post->ID);
            
            /**
             * Fires before displaying the applicant details
             * 
             * @since 2.2.0
             */
            do_action('sjb_applicants_details_before', $post->ID);
            ?>
            <div class="wrap"><div id="icon-tools" class="icon32"></div>
                <?php
                // Applicant Name
                if (NULL != $keys):
                    foreach ($keys as $key) {
                        if ('jobapp_' === substr($key, 0, 7)) {
                            $place = strpos($key, 'name');
                            if (!empty($place)) {
                                $applicant_name = get_post_meta($post->ID, $key, TRUE);
                                $applicant_name = apply_filters('sjb_applicant_name', $applicant_name);
                                break;
                            }
                        }
                    }
                endif;
                ?>
                <h3 class="sjb-application-pre-detail">
                    <?php echo esc_html__('Job title ', 'simple-job-board'); ?>: <?php echo '<a href="'.esc_url(get_permalink($post->post_parent)).'" target=_blank>'.get_the_title($post->post_parent).'</a>'; ?>
                </h3>
                <!-- Applicant's Name & Resume in Admin Area -->
                <h3 class="sjb-application-pre-detail">
                    <?php
                    echo isset($applicant_name) ? esc_attr( $applicant_name ) : '';
                    echo "   ";
                    // Applicant Resume
                    $resume = '';
                    
                    if(NULL != $keys){
                        if (in_array('resume', $keys) && 'Resume[deleted]' == get_post_meta($post->ID, 'resume', TRUE)) {
                            $resume = '&nbsp; &nbsp; <small>Resume[deleted]</small>';
                        } elseif (in_array('resume', $keys) && '/' != get_post_meta($post->ID, 'resume', TRUE)) {
                            $resume = '&nbsp; &nbsp; <small><a href="' . esc_url(get_admin_url() . 'post.php?post=' . intval($post->ID) . '&action=edit&resume_id=' . intval($post->ID)) . '" rel="nofollow">' . esc_html__('Resume', 'simple-job-board') . '</a></small>';
                        } 
                    }

                    echo apply_filters('sjb_applicant_resume', wp_kses( $resume, $allowed_tags), $post->ID);
                    ?>                    
                </h3>
                
                <?php
                /**
                 * Action -> Fires after Resume Link
                 * 
                 * @since   2.3.0
                 */
                do_action('sjb_resume_link_after', $post->ID);
                ?>

                <!-- Applicant's Detail in Admin Area -->
                <table class="widefat striped sjb-table-application-detail">
                    <?php
                    /**
                     * Fires at start of applicant details
                     * 
                     * @since 2.2.0
                     */
                    do_action('sjb_applicants_details_start', $post->ID);
                    $parent_id = wp_get_post_parent_id($post->ID);                          
                    foreach ($keys as $key):
                        if (substr($key, 0, 7) == 'jobapp_') {
                            
                            $val = get_post_meta( $parent_id, $key, TRUE );
                            $label = isset($val['label']) ? $val['label'] : ucwords(str_replace('_', ' ', substr($key, 7)));
                           
                            if (!is_array(get_post_meta($post->ID, $key, TRUE))) {
                                
                                $mail = strpos($key, 'mail');
                                $phone = strpos($key, 'phone');
                                $tc = strpos($key, '_tc');
                                $pp = strpos($key, '_pp');
                                
                                if (!empty($mail)) {
                                    $applicant_email = strip_tags(get_post_meta($post->ID, $key, TRUE));
                                    $applicant_email = '<a href="mailto:'. $applicant_email .'" target="_blank" rel="noopener noreferrer">'. $applicant_email . '</a>' ;
                                    echo '<tr><td>' . esc_attr( $label ) . '</td><td>' . wp_kses_post( $applicant_email ) . '</td></tr>';
                                    $usergravatar = 'http://www.gravatar.com/avatar/' . md5($applicant_email) . '?s=32';
                                    if($usergravatar){
                                        echo '<tr><td>' . __('Applicant Picture', 'simple-job-board') . '</td><td>' . '<img src="' . $usergravatar . '" class="pt_gravatar"><br>' . ' <span class"notes">'.__('This image is sourced from Gravatar.', 'simple-job-board').'</span></td></tr>';
                                    }
                                }else if (!empty($phone)) {
                                    $applicant_phone = strip_tags(get_post_meta($post->ID, $key, TRUE));
                                    $phone_hyperlink = '<a href="tel:'. $applicant_phone .'" target="_blank" rel="noopener noreferrer">'. $applicant_phone . '</a>' ;
                                    echo '<tr><td>' . esc_attr( $label ) . '</td><td>' . wp_kses_post( $phone_hyperlink ) . '</td></tr>';
                                }else if (!empty($tc)) {
                                    $tc_content = strip_tags(get_post_meta($post->ID, $key, TRUE));                                    
                                    echo '<tr><td>' . __('Terms & Conditions', 'simple-job-board') . '</td><td>' . $tc_content . '</td></tr>';
                                }else if (!empty($pp)) {
                                    $pp_content = strip_tags(get_post_meta($post->ID, $key, TRUE));                                    
                                    echo '<tr><td>' . __('Privacy & Policy', 'simple-job-board') . '</td><td>' . $pp_content . '</td></tr>';
                                }else{
                                    
                                    echo '<tr><td>' . esc_attr( $label ) . '</td><td>' . wp_kses_post( get_post_meta($post->ID, $key, TRUE) ) . '</td></tr>';
                                }
                            } else {
                                $values = get_post_meta($post->ID, $key, TRUE);
                                
                                if (is_array($values)) {
                                    echo '<tr><td>' . esc_attr( $label ) . '</td><td>';
                                    $count = sizeof($values);
                                    foreach ($values as $val):
                                        echo wp_kses_post($val);
                                        if ($count > 1) {
                                            echo ',&nbsp';
                                        }
                                        $count--;
                                    endforeach;
                                    echo '</td></tr>';
                                } else {
                                    echo '<tr><td>' . esc_attr( $label ) . '</td><td>' . wp_kses_post( get_post_meta($post->ID, $key, TRUE) ) . '</td></tr>';
                                }
                            }
                        }
                    endforeach;

                    /**
                     * Fires at the end of applicant details
                     * 
                     * @since 2.2.0
                     */
                    do_action('sjb_applicants_details_end', $post->ID);
                    ?>

                </table>
            </div>

            <?php
            /**
             * Fires after displaying the applicant details
             * 
             * @since 2.2.0
             */
            do_action('sjb_applicants_details_after', $post->ID);
            ?>

            <h2><?php esc_html_e('Application Notes', 'simple-job-board'); ?></h2>

            <?php
            /**
             * Fires after displaying the applicant details
             * 
             * @since 2.2.0 
             */
            do_action('sjb_applicantion_notes', $post->ID);

        endif;
    }

}

new Simple_Job_Board_Applicants();