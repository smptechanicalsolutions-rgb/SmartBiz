// auth-status.js — header login/logout state (delegates to simple-login-button.js when loaded)

(function() {
  const scopedStorageKeys = new Set([
    'invoiceData',
    'invoiceHistory',
    'savedShipping',
    'savedPayment',
    'savedPayments',
    'savedClients'
  ]);

  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  function getCurrentAuthUserForStorage() {
    let user = null;
    if (window.authService && typeof authService.getCurrentUser === 'function') {
      user = authService.getCurrentUser();
    }
    if (!user) {
      try {
        const sessionData = JSON.parse(originalGetItem.call(localStorage, 'smarbiz_session') || 'null');
        if (sessionData && sessionData.user) {
          user = sessionData.user;
        } else {
          const authCurrent = JSON.parse(originalGetItem.call(localStorage, 'auth_current') || 'null');
          if (authCurrent && authCurrent.email) {
            user = authCurrent;
          }
        }
      } catch (e) {
        // ignore malformed auth data
      }
    }
    return user;
  }

  function getScopedStorageKey(key, user) {
    if (!scopedStorageKeys.has(key)) {
      return key;
    }
    user = user || getCurrentAuthUserForStorage();
    if (!user) {
      return key;
    }
    const identifier = (user.uid || user.email || user.id || '').toString().trim();
    if (!identifier) {
      return key;
    }
    return `${key}::user::${identifier}`;
  }

  Storage.prototype.getItem = function(key) {
    const user = getCurrentAuthUserForStorage();
    const scopedKey = getScopedStorageKey(key, user);
    const result = originalGetItem.call(this, scopedKey);
    if (result === null && scopedKey !== key && !user) {
      return originalGetItem.call(this, key);
    }
    return result;
  };

  Storage.prototype.setItem = function(key, value) {
    const scopedKey = getScopedStorageKey(key);
    return originalSetItem.call(this, scopedKey, value);
  };

  Storage.prototype.removeItem = function(key) {
    const scopedKey = getScopedStorageKey(key);
    return originalRemoveItem.call(this, scopedKey);
  };
})();

async function updateAuthNav() {
  if (window.SmarbizAuth && typeof SmarbizAuth.updateNav === 'function') {
    SmarbizAuth.updateNav();
    return;
  }

  const headerRight = document.querySelector('.header-right');
  if (!headerRight) return;

  // The header contains `#loginIcon` and `#logoutIcon` elements. We will
  // only use `#loginIcon` in the header; user email and logout are moved to
  // the Settings page footer. Ensure elements exist for toggling.
  const loginIcon = document.getElementById('loginIcon');
  const logoutIcon = document.getElementById('logoutIcon');

  let currentUser = null;
  let isLoggedIn = false;

  if (window.authService && typeof authService.isLoggedIn === 'function') {
    isLoggedIn = authService.isLoggedIn();
    if (isLoggedIn && typeof authService.getCurrentUser === 'function') {
      currentUser = authService.getCurrentUser();
    }
  }

  if (!isLoggedIn) {
    const sessionData = JSON.parse(localStorage.getItem('smarbiz_session') || 'null');
    const authCurrent = JSON.parse(localStorage.getItem('auth_current') || 'null');
    if (sessionData && sessionData.user) {
      isLoggedIn = true;
      currentUser = sessionData.user;
    } else if (authCurrent && authCurrent.email) {
      isLoggedIn = true;
      currentUser = authCurrent;
    }
  }

  // For header: when logged in hide all login/logout controls.
  const headerAuthRight = document.querySelector('.header-right');
  if (headerAuthRight) {
    const authControls = Array.from(headerAuthRight.querySelectorAll('#loginIcon, #logoutIcon, .login-header-btn, .logout-header-btn, a[href*="login.html"], a[href*="/login.html"], a[href*="logout"], button[id^="login"], button[id^="logout"]'));
    authControls.forEach(el => {
      if (isLoggedIn && currentUser) {
        if (el.id === 'logoutIcon' || el.id === 'logoutBtn') {
          el.style.display = 'inline-block';
          return;
        }
        el.style.display = 'none';
      } else {
        if (el.id === 'loginIcon' || el.id === 'loginBtn') {
          el.style.display = 'inline-block';
        } else if (el.id !== 'logoutBtn' && el.id !== 'logoutIcon') {
          el.style.display = '';
        }
      }
    });
  }

  if (loginIcon) loginIcon.style.display = isLoggedIn && currentUser ? 'none' : 'inline-block';
  if (logoutIcon) logoutIcon.style.display = isLoggedIn && currentUser ? 'inline-block' : 'none';

  // Update Firestore sync indicator
  if (typeof updateFirestoreSyncStatus === 'function') updateFirestoreSyncStatus();
}

