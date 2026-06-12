require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true' || NODE_ENV === 'production';

// JWT secret - in production use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const TOKEN_EXPIRY = '2h'; // token validity

const RECAPTCHA_SITE_KEY = process.env.RECAPTCHA_SITE_KEY || '6Lf75xotAAAAAOtywURIVODHe-SLjE-3s22_gvhK';
const RECAPTCHA_API_KEY = process.env.RECAPTCHA_API_KEY || '6Lf75xotAAAAAJjfrMMs1wo3q0MvEOI8XtOYW4-S';
const RECAPTCHA_PROJECT_ID = process.env.RECAPTCHA_PROJECT_ID || 'smartbiz-a9987';
const RECAPTCHA_MIN_SCORE = parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.5');

function isRecaptchaConfigured() {
  return Boolean(RECAPTCHA_API_KEY && RECAPTCHA_PROJECT_ID && RECAPTCHA_SITE_KEY);
}

async function verifyRecaptchaEnterpriseToken(token, expectedAction) {
  if (!isRecaptchaConfigured()) {
    console.warn('RECAPTCHA Enterprise configuration missing: RECAPTCHA_API_KEY or RECAPTCHA_PROJECT_ID is not set');
    return { success: false, error: 'Recaptcha server configuration missing. Set RECAPTCHA_API_KEY and RECAPTCHA_PROJECT_ID.' };
  }

  const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${encodeURIComponent(RECAPTCHA_PROJECT_ID)}/assessments?key=${encodeURIComponent(RECAPTCHA_API_KEY)}`;
  const payload = {
    event: {
      token,
      siteKey: RECAPTCHA_SITE_KEY,
      expectedAction: expectedAction || ''
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    return {
      success: false,
      error: data.error?.message || `Recaptcha verification error (${response.status})`,
      raw: data
    };
  }

  if (!data.tokenProperties?.valid) {
    return { success: false, error: 'Invalid reCAPTCHA token' };
  }

  if (expectedAction && data.tokenProperties?.action !== expectedAction) {
    return { success: false, error: `Unexpected reCAPTCHA action: ${data.tokenProperties?.action}` };
  }

  const score = Number(data.riskAnalysis?.score ?? 0);
  if (!Number.isNaN(score) && score < RECAPTCHA_MIN_SCORE) {
    return { success: false, error: `Low reCAPTCHA score: ${score}` };
  }

  return { success: true, score, tokenProperties: data.tokenProperties, riskAnalysis: data.riskAnalysis };
}

app.use(express.json());
app.use(cookieParser());
app.disable('x-powered-by');

// rate limiter to prevent brute-force login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many login attempts, please try again later.' }
});

// authentication middleware for protected routes
function authenticateToken(req, res, next) {
  const token = req.cookies && req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, email }
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

const DB_FILE = path.join(__dirname, 'db.json');
const HISTORY_FILE = path.join(__dirname, 'assets', 'data', 'history.json');

function readDB(){
  try{ return JSON.parse(fs.readFileSync(DB_FILE,'utf8')||'{}'); }catch(e){ return {}; }
}
function writeDB(db){ fs.writeFileSync(DB_FILE, JSON.stringify(db,null,2)); }

function readHistory(){
  try{ 
    if(!fs.existsSync(HISTORY_FILE)) return [];
    return JSON.parse(fs.readFileSync(HISTORY_FILE,'utf8')||'[]'); 
  }catch(e){ return []; }
}
function writeHistory(history){ 
  // Ensure data directory exists
  const dataDir = path.dirname(HISTORY_FILE);
  if(!fs.existsSync(dataDir)){
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history,null,2)); 
}

// ensure db file
if(!fs.existsSync(DB_FILE)) writeDB({ users: {} });

// ensure history file
if(!fs.existsSync(HISTORY_FILE)){
  const dataDir = path.dirname(HISTORY_FILE);
  if(!fs.existsSync(dataDir)){
    fs.mkdirSync(dataDir, { recursive: true });
  }
  writeHistory([]);
}

const TEST_HISTORY_SEED = path.join(__dirname, 'assets', 'data', 'test-history-seed.json');

const CANONICAL_TEST_NOS = ['TEST-INV-001', 'TEST-ALL-001', 'TEST-DC-001', 'TEST-PRO-001'];

function isCanonicalTestHistory(history) {
  if (!Array.isArray(history) || history.length !== CANONICAL_TEST_NOS.length) return false;
  const nos = history.map((e) => e.invoiceNo).sort();
  const expected = CANONICAL_TEST_NOS.slice().sort();
  if (!nos.every((n, i) => n === expected[i])) return false;
  if (!history.every((e) => e.isTestDocument === true)) return false;
  const inv = history.find((e) => e.invoiceNo === 'TEST-INV-001');
  return !!(inv && inv.grandTotal === '837.80');
}

/** Keep only the four canonical test documents; drop old saved junk. */
function ensureCanonicalTestHistory() {
  try {
    if (!fs.existsSync(TEST_HISTORY_SEED)) return;
    const seed = JSON.parse(fs.readFileSync(TEST_HISTORY_SEED, 'utf8'));
    if (!Array.isArray(seed) || seed.length === 0) return;
    const current = readHistory();
    // Only seed canonical test history when history is empty. Do not overwrite existing user data.
    if (!Array.isArray(current) || current.length === 0) {
      writeHistory(seed);
      console.log('Document history initialized with canonical test documents.');
    }
  } catch (e) {
    console.warn('Could not ensure test history:', e.message);
  }
}

ensureCanonicalTestHistory();

// serve static files (the invoice app)
app.use('/', express.static(path.join(__dirname), {
  index: 'home.html',
  setHeaders(res, filePath) {
    if (NODE_ENV !== 'production' && /\.(html|js|css)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Dynamic CMS page rendering: /<slug>.html served from db.cms.pages if available
app.get('/:slug.html', (req, res, next) => {
  const slug = req.params.slug;
  try {
    const db = readDB(); db.cms = db.cms || { pages: [] };
    const page = (db.cms.pages || []).find(p => String(p.slug) === String(slug));
    if (!page || !page.published) return next();
    const now = new Date();
    if (page.scheduledAt && new Date(page.scheduledAt) > now) return next();
    if (page.unpublishAt && new Date(page.unpublishAt) <= now) return next();
    const title = page.metaTitle || page.title || page.slug;
    const description = page.description ? `<meta name="description" content="${page.description.replace(/"/g, '&quot;')}">` : '';
    const keywords = page.metaKeywords ? `<meta name="keywords" content="${page.metaKeywords.replace(/"/g, '&quot;')}">` : '';
    const canonical = page.canonical ? `<link rel="canonical" href="${page.canonical}">` : '';
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>${description}${keywords}${canonical}<link rel="stylesheet" href="/assets/css/style.css"></head><body>${page.content}</body></html>`;
    res.send(html);
  } catch (e) { next(); }
});

// --- Authentication endpoints --------------------------------------------------

// sign up new user (email + password)
app.post('/api/signup', async (req, res) => {
  const { email, password, confirmPassword, recaptchaToken } = req.body;
  if (!email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'email, password and confirmPassword are required' });
  }
  if (!recaptchaToken) {
    return res.status(400).json({ error: 'recaptchaToken is required' });
  }

  try {
    const recaptchaResult = await verifyRecaptchaEnterpriseToken(recaptchaToken, 'SIGNUP');
    if (!recaptchaResult.success) {
      return res.status(400).json({ error: recaptchaResult.error });
    }
  } catch (verifyError) {
    console.error('Recaptcha verification failed:', verifyError);
    return res.status(500).json({ error: 'reCAPTCHA verification failed', details: verifyError.message });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'invalid email format' });
  }
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'password must be between 8 and 128 characters' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'passwords do not match' });
  }

  const db = readDB();
  db.users = db.users || {};
  if (db.users[email]) {
    return res.status(400).json({ error: 'account already exists' });
  }

  const hash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  const verificationToken = uuidv4();
  db.users[email] = {
    id,
    email,
    password_hash: hash,
    created_at: Date.now(),
    emailVerified: false,
    verificationToken
  };
  writeDB(db);
  // send verification email (for demo just log token)
  console.log(`Verification token for ${email}: ${verificationToken}`);
  const link = `/verify-email.html?token=${verificationToken}`;
  res.json({ success: true, verificationLink: link, message: `Account created. Visit ${link} to verify your email (token also logged to console).` });
});

// login existing user
app.post('/api/login', loginLimiter, async (req, res) => {
  const { email, password, remember, recaptchaToken } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  if (!recaptchaToken) {
    return res.status(400).json({ error: 'recaptchaToken is required' });
  }

  try {
    const recaptchaResult = await verifyRecaptchaEnterpriseToken(recaptchaToken, 'LOGIN');
    if (!recaptchaResult.success) {
      return res.status(400).json({ error: recaptchaResult.error });
    }
  } catch (verifyError) {
    console.error('Recaptcha verification failed:', verifyError);
    return res.status(500).json({ error: 'reCAPTCHA verification failed', details: verifyError.message });
  }

  const db = readDB();
  const user = db.users && db.users[email];
  if (!user || !user.password_hash) {
    return res.status(400).json({ error: 'invalid email or password' });
  }

  if (!user.emailVerified) {
    return res.status(400).json({ error: 'email not verified' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(400).json({ error: 'invalid email or password' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  // remember flag extends cookie life
  const age = remember ? 7 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
  res.cookie('token', token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    maxAge: age
  });
  res.json({ success: true });
});

// logout clears the auth cookie
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// verify email
app.post('/api/verify-email', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token required' });
  const db = readDB();
  const users = db.users || {};
  const entry = Object.values(users).find(u => u.verificationToken === token);
  if (!entry) return res.status(400).json({ error: 'invalid token' });
  entry.emailVerified = true;
  delete entry.verificationToken;
  writeDB(db);
  res.json({ success: true });
});

// resend verification email
app.post('/api/resend-verification', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  const db = readDB();
  const user = db.users && db.users[email];
  if (!user) return res.status(400).json({ error: 'no such account' });
  if (user.emailVerified) return res.status(400).json({ error: 'already verified' });
  const token = uuidv4();
  user.verificationToken = token;
  writeDB(db);
  const link = `/verify-email.html?token=${token}`;
  console.log(`Resent verification token for ${email}: ${token}`);
  res.json({ success: true, verificationLink: link, message: 'Verification link resent (check console).' });
});

// request password reset
app.post('/api/request-password-reset', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  const db = readDB();
  const user = db.users && db.users[email];
  if (!user) return res.json({ success: true, message: 'if account exists, an email has been sent' });
  const resetToken = uuidv4();
  user.resetToken = resetToken;
  user.resetExpires = Date.now() + 60*60*1000; // 1 hour
  writeDB(db);
  console.log(`Password reset token for ${email}: ${resetToken}`);
  const link = `/reset.html?token=${resetToken}`;
  res.json({ success: true, resetLink: link, message: 'Password reset link generated (token logged to console).' });
});

// reset password
app.post('/api/reset-password', async (req, res) => {
  const { token, password, confirmPassword } = req.body;
  if (!token || !password || !confirmPassword) {
    return res.status(400).json({ error: 'token and passwords required' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'passwords do not match' });
  }
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'password must be between 8 and 128 characters' });
  }
  const db = readDB();
  const users = db.users || {};
  const entry = Object.values(users).find(u => u.resetToken === token);
  if (!entry) return res.status(400).json({ error: 'invalid token' });
  if (Date.now() > (entry.resetExpires||0)) {
    return res.status(400).json({ error: 'token expired' });
  }
  entry.password_hash = await bcrypt.hash(password, 10);
  delete entry.resetToken;
  delete entry.resetExpires;
  writeDB(db);
  res.json({ success: true });
});

// utility to fetch current user (can be used by client scripts)
app.get('/api/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Request OTP
app.post('/api/request-otp', (req, res) => {
  const mobile = (req.body.mobile||'').toString();
  if(!mobile) return res.status(400).json({ error: 'mobile required' });
  const otp = Math.floor(100000 + Math.random()*900000).toString();
  const db = readDB();
  db.users = db.users || {};
  db.users[mobile] = db.users[mobile] || {};
  db.users[mobile].otp = otp;
  db.users[mobile].otpExpires = Date.now() + 5*60*1000; // 5 minutes
  writeDB(db);
  console.log(`OTP for ${mobile}: ${otp}`);
  // TODO: integrate SMS provider here
  res.json({ success: true, message: 'OTP sent (for demo printed on server console)' });
});

// Verify OTP
app.post('/api/verify-otp', (req, res) => {
  const mobile = (req.body.mobile||'').toString();
  const otp = (req.body.otp||'').toString();
  if(!mobile || !otp) return res.status(400).json({ error: 'mobile and otp required' });
  const db = readDB();
  const user = db.users && db.users[mobile];
  if(!user || !user.otp) return res.status(400).json({ error: 'no otp requested' });
  if(Date.now() > (user.otpExpires||0)) return res.status(400).json({ error: 'otp expired' });
  if(user.otp !== otp) return res.status(400).json({ error: 'invalid otp' });
  // clear otp
  delete user.otp;
  delete user.otpExpires;
  // create simple session token
  user.token = Math.random().toString(36).slice(2);
  writeDB(db);
  res.json({ success: true, token: user.token, data: user.data || null });
});

// Save user data
app.post('/api/save-data', (req, res) => {
  const mobile = (req.body.mobile||'').toString();
  const data = req.body.data || null;
  if(!mobile) return res.status(400).json({ error: 'mobile required' });
  const db = readDB();
  db.users = db.users || {};
  db.users[mobile] = db.users[mobile] || {};
  db.users[mobile].data = data;
  writeDB(db);
  res.json({ success: true });
});

// Fetch user data
app.get('/api/user/:mobile', (req, res) => {
  const mobile = (req.params.mobile||'').toString();
  const db = readDB();
  const user = db.users && db.users[mobile];
  if(!user) return res.json({ data: null });
  res.json({ data: user.data || null });
});

// Get all document history
app.get('/api/history', (req, res) => {
  try {
    const history = readHistory();
    res.json({ success: true, history: history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read history', message: error.message });
  }
});

// --- Simple CMS endpoints ----------------------------------------------------
// Content stored in DB under db.cms = { pages: [] }

function requireRole(role){
  return function(req, res, next){
    const db = readDB();
    const user = db.users && db.users[req.user.email];
    if (!user) return res.status(403).json({ error: 'forbidden' });
    const r = user.role || 'editor';
    const levels = { viewer:0, editor:1, admin:2 };
    if ((levels[r]||0) < (levels[role]||0)) return res.status(403).json({ error: 'insufficient role' });
    next();
  };
}

// list pages
app.get('/api/cms/pages', authenticateToken, (req, res) => {
  const db = readDB();
  db.cms = db.cms || { pages: [] };
  res.json({ success: true, pages: db.cms.pages });
});

// get page
app.get('/api/cms/pages/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  const db = readDB(); db.cms = db.cms || { pages: [] };
  const page = db.cms.pages.find(p=>String(p.id)===String(id));
  if (!page) return res.status(404).json({ error: 'not found' });
  res.json({ success: true, page });
});

// create page (editor+)
app.post('/api/cms/pages', authenticateToken, requireRole('editor'), (req, res) => {
  const payload = req.body;
  if (!payload || !payload.slug) return res.status(400).json({ error: 'slug required' });
  const db = readDB(); db.cms = db.cms || { pages: [] };
  const id = uuidv4();
  const now = new Date().toISOString();
  const page = Object.assign({ id, slug: payload.slug, title: payload.title||'', content: payload.content||'', createdAt: now, updatedAt: now, versions: [] }, payload);
  page.versions.push({ ts: now, content: page.content, title: page.title, metaTitle: page.metaTitle, metaKeywords: page.metaKeywords, canonical: page.canonical, type: page.type, scheduledAt: page.scheduledAt, unpublishAt: page.unpublishAt, author: req.user.email });
  db.cms.pages.push(page);
  writeDB(db);
  res.json({ success: true, page });
});

// update page (editor+)
app.put('/api/cms/pages/:id', authenticateToken, requireRole('editor'), (req, res) => {
  const id = req.params.id; const payload = req.body;
  const db = readDB(); db.cms = db.cms || { pages: [] };
  const idx = db.cms.pages.findIndex(p=>String(p.id)===String(id));
  if (idx===-1) return res.status(404).json({ error: 'not found' });
  const now = new Date().toISOString();
  const page = db.cms.pages[idx];
  Object.keys(payload || {}).forEach(key => {
    if (['id','versions','createdAt'].includes(key)) return;
    page[key] = payload[key];
  });
  page.updatedAt = now;
  page.versions = page.versions || [];
  page.versions.push({ ts: now, content: page.content, title: page.title, metaTitle: page.metaTitle, metaKeywords: page.metaKeywords, canonical: page.canonical, type: page.type, scheduledAt: page.scheduledAt, unpublishAt: page.unpublishAt, author: req.user.email });
  writeDB(db);
  res.json({ success: true, page });
});

// delete page (admin only)
app.delete('/api/cms/pages/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const id = req.params.id;
  const db = readDB(); db.cms = db.cms || { pages: [] };
  db.cms.pages = db.cms.pages.filter(p=>String(p.id)!==String(id));
  writeDB(db);
  res.json({ success: true });
});

// list versions
app.get('/api/cms/pages/:id/versions', authenticateToken, requireRole('editor'), (req, res) => {
  const id = req.params.id; const db = readDB(); db.cms = db.cms || { pages: [] };
  const page = db.cms.pages.find(p=>String(p.id)===String(id)); if(!page) return res.status(404).json({error: 'not found'});
  res.json({ success: true, versions: page.versions || [] });
});

// revert version
app.post('/api/cms/pages/:id/revert', authenticateToken, requireRole('editor'), (req, res) => {
  const id = req.params.id; const { ts } = req.body; const db = readDB(); db.cms = db.cms || { pages: [] };
  const page = db.cms.pages.find(p=>String(p.id)===String(id)); if(!page) return res.status(404).json({error: 'not found'});
  const ver = (page.versions||[]).find(v=>v.ts===ts);
  if(!ver) return res.status(400).json({error:'version not found'});
  page.content = ver.content;
  page.title = ver.title;
  page.metaTitle = ver.metaTitle || page.metaTitle;
  page.metaKeywords = ver.metaKeywords || page.metaKeywords;
  page.canonical = ver.canonical || page.canonical;
  page.type = ver.type || page.type;
  page.scheduledAt = ver.scheduledAt || page.scheduledAt;
  page.unpublishAt = ver.unpublishAt || page.unpublishAt;
  page.updatedAt = new Date().toISOString();
  page.versions.push({ ts: page.updatedAt, content: page.content, title: page.title, metaTitle: page.metaTitle, metaKeywords: page.metaKeywords, canonical: page.canonical, type: page.type, scheduledAt: page.scheduledAt, unpublishAt: page.unpublishAt, author: req.user.email, revertedFrom: ts });
  writeDB(db);
  res.json({ success: true, page });
});


// Save document to history
app.post('/api/history', (req, res) => {
  try {
    const historyEntry = req.body;
    if (!historyEntry) {
      return res.status(400).json({ error: 'History entry required' });
    }
    
    let history = readHistory();
    
    // Check if entry already exists (by invoice number and document type)
    const existingIndex = history.findIndex(inv => 
      inv.invoiceNo === historyEntry.invoiceNo && 
      inv.docType === historyEntry.docType &&
      inv.invoiceNo && inv.invoiceNo.trim() !== ''
    );
    
    if (existingIndex !== -1) {
      // Update existing entry but keep original id
      historyEntry.id = history[existingIndex].id;
      history[existingIndex] = historyEntry;
    } else {
      // Add new entry
      history.push(historyEntry);
    }
    
    // Sort by date (newest first)
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    writeHistory(history);
    res.json({ success: true, message: 'History saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save history', message: error.message });
  }
});

// Delete document from history
app.delete('/api/history/:id', (req, res) => {
  try {
    const id = req.params.id != null ? req.params.id.toString() : '';
    let history = readHistory();
    history = history.filter((inv) => {
      const invId = inv && inv.id != null ? inv.id.toString() : '';
      return invId !== id;
    });
    writeHistory(history);
    res.json({ success: true, message: 'History entry deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete history', message: error.message });
  }
});

// Save multiple history entries (for bulk operations)
app.post('/api/history/bulk', (req, res) => {
  try {
    const { history: newHistory } = req.body;
    if (!Array.isArray(newHistory)) {
      return res.status(400).json({ error: 'History must be an array' });
    }
    
    // Sort by date (newest first)
    newHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    writeHistory(newHistory);
    res.json({ success: true, message: 'History saved successfully', count: newHistory.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save history', message: error.message });
  }
});

// Live INR → USD/EUR rates (proxied for reliable access)
app.get('/api/exchange-rates', (req, res) => {
  const https = require('https');
  const url = 'https://open.er-api.com/v6/latest/INR';
  https.get(url, (apiRes) => {
    let body = '';
    apiRes.on('data', (chunk) => { body += chunk; });
    apiRes.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.result === 'success' && data.rates) {
          return res.json({
            success: true,
            base: 'INR',
            rates: data.rates,
            updated: data.time_last_update_utc || null
          });
        }
      } catch (e) { /* fall through */ }
      res.json({
        success: true,
        base: 'INR',
        rates: { INR: 1, USD: 0.0119, EUR: 0.011 },
        fallback: true
      });
    });
  }).on('error', () => {
    res.json({
      success: true,
      base: 'INR',
      rates: { INR: 1, USD: 0.0119, EUR: 0.011 },
      fallback: true
    });
  });
});

app.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`));
