// Main page authentication and functionality
const API_BASE_URL = 'http://localhost:5000';

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        
        this.initializeEventListeners();
        this.checkAuthStatus();
    }

    initializeEventListeners() {
        // Login button
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.showModal('loginModal');
        });

        // Hero login button
        const heroLoginBtn = document.getElementById('heroLoginBtn');
        if (heroLoginBtn) {
            heroLoginBtn.addEventListener('click', () => {
                this.showModal('loginModal');
            });
        }

        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            this.hideModal('loginModal');
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Form submissions
        document.getElementById('loginFormElement').addEventListener('submit', (e) => {
            this.handleLogin(e);
        });

        document.getElementById('registerFormElement').addEventListener('submit', (e) => {
            this.handleRegister(e);
        });

        // Google Auth buttons
        document.getElementById('googleLoginBtn').addEventListener('click', () => {
            this.handleGoogleAuth();
        });

        document.getElementById('googleRegisterBtn').addEventListener('click', () => {
            this.handleGoogleAuth();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('loginModal');
            if (e.target === modal) {
                this.hideModal('loginModal');
            }
        });
    }

    checkAuthStatus() {
        if (this.token && this.user) {
            // User is logged in, redirect to game
            window.location.href = '/game.html';
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    switchTab(tab) {
        console.log('Switching to tab:', tab);
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        
        const targetForm = document.getElementById(`${tab}Form`);
        if (targetForm) {
            targetForm.classList.add('active');
            console.log('Form switched to:', tab, 'Form element:', targetForm);
        } else {
            console.error('Form not found:', `${tab}Form`);
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<div class="loading"></div> Logging in...';
        submitBtn.disabled = true;

        try {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store auth data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                this.showSuccess('Login successful! Redirecting to game...');
                
                // Redirect to game
                setTimeout(() => {
                    window.location.href = 'game.html';
                }, 1500);
            } else {
                this.showError(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError(`Connection error: ${error.message}. Please check if the server is running.`);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleRegister(e) {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<div class="loading"></div> Creating account...';
        submitBtn.disabled = true;

        try {
            const username = document.getElementById('registerUsername').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                this.showError('Passwords do not match');
                return;
            }

            if (password.length < 6) {
                this.showError('Password must be at least 6 characters long');
                return;
            }

            console.log('Attempting registration with:', { username, email, password: '***' });

            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            console.log('Registration response status:', response.status);
            const data = await response.json();
            console.log('Registration response data:', data);

            if (response.ok) {
                // Store auth data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                this.showSuccess('Account created successfully! Welcome to the Elite Forces!');
                
                // Redirect to game
                setTimeout(() => {
                    window.location.href = 'game.html';
                }, 1500);
            } else {
                this.showError(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError(`Connection error: ${error.message}. Please check if the server is running.`);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    handleGoogleAuth() {
        window.location.href = `${this.apiUrl}/auth/google`;
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
            <span>${message}</span>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            font-family: 'Exo 2', sans-serif;
            font-weight: 600;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Remove notification after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 4000);
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyles);
