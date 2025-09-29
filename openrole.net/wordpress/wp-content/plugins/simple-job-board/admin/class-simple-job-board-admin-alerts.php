<?php
/**
 * Simple_Job_Board_Admin_Alerts class
 *
 * Add job board shortcode builder to TinyMCE. Define the shortcode button and
 * parameters in TinyMCE. Also creates shortcodes with given parameters.
 *
 * @link       https://wordpress.org/plugins/simple-job-board
 * @since      2.2.3
 * @since      2.8.0 - Made TinyMCE compatible with Gutenberg Classic Editor
 *
 * @package    Simple_Job_Board
 * @subpackage Simple_Job_Board/admin
 * @author     PressTigers <support@presstigers.com>
 */
class Simple_Job_Board_Admin_Alerts
{

    /**
     * Initilaize class.
     *
     * @since   2.2.3
     */
    public function __construct()
    {
        
        if ( ! file_exists( WP_PLUGIN_DIR . '/sjb-job-alert/sjb-job-alert.php' ) ){
            add_action('admin_enqueue_scripts', array( $this, 'load_admin_styles_on_sjb_pages' ));
            add_action( 'all_admin_notices', array( $this, 'render_admin_alerts_banner' ) );
        }
        add_action('admin_init', array( $this, 'check_addon_versions_and_display_notifications' ));

    }

