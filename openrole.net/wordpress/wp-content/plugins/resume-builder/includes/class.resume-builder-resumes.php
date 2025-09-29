<?php
/**
 * Resume Builder Recipe-Specific Functions
 *
 * @package     Resume Builder
 * @subpackage  Recipe-Specific Functions
 * @since       2.0.0
*/

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) exit;

class Resume_Builder_Resumes {

	public function __construct() {

		add_filter( 'the_content', array(&$this, 'rb_resume_post_type_template'), 1, 1 );

	}
	
	public static function default_display_settings(){
		$display_settings = [
			'template' => 'default',
			'text_color' => '#000000',
			'highlight_color' => '#2271b1',
			'star_color' => '#ffA500',
			'wrapper_style' => 'full',
			'max_width' => '100',
			'max_width_type' => 'percent',
			'padding' => '0',
			'container_bg' => '#ffffff',
			'container_shadow' => 'false',
			'container_border_radius' => '0',
			'sidebar_position' => 'left',
			'rating_stars' => 'show',
			'photo_size' => '100',
			'attachment_button_text' => __( 'Download Attachment', 'resume-builder' ),
		];
		return $display_settings;
	}

	public function rb_resume_post_type_template( $content ){

		global $post;

		if( is_singular('rb_resume') ):
			return do_shortcode( '[rb-resume id="' . esc_attr( $post->ID ) .'"]' );
		endif;

		return $content;

	}

	public static function get( $args = false ) {

		$resumes = array();
		$counter = 0;

		if (!$args):

			$args = array(
				'post_type' => 'rb_resume',
				'posts_per_page' => -1,
				'post_status' => 'publish',
				'orderby'=>'name',
				'order'=>'ASC'
			);

		endif;

		$resumes_results = new WP_Query($args);
		if ( $resumes_results->have_posts() ):
			while ( $resumes_results->have_posts() ): $resumes_results->the_post();

				$resumes[$counter]['id'] = $resumes_results->post->ID;
				$resumes[$counter]['title'] = $resumes_results->post->post_title;

				$resume_settings = get_post_meta( $resumes_results->post->ID, '_resume_settings', true);

				if ( empty($resume_settings) )
					continue;
					
				if ( !isset($resume_settings['resume_file']) ):
					$resume_settings['resume_file'] = '';
				endif;

				foreach($resume_settings as $key => $setting):
					$resumes[$counter][$key] = $setting;
				endforeach;
				
				// Check Resume Settings
				if ( !isset($resumes[$counter]['display']) || isset($resumes[$counter]['display']) && empty($resumes[$counter]['display']) ):
					$resumes[$counter]['display'] = Resume_Builder_Resumes::default_display_settings();
				endif;

				$counter++;

			endwhile;
		endif;

		wp_reset_postdata();

		return $resumes;

	}

	public static function get_by_slug($slug = false){
		if ($slug):

			if (!function_exists('ctype_digit') || function_exists('ctype_digit') && !ctype_digit($slug)):
				$resume_query = new WP_Query( array( 'name' => $slug, 'post_type' => 'rb_resume' ) );
				if ($resume_query->have_posts()):
					$resume_query->the_post();
					return get_the_ID();
				else:
					return false;
				endif;
			else:
				return $slug;
			endif;

		else:

			return false;

		endif;
	}

	public static function rating( $rating = false ){

		if ( !$rating )
			return false;

		ob_start();

		$hs = '<div class="rb-rating-star-half"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4.75L13.75 10.25H19.25L14.75 13.75L16.25 19.25L12 15.75L7.75 19.25L9.25 13.75L4.75 10.25H10.25L12 4.75Z" stroke="#141414" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>';
		$fs = '<div class="rb-rating-star-whole"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4.75L13.75 10.25H19.25L14.75 13.75L16.25 19.25L12 15.75L7.75 19.25L9.25 13.75L4.75 10.25H10.25L12 4.75Z" stroke="#141414" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>';
		
		switch ( $rating ):
			case 1:
				$star_html = $hs;
			break;
			case 2:
				$star_html = $fs;
			break;
			case 3:
				$star_html = $fs . $hs;
			break;
			case 4:
				$star_html = $fs . $fs ;
			break;
			case 5:
				$star_html = $fs . $fs . $hs;
			break;
			case 6:
				$star_html = $fs . $fs . $fs;
			break;
			case 7:
				$star_html = $fs . $fs . $fs . $hs;
			break;
			case 8:
				$star_html = $fs . $fs . $fs . $fs;
			break;
			case 9:
				$star_html = $fs . $fs . $fs . $fs . $hs;
			break;
			case 10:
				$star_html = $fs . $fs . $fs . $fs . $fs;
			break;
		endswitch;
		
		echo wp_kses(
			$star_html,
			[
				'div' => ['class' => []],
				'svg' => ['width' => [],'height' => [],'viewBox' => [],'fill' => [],'xmlns' => []],
				'path' => ['d' => [],'stroke' => [],'stroke-width' => [],'stroke-linecap' => [],'stroke-linejoin' => []]
			]
		);

		return ob_get_clean();

	}

}

global $Resume_Builder_Resumes;
$Resume_Builder_Resumes = new Resume_Builder_Resumes();
