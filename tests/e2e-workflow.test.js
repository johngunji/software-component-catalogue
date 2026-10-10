import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const require = createRequire(import.meta.url);

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'componenthub-e2e-isolated-'));
const dbPath = path.join(tmpDir, 'e2e-isolated.db');
process.env.DB_PATH = dbPath;
process.env.NODE_ENV = 'development';
process.env.JWT_SECRET = 'dev-only-secret';

// Ensure fresh DB and server instances
delete require.cache[require.resolve('../backend/src/db.js')];
delete require.cache[require.resolve('../backend/src/server.js')];

describe('ComponentHub End-to-End Workflow Verification (Isolated DB)', () => {
  let server;
  let baseUrl;
  let cataloguerToken;
  let userToken;

  before(async () => {
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

    // 1. Authenticate as cataloguer via login API
    const catLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'cataloguer', password: 'changeme123' })
    });
    assert.equal(catLoginRes.status, 200, 'Cataloguer sign-in must succeed');
    const catLoginData = await catLoginRes.json();
    cataloguerToken = catLoginData.token;
    assert.equal(catLoginData.user.role, 'cataloguer');

    // 2. Authenticate as standard user via login API
    const userLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'user', password: 'changeme123' })
    });
    assert.equal(userLoginRes.status, 200, 'User sign-in must succeed');
    const userLoginData = await userLoginRes.json();
    userToken = userLoginData.token;
    assert.equal(userLoginData.user.role, 'user');
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

  const catHeaders = () => ({
    'Authorization': `Bearer ${cataloguerToken}`,
    'Content-Type': 'application/json'
  });

  const userHeaders = () => ({
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  });

  test('E2E Search workflow: Initial search, repeated submissions, and popular chip searches', async () => {
    // 1. Query initial state of component #60
    const comp60InitRes = await fetch(`${baseUrl}/api/components/60`, { headers: userHeaders() });
    assert.equal(comp60InitRes.status, 200);
    const comp60Init = await comp60InitRes.json();
    const initialQueried = comp60Init.usage.queriedNotUsed;

    // 2. User searches for "Repository"
    const search1Res = await fetch(`${baseUrl}/api/search?q=Repository`, { headers: userHeaders() });
    assert.equal(search1Res.status, 200);
    const search1 = await search1Res.json();
    assert.ok(search1.results.length > 0);
    assert.ok(search1.results.some(c => c.id === 60));

    // Verify usage incremented by exactly 1
    const comp60Post1Res = await fetch(`${baseUrl}/api/components/60`, { headers: userHeaders() });
    const comp60Post1 = await comp60Post1Res.json();
    assert.equal(comp60Post1.usage.queriedNotUsed, initialQueried + 1);

    // 3. User clicks Search button again without changing query (or page refresh)
    const searchRepeatRes = await fetch(`${baseUrl}/api/search?q=Repository`, { headers: userHeaders() });
    assert.equal(searchRepeatRes.status, 200);

    // Verify usage count did NOT inflate again
    const comp60PostRepeatRes = await fetch(`${baseUrl}/api/components/60`, { headers: userHeaders() });
    const comp60PostRepeat = await comp60PostRepeatRes.json();
    assert.equal(comp60PostRepeat.usage.queriedNotUsed, initialQueried + 1, 'Duplicate repeated search must not increment usage');

    // 4. User clicks Popular Chip: "Authentication"
    const chipSearchRes = await fetch(`${baseUrl}/api/search?q=Authentication`, { headers: userHeaders() });
    assert.equal(chipSearchRes.status, 200);
    const chipSearch = await chipSearchRes.json();
    assert.ok(chipSearch.results.length > 0, 'Should return components matching Authentication');

    // 5. User clicks Popular Chip: "UI component"
    const chipUiRes = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent('UI component')}`, { headers: userHeaders() });
    assert.equal(chipUiRes.status, 200);
    const chipUi = await chipUiRes.json();
    assert.ok(chipUi.results.length > 0);
  });

  test('E2E Add Artifact to existing component: Adds two different artifacts and verifies persistence', async () => {
    const componentId = 60; // Repository Pattern Template

    // Get current artifacts count
    const initCompRes = await fetch(`${baseUrl}/api/components/${componentId}`, { headers: catHeaders() });
    const initComp = await initCompRes.json();
    const initialArtifactsCount = initComp.artifacts.length;

    // 1. Add Artifact 1: TypeScript implementation file
    const art1Payload = {
      name: 'Custom TypeORM Repository',
      description: 'TypeORM specific implementation of repository pattern',
      variantType: 'TypeORM Variant',
      deliveryMethod: 'Source Code File',
      artifactFormat: 'typescript',
      content: 'import { Repository } from "typeorm";\nexport class CustomRepo extends Repository<any> {}',
      downloadFilename: 'CustomRepo.ts',
      reuseMethod: 'Copy and import',
      isPrimary: false,
      sortOrder: 10
    };

    const add1Res = await fetch(`${baseUrl}/api/components/${componentId}/artifacts`, {
      method: 'POST',
      headers: catHeaders(),
      body: JSON.stringify(art1Payload)
    });
    assert.equal(add1Res.status, 201, 'Adding TypeScript artifact must succeed');
    const art1Created = await add1Res.json();
    assert.ok(art1Created.id > 0);

    // 2. Add Artifact 2: Markdown architecture documentation
    const art2Payload = {
      name: 'Repository Pattern Architecture Guide',
      description: 'Detailed architecture guidelines and diagrams for repository pattern',
      variantType: 'Architecture Doc',
      deliveryMethod: 'Markdown Documentation',
      artifactFormat: 'markdown',
      content: '# Repository Architecture\n\nDecouples domain models from database access logic.',
      downloadFilename: 'REPOSITORY_GUIDE.md',
      reuseMethod: 'Reference and adapt',
      isPrimary: false,
      sortOrder: 11
    };

    const add2Res = await fetch(`${baseUrl}/api/components/${componentId}/artifacts`, {
      method: 'POST',
      headers: catHeaders(),
      body: JSON.stringify(art2Payload)
    });
    assert.equal(add2Res.status, 201, 'Adding Markdown artifact must succeed');
    const art2Created = await add2Res.json();
    assert.ok(art2Created.id > 0);

    // 3. Reload component detail endpoint (simulating page reload)
    const reloadedRes = await fetch(`${baseUrl}/api/components/${componentId}`, { headers: userHeaders() });
    assert.equal(reloadedRes.status, 200);
    const reloadedComp = await reloadedRes.json();

    assert.equal(reloadedComp.artifacts.length, initialArtifactsCount + 2, 'Component must contain both new artifacts');

    const foundArt1 = reloadedComp.artifacts.find(a => a.id === art1Created.id);
    assert.ok(foundArt1, 'Artifact 1 must be present in reloaded component');
    assert.equal(foundArt1.name, art1Payload.name);
    assert.equal(foundArt1.artifactFormat, 'typescript');
    assert.equal(foundArt1.downloadFilename, 'CustomRepo.ts');
    assert.equal(foundArt1.variantType, 'TypeORM Variant');
    assert.equal(foundArt1.content, art1Payload.content);

    const foundArt2 = reloadedComp.artifacts.find(a => a.id === art2Created.id);
    assert.ok(foundArt2, 'Artifact 2 must be present in reloaded component');
    assert.equal(foundArt2.name, art2Payload.name);
    assert.equal(foundArt2.artifactFormat, 'markdown');
    assert.equal(foundArt2.downloadFilename, 'REPOSITORY_GUIDE.md');
    assert.equal(foundArt2.variantType, 'Architecture Doc');
    assert.equal(foundArt2.content, art2Payload.content);

    // 4. Verify downloading both artifacts returns exact file content and correct Content-Disposition
    const dl1Res = await fetch(`${baseUrl}/api/components/${componentId}/artifacts/${art1Created.id}/download`, { headers: userHeaders() });
    assert.equal(dl1Res.status, 200);
    assert.ok(dl1Res.headers.get('content-disposition').includes('CustomRepo.ts'));
    assert.equal(await dl1Res.text(), art1Payload.content);

    const dl2Res = await fetch(`${baseUrl}/api/components/${componentId}/artifacts/${art2Created.id}/download`, { headers: userHeaders() });
    assert.equal(dl2Res.status, 200);
    assert.ok(dl2Res.headers.get('content-disposition').includes('REPOSITORY_GUIDE.md'));
    assert.equal(await dl2Res.text(), art2Payload.content);
  });

  test('E2E Add Component + Add Multiple Artifacts: Creates new component and attaches two artifacts', async () => {
    // 1. Cataloguer creates a new component
    const createRes = await fetch(`${baseUrl}/api/components`, {
      method: 'POST',
      headers: catHeaders(),
      body: JSON.stringify({
        name: 'Retry Policy Interceptor',
        description: 'Exponential backoff and jitter retry policy interceptor for HTTP clients',
        categoryId: 3, // API & Networking category
        type: 'Code',
        tech: 'TypeScript',
        keywords: ['retry', 'backoff', 'resilience', 'http'],
        url: 'https://github.com/example/retry-interceptor',
        deliveryMethod: 'Package',
        reuseMethod: 'Install package',
        installCommand: 'npm install @example/retry-interceptor'
      })
    });
    assert.equal(createRes.status, 201, 'Creating new component must succeed');
    const createdComp = await createRes.json();
    const compId = createdComp.id;
    assert.ok(compId > 0);

    // 2. Add Artifact 1: TypeScript implementation file
    const art1Payload = {
      name: 'Retry Policy Interceptor Source',
      description: 'Full TypeScript axios/fetch interceptor implementing exponential backoff with jitter',
      variantType: 'Axios Interceptor',
      deliveryMethod: 'Source Code File',
      artifactFormat: 'typescript',
      content: 'export function retryInterceptor(config: any) { return config; }',
      downloadFilename: 'retryInterceptor.ts',
      reuseMethod: 'Copy and integrate',
      isPrimary: true,
      sortOrder: 1
    };

    const add1Res = await fetch(`${baseUrl}/api/components/${compId}/artifacts`, {
      method: 'POST',
      headers: catHeaders(),
      body: JSON.stringify(art1Payload)
    });
    assert.equal(add1Res.status, 201);
    const art1 = await add1Res.json();

    // 3. Add Artifact 2: Mermaid diagram showing retry backoff state machine
    const art2Payload = {
      name: 'Retry State Transition Diagram',
      description: 'Mermaid state diagram depicting retry attempts, delay backoff, and max threshold',
      variantType: 'State Flow Variant',
      deliveryMethod: 'Mermaid Diagram',
      artifactFormat: 'mermaid',
      content: 'stateDiagram-v2\n  [*] --> RequestSent\n  RequestSent --> Success: 200 OK\n  RequestSent --> BackoffDelay: 5xx Error\n  BackoffDelay --> RequestSent: Retry\n  BackoffDelay --> Failed: Max Attempts Exceeded',
      downloadFilename: 'retry-state.mmd',
      reuseMethod: 'Copy and edit',
      isPrimary: false,
      sortOrder: 2
    };

    const add2Res = await fetch(`${baseUrl}/api/components/${compId}/artifacts`, {
      method: 'POST',
      headers: catHeaders(),
      body: JSON.stringify(art2Payload)
    });
    assert.equal(add2Res.status, 201);
    const art2 = await add2Res.json();

    // 4. Reload new component from API and verify both artifacts exist
    const reloadRes = await fetch(`${baseUrl}/api/components/${compId}`, { headers: userHeaders() });
    assert.equal(reloadRes.status, 200);
    const reloaded = await reloadRes.json();

    assert.equal(reloaded.artifacts.length, 2, 'New component must contain both added artifacts');
    assert.equal(reloaded.artifacts[0].id, art1.id);
    assert.equal(reloaded.artifacts[0].downloadFilename, 'retryInterceptor.ts');
    assert.equal(reloaded.artifacts[0].artifactFormat, 'typescript');
    assert.equal(reloaded.artifacts[0].content, art1Payload.content);

    assert.equal(reloaded.artifacts[1].id, art2.id);
    assert.equal(reloaded.artifacts[1].downloadFilename, 'retry-state.mmd');
    assert.equal(reloaded.artifacts[1].artifactFormat, 'mermaid');
    assert.equal(reloaded.artifacts[1].content, art2Payload.content);
  });
});
