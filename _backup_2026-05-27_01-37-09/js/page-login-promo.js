// Login promo banner + header button styling (used on main app pages)
(function () {
  function isLoggedIn() {
    if (window.SmarbizAuth && typeof SmarbizAuth.isLoggedIn === 'function') {
      return SmarbizAuth.isLoggedIn();
    }
    if (window.authService && typeof authService.isLoggedIn === 'function') {
      return authService.isLoggedIn();
    }
    return false;
  }

  function loginHref() {
    const body = document.body;
    const prefix = body.dataset.loginPrefix || '';
    const redirect = body.dataset.loginRedirect || '';
    let url = prefix + 'login.html';
    if (redirect) {
      url += '?redirect=' + encodeURIComponent(redirect);
    }
    return url;
  }

  function enhanceLoginIcon() {
    const el = document.getElementById('loginIcon');
    if (!el) return;
    el.classList.add('page-login-btn');
    el.href = loginHref();
    if (el.classList.contains('page-login-btn')) {
      el.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login / Sign up';
      return;
    }
    if (!el.querySelector('.fa-sign-in-alt')) {
      const label = (el.textContent || '').trim().replace(/^\s*/, '') || 'Login';
      el.innerHTML = '<i class="fas fa-sign-in-alt"></i> ' + (label === 'Login' ? 'Login' : label);
    }
  }

  function injectBanner() {
    const body = document.body;
    if (!body.hasAttribute('data-login-promo')) return;
    if (document.getElementById('pageLoginBanner')) return;

    const target =
      document.querySelector('.content-area') ||
      document.querySelector('main.main-content') ||
      document.querySelector('.main-content');

    if (!target) return;

    const title = body.dataset.loginTitle || 'Welcome to SmartBiz';
    const desc =
      body.dataset.loginDesc ||
      'Sign in to sync your data and unlock all features on this page.';

    const banner = document.createElement('div');
    banner.className = 'page-login-banner';
    banner.id = 'pageLoginBanner';
    banner.innerHTML =
      '<div class="page-login-banner-text">' +
      '<h3>' + title + '</h3>' +
      '<p>' + desc + '</p>' +
      '</div>' +
      '<a class="page-login-cta" href="' +
      loginHref() +
      '"><i class="fas fa-sign-in-alt"></i> Login / Sign up</a>';

    // Prefer placing the banner after the page header so it aligns
    // visually with the header action buttons (Refresh / Export).
    const contentHeader = target.parentNode && target.parentNode.querySelector
      ? target.parentNode.querySelector('.content-header')
      : null;

    if (contentHeader && contentHeader.parentNode) {
      contentHeader.insertAdjacentElement('afterend', banner);
      banner.classList.add('full-width');
    } else {
      target.insertBefore(banner, target.firstChild);
    }
  }

  function updatePageLoginUI() {
    if (!document.body.hasAttribute('data-login-promo')) return;
    const loggedIn = isLoggedIn();
    const banner = document.getElementById('pageLoginBanner');
    if (banner) banner.style.display = loggedIn ? 'none' : 'flex';
  }

  function init() {
    if (!document.body.hasAttribute('data-login-promo')) return;
    enhanceLoginIcon();
    injectBanner();
    updatePageLoginUI();
  }

  window.updatePageLoginUI = updatePageLoginUI;

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('storage', function (e) {
    if (e.key === 'smarbiz_session' || e.key === 'auth_current') {
      updatePageLoginUI();
    }
  });
})();
