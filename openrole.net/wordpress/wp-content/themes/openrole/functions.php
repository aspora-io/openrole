<?php
/**
 * OpenRole Theme Functions
 * 
 * This file contains all the custom functionality for the OpenRole job platform
 */

// Theme Setup
function openrole_theme_setup() {
    // Add theme support
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('custom-logo');
    add_theme_support('html5', array('search-form', 'comment-form', 'comment-list', 'gallery', 'caption'));
    
    // Register menus
    register_nav_menus(array(
        'primary' => __('Primary Menu', 'openrole'),
        'footer' => __('Footer Menu', 'openrole'),
    ));
}
add_action('after_setup_theme', 'openrole_theme_setup');

// Enqueue Scripts and Styles
function openrole_enqueue_scripts() {
    wp_enqueue_style('openrole-style', get_stylesheet_uri(), array(), '1.0.0');
    wp_enqueue_script('openrole-main', get_template_directory_uri() . '/js/main.js', array('jquery'), '1.0.0', true);
}
add_action('wp_enqueue_scripts', 'openrole_enqueue_scripts');

// CORE FEATURE: Make salary field mandatory
function openrole_require_salary_field($fields) {
    if (isset($fields['job'])) {
        // Add custom salary fields if not already present
        $fields['job']['job_salary_min'] = array(
            'label'       => __('Minimum Salary ($)', 'openrole'),
            'type'        => 'number',
            'required'    => true,
            'placeholder' => __('50000', 'openrole'),
            'priority'    => 3.5,
        );
        
        $fields['job']['job_salary_max'] = array(
            'label'       => __('Maximum Salary ($)', 'openrole'),
            'type'        => 'number',
            'required'    => true,
            'placeholder' => __('80000', 'openrole'),
            'priority'    => 3.6,
        );
        
        $fields['job']['job_salary_currency'] = array(
            'label'       => __('Currency', 'openrole'),
            'type'        => 'select',
            'required'    => true,
            'options'     => array(
                'USD' => 'USD',
                'EUR' => 'EUR',
                'GBP' => 'GBP',
                'CAD' => 'CAD',
            ),
            'default'     => 'USD',
            'priority'    => 3.7,
        );
    }
    return $fields;
}
add_filter('submit_job_form_fields', 'openrole_require_salary_field');
add_filter('job_manager_job_listing_data_fields', 'openrole_require_salary_field');

// Display salary on job listings
function openrole_display_salary($salary, $post) {
    $min = get_post_meta($post->ID, '_job_salary_min', true);
    $max = get_post_meta($post->ID, '_job_salary_max', true);
    $currency = get_post_meta($post->ID, '_job_salary_currency', true);
    
    if ($min && $max) {
        $currency = $currency ?: 'USD';
        return sprintf(
            '<span class="job-salary-range">%s %s - %s</span>',
            $currency,
            number_format($min),
            number_format($max)
        );
    }
    return $salary;
}
add_filter('the_job_salary', 'openrole_display_salary', 10, 2);

// Add transparency badge to verified companies
function openrole_add_verified_badge($company_name, $post) {
    $company_verified = get_post_meta($post->ID, '_company_verified', true);
    
    if ($company_verified) {
        $company_name .= ' <span class="verified-employer">✓ Verified</span>';
    }
    
    return $company_name;
}
add_filter('the_company_name', 'openrole_add_verified_badge', 10, 2);

// Track application status
function openrole_track_application_status() {
    if (!class_exists('WP_Job_Manager_Applications')) {
        return;
    }
    
    // Add status tracking field to applications
    add_action('job_application_form_fields', function($fields) {
        $fields['_application_status'] = array(
            'label'    => __('Application Status', 'openrole'),
            'type'     => 'select',
            'required' => false,
            'options'  => array(
                'submitted'    => __('Submitted', 'openrole'),
                'reviewing'    => __('Under Review', 'openrole'),
                'interviewing' => __('Interview Stage', 'openrole'),
                'rejected'     => __('Not Selected', 'openrole'),
                'offered'      => __('Offer Extended', 'openrole'),
            ),
            'priority' => 99,
        );
        return $fields;
    });
}
add_action('init', 'openrole_track_application_status');

