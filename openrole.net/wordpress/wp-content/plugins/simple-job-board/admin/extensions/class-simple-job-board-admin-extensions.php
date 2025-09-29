<?php
/**
 * Simple_Job_Board_Addons_Extensions Class
 * 
 * This class is responsible to get the
 * Addons from remote server
 *
 * @link       https://wordpress.org/plugins/simple-job-board
 * @since      2.10.6
 * 
 * @package    Simple_Job_Board
 * @subpackage Simple_Job_Board/admin
 * @author     PressTigers <support@presstigers.com>
 */
class Simple_Job_Board_Addons_Extensions {
    
    /**
     * Return self
     */
    protected static $extension = false;

    private static $remote_url = "https://market.presstigers.com/wp-json/sjb/v1/addons";

    public $extensions = NULL;
    
    private function __construct() {
        $this->init();
    }

    /**
     * Singleton instance of Extensions Object
     */
    public static function instance() {
        if( ! self::$extension ) {
            
            self::$extension = new self;
        }

        return self::$extension;
    }


    /**
     * Initial Setup
     *
     * @return array
     */
    public function init() {
        if( false === ( $extensions = get_transient( 'sjb_addons_extensions' ) ) ) {
            $extensions = $this->request();
            set_transient( 'sjb_addons_extensions', $extensions, DAY_IN_SECONDS );
        }
        $this->extensions = $extensions;
    }
    
    /**
     * Returns all columns
     *
     * @return array
     */
    public function extensions() {
       return ( is_array( $this->extensions ) && ! empty( $this->extensions ) ) 
            ? $this->extensions 
            : new WP_Error( "Extension API error" );
    }

    
    /**
     * Returns the slug column from extensions array
     *
     * @return array
     */
    public function slugs() {
        return array_column( $this->extensions, 'slug' );
    }

    /**
     * Returns the basename column from extensions array
     *
     * @return array
     */
    public function basenames() {
        return array_column( $this->extensions, 'basename' );
    }

    /**
     * Get extensions information from API
     *
     * @return array
     */
    public function request() {
        $response = wp_remote_get( self::$remote_url, array(
            'timeout' => 10,
            'headers' => array(
                'Accept' => 'application/json'
            ))
        );
        $response_code = wp_remote_retrieve_response_code( $response );
        $response_body = json_decode( wp_remote_retrieve_body( $response ) );
        
        return $response_body->data;
    }
}