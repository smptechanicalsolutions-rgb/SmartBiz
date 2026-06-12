// YouTube-style Dark/Light Theme Loader
// Include this script in all HTML pages for consistent theming

class YouTubeThemeLoader {
    constructor() {
        this.currentTheme = 'light';
        this.primaryColor = '#667eea';
        this.init();
    }

    init() {
        this.applyLightTheme();
    }

    // Apply theme to the page (theme switching disabled)
    applyTheme(theme) {
        this.currentTheme = 'light';
        this.applyLightTheme();
        localStorage.setItem('currentThemeMode', 'light');
    }

    // Apply light theme (default)
    applyLightTheme() {
        // Remove any existing theme styles
        let styleElement = document.getElementById('youtube-theme-styles');
        if (styleElement) {
            styleElement.remove();
        }
        
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
    }

    // Apply dark theme
    applyDarkTheme() {
        // Create or update theme styles
        let styleElement = document.getElementById('youtube-theme-styles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'youtube-theme-styles';
            document.head.appendChild(styleElement);
        }

        // Dark theme CSS - YouTube inspired
        const darkCSS = `
            /* YouTube Dark Theme */
            body {
                background: #0f0f0f !important;
                color: #ffffff !important;
            }
            
            .mobile-container {
                background: #0f0f0f !important;
            }
            
            .header {
                background: #202020 !important;
                border-bottom: 1px solid #303030 !important;
            }
            
            .app-title {
                color: #ffffff !important;
            }
            
            .main-content {
                background: #0f0f0f !important;
            }
            
            .bottom-nav {
                background: #1a1a1a !important;
                border-top: 1px solid #303030 !important;
            }
            
            .nav-item {
                color: #aaaaaa !important;
            }
            
            .nav-item.active {
                color: ${this.primaryColor} !important;
            }
            
            .nav-item.active i {
                color: ${this.primaryColor} !important;
            }
            
            /* Cards and Items */
            .sale-item,
            .challan-item,
            .quotation-item,
            .receipt-item,
            .party-item,
            .product-item,
            .stat-card,
            .summary-card {
                background: #1a1a1a !important;
                border: 1px solid #303030 !important;
                color: #ffffff !important;
            }
            
            .sale-item:hover,
            .challan-item:hover,
            .quotation-item:hover,
            .receipt-item:hover,
            .party-item:hover,
            .product-item:hover,
            .stat-card:hover,
            .summary-card:hover {
                box-shadow: 0 4px 15px rgba(255,255,255,0.1) !important;
            }
            
            /* Text Colors */
            .section-title,
            .setting-label,
            .app-info h3,
            .sale-header h3,
            .challan-header h3,
            .quotation-header h3,
            .receipt-header h3,
            .party-name,
            .product-name {
                color: #ffffff !important;
            }
            
            .setting-description,
            .app-info p,
            .sale-date,
            .challan-date,
            .quotation-date,
            .receipt-date,
            .party-details,
            .product-details {
                color: #aaaaaa !important;
            }
            
            /* Forms and Inputs */
            .setting-input,
            .setting-select,
            .setting-textarea,
            .search-input,
            .party-input,
            .product-input {
                background: #2a2a2a !important;
                border: 1px solid #404040 !important;
                color: #ffffff !important;
            }
            
            .setting-input:focus,
            .setting-select:focus,
            .setting-textarea:focus,
            .search-input:focus,
            .party-input:focus,
            .product-input:focus {
                border-color: ${this.primaryColor} !important;
                box-shadow: 0 0 0 3px ${this.primaryColor}20 !important;
            }
            
            /* Buttons - Enhanced for Dark Mode */
            .btn-primary,
            .view-btn {
                background: linear-gradient(135deg, ${this.primaryColor} 0%, ${this.primaryColor}dd 100%) !important;
                color: white !important;
                border: 1px solid ${this.primaryColor} !important;
            }
            
            .btn-primary:hover,
            .view-btn:hover {
                background: linear-gradient(135deg, ${this.primaryColor} 0%, ${this.primaryColor}ff 100%) !important;
                box-shadow: 0 4px 15px ${this.primaryColor}60 !important;
            }
            
            .download-btn {
                background: linear-gradient(135deg, #2d7d32 0%, #388e3c 100%) !important;
                color: white !important;
                border: 1px solid #4caf50 !important;
            }
            
            .message-btn {
                background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%) !important;
                color: white !important;
                border: 1px solid #4caf50 !important;
            }
            
            .filter-btn {
                background: #2a2a2a !important;
                border: 2px solid #404040 !important;
                color: #ffffff !important;
                font-weight: 500 !important;
            }
            
            .filter-btn.active {
                background: linear-gradient(135deg, ${this.primaryColor} 0%, ${this.primaryColor}dd 100%) !important;
                border-color: ${this.primaryColor} !important;
            }
            
            .filter-btn:hover {
                background: #3a3a3a !important;
                border-color: ${this.primaryColor} !important;
                color: ${this.primaryColor} !important;
            }
            
            .toggle-btn {
                background: #2a2a2a !important;
                border: 2px solid #404040 !important;
                color: #ffffff !important;
                font-weight: 500 !important;
            }
            
            .toggle-btn.active {
                background: linear-gradient(135deg, ${this.primaryColor} 0%, ${this.primaryColor}dd 100%) !important;
                border-color: ${this.primaryColor} !important;
            }
            
            .toggle-btn:hover {
                background: #3a3a3a !important;
                border-color: ${this.primaryColor} !important;
                color: ${this.primaryColor} !important;
            }
            
            .btn-secondary {
                background: linear-gradient(135deg, #424242 0%, #616161 100%) !important;
                color: white !important;
                border: 1px solid #757575 !important;
            }
            
            .btn-danger {
                background: linear-gradient(135deg, #c62828 0%, #d32f2f 100%) !important;
                color: white !important;
                border: 1px solid #f44336 !important;
            }
            
            .add-new-btn {
                background: linear-gradient(135deg, #2d7d32 0%, #388e3c 100%) !important;
                color: white !important;
                border: 1px solid #4caf50 !important;
            }
            
            /* Switches */
            .slider {
                background-color: #404040 !important;
            }
            
            input:checked + .slider {
                background-color: ${this.primaryColor} !important;
            }
            
            /* Settings Specific */
            .settings-section {
                background: #0f0f0f !important;
            }
            
            .settings-list {
                background: #1a1a1a !important;
                border: 1px solid #303030 !important;
            }
            
            .setting-item {
                border-bottom: 1px solid #303030 !important;
            }
            
            .theme-toggle {
                background: #2a2a2a !important;
            }
            
            .theme-option.active {
                background: #404040 !important;
                color: #ffffff !important;
            }
            
            .theme-option {
                color: #aaaaaa !important;
            }
            
            .color-picker {
                border-color: #404040 !important;
            }
            
            .color-value {
                background: #2a2a2a !important;
                color: #aaaaaa !important;
                border-color: #404040 !important;
            }
            
            /* About Section */
            .about-content {
                background: #1a1a1a !important;
                border: 1px solid #303030 !important;
            }
            
            .about-links a {
                color: ${this.primaryColor} !important;
            }
            
            /* Amount and Status */
            .amount,
            .stat-number {
                color: ${this.primaryColor} !important;
            }
            
            .status {
                color: #aaaaaa !important;
            }
            
            /* Modal */
            .modal {
                background: #1a1a1a !important;
                border: 1px solid #303030 !important;
            }
            
            .modal-header {
                background: #202020 !important;
                border-bottom: 1px solid #303030 !important;
                color: #ffffff !important;
            }
            
            /* Icons */
            .section-title i,
            .back-icon,
            .notification-icon,
            .settings-icon {
                color: ${this.primaryColor} !important;
            }
            
            /* Notification */
            .message-notification,
            .theme-notification {
                background: linear-gradient(135deg, ${this.primaryColor} 0%, ${this.primaryColor}dd 100%) !important;
                box-shadow: 0 4px 15px ${this.primaryColor}40 !important;
            }
        `;
        
        styleElement.textContent = darkCSS;
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    }

    // Theme toggle injection disabled
    addThemeToggleToHeader() {
        return;
    }

    // Toggle between light and dark themes
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        this.updateThemeToggleButton();
    }

    // Update theme toggle button
    updateThemeToggleButton() {
        const themeToggle = document.querySelector('.theme-toggle-btn');
        if (themeToggle) {
            themeToggle.innerHTML = this.currentTheme === 'dark' ? 
                '<i class="fas fa-sun"></i>' : 
                '<i class="fas fa-moon"></i>';
            themeToggle.title = this.currentTheme === 'dark' ? 'Switch to Light' : 'Switch to Dark';
            themeToggle.style.color = this.currentTheme === 'dark' ? '#ffffff' : this.primaryColor;
        }
    }

    // Get current theme
    getCurrentTheme() {
        return this.currentTheme;
    }

    // Update primary color
    updatePrimaryColor(color) {
        this.primaryColor = '#667eea';
        localStorage.setItem('primaryColor', '#667eea');
        this.applyTheme(this.currentTheme);
    }
}

// Auto-initialize theme loader
document.addEventListener('DOMContentLoaded', function() {
    window.youtubeThemeLoader = new YouTubeThemeLoader();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = YouTubeThemeLoader;
}
