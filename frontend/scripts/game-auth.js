// Game page authentication manager
const API_BASE_URL = window.location.hostname === 'cosmic-commander-elite.onrender.com' 
    ? 'https://cosmic-commander-elite.onrender.com'
    : 'http://localhost:5000';

class GameAuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        
        this.initializeEventListeners();
        this.checkAuthFromURL();
        this.updateUI();
    }

    initializeEventListeners() {
        // Login/Logout buttons
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.showModal('loginModal');
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Modal close
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideModal('loginModal');
            });
        }

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Form submissions
        const loginForm = document.getElementById('loginFormElement');
        const registerForm = document.getElementById('registerFormElement');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                this.handleLogin(e);
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                this.handleRegister(e);
            });
        }

        // Google Auth buttons
        const googleLoginBtn = document.getElementById('googleLoginBtn');
        const googleRegisterBtn = document.getElementById('googleRegisterBtn');

        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => {
                this.handleGoogleAuth();
            });
        }

        if (googleRegisterBtn) {
            googleRegisterBtn.addEventListener('click', () => {
                this.handleGoogleAuth();
            });
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('loginModal');
            if (e.target === modal) {
                this.hideModal('loginModal');
            }
        });
    }

    checkAuthFromURL() {
        // Check if we have token and user data from URL (Google OAuth redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const userData = urlParams.get('user');

        if (token && userData) {
            try {
                const user = JSON.parse(decodeURIComponent(userData));
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                this.token = token;
                this.user = user;
                
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
                this.showSuccess('Welcome back, Commander! Successfully logged in with Google.');
            } catch (error) {
                console.error('Error parsing user data from URL:', error);
            }
        }
    }

    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');

        if (this.token && this.user) {
            // User is logged in
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (userInfo) userInfo.style.display = 'flex';
            
            if (userName) {
                userName.textContent = this.user.username || 'Commander';
            }
            
            if (userAvatar && this.user.profilePicture) {
                userAvatar.src = this.user.profilePicture;
                userAvatar.style.display = 'block';
                document.getElementById('avatarIcon').style.display = 'none';
            }
        } else {
            // User is not logged in
            if (loginBtn) loginBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userInfo) userInfo.style.display = 'none';
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-tab="${tab}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        const activeForm = document.getElementById(`${tab}Form`);
        if (activeForm) {
            activeForm.classList.add('active');
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
                this.token = data.token;
                this.user = data.user;
                
                this.hideModal('loginModal');
                this.updateUI();
                this.showSuccess('Welcome back, Commander!');
                
                // Load leaderboard
                if (window.gameManager) {
                    window.gameManager.loadLeaderboard();
                }
            } else {
                this.showError(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Connection error. Please try again.');
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

            if (password.length < 6) {
                this.showError('Password must be at least 6 characters long');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store auth data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                this.token = data.token;
                this.user = data.user;
                
                this.hideModal('loginModal');
                this.updateUI();
                this.showSuccess('Welcome to the Elite Forces, Commander!');
                
                // Load leaderboard
                if (window.gameManager) {
                    window.gameManager.loadLeaderboard();
                }
            } else {
                this.showError(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('Connection error. Please try again.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    handleGoogleAuth() {
        window.location.href = '/auth/google';
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.token = null;
        this.user = null;
        
        this.updateUI();
        this.showSuccess('Logged out successfully. See you next time, Commander!');
        
        // Reset game if running
        if (window.gameManager) {
            window.gameManager.resetGame();
            window.gameManager.loadLeaderboard();
        }
    }

    async saveScore(gameData) {
        if (!this.token) {
            this.showError('Please log in to save your score!');
            return false;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/game/save-score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(gameData)
            });

            const data = await response.json();

            if (response.ok) {
                if (data.newHighScore) {
                    this.showSuccess('🎉 NEW HIGH SCORE! You\'ve earned your place among the Elite!');
                } else {
                    this.showSuccess('Commander, see you next time!');
                }
                
                // Reload leaderboard after successful score save
                if (window.gameManager) {
                    console.log('AuthManager: Reloading leaderboard after score save');
                    window.gameManager.loadLeaderboard();
                }
                
                return true;
            } else {
                this.showError(data.message || 'Failed to save score');
                return false;
            }
        } catch (error) {
            console.error('Save score error:', error);
            this.showError('Connection error. Score not saved.');
            return false;
        }
    }

    async loadLeaderboard() {
        try {
            console.log('Loading leaderboard from:', `${API_BASE_URL}/api/game/leaderboard`);
            const response = await fetch(`${API_BASE_URL}/api/game/leaderboard`);
            const leaderboard = await response.json();

            console.log('Leaderboard response:', response.status, leaderboard);

            if (response.ok) {
                console.log('Leaderboard data loaded:', leaderboard);
                return leaderboard;
            } else {
                console.error('Failed to load leaderboard:', leaderboard);
                return [];
            }
        } catch (error) {
            console.error('Leaderboard error:', error);
            return [];
        }
    }

    isLoggedIn() {
        return !!(this.token && this.user);
    }

    getUser() {
        return this.user;
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
            max-width: 400px;
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

    .loading {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(notificationStyles);
