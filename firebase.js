// Firebase initialization and authentication bridge for SmartBiz
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";
import {
        getAuth,
        createUserWithEmailAndPassword,
        signInWithEmailAndPassword,
        signOut,
        onAuthStateChanged,
        updateProfile,
        GoogleAuthProvider,
        signInWithPopup
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    serverTimestamp,
    startAt,
    endAt
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC_MSlaIwZHDAyaBeEDd_ASKurhQMuXRyw",
  authDomain: "smartbiz-a9987.firebaseapp.com",
  projectId: "smartbiz-a9987",
  storageBucket: "smartbiz-a9987.firebasestorage.app",
  messagingSenderId: "581734204067",
  appId: "1:581734204067:web:3169ff279df054e3127516",
  measurementId: "G-SBF920FW2F"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);

// Add error logging for debugging
auth.onAuthStateChanged(
    (user) => {
        // This works
    },
    (error) => {
        console.error('Firebase Auth Error:', error);
        window.firebaseInitError = error.message;
    }
);

function getSessionExpiry(remember) {
    return remember ? Date.now() + (7 * 24 * 60 * 60 * 1000) : Date.now() + (24 * 60 * 60 * 1000);
}

function createLocalSession(user, remember = false) {
    if (!user) return null;
    const session = {
        user: {
            id: user.uid,
            fullName: user.displayName || user.email || '',
            email: user.email || '',
            photoURL: user.photoURL || ''
        },
        loginTime: Date.now(),
        expiresAt: getSessionExpiry(remember)
    };
    localStorage.setItem('smarbiz_session', JSON.stringify(session));
    localStorage.setItem('auth_current', JSON.stringify({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || ''
    }));
    window.dispatchEvent(new Event('firebase-auth-changed'));
    return session;
}

function clearLocalSession() {
    localStorage.removeItem('smarbiz_session');
    localStorage.removeItem('auth_current');
    window.dispatchEvent(new Event('firebase-auth-changed'));
}

async function firebaseSignUp(fullName, email, password, remember = false) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (fullName && result.user) {
        await updateProfile(result.user, { displayName: fullName });
    }
    createLocalSession(result.user, remember);
    return result.user;
}

async function firebaseSignIn(email, password, remember = false) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    createLocalSession(result.user, remember);
    return result.user;
}

async function firebaseSignOut() {
    await signOut(auth);
    clearLocalSession();
}

async function firebaseSignInWithGoogle() {
    const googleProvider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user) {
            createLocalSession(result.user, true);
            return result.user;
        }
    } catch (error) {
        console.error('Google Sign-In Error:', error.code, error.message);
        throw error;
    }
}

function firebaseOnAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        createLocalSession(user, true);
    } else {
        clearLocalSession();
    }
});

// Expose Firebase functions to window
window.firebaseAuth = {
    auth,
    signIn: firebaseSignIn,
    signUp: firebaseSignUp,
    signOut: firebaseSignOut,
    signInWithGoogle: firebaseSignInWithGoogle,
    onAuthStateChanged: firebaseOnAuthStateChanged
};

// Add a flag to indicate Firebase is ready
window.firebaseReady = true;
console.log('Firebase Auth initialized successfully');

// Log any initialization errors
window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('firebase')) {
        console.error('Firebase Error:', event);
        window.firebaseInitError = event.message;
    }
});

// Also expose initialization error flag
window.firebaseInitError = null;

// Firestore helper functions
async function getCurrentUser() {
    try {
        const session = JSON.parse(localStorage.getItem('smarbiz_session') || 'null');
        if (session && session.user && session.user.id) return { uid: session.user.id, email: session.user.email };
        const authCurrent = JSON.parse(localStorage.getItem('auth_current') || 'null');
        if (authCurrent && authCurrent.uid) return { uid: authCurrent.uid, email: authCurrent.email };
    } catch (e) { }
    // fallback to Firebase auth state
    const user = auth.currentUser;
    if (user) return { uid: user.uid, email: user.email };
    return null;
}

