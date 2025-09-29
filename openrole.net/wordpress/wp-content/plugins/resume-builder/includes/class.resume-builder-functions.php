<?php
/**
 * Misc Functions
 *
 * @package     Resume Builder
 * @subpackage  Misc Functions
 * @since       1.0.0
*/

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) exit;

class Resume_Builder_Functions {
    
    public static function hex_to_rgb( $hex ){
        $hex      = str_replace('#', '', $hex);
        $length   = strlen($hex);
        $rgb['r'] = hexdec($length == 6 ? substr($hex, 0, 2) : ($length == 3 ? str_repeat(substr($hex, 0, 1), 2) : 0));
        $rgb['g'] = hexdec($length == 6 ? substr($hex, 2, 2) : ($length == 3 ? str_repeat(substr($hex, 1, 1), 2) : 0));
        $rgb['b'] = hexdec($length == 6 ? substr($hex, 4, 2) : ($length == 3 ? str_repeat(substr($hex, 2, 1), 2) : 0));
        return $rgb;
    }

    public static function parse_readme_changelog( $readme_url = false, $title = false ){

        ob_start();
        $readme_url = ( !$readme_url ? RBUILDER_DIR . 'readme.txt' : $readme_url );
        include( $readme_url );
        $readme = ob_get_clean();
        
        $readme = make_clickable(esc_html($readme));
        $readme = preg_replace( '/`(.*?)`/', '<code>\\1</code>', $readme);

        $readme = explode( '== Changelog ==', $readme );
        $readme = explode( '== Upgrade Notice ==', $readme[1] );
        $readme = $readme[0];

        $readme = preg_replace( '/\*\*(.*?)\*\*/', '<strong>\\1</strong>', $readme);
        $readme = preg_replace( '/\*(.*?)\*/', '<em>\\1</em>', $readme);

        $whats_new_title = '<h3>' . ( $title ? esc_html( $title ) : apply_filters( 'rbuilder_whats_new_title', esc_html__( "What's new?", "resume-builder" ) ) ) . '</h3>';
        $readme = preg_replace('/= (.*?) =/', $whats_new_title, $readme);
        $readme = preg_replace("/\*+(.*)?/i","<ul class='rbuilder-whatsnew-list'><li>$1</li></ul>",$readme);
        $readme = preg_replace("/(\<\/ul\>\n(.*)\<ul class=\'rbuilder-whatsnew-list\'\>*)+/","",$readme);
        $readme = explode( $whats_new_title, $readme );
        $readme = $whats_new_title . $readme[1];
        return $readme;

    }

}
