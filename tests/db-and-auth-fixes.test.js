import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const require = createRequire(import.meta.url);
const tmpGlobal = fs.mkdtempSync(path.join(os.tmpdir(), 'componenthub-db-auth-init-'));
process.env.DB_PATH = path.join(tmpGlobal, 'init-test.db');
process.env.NODE_ENV = 'development';
process.env.JWT_SECRET = 'dev-only-secret';
const Database = require('../backend/node_modules/better-sqlite3');
const { initDatabase, initSchema, hashPassword, verifyPassword, resolveDbPath } = require('../backend/src/db.js');

describe('Database Initialization & Migrations Execution (Isolated Temp DBs)', () => {
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'componenthub-init-test-'));
  });

  after(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('initDatabase successfully initializes a fresh temporary database with full schema, seeded catalogue, and design artifacts', () => {
    const dbPath = path.join(tmpDir, 'fresh-init.db');
    const tempDb = new Database(dbPath);

    // Call production initDatabase function
    initDatabase(tempDb, { seedPassword: 'TestPassword123!' });

    // Verify all 9 tables exist
    const tables = tempDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(r => r.name);
    assert.ok(tables.includes('users'));
    assert.ok(tables.includes('categories'));
    assert.ok(tables.includes('components'));
    assert.ok(tables.includes('component_artifacts'));
    assert.ok(tables.includes('keywords'));
    assert.ok(tables.includes('component_keywords'));
    assert.ok(tables.includes('query_log'));
    assert.ok(tables.includes('pending_signups'));
    assert.ok(tables.includes('password_resets'));

    // Verify catalogue seeded
    const compCount = tempDb.prepare("SELECT count(*) as c FROM components").get().c;
    assert.equal(compCount, 61, 'Should have seeded 61 components');

    const artCount = tempDb.prepare("SELECT count(*) as c FROM component_artifacts").get().c;
    assert.ok(artCount >= 150, `Should have seeded artifacts, found ${artCount}`);

    const userCount = tempDb.prepare("SELECT count(*) as c FROM users").get().c;
    assert.equal(userCount, 2, 'Should have seeded user and cataloguer');

    tempDb.close();
  });

  test('initDatabase upgrades legacy schema missing artifact and component columns without skipping artifact migrations', () => {
    const dbPath = path.join(tmpDir, 'legacy-schema.db');
    const tempDb = new Database(dbPath);

    // Create a legacy schema without modern columns
    tempDb.exec(`
      CREATE TABLE users(
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL
      );
      CREATE TABLE categories(
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id INTEGER
      );
      CREATE TABLE components(
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category_id INTEGER NOT NULL,
        type TEXT NOT NULL
      );
      CREATE TABLE component_artifacts(
        id INTEGER PRIMARY KEY,
        component_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        variant_type TEXT NOT NULL,
        delivery_method TEXT NOT NULL,
        artifact_format TEXT NOT NULL,
        content TEXT NOT NULL,
        download_filename TEXT NOT NULL
      );
    `);

    // Insert pre-existing user and component with usage counters
    tempDb.prepare("INSERT INTO users(id, username, password_hash, role) VALUES(1, 'existing_admin', 'hash123', 'cataloguer')").run();
    tempDb.prepare("INSERT INTO categories(id, name) VALUES(1, 'Backend')").run();
    tempDb.prepare("INSERT INTO components(id, name, description, category_id, type) VALUES(100, 'Legacy Comp', 'Desc', 1, 'Code')").run();
    tempDb.prepare("INSERT INTO component_artifacts(id, component_id, name, variant_type, delivery_method, artifact_format, content, download_filename) VALUES(500, 100, 'Custom Spec', 'Default', 'Download', 'markdown', '# Custom Content', 'spec.md')").run();

    // Call production initDatabase function on the legacy database
    initDatabase(tempDb, { seedPassword: 'TestPassword123!' });

    // Verify component_artifacts has new binary_content and content_type columns
    const artCols = tempDb.prepare("PRAGMA table_info(component_artifacts)").all().map(c => c.name);
    assert.ok(artCols.includes('binary_content'), 'component_artifacts must contain binary_content');
    assert.ok(artCols.includes('content_type'), 'component_artifacts must contain content_type');

    // Verify components has new delivery_method, reuse_method, install_command, etc.
    const compCols = tempDb.prepare("PRAGMA table_info(components)").all().map(c => c.name);
    assert.ok(compCols.includes('delivery_method'), 'components must contain delivery_method');
    assert.ok(compCols.includes('reuse_method'), 'components must contain reuse_method');
    assert.ok(compCols.includes('install_command'), 'components must contain install_command');

    // Verify users has email column and index
    const userCols = tempDb.prepare("PRAGMA table_info(users)").all().map(c => c.name);
    assert.ok(userCols.includes('email'), 'users must contain email column');

    // Verify pre-existing data was preserved intact
    const existingUser = tempDb.prepare("SELECT * FROM users WHERE id = 1").get();
    assert.equal(existingUser.username, 'existing_admin');

    const existingArtifact = tempDb.prepare("SELECT * FROM component_artifacts WHERE id = 500").get();
    assert.equal(existingArtifact.name, 'Custom Spec');
    assert.equal(existingArtifact.content_type, 'text/plain');

    tempDb.close();
  });

  test('initDatabase is idempotent: running repeatedly does not throw or corrupt records', () => {
    const dbPath = path.join(tmpDir, 'idempotent-test.db');
    const tempDb = new Database(dbPath);

    // Run 1st time
    initDatabase(tempDb, { seedPassword: 'TestPassword123!' });
    const count1 = tempDb.prepare("SELECT count(*) as c FROM components").get().c;

    // Run 2nd time
    assert.doesNotThrow(() => initDatabase(tempDb, { seedPassword: 'TestPassword123!' }));
    const count2 = tempDb.prepare("SELECT count(*) as c FROM components").get().c;
    assert.equal(count1, count2, 'Component count must remain identical');

    // Run 3rd time
    assert.doesNotThrow(() => initDatabase(tempDb, { seedPassword: 'TestPassword123!' }));
    const count3 = tempDb.prepare("SELECT count(*) as c FROM components").get().c;
    assert.equal(count1, count3, 'Component count must remain identical');

    tempDb.close();
  });

  test('initSchema propagates unexpected SQLite errors', () => {
    const tempDb = new Database(':memory:');
    // Close db to force unexpected errors on exec
    tempDb.close();

    assert.throws(() => {
      initSchema(tempDb);
    });
  });
});

