Migration scripts
=================

migrate-add-userid.js
---------------------

Purpose: add a `userId` field to Firestore documents where `ownerId` exists but `userId` is missing.

Requirements:
- Node.js (14+)
- A Firebase service account JSON or Application Default Credentials. Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of the service account JSON, or run on a machine with ADC configured.

Install dependencies (in project root):

```bash
npm install firebase-admin minimist
```

Run a dry-run first:

```bash
node scripts/migrate-add-userid.js --collections=invoices --dry-run
```

Then run for real:

```bash
node scripts/migrate-add-userid.js --collections=invoices
```

You can pass multiple collections as comma-separated values: `--collections=invoices,documents,settings`.
