<?php

add_action( 'rest_api_init', 'rb_api_meta' );
function rb_api_meta()
{
    
    register_rest_field(
        'search-result',
        'resume_settings',
        array(
            'get_callback' => 'rb_get_post_meta_for_api',
            'schema'       => null,
        )
    );
    register_rest_field(
        'search-result',
        'resume_image',
        array(
            'get_callback' => 'rb_get_featured_image_for_api',
            'schema'       => null,
        )
    );
    register_rest_field(
        'search-result',
        'resume_file',
        array(
           'get_callback'    => 'rb_get_file_for_api',
           'schema'          => null,
        )
    );
    
    register_rest_field(
        'rb_resume',
        'resume_settings',
        array(
           'get_callback'    => 'rb_get_post_meta_for_api',
           'schema'          => null,
        )
    );
    register_rest_field(
        'rb_resume',
        'resume_image',
        array(
           'get_callback'    => 'rb_get_featured_image_for_api',
           'schema'          => null,
        )
    );
    register_rest_field(
        'rb_resume',
        'resume_file',
        array(
           'get_callback'    => 'rb_get_file_for_api',
           'schema'          => null,
        )
    );
    
    
}
 
function rb_get_post_meta_for_api($object)
{
    $post_id = $object['id'];
    $resume_meta = get_post_meta($post_id, '_resume_settings', true);
    $resume_meta['title'] = ( isset( $object['title']['raw'] ) ? $object['title']['raw'] : ( isset( $object['title'] ) ? $object['title'] : '' ) );
    if ( !isset( $resume_meta['skills'] ) ):
        $resume_meta['skills'] = [];
    endif;
    if ( !isset( $resume_meta['experience'] ) ):
        $resume_meta['experience'] = [];
    endif;
    if ( !isset($resume_meta['display']) || isset($resume_meta['display']) && empty($resume_meta['display']) ):
        $resume_meta['display'] = Resume_Builder_Resumes::default_display_settings();
    endif;
    
    if ( !isset( $resume_meta['display']['attachment_button_text'] ) ):
        $resume_meta['display']['attachment_button_text'] = __( 'Download Attachment', 'resume-builder' );
    endif;
    
    return $resume_meta;
}
 
function rb_get_featured_image_for_api($object)
{
    $post_id = $object['id'];
    return get_the_post_thumbnail_url($post_id, 'large');
}

function rb_get_file_for_api($object)
{
    $post_id = $object['id'];
    $resume_meta = get_post_meta($post_id, '_resume_settings', true);
    return $resume_meta['resume_file'];
}