async function ensureUserDoc(user) {
    if (!user || !user.uid) return null;
    try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email || '',
                createdAt: serverTimestamp()
            });
        }
        return userRef;
    } catch (e) {
        console.warn('ensureUserDoc error', e);
        return null;
    }
}

function _genPrefixesForText(text, maxLen = 12) {
    if (!text) return [];
    const s = String(text).toLowerCase().trim();
    const tokens = s.split(/\s+/).filter(Boolean);
    const set = new Set();
    tokens.forEach(tok => {
        for (let i = 1; i <= Math.min(tok.length, maxLen); i++) set.add(tok.slice(0, i));
    });
    const compact = s.replace(/\s+/g, '');
    for (let i = 1; i <= Math.min(compact.length, maxLen); i++) set.add(compact.slice(0, i));
    return Array.from(set);
}

async function createInvoice(entry) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    await ensureUserDoc(user);
    const invoicesCol = collection(db, 'invoices');
    try {
        const id = entry && entry.id ? String(entry.id) : undefined;
        const searchPrefixes = Array.from(new Set([...(entry && entry.invoiceNo ? _genPrefixesForText(entry.invoiceNo) : []), ...(entry && entry.clientName ? _genPrefixesForText(entry.clientName) : [])]));
        const payload = Object.assign({}, entry, { ownerId: user.uid, createdAt: serverTimestamp(), searchPrefixes });
        if (id) {
            const d = doc(invoicesCol, id);
            await setDoc(d, payload);
            return { id: id };
        }
        const ref = await addDoc(invoicesCol, payload);
        return { id: ref.id };
    } catch (e) {
        console.error('createInvoice error', e);
        throw e;
    }
}

async function updateInvoice(id, changes) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    try {
        const docRef = doc(db, 'invoices', String(id));
        const extra = {};
        if (changes && (changes.invoiceNo || changes.clientName)) {
            const prefixes = Array.from(new Set([...(changes.invoiceNo ? _genPrefixesForText(changes.invoiceNo) : []), ...(changes.clientName ? _genPrefixesForText(changes.clientName) : [])]));
            extra.searchPrefixes = prefixes;
        }
        await updateDoc(docRef, Object.assign({}, changes, extra, { updatedAt: serverTimestamp() }));
        return true;
    } catch (e) { throw e; }
}

async function deleteInvoice(id) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    try {
        const docRef = doc(db, 'invoices', String(id));
        await deleteDoc(docRef);
        return true;
    } catch (e) { throw e; }
}

