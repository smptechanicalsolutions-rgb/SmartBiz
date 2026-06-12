// email-service.js
// Email notification service for SmartBiz using EmailJS

class EmailService {
    constructor() {
        // EmailJS configuration - you need to sign up at https://www.emailjs.com/
        this.serviceID = 'service_x34y97v'; // Your EmailJS service ID
        this.templateID = 'template_db5d01s'; // Your EmailJS template ID
        this.publicKey = 'jf790Ir3eE3esib-d'; // Your EmailJS public key
        
        // Admin notification email - set your email here to receive notifications
        this.adminEmail = 'shubp2008@gmail.com'; // Your email for admin notifications
        
        this.isConfigured = false;
        this.init();
    }

    init() {
        // Check if EmailJS is loaded and configured
        if (typeof emailjs !== 'undefined' && 
            this.serviceID !== 'your_service_id' && 
            this.templateID !== 'your_template_id' && 
            this.publicKey !== 'your_public_key') {
            
            emailjs.init(this.publicKey);
            this.isConfigured = true;
        }
    }

    // Send welcome email after signup
    async sendWelcomeEmail(userEmail, userName) {
        if (!this.isConfigured) {
            console.log('EmailJS not configured - skipping welcome email');
            return { success: false, message: 'Email service not configured' };
        }

        try {
            const templateParams = {
                to_email: userEmail,
                to_name: userName,
                from_name: 'SmartBiz Invoice',
                subject: 'Welcome to SmartBiz Invoice Generator!',
                message: `
                    Dear ${userName},

                    Welcome to SmartBiz Invoice Generator! Your account has been successfully created.

                    You can now:
                    - Create professional invoices instantly
                    - Manage multiple invoice templates
                    - Track payments and clients
                    - Access your data from anywhere

                    If you have any questions, feel free to contact our support team.

                    Best regards,
                    The SmartBiz Team
                `
            };

            const response = await emailjs.send(this.serviceID, this.templateID, templateParams);
            return { success: true, message: 'Welcome email sent successfully' };

        } catch (error) {
            console.error('Failed to send welcome email:', error);
            return { success: false, message: 'Failed to send welcome email' };
        }
    }

    // Send login notification email
    async sendLoginNotification(userEmail, userName, loginTime, loginLocation = 'Unknown') {
        if (!this.isConfigured) {
            console.log('EmailJS not configured - skipping login notification');
            return { success: false, message: 'Email service not configured' };
        }

        try {
            const templateParams = {
                to_email: userEmail,
                to_name: userName,
                from_name: 'SmartBiz Invoice',
                subject: 'New Login to Your SmartBiz Account',
                message: `
                    Dear ${userName},

                    We detected a new login to your SmartBiz Invoice Generator account.

                    Login Details:
                    - Time: ${new Date(loginTime).toLocaleString()}
                    - Location: ${loginLocation}
                    - Device: ${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}

                    If this was you, no action is needed.
                    If you didn't recognize this login, please secure your account immediately.

                    Stay safe,
                    The SmartBiz Security Team
                `
            };

            const response = await emailjs.send(this.serviceID, this.templateID, templateParams);
            return { success: true, message: 'Login notification sent successfully' };

        } catch (error) {
            console.error('Failed to send login notification:', error);
            return { success: false, message: 'Failed to send login notification' };
        }
    }

    // Send password reset email
    async sendPasswordResetEmail(userEmail, resetToken) {
        if (!this.isConfigured) {
            console.log('EmailJS not configured - skipping password reset email');
            return { success: false, message: 'Email service not configured' };
        }

        try {
            const resetLink = `${window.location.origin}/reset-password.html?token=${resetToken}`;
            
            const templateParams = {
                to_email: userEmail,
                to_name: userEmail.split('@')[0], // Use email prefix as name
                from_name: 'SmartBiz Invoice',
                subject: 'Password Reset Request - SmartBiz Invoice',
                message: `
                    Hello,

                    You requested to reset your password for your SmartBiz Invoice Generator account.

                    Click the link below to reset your password:
                    ${resetLink}

                    This link will expire in 1 hour for security reasons.

                    If you didn't request this password reset, please ignore this email.

                    Best regards,
                    The SmartBiz Team
                `
            };

            const response = await emailjs.send(this.serviceID, this.templateID, templateParams);
            return { success: true, message: 'Password reset email sent successfully' };

        } catch (error) {
            console.error('Failed to send password reset email:', error);
            return { success: false, message: 'Failed to send password reset email' };
        }
    }

