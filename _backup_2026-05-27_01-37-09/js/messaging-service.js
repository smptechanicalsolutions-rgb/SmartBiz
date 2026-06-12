// Messaging Service for automatic WhatsApp messaging after document creation

class MessagingService {
    constructor() {
        this.settings = this.loadSettings();
    }

    // Load settings from localStorage
    loadSettings() {
        return JSON.parse(localStorage.getItem('appSettings') || '{}');
    }

    // Get message template based on settings
    getMessageTemplate(documentType, customerName, documentNumber) {
        const template = this.settings.messageTemplate || 'professional';
        const customMessage = this.settings.customMessage;
        
        // If custom template is selected and custom message exists, use it
        if (template === 'custom' && customMessage) {
            return this.replaceMessageVariables(customMessage, customerName, documentNumber, documentType);
        }

        // Use predefined templates
        const templates = {
            professional: this.getProfessionalTemplate(documentType, customerName, documentNumber),
            friendly: this.getFriendlyTemplate(documentType, customerName, documentNumber),
            formal: this.getFormalTemplate(documentType, customerName, documentNumber)
        };

        return templates[template] || templates.professional;
    }

    // Replace variables in message template
    replaceMessageVariables(template, customerName, documentNumber, documentType) {
        const businessName = this.settings.businessName || 'Shubham Patil';
        const businessPhone = this.settings.businessPhone || '';
        const businessEmail = this.settings.businessEmail || '';
        
        return template
            .replace(/\{customerName\}/g, customerName)
            .replace(/\{documentNumber\}/g, documentNumber)
            .replace(/\{documentType\}/g, documentType)
            .replace(/\{businessName\}/g, businessName)
            .replace(/\{businessPhone\}/g, businessPhone)
            .replace(/\{businessEmail\}/g, businessEmail)
            .replace(/\{currentDate\}/g, new Date().toLocaleDateString());
    }

    // Professional template
    getProfessionalTemplate(documentType, customerName, documentNumber) {
        const businessName = this.settings.businessName || 'Shubham Patil';
        
        switch(documentType.toLowerCase()) {
            case 'invoice':
                return `Dear ${customerName},\n\nThank you for your business! We have generated Invoice #${documentNumber} for your recent transaction.\n\nInvoice Details:\n- Invoice Number: ${documentNumber}\n- Date: ${new Date().toLocaleDateString()}\n- Total Amount: [Amount]\n\nPlease find the attached invoice for your records. Payment is due within the agreed terms.\n\nFor any queries, please contact us.\n\nRegards,\n${businessName}`;
            
            case 'quotation':
                return `Dear ${customerName},\n\nThank you for your interest in our services. We are pleased to provide you with Quotation #${documentNumber}.\n\nQuotation Details:\n- Quotation Number: ${documentNumber}\n- Date: ${new Date().toLocaleDateString()}\n- Valid Until: [Valid Date]\n- Total Amount: [Amount]\n\nThis quotation is valid for 15 days. We look forward to your positive response.\n\nFor any clarifications, please feel free to contact us.\n\nRegards,\n${businessName}`;
            
            case 'delivery challan':
                return `Dear ${customerName},\n\nYour goods are ready for delivery! Delivery Challan #${documentNumber} has been generated.\n\nDelivery Details:\n- Challan Number: ${documentNumber}\n- Date: ${new Date().toLocaleDateString()}\n- Expected Delivery: [Delivery Date]\n- Items: [Items List]\n\nPlease ensure someone is available to receive the delivery. Track your delivery status through our system.\n\nFor any delivery-related queries, please contact us.\n\nRegards,\n${businessName}`;
            
            case 'payment receipt':
                return `Dear ${customerName},\n\nWe have received your payment successfully. Payment Receipt #${documentNumber} has been generated.\n\nPayment Details:\n- Receipt Number: ${documentNumber}\n- Date: ${new Date().toLocaleDateString()}\n- Amount: [Amount]\n- Payment Method: [Payment Method]\n\nThank you for your prompt payment. Your account is now up to date.\n\nFor any payment-related queries, please contact us.\n\nRegards,\n${businessName}`;
            
            default:
                return `Dear ${customerName},\n\nThank you for your business! Your ${documentType} #${documentNumber} has been generated successfully.\n\nDocument Details:\n- ${documentType} Number: ${documentNumber}\n- Date: ${new Date().toLocaleDateString()}\n\nPlease find the attached document for your records.\n\nFor any queries, please contact us.\n\nRegards,\n${businessName}`;
        }
    }

