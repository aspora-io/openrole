<?php 

class Simple_Job_Board_Addon_Options {

    public function __construct() {

        /**
         * Add add-on options to the database upon plugin activation
         * It will get all the add-on information from the marketplace and 
         * store it to the options table for future use
         */
        add_action( "activated_plugin", array( $this, 'add_options' ), 10, 2 );

    }

    public function add_options( $plugin, $network_activation ) {
        
        $extensions = Simple_Job_Board_Addons_Extensions::instance()->extensions();

        foreach( $extensions as $ext ) {

            if( $plugin != $ext->basename ) {
                continue;
            }
            $options = array(
                'installation_time' => date("m-d-Y H:i:s A", time()),
                'status'            => 0,
            );
        
            if( 'not-exists' === get_option( $ext->option, 'not-exists' ) ) {
                update_option( $ext->option, $options );
            }
            
        }
    }
}

new Simple_Job_Board_Addon_Options();