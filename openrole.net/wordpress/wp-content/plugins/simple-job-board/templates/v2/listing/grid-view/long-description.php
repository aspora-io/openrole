<?php
/**
 * The template for displaying job description in list view
 *
 * Override this template by copying it to yourtheme/simple_job_board/v2/listing/grid-view/long-description.php
 *
 * @author      PressTigers
 * @package     Simple_Job_Board
 * @subpackage  Simple_Job_Board/templates/listing/list-view
 * @version     1.0.0
 */
ob_start();
global $post;

?>

<!-- View long content start 
================================================== -->
<div class="sjb_more_content" id="sjb_more_content_<?php echo $post->ID ?>">
    <?php echo get_the_content(); ?>
    <?php //echo get_simple_job_board_template('single-jobpost/job-features.php'); ?>
    <div class="row">
        <div class="job-features">
            <h3>
                <?php echo apply_filters('sjb_job_features_title', esc_html__('Job Features', 'simple-job-board')); ?>
            </h3>
            <?php if (sjb_get_the_job_category()): ?>
                <div class="col-md-12">
                    <div class="sjb-title-value">
                        <h4><i class='fab fa-black-tie' aria-hidden='true'></i><?php echo esc_html__('Job Category', 'simple-job-board') ?></h4>
                        <p><?php echo sjb_the_job_category() ?></p>
                    </div>
                </div>
            <?php endif; ?>
            <?php 
                $enable_feature = get_post_meta(get_the_ID(), 'enable_job_feature', TRUE);
                if($enable_feature == 'jobfeatures' || $enable_feature == ''){
                    $keys = get_post_custom_keys(get_the_ID());
                    if ( $keys != NULL ):
                        foreach ($keys as $key):
                            if (substr($key, 0, 11) == 'jobfeature_') {
                                $val = get_post_meta($post->ID, $key, TRUE);
                                /**
                                 * New Label Index Insertion:
                                 * 
                                 * - Addition of new index "label"
                                 * - Data Legacy Checking  
                                 */
                                $label = isset($val['label']) ? $val['label'] : __(ucwords(str_replace('_', ' ', substr($key, 11))), 'simple-job-board');
                                $value = isset($val['value']) ? $val['value'] : $val;
                                $icon = isset($val['icon']) ? $val['icon'] : "fa fa-briefcase";
                                if ( $value != NULL ) { ?>
                                    <div class="col-md-12">
                                        <div class="sjb-title-value">
                                            <h4>
                                                <i class="<?php echo $icon; ?>" aria-hidden="true"></i>
                                                <?php echo $label; ?>
                                            </h4>
                                            <p>
                                                <?php echo $value; ?>
                                            </p>
                                        </div>
                                    </div>
                                    <?php
                                }
                            }
                        endforeach;
                    endif;
                } ?>
        </div>
    </div>
</div>
<!-- ==================================================
View long content end  -->

<?php

$html = ob_get_clean();

/**
 * Modify the Job Listing -> Short Description Template. 
 *                                       
 * @since   2.3.0
 * 
 * @param   html    $html   Short Description HTML.                   
 */
echo apply_filters( 'sjb_grid_view_long_description_template', $html );