    // Friendly template
    getFriendlyTemplate(documentType, customerName, documentNumber) {
        const businessName = this.settings.businessName || 'Shubham Patil';
        
        switch(documentType.toLowerCase()) {
            case 'invoice':
                return `Hi ${customerName}! 😊\n\nThanks for your recent order! 🎉\n\nYour Invoice #${documentNumber} is ready!\n\n📋 Invoice Details:\n- Invoice #: ${documentNumber}\n- Date: ${new Date().toLocaleDateString()}\n- Amount: [Amount]\n\nYou can view and download your invoice anytime. Let us know if you have any questions!\n\nBest regards,\n${businessName} 🚀`;
            
            case 'quotation':
                return `Hi ${customerName}! 👋\n\nThanks for your interest in our services! 🌟\n\nYour Quotation #${documentNumber} is ready!\n\n📋 Quote Details:\n- Quote #: ${documentNumber}\n- Date: ${new Date().toLocaleDateString()}\n- Valid Until: [Valid Date]\n- Amount: [Amount]\n\nWe're excited to work with you! Let us know if you need any changes.\n\nCheers,\n${businessName} 😊`;
            
            case 'delivery challan':
                return `Hi ${customerName}! 🚚\n\nGreat news! Your order is ready for delivery! 📦\n\nDelivery Challan #${documentNumber} has been created.\n\n📋 Delivery Details:\n- Challan #: ${documentNumber}\n- Date: ${new Date().toLocaleDateString()}\n- Expected Delivery: [Delivery Date]\n\nYour items are on the way! Make sure someone's available to receive them.\n\nSafe delivery! 🎯\n\nBest,\n${businessName} 👍`;
            
            case 'payment receipt':
                return `Hi ${customerName}! 💰\n\nPayment received successfully! 🎉\n\nYour Payment Receipt #${documentNumber} is confirmed.\n\n💳 Payment Details:\n- Receipt #: ${documentNumber}\n- Date: ${new Date().toLocaleDateString()}\n- Amount: [Amount]\n- Method: [Payment Method]\n\nThanks for your prompt payment! Your account is all set. ✅\n\nHave a great day!\n\nBest,\n${businessName} 😊`;
            
            default:
                return `Hi ${customerName}! 👋\n\nYour ${documentType} #${documentNumber} is ready! 🎉\n\nThanks for choosing us! We appreciate your business.\n\nLet us know if you need anything else.\n\nBest regards,\n${businessName} 😊`;
        }
    }

