<?php
/**
 * The template for displaying job description in list view
 *
 * Override this template by copying it to yourtheme/simple_job_board/v2/listing/list-view/long-description.php
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
    <?php echo get_simple_job_board_template('single-jobpost/job-features.php'); ?>
</div>

<div class="sjb-view-less-btn" id="sjb_view_less_btn_<?php echo $post->ID; ?>">
    <a data-id="<?php echo $post->ID; ?>" class="sjb_view_less_btn sjb_view_more_btn">
        <?php echo esc_html__('View less', 'simple-job-board'); ?>            
    </a>
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
echo apply_filters('sjb_list_view_long_description_template', $html);
