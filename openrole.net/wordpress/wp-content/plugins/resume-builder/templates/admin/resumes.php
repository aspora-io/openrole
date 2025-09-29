<div id="rbuilder-resumes" v-cloak v-bind:class="{ 'rbe-loading': loading, 'rbe-preloading': preloading }">
    <section class="window">
        <div class="rb-title-area">
            
            <h1><span>{{ ( search_results !== false ? '<?php esc_html_e( 'Search', 'resume-builder' ); ?>: "' + search_query + '"' : ( resume_totals.trash > 0 && filter == 'publish' ? '<?php esc_html_e( 'Published', 'resume-builder' ); ?> <?php esc_html_e( 'Resumes', 'resume-builder' ); ?>' : ( resume_totals.trash > 0 ? '<?php esc_html_e( 'Trashed', 'resume-builder' ); ?> <?php esc_html_e( 'Resumes', 'resume-builder' ); ?>' : '' ) ) ) }}</span></h1>
            
            <div :class="{ hidden: search_results !== false }" v-show="resume_totals.trash > 0" class="rb-filters">
                <a v-on:click="set_filter('publish'); active_filter = 'publish'" v-bind:class="{ active: ( active_filter == 'publish' ) }">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.25 12C19.25 16.0041 16.0041 19.25 12 19.25C7.99594 19.25 4.75 16.0041 4.75 12C4.75 7.99594 7.99594 4.75 12 4.75C16.0041 4.75 19.25 7.99594 19.25 12Z" stroke="#141414" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                        <path d="M15.25 12C15.25 16.5 13.2426 19.25 12 19.25C10.7574 19.25 8.75 16.5 8.75 12C8.75 7.5 10.7574 4.75 12 4.75C13.2426 4.75 15.25 7.5 15.25 12Z" stroke="#141414" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                        <path d="M5 12H19" stroke="#141414" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    <?php esc_html_e( 'Published', 'resume-builder' ); ?>
                    <span class="counter">({{ resume_totals.publish }})</span>
                </a>
                <a v-on:click="set_filter('trash'); active_filter = 'trash'" v-bind:class="{ active: ( active_filter == 'trash' ) }">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.75 7.75L7.59115 17.4233C7.68102 18.4568 8.54622 19.25 9.58363 19.25H14.4164C15.4538 19.25 16.319 18.4568 16.4088 17.4233L17.25 7.75" stroke="#141414" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                        <path d="M9.75 7.5V6.75C9.75 5.64543 10.6454 4.75 11.75 4.75H12.25C13.3546 4.75 14.25 5.64543 14.25 6.75V7.5" stroke="#141414" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                        <path d="M5 7.75H19" stroke="#141414" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    <?php esc_html_e( 'Trash', 'resume-builder' ); ?>
                    <span class="counter">({{ resume_totals.trash }})</span>
                </a>
            </div>
            
            <resume-search placeholder="<?php echo esc_attr__('Search Resumes'); ?>" ref="searchComponent" :ajax_url="'<?php echo esc_attr( admin_url('admin-ajax.php') ); ?>'" @show_search_results="show_search_results" @clear_search_results="clear_search_results" :resumes="resumes"></resume-search>
            
        </div>
        <resumes @saved="saved" @saved_trash="saved_trash" :search_results="search_results" :resumes="resumes" :filter="filter" nonce="<?php echo esc_attr( wp_create_nonce( 'rb_edit_resumes' ) ); ?>"></resumes>
        
        <div v-show="search_results === false && total_pages > 1" class="rb-pagination">
            <div :class="{ active: page == this_page }" v-on:click="page = parseInt( this_page )" v-for="this_page in parseInt(total_pages)">{{ this_page }}</div>
        </div>
        
        <div v-show="preloading" class="loading-wrapper">
            <div class="loading-spinner">
                <div class="rbe-loader"></div>
            </div>
        </div>
        
    </section>
</div>