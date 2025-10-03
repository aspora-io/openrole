// OpenRole API Integration
// Use relative path when on HTTPS to use nginx proxy
const API_BASE_URL = window.location.protocol === 'https:' ? '' : 'http://145.223.75.73:3002';

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
    try {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
        
        return response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth helper functions
function isLoggedIn() {
    return !!localStorage.getItem('authToken');
}

function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// Update navigation based on auth status
function updateNavigation() {
    const user = getUser();
    const authLinks = document.querySelectorAll('.auth-links');
    
    authLinks.forEach(container => {
        if (user) {
            container.innerHTML = `
                <div class="flex items-center space-x-4">
                    <span class="text-gray-600">Welcome, ${user.first_name}</span>
                    <a href="/profile" class="text-gray-600 hover:text-teal-600">Profile</a>
                    <button onclick="logout()" class="px-4 py-2 text-gray-600 hover:text-teal-600">Logout</button>
                </div>
            `;
        }
    });
}

// Load jobs on the jobs page
async function loadJobs(page = 1) {
    try {
        const data = await apiCall(`/api/jobs?page=${page}`);
        const jobsContainer = document.getElementById('jobs-container');
        if (!jobsContainer) return;
        
        jobsContainer.innerHTML = data.data.map(job => `
            <div class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
                <div class="flex-1">
                    <a href="/job-detail?id=${job.id}" class="group">
                        <h2 class="text-xl font-semibold text-gray-900 group-hover:text-teal-600">
                            ${job.title}
                        </h2>
                    </a>
                    <div class="flex items-center gap-4 mt-2 text-gray-600">
                        <span>🏢 ${job.company}</span>
                        <span>📍 ${job.location}</span>
                        ${job.remote ? '<span class="text-teal-600 font-medium">(Remote)</span>' : ''}
                    </div>
                    <div class="mt-3 flex items-center gap-6 text-sm">
                        <span class="text-green-600 font-semibold">💷 £${job.salary_min.toLocaleString()} - £${job.salary_max.toLocaleString()}</span>
                        <span class="text-gray-500">${job.type}</span>
                        <span class="text-gray-500">🕒 ${formatDate(job.posted_date)}</span>
                    </div>
                    <p class="mt-3 text-gray-600">${job.description.substring(0, 150)}...</p>
                    <div class="mt-4 flex items-center gap-4">
                        <a href="/job-detail?id=${job.id}" class="text-teal-600 hover:text-teal-700 font-medium">View details</a>
                        <button class="text-gray-500 hover:text-gray-700" onclick="saveJob(${job.id})">⭐ Save</button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Update job count
        const jobCountEl = document.querySelector('.text-gray-600');
        if (jobCountEl) {
            jobCountEl.textContent = `${data.total} jobs found`;
        }
    } catch (error) {
        console.error('Failed to load jobs:', error);
    }
}

// Load job details
async function loadJobDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('id') || 1;
    
    try {
        const job = await apiCall(`/api/jobs/${jobId}`);
        document.title = `${job.title} - ${job.company} | OpenRole`;
        
        // Update job details on page
        const titleEl = document.querySelector('h1');
        if (titleEl) titleEl.textContent = job.title;
        
        const companyEl = document.querySelector('.text-gray-600');
        if (companyEl) companyEl.innerHTML = `🏢 ${job.company} &nbsp;&nbsp; 📍 ${job.location}`;
        
        const salaryEl = document.querySelector('.text-green-600');
        if (salaryEl) salaryEl.textContent = `£${job.salary_min.toLocaleString()} - £${job.salary_max.toLocaleString()} per year`;
        
        const descEl = document.querySelector('.prose');
        if (descEl) {
            descEl.innerHTML = `
                <p class="text-lg text-gray-700 mb-6">${job.description}</p>
                <h3 class="text-xl font-semibold text-gray-900 mb-4">Requirements</h3>
                <ul class="space-y-2">
                    ${job.requirements.map(req => `<li class="flex items-start">
                        <span class="text-teal-600 mr-2">✓</span>
                        <span>${req}</span>
                    </li>`).join('')}
                </ul>
            `;
        }
    } catch (error) {
        console.error('Failed to load job details:', error);
    }
}

// Handle job search
async function handleJobSearch(event) {
    event.preventDefault();
    const form = event.target;
    const query = form.querySelector('input[placeholder*="Job title"]').value;
    const location = form.querySelector('input[placeholder*="Location"]').value;
    
    try {
        const data = await apiCall(`/api/search?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`);
        
        // Update URL to jobs page with search params
        window.location.href = `/jobs?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
    } catch (error) {
        console.error('Search failed:', error);
    }
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value;
    const password = form.password.value;
    
    try {
        const data = await apiCall('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (data.success) {
            // Store token
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirect to dashboard
            alert('Login successful! (Demo mode)');
            window.location.href = '/';
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        alert('Login error. Please try again.');
    }
}

// Handle registration
async function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = {
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role') || 'candidate'
    };
    
    try {
        const response = await apiCall('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (response.success) {
            alert('Registration successful! You can now login. (Demo mode)');
            window.location.href = '/login';
        } else {
            alert(response.message || 'Registration failed');
        }
    } catch (error) {
        alert('Registration error. Please try again.');
    }
}

// Format date helper
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
}

// Save job function
function saveJob(jobId) {
    const saved = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
    if (!saved.includes(jobId)) {
        saved.push(jobId);
        localStorage.setItem('saved_jobs', JSON.stringify(saved));
        alert('Job saved!');
    } else {
        alert('Job already saved');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check which page we're on
    const path = window.location.pathname;
    
    if (path === '/jobs' || path === '/jobs.html') {
        loadJobs();
    } else if (path === '/job-detail' || path === '/job-detail.html') {
        loadJobDetail();
    }
    
    // Attach event handlers
    const searchForm = document.querySelector('form[class*="grid md:grid-cols-3"]');
    if (searchForm) {
        searchForm.addEventListener('submit', handleJobSearch);
    }
    
    const loginForm = document.querySelector('#login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.querySelector('#register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Update auth UI
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user) {
        const signInLink = document.querySelector('a[href="/login"]');
        if (signInLink) {
            signInLink.textContent = user.email;
            signInLink.href = '#';
        }
    }
});