    /**
     * Add jobpost meta boxes.
     *
     * @since 2.1.0
     */
    public function render_admin_alerts_banner() {

        // Base URL for the WooCommerce API
        $api_url = 'https://market.presstigers.com/wp-json/mp/v1/products';
        // Make API request
        $response = wp_remote_get(
                $api_url, array(
            'method' => 'GET',
            'timeout' => 10,
            'redirection' => 5,
            'httpversion' => '1.0',
            'blocking' => true,
            'headers' => array(),
            'cookies' => array(),
            ));
        // Check the response code
        $response_code = wp_remote_retrieve_response_code($response);
        $response_message = wp_remote_retrieve_response_message($response);

        if (200 != $response_code && !empty($response_message)) {
            return new WP_Error($response_code, $response_message);
        } elseif (200 != $response_code) {
            return new WP_Error($response_code, esc_html__('Unknown error occurred', 'simple-job-board'));
        } else {
            // Decode the response body
            $body = wp_remote_retrieve_body($response);
            $products = json_decode($body, true); // Decode the JSON response
        }
        $products_data = array();

        if (!empty($products['products'])) {
            // Filter products based on conditions and prepare them for display
            $filtered_products = [];
            foreach ($products['products'] as $product) {
                // Get the necessary fields from the main product
                $product_title = isset($product['title']) ? $product['title'] : '';
                $product_id = isset($product['id']) ? $product['id'] : '';
                $add_on_version = isset($product['add_on_version']) ? $product['add_on_version'] : '';
                $plugin_main_slug = isset($product['plugin_main_slug']) ? $product['plugin_main_slug'] : '';
                $permalink = isset($product['permalink']) ? $product['permalink'] : '';
                $linked_products = isset($product['_linked_products']) ? $product['_linked_products'] : [];

                // **Condition to check if product title contains "Bundle" and linked_products is not empty**
                if (stripos($product_title, 'Bundle') !== false && !empty($linked_products)) {
                    // Initialize the regular and sale price variables
                    $regular_price = '';
                    $sale_price = '';

                    // Check if variations exist and fetch the prices from them
                    if (isset($product['variations']) && !empty($product['variations'])) {
                        // Loop through variations to find the 'Regular' variation
                        foreach ($product['variations'] as $variation) {
                            // Check if the variation has the correct option (i.e., Regular)
                            if (isset($variation['attributes']) && !empty($variation['attributes'])) {
                                foreach ($variation['attributes'] as $attribute) {
                                    // If the attribute is 'License' and the option is 'Regular'
                                    if (isset($attribute['name']) && $attribute['name'] == 'License' && isset($attribute['option']) && $attribute['option'] == 'Regular') {
                                        // Now we have found the 'Regular' variation, so we can grab the price
                                        $regular_price = isset($variation['regular_price']) ? $variation['regular_price'] : '';
                                        $sale_price = isset($variation['sale_price']) ? $variation['sale_price'] : '';
                                        break 2; // Break out of both loops once we find the 'Regular' variation
                                    }
                                }
                            }
                        }
                    }

                    // Prepare the product data to output
                    $filtered_products[] = [
                        'title' => $product_title,
                        'regular_price' => $regular_price,
                        'sale_price' => $sale_price,
                        'add_on_version' => $add_on_version,
                        'plugin_main_slug' => $plugin_main_slug,
                        'permalink' => $permalink,
                        'linked_products' => $linked_products
                    ];
                }
            }
        }

        if (isset($_COOKIE['alertCloseCount'])) {
            $alert_clicked_count = intval($_COOKIE['alertCloseCount']);
        } else {
            $alert_clicked_count = 1;
        }

        if ($alert_clicked_count < 3 ) {
            $screen = get_current_screen();

            // Check if the post_type is 'jobpost'
            if ( isset($screen->post_type) && ($screen->post_type === 'jobpost' || $screen->post_type === 'jobpost_applicants') ) {
                ?>
                <div class="sjb-alert-banner">
                    <div class="sjb-banner-container">
                        <div class="sjb-banner-text">
                            <h2 class="sjb-save-bundle"><?php esc_html_e('BUNDLE & SAVE!', 'simple-job-board') ?></h2>
                            <img src="<?php echo esc_url(plugin_dir_url(dirname(__FILE__)) . 'admin/images/sjb_tag.png'); ?>" alt="" class="sjb-banner-name" style="max-width: 279px;" />

                            <div class="sjb-banner-text_details">
                                <!-- Product Title and Permalink -->
                                <h2><a href="" target="_blank"><?php echo esc_html($filtered_products[0]['title']); ?></a></h2>
                                <p><?php esc_html_e('This bundle contains the following Add-ons', 'simple-job-board') ?>:</p>
                                <ul>
                                    <?php
                                    if (!empty($filtered_products[0]['linked_products'])) {
                                        foreach ($filtered_products[0]['linked_products'] as $linked_product) {
                                            echo '<li>' . esc_html($linked_product) . '</li>';
                                        }
                                    }
                                    ?>
                                </ul>
                            </div>
 
                            <div class="sjb_notfiy_banner_pr_btn ">
                                <!-- Buy Now Button and Pricing -->
                                <a href="<?php echo esc_url($filtered_products[0]['permalink']); ?>" target="_blank" class="sjb-btn"><?php esc_html_e('Buy Now', 'simple-job-board') ?></a>
                                <p class="price-wrap">
                                    <!-- Display actual price if available -->
                                    <?php if (!empty($filtered_products[0]['regular_price'])) : ?>
                                        <del><?php echo "$".esc_html($filtered_products[0]['regular_price']); ?>.00</del>
                                    <?php endif; ?>
                                    <span class="price">
                                        <?php
                                        // If sale price is available, display it; otherwise, use regular price
                                        echo !empty($filtered_products[0]['sale_price']) ? "$".esc_html($filtered_products[0]['sale_price']) : "$".esc_html($filtered_products[0]['regular_price']);?>.00/year</span>
                                </p>
                            </div>

                            <!-- Dots for navigation -->
                            <div class="sjb-dots-container">
                                <?php for ($i = 0; $i < count($filtered_products); $i++) : ?>
                                    <span class="sjb-dot" data-index="<?php echo $i; ?>"></span>
                                <?php endfor; ?>
                            </div>

                        </div>
                        <div class="sjb-banner-img">
                            <!-- Banner Image -->
                            <img src="<?php echo esc_url( plugin_dir_url(dirname(__FILE__)) . 'admin/images/sjb-info-banner.png' ); ?>" alt="<?php esc_attr__('Email Notifications Bundle', 'simple-job-board'); ?>" />
                            <button class="alert-close-btn">X</button>
                        </div>
                    </div>
                </div>

                <script type="text/javascript">
                    jQuery(document).ready(function () {
                        var productIndex = 0;
                        var products = <?php echo json_encode($filtered_products); ?>;
                        var $alertBanner = jQuery('.sjb-alert-banner');
                        var $closeBtn = jQuery('.alert-close-btn');
                        var $bannerText = jQuery('.sjb-banner-text_details h2 a');
                        var $productList = jQuery('.sjb-banner-text_details ul');
                        var $price = jQuery('.price-wrap .price');
                        var $regularPrice = jQuery('.price-wrap del');
                        var $buyNowBtn = jQuery('.sjb_notfiy_banner_pr_btn a');
                        var $dots = jQuery('.sjb-dot'); // Dots container

                        // Function to update the product data
                        function updateProductData(index) {
                            var product = products[index];

                            if (!product) return;  // Safety check in case there is no product at the given index

                            $bannerText.text(product.title);
                            $bannerText.attr('href', product.permalink);
                            $productList.empty();
                            
                            // Check if linked_products is an array and has elements
                            if (Array.isArray(product.linked_products) && product.linked_products.length > 0) {
                                jQuery.each(product.linked_products, function(i, linkedProduct) {
                                    $productList.append('<li>' + linkedProduct + '</li>');
                                });
                            } else {
                                $productList.append('<li>No linked products available.</li>');
                            }

                            // Update price info
                            if (product.regular_price) {
                                $regularPrice.text('$' + product.regular_price+'.00');
                            }
                            $price.text(product.sale_price ? '$' + product.sale_price+'.00' : '$' + product.regular_price+'.00');
                            $buyNowBtn.attr('href', product.permalink);

                            // Update active dot
                            $dots.removeClass('active');
                            $dots.eq(index).addClass('active');
                        }

                        // Initially load the first product
                        updateProductData(productIndex);

                        // Set interval to change product every 5 seconds
                        setInterval(function() {
                            productIndex = (productIndex + 1) % products.length;
                            updateProductData(productIndex);
                        }, 3500);

                        // Handle dot click events
                        $dots.on('click', function() {
                            productIndex = jQuery(this).data('index');
                            updateProductData(productIndex);
                        });

                        var $closeBtn = jQuery('.alert-close-btn');
                        var $alertBanner = jQuery('.sjb-alert-banner');

                        // Function to set cookies
                        function setCookie(name, value, days) {
                            var expires = "";
                            if (days) {
                                var date = new Date();
                                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                                expires = "; expires=" + date.toUTCString();
                            }
                            document.cookie = name + "=" + (value || "") + expires + "; path=/";
                        }

                        // Function to get cookies
                        function getCookie(name) {
                            var nameEQ = name + "=";
                            var ca = document.cookie.split(';');
                            for (var i = 0; i < ca.length; i++) {
                                var c = ca[i];
                                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
                            }
                            return null;
                        }

                        // Initialize click count from cookie or start at 0
                        var clickCount = parseInt(getCookie('alertCloseCount')) || 0;

                        // Hide the banner if the click count is greater than 4
                        if (clickCount > 4) {
                            $alertBanner.hide();
                        }

                        // Increment click count and update cookie on close button click
                        $closeBtn.on('click', function () {
                            clickCount++;
                            setCookie('alertCloseCount', clickCount, 30); // Cookie lasts 30 days

                            if (clickCount > 4) {
                                $alertBanner.hide();
                            } else {
                                $alertBanner.hide(); // Hide the banner on each click
                            }
                        });
                    });
                </script>
                <?php
            }
        }

    }


                    
   public function load_admin_styles_on_sjb_pages($hook) {
        // Get the current screen
        $screen = get_current_screen();
    
        // Check if the current screen is a taxonomy page
        if ( isset($screen->post_type) && $screen->post_type === 'jobpost' || $screen->post_type === 'jobpost_applicants' ) {
            // Enqueue your CSS file for taxonomy pages
            wp_enqueue_style('sjb-admin-alert-css', plugin_dir_url(dirname(__FILE__)) . 'admin/css/sjb-admin-alert-style.css');
        }
    }

