/* API tests. Run from the backend folder:  npm test
   Uses an in-memory database seeded with the demo catalogue. */

process.env.DB_PATH = ':memory:';
process.env.NODE_ENV = 'development';
process.env.JWT_SECRET = 'test-secret';
process.env.SEED_PASSWORD = 'test-password-1';
process.env.SEED_USER_PASSWORD = 'test-password-1';
process.env.SEED_CATALOGUER_PASSWORD = 'test-password-1';
process.env.USE_DEDUPE_SECONDS = '30';

const test = require('node:test');
const assert = require('node:assert/strict');

const app = require('../backend/src/server');
const {db} = require('../backend/src/db');

let server;
let base;
const tokens = {};

test.before(async () => {
    server = app.listen(0);
    base = `http://127.0.0.1:${server.address().port}`;

    for (const username of ['user', 'cataloguer']) {
        const response = await call('POST', '/api/auth/login', null, {
            username,
            password: 'test-password-1',
        });
        tokens[username] = response.body.token;
    }
});

test.after(() => server.close());

async function call(method, path, token, body) {
    const response = await fetch(base + path, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? {Authorization: `Bearer ${token}`} : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return {
        status: response.status,
        body: text ? JSON.parse(text) : null,
    };
}

const asUser = (method, path, body) => call(method, path, tokens.user, body);
const asCat = (method, path, body) =>
    call(method, path, tokens.cataloguer, body);

let counter = 0;
const unique = () => `zq${Date.now().toString(36)}${counter++}`;

async function createComponent(overrides = {}) {
    const category = (await asUser('GET', '/api/categories')).body[0];
    const response = await asCat('POST', '/api/components', {
        name: `Comp ${unique()}`,
        description: 'Test component',
        categoryId: category.id,
        type: 'Code',
        tech: 'Python',
        keywords: [],
        ...overrides,
    });
    assert.equal(response.status, 201, JSON.stringify(response.body));
    return response.body;
}

/* ---------- roles ---------- */

test('only the roles from the problem statement can sign in', async () => {
    const roles = db
        .prepare('SELECT DISTINCT role FROM users ORDER BY role')
        .all()
        .map((row) => row.role);
    assert.deepEqual(roles, ['cataloguer', 'user']);

    const manager = await call('POST', '/api/auth/login', null, {
        username: 'manager',
        password: 'test-password-1',
    });
    assert.equal(manager.status, 401);
});

test('a user cannot change the catalogue', async () => {
    const category = (await asUser('GET', '/api/categories')).body[0];
    const body = {
        name: 'Nope',
        description: 'x',
        categoryId: category.id,
        type: 'Code',
        tech: 'Java',
    };
    assert.equal((await asUser('POST', '/api/components', body)).status, 403);
    assert.equal((await asUser('DELETE', '/api/components/1')).status, 403);
    assert.equal(
        (await asUser('GET', '/api/stats/purge-candidates')).status,
        403,
    );
    assert.equal(
        (await asUser('POST', '/api/categories', {name: 'X'})).status,
        403,
    );
});

test('requests without a token are rejected', async () => {
    assert.equal((await call('GET', '/api/components')).status, 401);
});

/* ---------- components ---------- */

test('language is required and normalised to the canonical spelling', async () => {
    const category = (await asUser('GET', '/api/categories')).body[0];

    const missing = await asCat('POST', '/api/components', {
        name: 'No tech',
        description: 'x',
        categoryId: category.id,
        type: 'Code',
        tech: '',
    });
    assert.equal(missing.status, 400);

    const created = await createComponent({tech: 'pYtHoN'});
    assert.equal(created.language, 'Python');
    assert.equal(created.notation, null);

    const design = await createComponent({type: 'Design', tech: 'uml'});
    assert.equal(design.notation, 'UML');
    assert.equal(design.language, null);
});

test('duplicate name + language in the same category is refused', async () => {
    const first = await createComponent();
    const again = await asCat('POST', '/api/components', {
        name: first.name.toUpperCase(),
        description: 'dup',
        categoryId: first.categoryId,
        type: 'Code',
        tech: 'Python',
    });
    assert.equal(again.status, 409);
});

test('keywords can be set and orphan keywords are removed on delete', async () => {
    const word = unique();
    const created = await createComponent({keywords: [word, 'shared-kw']});
    assert.deepEqual(created.keywords.sort(), [word, 'shared-kw'].sort());
    assert.ok(db.prepare('SELECT 1 FROM keywords WHERE word=?').get(word));

    assert.equal(
        (await asCat('DELETE', `/api/components/${created.id}`)).status,
        204,
    );
    assert.equal(
        db.prepare('SELECT 1 FROM keywords WHERE word=?').get(word),
        undefined,
    );
});

/* ---------- hierarchy ---------- */

test('categories can be renamed and moved, but not below themselves', async () => {
    const parent = (await asCat('POST', '/api/categories', {name: unique()}))
        .body;
    const child = (
        await asCat('POST', '/api/categories', {
            name: unique(),
            parentId: parent.id,
        })
    ).body;

    const cycle = await asCat('PUT', `/api/categories/${parent.id}`, {
        parentId: child.id,
    });
    assert.equal(cycle.status, 400);

    const self = await asCat('PUT', `/api/categories/${parent.id}`, {
        parentId: parent.id,
    });
    assert.equal(self.status, 400);

    const renamed = await asCat('PUT', `/api/categories/${child.id}`, {
        name: 'Renamed',
    });
    assert.equal(renamed.body.name, 'Renamed');
    assert.equal(renamed.body.parentId, parent.id);

    const moved = await asCat('PUT', `/api/categories/${child.id}`, {
        parentId: null,
    });
    assert.equal(moved.body.parentId, null);

    assert.equal(
        (await asCat('DELETE', `/api/categories/${child.id}`)).status,
        204,
    );
});

test('sibling categories cannot share a name, even at the top level', async () => {
    const name = unique();
    const first = await asCat('POST', '/api/categories', {name});
    assert.equal(first.status, 201);

    const twin = await asCat('POST', '/api/categories', {
        name: name.toUpperCase(),
    });
    assert.equal(twin.status, 409);

    const other = (await asCat('POST', '/api/categories', {name: unique()}))
        .body;
    const rename = await asCat('PUT', `/api/categories/${other.id}`, {name});
    assert.equal(rename.status, 409);

    // the same name under a different parent is fine
    const nested = await asCat('POST', '/api/categories', {
        name,
        parentId: other.id,
    });
    assert.equal(nested.status, 201);
});

test('a category with components or subcategories cannot be deleted', async () => {
    const parent = (await asCat('POST', '/api/categories', {name: unique()}))
        .body;
    await asCat('POST', '/api/categories', {
        name: unique(),
        parentId: parent.id,
    });
    assert.equal(
        (await asCat('DELETE', `/api/categories/${parent.id}`)).status,
        409,
    );

    const full = (await asCat('POST', '/api/categories', {name: unique()}))
        .body;
    await createComponent({categoryId: full.id});
    assert.equal(
        (await asCat('DELETE', `/api/categories/${full.id}`)).status,
        409,
    );
});

test('browsing a category includes its subcategories and counts add up', async () => {
    const categories = (await asUser('GET', '/api/categories')).body;
    const top = categories.find((c) => c.name === 'Software Design');
    const listed = await asUser(
        'GET',
        `/api/components?category=${top.id}&limit=50`,
    );
    assert.equal(listed.body.total, top.componentCount);
    assert.ok(
        listed.body.items.every((item) =>
            item.categoryPath.startsWith('Software Design'),
        ),
    );
});

/* ---------- browsing and search ---------- */

test('lists are paged on the server', async () => {
    const page = await asUser(
        'GET',
        '/api/components?limit=5&page=2&sort=name',
    );
    assert.equal(page.body.items.length, 5);
    assert.equal(page.body.page, 2);
    assert.ok(page.body.total > 50);
    assert.equal(page.body.pages, Math.ceil(page.body.total / 5));

    const filtered = await asUser(
        'GET',
        '/api/components?type=Design&tech=uml&limit=50',
    );
    assert.ok(filtered.body.total >= 5);
    assert.ok(
        filtered.body.items.every(
            (i) => i.type === 'Design' && i.notation === 'UML',
        ),
    );
});

test('search ranks key word matches above description matches', async () => {
    const word = unique();
    const inDescription = await createComponent({
        name: `AAA ${unique()}`,
        description: `Mentions ${word} in passing`,
    });
    const inKeywords = await createComponent({
        name: `ZZZ ${unique()}`,
        description: 'Nothing relevant',
        keywords: [word],
    });

    const result = await asUser('GET', `/api/search?q=${word}`);
    assert.deepEqual(
        result.body.results.map((r) => r.id),
        [inKeywords.id, inDescription.id],
    );
});

test('search matches whole words, not letters inside words', async () => {
    const word = unique();
    await createComponent({description: `Uses ${word}extra things`});
    const hit = await asUser('GET', `/api/search?q=${word}`);
    assert.equal(hit.body.total, 1); // prefix of a word is fine
    const inner = await asUser('GET', `/api/search?q=${word.slice(2)}`);
    assert.equal(inner.body.total, 0); // middle of a word is not
});

test('all words must match by default, any word with match=any', async () => {
    const a = unique();
    const b = unique();
    await createComponent({keywords: [a]});
    await createComponent({keywords: [b]});
    assert.equal(
        (await asUser('GET', `/api/search?q=${a} ${b}`)).body.total,
        0,
    );
    assert.equal(
        (await asUser('GET', `/api/search?q=${a} ${b}&match=any`)).body.total,
        2,
    );
});

test('punctuation in key words does not hide a component', async () => {
    const result = await asUser('GET', '/api/search?q=class diagram');
    assert.ok(
        result.body.results.some(
            (r) => r.name === 'Library Management Class Diagram',
        ),
    );
});

/* ---------- usage tracking ---------- */

test('a search counts once per component and a reload is not counted again', async () => {
    const word = unique();
    const component = await createComponent({keywords: [word]});

    const first = await asUser('GET', `/api/search?q=${word}`);
    assert.equal(first.body.total, 1);
    assert.ok(first.body.queryId);

    const reload = await asUser('GET', `/api/search?q=${word}`);
    assert.equal(reload.body.queryId, first.body.queryId);

    const now = (await asUser('GET', `/api/components/${component.id}`)).body;
    assert.equal(now.usage.queriedNotUsed, 1);
    assert.equal(now.usage.used, 0);
});

test("using a component from a search moves it from 'not used' to 'used'", async () => {
    const word = unique();
    const component = await createComponent({keywords: [word]});
    const search = await asUser('GET', `/api/search?q=${word}`);

    const used = await asUser('POST', `/api/components/${component.id}/use`, {
        queryId: search.body.queryId,
    });
    assert.equal(used.body.counted, true);
    assert.equal(used.body.component.usage.used, 1);
    assert.equal(used.body.component.usage.queriedNotUsed, 0);

    // a second click straight away is the same use
    const again = await asUser('POST', `/api/components/${component.id}/use`, {
        queryId: search.body.queryId,
    });
    assert.equal(again.body.counted, false);
    assert.equal(again.body.component.usage.used, 1);
    assert.equal(again.body.component.usage.queriedNotUsed, 0);
});

test("using a component without a search does not change 'not used'", async () => {
    const word = unique();
    const component = await createComponent({keywords: [word]});
    await asUser('GET', `/api/search?q=${word}`);

    const used = await asUser(
        'POST',
        `/api/components/${component.id}/use`,
        {},
    );
    assert.equal(used.body.component.usage.used, 1);
    assert.equal(used.body.component.usage.queriedNotUsed, 1);
});

test('a query id belonging to another search is ignored', async () => {
    const word = unique();
    const other = unique();
    const component = await createComponent({keywords: [word]});
    await createComponent({keywords: [other]});
    await asUser('GET', `/api/search?q=${word}`);
    const unrelated = await asUser('GET', `/api/search?q=${other}`);

    const used = await asUser('POST', `/api/components/${component.id}/use`, {
        queryId: unrelated.body.queryId,
    });
    assert.equal(used.body.component.usage.used, 1);
    assert.equal(used.body.component.usage.queriedNotUsed, 1);
});

test('searches are recorded, and empty ones are reported to the cataloguer', async () => {
    const word = unique();
    await asUser('GET', `/api/search?q=${word}`);

    const report = await asCat('GET', '/api/stats/queries');
    assert.equal(report.status, 200);
    assert.ok(report.body.noResults.some((row) => row.q === word));
    assert.ok(report.body.top.length > 0);
    assert.equal((await asUser('GET', '/api/stats/queries')).status, 403);
});

/* ---------- purge ---------- */

test('purge report uses both counters and ignores components that are too new', async () => {
    const report = await asCat('GET', '/api/stats/purge-candidates');
    const names = report.body.items.map((item) => item.name);
    assert.ok(names.includes('jQuery'));
    assert.ok(!names.includes('React'));
    assert.deepEqual(report.body.criteria, {
        minShown: 5,
        maxUsed: 2,
        minAgeDays: 30,
    });

    const fresh = await createComponent();
    db.prepare(
        'UPDATE components SET queried_not_used_count = 9 WHERE id = ?',
    ).run(fresh.id);

    const strict = await asCat('GET', '/api/stats/purge-candidates');
    assert.ok(
        !strict.body.items.some((item) => item.id === fresh.id),
        'new component must not be listed',
    );

    const relaxed = await asCat(
        'GET',
        '/api/stats/purge-candidates?minAgeDays=0',
    );
    assert.ok(relaxed.body.items.some((item) => item.id === fresh.id));

    const invalid = await asCat(
        'GET',
        '/api/stats/purge-candidates?maxUsed=-1',
    );
    assert.equal(invalid.status, 400);
});

test('purge removes the selected components only', async () => {
    const keep = await createComponent();
    const drop = await createComponent();

    const result = await asCat('POST', '/api/components/purge', {
        ids: [drop.id, 999999],
    });
    assert.equal(result.body.deleted, 1);
    assert.equal(
        (await asUser('GET', `/api/components/${drop.id}`)).status,
        404,
    );
    assert.equal(
        (await asUser('GET', `/api/components/${keep.id}`)).status,
        200,
    );

    assert.equal(
        (await asCat('POST', '/api/components/purge', {ids: []})).status,
        400,
    );
    assert.equal(
        (await asUser('POST', '/api/components/purge', {ids: [keep.id]}))
            .status,
        403,
    );
});

/* ---------- statistics ---------- */

test('statistics add up', async () => {
    const stats = (await asUser('GET', '/api/stats')).body;
    const rows = db
        .prepare(
            `
        SELECT COUNT(*) AS n, SUM(used_count) AS used,
               SUM(queried_not_used_count) AS notUsed
        FROM components
    `,
        )
        .get();

    assert.equal(stats.components, rows.n);
    assert.equal(stats.used, rows.used);
    assert.equal(stats.notUsed, rows.notUsed);
    assert.equal(
        stats.byType.reduce((sum, t) => sum + t.count, 0),
        rows.n,
    );
    assert.equal(stats.mostUsed.length, 5);
});
