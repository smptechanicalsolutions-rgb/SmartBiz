# Quick Start Guide - Notifications & Backup

## Notification System Quick Start

### Basic Usage
```javascript
// Show a success notification
notificationService.show('Invoice saved!', 'success');

// Show an error with custom duration
notificationService.show('Something went wrong', 'error', 10000);

// Show persistent notification (manual close required)
notificationService.show('Important message', 'warning', 0);
```

### Pre-built Notification Methods
```javascript
notificationService.notifyInvoiceCreated('INV-001');
notificationService.notifyInvoiceDownloaded('INV-001');
notificationService.notifyBackupCreated();
notificationService.notifyBackupRestored();
notificationService.notifyDataSaved();
notificationService.notifyAutoSaveEnabled();
notificationService.notifyAutoSaveDisabled();
notificationService.notifyError('Error message');
notificationService.notifyWarning('Warning message');
```

### Getting Notification Data
```javascript
// Get all notifications
const all = notificationService.getAll();
console.log(all); // Array of notification objects

// Get unread count
const unread = notificationService.getUnreadCount();
console.log(unread); // Number

// Mark all as read
notificationService.markAllAsRead();

// Clear all
notificationService.clear();
```

---

## Backup System Quick Start

### Download Backup
```javascript
// One-line backup download
backupService.downloadBackup();

// Get status
const result = backupService.downloadBackup();
if (result.success) {
    console.log('Backup created');
}
```

### Restore from Backup
```javascript
// When user selects file
const file = document.getElementById('fileInput').files[0];

backupService.restoreBackup(file)
    .then(result => {
        console.log('Restore successful:', result);
    })
    .catch(error => {
        console.error('Restore failed:', error);
    });
```

### Get Backup Info
```javascript
// Get size of backup
const size = backupService.getBackupSize();
console.log(size); // "2.5 MB"

// Get full data summary
const summary = backupService.getDataSummary();
console.log(summary.totalSizeFormatted); // "2.5 MB"
console.log(summary.itemCount); // 12
console.log(summary.items); // { invoiceHistory: {...}, ... }
```

### Backup Reminders
```javascript
// Check if backup is needed (after 7 days)
const reminder = backupService.setBackupReminder(7);

if (reminder.shouldBackup) {
    console.log(reminder.message);
    // "It's been 10 days since your last backup..."
}

// Show notification to user
if (reminder.shouldBackup && typeof notificationService !== 'undefined') {
    notificationService.show(reminder.message, 'warning');
}
```

### Export Single Invoice
```javascript
// Export specific invoice
backupService.exportInvoice('INV-001');
// Downloads: invoice-INV-001-2026-05-24.json
```

---

## Integration Examples

### When User Creates Invoice
```javascript
async function createInvoice(data) {
    // ... your invoice creation logic ...
    
    const invoiceNo = 'INV-001';
    
    // Save and notify
    notificationService.notifyInvoiceCreated(invoiceNo);
    
    // Auto-backup every hour
    if (!window.lastBackupTime || Date.now() - window.lastBackupTime > 3600000) {
        backupService.downloadBackup();
        window.lastBackupTime = Date.now();
    }
}
```

### When User Downloads Invoice
```javascript
function downloadInvoice(invoiceNo) {
    // ... download logic ...
    
    notificationService.notifyInvoiceDownloaded(invoiceNo);
}
```

### When Auto-save Runs
```javascript
function autoSaveData(data) {
    localStorage.setItem('invoiceData', JSON.stringify(data));
    
    // Brief notification
    notificationService.notifyDataSaved();
}
```

### When Auto-save Settings Change
```javascript
function enableAutoSave() {
    localStorage.setItem('autoSave', 'true');
    notificationService.notifyAutoSaveEnabled();
}

function disableAutoSave() {
    localStorage.setItem('autoSave', 'false');
    notificationService.notifyAutoSaveDisabled();
}
```

### On Page Load - Check Backup Status
```javascript
document.addEventListener('DOMContentLoaded', function() {
    // Check if backup reminder needed
    if (typeof backupService !== 'undefined') {
        const reminder = backupService.setBackupReminder(7);
        if (reminder.shouldBackup && typeof notificationService !== 'undefined') {
            notificationService.show(
                '💾 ' + reminder.message,
                'warning',
                0 // persistent
            );
        }
    }
});
```

---

## Settings Page Usage

