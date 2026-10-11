import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { chromium } = require('../backend/node_modules/playwright');
const jwt = require('../backend/node_modules/jsonwebtoken');
const express = require('../backend/node_modules/express');

describe('Real Browser End-to-End Audits (Headless Chromium & Isolated DB)', () => {
  let tmpDir;
  let dbPath;
  let server;
  let baseUrl;
  let browser;
  let cataloguerToken;
  let userToken;
  let cataloguerSession;
  let userSession;

  before(async () => {
    // 1. Create completely isolated temporary database
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'componenthub-browser-e2e-'));
    dbPath = path.join(tmpDir, 'test-browser.db');
    process.env.DB_PATH = dbPath;
    process.env.NODE_ENV = 'development';
    process.env.JWT_SECRET = 'dev-browser-secret';

    // Clear module cache to guarantee isolated DB binding
    delete require.cache[require.resolve('../backend/src/db.js')];
    delete require.cache[require.resolve('../backend/src/server.js')];

    const { db } = require('../backend/src/db.js');
    const app = require('../backend/src/server.js');

    // Serve frontend static files
    app.use(express.static(path.join(__dirname, '../frontend')));

    // Start ephemeral server
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    // Create authentication tokens
    cataloguerToken = jwt.sign(
      { id: 1, username: 'cataloguer', role: 'cataloguer' },
      'dev-browser-secret',
      { expiresIn: '2h' }
    );
    userToken = jwt.sign(
      { id: 2, username: 'user', role: 'user' },
      'dev-browser-secret',
      { expiresIn: '2h' }
    );

    cataloguerSession = {
      token: cataloguerToken,
      user: { id: 1, username: 'cataloguer', role: 'Cataloguer' }
    };
    userSession = {
      token: userToken,
      user: { id: 2, username: 'user', role: 'User' }
    };

    // Launch Chromium instance
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
  });

  after(async () => {
    if (browser) {
      await browser.close();
    }
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

  // Helper to configure page with authenticated session and base URL
  async function createPage(session = cataloguerSession) {
    const context = await browser.newContext({
      acceptDownloads: true
    });
    const page = await context.newPage();

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.addInitScript(({ apiBase, userSessionData }) => {
      // Mock icon renderer for headless air-gapped environment
      if (typeof window.lucide === 'undefined') {
        window.lucide = { createIcons: () => {} };
      }
      localStorage.setItem('componentHub.apiBase', apiBase);
      if (userSessionData) {
        sessionStorage.setItem('componentHub.session', JSON.stringify(userSessionData));
      }
    }, {
      apiBase: `${baseUrl}/api`,
      userSessionData: session
    });

    return { context, page };
  }

  // Helper to parse ZIP central directory and file contents
  function parseZipEntries(buffer) {
    const entries = {};
    let offset = 0;
    while (offset < buffer.length - 4) {
      const sig = buffer.readUInt32LE(offset);
      if (sig === 0x04034b50) { // Local file header
        const compMethod = buffer.readUInt16LE(offset + 8);
        const compSize = buffer.readUInt32LE(offset + 18);
        const uncompSize = buffer.readUInt32LE(offset + 22);
        const nameLen = buffer.readUInt16LE(offset + 26);
        const extraLen = buffer.readUInt16LE(offset + 28);
        const name = buffer.toString('utf8', offset + 30, offset + 30 + nameLen);
        const dataOffset = offset + 30 + nameLen + extraLen;
        const compData = buffer.slice(dataOffset, dataOffset + compSize);

        let data;
        if (compMethod === 0) {
          data = compData;
        } else if (compMethod === 8) {
          data = zlib.inflateRawSync(compData);
        } else {
          data = compData;
        }

        entries[name] = {
          name,
          compressedSize: compSize,
          uncompressedSize: uncompSize,
          content: data.toString('utf8')
        };

        offset = dataOffset + compSize;
      } else {
        offset++;
      }
    }
    return entries;
  }

  // --- TEST 1: Code component detail rendering and file-category tabs ---
  test('Code component detail renders multi-file package card and category filter tabs', async () => {
    const { context, page } = await createPage(cataloguerSession);
    try {
      await page.goto(`${baseUrl}/pages/component.html?id=2`, { waitUntil: 'networkidle' });

      // Verify title & code package card presence
      const title = await page.title();
      assert.ok(title.includes('Component') || title.includes('Flask'), 'Page title indicates component page');

      await page.waitForSelector('.code-package-card', { timeout: 10000 });
      const metaText = await page.textContent('.code-package-meta');
      assert.ok(metaText.includes('Python') || metaText.includes('Code'), 'Meta badge displays component language');

      // Check category tabs exist
      const catTabs = await page.$$('.code-cat-tab');
      assert.ok(catTabs.length >= 2, 'Multiple file category filter tabs exist');

      // Check active file & syntax highlighted lines
      await page.waitForSelector('.code-viewer-lines .code-line', { timeout: 5000 });
      const lines = await page.$$('.code-viewer-lines .code-line');
      assert.ok(lines.length > 5, 'Source code renders numbered lines');

      // Verify syntax token classes exist
      const keywords = await page.$$('.code-viewer-lines .token-kw');
      assert.ok(keywords.length > 0, 'Code viewer contains highlighted keywords (.token-kw)');

      // Click category tab (e.g. Readme or Examples)
      const readmeTab = await page.$('.code-cat-tab[data-cat="readme"]');
      if (readmeTab) {
        await readmeTab.click();
        await page.waitForTimeout(300);
        const activeCat = await page.getAttribute('.code-cat-tab.on', 'data-cat');
        assert.equal(activeCat, 'readme', 'Clicking readme tab switches active category filter');

        // Restore to source
        const sourceTab = await page.$('.code-cat-tab[data-cat="source"]');
        if (sourceTab) {
          await sourceTab.click();
          await page.waitForTimeout(300);
        }
      }
    } finally {
      await context.close();
    }
  });

  // --- TEST 2: Opening source editor, editing content, saving, and reloading ---
  test('Interactive editor opens with syntax highlighting, saves content, and persists on reload', async () => {
    const { context, page } = await createPage(cataloguerSession);
    try {
      await page.goto(`${baseUrl}/pages/component.html?id=2`, { waitUntil: 'networkidle' });

      // Click Interactive Editor button
      const openEditorBtn = await page.waitForSelector('#btn-code-open-editor', { timeout: 10000 });
      await openEditorBtn.click();

      // Verify modal opened
      await page.waitForSelector('.drawio-editor-window', { timeout: 5000 });
      await page.waitForSelector('#erd-code-editor-container', { timeout: 5000 });

      // Check code textarea has content
      const codeBox = await page.waitForSelector('#erd-code-box');
      const originalCode = await codeBox.inputValue();
      assert.ok(originalCode.includes('Flask') || originalCode.includes('app'), 'Editor is seeded with component source code');

      // Check syntax highlight layer exists and contains tokens
      const highlightLayer = await page.$('#erd-code-highlight-layer');
      assert.ok(highlightLayer, 'Syntax highlight layer element exists in editor');
      const highlightTokens = await page.$('#erd-code-highlight-code .token-kw');
      assert.ok(highlightTokens, 'Highlight layer displays keyword tokens');

      // Edit content in textarea
      const editMarker = '\n# Verified by Automated Real-Browser Test\n';
      await codeBox.fill(originalCode + editMarker);

      // Verify dirty indicator updates
      const dirtyBadge = await page.waitForSelector('#drawio-dirty-indicator');
      const dirtyText = await dirtyBadge.textContent();
      assert.ok(dirtyText.includes('Unsaved'), 'Dirty indicator shows unsaved changes after typing');

      // Click Save to Catalogue
      const saveBtn = await page.waitForSelector('#drawio-apply-btn');
      await saveBtn.click();

      // Modal automatically saves to server and detaches on apply
      await page.waitForSelector('.drawio-editor-window', { state: 'detached', timeout: 10000 });

      // Reload page from server
      await page.reload({ waitUntil: 'networkidle' });

      // Verify persistence in detail view
      await page.waitForSelector('.code-viewer-lines', { timeout: 5000 });
      const reloadedCodeText = await page.textContent('.code-viewer-lines');
      assert.ok(reloadedCodeText.includes('Verified by Automated Real-Browser Test'), 'Saved edit persisted and rendered after page reload');
    } finally {
      await context.close();
    }
  });

  // --- TEST 3: Cataloguer artifact creation, editing, deletion, and reordering ---
  test('Cataloguer artifact creation, editing, reordering, and deletion via Artifact Manager', async () => {
    const { context, page } = await createPage(cataloguerSession);
    try {
      await page.goto(`${baseUrl}/pages/component.html?id=2`, { waitUntil: 'networkidle' });

      // 1. Open Add File / Artifact Form
      const addTrigger = await page.waitForSelector('#add-artifact-trigger', { timeout: 10000 });
      await addTrigger.click();

      // Form should be visible
      const form = await page.waitForSelector('#artifact-editor:not([hidden])', { timeout: 5000 });
      assert.ok(form, 'Artifact creation form becomes visible');

      // Fill in artifact details
      await page.fill('#artifact-name', 'Browser Test Helper Module');
      await page.fill('#artifact-variant', 'Tests');
      await page.fill('#artifact-description', 'Automated test suite helper artifact');
      await page.fill('#artifact-delivery', 'Editable Source');
      await page.selectOption('#artifact-format', 'python');
      await page.fill('#artifact-content', 'def calculate_tax(amount):\n    return amount * 0.15\n');
      await page.fill('#artifact-filename', 'tests/test_tax_calculator.py');
      await page.fill('#artifact-reuse', 'Import in test cases');

      // Submit form
      await page.click('#artifact-editor button[type="submit"]');

      // Wait for submission completion and card refresh
      await page.waitForFunction(() => {
        const items = document.querySelectorAll('.artifact-manager-item');
        for (const item of items) {
          if (item.textContent.includes('test_tax_calculator.py')) return true;
        }
        return false;
      }, { timeout: 10000 });

      // Verify the new artifact item exists in the Artifact Manager list
      const managerItems = await page.$$('.artifact-manager-item');
      assert.ok(managerItems.length >= 1, 'Newly created artifact is listed in manager');

      // 2. Test Editing the artifact
      const testItem = page.locator('.artifact-manager-item', { hasText: 'test_tax_calculator.py' }).first();
      await testItem.waitFor({ state: 'visible', timeout: 5000 });
      const editBtn = testItem.locator('.btn-item-edit');
      assert.ok(await editBtn.count() > 0, 'Edit button exists on artifact item');
      await editBtn.click();

      // Modify description
      await page.waitForSelector('#artifact-editor:not([hidden])', { timeout: 5000 });
      await page.fill('#artifact-description', 'Updated description from browser test');
      await page.click('#artifact-editor button[type="submit"]');

      await page.waitForFunction(() => {
        const items = Array.from(document.querySelectorAll('.artifact-manager-item'));
        return items.some(item => item.textContent.includes('test_tax_calculator.py') && item.textContent.includes('Updated description'));
      }, { timeout: 10000 });

      // 3. Test Reordering artifact (Move Up)
      const targetItem = page.locator('.artifact-manager-item', { hasText: 'test_tax_calculator.py' }).first();
      const moveUpBtn = targetItem.locator('.btn-move-up:not([disabled])');
      if (await moveUpBtn.count() > 0) {
        await moveUpBtn.click();
        await page.waitForTimeout(600);
      }

      // 4. Test Deleting the artifact
      const itemToDelete = page.locator('.artifact-manager-item', { hasText: 'test_tax_calculator.py' }).first();
      const delBtn = itemToDelete.locator('.btn-item-del');
      assert.ok(await delBtn.count() > 0, 'Delete button exists on artifact');
      await delBtn.click();

      // Verify artifact removed from DOM
      await page.waitForFunction(() => {
        const items = Array.from(document.querySelectorAll('.artifact-manager-item'));
        return !items.some(item => item.textContent.includes('test_tax_calculator.py'));
      }, { timeout: 10000 });
    } finally {
      await context.close();
    }
  });

  // --- TEST 4: ZIP downloads and file contents ---
  test('ZIP package download triggers real download with valid archive structure and files', async () => {
    const { context, page } = await createPage(cataloguerSession);
    try {
      await page.goto(`${baseUrl}/pages/component.html?id=2`, { waitUntil: 'networkidle' });

      // Ensure download button is present
      const downloadZipBtn = await page.waitForSelector('#btn-download-zip', { timeout: 10000 });

      // Intercept download event
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 15000 }),
        downloadZipBtn.click()
      ]);

      assert.ok(download, 'Browser fired download event');
      const downloadFilename = download.suggestedFilename();
      assert.ok(downloadFilename.endsWith('.zip'), 'Downloaded filename ends with .zip');

      const downloadPath = path.join(tmpDir, downloadFilename);
      await download.saveAs(downloadPath);

      // Verify file exists on disk and is non-empty
      assert.ok(fs.existsSync(downloadPath), 'Saved ZIP package exists on disk');
      const zipBuffer = fs.readFileSync(downloadPath);
      assert.ok(zipBuffer.length > 100, 'ZIP package has valid non-empty byte length');

      // Verify ZIP file format and contents
      const zipEntries = parseZipEntries(zipBuffer);
      const entryNames = Object.keys(zipEntries);
      assert.ok(entryNames.length >= 1, 'ZIP contains at least one file entry');

      // Must contain source file (example.py) and/or README.md
      const hasSourceFile = entryNames.some(n => n.endsWith('.py') || n.endsWith('.js') || n.endsWith('.md'));
      assert.ok(hasSourceFile, 'ZIP package contains expected source or readme artifact');

      // Verify content is not blank prose
      const sourceEntry = zipEntries['example.py'] || zipEntries[entryNames[0]];
      assert.ok(sourceEntry.content.length > 20, 'Source artifact content inside ZIP is non-empty');
    } finally {
      await context.close();
    }
  });

  // --- TEST 5: Design component rendering and diagram-editor interactions ---
  test('Design component detail view renders visual preview and opens interactive diagram editor', async () => {
    const { context, page } = await createPage(cataloguerSession);
    try {
      await page.goto(`${baseUrl}/pages/component.html?id=55`, { waitUntil: 'networkidle' });

      // Verify Design component view rendered
      await page.waitForSelector('#main-diagram-viewport', { timeout: 10000 });
      const viewport = await page.$('#main-diagram-viewport');
      assert.ok(viewport, 'Main diagram viewport container rendered');

      // Check Open Diagram Editor button
      const openDiagramBtn = await page.waitForSelector('#btn-open-erd-editor', { timeout: 10000 });
      await openDiagramBtn.click();

      // Verify Draw.io style modal window opens
      await page.waitForSelector('.drawio-editor-window', { timeout: 5000 });
      await page.waitForSelector('#erd-viewport', { timeout: 5000 });
      await page.waitForSelector('#drawio-canvas-pane', { timeout: 5000 });

      // Verify shapes palette and canvas status bar exist
      const palette = await page.$('#drawio-shapes-palette');
      assert.ok(palette, 'Shapes palette is present in diagram editor');

      // Verify tab switching to Mermaid Source code view
      const mermaidTab = await page.$('.drawio-view-tab[data-tab="mermaid"]');
      if (mermaidTab) {
        await mermaidTab.click();
        await page.waitForTimeout(300);

        const codePane = await page.$('#erd-code-pane');
        const isHidden = await codePane.getAttribute('hidden');
        assert.equal(isHidden, null, 'Code pane is displayed when switching to Mermaid tab');

        const codeBox = await page.waitForSelector('#erd-code-box');
        const mermaidCode = await codeBox.inputValue();
        assert.ok(mermaidCode.includes('erDiagram') || mermaidCode.includes('class') || mermaidCode.length > 10, 'Mermaid code is populated');

        // Switch back to Canvas view
        const canvasTab = await page.$('.drawio-view-tab[data-tab="canvas"]');
        if (canvasTab) {
          await canvasTab.click();
          await page.waitForTimeout(300);
          const canvasPane = await page.$('#drawio-canvas-pane');
          const canvasHidden = await canvasPane.getAttribute('hidden');
          assert.equal(canvasHidden, null, 'Canvas pane is restored when switching to Canvas tab');
        }
      }

      // Close modal cleanly
      const closeBtn = await page.waitForSelector('#drawio-close-btn');
      await closeBtn.click();
      await page.waitForSelector('.drawio-editor-window', { state: 'detached', timeout: 5000 });
    } finally {
      await context.close();
    }
  });

  // --- TEST 6: Search behavior and usage-count deduplication ---
  test('Search behavior renders results and deduplicates rapid repeated queries', async () => {
    const { context, page } = await createPage(userSession);
    try {
      await page.goto(`${baseUrl}/pages/search.html`, { waitUntil: 'networkidle' });

      // Fetch baseline usage count of Flask component (ID 2)
      const initialCompRes = await fetch(`${baseUrl}/api/components/2`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const initialComp = await initialCompRes.json();
      const initialQueried = initialComp.usage?.queriedNotUsed ?? initialComp.queried_not_used_count ?? 0;

      // Perform search for 'Flask'
      await page.fill('#q', 'Flask');
      await page.click('#sf button.btn');

      // Wait for search results
      await page.waitForSelector('#g .card', { timeout: 10000 });
      const resultCards = await page.$$('#g .card');
      assert.ok(resultCards.length >= 1, 'Search query returns result cards');

      const resultTitle = await page.textContent('#g .card h3');
      assert.ok(resultTitle.includes('Flask'), 'Result card corresponds to Flask component');

      // Usage count after first search
      const post1CompRes = await fetch(`${baseUrl}/api/components/2`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const post1Comp = await post1CompRes.json();
      const post1Queried = post1Comp.usage?.queriedNotUsed ?? post1Comp.queried_not_used_count ?? 0;
      assert.equal(post1Queried, initialQueried + 1, 'Search increments queried-not-used count on first query');

      // Submit identical search immediately (rapid repeated search)
      await page.click('#sf button.btn');
      await page.waitForTimeout(500);

      // Usage count should remain identical due to deduplication window
      const post2CompRes = await fetch(`${baseUrl}/api/components/2`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const post2Comp = await post2CompRes.json();
      const post2Queried = post2Comp.usage?.queriedNotUsed ?? post2Comp.queried_not_used_count ?? 0;
      assert.equal(post2Queried, post1Queried, 'Rapid repeated search deduplicates and does NOT double-increment usage');
    } finally {
      await context.close();
    }
  });
});
