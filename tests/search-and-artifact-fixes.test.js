import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const require = createRequire(import.meta.url);

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'componenthub-search-artifact-test-'));
const dbPath = path.join(tmpDir, 'search-artifact-test.db');
process.env.DB_PATH = dbPath;
process.env.NODE_ENV = 'development';
process.env.JWT_SECRET = 'dev-only-secret';

// Clear cached modules
delete require.cache[require.resolve('../backend/src/db.js')];
delete require.cache[require.resolve('../backend/src/server.js')];

describe('Search Submission, Usage Deduplication & Artifact Management Regression', () => {
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

  /* -------------------------------------------------------------------------
     BUG 1 REGRESSION: Search Submission & Usage Count Deduplication
     ------------------------------------------------------------------------- */
  test('Search increments usage count on first search and deduplicates rapid repeated searches', async () => {
    // 1. Check initial usage count of Component 60 (Repository Pattern Template)
    const initRes = await fetch(`${baseUrl}/api/components/60`, { headers: userHeaders() });
    assert.equal(initRes.status, 200);
    const initComp = await initRes.json();
    const initialQueriedCount = initComp.usage.queriedNotUsed;

    // 2. Perform search for "Repository"
    const s1 = await fetch(`${baseUrl}/api/search?q=Repository`, { headers: userHeaders() });
    assert.equal(s1.status, 200);
    const d1 = await s1.json();
    assert.ok(d1.results.length > 0);
    assert.ok(d1.results.some(c => c.id === 60));

    // Check count increased by exactly 1
    const postS1Res = await fetch(`${baseUrl}/api/components/60`, { headers: userHeaders() });
    const postS1Comp = await postS1Res.json();
    assert.equal(postS1Comp.usage.queriedNotUsed, initialQueriedCount + 1, 'First search must increment usage count by 1');

    // 3. Immediately perform identical search again (simulating rapid reload / double-click / re-render)
    const s2 = await fetch(`${baseUrl}/api/search?q=Repository`, { headers: userHeaders() });
    assert.equal(s2.status, 200);

    // Count should remain unchanged (deduplicated)
    const postS2Res = await fetch(`${baseUrl}/api/components/60`, { headers: userHeaders() });
    const postS2Comp = await postS2Res.json();
    assert.equal(postS2Comp.usage.queriedNotUsed, initialQueriedCount + 1, 'Duplicate immediate search must not inflate count');

    // 4. Searching for a distinct query increments for the new matching components
    const s3 = await fetch(`${baseUrl}/api/search?q=Express`, { headers: userHeaders() });
    assert.equal(s3.status, 200);
    const d3 = await s3.json();
    assert.ok(d3.results.length > 0);

    // 5. Empty or whitespace query returns 0 results and does not crash
    const sEmpty = await fetch(`${baseUrl}/api/search?q=%20%20`, { headers: userHeaders() });
    assert.equal(sEmpty.status, 200);
    const dEmpty = await sEmpty.json();
    assert.equal(dEmpty.count, 0);
    assert.equal(dEmpty.results.length, 0);
  });

  /* -------------------------------------------------------------------------
     BUG 2 REGRESSION: Add Artifact to Existing Component & Security Checks
     ------------------------------------------------------------------------- */
  test('Cataloguer can add artifact to existing component, non-cataloguer is rejected', async () => {
    const componentId = 60; // Repository Pattern Template

    // 1. Unauthorized user (standard role) attempt to add artifact is rejected with 403
    const unauthRes = await fetch(`${baseUrl}/api/components/${componentId}/artifacts`, {
      method: 'POST',
      headers: userHeaders(),
      body: JSON.stringify({
        name: 'Unauthorized Spec',
        description: 'Should fail',
        variantType: 'Example',
        deliveryMethod: 'Editable Source',
        artifactFormat: 'typescript',
        content: 'export interface Test {}',
        downloadFilename: 'test.ts',
        reuseMethod: 'Copy and edit'
      })
    });
    assert.equal(unauthRes.status, 403, 'Standard user must receive 403 Forbidden');

    // 2. Unauthenticated request is rejected with 401
    const noAuthRes = await fetch(`${baseUrl}/api/components/${componentId}/artifacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'No Auth' })
    });
    assert.equal(noAuthRes.status, 401, 'Unauthenticated request must receive 401 Unauthorized');

    // 3. Validation rejection: Invalid format or mismatched extension
    const invalidExtRes = await fetch(`${baseUrl}/api/components/${componentId}/artifacts`, {
      method: 'POST',
      headers: catHeaders(),
      body: JSON.stringify({
        name: 'Mismatched Ext Artifact',
        description: 'Testing extension mismatch',
        variantType: 'General Template',
        deliveryMethod: 'Editable Source',
        artifactFormat: 'typescript',
        content: 'export class Test {}',
        downloadFilename: 'test.py', // .py does not match typescript
        reuseMethod: 'Copy and edit'
      })
    });
    assert.equal(invalidExtRes.status, 400, 'Mismatched filename extension must return 400 Bad Request');
    const invalidExtData = await invalidExtRes.json();
    assert.ok(invalidExtData.error.includes('Filename extension must match typescript'));

    // 4. Cataloguer successfully adds a new TypeScript artifact to Component 60
    const addRes = await fetch(`${baseUrl}/api/components/${componentId}/artifacts`, {
      method: 'POST',
      headers: catHeaders(),
      body: JSON.stringify({
        name: 'Async Generic Repository Implementation',
        description: 'Production async TypeScript repository implementation with filter options',
        variantType: 'Async Variant',
        deliveryMethod: 'Source Code File',
        artifactFormat: 'typescript',
        content: 'export class AsyncRepository<T> {\n  async findOne(id: string): Promise<T | null> { return null; }\n}',
        downloadFilename: 'AsyncRepository.ts',
        reuseMethod: 'Copy and customize',
        isPrimary: false,
        sortOrder: 10
      })
    });
    assert.equal(addRes.status, 201, 'Cataloguer adding valid artifact must return 201 Created');
    const createdArtifact = await addRes.json();
    assert.ok(createdArtifact.id > 0);
    assert.equal(createdArtifact.name, 'Async Generic Repository Implementation');
    assert.equal(createdArtifact.artifactFormat, 'typescript');
    assert.equal(createdArtifact.downloadFilename, 'AsyncRepository.ts');

    // 5. Re-fetch component details and confirm artifact is present
    const compRes = await fetch(`${baseUrl}/api/components/${componentId}`, { headers: catHeaders() });
    const compData = await compRes.json();
    const foundInComp = compData.artifacts.find(a => a.id === createdArtifact.id);
    assert.ok(foundInComp, 'New artifact must appear in component.artifacts array');
    assert.equal(foundInComp.variantType, 'Async Variant');

    // 6. Test downloading the newly added artifact
    const dlRes = await fetch(`${baseUrl}/api/components/${componentId}/artifacts/${createdArtifact.id}/download`, {
      headers: userHeaders()
    });
    assert.equal(dlRes.status, 200);
    const dlContent = await dlRes.text();
    assert.ok(dlContent.includes('export class AsyncRepository<T>'));
  });

  /* -------------------------------------------------------------------------
     BUG 3 REGRESSION: Artifact Management After Creating a Component
     ------------------------------------------------------------------------- */
  test('Newly created component can have multiple artifacts added and managed cleanly', async () => {
    // 1. Cataloguer creates a brand-new component (starting with 0 artifacts)
    const createCompRes = await fetch(`${baseUrl}/api/components`, {
      method: 'POST',
      headers: catHeaders(),
      body: JSON.stringify({
        name: 'Event Bus Publish-Subscribe Module',
        description: 'Lightweight in-memory event bus pattern implementation',
        categoryId: 1, // UI / Frontend or Application category
        type: 'Code',
        tech: 'TypeScript',
        keywords: ['event-bus', 'pubsub', 'events'],
        url: 'https://github.com/example/eventbus',
        deliveryMethod: 'Source File',
        reuseMethod: 'Copy and import',
        installCommand: 'npm install'
      })
    });
    assert.equal(createCompRes.status, 201);
    const newComp = await createCompRes.json();
    const newCompId = newComp.id;
    assert.ok(newCompId > 0);

    // Verify initial artifacts list is empty
    const checkEmptyRes = await fetch(`${baseUrl}/api/components/${newCompId}/artifacts`, { headers: catHeaders() });
    const emptyArtifacts = await checkEmptyRes.json();
    assert.equal(emptyArtifacts.length, 0);

    // 2. Add 1st artifact: TypeScript source file
    const add1Res = await fetch(`${baseUrl}/api/components/${newCompId}/artifacts`, {
      method: 'POST',
      headers: catHeaders(),
      body: JSON.stringify({
        name: 'EventBus Core Class',
        description: 'Core TypeScript EventBus publisher/subscriber implementation',
        variantType: 'Standard Implementation',
        deliveryMethod: 'Source File',
        artifactFormat: 'typescript',
        content: 'export class EventBus {\n  private listeners = new Map();\n  emit(e: string, d: any) {}\n}',
        downloadFilename: 'EventBus.ts',
        reuseMethod: 'Copy and import',
        isPrimary: true,
        sortOrder: 1
      })
    });
    assert.equal(add1Res.status, 201);
    const art1 = await add1Res.json();

    // 3. Add 2nd artifact: Markdown documentation file
    const add2Res = await fetch(`${baseUrl}/api/components/${newCompId}/artifacts`, {
      method: 'POST',
      headers: catHeaders(),
      body: JSON.stringify({
        name: 'EventBus Usage Guide',
        description: 'Comprehensive markdown documentation and setup guide',
        variantType: 'Standard Implementation',
        deliveryMethod: 'Documentation',
        artifactFormat: 'markdown',
        content: '# EventBus Documentation\n\nHow to initialize and subscribe to events.',
        downloadFilename: 'README.md',
        reuseMethod: 'Reference',
        isPrimary: false,
        sortOrder: 2
      })
    });
    assert.equal(add2Res.status, 201);
    const art2 = await add2Res.json();

    // 4. Add 3rd artifact: PlantUML sequence diagram
    const add3Res = await fetch(`${baseUrl}/api/components/${newCompId}/artifacts`, {
      method: 'POST',
      headers: catHeaders(),
      body: JSON.stringify({
        name: 'EventBus Sequence Flow',
        description: 'PlantUML sequence diagram showing subscribe and publish flow',
        variantType: 'Sequence Flow Variant',
        deliveryMethod: 'PlantUML Diagram',
        artifactFormat: 'plantuml',
        content: '@startuml\nClient -> EventBus: subscribe(event, handler)\nPublisher -> EventBus: emit(event, payload)\n@enduml',
        downloadFilename: 'eventbus-flow.puml',
        reuseMethod: 'Copy and edit',
        isPrimary: false,
        sortOrder: 3
      })
    });
    assert.equal(add3Res.status, 201);
    const art3 = await add3Res.json();

    // 5. Verify all 3 artifacts are returned and properly ordered on component fetch
    const fetchAllRes = await fetch(`${baseUrl}/api/components/${newCompId}`, { headers: userHeaders() });
    const fullComp = await fetchAllRes.json();
    assert.equal(fullComp.artifacts.length, 3);
    assert.equal(fullComp.artifacts[0].id, art1.id);
    assert.equal(fullComp.artifacts[1].id, art2.id);
    assert.equal(fullComp.artifacts[2].id, art3.id);

    // 6. Update artifact 1 and verify changes
    const updateRes = await fetch(`${baseUrl}/api/components/${newCompId}/artifacts/${art1.id}`, {
      method: 'PUT',
      headers: catHeaders(),
      body: JSON.stringify({
        ...art1,
        name: 'EventBus Core Class (Typed)',
        content: 'export class EventBus<T extends Record<string, any>> {}'
      })
    });
    assert.equal(updateRes.status, 200);
    const updated = await updateRes.json();
    assert.equal(updated.name, 'EventBus Core Class (Typed)');

    // 7. Delete artifact 3 and verify remaining count is 2
    const delRes = await fetch(`${baseUrl}/api/components/${newCompId}/artifacts/${art3.id}`, {
      method: 'DELETE',
      headers: catHeaders()
    });
    assert.equal(delRes.status, 204);

    const finalRes = await fetch(`${baseUrl}/api/components/${newCompId}/artifacts`, { headers: userHeaders() });
    const finalArtifacts = await finalRes.json();
    assert.equal(finalArtifacts.length, 2);
  });
});
