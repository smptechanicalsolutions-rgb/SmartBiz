// backup-service.js
// Backup and restore functionality for SmartBiz Invoice Generator
// Downloads backup as JSON file - honest, transparent backup system

class BackupService {
    constructor() {
        this.backupFileName = 'smarbiz-backup';
        this.backupVersion = '1.0';
    }

    /**
     * Get all data that needs to be backed up
     */
    getAllData() {
        const data = {
            version: this.backupVersion,
            timestamp: new Date().toISOString(),
            backup: {
                invoiceData: localStorage.getItem('invoiceData') ? JSON.parse(localStorage.getItem('invoiceData')) : null,
                invoiceHistory: localStorage.getItem('invoiceHistory') ? JSON.parse(localStorage.getItem('invoiceHistory')) : null,
                savedClients: localStorage.getItem('savedClients') ? JSON.parse(localStorage.getItem('savedClients')) : null,
                registeredUsers: localStorage.getItem('registeredUsers') ? JSON.parse(localStorage.getItem('registeredUsers')) : null,
                smarbizSession: localStorage.getItem('smarbiz_session') ? JSON.parse(localStorage.getItem('smarbiz_session')) : null,
                userSettings: localStorage.getItem('userSettings') ? JSON.parse(localStorage.getItem('userSettings')) : null,
                notifications: localStorage.getItem('smarbiz_notifications') ? JSON.parse(localStorage.getItem('smarbiz_notifications')) : null,
                autoSaveSettings: localStorage.getItem('autoSaveSettings') ? JSON.parse(localStorage.getItem('autoSaveSettings')) : null,
                menuData: localStorage.getItem('menuData') ? JSON.parse(localStorage.getItem('menuData')) : null,
                loginLog: localStorage.getItem('loginLog') ? JSON.parse(localStorage.getItem('loginLog')) : null,
                paymentHistory: localStorage.getItem('paymentHistory') ? JSON.parse(localStorage.getItem('paymentHistory')) : null,
                quoteHistory: localStorage.getItem('quoteHistory') ? JSON.parse(localStorage.getItem('quoteHistory')) : null,
            }
        };
        return data;
    }

    /**
     * Download backup as JSON file
     */
    downloadBackup() {
        try {
            const data = this.getAllData();
            const jsonString = JSON.stringify(data, null, 2);
            
            // Create blob
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${this.backupFileName}-${new Date().toISOString().split('T')[0]}.json`;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            // Notify success
            if (window.notificationService) {
                notificationService.notifyBackupCreated();
            }
            
            return { success: true, message: 'Backup downloaded successfully' };
        } catch (error) {
            console.error('Backup download failed:', error);
            if (window.notificationService) {
                notificationService.notifyError('Failed to create backup: ' + error.message);
            }
            return { success: false, message: error.message };
        }
    }

    /**
     * Get backup file size (estimated)
     */
    getBackupSize() {
        const data = this.getAllData();
        const jsonString = JSON.stringify(data);
        const bytes = new Blob([jsonString]).size;
        return this.formatBytes(bytes);
    }

    /**
     * Restore backup from JSON file
     * @param {File} file - JSON backup file
     */
    restoreBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validate backup structure
                    if (!data.backup || !data.version) {
                        throw new Error('Invalid backup file format');
                    }
                    
                    // Clear existing data
                    this.clearAllData();
                    
                    // Restore data
                    Object.entries(data.backup).forEach(([key, value]) => {
                        if (value !== null) {
                            const storageKey = key === 'smarbizSession' ? 'smarbiz_session' : key;
                            try {
                                localStorage.setItem(storageKey, JSON.stringify(value));
                            } catch (e) {
                                console.warn(`Failed to restore ${storageKey}:`, e);
                            }
                        }
                    });
                    
                    if (window.notificationService) {
                        notificationService.notifyBackupRestored();
                    }
                    
                    resolve({ success: true, message: 'Backup restored successfully' });
                } catch (error) {
                    console.error('Backup restore failed:', error);
                    if (window.notificationService) {
                        notificationService.notifyError('Failed to restore backup: ' + error.message);
                    }
                    reject(error);
                }
            };
            
            reader.onerror = (error) => {
                console.error('File read error:', error);
                if (window.notificationService) {
                    notificationService.notifyError('Failed to read backup file');
                }
                reject(error);
            };
            
            reader.readAsText(file);
        });
    }

    /**
     * Clear all stored data
     */
    clearAllData() {
        const keys = [
            'invoiceData',
            'invoiceHistory',
            'savedClients',
            'registeredUsers',
            'smarbiz_session',
            'userSettings',
            'smarbiz_notifications',
            'autoSaveSettings',
            'menuData',
            'loginLog',
            'paymentHistory',
            'quoteHistory'
        ];
        
        keys.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.warn(`Failed to clear ${key}:`, e);
            }
        });
    }

    /**
     * Get list of stored keys and their sizes
     */
    getDataSummary() {
        const summary = {
            totalSize: 0,
            itemCount: 0,
            items: {}
        };

        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            try {
                const value = localStorage.getItem(key);
                const size = new Blob([value]).size;
                summary.totalSize += size;
                
                if (key.includes('invoice') || key.includes('client') || key.includes('user') || key.includes('payment') || key.includes('quote')) {
                    summary.items[key] = {
                        size: this.formatBytes(size),
                        sizeBytes: size
                    };
                    summary.itemCount++;
                }
            } catch (e) {
                console.warn(`Failed to get size for ${key}:`, e);
            }
        });

        summary.totalSizeFormatted = this.formatBytes(summary.totalSize);
        return summary;
    }

    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Export specific invoice as JSON
     */
    exportInvoice(invoiceNo) {
        try {
            const allInvoices = JSON.parse(localStorage.getItem('invoiceHistory') || '[]');
            const invoice = allInvoices.find(inv => inv.invoiceNo === invoiceNo);
            
            if (!invoice) {
                throw new Error('Invoice not found');
            }
            
            const jsonString = JSON.stringify(invoice, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${invoiceNo}-${new Date().toISOString().split('T')[0]}.json`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            return { success: true, message: 'Invoice exported successfully' };
        } catch (error) {
            console.error('Invoice export failed:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Create a backup schedule reminder
     */
    setBackupReminder(days = 7) {
        const lastBackup = localStorage.getItem('lastBackupDate');
        const now = new Date();
        
        if (lastBackup) {
            const last = new Date(lastBackup);
            const daysDiff = Math.floor((now - last) / (1000 * 60 * 60 * 24));
            
            if (daysDiff >= days) {
                return {
                    shouldBackup: true,
                    daysSinceLastBackup: daysDiff,
                    message: `It's been ${daysDiff} days since your last backup. Consider creating a new one.`
                };
            }
        }
        
        localStorage.setItem('lastBackupDate', now.toISOString());
        return { shouldBackup: false };
    }
}

// Create global backup service instance
const backupService = new BackupService();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackupService;
} else {
    window.BackupService = BackupService;
    window.backupService = backupService;
}
