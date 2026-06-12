// notification-service.js
// Local notification system for SmartBiz Invoice Generator
// This is a client-side notification system with no backend required

class NotificationService {
    constructor() {
        this.notifications = [];
        this.notificationId = 0;
        this.maxNotifications = 5;
        this.defaultDuration = 5000; // 5 seconds
        this.container = null;
        this.pendingQueue = [];
        this.notificationsEnabled = true;
        this.init();
    }

    init() {
        // Load saved settings and notifications from localStorage
        this.loadNotificationSettings();
        this.loadNotifications();

        // Create notification container after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createContainer());
        } else {
            this.createContainer();
        }
    }

    loadNotificationSettings() {
        try {
            const stored = localStorage.getItem('notificationsEnabled');
            this.notificationsEnabled = stored !== null ? JSON.parse(stored) : true;
        } catch (e) {
            this.notificationsEnabled = true;
        }
    }

    setNotificationsEnabled(enabled) {
        this.notificationsEnabled = !!enabled;
        try {
            localStorage.setItem('notificationsEnabled', JSON.stringify(this.notificationsEnabled));
        } catch (e) {
            console.warn('Failed to save notification settings:', e);
        }
        return this.notificationsEnabled;
    }

    areNotificationsEnabled() {
        return this.notificationsEnabled;
    }

    createContainer() {
        if (this.container || document.getElementById('notification-container')) return;

        const body = document.body || document.querySelector('body');
        if (!body) {
            return;
        }

        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
            font-family: 'Inter', sans-serif;
        `;
        body.appendChild(container);
        this.container = container;

        if (this.pendingQueue.length > 0) {
            this.pendingQueue.forEach((element) => this.container.insertBefore(element, this.container.firstChild));
            this.pendingQueue = [];
        }
    }

    /**
     * Show a notification
     * @param {string} message - Notification message
     * @param {string} type - Type: 'info', 'success', 'warning', 'error'
     * @param {number} duration - Duration in milliseconds (0 = persistent)
     */
    show(message, type = 'info', duration = this.defaultDuration) {
        if (!this.areNotificationsEnabled()) {
            return null;
        }

        const notificationId = this.notificationId++;
        const notification = {
            id: notificationId,
            message,
            type,
            timestamp: new Date(),
            read: false
        };

        // Add to notifications list
        this.notifications.unshift(notification);
        
        // Limit stored notifications
        if (this.notifications.length > this.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.maxNotifications);
        }

        // Save to localStorage
        this.saveNotifications();

        // Create and display DOM element
        const element = this.createNotificationElement(notification, duration);

        if (!this.container) {
            this.createContainer();
        }

        if (this.container) {
            this.container.insertBefore(element, this.container.firstChild);
        } else {
            this.pendingQueue.push(element);
        }

        return notificationId;
    }

    createNotificationElement(notification, duration) {
        const element = document.createElement('div');
        const { type, message } = notification;

        const colors = {
            'info': '#3b82f6',
            'success': '#10b981',
            'warning': '#f59e0b',
            'error': '#ef4444'
        };

        const icons = {
            'info': 'fas fa-info-circle',
            'success': 'fas fa-check-circle',
            'warning': 'fas fa-exclamation-circle',
            'error': 'fas fa-times-circle'
        };

        element.style.cssText = `
            background: white;
            border-left: 4px solid ${colors[type]};
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideIn 0.3s ease-out;
            min-height: 60px;
        `;

        element.innerHTML = `
            <i class="${icons[type]}" style="color: ${colors[type]}; font-size: 18px; flex-shrink: 0;"></i>
            <div style="flex: 1; color: #333; font-size: 14px; line-height: 1.4;">${message}</div>
            <button class="close-btn" style="background: none; border: none; color: #999; cursor: pointer; font-size: 18px;">×</button>
        `;

        // Close button handler
        const closeBtn = element.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            element.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => element.remove(), 300);
        });

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (element.parentElement) {
                    element.style.animation = 'slideOut 0.3s ease-out';
                    setTimeout(() => element.remove(), 300);
                }
            }, duration);
        }

        return element;
    }

    saveNotifications() {
        try {
            localStorage.setItem('smarbiz_notifications', JSON.stringify(this.notifications));
        } catch (e) {
            console.warn('Failed to save notifications:', e);
        }
    }

    loadNotifications() {
        try {
            const stored = localStorage.getItem('smarbiz_notifications');
            if (stored) {
                this.notifications = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Failed to load notifications:', e);
            this.notifications = [];
        }
    }

    /**
     * Get all notifications
     */
    getAll() {
        return this.notifications;
    }

    /**
     * Get unread notifications count
     */
    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }

    /**
     * Mark all as read
     */
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.saveNotifications();
    }

    /**
     * Clear all notifications
     */
    clear() {
        this.notifications = [];
        this.saveNotifications();
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    /**
     * Send specific event notifications
     */
    notifyInvoiceCreated(invoiceNo) {
        this.show(`✅ Invoice #${invoiceNo} created successfully!`, 'success');
    }

    notifyInvoiceDownloaded(invoiceNo) {
        this.show(`📥 Invoice #${invoiceNo} downloaded`, 'success');
    }

    notifyBackupCreated() {
        this.show('💾 Backup created successfully', 'success');
    }

    notifyBackupRestored() {
        this.show('♻️ Backup restored successfully', 'success');
    }

    notifyDataSaved() {
        this.show('💾 Data saved', 'success', 2000);
    }

    notifyAutoSaveEnabled() {
        this.show('⚙️ Auto-save enabled', 'info', 3000);
    }

    notifyAutoSaveDisabled() {
        this.show('⚙️ Auto-save disabled', 'info', 3000);
    }

    notifyError(message) {
        this.show(message, 'error');
    }

    notifyWarning(message) {
        this.show(message, 'warning');
    }

    // ===== EMAIL NOTIFICATION SYSTEM (Simulated - No Backend Required) =====
    
    /**
     * Initialize email notification preferences
     */
    initEmailNotifications() {
        if (!localStorage.getItem('emailNotificationsEnabled')) {
            localStorage.setItem('emailNotificationsEnabled', JSON.stringify(true));
        }
        if (!localStorage.getItem('emailNotificationPreferences')) {
            localStorage.setItem('emailNotificationPreferences', JSON.stringify({
                invoiceCreated: true,
                invoiceViewed: true,
                invoicePrinted: true,
                invoiceDownloaded: true,
                quotationCreated: true,
                lowInventory: false,
                systemUpdates: true
            }));
        }
    }

    /**
     * Get email notification preferences
     */
    getEmailPreferences() {
        const prefs = localStorage.getItem('emailNotificationPreferences');
        return prefs ? JSON.parse(prefs) : {};
    }

    /**
     * Update email notification preferences
     */
    updateEmailPreferences(preferences) {
        const current = this.getEmailPreferences();
        const updated = { ...current, ...preferences };
        localStorage.setItem('emailNotificationPreferences', JSON.stringify(updated));
        return updated;
    }

    /**
     * Toggle email notifications
     */
    toggleEmailNotifications(enabled) {
        localStorage.setItem('emailNotificationsEnabled', JSON.stringify(enabled));
        const status = enabled ? 'enabled' : 'disabled';
        this.show(`📧 Email notifications ${status}`, 'info');
        return enabled;
    }

    /**
     * Check if email notifications are enabled
     */
    areEmailNotificationsEnabled() {
        const setting = localStorage.getItem('emailNotificationsEnabled');
        return setting ? JSON.parse(setting) : true;
    }

    /**
     * Send simulated email notification (stores in localStorage, no actual email backend)
     * @param {string} type - Notification type
     * @param {string} title - Email subject
     * @param {string} message - Email body
     * @param {object} details - Additional details
     */
    async sendEmailNotification(type, title, message, details = {}) {
        if (!this.areEmailNotificationsEnabled()) {
            console.log('📧 Email notifications disabled');
            return { success: false, message: 'Email notifications are disabled' };
        }

        const prefs = this.getEmailPreferences();
        if (prefs[type] === false) {
            console.log(`📧 ${type} notifications are disabled in preferences`);
            return { success: false, message: 'This notification type is disabled' };
        }

        const emailNotification = {
            id: 'email_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: type,
            to: details.to || (this.getCurrentUserEmail() || 'user@smartbiz.local'),
            subject: title,
            body: message,
            details: details,
            timestamp: new Date().toISOString(),
            status: 'sent', // simulated status
            read: false
        };

        // Store email notification history
        this.addEmailHistory(emailNotification);

        // Simulate email sending with visual feedback
        console.log('📧 Simulated Email Sent:', {
            to: emailNotification.to,
            subject: title,
            body: message,
            timestamp: emailNotification.timestamp
        });

        // Show UI notification
        this.show(`📧 Email notification sent: "${title}"`, 'success', 3000);

        return {
            success: true,
            message: `Email sent to ${emailNotification.to}`,
            notification: emailNotification
        };
    }

    /**
     * Get current user email from auth system
     */
    getCurrentUserEmail() {
        try {
            const session = JSON.parse(localStorage.getItem('smarbiz_session') || 'null') ||
                            JSON.parse(localStorage.getItem('auth_current') || 'null');
            return session ? session.email : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Add to email notification history
     */
    addEmailHistory(emailNotification) {
        let history = [];
        try {
            history = JSON.parse(localStorage.getItem('emailNotificationHistory') || '[]');
        } catch (e) {
            history = [];
        }

        history.unshift(emailNotification);
        
        // Keep only last 100 emails
        if (history.length > 100) {
            history = history.slice(0, 100);
        }

        localStorage.setItem('emailNotificationHistory', JSON.stringify(history));
    }

    /**
     * Get email notification history
     */
    getEmailHistory(limit = 10) {
        try {
            let history = JSON.parse(localStorage.getItem('emailNotificationHistory') || '[]');
            return history.slice(0, limit);
        } catch (e) {
            return [];
        }
    }

    /**
     * Clear email notification history
     */
    clearEmailHistory() {
        localStorage.setItem('emailNotificationHistory', JSON.stringify([]));
        this.show('📧 Email history cleared', 'info');
        return true;
    }

    /**
     * Get email notification stats
     */
    getEmailStats() {
        const history = this.getEmailHistory(100);
        const stats = {
            total: history.length,
            byType: {},
            lastSent: history.length > 0 ? history[0].timestamp : null
        };

        history.forEach(email => {
            stats.byType[email.type] = (stats.byType[email.type] || 0) + 1;
        });

        return stats;
    }

    // ===== SPECIFIC EMAIL NOTIFICATION METHODS =====

    /**
     * Notify when invoice is created
     */
    async notifyEmailInvoiceCreated(invoiceNo, clientName, amount) {
        const message = `A new invoice has been created.\n\nInvoice Number: ${invoiceNo}\nClient: ${clientName}\nAmount: ₹${amount}\n\nYou can view and manage this invoice from your SmartBiz dashboard.`;
        
        return this.sendEmailNotification(
            'invoiceCreated',
            `Invoice Created: #${invoiceNo}`,
            message,
            { invoiceNo, clientName, amount }
        );
    }

    /**
     * Notify when invoice is viewed
     */
    async notifyEmailInvoiceViewed(invoiceNo, viewerEmail) {
        const message = `Your invoice has been viewed.\n\nInvoice: #${invoiceNo}\nViewed by: ${viewerEmail}\nTime: ${new Date().toLocaleString()}`;
        
        return this.sendEmailNotification(
            'invoiceViewed',
            `Invoice Viewed: #${invoiceNo}`,
            message,
            { invoiceNo, viewerEmail }
        );
    }

    /**
     * Notify when invoice is printed
     */
    async notifyEmailInvoicePrinted(invoiceNo, clientName) {
        const message = `An invoice has been printed.\n\nInvoice: #${invoiceNo}\nClient: ${clientName}\nPrinted at: ${new Date().toLocaleString()}`;
        
        return this.sendEmailNotification(
            'invoicePrinted',
            `Invoice Printed: #${invoiceNo}`,
            message,
            { invoiceNo, clientName }
        );
    }

    /**
     * Notify when invoice is downloaded
     */
    async notifyEmailInvoiceDownloaded(invoiceNo, clientName) {
        const message = `An invoice has been downloaded.\n\nInvoice: #${invoiceNo}\nClient: ${clientName}\nDownloaded at: ${new Date().toLocaleString()}`;
        
        return this.sendEmailNotification(
            'invoiceDownloaded',
            `Invoice Downloaded: #${invoiceNo}`,
            message,
            { invoiceNo, clientName }
        );
    }

    /**
     * Notify when quotation is created
     */
    async notifyEmailQuotationCreated(quotationNo, clientName) {
        const message = `A new quotation has been created.\n\nQuotation: #${quotationNo}\nClient: ${clientName}\nCreated at: ${new Date().toLocaleString()}`;
        
        return this.sendEmailNotification(
            'quotationCreated',
            `Quotation Created: #${quotationNo}`,
            message,
            { quotationNo, clientName }
        );
    }

    /**
     * Notify about low inventory
     */
    async notifyEmailLowInventory(productName, quantity, minQuantity) {
        const message = `⚠️ Low Inventory Alert\n\nProduct: ${productName}\nCurrent Quantity: ${quantity}\nMinimum Required: ${minQuantity}\n\nPlease reorder this product soon.`;
        
        return this.sendEmailNotification(
            'lowInventory',
            `⚠️ Low Inventory Alert: ${productName}`,
            message,
            { productName, quantity, minQuantity }
        );
    }

    /**
     * Send test email notification
     */
    async sendTestEmailNotification() {
        const userEmail = this.getCurrentUserEmail() || 'user@smartbiz.local';
        const message = `This is a test email notification from SmartBiz Invoice Generator.\n\nIf you received this, it means your email notification system is working correctly!\n\nTest Time: ${new Date().toLocaleString()}\nRecipient: ${userEmail}`;
        
        return this.sendEmailNotification(
            'systemUpdates',
            '✅ Test Email Notification',
            message,
            { isTest: true, testEmail: userEmail }
        );
    }

    /**
     * Send system update notification
     */
    async notifyEmailSystemUpdate(title, message) {
        return this.sendEmailNotification(
            'systemUpdates',
            `🔔 ${title}`,
            message,
            { systemUpdate: true }
        );
    }
}

// Create global notification service instance
const notificationService = new NotificationService();

// Initialize email notifications
notificationService.initEmailNotifications();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(420px);
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
            transform: translateX(420px);
            opacity: 0;
        }
    }

    @media (max-width: 640px) {
        #notification-container {
            max-width: calc(100% - 40px) !important;
            right: 20px !important;
            left: 20px !important;
        }
    }
`;
document.head.appendChild(style);

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationService;
} else {
    window.NotificationService = NotificationService;
    window.notificationService = notificationService;
}
