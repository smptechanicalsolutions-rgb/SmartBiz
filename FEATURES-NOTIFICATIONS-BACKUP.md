# SmartBiz - Email Notifications & Backup Features

## Overview
This document describes two new features added to SmartBiz Invoice Generator:
1. **Email Notifications System** - In-app notifications with no backend required
2. **Download Backup Feature** - Honest, transparent local backup functionality (replaces fake "cloud backup")

---

## Features Added

### 1. Email Notifications System 🔔

#### What It Does
- Shows in-app notifications for user actions (invoice created, data saved, etc.)
- Stores notification history locally
- Displays unread notification count
- No external email service required - purely local/in-app

#### How It Works
- **Location**: `js/notification-service.js`
- **Service**: `notificationService` (global instance)
- **Storage**: LocalStorage (notifications persist across sessions)

#### Features
- **Toast-style notifications** that auto-dismiss
- **Multiple notification types**: info, success, warning, error
- **Persistent notifications** with close button option
- **Notification history** - stores up to 5 recent notifications
- **Read/unread tracking** - know which notifications you've seen

#### How to Use in Code

```javascript
// Show a notification
notificationService.show('Your message', 'success', 5000);

// Available types: 'info', 'success', 'warning', 'error'
// Duration in milliseconds (0 = persistent)

// Specific event notifications
notificationService.notifyInvoiceCreated('INV-001');
notificationService.notifyInvoiceDownloaded('INV-001');
notificationService.notifyBackupCreated();
notificationService.notifyBackupRestored();
notificationService.notifyDataSaved();
notificationService.notifyError('Something went wrong');
notificationService.notifyWarning('Please be careful');

// Get notification data
const allNotifications = notificationService.getAll();
const unreadCount = notificationService.getUnreadCount();

// Mark all as read
notificationService.markAllAsRead();

// Clear all notifications
notificationService.clear();
```

#### UI Integration
- **Settings Page** (`settings.html`):
  - Enable/disable notifications toggle
  - Test notification button
  - View notification history
  - Clear all notifications

- **Home Page** (`home.html`):
  - Click bell icon (🔔) to view recent notifications
  - Shows unread count
  - Auto-backup reminder notifications

#### Example Notifications
```
✅ Invoice #INV-001 created successfully!
📥 Invoice downloaded
💾 Backup created successfully
♻️ Backup restored successfully
⚙️ Auto-save enabled
⚠️ It's been 7 days since your last backup
```

---

### 2. Download Backup Feature 💾

#### What It Does
- **Downloads all your data as a JSON file** to your computer
- Stores: invoices, clients, products, settings, notifications, auto-save settings
- You own the file completely - it stays on YOUR device
- Can restore from backup file anytime
- No "cloud" marketing - transparent, honest backup

#### How It Works
- **Location**: `js/backup-service.js`
- **Service**: `backupService` (global instance)
- **Format**: JSON (human-readable, no vendor lock-in)

#### Features
- **One-click download** - creates JSON backup file
- **Restore from file** - upload previously downloaded backup
- **Data summary** - shows what's backed up and size
- **Clear temporary data** - removes cache without losing important data
- **Export single invoice** - backup individual invoices
- **Backup reminders** - notifies when backup is overdue

#### How to Use in Code

```javascript
// Download backup
backupService.downloadBackup();
// Returns: { success: true, message: '...' }

// Get backup file size
const size = backupService.getBackupSize();
// Returns: "2.5 MB"

// Restore from file
backupService.restoreBackup(file)
    .then(result => console.log(result))
    .catch(error => console.error(error));

// Get data summary
const summary = backupService.getDataSummary();
// Returns: { totalSize, itemCount, items: {...}, totalSizeFormatted }

// Export single invoice
backupService.exportInvoice('INV-001');

// Set backup reminder
const reminder = backupService.setBackupReminder(7); // 7 days
// Returns: { shouldBackup, daysSinceLastBackup, message }

// Clear all data
backupService.clearAllData();
```

#### UI Integration
- **Settings Page** (`settings.html`):
  - **Backup Summary** - shows what's backed up
  - **Download Button** - creates JSON file on your device
  - **Restore Button** - upload backup file to restore
  - **Clear Cache** - remove temporary data

#### Backup File Structure
```json
{
  "version": "1.0",
  "timestamp": "2026-05-24T10:30:00.000Z",
  "backup": {
    "invoiceData": {...},
    "invoiceHistory": [...],
    "savedClients": [...],
    "registeredUsers": [...],
    "smarbizSession": {...},
    "userSettings": {...},
    "notifications": [...],
    "autoSaveSettings": {...},
    "menuData": {...},
    "loginLog": [...],
    "paymentHistory": [...],
    "quoteHistory": [...]
  }
}
```

