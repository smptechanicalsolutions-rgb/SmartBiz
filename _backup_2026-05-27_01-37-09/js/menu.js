// Menu Page JavaScript

// Navigation Functions
function goToHome() {
    window.location.href = 'home.html';
}

function goToDashboard() {
    window.location.href = 'dashboard.html';
}

function goToProducts() {
    window.location.href = 'product.html';
}

function goToMenu() {
    // Already on menu page
    return;
}

function getDesktop() {
    alert('Get desktop version functionality coming soon!');
}

// Dropdown Toggle Function
function toggleDropdown(element) {
    const dropdownArrow = element.querySelector('.dropdown-arrow');
    const isExpanded = element.classList.contains('expanded');
    
    // Close all other dropdowns
    document.querySelectorAll('.menu-item.has-dropdown').forEach(item => {
        if (item !== element) {
            item.classList.remove('expanded');
        }
    });
    
    // Toggle current dropdown
    if (isExpanded) {
        element.classList.remove('expanded');
        // Remove dropdown menu if it exists
        const existingMenu = element.nextElementSibling;
        if (existingMenu && existingMenu.classList.contains('dropdown-menu')) {
            existingMenu.remove();
        }
    } else {
        element.classList.add('expanded');
        // Create and add dropdown menu
        createDropdownMenu(element);
    }
}

// Create Dropdown Menu
function createDropdownMenu(menuItem) {
    const menuText = menuItem.querySelector('.item-content span').textContent;
    let dropdownItems = [];
    
    // Define dropdown items based on menu type
    switch(menuText) {
        case 'Sale':
            dropdownItems = [
                { text: 'New Sale', icon: 'fa-plus-circle' },
                { text: 'Sale History', icon: 'fa-history' },
                { text: 'Sale Return', icon: 'fa-undo' },
                { text: 'Estimate/Quotation', icon: 'fa-file-invoice' },
                { text: 'Credit Note', icon: 'fa-file-contract' },
                { text: 'Delivery Challan', icon: 'fa-truck' }
            ];
            break;
        case 'Purchase':
            dropdownItems = [
                { text: 'New Purchase', icon: 'fa-plus-circle' },
                { text: 'Purchase History', icon: 'fa-history' },
                { text: 'Purchase Return', icon: 'fa-undo' },
                { text: 'Purchase Order', icon: 'fa-file-contract' },
                { text: 'Debit Note', icon: 'fa-file-invoice' },
                { text: 'Goods Received Note', icon: 'fa-check-circle' }
            ];
            break;
    }
    
    if (dropdownItems.length > 0) {
        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'dropdown-menu';
        
        dropdownItems.forEach(item => {
            const dropdownItem = document.createElement('div');
            dropdownItem.className = 'dropdown-item';
            dropdownItem.innerHTML = `
                <i class="fas ${item.icon}"></i>
                <span>${item.text}</span>
            `;
            dropdownItem.onclick = function(e) {
                e.stopPropagation();
                handleDropdownClick(item.text);
            };
            dropdownMenu.appendChild(dropdownItem);
        });
        
        // Insert dropdown menu after the menu item
        menuItem.parentNode.insertBefore(dropdownMenu, menuItem.nextSibling);
        
        // Animate dropdown opening
        setTimeout(() => {
            dropdownMenu.classList.add('show');
        }, 10);
    }
}

// Handle Dropdown Item Click
function handleDropdownClick(itemText) {
    console.log('Clicked:', itemText);
    // Add functionality based on the clicked item
    switch(itemText) {
        case 'New Sale':
            goToInvoice();
            break;
        case 'Sale History':
            goToSaleHistory();
            break;
        case 'Sale Return':
            goToSaleReturn();
            break;
        case 'Estimate/Quotation':
            goToQuotation();
            break;
        case 'Credit Note':
            goToCreditNote();
            break;
        case 'Delivery Challan':
            goToDeliveryChallan();
            break;
        case 'New Purchase':
            goToNewPurchase();
            break;
        case 'Purchase History':
            goToPurchaseHistory();
            break;
        case 'Purchase Return':
            goToPurchaseReturn();
            break;
        case 'Purchase Order':
            goToPurchaseOrder();
            break;
        case 'Debit Note':
            goToDebitNote();
            break;
        case 'Goods Received Note':
            goToGoodsReceivedNote();
            break;
        default:
            alert(`${itemText} functionality coming soon!`);
    }
}

// Navigation Functions for Sale Options
function goToInvoice() {
    window.location.href = 'invoice-layouts.html?type=invoice';
}

function goToSaleHistory() {
    window.location.href = 'sale-history.html';
}

function goToSaleReturn() {
    window.location.href = 'sale-return.html';
}

