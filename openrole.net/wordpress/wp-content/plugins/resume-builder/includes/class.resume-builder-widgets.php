<?php
/**
 * Widgets
 *
 * @package     Resume Builder
 * @subpackage  Widgets
 * @since       1.0.0
*/

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) exit;

require_once 'widgets/resume.php';

class Resume_Builder_Widgets {

	public function __construct() {
		add_action( 'widgets_init', array(&$this, 'register_widgets'), 10, 1 );
	}

	public function register_widgets() {
		$widgets = apply_filters( 'Resume_Builder_widgets', array(
			'Resume_Builder_Widget_Resume',
		));
		if ( !empty($widgets) ):
			foreach( $widgets as $widget ):
				register_widget( $widget );
			endforeach;
		endif;
	}

}
