<?php
/**
 * Plugin Name: OpenRole Core Functionality
 * Description: Core functionality for OpenRole.net that must always be active
 * Version: 1.0.0
 * Author: OpenRole Team
 * 
 * This is a Must-Use plugin that cannot be deactivated
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Custom roles on activation
function openrole_setup_roles() {
    // Add custom capabilities to employer role
    $employer = get_role('employer');
    if (!$employer) {
        add_role('employer', 'Employer', array(
            'read' => true,
            'edit_posts' => false,
            'delete_posts' => false,
            'publish_posts' => false,
            'upload_files' => true,
        ));
    }
    
    // Add custom capabilities to candidate role  
    $candidate = get_role('candidate');
    if (!$candidate) {
        add_role('candidate', 'Job Seeker', array(
            'read' => true,
            'upload_files' => true,
        ));
    }
}
add_action('init', 'openrole_setup_roles');

// Auto-assign role on registration
function openrole_registration_save($user_id) {
    if (!isset($_POST['user_type'])) {
        return;
    }
    
    $user = new WP_User($user_id);
    
    if ($_POST['user_type'] === 'employer') {
        $user->set_role('employer');
    } else {
        $user->set_role('candidate');
    }
}
add_action('user_register', 'openrole_registration_save');

// Add user type field to registration
function openrole_register_form() {
    ?>
    <p>
        <label for="user_type"><?php _e('I am a:', 'openrole'); ?><br />
        <select name="user_type" id="user_type" class="input">
            <option value="candidate"><?php _e('Job Seeker', 'openrole'); ?></option>
            <option value="employer"><?php _e('Employer', 'openrole'); ?></option>
        </select>
        </label>
    </p>
    <?php
}
add_action('register_form', 'openrole_register_form');

// Create required pages on activation
function openrole_create_pages() {
    $pages = array(
        'jobs' => array(
            'title' => 'Browse Jobs',
            'content' => '[jobs]',
        ),
        'submit-job' => array(
            'title' => 'Post a Job',
            'content' => '[submit_job_form]',
        ),
        'dashboard' => array(
            'title' => 'Dashboard',
            'content' => '[job_dashboard]',
        ),
        'my-applications' => array(
            'title' => 'My Applications',
            'content' => '[job_applications]',
        ),
        'pricing' => array(
            'title' => 'Pricing',
            'content' => '<!-- wp:heading -->
<h2>Simple, Transparent Pricing</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Post your jobs with mandatory salary transparency.</p>
<!-- /wp:paragraph -->

<!-- wp:columns -->
<div class="wp-block-columns">
<!-- wp:column -->
<div class="wp-block-column">
<!-- wp:heading {"level":3} -->
<h3>Single Job Post</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p><strong>$99</strong> for 30 days</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column">
<!-- wp:heading {"level":3} -->
<h3>5 Job Pack</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p><strong>$399</strong> (Save $96)</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column">
<!-- wp:heading {"level":3} -->
<h3>Unlimited Monthly</h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p><strong>$799</strong> per month</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->',
        ),
    );
    
    foreach ($pages as $slug => $page) {
        // Check if page exists
        $page_check = get_page_by_path($slug);
        
        if (!isset($page_check->ID)) {
            wp_insert_post(array(
                'post_type' => 'page',
                'post_title' => $page['title'],
                'post_content' => $page['content'],
                'post_status' => 'publish',
                'post_name' => $slug,
            ));
        }
    }
}
register_activation_hook(__FILE__, 'openrole_create_pages');

// Email configuration for local development
if (defined('WP_DEBUG') && WP_DEBUG) {
    add_action('phpmailer_init', function($phpmailer) {
        $phpmailer->isSMTP();
        $phpmailer->Host = 'mailhog';
        $phpmailer->Port = 1025;
        $phpmailer->SMTPAuth = false;
    });
}

// Admin notice for setup
function openrole_admin_notice() {
    $screen = get_current_screen();
    
    // Check if WP Job Manager is active
    if (!class_exists('WP_Job_Manager')) {
        ?>
        <div class="notice notice-warning is-dismissible">
            <p><strong>OpenRole Setup:</strong> Please activate WP Job Manager plugin for full functionality.</p>
        </div>
        <?php
    }
    
    // Check if permalink structure is set
    if (get_option('permalink_structure') === '') {
        ?>
        <div class="notice notice-warning is-dismissible">
            <p><strong>OpenRole Setup:</strong> Please set your permalink structure to "Post name" in Settings → Permalinks.</p>
        </div>
        <?php
    }
}
add_action('admin_notices', 'openrole_admin_notice');

// Add FairPath settings page
function openrole_admin_menu() {
    add_menu_page(
        'OpenRole Settings',
        'OpenRole',
        'manage_options',
        'openrole-settings',
        'openrole_settings_page',
        'dashicons-money-alt',
        30
    );
}
add_action('admin_menu', 'openrole_admin_menu');

function openrole_settings_page() {
    ?>
    <div class="wrap">
        <h1>OpenRole Settings</h1>
        
        <div class="card">
            <h2>Quick Setup Checklist</h2>
            <ul style="list-style-type: disc; margin-left: 20px;">
                <li>✓ WordPress Installed</li>
                <li><?php echo class_exists('WP_Job_Manager') ? '✓' : '○'; ?> WP Job Manager Activated</li>
                <li><?php echo get_option('permalink_structure') ? '✓' : '○'; ?> Permalinks Configured</li>
                <li><?php echo wp_count_posts('page')->publish > 3 ? '✓' : '○'; ?> Required Pages Created</li>
                <li><?php echo get_role('employer') ? '✓' : '○'; ?> User Roles Configured</li>
            </ul>
        </div>
        
        <div class="card">
            <h2>Next Steps</h2>
            <ol>
                <li>Configure WP Job Manager settings</li>
                <li>Set up payment processing (Stripe/PayPal)</li>
                <li>Customize email templates</li>
                <li>Add your logo and branding</li>
                <li>Create employer verification process</li>
            </ol>
        </div>
        
        <div class="card">
            <h2>Premium Features</h2>
            <p>To unlock full functionality, consider adding:</p>
            <ul>
                <li>WP Job Manager - Paid Listings ($149/year)</li>
                <li>WP Job Manager - Applications ($99/year)</li>
                <li>WP Job Manager - Resume Manager ($149/year)</li>
            </ul>
        </div>
    </div>
    <?php
}