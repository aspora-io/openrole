<?php
/**
 * Template for displaying searh button
 *
 * Override this template by copying it to yourtheme/simple_job_board/v1/search/search-btn.php
 *
 * @author 	PressTigers
 * @package     Simple_Job_Board
 * @subpackage  Simple_Job_Board/templates/search
 * @version     1.0.0
 * @since       2.2.3
 * @since       2.3.0   Added "sjb_job_tag_template" filter.
 * @since       2.4.0   Revised whole HTML structure
 */
ob_start();

$_selected_tags = (!empty($_GET['selected_tag']) ) ? sanitize_text_field($_GET['selected_tag']) : '';
$selected_tags = explode(",", $_selected_tags);

// Search Button 
$terms = get_terms(array(
    'taxonomy' => 'jobpost_tag',
        ));
if ($terms) {
    ?>
    <div class="col-md-12 sjb-filter-tags form-group">
        <div class="sjb-selected-tags">
            <p> <?php echo __('Search by tag:', 'simple-job-board') ?></p>
            <input type="hidden" name="selected_tag" id="selected_tag" value="<?php echo esc_attr($_selected_tags);?>">
        </div>
        <div class="sjb-tag-listing">
            <?php
            foreach ($terms as $term) {
                 $active_class = '';
                if (in_array($term->name, $selected_tags)) {
                    $active_class = 'tag-active';
                }
                ?>
            <a href="#" class="<?php echo apply_filters('sjb_tags_search_class', 'sjb-tags-search') . ' ' . $active_class; ?>" data-value="<?php echo esc_attr($term->name); ?>"><?php echo esc_attr($term->name); ?></a>   
                <?php
            }
            ?> 
        </div> 
    </div>
    <?php
}

$html_job_tag = ob_get_clean();

/**
 * Modify the Job Tag Template. 
 *                                       
 * @since   2.3.0
 * 
 * @param   html    $html_job_tag   Job Tag HTML.                   
 */
echo apply_filters('sjb_job_tag_template', $html_job_tag);