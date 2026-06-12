/**
 * Navigation and Sidebar Management
 * Handles menu toggling, mobile navigation, and routing
 */

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobileMenuOverlay');
  const hamburger = document.getElementById('hamburgerMenu');

  if (!sidebar) return;

  sidebar.classList.toggle('active');
  if (overlay) overlay.classList.toggle('active');
  if (hamburger) hamburger.classList.toggle('active');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobileMenuOverlay');
  const hamburger = document.getElementById('hamburgerMenu');

  if (!sidebar) return;

  sidebar.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  if (hamburger) hamburger.classList.remove('active');
}

function navigateTo(section) {
  closeSidebar();
  
  const routes = {
    'home': 'home.html',
    'dashboard': 'dashboard.html',
    'products': 'products.html',
    'menu': 'menu.html',
    'transactions': 'transactions.html',
    'business-card': 'business-card.html',
    'settings': 'settings.html'
  };

  if (routes[section]) {
    window.location.href = routes[section];
  }
}

function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = 'home.html';
  }
}

function goToPersonalInfo() {
  closeSidebar();
  window.location.href = 'personal-info.html';
}

function goToNotifications() {
  closeSidebar();
  window.location.href = 'notifications.html';
}

function goToAutoSaveSettings() {
  closeSidebar();
  window.location.href = 'autosave-settings.html';
}

function goToSettings() {
  navigateTo('settings');
}

function refreshData() {
  location.reload();
}

function exportData() {
  alert('Export feature coming soon!');
}

// Close sidebar when clicking outside on mobile
document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.addEventListener('click', function(e) {
      if (e.target.closest('.sidebar-nav-item')) {
        setTimeout(closeSidebar, 100);
      }
    });
  }
});
