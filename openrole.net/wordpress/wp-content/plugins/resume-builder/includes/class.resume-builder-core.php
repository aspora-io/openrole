<?php
/**
 * Post Types
 *
 * @package     Resume Builder
 * @subpackage  Builder Functions
 * @since       3.0.0
*/

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) exit;

class Resume_Builder_Core {

	function __construct() {
        
        add_action( 'wp_ajax_rb_save_resume', array(&$this, 'save_resume'), 10, 1);
        add_action( 'wp_ajax_rb_trash_resume', array(&$this, 'trash_resume'), 10, 1);
        add_action( 'wp_ajax_rb_untrash_resume', array(&$this, 'untrash_resume'), 10, 1);
        add_action( 'wp_ajax_rb_delete_resume', array(&$this, 'delete_resume'), 10, 1);
        add_action( 'wp_ajax_rb_duplicate_resume', array(&$this, 'duplicate_resume'), 10, 1);
        
	}
    
    public function trash_resume(){
        
        if ( isset( $_POST['resume_id'], $_POST['rb_edit_resumes_nonce'] ) && wp_verify_nonce( sanitize_key( $_POST['rb_edit_resumes_nonce'] ), 'rb_edit_resumes' ) ) {
            
            $resume_id = sanitize_text_field( wp_unslash( $_POST['resume_id'] ) );
            wp_trash_post( $resume_id );
            return true;
        
        } else {
            return false;
        }
        
    }
    
    public function duplicate_resume(){
        
        if ( isset( $_POST['resume_id'], $_POST['rb_edit_resumes_nonce'] ) && wp_verify_nonce( sanitize_key( $_POST['rb_edit_resumes_nonce'] ), 'rb_edit_resumes' ) ) {
            
            $resume_id = sanitize_text_field( wp_unslash( $_POST['resume_id'] ) );
            
            $title = get_the_title($resume_id);
            $old_resume = get_post($resume_id);
            
            $resume = array(
              'post_title' => $title . ' (' . esc_html__('copy', 'resume-builder') . ')',
              'post_status' => 'publish',
              'post_type' => $old_resume->post_type,
              'post_author' => $old_resume->post_author
            );
            
            $new_resume_id = wp_insert_post( $resume );
            
            // update the post slug
            wp_update_post( array(
                'ID' => $new_resume_id,
                'post_name' => sanitize_title_with_dashes( $title )
            ));
            
            $old_resume_meta = get_post_meta( $resume_id, '_resume_settings', true );
            $old_resume_photo = get_post_thumbnail_id( $resume_id );
            
            add_post_meta( $new_resume_id, '_resume_settings', $old_resume_meta );
            set_post_thumbnail( $new_resume_id, $old_resume_photo );
        
            return $new_post_id;
            
        } else {
            return false;
        }
        
    }
    
    public function delete_resume(){
        
        if ( isset( $_POST['resume_id'], $_POST['rb_edit_resumes_nonce'] ) && wp_verify_nonce( sanitize_key( $_POST['rb_edit_resumes_nonce'] ), 'rb_edit_resumes' ) ) {
            
            $resume_id = sanitize_text_field( wp_unslash( $_POST['resume_id'] ) );
            wp_delete_post( $resume_id, true );
            return true;
            
        } else {
            return false;
        }
        
    }
    
    public function untrash_resume(){
        
        if ( isset( $_POST['resume_id'], $_POST['rb_edit_resumes_nonce'] ) && wp_verify_nonce( sanitize_key( $_POST['rb_edit_resumes_nonce'] ), 'rb_edit_resumes' ) ) {
            
            $resume_id = sanitize_text_field( wp_unslash( $_POST['resume_id'] ) );
            wp_publish_post( $resume_id );
            return true;
            
        } else {
            return false;
        }
        
    }
    
