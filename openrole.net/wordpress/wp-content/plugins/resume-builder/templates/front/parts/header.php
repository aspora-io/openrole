<?php

global $resume, $compact;

do_action( 'rb_resume_before_resume_header' );
$rand_rbt = wp_rand( 100,999 );

?><style type="text/css">
	<?php echo '#rb-template-' . esc_attr( $rand_rbt ); ?> .rbt-header .rbt-name,
	<?php echo '#rb-template-' . esc_attr( $rand_rbt ); ?> .rbt-header .rbt-title { color:<?php echo esc_html( $resume['display']['text_color'] ); ?>; }
	<?php echo '#rb-template-' . esc_attr( $rand_rbt ); ?> .rbt-header .rb-button { background:<?php echo esc_html( $resume['display']['highlight_color'] ); ?>; }
	<?php echo '#rb-template-' . esc_attr( $rand_rbt ); ?> .rbt-header .rb-button:hover { background:<?php echo esc_html( $resume['display']['text_color'] ); ?>; }
	<?php echo '#rb-template-' . esc_attr( $rand_rbt ); ?> .rbt-header > .rbt-photo { width: <?php echo esc_html( $resume['display']['photo_size'] ); ?>px; height: <?php echo esc_html( $resume['display']['photo_size'] ); ?>px; }
</style>

<div id="<?php echo 'rb-template-' . esc_attr( $rand_rbt ); ?>" class="<?php echo 'rb-template-' . esc_attr( $resume['display']['template'] ); ?>">
	<section class="rbt-header<?php echo ( has_post_thumbnail( $resume['id'] ) ? ' rb-resume-has-photo' : '' ); ?>">

		<?php do_action( 'rb_resume_header_start' ); ?>
		
		<?php if ( has_post_thumbnail( $resume['id'] ) ): ?>
			<div class="rbt-photo" style="background-image: url( '<?php echo esc_attr( get_the_post_thumbnail_url( $resume['id'], 'large' ) ); ?>' )">&nbsp;</div>
		<?php endif; ?>
	
		<?php do_action( 'rb_resume_after_photo' ); ?>
	
		<div class="rbt-name"><?php echo ( isset( $resume['introduction']['title'] ) ? esc_html( $resume['introduction']['title'] ) : esc_html( $resume['title'] ) ); ?></div>
	
		<?php do_action( 'rb_resume_after_title' ); ?>
	
		<?php echo ( isset( $resume['introduction']['subtitle'] ) ? '<div class="rbt-title">' . wp_kses_post( $resume['introduction']['subtitle'] ) . '</div>' : '' ); ?>
		
		<?php echo ( isset( $resume['resume_file'] ) && $resume['resume_file'] ? '<div class="rbt-attachment"><a target="_blank" href="' . esc_url( $resume['resume_file'] ) . '" class="rb-button"><svg width="24" height="24" fill="none" viewBox="0 0 24 24">
		<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7.75 19.25H16.25C17.3546 19.25 18.25 18.3546 18.25 17.25V9L14 4.75H7.75C6.64543 4.75 5.75 5.64543 5.75 6.75V17.25C5.75 18.3546 6.64543 19.25 7.75 19.25Z"></path>
		<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 9.25H13.75V5"></path>
		<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 15.25H14.25"></path>
		<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 12.25H14.25"></path>
		</svg>&nbsp;' . ( isset( $resume['display']['attachment_button_text'] ) && $resume['display']['attachment_button_text'] ? esc_html( $resume['display']['attachment_button_text'] ) : esc_html__( 'Download Attachment', 'resume-builder' ) ) . '</a></div>' : '' ); ?> 
	
		<?php do_action( 'rb_resume_header_end' ); ?>
	
	</section>
</div><?php

do_action( 'rb_resume_after_resume_header' );