describe('Signup and Email OTP Flow Integration (Isolated Temp DB)', () => {
  let tmpDir;
  let dbPath;
  let server;
  let baseUrl;
  let db;
  let originalFetch;
  let lastCapturedOtp = null;

  before(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'componenthub-auth-test-'));
    dbPath = path.join(tmpDir, 'auth-test.db');

    process.env.DB_PATH = dbPath;
    process.env.NODE_ENV = 'development';
    process.env.JWT_SECRET = 'test-secret-key-12345';
    process.env.CORS_ORIGIN = 'https://test-origin-a.org,https://test-origin-b.org';
    process.env.RESEND_API_KEY = 'mock-key';
    process.env.EMAIL_FROM = 'noreply@test-origin-a.org';

    // Clear module cache to bind fresh server and db instances to the isolated temp DB
    delete require.cache[require.resolve('../backend/src/db.js')];
    delete require.cache[require.resolve('../backend/src/server.js')];

    // Intercept only external Resend API email calls
    originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options = {}) => {
      const urlStr = String(url);
      if (urlStr.includes('api.resend.com')) {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
        const match = body.text ? body.text.match(/\b\d{6}\b/) : null;
        if (match) lastCapturedOtp = match[0];
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: 'mock-email-id' })
        };
      }
      return originalFetch(url, options);
    };

    const app = require('../backend/src/server.js');
    db = require('../backend/src/db.js').db;

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    delete require.cache[require.resolve('../backend/src/db.js')];
    delete require.cache[require.resolve('../backend/src/server.js')];
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('POST /api/auth/signup initiates pending signup and sends OTP', async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '198.51.100.1'
      },
      body: JSON.stringify({
        username: 'alice_test',
        email: 'alice@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });

    assert.equal(res.status, 202);
    const data = await res.json();
    assert.ok(data.signupToken, 'Response should contain signupToken');
    assert.equal(data.email, 'alice@example.com');

    // Verify row in pending_signups table
    const pending = db.prepare("SELECT * FROM pending_signups WHERE username = 'alice_test'").get();
    assert.ok(pending, 'pending_signups record should exist');
    assert.equal(pending.email, 'alice@example.com');
    assert.equal(pending.otp_attempts, 0);
  });

  test('POST /api/auth/signup/resend successfully updates OTP with corrected SQL', async () => {
    // Register user bob_test
    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '198.51.100.2'
      },
      body: JSON.stringify({
        username: 'bob_test',
        email: 'bob@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    assert.equal(signupRes.status, 202);
    const signupData = await signupRes.json();
    const token = signupData.signupToken;

    // Call /api/auth/signup/resend with the token (with unique IP to test endpoint)
    const resendRes = await fetch(`${baseUrl}/api/auth/signup/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '198.51.100.2'
      },
      body: JSON.stringify({ signupToken: token })
    });

    assert.equal(resendRes.status, 200);
    const resendData = await resendRes.json();
    assert.equal(resendData.message, 'Verification code resent.');
    assert.equal(resendData.email, 'bob@example.com');

    // Verify pending_signups row updated cleanly in SQLite
    const pendingAfter = db.prepare("SELECT * FROM pending_signups WHERE email = 'bob@example.com'").get();
    assert.ok(pendingAfter);
    assert.equal(pendingAfter.otp_attempts, 0);
    assert.ok(pendingAfter.last_sent_at > 0);
  });

  test('POST /api/auth/signup/verify rejects incorrect OTP and tracks attempts', async () => {
    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '198.51.100.3'
      },
      body: JSON.stringify({
        username: 'charlie_test',
        email: 'charlie@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    assert.equal(signupRes.status, 202);
    const { signupToken } = await signupRes.json();

    const verifyRes = await fetch(`${baseUrl}/api/auth/signup/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '198.51.100.3'
      },
      body: JSON.stringify({ signupToken, otp: '000000' })
    });

    assert.equal(verifyRes.status, 400);
    const data = await verifyRes.json();
    assert.equal(data.error, 'Incorrect verification code.');

    const pending = db.prepare("SELECT * FROM pending_signups WHERE username = 'charlie_test'").get();
    assert.equal(pending.otp_attempts, 1);
  });

  test('POST /api/auth/signup/verify succeeds and creates user when valid OTP is provided', async () => {
    lastCapturedOtp = null;
    const testUser = `dave_test_${Date.now()}`;
    const testEmail = `dave_${Date.now()}@example.com`;

    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '198.51.100.4'
      },
      body: JSON.stringify({
        username: testUser,
        email: testEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    assert.equal(signupRes.status, 202);
    const { signupToken } = await signupRes.json();
    assert.ok(lastCapturedOtp, 'Should have captured OTP from mock email');

    const verifyRes = await fetch(`${baseUrl}/api/auth/signup/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '198.51.100.4'
      },
      body: JSON.stringify({ signupToken, otp: lastCapturedOtp })
    });

    assert.equal(verifyRes.status, 201);
    const verifyData = await verifyRes.json();
    assert.equal(verifyData.user.username, testUser);
    assert.equal(verifyData.user.email, testEmail);
    assert.equal(verifyData.user.role, 'user');

    // Verify user now in users table and pending_signups is cleaned up
    const userInDb = db.prepare("SELECT * FROM users WHERE username = ?").get(testUser);
    assert.ok(userInDb, 'User must exist in users table');
    assert.equal(userInDb.email, testEmail);

    const pendingInDb = db.prepare("SELECT * FROM pending_signups WHERE username = ?").get(testUser);
    assert.equal(pendingInDb, undefined, 'Pending signup record must be removed');
  });
});

describe('Production CORS Configuration and Validation', () => {
  let tmpDir;
  let server;
  let baseUrl;

  before(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'componenthub-cors-test-'));
    process.env.DB_PATH = path.join(tmpDir, 'cors-test.db');
    process.env.NODE_ENV = 'production';
    process.env.SEED_PASSWORD = 'TestPassword123!';
    process.env.JWT_SECRET = 'cors-test-secret-123';
    process.env.CORS_ORIGIN = 'https://test-origin-a.org, https://test-origin-b.org';

    delete require.cache[require.resolve('../backend/src/db.js')];
    delete require.cache[require.resolve('../backend/src/server.js')];

    const app = require('../backend/src/server.js');
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    delete require.cache[require.resolve('../backend/src/db.js')];
    delete require.cache[require.resolve('../backend/src/server.js')];
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('Allows configured test origin A from CORS_ORIGIN', async () => {
    const res = await fetch(`${baseUrl}/health`, {
      headers: { 'Origin': 'https://test-origin-a.org' }
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), 'https://test-origin-a.org');
  });

  test('Allows configured test origin B from comma-separated list in CORS_ORIGIN', async () => {
    const res = await fetch(`${baseUrl}/health`, {
      headers: { 'Origin': 'https://test-origin-b.org' }
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), 'https://test-origin-b.org');
  });

  test('Allows localhost origin for local development', async () => {
    const res = await fetch(`${baseUrl}/health`, {
      headers: { 'Origin': 'http://localhost:5500' }
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5500');
  });

  test('Rejects disallowed browser origin', async () => {
    const res = await fetch(`${baseUrl}/health`, {
      headers: { 'Origin': 'https://unauthorized-origin.com' }
    });
    assert.notEqual(res.headers.get('access-control-allow-origin'), 'https://unauthorized-origin.com');
  });
});
