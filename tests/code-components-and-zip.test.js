import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import { execSync } from 'node:child_process';

const require = createRequire(import.meta.url);

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'componenthub-code-zip-test-'));
const dbPath = path.join(tmpDir, 'code-zip-test.db');
process.env.DB_PATH = dbPath;
process.env.NODE_ENV = 'development';
process.env.JWT_SECRET = 'dev-only-secret';

// Clear cached modules
delete require.cache[require.resolve('../backend/src/db.js')];
delete require.cache[require.resolve('../backend/src/server.js')];

describe('Code Components, Multi-File Packages & ZIP Integrity Audits', () => {
  let server;
  let baseUrl;
  let cataloguerToken;
  let userToken;

  before(async () => {
    delete require.cache[require.resolve('../backend/src/db.js')];
    delete require.cache[require.resolve('../backend/src/server.js')];

    const jwt = require('../backend/node_modules/jsonwebtoken');
    const app = require('../backend/src/server.js');

    cataloguerToken = jwt.sign(
      { id: 1, username: 'cataloguer', role: 'cataloguer' },
      'dev-only-secret',
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { id: 2, username: 'standarduser', role: 'user' },
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
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {}
    }
  });

  // Reference IEEE 802.3 CRC32 implementation for verification
  const refCrcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    refCrcTable[i] = c >>> 0;
  }

  function computeRefCrc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ refCrcTable[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  test('Runtime CRC-32 verification and table calculation', () => {
    assert.equal(typeof zlib.crc32, 'function', 'zlib.crc32 must exist in Node.js runtime');

    const testCases = [
      Buffer.alloc(0),
      Buffer.from('hello world', 'utf8'),
      Buffer.from('123456789', 'utf8'),
      Buffer.from('The quick brown fox jumps over the lazy dog', 'utf8'),
      Buffer.from('Unicode text: 🚀 Über-Widget 日本語', 'utf8'),
      Buffer.alloc(65536, 0x42)
    ];

    for (const buf of testCases) {
      const nativeCrc = zlib.crc32(buf) >>> 0;
      const refCrc = computeRefCrc32(buf);
      assert.equal(nativeCrc, refCrc, `CRC32 mismatch for buffer of length ${buf.length}`);
    }
  });

  test('Cataloguer creates multi-file package with nested directories, empty files, and Unicode filenames', async () => {
    // 1. Create component
    const createRes = await fetch(`${baseUrl}/api/components`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cataloguerToken}`
      },
      body: JSON.stringify({
        name: 'EnterpriseOrderService',
        description: 'Multi-file enterprise order processing service in TypeScript',
        categoryId: 1,
        type: 'Code',
        language: 'TypeScript',
        keywords: ['orders', 'enterprise', 'typescript'],
        usageNotes: 'Import OrderService from src/index.ts',
        deliveryMethod: 'NPM Package',
        reuseMethod: 'Install and import'
      })
    });
    assert.equal(createRes.status, 201);
    const comp = await createRes.json();

    // 2. Add files with nested directories, empty file, compressible content, and unicode
    const filePayloads = [
      {
        name: 'Empty Placeholder',
        description: 'Empty touch file for directory structure',
        variantType: 'Config',
        deliveryMethod: 'Source Code',
        artifactFormat: 'txt',
        content: '',
        downloadFilename: '.keep',
        reuseMethod: 'Touch file',
        isPrimary: false,
        sortOrder: 0
      },
      {
        name: 'Main Entrypoint',
        description: 'Public API exports',
        variantType: 'Source',
        deliveryMethod: 'Source Code',
        artifactFormat: 'typescript',
        content: 'export * from "./modules/orders/OrderService";\nexport * from "./types";\n',
        downloadFilename: 'src/index.ts',
        reuseMethod: 'Import directly',
        isPrimary: true,
        sortOrder: 1
      },
      {
        name: 'Order Service Nested Class',
        description: 'Deeply nested service implementation with compressible content',
        variantType: 'Source',
        deliveryMethod: 'Source Code',
        artifactFormat: 'typescript',
        content: 'export class OrderService {\n' + '  // Highly compressible repeated comment block\n'.repeat(50) + '  process(id: string) { return { ok: true, id }; }\n}',
        downloadFilename: 'src/modules/orders/OrderService.ts',
        reuseMethod: 'Import directly',
        isPrimary: false,
        sortOrder: 2
      },
      {
        name: 'Order Service Unit Tests',
        description: 'Unit test suite for order processing',
        variantType: 'Tests',
        deliveryMethod: 'Test File',
        artifactFormat: 'typescript',
        content: 'import { describe, it, expect } from "vitest";\nimport { OrderService } from "./OrderService";\n\ndescribe("OrderService", () => {\n  it("works", () => {\n    const s = new OrderService();\n    expect(s.process("1").ok).toBe(true);\n  });\n});',
        downloadFilename: 'tests/unit/OrderService.test.ts',
        reuseMethod: 'Run vitest',
        isPrimary: false,
        sortOrder: 3
      },
      {
        name: 'Unicode Documentation',
        description: 'Multi-lingual documentation with emojis and special characters',
        variantType: 'Documentation',
        deliveryMethod: 'Markdown',
        artifactFormat: 'markdown',
        content: '# Enterprise Order Service 🚀\n\n## Über-Service Anleitung\n\n日本語のドキュメント: 正常に動作します。\n',
        downloadFilename: 'docs/über_guide_🚀.md',
        reuseMethod: 'Read guide',
        isPrimary: false,
        sortOrder: 4
      },
      {
        name: 'Package Configuration',
        description: 'Package manifest with metadata',
        variantType: 'Config',
        deliveryMethod: 'Configuration',
        artifactFormat: 'json',
        content: JSON.stringify({ name: "@acme/order-service", version: "1.0.0", main: "dist/index.js" }, null, 2),
        downloadFilename: 'package.json',
        reuseMethod: 'Config file',
        isPrimary: false,
        sortOrder: 5
      }
    ];

    const createdArtifacts = [];
    for (const payload of filePayloads) {
      const artRes = await fetch(`${baseUrl}/api/components/${comp.id}/artifacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cataloguerToken}`
        },
        body: JSON.stringify(payload)
      });
      assert.equal(artRes.status, 201);
      const art = await artRes.json();
      createdArtifacts.push(art);
    }
    assert.equal(createdArtifacts.length, 6);

    // 3. Download ZIP via GET /api/components/:id/zip
    const zipRes = await fetch(`${baseUrl}/api/components/${comp.id}/zip`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.equal(zipRes.status, 200);
    assert.equal(zipRes.headers.get('content-type'), 'application/zip');
    assert.match(zipRes.headers.get('content-disposition'), /enterpriseorderservice\.zip/);

    const zipBuffer = Buffer.from(await zipRes.arrayBuffer());
    assert.ok(zipBuffer.length > 200);

    // 4. Save to temporary directory and verify with standard unzip -t and extraction
    const zipVerifyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zip-verify-'));
    const zipFilePath = path.join(zipVerifyDir, 'downloaded.zip');
    const extractedDir = path.join(zipVerifyDir, 'extracted');
    fs.writeFileSync(zipFilePath, zipBuffer);
    fs.mkdirSync(extractedDir);

    // Run unzip -t
    const testResult = execSync(`unzip -t "${zipFilePath}"`).toString();
    assert.match(testResult, /No errors detected in compressed data/i);

    // Extract archive
    execSync(`unzip "${zipFilePath}" -d "${extractedDir}"`);

    // Byte-for-byte comparison of every single file
    for (const payload of filePayloads) {
      const extractedFilePath = path.join(extractedDir, payload.downloadFilename);
      assert.ok(fs.existsSync(extractedFilePath), `Extracted file missing: ${payload.downloadFilename}`);

      const extractedBytes = fs.readFileSync(extractedFilePath);
      const expectedBytes = Buffer.from(payload.content, 'utf8');
      assert.ok(
        extractedBytes.equals(expectedBytes),
        `Byte mismatch in extracted file: ${payload.downloadFilename}`
      );
    }

    fs.rmSync(zipVerifyDir, { recursive: true, force: true });

    // 5. Test Artifact Reordering (PUT /api/components/:id/artifacts/reorder)
    const reversedIds = createdArtifacts.map(a => a.id).reverse();
    const reorderRes = await fetch(`${baseUrl}/api/components/${comp.id}/artifacts/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cataloguerToken}`
      },
      body: JSON.stringify({ order: reversedIds })
    });
    assert.equal(reorderRes.status, 200);
    const reorderedList = await reorderRes.json();
    assert.equal(reorderedList[0].id, reversedIds[0]);
    assert.equal(reorderedList[0].downloadFilename, 'package.json');
    assert.equal(reorderedList[5].downloadFilename, '.keep');
  });

  test('Path traversal is rejected in downloadFilename with 400 Bad Request', async () => {
    const maliciousFilenames = [
      '../../etc/passwd.js',
      '..\\..\\windows\\system32\\cmd.exe.js',
      'src/../../../secret.ts',
      'test\0nullbyte.js'
    ];

    for (const filename of maliciousFilenames) {
      const res = await fetch(`${baseUrl}/api/components/1/artifacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cataloguerToken}`
        },
        body: JSON.stringify({
          name: 'Traversal Test',
          description: 'Testing traversal protection',
          variantType: 'Source',
          deliveryMethod: 'Source',
          artifactFormat: filename.endsWith('.ts') ? 'typescript' : 'javascript',
          content: 'console.log("safe");',
          downloadFilename: filename,
          reuseMethod: 'None'
        })
      });
      assert.equal(res.status, 400, `Path traversal was not rejected for ${filename}`);
      const data = await res.json();
      assert.match(data.error, /Directory traversal|Filename extension|required/i);
    }
  });

  test('ZIP download on component with no artifacts returns 404', async () => {
    // Create component with no artifact content
    const createRes = await fetch(`${baseUrl}/api/components`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cataloguerToken}`
      },
      body: JSON.stringify({
        name: 'EmptyComponent',
        description: 'Component with no artifacts attached yet',
        categoryId: 1,
        type: 'Code',
        language: 'TypeScript'
      })
    });
    assert.equal(createRes.status, 201);
    const comp = await createRes.json();

    const zipRes = await fetch(`${baseUrl}/api/components/${comp.id}/zip`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.equal(zipRes.status, 404);
    const data = await zipRes.json();
    assert.match(data.error, /No downloadable files available/i);
  });

  test('Single-file Code components automatically package into ZIP and download individual source', async () => {
    // Create single-code component with artifactContent
    const createRes = await fetch(`${baseUrl}/api/components`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cataloguerToken}`
      },
      body: JSON.stringify({
        name: 'JwtAuthMiddleware',
        description: 'Express JWT authentication middleware snippet',
        categoryId: 1,
        type: 'Code',
        language: 'JavaScript',
        artifactFormat: 'javascript',
        artifactContent: 'module.exports = function auth(req, res, next) { next(); };\n',
        usageNotes: 'app.use(auth);',
        deliveryMethod: 'Snippet',
        reuseMethod: 'Copy and paste'
      })
    });
    assert.equal(createRes.status, 201);
    const comp = await createRes.json();

    // Verify ZIP download with single file
    const zipRes = await fetch(`${baseUrl}/api/components/${comp.id}/zip`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.equal(zipRes.status, 200);
    assert.equal(zipRes.headers.get('content-type'), 'application/zip');

    const zipBuffer = Buffer.from(await zipRes.arrayBuffer());
    const zipVerifyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zip-single-'));
    const zipFilePath = path.join(zipVerifyDir, 'single.zip');
    const extractedDir = path.join(zipVerifyDir, 'extracted');
    fs.writeFileSync(zipFilePath, zipBuffer);
    fs.mkdirSync(extractedDir);

    const testResult = execSync(`unzip -t "${zipFilePath}"`).toString();
    assert.match(testResult, /No errors detected in compressed data/i);

    execSync(`unzip "${zipFilePath}" -d "${extractedDir}"`);
    const extractedContent = fs.readFileSync(path.join(extractedDir, 'jwtauthmiddleware.js'), 'utf8');
    assert.match(extractedContent, /module\.exports = function auth/);

    fs.rmSync(zipVerifyDir, { recursive: true, force: true });
  });

  test('Cataloguer artifact lifecycle: Add, Edit, Delete and Reorder updates cache and DB', async () => {
    // 1. Create Code Component
    const createRes = await fetch(`${baseUrl}/api/components`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cataloguerToken}`
      },
      body: JSON.stringify({
        name: 'ArtifactLifecycleTest',
        description: 'Component for testing artifact CRUD lifecycle',
        categoryId: 1,
        type: 'Code',
        language: 'Python',
        deliveryMethod: 'Package',
        reuseMethod: 'Import'
      })
    });
    assert.equal(createRes.status, 201);
    const comp = await createRes.json();

    // 2. Add Artifact 1
    const add1Res = await fetch(`${baseUrl}/api/components/${comp.id}/artifacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cataloguerToken}`
      },
      body: JSON.stringify({
        name: 'Main Script',
        description: 'Initial version',
        variantType: 'Source',
        deliveryMethod: 'Source',
        artifactFormat: 'python',
        content: 'print("v1")',
        downloadFilename: 'main.py',
        reuseMethod: 'Run python main.py',
        sortOrder: 0
      })
    });
    assert.equal(add1Res.status, 201);
    const art1 = await add1Res.json();

    // 3. Add Artifact 2
    const add2Res = await fetch(`${baseUrl}/api/components/${comp.id}/artifacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cataloguerToken}`
      },
      body: JSON.stringify({
        name: 'Config File',
        description: 'YAML configuration',
        variantType: 'Config',
        deliveryMethod: 'Config',
        artifactFormat: 'yaml',
        content: 'env: production\n',
        downloadFilename: 'config.yaml',
        reuseMethod: 'Read config',
        sortOrder: 1
      })
    });
    assert.equal(add2Res.status, 201);
    const art2 = await add2Res.json();

    // 4. Update Artifact 1
    const update1Res = await fetch(`${baseUrl}/api/components/${comp.id}/artifacts/${art1.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cataloguerToken}`
      },
      body: JSON.stringify({
        ...art1,
        content: 'print("v2 updated")',
        description: 'Updated version 2'
      })
    });
    assert.equal(update1Res.status, 200);
    const updated1 = await update1Res.json();
    assert.equal(updated1.content, 'print("v2 updated")');

    // 5. Delete Artifact 2
    const del2Res = await fetch(`${baseUrl}/api/components/${comp.id}/artifacts/${art2.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${cataloguerToken}`
      }
    });
    assert.equal(del2Res.status, 204);

    // Verify component only has 1 artifact left
    const compAfterDel = await (await fetch(`${baseUrl}/api/components/${comp.id}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    })).json();
    assert.equal(compAfterDel.artifacts.length, 1);
    assert.equal(compAfterDel.artifacts[0].id, art1.id);
  });

  test('Package Code components with metadata (e.g. Axios) automatically package into ZIP with README and example', async () => {
    // 1. Fetch seeded Axios component (#5)
    const res = await fetch(`${baseUrl}/api/components/5`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.equal(res.status, 200);
    const comp = await res.json();
    assert.equal(comp.name, 'Axios');
    assert.equal(comp.type, 'Code');

    // 2. Request ZIP package for Axios
    const zipRes = await fetch(`${baseUrl}/api/components/5/zip`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.equal(zipRes.status, 200);
    assert.equal(zipRes.headers.get('content-type'), 'application/zip');
    assert.match(zipRes.headers.get('content-disposition'), /filename="axios\.zip"/i);

    // 3. Extract and verify ZIP contents
    const zipBuffer = Buffer.from(await zipRes.arrayBuffer());
    const verifyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'axios-zip-'));
    const zipPath = path.join(verifyDir, 'axios.zip');
    fs.writeFileSync(zipPath, zipBuffer);

    execSync(`unzip -t "${zipPath}"`);
    execSync(`unzip -o "${zipPath}" -d "${verifyDir}/out"`);

    assert.ok(fs.existsSync(path.join(verifyDir, 'out', 'README.md')), 'README.md should be in package');
    assert.ok(fs.existsSync(path.join(verifyDir, 'out', 'example.js')), 'example.js should be in package');
    assert.ok(fs.existsSync(path.join(verifyDir, 'out', 'package.json')), 'package.json should be in package');

    const readmeContent = fs.readFileSync(path.join(verifyDir, 'out', 'README.md'), 'utf8');
    assert.match(readmeContent, /# Axios/);
    assert.match(readmeContent, /npm install axios/);
    assert.match(readmeContent, /https:\/\/github.com\/axios\/axios/);

    const exampleContent = fs.readFileSync(path.join(verifyDir, 'out', 'example.js'), 'utf8');
    assert.match(exampleContent, /Axios/);

    // Clean up
    fs.rmSync(verifyDir, { recursive: true, force: true });
  });

  test('Design components preserve diagram artifacts and route separately from Code components', async () => {
    // Fetch Design component (e.g. #55 ERD Template or #49 UML Class)
    const res = await fetch(`${baseUrl}/api/components/55`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.equal(res.status, 200);
    const comp = await res.json();
    assert.equal(comp.type, 'Design');
    assert.ok(Array.isArray(comp.artifacts), 'Design component should have artifacts');
    assert.ok(comp.artifacts.some(a => a.artifactFormat === 'mermaid'), 'Design component should include mermaid format');

    // Download Design ZIP package
    const zipRes = await fetch(`${baseUrl}/api/components/55/zip`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.equal(zipRes.status, 200);
  });

  test('Python Code components (e.g. pytest) package into requirements.txt and example.py without package.json', async () => {
    // 1. Fetch seeded pytest component (#37)
    const res = await fetch(`${baseUrl}/api/components/37`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.equal(res.status, 200);
    const comp = await res.json();
    assert.equal(comp.name, 'pytest');
    assert.equal(comp.type, 'Code');

    // 2. Request ZIP package
    const zipRes = await fetch(`${baseUrl}/api/components/37/zip`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.equal(zipRes.status, 200);

    // 3. Extract and verify ZIP contents
    const zipBuffer = Buffer.from(await zipRes.arrayBuffer());
    const verifyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pytest-zip-'));
    const zipPath = path.join(verifyDir, 'pytest.zip');
    fs.writeFileSync(zipPath, zipBuffer);

    execSync(`unzip -t "${zipPath}"`);
    execSync(`unzip -o "${zipPath}" -d "${verifyDir}/out"`);

    assert.ok(fs.existsSync(path.join(verifyDir, 'out', 'README.md')), 'README.md should be in package');
    assert.ok(fs.existsSync(path.join(verifyDir, 'out', 'example.py')), 'example.py should be in package');
    assert.ok(fs.existsSync(path.join(verifyDir, 'out', 'requirements.txt')), 'requirements.txt should be in package');
    assert.ok(!fs.existsSync(path.join(verifyDir, 'out', 'package.json')), 'package.json should NOT be generated for Python');

    const reqContent = fs.readFileSync(path.join(verifyDir, 'out', 'requirements.txt'), 'utf8');
    assert.match(reqContent, /pytest/);

    // Clean up
    fs.rmSync(verifyDir, { recursive: true, force: true });
  });

  test('Usage count increments only on reuse action (download/use) and not upon viewing', async () => {
    // 1. Get current used count
    const initialRes = await fetch(`${baseUrl}/api/components/5`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const initialComp = await initialRes.json();
    const countBefore = initialComp.usage.used;

    // 2. Viewing component repeatedly does NOT increment used_count
    await fetch(`${baseUrl}/api/components/5`, { headers: { Authorization: `Bearer ${userToken}` } });
    await fetch(`${baseUrl}/api/components/5`, { headers: { Authorization: `Bearer ${userToken}` } });

    const viewCheck = await (await fetch(`${baseUrl}/api/components/5`, { headers: { Authorization: `Bearer ${userToken}` } })).json();
    assert.equal(viewCheck.usage.used, countBefore, 'Viewing component must not increment used_count');

    // 3. Trigger reuse action (e.g. markUsed via POST /use)
    const useRes = await fetch(`${baseUrl}/api/components/5/use`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.equal(useRes.status, 200);
    const usedComp = await useRes.json();
    assert.equal(usedComp.usage.used, countBefore + 1, 'Marking component as used must increment used_count by exactly 1');

    // 4. Trigger ZIP download
    await fetch(`${baseUrl}/api/components/5/zip`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    const zipCheck = await (await fetch(`${baseUrl}/api/components/5`, { headers: { Authorization: `Bearer ${userToken}` } })).json();
    assert.equal(zipCheck.usage.used, countBefore + 2, 'ZIP package download must increment used_count by exactly 1');
  });
});
