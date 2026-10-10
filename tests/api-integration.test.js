import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const require = createRequire(import.meta.url);

describe('ComponentHub Backend API Integration', () => {
  let tmpDir;
  let dbPath;
  let server;
  let baseUrl;
  let authToken;

  before(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'componenthub-api-test-'));
    dbPath = path.join(tmpDir, 'api-test.db');

    process.env.DB_PATH = dbPath;
    process.env.NODE_ENV = 'development';
    process.env.JWT_SECRET = 'dev-only-secret';

    // Clear cached db/server modules to bind to fresh DB_PATH
    delete require.cache[require.resolve('../backend/src/db.js')];
    delete require.cache[require.resolve('../backend/src/server.js')];

    const jwt = require('../backend/node_modules/jsonwebtoken');
    const app = require('../backend/src/server.js');

    authToken = jwt.sign(
      { id: 1, username: 'cataloguer', role: 'cataloguer' },
      'dev-only-secret',
      { expiresIn: '1h' }
    );

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

  const authHeaders = () => ({
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  });

  test('GET /api/categories returns categories hierarchy', async () => {
    const res = await fetch(`${baseUrl}/api/categories`, { headers: authHeaders() });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);
  });

  test('GET /api/components returns all 61 components with metadata', async () => {
    const res = await fetch(`${baseUrl}/api/components`, { headers: authHeaders() });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.equal(data.length, 61, 'Should return 61 total components');
  });

  test('GET /api/components?type=Design filters correctly', async () => {
    const res = await fetch(`${baseUrl}/api/components?type=Design`, { headers: authHeaders() });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.length, 13, 'Should return 13 Design components');
    data.forEach(c => assert.equal(c.type, 'Design'));
  });

  test('GET /api/components?type=Code filters correctly', async () => {
    const res = await fetch(`${baseUrl}/api/components?type=Code`, { headers: authHeaders() });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.length, 48, 'Should return 48 Code components');
    data.forEach(c => assert.equal(c.type, 'Code'));
  });

  test('GET /api/components/:id returns single component with artifacts', async () => {
    const listRes = await fetch(`${baseUrl}/api/components?type=Design`, { headers: authHeaders() });
    const list = await listRes.json();
    const erdComp = list.find(c => c.name.includes('Entity-Relationship')) || list[0];

    const res = await fetch(`${baseUrl}/api/components/${erdComp.id}`, { headers: authHeaders() });
    assert.equal(res.status, 200);
    const comp = await res.json();
    assert.equal(comp.id, erdComp.id);
    assert.ok(Array.isArray(comp.artifacts), 'Should contain artifacts array');
    assert.ok(comp.artifacts.length >= 3, 'Should have multiple artifacts');
  });

  test('GET /api/components/:id/artifacts/:artifactId/download downloads artifact file', async () => {
    const listRes = await fetch(`${baseUrl}/api/components?type=Design`, { headers: authHeaders() });
    const list = await listRes.json();
    const compRes = await fetch(`${baseUrl}/api/components/${list[0].id}`, { headers: authHeaders() });
    const comp = await compRes.json();
    const artifact = comp.artifacts[0];

    const downloadRes = await fetch(`${baseUrl}/api/components/${comp.id}/artifacts/${artifact.id}/download`, { headers: authHeaders() });
    assert.equal(downloadRes.status, 200);
    const text = await downloadRes.text();
    assert.ok(text.length > 0);
  });
});
