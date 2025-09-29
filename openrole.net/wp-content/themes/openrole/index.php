<?php
/**
 * The main template file for OpenRole theme
 */

get_header(); ?>

<div class="hero-section">
    <div class="container">
        <h1><?php echo get_bloginfo('name'); ?></h1>
        <p class="hero-tagline"><?php echo get_bloginfo('description'); ?></p>
        
        <?php if (class_exists('WP_Job_Manager')) : ?>
            <div class="hero-search">
                <?php echo do_shortcode('[jobs show_filters="true"]'); ?>
            </div>
        <?php endif; ?>
    </div>
</div>

<main id="main-content" class="site-main">
    <div class="container">
        
        <!-- Featured Jobs Section -->
        <?php if (class_exists('WP_Job_Manager')) : ?>
            <section class="featured-jobs">
                <h2>Latest Transparent Job Opportunities</h2>
                <?php echo do_shortcode('[jobs per_page="6" orderby="date" order="DESC"]'); ?>
            </section>
        <?php endif; ?>
        
        <!-- Why OpenRole Section -->
        <section class="why-openrole">
            <h2>Why OpenRole?</h2>
            <div class="features-grid">
                <div class="feature">
                    <h3>💰 Mandatory Salary Transparency</h3>
                    <p>Every job post includes salary ranges. No more guessing games.</p>
                </div>
                <div class="feature">
                    <h3>✓ Verified Employers</h3>
                    <p>We verify every employer to ensure legitimate opportunities.</p>
                </div>
                <div class="feature">
                    <h3>📊 Application Tracking</h3>
                    <p>Know exactly where you stand in the hiring process.</p>
                </div>
                <div class="feature">
                    <h3>⚡ Fair Response Times</h3>
                    <p>Employers commit to responding within set timeframes.</p>
                </div>
            </div>
        </section>
        
        <!-- Latest Blog Posts -->
        <?php if (have_posts()) : ?>
            <section class="latest-posts">
                <h2>Career Insights & Tips</h2>
                <div class="posts-grid">
                    <?php
                    while (have_posts()) : the_post();
                        get_template_part('template-parts/content', 'excerpt');
                    endwhile;
                    ?>
                </div>
                <?php the_posts_navigation(); ?>
            </section>
        <?php endif; ?>
        
    </div>
</main>

<?php get_footer(); ?>