    public function check_addon_versions_and_display_notifications() {

        // Define a unique transient key
        $transient_key = 'mp_pt_api_products';

        // Check if transient exists
        $cached_data = get_transient($transient_key);

        if ($cached_data !== false) {
            // Use cached data 
            $addons = $cached_data;
        } else {
        // Base URL for the WooCommerce API
        $api_url = 'https://market.presstigers.com/wp-json/mp/v1/products';


        // Make API request
        $response = wp_remote_get(
                $api_url, array(
            'method' => 'GET',
            'timeout' => 10,
            'redirection' => 5,
            'httpversion' => '1.0',
            'blocking' => true,
            'headers' => array(),
            'cookies' => array(),
            
            ));
        // Check the response code
        $response_code = wp_remote_retrieve_response_code($response);
        $response_message = wp_remote_retrieve_response_message($response);

        if (200 != $response_code && !empty($response_message)) {
            return new WP_Error($response_code, $response_message);
        } elseif (200 != $response_code) {
            return new WP_Error($response_code, esc_html__('Unknown error occurred', 'simple-job-board'));
        } else {
            // Decode the response body
            $body = wp_remote_retrieve_body($response);
            $products = json_decode($body, true); // Decode the JSON response
        }

        // Prepare the $addons array from the API response
        $addons = array();
        if (!empty($products['products'])) {
            foreach ($products['products'] as $product) {
                // Ensure that both add_on_version, plugin_main_slug, and permalink are set and non-empty
                $add_on_version = isset($product['add_on_version']) ? $product['add_on_version'] : null;
                $plugin_main_slug = isset($product['plugin_main_slug']) ? $product['plugin_main_slug'] : null;
                $permalink = isset($product['permalink']) ? $product['permalink'] : null;

                if (!empty($add_on_version) && !empty($plugin_main_slug) && !empty($permalink)) {
                    // Store an array with version and permalink
                    $addons[$plugin_main_slug] = array(
                        'version' => $add_on_version,
                        'permalink' => $permalink
                    );
                }
            }
        }
               
            // Cache the data in a transient for 24 hours
            set_transient($transient_key, $addons, DAY_IN_SECONDS);
        }
         // Check if the base (free) plugin is installed (instead of active)
        if (file_exists(WP_PLUGIN_DIR . '/simple-job-board/simple-job-board.php')) {
            foreach ($addons as $addon_slug => $addon_info) {
                // Check if the add-on plugin is installed (file exists)
                if (file_exists(WP_PLUGIN_DIR . '/' . $addon_slug)) {
                    // Get the add-on data
                    $addon_data = get_plugin_data(WP_PLUGIN_DIR . '/' . $addon_slug);

                    // Compare installed version with the latest version
                    if (version_compare($addon_data['Version'], $addon_info['version'], '<')) {
                        // Display an admin notice if the version is outdated
                        add_action('admin_notices', function() use ($addon_data, $addon_info) {
                            ?>
                            <div class="notice notice-warning is-dismissible">
                                    <p><?php 
                                        echo sprintf(
                                            /* translators: 1: Version number, 2: Permalink URL, 3: Add-on name, 4: Account URL */
                                            wp_kses(
                                                __('There is a new version (%1$s) available for <a href="%2$s"><strong>%3$s</strong></a>. Please <a href="%4$s">download</a> and install the latest version!', 'simple-job-board'),
                                                array(
                                                    'a' => array(
                                                        'href' => array(),
                                                        'strong' => array(),
                                                    )
                                                )
                                            ),
                                            esc_html($addon_info['version']),
                                            esc_url($addon_info['permalink']),
                                            esc_html($addon_data['Name']),
                                            esc_url('https://market.presstigers.com/my-account/')
                                        );
                                    ?></p>
                                </div>
                            <?php
                        });
                    }
                }
            }
        }

}
    
       

}

new Simple_Job_Board_Admin_Alerts();
