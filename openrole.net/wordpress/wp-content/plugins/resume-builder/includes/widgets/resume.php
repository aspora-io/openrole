<?php

class Resume_Builder_Widget_Resume extends WP_Widget {

    public function __construct() {
        $widget_ops = array(
            'classname' => 'resume_builder_widget_resume',
            'description' => 'Display a specific resume section.',
        );
        parent::__construct( 'resume_builder_widget_resume', 'Resume Builder', $widget_ops );
    }

    public function widget( $args, $instance ) {

        echo wp_kses_post( $args['before_widget'] );
        if ( ! empty( $instance['title'] ) ) {
            echo wp_kses_post( $args['before_title'] . apply_filters( 'widget_title', $instance['title'] ) . $args['after_title'] );
        }
        $id = ( isset($instance['id']) ? ' id="' . esc_attr( $instance['id'] ) . '"' : '' );
        $style = ( isset($instance['style']) ? ' style="' . esc_attr( $instance['style'] ) . '"' : '' );
        $section = ( isset($instance['section']) ? ' section="' . esc_attr( $instance['section'] ) . '"' : '' );
        echo do_shortcode( '[rb-resume' . $id . $style . $section . ']' );
        echo wp_kses_post( $args['after_widget'] );

    }

    public function form( $instance ) {

        $title = ( !empty( $instance['title'] ) ? $instance['title'] : false );
        $id = ( isset( $instance['id'] ) ? $instance['id'] : false );
        $style = ( isset( $instance['style'] ) ? $instance['style'] : 'compact' );
        $section = ( isset( $instance['section'] ) ? $instance['section'] : 'full' );

        ?>

        <p>
        <label for="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>"><?php esc_attr_e( 'Title (optional):', 'resume-builder' ); ?></label>
        <input class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'title' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'title' ) ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>">
        </p>

        <?php

        // Get Resumes
        $resumes = Resume_Builder_Resumes::get();

        ?>

        <p>
        <label for="<?php echo esc_attr( $this->get_field_id( 'id' ) ); ?>"><?php esc_attr_e( 'Resume:', 'resume-builder' ); ?></label>
        <select class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'id' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'id' ) ); ?>">
            <?php if ( isset( $resumes['id'] ) ):
                ?><option value="<?php echo esc_attr( $resumes['id'] ); ?>"<?php echo ( $id == $resumes['id'] ? ' selected' : '' ); ?>><?php echo esc_attr( $resumes['title'] ); ?></option><?php
            else:
                foreach( $resumes as $r ):
                    ?><option value="<?php echo esc_attr( $r['id'] ); ?>"<?php echo ( $id == $r['id'] ? ' selected' : '' ); ?>><?php echo esc_attr( $r['title'] ); ?></option><?php
                endforeach;
            endif; ?>
        </select>
        </p>

        <p>
        <label for="<?php echo esc_attr( $this->get_field_id( 'section' ) ); ?>"><?php esc_attr_e( 'Section(s):', 'resume-builder' ); ?></label>
        <select class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'section' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'section' ) ); ?>">
            <option value="full"<?php echo ( $section == 'full' ? ' selected' : '' ); ?>><?php esc_html_e( 'Full Resume', 'resume-builder' ); ?></option>
            <option value="header"<?php echo ( $section == 'header' ? ' selected' : '' ); ?>><?php esc_html_e( 'Header', 'resume-builder' ); ?></option>
            <option value="contact"<?php echo ( $section == 'contact' ? ' selected' : '' ); ?>><?php esc_html_e( 'Contact Information', 'resume-builder' ); ?></option>
            <option value="introduction"<?php echo ( $section == 'introduction' ? ' selected' : '' ); ?>><?php esc_html_e( 'Introduction', 'resume-builder' ); ?></option>
            <option value="history"<?php echo ( $section == 'history' ? ' selected' : '' ); ?>><?php esc_html_e( 'Education & Experience', 'resume-builder' ); ?></option>
            <option value="skills"<?php echo ( $section == 'skills' ? ' selected' : '' ); ?>><?php esc_html_e( 'Skills', 'resume-builder' ); ?></option>
        </select>
        </p>

        <p>
        <label for="<?php echo esc_attr( $this->get_field_id( 'style' ) ); ?>"><?php esc_attr_e( 'Style:', 'resume-builder' ); ?></label>
        <select class="widefat" id="<?php echo esc_attr( $this->get_field_id( 'style' ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( 'style' ) ); ?>">
            <option value="compact"<?php echo ( $style == 'compact' ? ' selected' : '' ); ?>><?php esc_html_e( 'Compact', 'resume-builder' ); ?></option>
            <option value="default"<?php echo ( $style == 'default' ? ' selected' : '' ); ?>><?php esc_html_e( 'Normal', 'resume-builder' ); ?></option>
        </select>
        </p>

        <?php
    }

    public function update( $new_instance, $old_instance ) {
        $instance = array();
        $instance['title'] = ( ! empty( $new_instance['title'] ) ? wp_strip_all_tags( $new_instance['title'], true ) : '' );
        $instance['style'] = ( ! empty( $new_instance['style'] ) ? $new_instance['style'] : 'compact' );
        $instance['id'] = ( isset( $new_instance['id'] ) ? $new_instance['id'] : false );
        $instance['section'] = ( ! empty( $new_instance['section'] ) ? $new_instance['section'] : 'full' );
        return $instance;
    }

}