async function listInvoices(options = {}) {
    // options: { limit: number, q: string, from: Date|string, to: Date|string }
    const { limit: limitCount = 1000, q: queryText, from, to } = options || {};
    const user = await getCurrentUser();
    if (!user) return [];
    try {
        const basePath = collection(db, 'invoices');

        // Helper to build common constraints
        const buildConstraints = (extraWhere) => {
            const constraints = [where('ownerId', '==', user.uid)];
            if (from) {
                const fromDate = (from instanceof Date) ? from : new Date(from);
                constraints.push(where('createdAt', '>=', fromDate));
            }
            if (to) {
                const toDate = (to instanceof Date) ? to : new Date(to);
                // include end of day if time not provided
                if (toDate && toDate.getHours() === 0 && toDate.getMinutes() === 0 && toDate.getSeconds() === 0) {
                    toDate.setHours(23,59,59,999);
                }
                constraints.push(where('createdAt', '<=', toDate));
            }
            if (extraWhere) constraints.push(extraWhere);
            constraints.push(orderBy('createdAt', 'desc'));
            constraints.push(limit(limitCount));
            return constraints;
        };

        // If no search text, perform single query
        if (!queryText) {
            const qRef = query(basePath, ...buildConstraints());
            const snap = await getDocs(qRef);
            const out = [];
            snap.forEach(d => out.push(Object.assign({ id: d.id }, d.data())));
            return out;
        }

        // If queryText present, perform two queries (invoiceNo and clientName) and merge results
        const resultsMap = new Map();

        // invoiceNo exact match
        try {
            const qRefA = query(basePath, ...buildConstraints(where('invoiceNo', '==', queryText)));
            const snapA = await getDocs(qRefA);
            snapA.forEach(d => {
                resultsMap.set(d.id, Object.assign({ id: d.id }, d.data()));
            });
        } catch (e) {
            // ignore per-query errors
            console.warn('listInvoices partial queryA error', e);
        }

        // clientName exact match
        try {
            const qRefB = query(basePath, ...buildConstraints(where('clientName', '==', queryText)));
            const snapB = await getDocs(qRefB);
            snapB.forEach(d => {
                resultsMap.set(d.id, Object.assign({ id: d.id }, d.data()));
            });
        } catch (e) {
            console.warn('listInvoices partial queryB error', e);
        }

        // Attempt prefix/prefix-token search using precomputed `searchPrefixes` array
        try {
            const qLower = String(queryText || '').toLowerCase().trim();
            if (qLower) {
                const qRefC = query(basePath, ...buildConstraints(where('searchPrefixes', 'array-contains', qLower)));
                const snapC = await getDocs(qRefC);
                snapC.forEach(d => {
                    resultsMap.set(d.id, Object.assign({ id: d.id }, d.data()));
                });
            }
        } catch (e) {
            console.warn('listInvoices prefix search error', e);
        }

        return Array.from(resultsMap.values()).sort((a,b)=>{
            const ta = a.createdAt ? new Date(a.createdAt.seconds ? a.createdAt.toDate() : a.createdAt) : 0;
            const tb = b.createdAt ? new Date(b.createdAt.seconds ? b.createdAt.toDate() : b.createdAt) : 0;
            return tb - ta;
        }).slice(0, limitCount);
    } catch (e) {
        console.error('listInvoices error', e);
        return [];
    }
}

// Expose Firestore helpers
window.firebaseService = {
    db,
    getCurrentUser,
    ensureUserDoc,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    listInvoices
};

// Migrate localStorage.invoiceHistory -> Firestore invoices for current user
async function migrateLocalHistoryToFirestore(options = {}) {
    const dryRun = !!options.dryRun;
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    await ensureUserDoc(user);
    let local = [];
    try {
        local = JSON.parse(localStorage.getItem('invoiceHistory') || '[]');
    } catch (e) { local = []; }
    const summary = { total: local.length, migrated: 0, skipped: 0, errors: [] };
    for (const entry of local) {
        try {
            // Build a document payload from history entry
            const payload = Object.assign({}, entry.fullData || {}, {
                invoiceNo: entry.invoiceNo || '',
                invoiceDate: entry.invoiceDate || '',
                clientName: entry.clientName || '',
                grandTotal: entry.grandTotal || '',
                docType: entry.docType || '',
                format: entry.format || '',
                legacyId: entry.id || null
            });
            // generate search prefixes for better text search
            try {
                const sp = Array.from(new Set([...(payload.invoiceNo ? _genPrefixesForText(payload.invoiceNo) : []), ...(payload.clientName ? _genPrefixesForText(payload.clientName) : [])]));
                payload.searchPrefixes = sp;
            } catch (e) { }

            // Check for existing same invoice for this user (invoiceNo + docType + format)
            const q = query(collection(db, 'invoices'), where('ownerId', '==', user.uid), where('invoiceNo', '==', payload.invoiceNo || ''), where('docType', '==', payload.docType || ''), where('format', '==', payload.format || ''));
            const snap = await getDocs(q);
            if (snap && snap.size > 0) {
                summary.skipped++;
                continue;
            }

            if (dryRun) {
                summary.migrated++;
                continue;
            }

            // If legacy id present, reuse as document id
            if (entry.id) {
                await createInvoice(Object.assign({}, payload, { id: String(entry.id) }));
            } else {
                await createInvoice(payload);
            }
            summary.migrated++;
        } catch (e) {
            summary.errors.push({ entry: entry && entry.id, error: (e && e.message) || String(e) });
        }
    }
    return summary;
}

window.firebaseService.migrateLocalHistoryToFirestore = migrateLocalHistoryToFirestore;