    public function save_resume(){
        
        if ( isset( $_POST['resume_id'], $_POST['resume_data'], $_POST['rb_edit_resumes_nonce'] ) && wp_verify_nonce( sanitize_key( $_POST['rb_edit_resumes_nonce'] ), 'rb_edit_resumes' ) ) {
        
            $resume_id = sanitize_text_field( wp_unslash( $_POST['resume_id'] ) );
            $resume_data = json_decode( stripslashes( $_POST['resume_data'] ) );
            $resume_name = ( isset( $resume_data->name ) ? esc_html( $resume_data->name ) : '' );
            $resume_file = ( isset( $resume_data->resume_file ) ? esc_html( $resume_data->resume_file ) : '' );
            $featured_image = ( isset( $resume_data->featured_image ) ? esc_html( $resume_data->featured_image ) : '' );
            $featured_image_url = ( isset( $resume_data->featured_image_url ) ? esc_html( $resume_data->featured_image_url ) : '' );
            $resume_settings = [
                'introduction' => [
                    'subtitle' => ( isset( $resume_data->introduction->subtitle ) ? $resume_data->introduction->subtitle : '' ),
                    'content' => ( isset( $resume_data->introduction->content ) ? $resume_data->introduction->content : '' ),
                ],
                'contact' => [
                    'email' => ( isset( $resume_data->contact->email ) ? $resume_data->contact->email : '' ),
                    'phone' => ( isset( $resume_data->contact->phone ) ? $resume_data->contact->phone : '' ),
                    'website' => ( isset( $resume_data->contact->website ) ? $resume_data->contact->website : '' ),
                    'address' => ( isset( $resume_data->contact->address ) ? $resume_data->contact->address : '' ),
                ],
            ];
            
            if ( $resume_file ){
                $resume_settings['resume_file'] = $resume_file;
            } else {
                $resume_settings['resume_file'] = '';
            }
            
            if ( isset( $resume_data->display ) ):
                foreach( $resume_data->display as $key => $display_setting ):
                    $resume_settings['display'][$key] = $display_setting;
                endforeach;
            endif;
            
            if ( isset( $resume_data->experience ) ):
    
                foreach ( $resume_data->experience as $exp ):
                    if ( isset( $exp->section_heading_name ) ):
                        $resume_settings['experience'][] = [
                            'section_heading_name' => $exp->section_heading_name
                        ];
                    elseif ( isset( $exp->section_text_content ) ):
                        $resume_settings['experience'][] = [
                            'section_text_content' => $exp->section_text_content
                        ];
                    elseif ( isset( $exp->title ) ):
                        $resume_settings['experience'][] = [
                            'date_range' => $exp->date_range,
                            'title' => $exp->title,
                            'short_description' => $exp->short_description,
                            'long_description' => $exp->long_description
                        ];
                    endif;
                endforeach;
                
            else:
                $resume_settings['experience'] = [];
            endif;
            
            if ( isset( $resume_data->skills ) ):
            
                foreach ( $resume_data->skills as $skl ):
                    if ( isset( $skl->section_heading_name ) ):
                        $resume_settings['skills'][] = [
                            'section_heading_name' => $skl->section_heading_name
                        ];
                    elseif ( isset( $skl->title ) ):
                        $resume_settings['skills'][] = [
                            'title' => $skl->title,
                            'rating' => $skl->rating,
                            'description' => $skl->description
                        ];
                    endif;
                endforeach;
                
            else:
                $resume_settings['skills'] = [];
            endif;
            
            // Cleanup Meta Fields
            $resume_settings = self::meta_cleanup( $resume_settings );
            
            // Is this a New Resume?
            if ( !$resume_id || $resume_id === 'undefined' ):
                $resume_arr = array(
                    'post_type'     => 'rb_resume',
                    'post_title'    => $resume_name,
                    'post_status'   => 'publish',
                    'post_author'   => get_current_user_id(),
                );
                $resume_id = wp_insert_post( $resume_arr, false );
            else:
                // Update Resume Title (Name)
                $resume = array( 'ID' => $resume_id, 'post_title' => $resume_name );
                wp_update_post( $resume );
            endif;
            
            // update the post slug
            wp_update_post( array(
                'ID' => $resume_id,
                'post_name' => sanitize_title_with_dashes( $resume_name )
            ));
            
            // Update Featured Image?
            if ( !$featured_image_url ):
                delete_post_thumbnail( $resume_id );
            elseif ( $featured_image ):
                set_post_thumbnail( $resume_id, $featured_image );
            endif;
            
            // Update Meta Fields
            update_post_meta( $resume_id, '_resume_settings', $resume_settings );
            
            echo esc_html( $resume_id );
            exit;
            
        } else {
            return false;
        }
    }

    public static function meta_cleanup( $resume_settings ){
        
        $resume_excerpt = '';

        if (!empty($resume_settings)):
            foreach($resume_settings as $key => $val):
                if (!is_array($val)):
                    $resume_settings[$key] = sanitize_text_field($val);
                else:
                    foreach($val as $subkey => $subval):
                        if (!is_array($subval)):

                            if ($key === 'introduction' && $subkey == 'content'):
                                $resume_settings[$key][$subkey] = wp_kses_post( $subval );
                            elseif ($key === 'contact' && $subkey == 'address'):
                                $resume_settings[$key][$subkey] = wp_kses_post( $subval );
                            else:
                                $resume_settings[$key][$subkey] = sanitize_text_field($subval);
                            endif;

                        else:
                            foreach($subval as $sub_subkey => $sub_subval):
                                if (!is_array($sub_subval)):
                                    if ( $key === 'experience' && $sub_subkey == 'long_description' ):
                                        $resume_settings[$key][$subkey][$sub_subkey] = wp_kses_post( $sub_subval );
                                    elseif ( $key === 'experience' && $sub_subkey == 'section_text_content' ):
                                        $resume_settings[$key][$subkey][$sub_subkey] = wp_kses_post( $sub_subval );
                                    elseif ( $key === 'skills' && $sub_subkey == 'description' ):
                                        $resume_settings[$key][$subkey][$sub_subkey] = wp_kses_post( $sub_subval );
                                    else:
                                        $resume_settings[$key][$subkey][$sub_subkey] = sanitize_text_field($sub_subval);
                                    endif;
                                endif;
                            endforeach;
                        endif;
                    endforeach;
                endif;
            endforeach;
        endif;

        return $resume_settings;

    }

}