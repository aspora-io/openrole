<?php
/**
 * Admin Enqueues
 *
 * @package     Resume Builder
 * @subpackage  Enqueues
 * @since       2.0.0
*/

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Resume_Builder_Post_Types Class
 *
 * This class handles the post type creation.
 *
 * @since 3.0.0
 */
class Resume_Builder_Enqueues {

    function __construct() {
    	add_action( 'wp_enqueue_scripts', array(&$this, 'enqueues'), 10, 1 );
    }
    
    public function enqueues( $hook ) {
        wp_enqueue_style('rbuilder-styling', RBUILDER_URL . 'dist/main.css', array(), RBUILDER_VERSION);
    }

}
