// Login page JavaScript functionality
class LoginManager {
    constructor() {
        this.qrSessionId = null;
        this.qrTimer = null;
        this.qrExpiryTime = 5 * 60; // 5 minutes in seconds
        this.pollInterval = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.generateQRCode();
    }
    
    setupEventListeners() {
        // Form submissions
        document.getElementById('login-form').addEventListener('submit', (e) => {
            this.handleManualLogin(e);
        });
        
        document.getElementById('signup-form').addEventListener('submit', (e) => {
            this.handleSignup(e);
        });
        
        // Start QR polling when QR tab is active
        this.startQRPolling();
    }
    
    async generateQRCode() {
        try {
            // Generate a unique session ID for this QR code
            this.qrSessionId = this.generateSessionId();
            
            // Create the authentication URL that mobile devices will scan
            const authUrl = `${window.location.origin}/mobile-auth?session=${this.qrSessionId}`;
            
            // Generate QR code
            const canvas = document.getElementById('qr-canvas');
            await QRCode.toCanvas(canvas, authUrl, {
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
            
            // Start the timer
            this.startTimer();
            
            // Update status
            this.updateStatus('waiting', '🕐 Waiting for mobile authentication...');
            
            // Start polling for authentication
            this.startQRPolling();
            
        } catch (error) {
            console.error('Error generating QR code:', error);
            this.updateStatus('error', '❌ Failed to generate QR code. Please try again.');
        }
    }
    
    generateSessionId() {
        return 'qr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    startTimer() {
        let timeLeft = this.qrExpiryTime;
        const timerElement = document.getElementById('qr-timer');
        
        this.qrTimer = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerElement.textContent = `Expires in: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            timeLeft--;
            
            if (timeLeft < 0) {
                clearInterval(this.qrTimer);
                this.updateStatus('error', '⏰ QR code expired. Please refresh to generate a new one.');
                this.stopQRPolling();
            }
        }, 1000);
    }
    
    startQRPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
        
        this.pollInterval = setInterval(async () => {
            await this.checkQRAuthStatus();
        }, 2000); // Check every 2 seconds
    }
    
    stopQRPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }
    
    async checkQRAuthStatus() {
        if (!this.qrSessionId) return;
        
        try {
            const response = await fetch(`/api/qr-auth-status/${this.qrSessionId}`);
            const data = await response.json();
            
            if (data.status === 'authenticated') {
                this.handleQRAuthSuccess(data);
            } else if (data.status === 'expired') {
                this.updateStatus('error', '⏰ QR code expired. Please refresh to generate a new one.');
                this.stopQRPolling();
            }
        } catch (error) {
            console.error('Error checking QR auth status:', error);
        }
    }
    
    handleQRAuthSuccess(data) {
        this.updateStatus('success', '✅ Authentication successful! Redirecting...');
        this.stopQRPolling();
        
        // Store the authentication token
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Clear timer
        if (this.qrTimer) {
            clearInterval(this.qrTimer);
        }
        
        // Redirect to main application
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 2000);
    }
    
    async handleManualLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password')
        };
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Store authentication data
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                
                // Redirect to main application
                window.location.href = '/index.html';
            } else {
                alert(result.error || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    }
    
    async handleSignup(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const signupData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };
        
        // Debug: Log the form data being sent
        console.log('Signup data being sent:', signupData);
        
        // Validate passwords match
        if (signupData.password !== signupData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(signupData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('Account created successfully! You can now log in.');
                switchTab('form'); // Switch to login tab
            } else {
                // Show specific validation errors if available
                if (result.details && result.details.length > 0) {
                    alert('Validation errors:\n• ' + result.details.join('\n• '));
                } else {
                    alert(result.error || 'Signup failed. Please try again.');
                }
                console.error('Signup validation errors:', result.details);
            }
        } catch (error) {
            console.error('Signup error:', error);
            alert('Signup failed. Please try again.');
        }
    }
    
    updateStatus(type, message) {
        const statusElement = document.getElementById('qr-status');
        statusElement.className = `status-message status-${type}`;
        statusElement.textContent = message;
    }
    
    refreshQR() {
        // Clear existing timer and polling
        if (this.qrTimer) {
            clearInterval(this.qrTimer);
        }
        this.stopQRPolling();
        
        // Generate new QR code
        this.generateQRCode();
    }
}

// Tab switching functionality
function switchTab(tabName) {
    // Remove active class from all tabs and buttons
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Add active class to selected tab and button
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
    
    // If switching to QR tab, ensure polling is active
    if (tabName === 'qr' && window.loginManager) {
        window.loginManager.startQRPolling();
    } else if (window.loginManager) {
        window.loginManager.stopQRPolling();
    }
}

// Global refresh function for the refresh button
function refreshQR() {
    if (window.loginManager) {
        window.loginManager.refreshQR();
    }
}

// Initialize login manager when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.loginManager = new LoginManager();
});

// Check if user is already logged in
function checkExistingAuth() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        // User is already logged in, redirect to main app
        window.location.href = '/index.html';
    }
}

// Run auth check on page load
checkExistingAuth();