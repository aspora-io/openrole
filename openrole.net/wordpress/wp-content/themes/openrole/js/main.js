/**
 * OpenRole.net Main JavaScript
 * Handles interactions, animations, and sticky navigation
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize all features
    initStickyHeader();
    initScrollAnimations();
    initInteractiveElements();
    initJobCardAnimations();
    initSearchEnhancements();
    initMobileMenu();
    
    /**
     * Sticky Header with Scroll Effects
     */
    function initStickyHeader() {
        const header = document.querySelector('.site-header');
        let lastScrollTop = 0;
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Add scrolled class for styling
            if (scrollTop > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            // Hide/show header on scroll (optional)
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
            
            lastScrollTop = scrollTop;
        });
    }
    
    /**
     * Scroll Reveal Animations
     */
    function initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    // Add staggered animation delay for multiple elements
                    const siblings = Array.from(entry.target.parentNode.children);
                    const index = siblings.indexOf(entry.target);
                    entry.target.style.animationDelay = `${index * 0.1}s`;
                }
            });
        }, observerOptions);
        
        // Observe elements for animation
        document.querySelectorAll('.feature, .job_listing, section h2').forEach(el => {
            el.classList.add('scroll-reveal');
            observer.observe(el);
        });
    }
    
    /**
     * Interactive Elements Enhancement
     */
    function initInteractiveElements() {
        // Add hover effects to buttons
        document.querySelectorAll('.button').forEach(button => {
            button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px) scale(1.02)';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
        
        // Animated counter for stats (if any)
        function animateCounter(element, target, duration = 2000) {
            let start = 0;
            const increment = target / (duration / 16);
            
            const timer = setInterval(() => {
                start += increment;
                element.textContent = Math.floor(start);
                
                if (start >= target) {
                    element.textContent = target;
                    clearInterval(timer);
                }
            }, 16);
        }
        
        // Apply counter animation to stats
        document.querySelectorAll('.stat-number').forEach(stat => {
            const target = parseInt(stat.dataset.target);
            if (target) {
                animateCounter(stat, target);
            }
        });
    }
    
    /**
     * Enhanced Job Card Interactions
     */
    function initJobCardAnimations() {
        document.querySelectorAll('.job_listing').forEach(card => {
            // Add smooth hover animations
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-8px)';
                this.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '';
            });
            
            // Add click ripple effect
            card.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = 100;
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(99, 102, 241, 0.3);
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    left: ${x}px;
                    top: ${y}px;
                    width: ${size}px;
                    height: ${size}px;
                    pointer-events: none;
                `;
                
                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
        
        // Add salary badge pulse effect
        document.querySelectorAll('.salary-badge').forEach(badge => {
            setInterval(() => {
                badge.style.animation = 'none';
                setTimeout(() => {
                    badge.style.animation = 'pulse-glow 2s infinite';
                }, 10);
            }, 5000);
        });
    }
    
    /**
     * Enhanced Search Experience
     */
    function initSearchEnhancements() {
        const searchInputs = document.querySelectorAll('input[type="search"], input[name="search_keywords"]');
        
        searchInputs.forEach(input => {
            // Add floating label effect
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            wrapper.style.width = '100%';
            
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);
            
            input.addEventListener('focus', function() {
                this.style.transform = 'scale(1.02)';
                this.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.2)';
            });
            
            input.addEventListener('blur', function() {
                this.style.transform = 'scale(1)';
                this.style.boxShadow = '';
            });
            
            // Add real-time search suggestions (placeholder for future enhancement)
            input.addEventListener('input', debounce(function() {
                const query = this.value.toLowerCase();
                if (query.length > 2) {
                    // Future: Add autocomplete dropdown
                    console.log('Search query:', query);
                }
            }, 300));
        });
    }
    
    /**
     * Mobile Menu Enhancement
     */
    function initMobileMenu() {
        // Create mobile menu toggle if it doesn't exist
        let mobileToggle = document.querySelector('.mobile-menu-toggle');
        
        if (!mobileToggle && window.innerWidth <= 768) {
            mobileToggle = document.createElement('button');
            mobileToggle.className = 'mobile-menu-toggle';
            mobileToggle.innerHTML = `
                <span class="hamburger">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            `;
            
            const navigation = document.querySelector('.main-navigation');
            if (navigation) {
                navigation.parentNode.insertBefore(mobileToggle, navigation);
                
                mobileToggle.addEventListener('click', function() {
                    navigation.classList.toggle('active');
                    this.classList.toggle('active');
                });
            }
        }
    }
    
    /**
     * Parallax Scroll Effect for Hero Section
     */
    function initParallaxEffects() {
        const hero = document.querySelector('.hero-section');
        
        if (hero) {
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const rate = scrolled * -0.5;
                hero.style.transform = `translateY(${rate}px)`;
            });
        }
    }
    
    /**
     * Form Enhancement
     */
    function initFormEnhancements() {
        // Enhanced form validation
        document.querySelectorAll('form').forEach(form => {
            const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
            
            inputs.forEach(input => {
                input.addEventListener('blur', function() {
                    validateField(this);
                });
                
                input.addEventListener('input', function() {
                    if (this.classList.contains('error')) {
                        validateField(this);
                    }
                });
            });
            
            form.addEventListener('submit', function(e) {
                let isValid = true;
                
                inputs.forEach(input => {
                    if (!validateField(input)) {
                        isValid = false;
                    }
                });
                
                if (!isValid) {
                    e.preventDefault();
                    showNotification('Please fill in all required fields correctly.', 'error');
                }
            });
        });
    }
    
    /**
     * Utility Functions
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    function validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        
        // Remove existing error styling
        field.classList.remove('error');
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Check if required field is empty
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            showFieldError(field, 'This field is required');
        }
        
        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                showFieldError(field, 'Please enter a valid email address');
            }
        }
        
        // Salary range validation
        if (field.name && field.name.includes('salary')) {
            const salaryValue = parseInt(value);
            if (value && (isNaN(salaryValue) || salaryValue < 0)) {
                isValid = false;
                showFieldError(field, 'Please enter a valid salary amount');
            }
        }
        
        return isValid;
    }
    
    function showFieldError(field, message) {
        field.classList.add('error');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.cssText = `
            color: #ef4444;
            font-size: 0.875rem;
            margin-top: 0.25rem;
            animation: fadeInUp 0.3s ease;
        `;
        
        field.parentNode.insertBefore(errorElement, field.nextSibling);
    }
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : '#10b981'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.75rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }
    
    // Initialize additional features
    initParallaxEffects();
    initFormEnhancements();
    
    // Add custom CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .mobile-menu-toggle {
            display: none;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.5rem;
        }
        
        .hamburger {
            display: flex;
            flex-direction: column;
            width: 24px;
            height: 18px;
            justify-content: space-between;
        }
        
        .hamburger span {
            display: block;
            height: 2px;
            background: var(--gray-700);
            border-radius: 1px;
            transition: all 0.3s ease;
        }
        
        .mobile-menu-toggle.active .hamburger span:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }
        
        .mobile-menu-toggle.active .hamburger span:nth-child(2) {
            opacity: 0;
        }
        
        .mobile-menu-toggle.active .hamburger span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -6px);
        }
        
        @media (max-width: 768px) {
            .mobile-menu-toggle {
                display: block;
            }
            
            .main-navigation {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                border-radius: 0 0 1rem 1rem;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s ease;
            }
            
            .main-navigation.active {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
        }
        
        .error {
            border-color: #ef4444 !important;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
        }
    `;
    document.head.appendChild(style);
});

// Performance optimization: Lazy load images
document.addEventListener('DOMContentLoaded', function() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
});