function goToQuotation() {
    window.location.href = 'invoice-layouts.html?type=quotation';
}

function goToCreditNote() {
    window.location.href = 'credit-note.html';
}

function goToDeliveryChallan() {
    window.location.href = 'invoice-layouts.html?type=delivery-challan';
}

function goToNewPurchase() {
    window.location.href = 'purchase-new.html';
}

function goToPurchaseHistory() {
    window.location.href = 'purchase-history.html';
}

function goToPurchaseReturn() {
    window.location.href = 'purchase-return.html';
}

function goToPurchaseOrder() {
    window.location.href = 'purchase-order.html';
}

function goToDebitNote() {
    window.location.href = 'debit-note.html';
}

function goToGoodsReceivedNote() {
    window.location.href = 'goods-received-note.html';
}

function goToPersonalInfo() {
    window.location.href = 'personal-info.html';
}

function goToSettings() {
    window.location.href = 'settings.html';
}

function goToProfile() {
    window.location.href = 'personal-info.html';
}

// History Navigation Functions
function goToInvoiceHistory() {
    window.location.href = 'sale-history.html';
}

function goToDeliveryChallanHistory() {
    window.location.href = 'delivery-challan-history.html';
}

function goToQuotationHistory() {
    window.location.href = 'quotation-history.html';
}

function goToProformaInvoice() {
    window.location.href = 'invoice-layouts.html?type=proforma';
}

function goToPaymentReceiptHistory() {
    window.location.href = 'payment-receipt-history.html';
}

// Handle Regular Menu Item Click
document.addEventListener('DOMContentLoaded', function() {
    // Add click handlers to all menu items
    const menuItems = document.querySelectorAll('.menu-item:not(.has-dropdown)');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const menuText = this.querySelector('.item-content span').textContent;
            handleMenuItemClick(menuText);
        });
    });
    
    // Set active nav item based on current page
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Set MENU as active since we're on menu page
    navItems[3].classList.add('active');
});

// Handle Menu Item Click
function handleMenuItemClick(menuText) {
    console.log('Menu item clicked:', menuText);
    
    // Add functionality based on the clicked menu item
    switch(menuText) {
        case 'Expenses':
            alert('Expenses functionality coming soon!');
            break;
        case 'My Online Store':
            alert('My Online Store functionality coming soon!');
            break;
        case 'Reports':
            alert('Reports functionality coming soon!');
            break;
        case 'Bank Accounts':
            alert('Bank Accounts functionality coming soon!');
            break;
        case 'Cash In-Hand':
            alert('Cash In-Hand functionality coming soon!');
            break;
        case 'Cheques':
            alert('Cheques functionality coming soon!');
            break;
        case 'Loan Accounts':
            alert('Loan Accounts functionality coming soon!');
            break;
        case 'GST Calculator':
            alert('GST Calculator functionality coming soon!');
            break;
        case 'Tax Calculator':
            alert('Tax Calculator functionality coming soon!');
            break;
        case 'Currency Converter':
            alert('Currency Converter functionality coming soon!');
            break;
        case 'Unit Converter':
            alert('Unit Converter functionality coming soon!');
            break;
        case 'Discount Calculator':
            alert('Discount Calculator functionality coming soon!');
            break;
        case 'Invoice':
            goToInvoiceHistory();
            break;
        case 'Delivery Challan':
            goToDeliveryChallanHistory();
            break;
        case 'Quotation':
            goToQuotationHistory();
            break;
        case 'Proforma Invoice':
            goToProformaInvoice();
            break;
        case 'Payment Receipt':
            goToPaymentReceiptHistory();
            break;
        case 'Profile':
            goToProfile();
            break;
        case 'Company Settings':
            goToSettings();
            break;
        case 'App Settings':
            goToSettings();
            break;
        case 'Notifications':
            alert('Notifications functionality coming soon!');
            break;
        case 'Privacy & Security':
            alert('Privacy & Security functionality coming soon!');
            break;
        default:
            alert(`${menuText} functionality coming soon!`);
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.menu-item')) {
        document.querySelectorAll('.menu-item.has-dropdown').forEach(item => {
            item.classList.remove('expanded');
        });
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.remove();
        });
    }
});

// Notification click handler
document.addEventListener('DOMContentLoaded', function() {
    const notificationIcon = document.querySelector('.notification-icon');
    if (notificationIcon) {
        notificationIcon.addEventListener('click', function() {
            alert('You have 3 new notifications!');
        });
    }
    
    const settingsIcon = document.querySelector('.settings-icon');
    if (settingsIcon) {
        settingsIcon.addEventListener('click', function() {
            alert('Settings functionality coming soon!');
        });
    }
});