// Firestore sync indicator element and updater
function updateFirestoreSyncStatus() {
  const headerRight = document.querySelector('.header-right');
  if (!headerRight) return;
  let syncEl = document.getElementById('firestoreSync');
  if (!syncEl) {
    syncEl = document.createElement('span');
    syncEl.id = 'firestoreSync';
    syncEl.style.cssText = 'font-size:0.9rem;opacity:0.9;margin-right:8px;display:inline-flex;align-items:center;gap:6px;';
    const dot = document.createElement('span');
    dot.id = 'firestoreSyncDot';
    dot.style.cssText = 'width:10px;height:10px;border-radius:50%;background:#999;display:inline-block;';
    const txt = document.createElement('span');
    txt.id = 'firestoreSyncText';
    txt.textContent = 'Sync';
    txt.style.cssText = 'font-size:0.85rem;opacity:0.85;';
    syncEl.appendChild(dot);
    syncEl.appendChild(txt);
    headerRight.insertBefore(syncEl, headerRight.firstChild);
  }

  // Default: unknown / disabled
  const dot = document.getElementById('firestoreSyncDot');
  const txt = document.getElementById('firestoreSyncText');
  if (!window.firebaseService || typeof window.firebaseService.listInvoices !== 'function') {
    if (dot) dot.style.background = '#999';
    if (txt) txt.textContent = 'Sync: N/A';
    return;
  }

  // If firebaseService is present, try a lightweight call to detect connectivity/auth
  window.firebaseService.getCurrentUser().then(user => {
    if (!user) {
      if (dot) dot.style.background = '#f0ad4e';
      if (txt) txt.textContent = 'Sync: Signed out';
      return;
    }
    window.firebaseService.listInvoices({ limit: 1 }).then(list => {
      if (Array.isArray(list)) {
        if (dot) dot.style.background = '#28a745';
        if (txt) txt.textContent = `Sync: ${list.length} items`;
      } else {
        if (dot) dot.style.background = '#ffc107';
        if (txt) txt.textContent = 'Sync: Unknown';
      }
    }).catch(err => {
      if (dot) dot.style.background = '#dc3545';
      if (txt) txt.textContent = 'Sync: Offline';
    });
  }).catch(e => {
    if (dot) dot.style.background = '#dc3545';
    if (txt) txt.textContent = 'Sync: Error';
  });
}

// Listen for auth change event that firebase.js dispatches
window.addEventListener('firebase-auth-changed', () => {
  try { updateFirestoreSyncStatus(); } catch (e) {}
});

function getLoginPageUrl() {
  if (window.location.protocol.startsWith('http')) {
    return '/login.html';
  }
  // For file:// protocol, navigate to login.html in the same directory
  // All HTML files are at the same level (root of the app)
  const currentPath = window.location.pathname;
  const lastSlash = currentPath.lastIndexOf('/');
  const baseDir = currentPath.substring(0, lastSlash + 1);
  return baseDir + 'login.html';
}

function logout() {
  if (window.SmarbizAuth && typeof SmarbizAuth.logout === 'function') {
    SmarbizAuth.logout();
    return;
  }
  fetch('/api/logout', { method: 'POST' })
    .catch(err => {
      console.warn('Logout API call failed (server may not be running):', err);
    })
    .finally(() => {
      localStorage.removeItem('smarbiz_session');
      localStorage.removeItem('auth_current');
      window.location.href = getLoginPageUrl();
    });
}

document.addEventListener('DOMContentLoaded', updateAuthNav);
window.addEventListener('storage', (e) => {
  if (e.key === 'smarbiz_session' || e.key === 'auth_current') updateAuthNav();
});

window.updateAuthNav = updateAuthNav;
window.logout = logout;
