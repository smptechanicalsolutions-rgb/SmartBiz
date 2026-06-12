// Script to add a test user to db.json
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const DB_FILE = path.join(__dirname, 'db.json');

async function addTestUser() {
    try {
        // Read existing DB
        const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        
        // Create test user
        const testEmail = 'test@example.com';
        const testPassword = 'Test@123456'; // Must have uppercase, lowercase, number
        const passwordHash = await bcrypt.hash(testPassword, 10);
        
        // Add user to database
        db.users = db.users || {};
        db.users[testEmail] = {
            id: uuidv4(),
            email: testEmail,
            password_hash: passwordHash,
            emailVerified: true,
            createdAt: new Date().toISOString(),
            name: 'Test User'
        };
        
        // Write back to DB
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        
        console.log('✓ Test user added successfully!');
        console.log(`Email: ${testEmail}`);
        console.log(`Password: ${testPassword}`);
        console.log('\nUse these credentials to login in your application.');
        
    } catch (error) {
        console.error('Error adding test user:', error);
        process.exit(1);
    }
}

addTestUser();
