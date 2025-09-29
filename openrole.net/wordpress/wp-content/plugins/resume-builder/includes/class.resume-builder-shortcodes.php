<?php
/**
 * Resume Builder Shortcodes
 *
 * @package     Resume Builder
 * @subpackage  Shortcodes
 * @since       2.0.0
*/

// Exit if accessed directly
if ( !defined( 'ABSPATH' ) ) exit;

class Resume_Builder_Shortcodes {

    function __construct(){

        // Main Shortcode
        add_shortcode('rb-resume', array($this, 'resume_shortcode') );
        
        // Backwards Compatibility
        add_shortcode('rb-resume-full', array($this, 'resume_shortcode') );
        
        // Partial Shortcodes
        add_shortcode( 'rb-resume-header', array($this, 'resume_header_shortcode') );
        add_shortcode( 'rb-resume-contact', array($this, 'resume_contact_shortcode') );
        add_shortcode( 'rb-resume-introduction', array($this, 'resume_introduction_shortcode') );
        add_shortcode( 'rb-resume-history', array($this, 'resume_history_shortcode') );
        add_shortcode( 'rb-resume-skills', array($this, 'resume_skills_shortcode') );

    }
    
    public function get_resume( $resume_id ){
        $resume = Resume_Builder_Resumes::get( [ 'post_type' => 'rb_resume', 'post_status' => 'publish', 'post__in' => array( $resume_id ) ] );
        return ( isset( $resume[0] ) ? $resume[0] : $resume );
    }

    public function get_resume_part( $atts = false, $part = false ){
        
        global $resume, $compact;
        
        // Options
        $options = shortcode_atts( array( 'id' => false, 'style' => false ), $atts );
        
        // A Resume ID is required.
        if ( !$options['id'] )
            return false;
            
        $resume_id = esc_html( $options['id'] );     
        $resume = $this->get_resume( $resume_id );
        $compact = ( $options['style'] == 'compact' ? true : false );
        
        ob_start();
        
        if ( !$resume || $resume && empty( $resume ) ):
            return false;
        else:
            load_template( RBUILDER_DIR . 'templates/front/parts/' . $part . '.php', false );
        endif;
        
        return ob_get_clean();
        
    }

    public function resume_header_shortcode( $atts, $content = null ){  
        return $this->get_resume_part( $atts, 'header' ); 
    }
    
    public function resume_contact_shortcode( $atts, $content = null ){  
        return $this->get_resume_part( $atts, 'contact' ); 
    }
    
    public function resume_introduction_shortcode( $atts, $content = null ){  
        return $this->get_resume_part( $atts, 'introduction' ); 
    }
    
    public function resume_history_shortcode( $atts, $content = null ){  
        return $this->get_resume_part( $atts, 'history' ); 
    }
    
    public function resume_skills_shortcode( $atts, $content = null ){  
        return $this->get_resume_part( $atts, 'skills' ); 
    }

