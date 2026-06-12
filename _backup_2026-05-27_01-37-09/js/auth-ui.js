// Lightweight client-side auth UI with EmailJS verification
(function(){
  const SERVICE_ID = 'service_x34y97v';
  const TEMPLATE_ID = 'template_3gx4u0s';
  const PUBLIC_KEY = 'NeVCNKWT1su15VeDt';

  // init EmailJS if available
  if (window.emailjs && typeof emailjs.init === 'function') {
    emailjs.init(PUBLIC_KEY);
  }

  function qs(selector, ctx=document) { return ctx.querySelector(selector); }

  // utilities
  function randSalt() {
    return Array.from(crypto.getRandomValues(new Uint8Array(12))).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  async function sha256Hex(message) {
    const enc = new TextEncoder();
    const data = enc.encode(message);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  function loadUsers(){
    return JSON.parse(localStorage.getItem('auth_users')||'{}');
  }
  function saveUsers(u){ localStorage.setItem('auth_users', JSON.stringify(u)); }

  function currentUser(){ return JSON.parse(localStorage.getItem('auth_current')||'null'); }
  function setSessionFlag(user){
    try{ localStorage.setItem('smarbiz_session', JSON.stringify(user||null)); }catch(e){}
  }
  function setCurrent(user){ localStorage.setItem('auth_current', JSON.stringify(user)); setSessionFlag(user); updateButton(); if(typeof updateAuthUI==='function') try{ updateAuthUI(); }catch(e){} }
  function clearCurrent(){ localStorage.removeItem('auth_current'); setSessionFlag(null); updateButton(); if(typeof updateAuthUI==='function') try{ updateAuthUI(); }catch(e){} }

  // Create floating button
  const btn = document.createElement('button');
  btn.id = 'authFloatingBtn';
  btn.className = 'auth-floating-btn';
  btn.title = 'Login / Account';
  document.addEventListener('DOMContentLoaded', ()=>{
    document.body.appendChild(btn);
    renderButton();
    injectModal();
    injectHeaderButton();
  });

  // Inject header button in top-right if page has header area
  let headerBtn;
  function injectHeaderButton(){
    // try to place the button inside a header action area if available
    const header = document.querySelector('.header') || document.querySelector('.app-header') || document.querySelector('header');
    headerBtn = document.createElement('button');
    headerBtn.className = 'auth-header-btn';
    headerBtn.textContent = 'Login';
    headerBtn.onclick = ()=> openModal();

    // Prefer app content-actions / header action area to avoid overlaying existing buttons
    const actions = document.querySelector('.content-actions') || document.querySelector('.header-right') || header && header.querySelector('.content-actions');
    if (actions) {
      // insert into actions area so layout flows naturally
      headerBtn.style.position = 'relative';
      headerBtn.style.marginLeft = '8px';
      actions.appendChild(headerBtn);
    } else if (header) {
      // append to header; ensure header is positioned for absolute children
      if (getComputedStyle(header).position === 'static') header.style.position = 'relative';
      headerBtn.style.position = 'absolute';
      headerBtn.style.top = '12px';
      headerBtn.style.right = '12px';
      header.appendChild(headerBtn);
    } else {
      // fallback: fixed position at top-right but with safe offset
      headerBtn.style.position = 'fixed';
      headerBtn.style.top = '12px';
      headerBtn.style.right = '120px';
      headerBtn.style.zIndex = 10040;
      document.body.appendChild(headerBtn);
    }
    syncHeaderButton();
  }

  function syncHeaderButton(){
    const u = currentUser();
    if(!headerBtn) return;
    headerBtn.textContent = u ? (u.name || u.email) : 'Login';
  }

  function renderButton(){
    const u = currentUser();
    btn.textContent = u ? (u.name || u.email) : 'Log in';
    btn.onclick = ()=> openModal();
  }
  function updateButton(){ renderButton(); syncHeaderButton(); }

  // Modal markup
  let modal;
  function injectModal(){
    modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-modal-content">
        <button class="auth-modal-close">×</button>
        <div class="auth-tabs">
          <button class="tab active" data-tab="signin">Sign In</button>
          <button class="tab" data-tab="signup">Sign Up</button>
        </div>
        <div class="auth-forms">
          <form class="form signin active" onsubmit="return false;">
            <input name="email" placeholder="Email" type="email" required />
            <input name="password" placeholder="Password" type="password" required />
            <div class="form-row"><button class="auth-submit">Sign In</button><button class="auth-switch" data-switch="signup">Create account</button></div>
          </form>
          <form class="form signup" onsubmit="return false;">
            <input name="name" placeholder="Full name" required />
            <input name="email" placeholder="Email" type="email" required />
            <input name="password" placeholder="Password" type="password" required />
            <div class="form-row"><button class="auth-submit">Sign Up</button><button class="auth-switch" data-switch="signin">Have account</button></div>
          </form>
          <form class="form verify" onsubmit="return false;" style="display:none;">
            <p>Enter verification code sent to your email</p>
            <input name="code" placeholder="6-digit code" required />
            <div class="form-row"><button class="auth-verify">Verify</button></div>
          </form>
          <div class="auth-status" aria-live="polite"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // wire events
    modal.querySelector('.auth-modal-close').onclick = ()=> closeModal();
    modal.querySelectorAll('.auth-tabs .tab').forEach(t=> t.onclick = switchTab);
    modal.querySelectorAll('.auth-switch').forEach(b=> b.onclick = (e)=> switchTo(e.target.dataset.switch));
    modal.querySelector('.signin .auth-submit').onclick = handleSignIn;
    modal.querySelector('.signup .auth-submit').onclick = handleSignUp;
    modal.querySelector('.verify .auth-verify').onclick = handleVerify;
  }

  function switchTab(e){
    const tab = e.target.dataset.tab;
    modal.querySelectorAll('.auth-tabs .tab').forEach(t=> t.classList.toggle('active', t.dataset.tab===tab));
    modal.querySelectorAll('.auth-forms .form').forEach(f=> f.classList.toggle('active', f.classList.contains(tab)));
    // verify form is separate
    modal.querySelectorAll('.auth-forms .form').forEach(f=> f.style.display = f.classList.contains(tab) ? '' : 'none');
  }
  function switchTo(name){
    modal.querySelectorAll('.auth-tabs .tab').forEach(t=> t.classList.toggle('active', t.dataset.tab===name));
    modal.querySelectorAll('.auth-forms .form').forEach(f=> f.style.display = f.classList.contains(name) ? '' : 'none');
  }

  function openModal(){ modal.classList.add('open'); }
  function closeModal(){ modal.classList.remove('open'); }

  async function handleSignUp(){
    const form = modal.querySelector('.signup');
    const name = form.elements['name'].value.trim();
    const email = form.elements['email'].value.trim().toLowerCase();
    const password = form.elements['password'].value;
    if(!email || !password) return showStatus('Please enter email and password','error');
    // Try server-side signup if available
    try{
      const resp = await fetch('/api/signup', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email, password, confirmPassword: password })
      });
      const j = await resp.json();
      if(!resp.ok) return showStatus(j.error || j.message || 'Signup failed','error');
      showStatus(j.message || 'Account created. Please verify via email.', 'success');
      // if server returned verificationLink, show notice
      return;
    }catch(e){
      // fallback to client-side storage + EmailJS
      const users = loadUsers();
      if(users[email]) return showStatus('Account already exists. Please sign in.','error');
      const salt = randSalt();
      const hash = await sha256Hex(password + salt);
      const code = String(Math.floor(100000 + Math.random()*900000));
      users[email] = {email,name,salt,hash,verified:false,verifyCode:code,createdAt:Date.now()};
      saveUsers(users);
      showStatus('Account created — sending verification email');
      sendVerificationEmail(email,name,code).then(()=>{
        showStatus('Verification email sent. Enter code to verify.');
        // show verify form
        modal.querySelectorAll('.auth-forms .form').forEach(f=> f.style.display = 'none');
        modal.querySelector('.verify').style.display = '';
      }).catch(err=>{
        console.error(err);
        showStatus('Failed to send verification email. Check console.','error');
      });
    }
  }

  async function handleSignIn(){
    const form = modal.querySelector('.signin');
    const email = form.elements['email'].value.trim().toLowerCase();
    const password = form.elements['password'].value;
    // Try server-side login first
    try{
      const resp = await fetch('/api/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
      const j = await resp.json();
      if(!resp.ok) return showStatus(j.error || j.message || 'Login failed','error');
      // fetch /api/me for user info
      try{
        const me = await fetch('/api/me');
        if(me.ok){ const meJson = await me.json(); setCurrent({ email: meJson.user.email }); }
      }catch(e){}
      showStatus('Signed in successfully','success');
      setTimeout(()=> closeModal(),600);
      return;
    }catch(e){
      // fallback to client-side local auth
      const users = loadUsers();
      const u = users[email];
      if(!u) return showStatus('No account found for this email','error');
      const hash = await sha256Hex(password + u.salt);
      if(hash !== u.hash) return showStatus('Invalid credentials','error');
      if(!u.verified) {
        showStatus('Account not verified. Please check your email for code.','error');
        modal.querySelectorAll('.auth-forms .form').forEach(f=> f.style.display = 'none');
        modal.querySelector('.verify').style.display = '';
        return;
      }
      setCurrent({email: u.email, name: u.name});
      showStatus('Signed in successfully','success');
      setTimeout(()=> closeModal(),600);
    }
  }

  function handleVerify(){
    const code = modal.querySelector('.verify input[name="code"]').value.trim();
    const users = loadUsers();
    const pending = Object.values(users).find(u=>u.verifyCode===code);
    if(!pending) return showStatus('Invalid verification code','error');
    pending.verified = true; delete pending.verifyCode; users[pending.email]=pending; saveUsers(users);
    setCurrent({email: pending.email, name: pending.name});
    showStatus('Email verified — signed in','success');
    setTimeout(()=> closeModal(),600);
  }

  function showStatus(msg, type='info'){
    const el = modal.querySelector('.auth-status');
    if(!el) return; el.textContent = msg; el.className = 'auth-status '+(type||'');
  }

  function sendVerificationEmail(email,name,code){
    if(window.emailjs && typeof emailjs.send === 'function'){
      return emailjs.send(SERVICE_ID, TEMPLATE_ID, {to_email: email, to_name: name, verification_code: code}, PUBLIC_KEY);
    }
    return Promise.reject(new Error('EmailJS not loaded'));
  }

  // expose simple helpers
  window.authUI = { open: openModal, logout: clearCurrent, currentUser };

  // Creator badge
  document.addEventListener('DOMContentLoaded', ()=>{
    const badge = document.createElement('div');
    badge.className = 'creator-badge';
    badge.innerHTML = `Created by developer — Public key: <span class="creator-key">${PUBLIC_KEY}</span>`;
    badge.style.position = 'fixed';
    badge.style.left = '12px';
    badge.style.bottom = '12px';
    badge.style.background = 'rgba(11,37,69,0.06)';
    badge.style.padding = '8px 10px';
    badge.style.borderRadius = '8px';
    badge.style.fontSize = '12px';
    badge.style.zIndex = 10050;
    document.body.appendChild(badge);
  });

})();
