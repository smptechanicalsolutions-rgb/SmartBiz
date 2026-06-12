// Navigation Manager - Handle all app navigation and back button functionality

class NavigationManager {
    constructor() {
        this.navigationHistory = [];
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    init() {
        // Add current page to navigation history
        this.addToHistory(this.currentPage);
        
        // Setup back button functionality
        this.setupBackButtons();
        
        // Setup footer navigation
        this.setupFooterNavigation();
    }

    // Get current page name
    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return filename || 'home.html';
    }

    // Add page to navigation history
    addToHistory(page) {
        // Avoid duplicates
        if (this.navigationHistory[this.navigationHistory.length - 1] !== page) {
            this.navigationHistory.push(page);
            // Keep only last 10 pages
            if (this.navigationHistory.length > 10) {
                this.navigationHistory.shift();
            }
        }
    }

    // Navigate to a page
    navigateTo(page) {
        if (page && page !== this.currentPage) {
            this.addToHistory(page);
            window.location.href = page;
        }
    }

    // Go back to previous page
    goBack() {
        if (this.navigationHistory.length > 1) {
            this.navigationHistory.pop(); // Remove current page
            const previousPage = this.navigationHistory.pop(); // Get previous page
            if (previousPage) {
                window.location.href = previousPage;
            } else {
                this.goToHome(); // Fallback to home
            }
        } else {
            // Only ask to close app if we're actually on the home page
            if (this.currentPage === 'home.html' || this.getCurrentPage() === 'home.html') {
                this.askToCloseApp();
            } else {
                // If we're on any other page with no history, go to home
                this.goToHome();
            }
        }
    }

    // Ask user if they want to close the application
    askToCloseApp() {
        const confirmClose = confirm('Do you want to close the application?');
        if (confirmClose) {
            // Try to close the window/tab
            if (window.close) {
                window.close();
            } else {
                // Fallback for mobile browsers
                alert('Thank you for using Invoice Management! You can close this tab manually.');
                // Redirect to home as fallback
                this.goToHome();
            }
        }
    }

    // Navigation functions
    goToHome() {
        this.navigateTo('home.html');
    }

    goToDashboard() {
        this.navigateTo('dashboard.html');
    }

    goToProducts() {
        this.navigateTo('product.html');
    }

    goToMenu() {
        this.navigateTo('menu.html');
    }

    goToSettings() {
        this.navigateTo('settings.html');
    }

    goToSaleHistory() {
        this.navigateTo('sale-history.html');
    }

    goToDeliveryChallanHistory() {
        this.navigateTo('delivery-challan-history.html');
    }

    goToQuotationHistory() {
        this.navigateTo('quotation-history.html');
    }

    goToPaymentReceiptHistory() {
        this.navigateTo('payment-receipt-history.html');
    }

    goToInvoice() {
        this.navigateTo('invoice-layouts.html?type=invoice');
    }

    goToPersonalInfo() {
        this.navigateTo('personal-info.html');
    }