    // Formal template
    getFormalTemplate(documentType, customerName, documentNumber) {
        const businessName = this.settings.businessName || 'Shubham Patil';
        
        switch(documentType.toLowerCase()) {
            case 'invoice':
                return `Dear Mr./Ms. ${customerName},\n\nWe hereby acknowledge your recent transaction and have generated Invoice #${documentNumber} for your records.\n\nInvoice Particulars:\nInvoice Number: ${documentNumber}\nDate: ${new Date().toLocaleDateString()}\nTotal Amount: [Amount]\n\nThe invoice is attached herewith for your perusal and records. We request you to settle the payment as per the agreed terms.\n\nShould you require any clarification or assistance, please do not hesitate to contact our office.\n\nWe appreciate your business and look forward to our continued association.\n\nYours faithfully,\n${businessName}`;
            
            case 'quotation':
                return `Dear Mr./Ms. ${customerName},\n\nIn response to your inquiry, we are pleased to submit our Quotation #${documentNumber} for your consideration.\n\nQuotation Details:\nQuotation Number: ${documentNumber}\nDate: ${new Date().toLocaleDateString()}\nValid Until: [Valid Date]\nQuotation Amount: [Amount]\n\nWe trust that our proposal meets your requirements. This quotation is valid for 15 days from the date of issue.\n\nWe remain at your disposal for any further information you may require.\n\nWe look forward to receiving your favorable response.\n\nYours faithfully,\n${businessName}`;
            
            case 'delivery challan':
                return `Dear Mr./Ms. ${customerName},\n\nWe are pleased to inform you that your goods are ready for dispatch. Delivery Challan #${documentNumber} has been prepared accordingly.\n\nDelivery Details:\nChallan Number: ${documentNumber}\nDate: ${new Date().toLocaleDateString()}\nExpected Delivery: [Delivery Date]\n\nPlease ensure proper arrangements for receiving the delivery at the specified address. Our delivery personnel will contact you prior to arrival.\n\nFor any delivery-related queries, please contact our dispatch department.\n\nWe appreciate your business and assure you of our best services at all times.\n\nYours faithfully,\n${businessName}`;
            
            case 'payment receipt':
                return `Dear Mr./Ms. ${customerName},\n\nWe acknowledge with thanks receipt of your payment. Payment Receipt #${documentNumber} has been issued for your records.\n\nReceipt Details:\nReceipt Number: ${documentNumber}\nDate: ${new Date().toLocaleDateString()}\nAmount Received: [Amount]\nPayment Mode: [Payment Method]\n\nYour account has been credited accordingly. We appreciate your prompt payment and continued patronage.\n\nShould you require any further assistance, please do not hesitate to contact us.\n\nYours faithfully,\n${businessName}`;
            
            default:
                return `Dear Mr./Ms. ${customerName},\n\nWe have generated ${documentType} #${documentNumber} for your records and perusal.\n\nDocument Details:\n${documentType} Number: ${documentNumber}\nDate: ${new Date().toLocaleDateString()}\n\nThe document is attached herewith for your reference. We request you to review the same at your earliest convenience.\n\nWe value your business and look forward to our continued professional relationship.\n\nYours faithfully,\n${businessName}`;
        }
    }

    // Send WhatsApp message
    sendWhatsAppMessage(phoneNumber, customerName, documentType, documentNumber, delayMinutes = 0) {
        // Clean phone number
        const cleanNumber = phoneNumber.replace(/\D/g, '');
        
        // Get message based on settings
        const message = this.getMessageTemplate(documentType, customerName, documentNumber);
        
        // Send immediately or with delay
        if (delayMinutes > 0) {
            setTimeout(() => {
                this.openWhatsApp(cleanNumber, message);
            }, delayMinutes * 60 * 1000);
        } else {
            this.openWhatsApp(cleanNumber, message);
        }
    }

    // Open WhatsApp with message
    openWhatsApp(phoneNumber, message) {
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
        // Log the message for tracking
        this.logMessage(phoneNumber, message);
    }

    // Log message for tracking
    logMessage(phoneNumber, message) {
        const messageLog = JSON.parse(localStorage.getItem('messageLog') || '[]');
        messageLog.push({
            phoneNumber: phoneNumber,
            message: message,
            timestamp: new Date().toISOString(),
            status: 'sent'
        });
        localStorage.setItem('messageLog', JSON.stringify(messageLog));
    }

    // Check if auto-send is enabled
    isAutoSendEnabled() {
        return this.settings.autoSendMessages || false;
    }

    // Get send delay
    getSendDelay() {
        return parseInt(this.settings.sendDelay) || 5;
    }

    // Send message after document creation (main function)
    sendAfterDocumentCreation(phoneNumber, customerName, documentType, documentNumber) {
        if (!this.isAutoSendEnabled()) {
            return false;
        }

        const delay = this.getSendDelay();
        this.sendWhatsAppMessage(phoneNumber, customerName, documentType, documentNumber, delay);
        
        // Show notification
        this.showNotification(`Message scheduled for ${customerName} (${delay} minutes delay)`);
        
        return true;
    }

    // Show notification
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'message-notification';
        notification.innerHTML = `
            <i class="fas fa-comment"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Get message history
    getMessageHistory() {
        return JSON.parse(localStorage.getItem('messageLog') || '[]');
    }

    // Clear message history
    clearMessageHistory() {
        localStorage.removeItem('messageLog');
    }
}

// Create global instance
window.messagingService = new MessagingService();

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
    
    .message-notification button {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        margin-left: auto;
    }
    
    .message-notification button:hover {
        opacity: 0.8;
    }
`;
document.head.appendChild(notificationStyles);
