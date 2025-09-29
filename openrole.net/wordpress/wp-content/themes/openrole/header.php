<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header class="site-header">
    <div class="container">
        <div class="site-branding">
            <a href="<?php echo esc_url(home_url('/')); ?>" class="logo-link">
                <img src="<?php echo esc_url(get_site_url()); ?>/wp-content/logo-cropped.png" 
                     alt="<?php bloginfo('name'); ?>" 
                     class="site-logo">
            </a>
        </div>
        
        <nav class="main-navigation">
            <?php
            wp_nav_menu(array(
                'theme_location' => 'primary',
                'menu_id'        => 'primary-menu',
                'container'      => false,
                'fallback_cb'    => false,
            ));
            ?>
        </nav>
        
        <div class="header-actions">
            <?php if (is_user_logged_in()) : ?>
                <?php if (current_user_can('employer')) : ?>
                    <a href="<?php echo esc_url(get_permalink(get_option('job_manager_submit_job_form_page_id'))); ?>" class="button">
                        Post a Job
                    </a>
                <?php endif; ?>
                <a href="<?php echo esc_url(get_permalink(get_option('job_manager_job_dashboard_page_id'))); ?>">
                    Dashboard
                </a>
                <a href="<?php echo esc_url(wp_logout_url(home_url())); ?>">
                    Logout
                </a>
            <?php else : ?>
                <a href="<?php echo esc_url(wp_login_url()); ?>">Login</a>
                <a href="<?php echo esc_url(wp_registration_url()); ?>" class="button">
                    Sign Up
                </a>
            <?php endif; ?>
        </div>
    </div>
</header>