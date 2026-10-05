require('dotenv').config();

/* ComponentHub REST API
   Express + SQLite

   Layers:
   auth middleware -> route handlers -> SQL
   Prepared statements are used for user input.

   Roles (from the problem statement):
   - user       queries the catalogue, browses categories, uses components
   - cataloguer adds / edits / deletes components, manages keywords and
                categories, reads the usage reports and purges components
*/

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const {db, verifyPassword} = require('./db');
const {LANGUAGES, NOTATIONS, canonicalTech} = require('./taxonomy');

/* =========================================================
   APP CONFIG
   ========================================================= */

const SECRET =
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === 'development' ? 'dev-only-secret' : null);

if (!SECRET) {
    throw new Error('Set JWT_SECRET (or NODE_ENV=development for local work)');
}

/* A repeated identical search by the same user inside this window
   (page reload, double submit) is the same query and is not counted
   again. */
const QUERY_DEDUPE_SECONDS = 60;

/* Using the same component twice inside this window by the same
   user counts once (double click). */
const USE_DEDUPE_SECONDS = Number(process.env.USE_DEDUPE_SECONDS ?? 30);

const app = express();
app.set('trust proxy', 1);

app.use(cors({origin: process.env.CORS_ORIGIN || true}));
app.use(express.json({limit: '100kb'}));

/* =========================================================
   HELPERS
   ========================================================= */

const bad = (message, status = 400) =>
    Object.assign(new Error(message), {status});

const wrap = (fn) => (req, res, next) => {
    try {
        fn(req, res, next);
    } catch (error) {
        next(error);
    }
};

