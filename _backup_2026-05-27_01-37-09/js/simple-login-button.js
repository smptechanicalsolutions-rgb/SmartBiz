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
    const depth = window.location.pathname.split('/').filter(Boolean).length - 1;
    const prefix = depth > 0 ? '../'.repeat(depth) : '';
    const base = prefix + 'login.html';
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

  function doLogout() {
    if (window.authService && typeof authService.logout === 'function') {
      authService.logout();
      return;
    }
    fetch('/api/logout', { method: 'POST' }).finally(() => {
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
      logoutEl.className = 'btn btn-secondary logout-header-btn smarbiz-logout-btn';
      logoutEl.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
      logoutEl.style.display = 'none';
      logoutEl.addEventListener('click', doLogout);
      target.appendChild(logoutEl);
    }

    if (loggedIn && user) {
      const label = user.email || user.fullName || user.name || 'Account';
      if (userEmailEl) {
        userEmailEl.textContent = label;
        userEmailEl.style.display = 'inline-block';
        userEmailEl.title = label;
      }
      if (loginEl) loginEl.style.display = 'none';
      if (logoutEl) logoutEl.style.display = 'inline-flex';
    } else {
      if (userEmailEl) userEmailEl.style.display = 'none';
      if (loginEl) loginEl.style.display = 'inline-flex';
      if (logoutEl) logoutEl.style.display = 'none';
    }

    if (typeof window.updatePageLoginUI === 'function') {
      window.updatePageLoginUI();
    }
    if (typeof window.updateHomeLoginUI === 'function') {
      window.updateHomeLoginUI();
    }
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
    if (typeof window.updateAuthNav === 'function') window.updateAuthNav();
  });
  window.addEventListener('storage', (e) => {
    if (e.key === 'smarbiz_session' || e.key === 'auth_current') updateNav();
  });
})();