#### File Naming
- Format: `smarbiz-backup-YYYY-MM-DD.json`
- Example: `smarbiz-backup-2026-05-24.json`
- Auto-named with current date for easy organization

#### Restore Process
1. Go to Settings → Your Data
2. Click "Restore" button
3. Select a backup JSON file
4. Confirm you want to replace current data
5. File is validated and restored
6. Notification shows success/failure

---

## Pages Updated

### `settings.html`
- Added Notifications section
- Enhanced Your Data section with:
  - Backup summary display
  - Download backup button
  - Restore backup button (file upload)
  - Clear temporary data button

### `home.html`
- Added notification service import
- Added backup service import
- Added bell icon click handler to show notifications
- Added backup reminder check on page load

### New Files Created
- `js/notification-service.js` - Notification system (330 lines)
- `js/backup-service.js` - Backup system (370 lines)

---

## Technical Details

### Notification Service Features
- **Animations**: Slide-in/out animations
- **Mobile responsive**: Adapts to small screens
- **LocalStorage**: Persistent across page reloads
- **Auto-dismiss**: Configurable duration per notification
- **TypeScript-like JSDoc**: Full documentation

### Backup Service Features
- **Compression**: JSON format (no gzip)
- **Validation**: Checks backup file structure before restore
- **Error handling**: Try-catch with notifications
- **Safe restore**: Asks for confirmation before overwriting
- **Size calculation**: Shows backup size in human-readable format (KB, MB, GB)

---

## Integration Examples

### Example 1: Notify When Invoice Created
```javascript
// In your invoice creation code
async function createInvoice(data) {
    // ... create invoice logic ...
    
    // Show notification
    if (typeof notificationService !== 'undefined') {
        notificationService.notifyInvoiceCreated(invoiceNo);
    }
}
```

### Example 2: Auto-backup on Schedule
```javascript
// Set up weekly backup reminder
setInterval(() => {
    if (typeof backupService !== 'undefined') {
        const reminder = backupService.setBackupReminder(7);
        if (reminder.shouldBackup && typeof notificationService !== 'undefined') {
            notificationService.show(
                '💾 Time for backup! ' + reminder.message,
                'warning'
            );
        }
    }
}, 24 * 60 * 60 * 1000); // Check daily
```

### Example 3: Backup on Save
```javascript
// In your save function
function saveData(data) {
    localStorage.setItem('invoiceData', JSON.stringify(data));
    
    // Notify and create auto-backup
    if (typeof notificationService !== 'undefined') {
        notificationService.notifyDataSaved();
    }
    
    // Auto-backup every hour
    if (!window.lastAutoBackup || Date.now() - window.lastAutoBackup > 3600000) {
        backupService.downloadBackup();
        window.lastAutoBackup = Date.now();
    }
}
```

---

## Settings Storage

### Notification Settings
- `notificationsEnabled` - Boolean, default: true

### Backup Settings  
- `lastBackupDate` - ISO string, tracks when last backup was created

---

## Browser Support
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support with responsive design

## LocalStorage Requirements
- Minimum: ~5KB for notification history
- Typical: ~1-5MB for full data backup (depends on user data)

---

## Security & Privacy

### What's NOT in this implementation
- ❌ No cloud upload
- ❌ No email sending
- ❌ No third-party services
- ❌ No tracking/analytics
- ❌ No data collection

### What IS in this implementation
- ✅ Local-only notifications
- ✅ Client-side backup/restore
- ✅ Full user control of data
- ✅ Transparent, downloadable backups
- ✅ No vendor lock-in

---

## Troubleshooting

### Notifications not appearing?
1. Check browser console for errors
2. Verify `notification-service.js` is loaded
3. Check if notifications are enabled in settings
4. Test with `notificationService.show('Test', 'success')`

### Backup file won't restore?
1. Ensure file is a valid JSON backup
2. Check browser console for specific error
3. Try with a simpler backup first
4. Check LocalStorage quota (usually 5-10MB limit)

### LocalStorage quota exceeded?
1. Clear temporary data (Settings → Your Data → Clear)
2. Delete old backup files from computer
3. Consider clearing notification history
4. Export old invoices as separate files

---

## Future Enhancements
- Email integration (optional, with user permission)
- Cloud storage integration (with user control)
- Scheduled automatic backups
- Backup compression (ZIP)
- Backup encryption
- Multi-backup management
- Notification priority levels
- Notification sounds (optional)

---

## Support
For issues or questions about these features, check:
1. Browser console for error messages
2. Settings page for feature status
3. LocalStorage data via browser DevTools

---

**Version**: 1.0  
**Date Added**: May 24, 2026  
**Author**: SmartBiz Development Team
