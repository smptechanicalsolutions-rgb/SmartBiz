// auth-guard.js
// Authentication Guard - Protects pages and redirects unauthenticated users with animations

class AuthGuard {
    constructor() {
        this.protectedPages = [
            'home.html',
            'dashboard.html',
            'invoice.html',
            'quotation-history.html',
            'sale-history.html',
            'payment-receipt-history.html',
            'delivery-challan-history.html',
            'sale-return.html',
            'settings.html',
            'personal-info.html',
            'preview.html',
            'company-card-generator.html'
        ];
        
        this.publicPages = [
            'login.html',
            'signup.html',
            'forgot.html',
            'reset-password.html',
            'verify-email.html',
            'resend.html',
            'index.html',
            'help-support.html',
            'privacy-policy.html',
            'terms-of-service.html',
            'user-guide.html'
        ];
    }

    /**
     * Check if user is currently logged in
     */
    isLoggedIn() {
        try {
            const session = localStorage.getItem('smarbiz_session');
            if (!session) return false;

            const sessionData = JSON.parse(session);
            
            // Check if session is still valid (not expired)
            if (sessionData.expiresAt && sessionData.expiresAt < Date.now()) {
                localStorage.removeItem('smarbiz_session');
                return false;
            }

            return sessionData.user ? true : false;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get current logged-in user
     */
    getCurrentUser() {
        try {
            const session = localStorage.getItem('smarbiz_session');
            if (!session) return null;

            const sessionData = JSON.parse(session);
            
            if (sessionData.expiresAt && sessionData.expiresAt < Date.now()) {
                localStorage.removeItem('smarbiz_session');
                return null;
            }

            return sessionData.user || null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Get current page name
     */
    getCurrentPageName() {
        return window.location.pathname.split('/').pop() || 'index.html';
    }

    /**
     * Check if current page requires authentication
     */
    isProtectedPage() {
        const currentPage = this.getCurrentPageName();
        return this.protectedPages.some(page => currentPage.includes(page));
    }

    /**
     * Check if current page is a public auth page
     */
    isPublicAuthPage() {
        const currentPage = this.getCurrentPageName();
        return this.publicPages.some(page => currentPage.includes(page));
    }

    /**
     * Redirect to login with animation
     */
    redirectToLogin(reason = 'sessionExpired') {
        // Show animated modal before redirecting
        this.showLoginModal(reason);
    }

    /**
     * Show animated login required modal
     */
    showLoginModal(reason = 'sessionExpired') {
        // Create modal container
        const modal = document.createElement('div');
        modal.id = 'auth-required-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease-out;
            backdrop-filter: blur(4px);
        `;

        // Create modal content
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
            animation: slideUp 0.4s ease-out;
        `;

        function buildIcon(iconType) {
            const base = `
                <div style="width: 88px; height: 88px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); box-shadow: 0 18px 40px rgba(102, 126, 234, 0.28);">
            `;

            const icons = {
                lock: `
                    <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="6" y="11" width="12" height="9" rx="2.5"></rect>
                        <path d="M8 11V8a4 4 0 0 1 8 0v3"></path>
                    </svg>
                `,
                key: `
                    <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M6 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path>
                        <path d="M8 17h6l2 2 3-3-2-2"></path>
                        <path d="M13 11V8"></path>
                    </svg>
                `,
                warn: `
                    <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 16v-4"></path>
                        <path d="M12 20h.01"></path>
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.72-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    </svg>
                `
            };

            return base + (icons[iconType] || icons.lock) + '</div>';
        }

        const messages = {
            'sessionExpired': {
                iconSvg: buildIcon('key'),
                title: 'Session Expired',
                message: 'Your session has expired. Please login again to continue.',
                buttonText: 'Login Now'
            },
            'loginRequired': {
                iconSvg: buildIcon('lock'),
                title: 'Login Required',
                message: 'You need to login to access this page. Create an account or login to continue.',
                buttonText: 'Login'
            },
            'unauthorized': {
                iconSvg: buildIcon('warn'),
                title: 'Unauthorized Access',
                message: 'You don\'t have permission to access this page. Please login first.',
                buttonText: 'Go to Login'
            }
        };

        const msg = messages[reason] || messages['loginRequired'];

        content.innerHTML = `
            ${msg.iconSvg}
            <h2 style="font-size: 1.5rem; color: #333; margin-bottom: 15px; font-weight: 600;">
                ${msg.title}
            </h2>
            <p style="color: #666; margin-bottom: 30px; font-size: 1rem; line-height: 1.5;">
                ${msg.message}
            </p>
            <div style="display: flex; gap: 10px;">
                <button onclick="authGuard.proceedToLogin()" style="
                    flex: 1;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 10px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                ">
                    ${msg.buttonText}
                </button>
                <button onclick="authGuard.closeLoginModal()" style="
                    flex: 1;
                    background: #f0f0f0;
                    color: #333;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 10px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    Cancel
                </button>
            </div>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // Add CSS animations
        if (!document.getElementById('auth-guard-styles')) {
            const style = document.createElement('style');
            style.id = 'auth-guard-styles';
            style.textContent = `
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideUp {
                    from {
                        transform: translateY(30px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                @keyframes slideOut {
                    from {
                        transform: translateY(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateY(30px);
                        opacity: 0;
                    }
                }

                #auth-required-modal button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Close login modal
     */
    closeLoginModal() {
        const modal = document.getElementById('auth-required-modal');
        if (modal) {
            modal.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => modal.remove(), 300);
        }
    }

    /**
     * Proceed to login page
     */
    proceedToLogin() {
        this.closeLoginModal();
        this.redirectPageWithAnimation('login.html');
    }

    /**
     * Redirect to a page with slide animation
     */
    redirectPageWithAnimation(page, delay = 500) {
        // Add fade-out animation to current page
        document.body.style.animation = 'fadeOut 0.4s ease-out';
        
        setTimeout(() => {
            window.location.href = page;
        }, delay);
    }

    /**
     * Check authentication on page load
     */
    checkAuthentication() {
        const currentPage = this.getCurrentPageName();
        
        // Skip check on certain pages
        if (currentPage.includes('email-test') || currentPage.includes('auto-save')) {
            return;
        }

        if (this.isProtectedPage()) {
            // This is a protected page
            if (!this.isLoggedIn()) {
                // User is not logged in, redirect to login
                console.warn('🔒 Protected page accessed without authentication:', currentPage);
                this.redirectToLogin('loginRequired');
            } else {
                // User is logged in, show welcome message
                const user = this.getCurrentUser();
                console.log('✅ User authenticated:', user.fullName);
                this.updateAuthUI();
            }
        } else if (this.isPublicAuthPage() && this.isLoggedIn()) {
            // User is on a public auth page but already logged in
            // Redirect to home if on login/signup
            if (currentPage.includes('login.html') || currentPage.includes('signup.html')) {
                // Allow them to stay on auth page, but show option to go to home
                this.updateAuthUIForLoggedInUser();
            }
        }
    }

    /**
     * Update UI for authenticated user
     */
    updateAuthUI() {
        const user = this.getCurrentUser();
        if (!user) return;

        // Update any auth status elements
        const authStatusElements = document.querySelectorAll('[data-auth-status]');
        authStatusElements.forEach(el => {
            el.textContent = `Welcome, ${user.fullName}!`;
            el.style.opacity = '0';
            el.style.animation = 'slideIn 0.5s ease-out forwards';
        });

        // Show user in header if available
        const userEmailElements = document.querySelectorAll('#userEmail');
        userEmailElements.forEach(el => {
            el.textContent = user.email;
        });
    }

    /**
     * Update UI when logged-in user views auth pages
     */
    updateAuthUIForLoggedInUser() {
        const user = this.getCurrentUser();
        const banner = document.createElement('div');
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            text-align: center;
            font-size: 0.95rem;
            z-index: 999;
            animation: slideDown 0.4s ease-out;
        `;
        banner.innerHTML = `
            ✅ Already logged in as <strong>${user.email}</strong>
            <button onclick="window.location.href='home.html'" style="
                background: white;
                color: #667eea;
                border: none;
                padding: 5px 15px;
                border-radius: 5px;
                margin-left: 15px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s;
            " onmouseover="this.transform='scale(1.05)'" onmouseout="this.transform='scale(1)'">
                Go to Home
            </button>
        `;
        document.body.appendChild(banner);
        document.body.style.paddingTop = '50px';

        // Add slide down animation
        if (!document.getElementById('auth-guard-slidedown')) {
            const style = document.createElement('style');
            style.id = 'auth-guard-slidedown';
            style.textContent = `
                @keyframes slideDown {
                    from {
                        transform: translateY(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Logout user with animation
     */
    logout() {
        // Show logout animation
        document.body.style.animation = 'fadeOut 0.4s ease-out';
        
        setTimeout(() => {
            localStorage.removeItem('smarbiz_session');
            localStorage.removeItem('auth_current');
            window.location.href = 'login.html';
        }, 400);
    }

    /**
     * Initialize auth guard on page load
     */
    init() {
        // Check authentication when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.checkAuthentication();
            });
        } else {
            this.checkAuthentication();
        }

        // Add fade-out animation style
        if (!document.getElementById('auth-animations')) {
            const style = document.createElement('style');
            style.id = 'auth-animations';
            style.textContent = `
                @keyframes fadeOut {
                    from {
                        opacity: 1;
                    }
                    to {
                        opacity: 0;
                    }
                }

                @keyframes slideIn {
                    from {
                        transform: translateX(-20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                body {
                    transition: opacity 0.4s ease-out;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Add a protected route
     */
    addProtectedPage(pageName) {
        if (!this.protectedPages.includes(pageName)) {
            this.protectedPages.push(pageName);
        }
    }

    /**
     * Check if user should remain logged in
     */
    validateSession() {
        const session = localStorage.getItem('smarbiz_session');
        if (!session) return false;

        try {
            const sessionData = JSON.parse(session);
            if (sessionData.expiresAt < Date.now()) {
                localStorage.removeItem('smarbiz_session');
                return false;
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Show notification in top-right corner
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Create global auth guard instance
const authGuard = new AuthGuard();

// Initialize on page load
authGuard.init();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthGuard;
} else {
    window.AuthGuard = AuthGuard;
    window.authGuard = authGuard;
}
