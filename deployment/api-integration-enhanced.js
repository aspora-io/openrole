/**
 * Enhanced API Integration for OpenRole
 * Handles authentication, role-based navigation, and API communication
 */

// API Configuration
const API_BASE_URL = window.location.origin;

// Authentication State Management
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
        this.initAuthState();
    }

    initAuthState() {
        // Update navigation based on auth state
        this.updateNavigation();
        
        // Set up token refresh if needed
        if (this.token) {
            this.scheduleTokenRefresh();
        }
    }

    isAuthenticated() {
        return this.token && this.user.id;
    }

    getUserType() {
        return this.user.userType || null;
    }

    getUser() {
        return this.user;
    }

    getToken() {
        return this.token;
    }

    login(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        this.updateNavigation();
        this.scheduleTokenRefresh();
    }

    logout() {
        this.token = null;
        this.user = {};
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        this.updateNavigation();
        window.location.href = '/';
    }

    updateNavigation() {
        // Update header navigation if elements exist
        const loginBtn = document.querySelector('[href="/login"]');
        const registerBtn = document.querySelector('[href="/register"]');
        const userMenu = document.getElementById('user-menu');
        
        if (this.isAuthenticated()) {
            // Hide login/register buttons
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            
            // Show user menu or create it
            this.createUserMenu();
        } else {
            // Show login/register buttons
            if (loginBtn) loginBtn.style.display = '';
            if (registerBtn) registerBtn.style.display = '';
            
            // Hide user menu
            if (userMenu) userMenu.style.display = 'none';
        }
    }

    createUserMenu() {
        const existingMenu = document.getElementById('user-menu');
        if (existingMenu) {
            existingMenu.style.display = 'flex';
            return;
        }

        // Find navigation container
        const navContainer = document.querySelector('header nav') || 
                           document.querySelector('header .flex.items-center.space-x-4') ||
                           document.querySelector('header .flex.space-x-4');
        
        if (!navContainer) return;

        // Create user menu
        const userMenu = document.createElement('div');
        userMenu.id = 'user-menu';
        userMenu.className = 'flex items-center space-x-4';
        userMenu.innerHTML = `
            <span class="text-gray-700 text-sm">
                Hi, ${this.user.firstName || 'User'}
            </span>
            <a href="${this.getDashboardUrl()}" class="text-gray-700 hover:text-teal-600 font-medium">
                Dashboard
            </a>
            <button onclick="authManager.logout()" class="text-gray-700 hover:text-teal-600 text-sm">
                Logout
            </button>
        `;

        navContainer.appendChild(userMenu);
    }

    getDashboardUrl() {
        switch (this.getUserType()) {
            case 'candidate':
                return '/candidate-dashboard';
            case 'employer':
                return '/employer-dashboard';
            case 'admin':
                return '/admin-dashboard';
            default:
                return '/';
        }
    }

    scheduleTokenRefresh() {
        // Implement token refresh logic if needed
        // For now, just validate token periodically
        setTimeout(() => {
            this.validateToken();
        }, 30 * 60 * 1000); // Check every 30 minutes
    }

    async validateToken() {
        if (!this.token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                this.logout();
            }
        } catch (error) {
            console.error('Token validation failed:', error);
        }
    }

    // Redirect to appropriate dashboard
    redirectToDashboard() {
        window.location.href = this.getDashboardUrl();
    }

    // Check if user should be redirected (for protected pages)
    requireAuth(requiredRole = null) {
        if (!this.isAuthenticated()) {
            // Store current page for redirect after login
            sessionStorage.setItem('auth_redirect', window.location.pathname);
            window.location.href = '/login';
            return false;
        }

        if (requiredRole && this.getUserType() !== requiredRole) {
            // Redirect to appropriate dashboard
            this.redirectToDashboard();
            return false;
        }

        return true;
    }
}

// API Helper Functions
class ApiClient {
    constructor(authManager) {
        this.auth = authManager;
    }

    async request(endpoint, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth token if available
        if (this.auth.getToken()) {
            config.headers.Authorization = `Bearer ${this.auth.getToken()}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            
            // Handle auth errors
            if (response.status === 401) {
                this.auth.logout();
                throw new Error('Authentication required');
            }

            const data = await response.json();
            return { response, data };
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Auth API methods
    async login(email, password) {
        const { response, data } = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data.success) {
            this.auth.login(data.token, data.user);
        }

        return data;
    }

    async register(userData) {
        const { response, data } = await this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (data.success) {
            this.auth.login(data.token, data.user);
        }

        return data;
    }

    async getCurrentUser() {
        const { response, data } = await this.request('/api/auth/me');
        return data;
    }

    // Jobs API methods (placeholder for future implementation)
    async getJobs(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const { response, data } = await this.request(`/api/jobs?${queryParams}`);
        return data;
    }

    async getJob(jobId) {
        const { response, data } = await this.request(`/api/jobs/${jobId}`);
        return data;
    }

    async applyToJob(jobId, applicationData) {
        const { response, data } = await this.request(`/api/jobs/${jobId}/apply`, {
            method: 'POST',
            body: JSON.stringify(applicationData)
        });
        return data;
    }
}

// Global instances
const authManager = new AuthManager();
const apiClient = new ApiClient(authManager);

// Utility functions for forms
function showMessage(type, message, containerId = 'message-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const errorDiv = document.getElementById('error-message');
    const successDiv = document.getElementById('success-message');
    const errorText = document.getElementById('error-text');
    const successText = document.getElementById('success-text');

    if (!errorDiv || !successDiv || !errorText || !successText) return;

    container.classList.remove('hidden');

    if (type === 'error') {
        errorText.textContent = message;
        errorDiv.classList.remove('hidden');
        successDiv.classList.add('hidden');
    } else if (type === 'success') {
        successText.textContent = message;
        successDiv.classList.remove('hidden');
        errorDiv.classList.add('hidden');
    }

    // Auto-hide after 5 seconds for errors
    if (type === 'error') {
        setTimeout(() => {
            container.classList.add('hidden');
        }, 5000);
    }
}

// Page-specific initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize auth state
    authManager.initAuthState();

    // Handle auth redirects from OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    
    // Switch to employer tab if specified
    if (tab === 'employer' && typeof switchTab === 'function') {
        switchTab('employer');
    }

    // Auto-redirect if already logged in (for login/register pages)
    const currentPath = window.location.pathname;
    if (['/login', '/register', '/employer-login'].includes(currentPath) && authManager.isAuthenticated()) {
        authManager.redirectToDashboard();
    }
});

// Global logout function
function logout() {
    authManager.logout();
}

// Export for use in other scripts
window.authManager = authManager;
window.apiClient = apiClient;
window.showMessage = showMessage;
window.API_BASE_URL = API_BASE_URL;