const toInt = (value, fallback, min, max) => {
    const n = Number.parseInt(value, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
};

/* =========================================================
   AUTHENTICATION
   ========================================================= */

const authenticate = (req, _res, next) => {
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');

    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch {
        next(bad('Authentication required', 401));
    }
};

const allow =
    (...roles) =>
    (req, _res, next) => {
        if (roles.includes(req.user.role)) {
            return next();
        }
        next(bad('Forbidden for role ' + req.user.role, 403));
    };

/* =========================================================
   HEALTH
   ========================================================= */

app.get('/health', (_req, res) => res.json({ok: true}));

/* =========================================================
   LOGIN
   ========================================================= */

const failed = new Map();
const WINDOW = 10 * 60 * 1000;
const LIMIT = 10;
const blocked = (ip) => {
    const f = failed.get(ip);
    if (!f || Date.now() - f.since > WINDOW) {
        failed.delete(ip);
        return false;
    }
    return f.count >= LIMIT;
};
const recordFailure = (ip) => {
    const f = failed.get(ip);
    if (!f || Date.now() - f.since > WINDOW) {
        failed.set(ip, {count: 1, since: Date.now()});
    } else {
        f.count++;
    }
};

app.post(
    '/api/auth/login',
    wrap((req, res) => {
        const {username, password} = req.body || {};
        if (blocked(req.ip)) {
            throw bad(
                'Too many failed attempts. Try again in a few minutes.',
                429,
            );
        }

        const user =
            typeof username === 'string' &&
            typeof password === 'string' &&
            db.prepare('SELECT * FROM users WHERE username=?').get(username);

        if (!user || !verifyPassword(password, user.password_hash)) {
            recordFailure(req.ip);
            throw bad('Invalid username or password', 401);
        }
        failed.delete(req.ip);

        const token = jwt.sign(
            {id: user.id, username: user.username, role: user.role},
            SECRET,
            {expiresIn: '8h'},
        );

        res.json({
            token,
            user: {id: user.id, username: user.username, role: user.role},
        });
    }),
);

/* =========================================================
   EVERYTHING BELOW REQUIRES AUTH
   ========================================================= */

app.use('/api', authenticate);
app.use('/api/health', (req, res) => {
    // backend is running
    res.json({ok: true});
});

app.get('/api/me', (req, res) => res.json(req.user));

app.get('/api/meta', (_req, res) =>
    res.json({languages: LANGUAGES, notations: NOTATIONS}),
);

/* =========================================================
   CATEGORY HELPERS
   ========================================================= */

const catMap = () =>
    new Map(
        db
            .prepare('SELECT id, name, parent_id FROM categories')
            .all()
            .map((category) => [category.id, category]),
    );

const pathOf = (map, id) => {
    const category = map.get(id);
    if (!category) return '';
    return (
        (category.parent_id ? pathOf(map, category.parent_id) + ' › ' : '') +
        category.name
    );
};

const subtree = (map, id) => [
    id,
    ...[...map.values()]
        .filter((category) => category.parent_id === id)
        .flatMap((category) => subtree(map, category.id)),
];

/* Number of components per category including all descendants,
   computed with one grouped query instead of one query per row. */
const subtreeCounts = (map) => {
    const direct = new Map(
        db
            .prepare(
                `
            SELECT category_id AS id, COUNT(*) AS n
            FROM components
            GROUP BY category_id
        `,
            )
            .all()
            .map((row) => [row.id, row.n]),
    );
    const total = (id) =>
        subtree(map, id).reduce((sum, x) => sum + (direct.get(x) || 0), 0);

    return new Map([...map.keys()].map((id) => [id, total(id)]));
};

const categoryJson = (map, counts, category) => ({
    id: category.id,
    name: category.name,
    parentId: category.parent_id,
    path: pathOf(map, category.id),
    componentCount: counts.get(category.id) || 0,
});

/* =========================================================
   HYDRATE DATABASE ROWS INTO THE FRONTEND DATA MODEL
   ========================================================= */

function hydrate(rows) {
    if (!rows.length) {
        return [];
    }

    const map = catMap();
    const ids = rows.map((row) => row.id);
    const keywordsByComponent = {};

    db.prepare(
        `
        SELECT ck.component_id AS id, k.word
        FROM component_keywords ck
        JOIN keywords k ON k.id = ck.keyword_id
        WHERE ck.component_id IN (${ids.map(() => '?').join()})
        ORDER BY k.word
    `,
    )
        .all(...ids)
        .forEach((row) => {
            (keywordsByComponent[row.id] ??= []).push(row.word);
        });

    return rows.map((row) => {
        const shown = row.queried_not_used_count;
        const used = row.used_count;
        const added = Date.parse(row.added_on);

        return {
            id: row.id,
            name: row.name,
            description: row.description,
            categoryId: row.category_id,
            categoryPath: pathOf(map, row.category_id),
            type: row.type,
            language: row.type === 'Code' ? row.tech : null,
            notation: row.type === 'Design' ? row.tech : null,
            keywords: keywordsByComponent[row.id] || [],
            url: row.url,
            usage: {
                used,
                queriedNotUsed: shown,
                notUsedRatio:
                    used + shown
                        ? Math.round((shown / (used + shown)) * 100) / 100
                        : null,
            },
            addedOn: row.added_on,
            ageDays: Number.isFinite(added)
                ? Math.max(0, Math.floor((Date.now() - added) / 86400000))
                : 0,
        };
    });
}

/* =========================================================
   SEARCH / LIST
   ========================================================= */

/* Text is lower-cased and punctuation becomes a space, so that
   "class-diagram" can be found with "class" or "diagram". */
const norm = (expr) =>
    `(' ' || replace(replace(replace(replace(replace(lower(${expr}),` +
    `'-',' '),'/',' '),',',' '),'.',' '),'_',' ') || ' ')`;

const wordsOf = (q) =>
    String(q ?? '')
        .toLowerCase()
        .split(/[^\p{L}\p{N}+#]+/u)
        .filter(Boolean)
        .slice(0, 8);

const ORDER = {
    name: 'c.name COLLATE NOCASE, c.id',
    usage: 'c.used_count DESC, c.name COLLATE NOCASE',
    new: 'c.added_on DESC, c.id DESC',
    relevance: 'score DESC, c.used_count DESC, c.name COLLATE NOCASE',
};

/* Whole-word-prefix matching with a relevance score:
   key word 5, name 4, language/notation/type/category 2,
   description 1. "all" (default) needs every word to match,
   "any" needs at least one. Results are paged in SQL. */
function find({
    q = '',
    match,
    category,
    type,
    tech,
    sort,
    page = 1,
    limit = 12,
}) {
    const where = [];
    const params = {};
    const parts = [];

    wordsOf(q).forEach((word, i) => {
        params[`w${i}`] = '% ' + word.replace(/[\\%_]/g, '\\$&') + '%';
        const like = (expr) => `${norm(expr)} LIKE @w${i} ESCAPE '\\'`;

        parts.push(`(
            CASE WHEN ${like('c.name')} THEN 4 ELSE 0 END
          + CASE WHEN EXISTS (
                SELECT 1
                FROM component_keywords ck
                JOIN keywords k ON k.id = ck.keyword_id
                WHERE ck.component_id = c.id AND ${like('k.word')}
            ) THEN 5 ELSE 0 END
          + CASE WHEN ${like("c.tech || ' ' || c.type || ' ' || cat.name")}
                 THEN 2 ELSE 0 END
          + CASE WHEN ${like('c.description')} THEN 1 ELSE 0 END
        )`);
    });

    if (parts.length) {
        const tests = parts.map((part) => `${part} > 0`);
        where.push(
            match === 'any' ? `(${tests.join(' OR ')})` : tests.join(' AND '),
        );
    }

    if (category) {
        const map = catMap();
        const id = Number(category);
        where.push(
            map.has(id) ? `c.category_id IN (${subtree(map, id).join()})` : '0',
        );
    }

    if (type) {
        where.push('c.type = @type');
        params.type = String(type);
    }

    if (tech) {
        where.push('c.tech = @tech COLLATE NOCASE');
        params.tech = String(tech);
    }

    const from = `
        FROM components c
        JOIN categories cat ON cat.id = c.category_id
        ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    `;

    const pageSize = toInt(limit, 12, 1, 50);
    const total = db.prepare(`SELECT COUNT(*) AS n ${from}`).get(params).n;
    const pages = Math.ceil(total / pageSize);
    const current = toInt(page, 1, 1, Math.max(1, pages));

    const order =
        sort === 'relevance' && !parts.length
            ? ORDER.name
            : ORDER[sort] || (parts.length ? ORDER.relevance : ORDER.name);

    const rows = db
        .prepare(
            `
        SELECT c.*, ${parts.length ? parts.join(' + ') : '0'} AS score
        ${from}
        ORDER BY ${order}
        LIMIT @limit OFFSET @offset
    `,
        )
        .all({
            ...params,
            limit: pageSize,
            offset: (current - 1) * pageSize,
        });

    return {
        items: hydrate(rows),
        total,
        page: current,
        pageSize,
        pages,
    };
}

/* =========================================================
   COMPONENT INPUT VALIDATION
   ========================================================= */

function parseComponent(body = {}) {
    const stringValue = (value, max) =>
        typeof value === 'string' ? value.trim().slice(0, max) : '';

    const type = body.type;

    const component = {
        name: stringValue(body.name, 120),
        description: stringValue(body.description, 2000),
        type,
        tech: canonicalTech(
            type,
            stringValue(body.tech ?? body.language ?? body.notation, 60),
        ),
        url: stringValue(body.url, 300),
        categoryId: Number(body.categoryId),
    };

    if (!component.name || !component.description) {
        throw bad('name and description are required');
    }

    if (!['Code', 'Design'].includes(component.type)) {
        throw bad("type must be 'Code' or 'Design'");
    }

    if (!component.tech) {
        throw bad(
            component.type === 'Design'
                ? 'notation is required for design components'
                : 'language is required for code components',
        );
    }

    if (!catMap().has(component.categoryId)) {
        throw bad('unknown categoryId');
    }

    if (component.url && !/^https?:\/\//i.test(component.url)) {
        throw bad('url must start with http:// or https://');
    }

    return component;
}

/* Same name + language/notation in the same category is a duplicate. */
function assertUnique(component, excludeId = 0) {
    const clash = db
        .prepare(
            `
        SELECT id FROM components
        WHERE name = ? COLLATE NOCASE
          AND tech = ? COLLATE NOCASE
          AND category_id = ?
          AND id <> ?
    `,
        )
        .get(component.name, component.tech, component.categoryId, excludeId);

    if (clash) {
        throw bad(
            'A component with this name and language/notation already exists in this category',
            409,
        );
    }
}

/* =========================================================
   KEYWORDS
   ========================================================= */

const parseKeywords = (value) => {
    const values = Array.isArray(value)
        ? value
        : String(value ?? '').split(',');

    return [
        ...new Map(
            values
                .map((keyword) => String(keyword).trim().slice(0, 40))
                .filter(Boolean)
                .map((keyword) => [keyword.toLowerCase(), keyword]),
        ).values(),
    ].slice(0, 20);
};

const pruneKeywords = () =>
    db
        .prepare(
            `
        DELETE FROM keywords
        WHERE id NOT IN (SELECT keyword_id FROM component_keywords)
    `,
        )
        .run();

const setKeywords = db.transaction((componentId, words) => {
    db.prepare('DELETE FROM component_keywords WHERE component_id=?').run(
        componentId,
    );

    for (const word of words) {
        db.prepare('INSERT OR IGNORE INTO keywords(word) VALUES(?)').run(word);

        const keyword = db
            .prepare('SELECT id FROM keywords WHERE word=?')
            .get(word);

        db.prepare('INSERT OR IGNORE INTO component_keywords VALUES(?,?)').run(
            componentId,
            keyword.id,
        );
    }

    pruneKeywords();
});

/* =========================================================
   404 COMPONENT
   ========================================================= */

const getOr404 = (id) => {
    const componentId = Number(id);

    if (!Number.isInteger(componentId) || componentId <= 0) {
        throw bad('invalid component id');
    }

    const row = db
        .prepare('SELECT * FROM components WHERE id=?')
        .get(componentId);

    if (!row) {
        throw bad('Component not found', 404);
    }

    return row;
};

const one = (id) => hydrate([getOr404(id)])[0];

/* =========================================================
   CATEGORIES
   ========================================================= */

app.get(
    '/api/categories',
    wrap((_req, res) => {
        const map = catMap();
        const counts = subtreeCounts(map);

        res.json(
            [...map.values()].map((category) =>
                categoryJson(map, counts, category),
            ),
        );
    }),
);

const categoryName = (value) =>
    String(value ?? '')
        .trim()
        .slice(0, 60);

const uniqueCategory = (error) =>
    error.code === 'SQLITE_CONSTRAINT_UNIQUE'
        ? bad('A category with this name already exists here', 409)
        : error;

/* UNIQUE(parent_id, name) does not stop two top-level categories
   (parent_id NULL) from sharing a name, because SQLite treats NULLs
   as distinct. Siblings are therefore also compared explicitly. */
const assertFreeName = (name, parent, excludeId = 0) => {
    const clash = db
        .prepare(
            `
        SELECT 1 FROM categories
        WHERE name = ? COLLATE NOCASE
          AND parent_id IS ?
          AND id <> ?
    `,
        )
        .get(name, parent, excludeId);

    if (clash) {
        throw bad('A category with this name already exists here', 409);
    }
};

app.post(
    '/api/categories',
    allow('cataloguer'),
    wrap((req, res) => {
        const name = categoryName(req.body?.name);
        const parent = req.body?.parentId ?? null;

        if (!name) {
            throw bad('name is required');
        }

        if (parent !== null && !catMap().has(Number(parent))) {
            throw bad('unknown parentId');
        }

        assertFreeName(name, parent === null ? null : Number(parent));

        try {
            const id = db
                .prepare('INSERT INTO categories(name, parent_id) VALUES(?,?)')
                .run(
                    name,
                    parent === null ? null : Number(parent),
                ).lastInsertRowid;

            const map = catMap();
            res.status(201).json(
                categoryJson(map, subtreeCounts(map), map.get(Number(id))),
            );
        } catch (error) {
            throw uniqueCategory(error);
        }
    }),
);

/* Rename and / or move a category. A category cannot be moved
   below itself. */
app.put(
    '/api/categories/:id',
    allow('cataloguer'),
    wrap((req, res) => {
        const id = Number(req.params.id);
        const map = catMap();
        const existing = map.get(id);

        if (!existing) {
            throw bad('Category not found', 404);
        }

        const body = req.body || {};
        const name =
            body.name === undefined ? existing.name : categoryName(body.name);
        let parent = existing.parent_id;

        if (!name) {
            throw bad('name is required');
        }

        if ('parentId' in body) {
            parent = body.parentId === null ? null : Number(body.parentId);

            if (parent !== null && !map.has(parent)) {
                throw bad('unknown parentId');
            }
            if (parent !== null && subtree(map, id).includes(parent)) {
                throw bad(
                    'A category cannot be moved into itself or one of its own subcategories',
                );
            }
        }

        assertFreeName(name, parent, id);

        try {
            db.prepare(
                'UPDATE categories SET name=?, parent_id=? WHERE id=?',
            ).run(name, parent, id);
        } catch (error) {
            throw uniqueCategory(error);
        }

        const fresh = catMap();
        res.json(categoryJson(fresh, subtreeCounts(fresh), fresh.get(id)));
    }),
);

app.delete(
    '/api/categories/:id',
    allow('cataloguer'),
    wrap((req, res) => {
        const id = Number(req.params.id);

        if (!catMap().has(id)) {
            throw bad('Category not found', 404);
        }

        if (
            db.prepare('SELECT 1 FROM categories WHERE parent_id=?').get(id) ||
            db.prepare('SELECT 1 FROM components WHERE category_id=?').get(id)
        ) {
            throw bad('Category is not empty', 409);
        }

        db.prepare('DELETE FROM categories WHERE id=?').run(id);
        res.status(204).end();
    }),
);

/* =========================================================
   COMPONENTS
   ========================================================= */

/* Browsing / filtering. Not recorded as a query. */
app.get(
    '/api/components',
    wrap((req, res) => {
        res.json(find(req.query));
    }),
);

app.get(
    '/api/components/:id',
    wrap((req, res) => {
        res.json(one(req.params.id));
    }),
);

app.post(
    '/api/components',
    allow('cataloguer'),
    wrap((req, res) => {
        const component = parseComponent(req.body);
        const keywords = parseKeywords(req.body.keywords);

        assertUnique(component);

        const id = db.transaction(() => {
            const result = db
                .prepare(
                    `
            INSERT INTO components(
                name, description, category_id, type, tech, url, created_by
            )
            VALUES(?,?,?,?,?,?,?)
        `,
                )
                .run(
                    component.name,
                    component.description,
                    component.categoryId,
                    component.type,
                    component.tech,
                    component.url,
                    req.user.id,
                );

            setKeywords(result.lastInsertRowid, keywords);
            return result.lastInsertRowid;
        })();

        res.status(201).json(one(id));
    }),
);

/* Remove several components at once (used by the purge report). */
app.post(
    '/api/components/purge',
    allow('cataloguer'),
    wrap((req, res) => {
        const ids = [
            ...new Set(
                (Array.isArray(req.body?.ids) ? req.body.ids : [])
                    .map(Number)
                    .filter((n) => Number.isInteger(n) && n > 0),
            ),
        ];

        if (!ids.length || ids.length > 200) {
            throw bad('ids must contain between 1 and 200 component ids');
        }

        const deleted = db.transaction(() => {
            const remove = db.prepare('DELETE FROM components WHERE id=?');
            const count = ids.reduce(
                (sum, id) => sum + remove.run(id).changes,
                0,
            );
            pruneKeywords();
            return count;
        })();

        res.json({deleted});
    }),
);

app.put(
    '/api/components/:id',
    allow('cataloguer'),
    wrap((req, res) => {
        const existing = getOr404(req.params.id);
        const component = parseComponent(req.body);
        const keywords = parseKeywords(req.body?.keywords);

        assertUnique(component, existing.id);

        db.transaction(() => {
            db.prepare(
                `
            UPDATE components
            SET name=?, description=?, category_id=?, type=?, tech=?, url=?
            WHERE id=?
        `,
            ).run(
                component.name,
                component.description,
                component.categoryId,
                component.type,
                component.tech,
                component.url,
                existing.id,
            );

            setKeywords(existing.id, keywords);
        })();

        res.json(one(existing.id));
    }),
);

app.put(
    '/api/components/:id/keywords',
    allow('cataloguer'),
    wrap((req, res) => {
        const row = getOr404(req.params.id);
        setKeywords(row.id, parseKeywords(req.body?.keywords));
        res.json(one(row.id));
    }),
);

app.delete(
    '/api/components/:id',
    allow('cataloguer'),
    wrap((req, res) => {
        const row = getOr404(req.params.id);

        db.transaction(() => {
            db.prepare('DELETE FROM components WHERE id=?').run(row.id);
            pruneKeywords();
        })();

        res.status(204).end();
    }),
);

/* =========================================================
   SEARCH + USAGE TRACKING

   used_count              times the component was used
   queried_not_used_count  times it came up in a query that did not
                           lead to it being used

   Every search records which components it returned (query_results).
   When a component is used from a search, that row is flagged as
   used and the "not used" counter drops by one again. A component
   used without a search (for example while browsing) only raises
   used_count.
   ========================================================= */

app.get(
    '/api/search',
    wrap((req, res) => {
        const query = String(req.query.q ?? '')
            .trim()
            .slice(0, 200);

        if (!wordsOf(query).length) {
            return res.json({
                query,
                queryId: null,
                count: 0,
                total: 0,
                page: 1,
                pages: 0,
                results: [],
            });
        }

        const found = find({
            ...req.query,
            q: query,
            limit: req.query.limit ?? 20,
        });

        const queryId = db.transaction(() => {
            const repeat = db
                .prepare(
                    `
            SELECT id FROM query_log
            WHERE user_id = ?
              AND lower(q) = lower(?)
              AND at >= datetime('now', ?)
            ORDER BY id DESC
            LIMIT 1
        `,
                )
                .get(req.user.id, query, `-${QUERY_DEDUPE_SECONDS} seconds`);

            const id = repeat
                ? repeat.id
                : db
                      .prepare(
                          `
                INSERT INTO query_log(user_id, q, result_count)
                VALUES(?,?,?)
            `,
                      )
                      .run(req.user.id, query, found.total).lastInsertRowid;

            const record = db.prepare(`
            INSERT OR IGNORE INTO query_results(query_id, component_id)
            VALUES(?,?)
        `);
            const bump = db.prepare(`
            UPDATE components
            SET queried_not_used_count = queried_not_used_count + 1
            WHERE id = ?
        `);

            for (const item of found.items) {
                if (record.run(id, item.id).changes) {
                    bump.run(item.id);
                }
            }

            return Number(id);
        })();

        res.json({
            query,
            queryId,
            count: found.items.length,
            total: found.total,
            page: found.page,
            pages: found.pages,
            results: found.items,
        });
    }),
);

app.post(
    '/api/components/:id/use',
    wrap((req, res) => {
        const row = getOr404(req.params.id);
        const queryId = Number(req.body?.queryId) || null;

        const counted = db.transaction(() => {
            const recent = db
                .prepare(
                    `
            SELECT 1 FROM usage_events
            WHERE component_id = ? AND user_id = ? AND at >= datetime('now', ?)
            LIMIT 1
        `,
                )
                .get(row.id, req.user.id, `-${USE_DEDUPE_SECONDS} seconds`);

            if (recent) {
                return false;
            }

            const link = queryId
                ? db
                      .prepare(
                          `
                SELECT qr.used
                FROM query_results qr
                JOIN query_log q ON q.id = qr.query_id
                WHERE qr.query_id = ?
                  AND qr.component_id = ?
                  AND q.user_id = ?
            `,
                      )
                      .get(queryId, row.id, req.user.id)
                : null;

            db.prepare(
                `
            INSERT INTO usage_events(component_id, user_id, query_id)
            VALUES(?,?,?)
        `,
            ).run(row.id, req.user.id, link ? queryId : null);

            db.prepare(
                'UPDATE components SET used_count = used_count + 1 WHERE id = ?',
            ).run(row.id);

            if (link && !link.used) {
                db.prepare(
                    `
                UPDATE query_results SET used = 1
                WHERE query_id = ? AND component_id = ?
            `,
                ).run(queryId, row.id);

                db.prepare(
                    `
                UPDATE components
                SET queried_not_used_count = MAX(0, queried_not_used_count - 1)
                WHERE id = ?
            `,
                ).run(row.id);
            }

            return true;
        })();

        res.json({component: one(row.id), counted});
    }),
);

/* =========================================================
   STATISTICS AND REPORTS
   ========================================================= */

app.get(
    '/api/stats',
    wrap((_req, res) => {
        const map = catMap();
        const counts = subtreeCounts(map);
        const tops = [...map.values()].filter(
            (category) => !category.parent_id,
        );

        const totals = db
            .prepare(
                `
        SELECT
            COUNT(*) AS components,
            COALESCE(SUM(used_count), 0) AS used,
            COALESCE(SUM(queried_not_used_count), 0) AS notUsed
        FROM components
    `,
            )
            .get();

        const top = (order, limit = 5) =>
            hydrate(
                db
                    .prepare(
                        `SELECT * FROM components ORDER BY ${order} LIMIT ${limit}`,
                    )
                    .all(),
            );

        res.json({
            ...totals,
            categories: map.size,
            topCategories: tops.length,
            queries: db.prepare('SELECT COUNT(*) AS n FROM query_log').get().n,
            byType: db
                .prepare(
                    `
            SELECT type, COUNT(*) AS count
            FROM components GROUP BY type ORDER BY type
        `,
                )
                .all(),
            byCategory: tops.map((category) => ({
                id: category.id,
                name: category.name,
                count: counts.get(category.id) || 0,
            })),
            mostUsed: top('used_count DESC, name'),
            mostShownNotUsed: top(
                'queried_not_used_count DESC, used_count, name',
            ),
            recent: top('added_on DESC, id DESC'),
        });
    }),
);

/* Top searches and searches that found nothing: tells the
   cataloguer which components are missing. */
app.get(
    '/api/stats/queries',
    allow('cataloguer'),
    wrap((_req, res) => {
        const grouped = (filter) =>
            db
                .prepare(
                    `
        SELECT lower(q) AS q, COUNT(*) AS count, MAX(at) AS lastAt
        FROM query_log
        ${filter}
        GROUP BY lower(q)
        ORDER BY count DESC, q
        LIMIT 10
    `,
                )
                .all();

        res.json({
            total: db.prepare('SELECT COUNT(*) AS n FROM query_log').get().n,
            top: grouped(''),
            noResults: grouped('WHERE result_count = 0'),
        });
    }),
);

/* Purge report. A component is a candidate when it has been used
   few times although it keeps coming up in queries, and it has been
   in the catalogue long enough to have had a fair chance. */
app.get(
    '/api/stats/purge-candidates',
    allow('cataloguer'),
    wrap((req, res) => {
        const read = (name, fallback) => {
            const raw = req.query[name];
            if (raw === undefined || raw === '') return fallback;
            const value = Number(raw);
            if (!Number.isInteger(value) || value < 0) {
                throw bad(`${name} must be a whole number, 0 or more`);
            }
            return value;
        };

        const criteria = {
            minShown: read('minShown', 5),
            maxUsed: read('maxUsed', 2),
            minAgeDays: read('minAgeDays', 30),
        };

        const items = hydrate(
            db
                .prepare(
                    `
        SELECT * FROM components
        WHERE used_count <= @maxUsed
          AND queried_not_used_count >= @minShown
          AND julianday('now') - julianday(added_on) >= @minAgeDays
        ORDER BY queried_not_used_count DESC, used_count, name
    `,
                )
                .all(criteria),
        );

        res.json({criteria, count: items.length, items});
    }),
);

/* =========================================================
   ERRORS
   ========================================================= */

app.use('/api', (_req, _res, next) => next(bad('Not found', 404)));

app.use((error, _req, res, _next) => {
    if (!error.status) {
        console.error(error);
    }

    res.status(error.status || 500).json({
        error: error.status ? error.message : 'Internal server error',
    });
});

/* =========================================================
   START SERVER
   ========================================================= */

if (require.main === module) {
    app.listen(process.env.PORT || 3000, () => {
        console.log(`ComponentHub API on :${process.env.PORT || 3000}`);
    });
}

module.exports = app;
