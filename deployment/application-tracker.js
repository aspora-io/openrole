/**
 * Application Tracking System
 * Manages job applications in localStorage for candidates and employers
 */

class ApplicationTracker {
    constructor() {
        this.storageKey = 'openrole_applications';
        this.init();
    }

    init() {
        // Initialize storage if it doesn't exist
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    // Get all applications
    getApplications() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }

    // Save applications
    saveApplications(applications) {
        localStorage.setItem(this.storageKey, JSON.stringify(applications));
    }

    // Generate unique application ID
    generateApplicationId() {
        return 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Submit a new application
    submitApplication(jobData, candidateData) {
        const applications = this.getApplications();
        
        const application = {
            id: this.generateApplicationId(),
            jobId: jobData.id || 'job_' + Date.now(),
            jobTitle: jobData.title,
            jobCompany: jobData.company,
            jobLocation: jobData.location,
            jobSalary: jobData.salary,
            candidateId: candidateData.id,
            candidateName: `${candidateData.firstName} ${candidateData.lastName}`,
            candidateEmail: candidateData.email,
            employerId: jobData.employerId,
            employerName: jobData.employerName || jobData.company,
            status: 'submitted',
            appliedAt: new Date().toISOString(),
            statusHistory: [
                {
                    status: 'submitted',
                    timestamp: new Date().toISOString(),
                    note: 'Application submitted'
                }
            ],
            coverLetter: candidateData.coverLetter || '',
            cvAttached: candidateData.cvAttached || false
        };

        applications.push(application);
        this.saveApplications(applications);
        
        // Dispatch events for dashboard updates
        this.dispatchApplicationEvent('applicationSubmitted', application);
        
        return application;
    }

    // Get applications for a specific candidate
    getCandidateApplications(candidateId) {
        const applications = this.getApplications();
        return applications.filter(app => app.candidateId === candidateId);
    }

    // Get applications for a specific employer
    getEmployerApplications(employerId) {
        const applications = this.getApplications();
        return applications.filter(app => app.employerId === employerId);
    }

    // Get applications for a specific job
    getJobApplications(jobId) {
        const applications = this.getApplications();
        return applications.filter(app => app.jobId === jobId);
    }

    // Update application status
    updateApplicationStatus(applicationId, newStatus, note = '') {
        const applications = this.getApplications();
        const application = applications.find(app => app.id === applicationId);
        
        if (application) {
            application.status = newStatus;
            application.statusHistory.push({
                status: newStatus,
                timestamp: new Date().toISOString(),
                note: note
            });
            
            this.saveApplications(applications);
            this.dispatchApplicationEvent('applicationStatusUpdated', application);
            
            return application;
        }
        
        return null;
    }

    // Check if user already applied for a job
    hasAppliedForJob(candidateId, jobId) {
        const applications = this.getApplications();
        return applications.some(app => 
            app.candidateId === candidateId && app.jobId === jobId
        );
    }

    // Get application statistics for candidate
    getCandidateStats(candidateId) {
        const applications = this.getCandidateApplications(candidateId);
        
        return {
            total: applications.length,
            submitted: applications.filter(app => app.status === 'submitted').length,
            reviewed: applications.filter(app => app.status === 'reviewed').length,
            interviewing: applications.filter(app => app.status === 'interviewing').length,
            offered: applications.filter(app => app.status === 'offered').length,
            rejected: applications.filter(app => app.status === 'rejected').length,
            recent: applications.filter(app => {
                const appliedDate = new Date(app.appliedAt);
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return appliedDate > weekAgo;
            }).length
        };
    }

    // Get application statistics for employer
    getEmployerStats(employerId) {
        const applications = this.getEmployerApplications(employerId);
        
        return {
            total: applications.length,
            new: applications.filter(app => app.status === 'submitted').length,
            reviewed: applications.filter(app => app.status === 'reviewed').length,
            interviewing: applications.filter(app => app.status === 'interviewing').length,
            offered: applications.filter(app => app.status === 'offered').length,
            thisWeek: applications.filter(app => {
                const appliedDate = new Date(app.appliedAt);
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return appliedDate > weekAgo;
            }).length
        };
    }

    // Get recent applications
    getRecentApplications(limit = 5, userId = null, userType = 'candidate') {
        let applications = this.getApplications();
        
        if (userId) {
            if (userType === 'candidate') {
                applications = applications.filter(app => app.candidateId === userId);
            } else if (userType === 'employer') {
                applications = applications.filter(app => app.employerId === userId);
            }
        }
        
        return applications
            .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
            .slice(0, limit);
    }

    // Format application status for display
    getStatusDisplay(status) {
        const statusMap = {
            'submitted': { label: 'Submitted', color: 'blue', icon: '📤' },
            'reviewed': { label: 'Under Review', color: 'yellow', icon: '👀' },
            'interviewing': { label: 'Interviewing', color: 'purple', icon: '🎤' },
            'offered': { label: 'Offer Made', color: 'green', icon: '🎉' },
            'rejected': { label: 'Not Selected', color: 'red', icon: '❌' },
            'withdrawn': { label: 'Withdrawn', color: 'gray', icon: '🚫' }
        };
        
        return statusMap[status] || { label: status, color: 'gray', icon: '📄' };
    }

    // Dispatch custom events for real-time updates
    dispatchApplicationEvent(eventType, application) {
        const event = new CustomEvent(eventType, {
            detail: { application }
        });
        document.dispatchEvent(event);
    }

    // Sample data generator for testing
    generateSampleData(candidateId, employerId) {
        const sampleJobs = [
            {
                id: 'job_001',
                title: 'Senior Software Engineer',
                company: 'Tech Corp',
                location: 'London',
                salary: '£70,000 - £90,000',
                employerId: employerId,
                employerName: 'Tech Corp'
            },
            {
                id: 'job_002', 
                title: 'Frontend Developer',
                company: 'Digital Agency',
                location: 'Remote',
                salary: '£45,000 - £60,000',
                employerId: 'emp_002',
                employerName: 'Digital Agency'
            },
            {
                id: 'job_003',
                title: 'Full Stack Developer', 
                company: 'Startup Hub',
                location: 'Manchester',
                salary: '£55,000 - £75,000',
                employerId: 'emp_003',
                employerName: 'Startup Hub'
            }
        ];

        const candidateData = {
            id: candidateId,
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com',
            coverLetter: 'I am excited to apply for this position...',
            cvAttached: true
        };

        // Create sample applications with different statuses and dates
        sampleJobs.forEach((job, index) => {
            const app = this.submitApplication(job, candidateData);
            
            // Update some applications with different statuses
            if (index === 0) {
                setTimeout(() => {
                    this.updateApplicationStatus(app.id, 'reviewed', 'Application under review');
                }, 100);
            } else if (index === 1) {
                setTimeout(() => {
                    this.updateApplicationStatus(app.id, 'interviewing', 'Invited for interview');
                }, 100);
            }
        });
    }

    // Clear all application data (for testing)
    clearAllApplications() {
        localStorage.removeItem(this.storageKey);
        this.init();
    }
}

// Create global instance
window.ApplicationTracker = new ApplicationTracker();