// shared client-side logic for login/signup pages

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  // toggle visibility for password inputs
  document.querySelectorAll('.toggle-password').forEach(el => {
    el.addEventListener('click', () => {
      const input = el.previousElementSibling;
      if (input && input.type === 'password') {
        input.type = 'text';
        el.textContent = '🙈';
      } else if (input) {
        input.type = 'password';
        el.textContent = '👁️';
      }
    });
  });

  // helper to read query params
  function queryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  // forgot password flow
  const forgotForm = document.getElementById('forgotForm');
  if (forgotForm) {
    const errorBox = document.getElementById('forgotError');
    const successBox = document.getElementById('forgotSuccess');
    const btn = document.getElementById('forgotBtn');
    forgotForm.addEventListener('submit', async e => {
      e.preventDefault();
      errorBox.classList.add('d-none');
      successBox.classList.add('d-none');
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending…`;
      const email = document.getElementById('email').value.trim();
      try {
        const resp = await fetch('/api/request-password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Unable to process');
        successBox.textContent = data.message || 'If that email exists, a reset link has been sent.';
        successBox.classList.remove('d-none');
        if (data.resetLink) {
          // automatically go to reset page (demo)
          setTimeout(() => { window.location.href = data.resetLink; }, 1500);
        }
      } catch (err) {
        errorBox.textContent = err.message;
        errorBox.classList.remove('d-none');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Send Reset Link';
      }
    });
  }

  // reset password flow
  const resetForm = document.getElementById('resetForm');
  if (resetForm) {
    const errorBox = document.getElementById('resetError');
    const successBox = document.getElementById('resetSuccess');
    const btn = document.getElementById('resetBtn');
    const token = queryParam('token');
    if (!token) {
      resetForm.style.display = 'none';
      errorBox.textContent = 'Missing reset token. Please use the link sent to your email.';
      errorBox.classList.remove('d-none');
    } else {
      resetForm.addEventListener('submit', async e => {
        e.preventDefault();
        errorBox.classList.add('d-none');
        successBox.classList.add('d-none');
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating…`;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        try {
          const resp = await fetch('/api/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password, confirmPassword })
          });
          const data = await resp.json();
          if (!resp.ok) throw new Error(data.error || 'Unable to reset password');
          successBox.textContent = 'Password updated! Redirecting to login...';
          successBox.classList.remove('d-none');
          setTimeout(() => { window.location.href = '/login.html'; }, 2000);
        } catch (err) {
          errorBox.textContent = err.message;
          errorBox.classList.remove('d-none');
        } finally {
          btn.disabled = false;
          btn.textContent = 'Change Password';
        }
      });
    }
  }

  // resend verification form
  const resendForm = document.getElementById('resendForm');
  if (resendForm) {
    const errorBox = document.getElementById('resendError');
    const successBox = document.getElementById('resendSuccess');
    const btn = document.getElementById('resendBtn');
    resendForm.addEventListener('submit', async e => {
      e.preventDefault();
      errorBox.classList.add('d-none');
      successBox.classList.add('d-none');
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending…`;
      const email = document.getElementById('email').value.trim();
      try {
        const resp = await fetch('/api/resend-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Unable to resend');
        successBox.textContent = data.message || 'Link resent (check console).';
        successBox.classList.remove('d-none');
        if (data.verificationLink) {
          setTimeout(() => { window.location.href = data.verificationLink; }, 1500);
        }
      } catch (err) {
        errorBox.textContent = err.message;
        errorBox.classList.remove('d-none');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Send Link';
      }
    });
  }

  // email verification page
  const verifyMessage = document.getElementById('verifyMessage');
  const verifyError = document.getElementById('verifyError');
  const verifySuccess = document.getElementById('verifySuccess');
  if (verifyMessage) {
    const token = queryParam('token');
    if (!token) {
      verifyMessage.style.display = 'none';
      verifyError.textContent = 'Missing token';
      verifyError.classList.remove('d-none');
    } else {
      fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      .then(r => r.json())
      .then(data => {
        verifyMessage.style.display = 'none';
        if (data.success) {
          verifySuccess.textContent = 'Email verified! You may now login.';
          verifySuccess.classList.remove('d-none');
        } else {
          verifyError.textContent = data.error || 'Verification failed';
          verifyError.classList.remove('d-none');
        }
      })
      .catch(err => {
        verifyMessage.style.display = 'none';
        verifyError.textContent = err.message;
        verifyError.classList.remove('d-none');
      });
    }
  }

  if (loginForm) {
    const errorBox = document.getElementById('loginError');
    const submitBtn = document.getElementById('loginBtn');
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      errorBox.classList.add('d-none');
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in…`;
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const remember = document.getElementById('remember')?.checked;
      try {
        const resp = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, remember })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Unable to login');
        // redirect to home/dashboard
        window.location.href = '/home.html';
      } catch (err) {
        let message = err.message || '';
        if (message.toLowerCase().includes('not verified')) {
          message += ' (check console or visit /verify-email.html?token=YOUR_TOKEN)';
        }
        errorBox.textContent = message;
        errorBox.classList.remove('d-none');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
      }
    });
  }

  if (signupForm) {
    const errorBox = document.getElementById('signupError');
    const submitBtn = document.getElementById('signupBtn');
    signupForm.addEventListener('submit', async e => {
      e.preventDefault();
      errorBox.classList.add('d-none');
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating…`;
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      try {
        const resp = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, confirmPassword })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Unable to create account');
        // show server message if present then redirect
        if (data.message) {
          errorBox.classList.remove('d-none');
          errorBox.classList.remove('alert-danger');
          errorBox.classList.add('alert-success');
          errorBox.textContent = data.message;
          // if server returned verification link, navigate there after a moment
          if (data.verificationLink) {
            setTimeout(() => { window.location.href = data.verificationLink; }, 2000);
          } else {
            setTimeout(() => { window.location.href = '/login.html'; }, 3000);
          }
        } else {
          window.location.href = '/login.html';
        }
      } catch (err) {
        errorBox.textContent = err.message;
        errorBox.classList.remove('d-none');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    });
  }
});
