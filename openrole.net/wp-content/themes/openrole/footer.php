<footer class="site-footer">
    <div class="container">
        <div class="footer-columns">
            <div class="footer-column">
                <h3>For Job Seekers</h3>
                <?php
                wp_nav_menu(array(
                    'theme_location' => 'footer',
                    'menu_id'        => 'footer-menu-1',
                    'container'      => false,
                    'depth'          => 1,
                ));
                ?>
            </div>
            
            <div class="footer-column">
                <h3>For Employers</h3>
                <ul>
                    <li><a href="<?php echo esc_url(get_permalink(get_option('job_manager_submit_job_form_page_id'))); ?>">Post a Job</a></li>
                    <li><a href="/pricing">Pricing</a></li>
                    <li><a href="/employer-resources">Resources</a></li>
                    <li><a href="/verification">Get Verified</a></li>
                </ul>
            </div>
            
            <div class="footer-column">
                <h3>Company</h3>
                <ul>
                    <li><a href="/about">About OpenRole</a></li>
                    <li><a href="/blog">Blog</a></li>
                    <li><a href="/privacy">Privacy Policy</a></li>
                    <li><a href="/terms">Terms of Service</a></li>
                </ul>
            </div>
            
            <div class="footer-column">
                <h3>Stay Connected</h3>
                <p>Join thousands of professionals finding fair, transparent job opportunities.</p>
                <!-- Add newsletter signup form here -->
            </div>
        </div>
        
        <div class="footer-bottom">
            <p>&copy; <?php echo date('Y'); ?> <?php bloginfo('name'); ?>. All rights reserved.</p>
            <p class="transparency-pledge">
                <span class="salary-badge">100% Salary Transparency</span>
            </p>
        </div>
    </div>
</footer>

<?php wp_footer(); ?>

<style>
/* Footer Styles */
.site-footer {
    background: #1f2937;
    color: #e5e7eb;
    padding: 3rem 0 1rem;
    margin-top: 4rem;
}

.footer-columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.footer-column h3 {
    color: #ffffff;
    margin-bottom: 1rem;
}

.footer-column ul {
    list-style: none;
    padding: 0;
}

.footer-column li {
    margin-bottom: 0.5rem;
}

.footer-column a {
    color: #e5e7eb;
    text-decoration: none;
}

.footer-column a:hover {
    color: #ffffff;
}

.footer-bottom {
    border-top: 1px solid #374151;
    padding-top: 2rem;
    text-align: center;
}

.transparency-pledge {
    margin-top: 1rem;
}

/* Additional theme styles */
.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    margin: 2rem 0;
}

.feature {
    background: #f9fafb;
    padding: 2rem;
    border-radius: 8px;
    text-align: center;
}

.feature h3 {
    margin-bottom: 1rem;
    color: #1f2937;
}

.posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin: 2rem 0;
}

/* Navigation Styles */
.main-navigation ul {
    list-style: none;
    display: flex;
    gap: 2rem;
    margin: 0;
    padding: 0;
}

.main-navigation a {
    color: #1f2937;
    text-decoration: none;
    font-weight: 500;
}

.header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
}

/* Responsive */
@media (max-width: 768px) {
    .site-header .container {
        flex-direction: column;
        gap: 1rem;
    }
    
    .main-navigation ul {
        flex-direction: column;
        gap: 0.5rem;
        text-align: center;
    }
    
    .header-actions {
        flex-wrap: wrap;
        justify-content: center;
    }
}
</style>

</body>
</html>