    // Send admin notification for new account creation
    async sendAdminNewAccountNotification(userEmail, userName, signupTime) {
        if (!this.isConfigured || this.adminEmail === 'your.email@gmail.com') {
            console.log('Admin email not configured - skipping admin notification');
            return { success: false, message: 'Admin email not configured' };
        }

        try {
            const templateParams = {
                to_email: this.adminEmail,
                to_name: 'Admin',
                from_name: 'SmartBiz System',
                subject: '🎉 New Account Created - SmartBiz Invoice',
                message: `
                    🎉 NEW USER REGISTRATION ALERT 🎉

                    A new user has just created an account on SmartBiz Invoice Generator!

                    User Details:
                    • Name: ${userName}
                    • Email: ${userEmail}
                    • Signup Time: ${new Date(signupTime).toLocaleString()}
                    • IP Location: ${await this.getUserLocation()}

                    Total Users: ${this.getTotalUserCount()}

                    This is an automated notification from SmartBiz Invoice System.
                `
            };

            const response = await emailjs.send(this.serviceID, this.templateID, templateParams);
            console.log('Admin notification sent for new account:', userEmail);
            return { success: true, message: 'Admin notification sent successfully' };

        } catch (error) {
            console.error('Failed to send admin notification for new account:', error);
            return { success: false, message: 'Failed to send admin notification' };
        }
    }

    // Send admin notification for user login
    async sendAdminLoginNotification(userEmail, userName, loginTime) {
        if (!this.isConfigured || this.adminEmail === 'your.email@gmail.com') {
            console.log('Admin email not configured - skipping admin login notification');
            return { success: false, message: 'Admin email not configured' };
        }

        try {
            const location = await this.getUserLocation();
            const device = navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop';
            
            const templateParams = {
                to_email: this.adminEmail,
                to_name: 'Admin',
                from_name: 'SmartBiz System',
                subject: '🔐 User Login Activity - SmartBiz Invoice',
                message: `
                    🔐 USER LOGIN ACTIVITY 🔐

                    A user has just logged into SmartBiz Invoice Generator!

                    User Details:
                    • Name: ${userName}
                    • Email: ${userEmail}
                    • Login Time: ${new Date(loginTime).toLocaleString()}
                    • Location: ${location}
                    • Device: ${device}

                    Today's Logins: ${this.getTodayLoginCount()}

                    This is an automated notification from SmartBiz Invoice System.
                `
            };

            const response = await emailjs.send(this.serviceID, this.templateID, templateParams);
            console.log('Admin notification sent for user login:', userEmail);
            return { success: true, message: 'Admin login notification sent successfully' };

        } catch (error) {
            console.error('Failed to send admin login notification:', error);
            return { success: false, message: 'Failed to send admin login notification' };
        }
    }

    // Get total user count from localStorage
    getTotalUserCount() {
        try {
            const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            return users.length;
        } catch (error) {
            return 'Unknown';
        }
    }

    // Get today's login count
    getTodayLoginCount() {
        try {
            const today = new Date().toDateString();
            const loginLog = JSON.parse(localStorage.getItem('loginLog') || '[]');
            return loginLog.filter(log => new Date(log.timestamp).toDateString() === today).length;
        } catch (error) {
            return 'Unknown';
        }
    }

    // Get user location (approximate)
    async getUserLocation() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            return `${data.city}, ${data.country_name}`;
        } catch (error) {
            return 'Unknown';
        }
    }

    // Show setup instructions for EmailJS
    showSetupInstructions() {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    EMAILJS SETUP INSTRUCTIONS                ║
╠══════════════════════════════════════════════════════════════╣
║ To enable email notifications, follow these steps:           ║
║                                                              ║
║ 1. Sign up at https://www.emailjs.com/                       ║
║ 2. Create an email service (Gmail, Outlook, etc.)            ║
║ 3. Create an email template                                  ║
║ 4. Update the configuration in js/email-service.js:          ║
║                                                              ║
║    this.serviceID = 'your_actual_service_id';               ║
║    this.templateID = 'your_actual_template_id';             ║
║    this.publicKey = 'your_actual_public_key';               ║
║                                                              ║
║ 5. Add this script to your HTML pages:                       ║
║    <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script> ║
║                                                              ║
║ Your users will then receive email notifications!           ║
╚══════════════════════════════════════════════════════════════╝
        `);
    }
}

// Create global email service instance
const emailService = new EmailService();

// Show setup instructions on load
emailService.showSetupInstructions();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailService;
} else {
    window.EmailService = EmailService;
    window.emailService = emailService;
}