// Email notifications for status changes
function openrole_notify_application_status_change($application_id, $old_status, $new_status) {
    $application = get_post($application_id);
    $candidate_email = get_post_meta($application_id, '_candidate_email', true);
    
    if ($candidate_email && $old_status !== $new_status) {
        $job_title = get_the_title(get_post_meta($application_id, '_job_applied_for', true));
        $subject = sprintf(__('Application Update: %s', 'openrole'), $job_title);
        
        $message = sprintf(
            __('Hi %s,\n\nYour application for %s has been updated.\n\nStatus: %s\n\nBest regards,\nOpenRole Team', 'openrole'),
            get_post_meta($application_id, '_candidate_name', true),
            $job_title,
            $new_status
        );
        
        wp_mail($candidate_email, $subject, $message);
    }
}
add_action('application_status_changed', 'openrole_notify_application_status_change', 10, 3);

// Custom dashboard widget for employers
function openrole_add_dashboard_widgets() {
    if (current_user_can('employer')) {
        wp_add_dashboard_widget(
            'openrole_employer_stats',
            __('Your Job Posting Stats', 'openrole'),
            'openrole_employer_stats_widget'
        );
    }
}
add_action('wp_dashboard_setup', 'openrole_add_dashboard_widgets');

function openrole_employer_stats_widget() {
    $user_id = get_current_user_id();
    $jobs = get_posts(array(
        'post_type' => 'job_listing',
        'author' => $user_id,
        'posts_per_page' => -1,
    ));
    
    $total_jobs = count($jobs);
    $active_jobs = 0;
    $total_applications = 0;
    
    foreach ($jobs as $job) {
        if (get_post_status($job->ID) === 'publish') {
            $active_jobs++;
        }
        $total_applications += (int) get_post_meta($job->ID, '_application_count', true);
    }
    
    echo '<p><strong>' . __('Total Jobs Posted:', 'openrole') . '</strong> ' . $total_jobs . '</p>';
    echo '<p><strong>' . __('Active Jobs:', 'openrole') . '</strong> ' . $active_jobs . '</p>';
    echo '<p><strong>' . __('Total Applications:', 'openrole') . '</strong> ' . $total_applications . '</p>';
}

// SEO: Add schema.org markup for job postings
function openrole_add_job_schema() {
    if (is_singular('job_listing')) {
        global $post;
        
        $schema = array(
            '@context' => 'https://schema.org/',
            '@type' => 'JobPosting',
            'title' => get_the_title(),
            'description' => get_the_content(),
            'datePosted' => get_the_date('c'),
            'hiringOrganization' => array(
                '@type' => 'Organization',
                'name' => get_the_company_name($post),
            ),
            'jobLocation' => array(
                '@type' => 'Place',
                'address' => get_post_meta($post->ID, '_job_location', true),
            ),
        );
        
        // Add salary information
        $min = get_post_meta($post->ID, '_job_salary_min', true);
        $max = get_post_meta($post->ID, '_job_salary_max', true);
        $currency = get_post_meta($post->ID, '_job_salary_currency', true) ?: 'USD';
        
        if ($min && $max) {
            $schema['baseSalary'] = array(
                '@type' => 'MonetaryAmount',
                'currency' => $currency,
                'value' => array(
                    '@type' => 'QuantitativeValue',
                    'minValue' => $min,
                    'maxValue' => $max,
                    'unitText' => 'YEAR',
                ),
            );
        }
        
        echo '<script type="application/ld+json">' . json_encode($schema) . '</script>';
    }
}
add_action('wp_head', 'openrole_add_job_schema');

// Redirect to setup wizard if theme is activated for the first time
function openrole_activation_redirect() {
    if (get_option('openrole_activation_redirect', false)) {
        delete_option('openrole_activation_redirect');
        if (!is_network_admin() && !isset($_GET['activate-multi'])) {
            wp_redirect(admin_url('admin.php?page=openrole-setup'));
            exit;
        }
    }
}
add_action('admin_init', 'openrole_activation_redirect');

// On theme activation
function openrole_activate() {
    add_option('openrole_activation_redirect', true);
}
add_action('after_switch_theme', 'openrole_activate');