    public function resume_shortcode( $atts, $content = null ){

        // Shortcode Attributes
        $options = shortcode_atts(
            array(
                'id' => false,
                'section' => false, // Backwards compatibility
                'style' => false,
            ), $atts
        );

        // A Resume ID is required.
        if ( !$options['id'] )
            return false;
            
        $compact = ( $options['style'] == 'compact' ? true : false );
        $resume_id = esc_html( $options['id'] );
        $resume = $this->get_resume( $resume_id );
        
        // Resume doesn't exist?
        if ( empty( $resume ) )
            return false;
        
        $opts = ( isset( $resume['display'] ) ? $resume['display'] : Resume_Builder_Resumes::default_display_settings() );
        
        // Backwards compatibility
        $resume_section = esc_html( $options['section'] );
        if ( $resume_section == 'intro' ):
            ob_start();
            echo do_shortcode( '[rb-resume-header id="' . $resume_id . '"' . ( $compact ? ' style="compact"' : '' ) . ']' );
            echo do_shortcode( '[rb-resume-contact id="' . $resume_id . '"' . ( $compact ? ' style="compact"' : '' ) . ']' );
            echo do_shortcode( '[rb-resume-introduction id="' . $resume_id . '"' . ( $compact ? ' style="compact"' : '' ) . ']' );
            return ob_get_clean();
        elseif ( $resume_section ):
            return do_shortcode( '[rb-resume-' . $resume_section . ' id="' . $resume_id . '"' . ( $compact ? ' style="compact"' : '' ) . ']' );
        endif;
        
        ob_start();
        
        $rand_rbt = wp_rand( 100,999 );
        $border_rgb = Resume_Builder_Functions::hex_to_rgb( $opts['text_color'] );

        ?><style type="text/css">
            <?php if ( $opts['max_width'] ):
                echo '#resume-' . esc_html( $rand_rbt ); ?>.rb-template-container { max-width: <?php echo esc_html( $opts['max_width'] ) . ( $opts['max_width_type'] == 'pixels' ? 'px' : '%' ); ?> !important; margin-left: auto; margin-right: auto; }<?php
            endif; ?>
            <?php echo '#resume-' . esc_html( $rand_rbt ); ?> .rbt-header-wrapper { border-color: <?php echo esc_attr( 'rgba( ' . $border_rgb['r'] . ', ' . $border_rgb['g'] . ', ' . $border_rgb['b'] . ', 0.2 );' ); ?> }
            <?php if ( $opts['wrapper_style'] == 'contained' && $opts['container_bg'] ):
                echo '#resume-' . esc_html( $rand_rbt ); ?>.rb-template-container { background: <?php echo esc_html( $opts['container_bg'] ); ?> !important; box-sizing: border-box; padding: <?php echo esc_html( $opts['padding'] ); ?>px !important; }<?php
            else:
                echo '#resume-' . esc_html( $rand_rbt ); ?>.rb-template-container { background: transparent !important; box-sizing: border-box; padding: 0 !important; }<?php
            endif; ?>
            <?php if ( $opts['wrapper_style'] == 'contained' && $opts['container_shadow'] == 'true' ):
                echo '#resume-' . esc_html( $rand_rbt ); ?>.rb-template-container { box-shadow: 0 30px 50px -30px rgba(0, 0, 0, 0.4) !important; }<?php
            endif; ?>
            <?php if ( $opts['wrapper_style'] == 'contained' && $opts['container_border_radius'] ):
                echo '#resume-' . esc_html( $rand_rbt ); ?>.rb-template-container { border-radius: <?php echo esc_html( $opts['container_border_radius'] ); ?>px !important; }<?php
            endif; ?>
            <?php if ( $opts['sidebar_position'] == 'right' ):
                echo '#resume-' . esc_html( $rand_rbt ); ?>.rb-template-container .rbt-body { flex-direction: row-reverse; }<?php
            endif; ?>
            @media screen and (max-width: 900px) {
                <?php echo '#resume-' . esc_html( $rand_rbt ); ?>.rb-template-container {
                    padding:45px !important;
                }
            }
        </style><?php
        
        ?><section id="<?php echo 'resume-' . esc_attr( $rand_rbt ); ?>" class="rb-template-container<?php echo ( $compact ? ' rb-compact' : '' ); ?>"><?php
            ?><div class="rb-template-default"><?php
                
                ?><div class="rbt-header-wrapper"><?php
                    echo do_shortcode( '[rb-resume-header id="' . $resume_id . '"]' );
                    echo do_shortcode( '[rb-resume-contact id="' . $resume_id . '"]' );
                ?></div><?php
                ?><div class="rbt-body"><?php
                    if ( isset( $resume['skills'] ) ):
                        ?><div class="rbt-column small"><?php
                            echo do_shortcode( '[rb-resume-skills id="' . $resume_id . '"]' );
                        ?></div><?php
                    endif;
                    ?><div class="rbt-column <?php echo ( isset( $resume['skills'] ) ? 'large' : 'full' ); ?>"><?php
                        echo do_shortcode( '[rb-resume-introduction id="' . $resume_id . '"]' );
                        echo do_shortcode( '[rb-resume-history id="' . $resume_id . '"]' );
                    ?></div><?php
                ?></div><?php
                
            ?></div><?php
        ?></section><?php
        
        return ob_get_clean();

    }

}
