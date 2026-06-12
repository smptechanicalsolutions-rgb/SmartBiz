// auth-status.js — header login/logout state (delegates to simple-login-button.js when loaded)

async function updateAuthNav() {
  if (window.SmarbizAuth && typeof SmarbizAuth.updateNav === 'function') {
    SmarbizAuth.updateNav();
    return;
  }

  const headerRight = document.querySelector('.header-right');
  if (!headerRight) return;

  let userEmailEl = document.getElementById('userEmail');
  if (!userEmailEl) {
    userEmailEl = document.createElement('span');
    userEmailEl.id = 'userEmail';
    userEmailEl.style.cssText = 'font-size:0.9rem;opacity:0.8;margin-right:10px;';
    headerRight.insertBefore(userEmailEl, headerRight.firstChild);
  }

  const isLoggedIn = window.authService && authService.isLoggedIn ? authService.isLoggedIn() : false;
  const loginIcon = document.getElementById('loginIcon');
  const logoutIcon = document.getElementById('logoutIcon');

  if (isLoggedIn) {
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.email) {
      userEmailEl.textContent = currentUser.email;
      userEmailEl.style.display = 'inline-block';
    }
    if (loginIcon) loginIcon.style.display = 'none';
    if (logoutIcon) logoutIcon.style.display = 'inline-block';
  } else {
    userEmailEl.style.display = 'none';
    if (loginIcon) loginIcon.style.display = 'inline-block';
    if (logoutIcon) logoutIcon.style.display = 'none';
  }
}

function logout() {
  if (window.SmarbizAuth && typeof SmarbizAuth.logout === 'function') {
    SmarbizAuth.logout();
    return;
  }
  fetch('/api/logout', { method: 'POST' }).finally(() => {
    window.location.href = 'login.html';
  });
}

document.addEventListener('DOMContentLoaded', updateAuthNav);
window.addEventListener('storage', (e) => {
  if (e.key === 'smarbiz_session' || e.key === 'auth_current') updateAuthNav();
});

window.updateAuthNav = updateAuthNav;
window.logout = logout;
