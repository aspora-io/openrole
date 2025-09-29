<?php
defined( 'ABSPATH' ) || exit;   //  prevent direct access

/**
 * Used to prepare date to string
 * 
 * @param string $date
 * @return string
 */
if( !function_exists('sjb_date_str') ){
    function sjb_date_str($date) {    
        $date_format = get_option('sjb_date_format') ? esc_html(get_option('sjb_date_format')) : 'm-d-Y';
        $raw_date = sanitize_text_field($date);
        $timezone = wp_timezone();
        $date_obj = DateTime::createFromFormat($date_format, $raw_date, $timezone);
        $errors = DateTime::getLastErrors();    
        if (
            $date_obj &&
            (int) ($errors['warning_count'] ?? 0) === 0 &&
            (int) ($errors['error_count'] ?? 0) === 0
        ) {
                return $date_obj->setTime(0, 0, 0)->getTimestamp();
        }
        return '';
    }
}

/**
 * get date format from settings of Simple Job Board
 * 
 * @param boolean $for_js   if date format to be used in JS code
 * @param string $fallback  date format if not set in settings
 * @return string   date format
 */
if( !function_exists('sjb_get_date_format') ){ 
    function sjb_get_date_format($for_js = false, $fallback = 'm-d-Y'){
        $date_format = get_option('sjb_date_format') ? esc_html(get_option('sjb_date_format')) : esc_html__($fallback, 'simple-job-board');
        return ( $for_js === true ) ? sjb_date_format_js($date_format) : $date_format;
    }
}

/**
* Convert PHP date format into JS
* 
* @param string $format    PHP date format
* @return string   JS date format
*/
if( !function_exists('sjb_date_format_js') ){    
    function sjb_date_format_js($format){
        $replacements = array(
            // Day
            'd' => 'dd',
            'j' => 'd',

            // Month
            'm' => 'mm',
            'n' => 'm',
            'F' => 'MM',
            'M' => 'M',

            // Year
            'Y' => 'yy',
            'y' => 'y',
        );

        return strtr($format, $replacements);
    }
}