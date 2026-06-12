#!/usr/bin/env node
// migrate-add-userid.js
// Adds a `userId` field to documents where `ownerId` exists but `userId` is missing.
// Usage: node migrate-add-userid.js --collections=invoices,documents --dry-run

const admin = require('firebase-admin');
const argv = require('minimist')(process.argv.slice(2));

const collectionsArg = argv.collections || argv.c || 'invoices';
const dryRun = !!argv['dry-run'] || !!argv.dry;
const collections = collectionsArg.split(',').map(s => s.trim()).filter(Boolean);

function initFirebase() {
  // Initialize with Application Default Credentials or service account JSON
  if (!admin.apps.length) {
    try {
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp();
      } else {
        // Try to initialize with default app (useful on Cloud Shell/CI)
        admin.initializeApp();
      }
    } catch (e) {
      console.error('Failed to initialize Firebase Admin SDK:', e.message || e);
      process.exit(1);
    }
  }
}

async function migrateCollection(db, name) {
  console.log(`Scanning collection: ${name}`);
  const colRef = db.collection(name);
  const snapshot = await colRef.get();
  console.log(`Found ${snapshot.size} documents in ${name}`);

  let updated = 0;
  let skipped = 0;
  const ops = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.userId === undefined || data.userId === null || data.userId === '') {
      if (data.ownerId) {
        updated++;
        if (!dryRun) {
          ops.push(doc.ref.update({ userId: data.ownerId }));
        }
      } else {
        skipped++;
      }
    }
  });

  if (!dryRun && ops.length) {
    await Promise.all(ops);
  }

  console.log(`Collection ${name}: updated=${updated}, skipped(no ownerId)=${skipped}`);
}

async function main() {
  initFirebase();
  const db = admin.firestore();

  console.log('Dry run:', dryRun);
  for (const c of collections) {
    await migrateCollection(db, c);
  }

  console.log('Migration complete');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
