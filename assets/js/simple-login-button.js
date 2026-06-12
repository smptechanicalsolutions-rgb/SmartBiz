// Ensures a consistent Login / account control on every app page.
(function () {
  const AUTH_PAGES = new Set([
    'login.html', 'signup.html', 'forgot.html', 'reset.html', 'reset-password.html',
    'verify-email.html', 'resend.html', 'email-test.html'
  ]);

  function pageName() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return (parts[parts.length - 1] || '').toLowerCase();
  }

  function isAuthPage() {
    return AUTH_PAGES.has(pageName());
  }

  function loginUrl() {
    // Get the base directory of the current page
    const currentPath = window.location.pathname;
    const lastSlash = currentPath.lastIndexOf('/');
    const baseDir = currentPath.substring(0, lastSlash + 1);
    const base = baseDir + 'login.html';
    const current = pageName();
    if (current && !AUTH_PAGES.has(current)) {
      return base + '?redirect=' + encodeURIComponent(current);
    }
    return base;
  }

  function readSessionUser() {
    try {
      const raw = localStorage.getItem('smarbiz_session');
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data && data.user) {
        if (data.expiresAt && data.expiresAt <= Date.now()) return null;
        return data.user;
      }
      if (data && data.email) return data;
    } catch (e) { /* ignore */ }
    try {
      return JSON.parse(localStorage.getItem('auth_current') || 'null');
    } catch (e) {
      return null;
    }
  }

  function isLoggedIn() {
    if (window.authService && typeof authService.isLoggedIn === 'function') {
      return authService.isLoggedIn();
    }
    return !!readSessionUser();
  }

  function getCurrentUser() {
    if (window.authService && typeof authService.getCurrentUser === 'function') {
      return authService.getCurrentUser() || readSessionUser();
    }
    return readSessionUser();
  }

  function ensureHeaderRight() {
    const header = document.querySelector('.header') || document.querySelector('header.app-header') || document.querySelector('header');
    if (!header) return null;

    let headerRight = header.querySelector('.header-right');
    if (!headerRight) {
      headerRight = document.createElement('div');
      headerRight.className = 'header-right';
      header.appendChild(headerRight);
    }
    return headerRight;
  }

  function mountTarget() {
    return (
      document.querySelector('.header-right') ||
      document.querySelector('.content-actions') ||
      ensureHeaderRight()
    );
  }

  function createMigrateButton(target) {
    return null;
  }

  function hideExtraAuthButtons(loggedIn) {
    document.querySelectorAll('a[href*="login.html"], a[href*="/login.html"], #loginIcon, #loginBtn, .login-cta').forEach((el) => {
      if (loggedIn) {
        el.style.display = 'none';
      } else if (el.id === 'loginIcon' || el.id === 'loginBtn') {
        el.style.display = 'inline-flex';
      } else {
        el.style.display = '';
      }
    });

    document.querySelectorAll('#logoutIcon, .logout-header-btn, a[href*="logout"], button[id^="logout"]').forEach((el) => {
      el.style.display = loggedIn ? 'inline-flex' : 'none';
    });
  }

  function doLogout() {
    if (window.authService && typeof authService.logout === 'function') {
      authService.logout();
      return;
    }
    fetch('/api/logout', { method: 'POST' })
      .catch(err => {
        console.warn('Logout API call failed (server may not be running):', err);
      })
      .finally(() => {
        localStorage.removeItem('smarbiz_session');
        localStorage.removeItem('auth_current');
        window.location.href = loginUrl();
      });
  }

  function applyLoginStyles(el) {
    el.classList.add('login-header-btn', 'smarbiz-login-btn');
    if (!el.classList.contains('btn')) {
      el.style.cssText = [
        'display:inline-flex',
        'align-items:center',
        'gap:8px',
        'padding:8px 16px',
        'background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
        'color:#fff',
        'text-decoration:none',
        'border-radius:6px',
        'font-weight:500',
        'font-size:14px',
        'border:none',
        'cursor:pointer',
        'white-space:nowrap'
      ].join(';');
    }
  }

  function updateNav() {
    if (isAuthPage()) return;

    const loggedIn = isLoggedIn();
    const user = getCurrentUser();
    const target = mountTarget();

    let loginEl = document.getElementById('loginIcon');
    let logoutEl = document.getElementById('logoutIcon');
    let userEmailEl = document.getElementById('userEmail');

    if (!userEmailEl && target) {
      userEmailEl = document.createElement('span');
      userEmailEl.id = 'userEmail';
      userEmailEl.style.cssText = 'font-size:0.9rem;opacity:0.9;margin-right:8px;color:inherit;';
      target.insertBefore(userEmailEl, target.firstChild);
    }

    if (!loginEl) {
      loginEl = document.createElement('a');
      loginEl.id = 'loginIcon';
      loginEl.href = loginUrl();
      loginEl.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
      applyLoginStyles(loginEl);
      if (target) {
        target.appendChild(loginEl);
      } else {
        loginEl.style.position = 'fixed';
        loginEl.style.top = '12px';
        loginEl.style.right = '12px';
        loginEl.style.zIndex = '10000';
        document.body.appendChild(loginEl);
      }
    } else {
      loginEl.href = loginUrl();
      applyLoginStyles(loginEl);
      if (!loginEl.querySelector('i')) {
        loginEl.innerHTML = '<i class="fas fa-sign-in-alt"></i> ' + (loginEl.textContent.trim() || 'Login');
      }
    }

    if (!logoutEl && target) {
      logoutEl = document.createElement('button');
      logoutEl.id = 'logoutIcon';
      logoutEl.type = 'button';
      logoutEl.className = 'logout-header-btn';
      logoutEl.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
      logoutEl.addEventListener('click', doLogout);
      target.appendChild(logoutEl);
    }
    if (logoutEl) applyLogoutStyles(logoutEl);

    // Keep header minimal: only show the login button and hide all extra header actions.
    if (userEmailEl) {
      userEmailEl.style.display = loggedIn ? 'inline-block' : 'none';
      userEmailEl.textContent = loggedIn && user ? (user.fullName || user.email || '') : '';
    }
    if (loginEl) {
      loginEl.style.display = loggedIn ? 'none' : 'inline-flex';
    }
    if (logoutEl) {
      logoutEl.style.display = loggedIn ? 'inline-flex' : 'none';
    }
    hideExtraAuthButtons(loggedIn);

    if (typeof window.updatePageLoginUI === 'function') {
      window.updatePageLoginUI();
    }
    if (typeof window.updateHomeLoginUI === 'function') {
      window.updateHomeLoginUI();
    }
  }

  function applyLogoutStyles(el) {
    el.classList.remove('btn-secondary');
    el.classList.add('login-header-btn', 'smarbiz-logout-btn');
    el.style.cssText = [
      'display:none',
      'align-items:center',
      'gap:8px',
      'padding:8px 16px',
      'background:#fff',
      'color:#333',
      'border:1px solid rgba(0,0,0,0.1)',
      'border-radius:8px',
      'font-weight:500',
      'font-size:14px',
      'cursor:pointer',
      'white-space:nowrap',
      'box-shadow:0 2px 8px rgba(0,0,0,0.1)',
      'transition:all 0.3s ease'
    ].join(';');
  }

  function showOptionalLoginNotice() {
    if (isAuthPage() || pageName() !== 'home.html' || isLoggedIn()) return;
    if (sessionStorage.getItem('smarbiz_optional_login_notice') === '1') return;
    sessionStorage.setItem('smarbiz_optional_login_notice', '1');

    const notice = document.createElement('div');
    notice.style.cssText = [
      'position:fixed',
      'left:14px',
      'right:14px',
      'bottom:calc(82px + env(safe-area-inset-bottom,0px))',
      'z-index:10050',
      'max-width:520px',
      'margin:0 auto',
      'padding:12px 14px',
      'border-radius:10px',
      'background:#0f172a',
      'color:#fff',
      'box-shadow:0 12px 28px rgba(15,23,42,.24)',
      'font:500 13px/1.4 system-ui,sans-serif',
      'text-align:center'
    ].join(';');
    notice.textContent = 'Login is optional. You can use all SmartBiz tools without signing in.';
    document.body.appendChild(notice);

    setTimeout(() => {
      notice.style.transition = 'opacity .25s ease, transform .25s ease';
      notice.style.opacity = '0';
      notice.style.transform = 'translateY(8px)';
      setTimeout(() => notice.remove(), 280);
    }, 3600);
  }

  window.SmarbizAuth = {
    loginUrl,
    isLoggedIn,
    getCurrentUser,
    updateNav,
    logout: doLogout
  };

  document.addEventListener('DOMContentLoaded', () => {
    updateNav();
    showOptionalLoginNotice();
    if (typeof window.updateAuthNav === 'function') window.updateAuthNav();
  });
  window.addEventListener('storage', (e) => {
    if (e.key === 'smarbiz_session' || e.key === 'auth_current') updateNav();
  });
})();
