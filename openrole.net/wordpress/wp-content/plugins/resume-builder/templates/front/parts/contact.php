<?php

global $resume, $compact;

if ( $resume['contact']['email'] || $resume['contact']['phone'] || $resume['contact']['website'] || $resume['contact']['address'] ):
	
	$rand_rbt = wp_rand( 100,999 );
	$border_rgb = Resume_Builder_Functions::hex_to_rgb( $resume['display']['text_color'] );
	
	?><style type="text/css">
		<?php echo '#rb-template-' . esc_js( $rand_rbt ); ?> .rbt-contact-info,
		<?php echo '#rb-template-' . esc_js( $rand_rbt ); ?> .rbt-ci-block { border-color: <?php echo esc_html( 'rgba( ' . $border_rgb['r'] . ', ' . $border_rgb['g'] . ', ' . $border_rgb['b'] . ', 0.2 );' ); ?> }
		<?php echo '#rb-template-' . esc_js( $rand_rbt ); ?> .rbt-contact-info a { color:<?php echo esc_html( $resume['display']['highlight_color'] ); ?>; }
		<?php echo '#rb-template-' . esc_js( $rand_rbt ); ?> .rbt-contact-info svg path { stroke:<?php echo esc_html( $resume['display']['text_color'] ); ?>; }
		<?php echo '#rb-template-' . esc_js( $rand_rbt ); ?> .rbt-contact-info,
		<?php echo '#rb-template-' . esc_js( $rand_rbt ); ?> .rbt-contact-info a:hover { color:<?php echo esc_html( $resume['display']['text_color'] ); ?>; }	
	</style><?php

	$contact_info = array();
	if ( isset( $resume['contact']['email'] ) && $resume['contact']['email'] ):
		$contact_info[] = '<div class="rbt-ci-block"><div><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.75 7.75C4.75 6.64543 5.64543 5.75 6.75 5.75H17.25C18.3546 5.75 19.25 6.64543 19.25 7.75V16.25C19.25 17.3546 18.3546 18.25 17.25 18.25H6.75C5.64543 18.25 4.75 17.3546 4.75 16.25V7.75Z" stroke="#141414" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5.5 6.5L12 12.25L18.5 6.5" stroke="#141414" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></div><div><a href="mailto:' . antispambot( esc_html( $resume['contact']['email'] ) ) . '">' . antispambot( esc_html( $resume['contact']['email'] ) ) . '</a></div></div>';
	endif;
	if ( isset( $resume['contact']['phone'] ) && $resume['contact']['phone'] ):
		$contact_info[] = '<div class="rbt-ci-block"><div><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.89286 4.75H6.06818C5.34017 4.75 4.75 5.34017 4.75 6.06818C4.75 13.3483 10.6517 19.25 17.9318 19.25C18.6598 19.25 19.25 18.6598 19.25 17.9318V15.1071L16.1429 13.0357L14.5317 14.6468C14.2519 14.9267 13.8337 15.0137 13.4821 14.8321C12.8858 14.524 11.9181 13.9452 10.9643 13.0357C9.98768 12.1045 9.41548 11.1011 9.12829 10.494C8.96734 10.1537 9.06052 9.76091 9.32669 9.49474L10.9643 7.85714L8.89286 4.75Z" stroke="#141414" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></div><div>' . esc_html( $resume['contact']['phone'] ) . '</div></div>';
	endif;
	if ( isset( $resume['contact']['website'] ) && $resume['contact']['website'] ):
		$contact_info[] = '<div class="rbt-ci-block"><div><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.75 13.25L18 12C19.6569 10.3431 19.6569 7.65685 18 6C16.3431 4.34314 13.6569 4.34314 12 5.99999L10.75 7.25" stroke="#141414" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M7.25003 10.75L6.00003 12C4.34317 13.6569 4.34317 16.3431 6.00003 18C7.65688 19.6569 10.3432 19.6569 12 18L13.25 16.75" stroke="#141414" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M14.25 9.75L9.75 14.25" stroke="#141414" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></div><div><a href="' . esc_attr( $resume['contact']['website'] ) . '" target="_blank">' . esc_html( $resume['contact']['website'] ) . '</a></div></div>';
	endif;
	if ( isset( $resume['contact']['address'] ) && $resume['contact']['address'] ):
		$contact_info[] = '<div class="rbt-ci-block"><div><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.25 11C18.25 15 12 19.25 12 19.25C12 19.25 5.75 15 5.75 11C5.75 7.5 8.68629 4.75 12 4.75C15.3137 4.75 18.25 7.5 18.25 11Z" stroke="#141414" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M14.25 11C14.25 12.2426 13.2426 13.25 12 13.25C10.7574 13.25 9.75 12.2426 9.75 11C9.75 9.75736 10.7574 8.75 12 8.75C13.2426 8.75 14.25 9.75736 14.25 11Z" stroke="#141414" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></div><div>' . nl2br( esc_html( $resume['contact']['address'] ) ) . '</div></div>';
	endif;

	$contact_info_html = implode( '', $contact_info );

endif;

if ( $contact_info_html ):

	do_action( 'rb_resume_before_contact_info' );
	
	echo ( $compact ? '<div class="rb-compact">' : '' );
	
		echo '<div id="rb-template-' . esc_attr( $rand_rbt ) . '" class="rb-template-' . esc_attr( $resume['display']['template'] ) . '">';
			echo '<div class="rbt-contact-info">';
				echo wp_kses_post( $contact_info_html );
			echo '</div>';
		echo '</div>';
	
	echo ( $compact ? '</div>' : '' );
	
	do_action( 'rb_resume_after_contact_info' );
	
endif;