### For Users
1. **Enable/Disable Notifications**
   - Go to Settings
   - Find "Notifications" section
   - Toggle "Enable notifications"

2. **Test Notifications**
   - Settings → Notifications
   - Click "Send test" button
   - See test notification appear

3. **View Notification History**
   - Settings → Notifications
   - Click "View history"
   - See last 5 notifications
   - Can clear history

4. **Download Backup**
   - Settings → Your data
   - Check backup summary
   - Click "Download"
   - File saves to Downloads folder

5. **Restore Backup**
   - Settings → Your data
   - Click "Restore"
   - Select previous backup JSON file
   - Confirm replacement
   - Data restored

6. **Clear Temporary Data**
   - Settings → Your data
   - Click "Clear"
   - Removes only cache (keeps important data)

---

## Notification Types & Icons

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `success` | ✅ | Green | Action completed |
| `info` | ℹ️ | Blue | Information message |
| `warning` | ⚠️ | Orange | Needs attention |
| `error` | ❌ | Red | Something failed |

---

## Testing Commands

### In Browser Console
```javascript
// Test notification
notificationService.show('Test notification', 'success', 3000);

// Check notification history
console.log(notificationService.getAll());

// Test backup download
backupService.downloadBackup();

// Check backup size
console.log(backupService.getBackupSize());

// Check data summary
console.log(backupService.getDataSummary());
```

---

## Troubleshooting

### Notifications not showing?
```javascript
// Check if service loaded
console.log(typeof notificationService); // Should be 'function'

// Try manual test
if (notificationService) {
    notificationService.show('Test', 'success');
} else {
    console.error('Notification service not loaded');
}
```

### Backup won't download?
```javascript
// Check if service loaded
console.log(typeof backupService); // Should be 'function'

// Check backup data
if (backupService) {
    console.log(backupService.getDataSummary());
}
```

### LocalStorage issues?
```javascript
// Check storage used
function checkStorage() {
    let total = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length;
        }
    }
    console.log('LocalStorage used: ' + (total / 1024).toFixed(2) + ' KB');
}
checkStorage();
```

---

## Code Examples by Feature

### Feature: Save with Notification
```javascript
function saveInvoiceWithNotification(invoiceData) {
    try {
        // Save to localStorage
        localStorage.setItem('invoiceData', JSON.stringify(invoiceData));
        
        // Notify user
        notificationService.notifyDataSaved();
        
        // Log
        console.log('Invoice saved successfully');
        
        return true;
    } catch (error) {
        notificationService.notifyError('Failed to save: ' + error.message);
        console.error(error);
        return false;
    }
}
```

### Feature: Daily Backup Check
```javascript
function checkAndNotifyBackupStatus() {
    if (typeof backupService === 'undefined') return;
    
    const reminder = backupService.setBackupReminder(7);
    
    if (reminder.shouldBackup) {
        if (typeof notificationService !== 'undefined') {
            notificationService.show(
                `💾 Backup needed - ${reminder.message}`,
                'warning',
                0 // persistent until closed
            );
        }
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', checkAndNotifyBackupStatus);
```

### Feature: Backup Before Major Action
```javascript
function deleteAllInvoices() {
    if (!confirm('This will delete all invoices. Create backup first?')) {
        return;
    }
    
    // Auto-backup before destructive action
    if (typeof backupService !== 'undefined') {
        backupService.downloadBackup();
    }
    
    // Wait a moment then proceed
    setTimeout(() => {
        localStorage.removeItem('invoiceHistory');
        notificationService.show('All invoices deleted', 'warning');
    }, 500);
}
```

---

## Common Patterns

### Pattern: Action → Notification
```javascript
action() → notificationService.show() → user feedback
```

### Pattern: Backup → Notify → Restore
```javascript
backupService.downloadBackup() 
→ notificationService.notifyBackupCreated()
→ [User stores file safely]
→ backupService.restoreBackup(file)
→ notificationService.notifyBackupRestored()
```

### Pattern: Check → Warn → Act
```javascript
backupService.setBackupReminder()
→ check if needed
→ notificationService.show() [persistent]
→ user clicks "Download"
→ backupService.downloadBackup()
```

---

## Performance Notes
- Notifications: No performance impact (local only)
- Backup: File size depends on data (typical 1-5MB)
- Restore: Takes <1 second for typical backup
- Storage: Uses browser LocalStorage (5-10MB typical limit)

---

**Happy coding!** 🚀
