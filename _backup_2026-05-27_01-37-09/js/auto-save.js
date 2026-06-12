// Auto-Save System for SmartBiz Invoice Generator
// Automatically saves user data to prevent data loss

class AutoSave {
    constructor() {
        this.saveInterval = 30000; // 30 seconds (default)
        this.maxRetries = 3;
        this.retryDelay = 2000;
        this.isAutoSaveEnabled = true;
        this.currentData = {};
        this.lastSaveTime = null;
        this.saveQueue = [];
        this.isProcessing = false;
        
        this.init();
    }

    init() {
        // Load auto-save settings
        this.loadSettings();
        
        // Start auto-save if enabled
        if (this.isAutoSaveEnabled) {
            this.startAutoSave();
        }

        // Add event listeners for form changes
        this.addFormListeners();
        
        // Add keyboard shortcuts
        this.addKeyboardShortcuts();
        
        // Handle page visibility changes
        this.addVisibilityListeners();
        
        // Handle beforeunload (page close)
        this.addBeforeUnloadListener();
        
        console.log('Auto-save system initialized');
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('autoSaveSettings') || '{}');
        this.saveInterval = settings.saveInterval || 30000;
        this.isAutoSaveEnabled = settings.enabled !== false;
    }

    saveSettings() {
        const settings = {
            saveInterval: this.saveInterval,
            enabled: this.isAutoSaveEnabled
        };
        localStorage.setItem('autoSaveSettings', JSON.stringify(settings));
    }

    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(() => {
            this.saveAllData();
        }, this.saveInterval);
        
        console.log(`Auto-save started: saves every ${this.saveInterval / 1000} seconds`);
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
        console.log('Auto-save stopped');
    }

    addFormListeners() {
        // Listen for input changes on all forms
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                this.markAsChanged(e.target.form);
                this.queueSave(e.target.form);
            }
        });

        // Listen for change events
        document.addEventListener('change', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                this.markAsChanged(e.target.form);
                this.queueSave(e.target.form);
            }
        });

        // Listen for CKEditor changes (if present)
        if (typeof CKEDITOR !== 'undefined') {
            CKEDITOR.on('instanceReady', () => {
                for (const instanceName in CKEDITOR.instances) {
                    CKEDITOR.instances[instanceName].on('change', () => {
                        this.markAsChanged(document.querySelector('.ckeditor-form'));
                        this.queueSave(document.querySelector('.ckeditor-form'));
                    });
                }
            });
        }
    }

    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+S or Cmd+S to save manually
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveAllData();
                this.showNotification('Data saved manually', 'success');
            }
        });
    }

    addVisibilityListeners() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Save when page becomes hidden
                this.saveAllData();
            } else {
                // When page becomes visible again, check for conflicts
                this.checkForConflicts();
            }
        });
    }

    addBeforeUnloadListener() {
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }

    markAsChanged(form) {
        if (form) {
            form.dataset.changed = 'true';
            form.dataset.lastChange = Date.now();
        }
    }

    hasUnsavedChanges() {
        const forms = document.querySelectorAll('form[data-changed="true"]');
        return forms.length > 0;
    }

    queueSave(form) {
        if (!form) return;
        
        const formData = this.getFormData(form);
        const saveItem = {
            form: form,
            data: formData,
            timestamp: Date.now()
        };
        
        // Remove existing queued save for this form
        this.saveQueue = this.saveQueue.filter(item => item.form !== form);
        
        // Add new save to queue
        this.saveQueue.push(saveItem);
        
        // Process queue with debounce
        this.processQueue();
    }

    async processQueue() {
        if (this.isProcessing || this.saveQueue.length === 0) return;
        
        this.isProcessing = true;
        
        try {
            while (this.saveQueue.length > 0) {
                const saveItem = this.saveQueue.shift();
                await this.saveFormData(saveItem.form, saveItem.data);
            }
        } finally {
            this.isProcessing = false;
        }
    }

    getFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        // Get all form fields
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Add special fields
        data.formId = form.id || 'unnamed-form';
        data.pageUrl = window.location.pathname;
        data.timestamp = Date.now();
        
        // Get CKEditor data if present
        if (typeof CKEDITOR !== 'undefined') {
            for (const instanceName in CKEDITOR.instances) {
                data[instanceName] = CKEDITOR.instances[instanceName].getData();
            }
        }
        
        return data;
    }

    async saveFormData(form, data) {
        if (!form || !data) return;
        
        const formId = data.formId;
        const pageUrl = data.pageUrl;
        
        try {
            // Get existing saved data
            const savedData = JSON.parse(localStorage.getItem('autoSaveData') || '{}');
            
            // Initialize page data if not exists
            if (!savedData[pageUrl]) {
                savedData[pageUrl] = {};
            }
            
            // Save form data
            savedData[pageUrl][formId] = data;
            
            // Update metadata
            savedData[pageUrl][formId].lastSaved = Date.now();
            savedData[pageUrl][formId].saveCount = (savedData[pageUrl][formId].saveCount || 0) + 1;
            
            // Save to localStorage
            localStorage.setItem('autoSaveData', JSON.stringify(savedData));
            
            // Mark form as saved
            form.dataset.changed = 'false';
            this.lastSaveTime = Date.now();
            
            console.log(`Auto-saved form: ${formId}`);
            
        } catch (error) {
            console.error('Auto-save failed:', error);
            this.showNotification('Auto-save failed. Please save manually.', 'error');
        }
    }

    async saveAllData() {
        const forms = document.querySelectorAll('form');
        
        for (const form of forms) {
            if (form.dataset.changed === 'true') {
                const data = this.getFormData(form);
                await this.saveFormData(form, data);
            }
        }
        
        if (this.hasUnsavedChanges()) {
            this.showNotification('All data auto-saved', 'success');
        }
    }

    restoreFormData(form) {
        if (!form) return;
        
        const formId = form.id || 'unnamed-form';
        const pageUrl = window.location.pathname;
        
        try {
            const savedData = JSON.parse(localStorage.getItem('autoSaveData') || '{}');
            
            if (savedData[pageUrl] && savedData[pageUrl][formId]) {
                const data = savedData[pageUrl][formId];
                
                // Restore form fields
                for (const [key, value] of Object.entries(data)) {
                    if (key !== 'formId' && key !== 'pageUrl' && key !== 'timestamp' && 
                        key !== 'lastSaved' && key !== 'saveCount') {
                        
                        const field = form.querySelector(`[name="${key}"]`);
                        if (field) {
                            if (field.type === 'checkbox' || field.type === 'radio') {
                                field.checked = value === 'true';
                            } else {
                                field.value = value;
                            }
                        }
                    }
                }
                
                // Restore CKEditor data if present
                if (typeof CKEDITOR !== 'undefined') {
                    for (const instanceName in CKEDITOR.instances) {
                        if (data[instanceName]) {
                            CKEDITOR.instances[instanceName].setData(data[instanceName]);
                        }
                    }
                }
                
                // Show restore notification
                const saveTime = new Date(data.lastSaved).toLocaleString();
                this.showNotification(`Data restored from ${saveTime}`, 'info');
                
                console.log(`Restored form data for: ${formId}`);
            }
        } catch (error) {
            console.error('Failed to restore form data:', error);
        }
    }

    restoreAllForms() {
        const forms = document.querySelectorAll('form');
        
        for (const form of forms) {
            this.restoreFormData(form);
        }
    }

    checkForConflicts() {
        // Check if data was modified in another tab
        const currentData = JSON.parse(localStorage.getItem('autoSaveData') || '{}');
        const pageUrl = window.location.pathname;
        
        if (currentData[pageUrl]) {
            const lastModified = Math.max(...Object.values(currentData[pageUrl]).map(form => form.lastSaved || 0));
            
            if (lastModified > this.lastSaveTime) {
                this.showNotification('Data was modified in another tab. Data has been refreshed.', 'warning');
                this.restoreAllForms();
            }
        }
    }

    clearAutoSaveData() {
        if (confirm('Are you sure you want to clear all auto-saved data?')) {
            localStorage.removeItem('autoSaveData');
            this.showNotification('Auto-saved data cleared', 'success');
        }
    }

    getAutoSaveStatus() {
        const forms = document.querySelectorAll('form');
        const changedForms = document.querySelectorAll('form[data-changed="true"]');
        
        return {
            totalForms: forms.length,
            changedForms: changedForms.length,
            lastSaveTime: this.lastSaveTime,
            isEnabled: this.isAutoSaveEnabled,
            saveInterval: this.saveInterval
        };
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `auto-save-notification auto-save-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getNotificationColor(type) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        return colors[type] || '#17a2b8';
    }

    // Public API methods
    enable() {
        this.isAutoSaveEnabled = true;
        this.saveSettings();
        this.startAutoSave();
        this.showNotification('Auto-save enabled', 'success');
    }

    disable() {
        this.isAutoSaveEnabled = false;
        this.saveSettings();
        this.stopAutoSave();
        this.showNotification('Auto-save disabled', 'warning');
    }

    setSaveInterval(interval) {
        this.saveInterval = interval;
        this.saveSettings();
        if (this.isAutoSaveEnabled) {
            this.startAutoSave();
        }
        this.showNotification(`Save interval set to ${interval / 1000} seconds`, 'info');
    }

    saveNow() {
        this.saveAllData();
    }

    destroy() {
        this.stopAutoSave();
        this.saveAllData();
    }
}

// Initialize auto-save when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.autoSave = new AutoSave();
    
    // Restore form data on page load
    setTimeout(() => {
        window.autoSave.restoreAllForms();
    }, 500);
});

// Make AutoSave available globally
window.AutoSave = AutoSave;
