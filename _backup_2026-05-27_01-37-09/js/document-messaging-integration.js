// Document Messaging Integration - Use this when creating documents

// Include this script in your document creation pages (index.html, etc.)

// Function to send message after document creation
function sendDocumentMessage(phoneNumber, customerName, documentType, documentNumber) {
    // Check if messaging service is available
    if (window.messagingService) {
        const success = window.messagingService.sendAfterDocumentCreation(
            phoneNumber, 
            customerName, 
            documentType, 
            documentNumber
        );
        
        if (success) {
            console.log(`Message scheduled for ${customerName} - ${documentType} #${documentNumber}`);
        }
    } else {
        console.warn('Messaging service not available');
    }
}

// Example usage in document creation functions:
// After creating an invoice:
// sendDocumentMessage('+91 9876543210', 'ABC Corporation', 'Invoice', 'INV-001');

// After creating a quotation:
// sendDocumentMessage('+91 9876543211', 'XYZ Enterprises', 'Quotation', 'QT-001');

// After creating a delivery challan:
// sendDocumentMessage('+91 9876543212', 'Global Solutions', 'Delivery Challan', 'DC-001');

// Function to send message manually (without auto-send)
function sendManualMessage(phoneNumber, customerName, documentType, documentNumber) {
    if (window.messagingService) {
        window.messagingService.sendWhatsAppMessage(
            phoneNumber, 
            customerName, 
            documentType, 
            documentNumber,
            0 // No delay
        );
    }
}

// Function to check messaging settings
function getMessagingSettings() {
    if (window.messagingService) {
        return {
            autoSendEnabled: window.messagingService.isAutoSendEnabled(),
            sendDelay: window.messagingService.getSendDelay(),
            messageTemplate: window.messagingService.settings.messageTemplate
        };
    }
    return null;
}

// Function to get message preview
function getMessagePreview(phoneNumber, customerName, documentType, documentNumber) {
    if (window.messagingService) {
        return window.messagingService.getMessageTemplate(documentType, customerName, documentNumber);
    }
    return null;
}

// Auto-integration for common document types
function integrateDocumentMessaging() {
    // This function can be called when a document is created
    // It will automatically send a message if auto-send is enabled
    
    // Example: Call this after saving an invoice
    const documentData = {
        phoneNumber: '+91 9876543210',
        customerName: 'ABC Corporation',
        documentType: 'Invoice',
        documentNumber: 'INV-001'
    };
    
    sendDocumentMessage(
        documentData.phoneNumber,
        documentData.customerName,
        documentData.documentType,
        documentData.documentNumber
    );
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sendDocumentMessage,
        sendManualMessage,
        getMessagingSettings,
        getMessagePreview,
        integrateDocumentMessaging
    };
}