    // Setup back buttons
    setupBackButtons() {
        const backButtons = document.querySelectorAll('.back-icon');
        backButtons.forEach(button => {
            // Remove existing onclick
            button.removeAttribute('onclick');
            
            // Add new click handler
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.goBack();
            });
            
            // Add hover effect
            button.style.cursor = 'pointer';
            button.style.transition = 'all 0.3s ease';
            
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'scale(1.1)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'scale(1)';
            });
        });
    }

    // Setup footer navigation
    setupFooterNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            // Remove existing onclick
            item.removeAttribute('onclick');
            
            // Add new click handler
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const icon = item.querySelector('i');
                const span = item.querySelector('span');
                
                if (icon && span) {
                    const iconClass = icon.className;
                    const text = span.textContent.toLowerCase();
                    
                    // Navigate based on icon or text
                    if (iconClass.includes('fa-home') || text.includes('home')) {
                        this.goToHome();
                    } else if (iconClass.includes('fa-chart-bar') || text.includes('dashboard')) {
                        this.goToDashboard();
                    } else if (iconClass.includes('fa-box') || text.includes('items')) {
                        this.goToProducts();
                    } else if (iconClass.includes('fa-bars') || text.includes('menu')) {
                        this.goToMenu();
                    } else if (iconClass.includes('fa-windows') || text.includes('desktop')) {
                        this.getDesktop();
                    }
                }
            });
        });
    }

    // Get desktop version
    getDesktop() {
        alert('Get desktop version functionality coming soon!');
    }

    // Set active navigation item
    setActiveNavItem() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // Set active based on current page
        const currentPage = this.currentPage;
        let activeIndex = 0;
        
        if (currentPage.includes('dashboard')) {
            activeIndex = 1;
        } else if (currentPage.includes('product')) {
            activeIndex = 2;
        } else if (currentPage.includes('menu')) {
            activeIndex = 3;
        } else if (currentPage.includes('settings')) {
            activeIndex = 4;
        }
        
        if (navItems[activeIndex]) {
            navItems[activeIndex].classList.add('active');
        }
    }

    // Add back button to pages that don't have one
    addBackButton() {
        const headerLeft = document.querySelector('.header-left');
        if (headerLeft && !document.querySelector('.back-icon')) {
            const backButton = document.createElement('i');
            backButton.className = 'fas fa-arrow-left back-icon';
            backButton.title = 'Go Back';
            headerLeft.insertBefore(backButton, headerLeft.firstChild);
            
            // Add click handler
            backButton.addEventListener('click', () => {
                this.goBack();
            });
        }
    }

    // Update page title
    updatePageTitle(title) {
        const appTitle = document.querySelector('.app-title');
        if (appTitle) {
            appTitle.textContent = title;
        }
    }

    // Get navigation history
    getHistory() {
        return [...this.navigationHistory];
    }

    // Clear navigation history
    clearHistory() {
        this.navigationHistory = [this.currentPage];
    }
}

function normalizeSearchText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/gi, ' ')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
}

function searchMatches(text, query) {
    const normalizedText = normalizeSearchText(text);
    const normalizedQuery = normalizeSearchText(query || '');
    if (!normalizedQuery) return true;
    const tokens = normalizedQuery.split(' ').filter(Boolean);
    return tokens.every(token => normalizedText.includes(token));
}

window.normalizeSearchText = normalizeSearchText;
window.searchMatches = searchMatches;
// Global navigation functions for backward compatibility
function goToHome() {
    if (window.navigationManager) {
        window.navigationManager.goToHome();
    } else {
        window.location.href = 'home.html';
    }
}

function goToDashboard() {
    if (window.navigationManager) {
        window.navigationManager.goToDashboard();
    } else {
        window.location.href = 'dashboard.html';
    }
}

function goToProducts() {
    if (window.navigationManager) {
        window.navigationManager.goToProducts();
    } else {
        window.location.href = 'product.html';
    }
}

function goToMenu() {
    if (window.navigationManager) {
        window.navigationManager.goToMenu();
    } else {
        window.location.href = 'menu.html';
    }
}

function goToSettings() {
    if (window.navigationManager) {
        window.navigationManager.goToSettings();
    } else {
        window.location.href = 'settings.html';
    }
}

function goBack() {
    if (window.navigationManager) {
        window.navigationManager.goBack();
    }
}

function normalizeSearchText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/gi, ' ')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
}

function searchMatches(text, query) {
    const normalizedText = normalizeSearchText(text);
    const normalizedQuery = normalizeSearchText(query || '');
    if (!normalizedQuery) return true;
    const tokens = normalizedQuery.split(' ').filter(Boolean);
    return tokens.every(token => normalizedText.includes(token));
}

window.normalizeSearchText = normalizeSearchText;
window.searchMatches = searchMatches;
// Auto-initialize navigation manager
document.addEventListener('DOMContentLoaded', function() {
    window.navigationManager = new NavigationManager();
    
    // Set active navigation item
    setTimeout(() => {
        window.navigationManager.setActiveNavItem();
    }, 100);

    // refresh auth icons if helper is available
    if (window.updateAuthNav) {
        // slight delay ensures header exists
        setTimeout(() => window.updateAuthNav(), 50);
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationManager;
}

// Load shared currency formatter (Settings → General → Currency)
(function loadCurrencyModule() {
    if (window.SmarbizCurrency) return;
    const parts = window.location.pathname.split('/').filter(Boolean);
    const depth = Math.max(0, parts.length - 1);
    const prefix = depth > 0 ? '../'.repeat(depth) : '';
    const script = document.createElement('script');
    script.src = prefix + 'js/currency.js';
    document.head.appendChild(script);
})();



