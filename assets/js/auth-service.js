// auth-service.js
// Complete Authentication Service for SmartBiz Invoice Generator

class AuthService {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = this.loadCurrentUser();
        this.init();
    }

    init() {
        // Auto-logout after 24 hours of inactivity
        this.setupAutoLogout();
        // Check session on page load
        this.checkSession();
    }

    // Load users from localStorage
    loadUsers() {
        const users = localStorage.getItem('smarbiz_users');
        return users ? JSON.parse(users) : {};
    }

    // Save users to localStorage
    saveUsers() {
        localStorage.setItem('smarbiz_users', JSON.stringify(this.users));
    }

    // Load current user from session
    loadCurrentUser() {
        const session = localStorage.getItem('smarbiz_session');
        if (session) {
            const sessionData = JSON.parse(session);
            if (sessionData.expiresAt > Date.now()) {
                return sessionData.user;
            } else {
                this.logout(); // Session expired
                return null;
            }
        }
        return null;
    }

    // Save current user session
    saveSession(user, rememberMe = false) {
        const sessionData = {
            user: user,
            loginTime: Date.now(),
            expiresAt: rememberMe ? Date.now() + (7 * 24 * 60 * 60 * 1000) : Date.now() + (24 * 60 * 60 * 1000) // 7 days or 24 hours
        };
        localStorage.setItem('smarbiz_session', JSON.stringify(sessionData));
        this.currentUser = user;
    }

    // Simple password hashing (for demo purposes)
    async hashPassword(password) {
        // Simple hash for demo - in production use bcrypt
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return btoa(hash.toString()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    }

    // Verify password
    async verifyPassword(password, hashedPassword) {
        const inputHash = await this.hashPassword(password);
        return inputHash === hashedPassword;
    }

    // Validate email
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Validate password strength
    validatePassword(password) {
        const errors = [];
        
        if (password.length < 6) {
            errors.push('Password must be at least 6 characters long');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Register new user
    async register(fullName, email, password, confirmPassword) {
        try {
            // Validation
            if (!fullName || !email || !password || !confirmPassword) {
                return { success: false, message: 'Please fill in all fields' };
            }

            if (!this.validateEmail(email)) {
                return { success: false, message: 'Please enter a valid email address' };
            }

            if (password !== confirmPassword) {
                return { success: false, message: 'Passwords do not match' };
            }

            const passwordValidation = this.validatePassword(password);
            if (!passwordValidation.isValid) {
                return { success: false, message: passwordValidation.errors.join(', ') };
            }

            // Check if user already exists
            if (this.users[email]) {
                return { success: false, message: 'An account with this email already exists' };
            }

            // Hash password and create user
            const hashedPassword = await this.hashPassword(password);
            const user = {
                id: Date.now().toString(),
                fullName: fullName,
                email: email,
                password: hashedPassword,
                createdAt: new Date().toISOString(),
                isActive: true
            };

            // Save user
            this.users[email] = user;
            this.saveUsers();

            return { 
                success: true, 
                message: 'Account created successfully! You can now login.',
                user: { id: user.id, fullName: user.fullName, email: user.email }
            };

        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Registration failed. Please try again.' };
        }
    }

    // Login user
    async login(email, password, rememberMe = false) {
        try {
            // Validation
            if (!email || !password) {
                return { success: false, message: 'Please fill in all fields' };
            }

            if (!this.validateEmail(email)) {
                return { success: false, message: 'Please enter a valid email address' };
            }

            // Check if user exists
            const user = this.users[email];
            if (!user) {
                return { success: false, message: 'No account found with this email' };
            }

            // Verify password
            const isValidPassword = await this.verifyPassword(password, user.password);
            if (!isValidPassword) {
                return { success: false, message: 'Incorrect password' };
            }

            // Check if user is active
            if (!user.isActive) {
                return { success: false, message: 'Your account has been deactivated' };
            }

            // Create session
            const sessionUser = { 
                id: user.id, 
                fullName: user.fullName, 
                email: user.email 
            };
            this.saveSession(sessionUser, rememberMe);

            // Update last login
            user.lastLogin = new Date().toISOString();
            this.saveUsers();

            return { 
                success: true, 
                message: 'Login successful! Redirecting...',
                user: sessionUser
            };

        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Login failed. Please try again.' };
        }
    }

    // Get a login page URL from the current location.
    getLoginPageUrl() {
        if (window.location.protocol.startsWith('http')) {
            return '/login.html';
        }
        // For file:// protocol, navigate to login.html in the same directory
        // All HTML files are at the same level (root of the app)
        const currentPath = window.location.pathname;
        const lastSlash = currentPath.lastIndexOf('/');
        const baseDir = currentPath.substring(0, lastSlash + 1);
        return baseDir + 'login.html';
    }

    // Logout user
    logout() {
        localStorage.removeItem('smarbiz_session');
        this.currentUser = null;
        window.location.href = this.getLoginPageUrl();
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Setup auto-logout
    setupAutoLogout() {
        setInterval(() => {
            this.checkSession();
        }, 60000); // Check every minute
    }

    // Check session validity
    checkSession() {
        const session = localStorage.getItem('smarbiz_session');
        if (session) {
            const sessionData = JSON.parse(session);
            if (sessionData.expiresAt <= Date.now()) {
                this.logout();
            }
        }
    }

    // Update user profile
    async updateProfile(fullName, email) {
        try {
            if (!this.currentUser) {
                return { success: false, message: 'No user logged in' };
            }

            const oldEmail = this.currentUser.email;
            const user = this.users[oldEmail];

            if (!user) {
                return { success: false, message: 'User not found' };
            }

            // Update user data
            user.fullName = fullName;
            if (email !== oldEmail) {
                // Email change - check if new email exists
                if (this.users[email]) {
                    return { success: false, message: 'This email is already in use' };
                }
                user.email = email;
                delete this.users[oldEmail];
                this.users[email] = user;
            }

            this.saveUsers();

            // Update current user session
            this.currentUser = { id: user.id, fullName: user.fullName, email: user.email };
            this.saveSession(this.currentUser);

            return { success: true, message: 'Profile updated successfully' };

        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, message: 'Failed to update profile' };
        }
    }

    // Change password
    async changePassword(currentPassword, newPassword, confirmPassword) {
        try {
            if (!this.currentUser) {
                return { success: false, message: 'No user logged in' };
            }

            const user = this.users[this.currentUser.email];
            if (!user) {
                return { success: false, message: 'User not found' };
            }

            // Verify current password
            const isValidCurrentPassword = await this.verifyPassword(currentPassword, user.password);
            if (!isValidCurrentPassword) {
                return { success: false, message: 'Current password is incorrect' };
            }

            // Validate new password
            if (newPassword !== confirmPassword) {
                return { success: false, message: 'New passwords do not match' };
            }

            const passwordValidation = this.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                return { success: false, message: passwordValidation.errors.join(', ') };
            }

            // Update password
            user.password = await this.hashPassword(newPassword);
            this.saveUsers();

            return { success: true, message: 'Password changed successfully' };

        } catch (error) {
            console.error('Password change error:', error);
            return { success: false, message: 'Failed to change password' };
        }
    }

    // Delete account
    async deleteAccount(password) {
        try {
            if (!this.currentUser) {
                return { success: false, message: 'No user logged in' };
            }

            const user = this.users[this.currentUser.email];
            if (!user) {
                return { success: false, message: 'User not found' };
            }

            // Verify password
            const isValidPassword = await this.verifyPassword(password, user.password);
            if (!isValidPassword) {
                return { success: false, message: 'Password is incorrect' };
            }

            // Delete user
            delete this.users[this.currentUser.email];
            this.saveUsers();

            // Logout
            this.logout();

            return { success: true, message: 'Account deleted successfully' };

        } catch (error) {
            console.error('Account deletion error:', error);
            return { success: false, message: 'Failed to delete account' };
        }
    }
}

// Create global auth service instance
const authService = new AuthService();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthService;
} else {
    window.AuthService = AuthService;
    window.authService = authService;
}
