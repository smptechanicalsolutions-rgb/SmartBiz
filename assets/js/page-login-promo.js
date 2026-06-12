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
      el.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
      return;
    }
    if (!el.querySelector('.fa-sign-in-alt')) {
      const label = (el.textContent || '').trim().replace(/^\s*/, '') || 'Login';
      el.innerHTML = '<i class="fas fa-sign-in-alt"></i> ' + (label === 'Login' ? 'Login' : label);
    }
  }

  function injectBanner() {
    const banner = document.getElementById('pageLoginBanner');
    if (banner) banner.remove();
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
  }

  window.updatePageLoginUI = updatePageLoginUI;

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('storage', function (e) {
    if (e.key === 'smarbiz_session' || e.key === 'auth_current') {
      updatePageLoginUI();
    }
  });
})();
