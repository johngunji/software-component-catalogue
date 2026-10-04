require("dotenv").config();

/* ComponentHub REST API
   Express + SQLite

   Layers:
   auth middleware -> route handlers -> SQL
   Prepared statements are used for user input.
*/

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const {
    db,
    verifyPassword
} = require("./db");


/* =========================================================
   APP CONFIG
   ========================================================= */

const SECRET =
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "development" ? "dev-only-secret" : null);

if (!SECRET) {
    throw new Error("Set JWT_SECRET (or NODE_ENV=development for local work)");
}


const app = express();
app.set("trust proxy", 1);


app.use(
    cors({
        origin:
            process.env.CORS_ORIGIN ||
            true
    })
);


app.use(
    express.json({
        limit: "100kb"
    })
);


/* =========================================================
   HELPERS
   ========================================================= */

const bad = (
    message,
    status = 400
) =>
    Object.assign(
        new Error(message),
        { status }
    );


const wrap = fn =>
    (req, res, next) => {

        try {

            fn(req, res, next);

        } catch (error) {

            next(error);

        }

    };


/* =========================================================
   AUTHENTICATION
   ========================================================= */

const authenticate =
    (req, _res, next) => {

        const token =
            (
                req.headers.authorization ||
                ""
            ).replace(
                /^Bearer /,
                ""
            );


        try {

            req.user =
                jwt.verify(
                    token,
                    SECRET
                );

            next();

        } catch {

            next(
                bad(
                    "Authentication required",
                    401
                )
            );

        }

    };


const allow =
    (...roles) =>
    (req, _res, next) => {

        if (
            roles.includes(
                req.user.role
            )
        ) {

            return next();

        }


        next(
            bad(
                "Forbidden for role " +
                req.user.role,
                403
            )
        );

    };


/* =========================================================
   HEALTH
   ========================================================= */

app.get(
    "/health",
    (_req, res) =>
        res.json({ ok: true })
);


/* =========================================================
   LOGIN
   ========================================================= */

const failed = new Map();
const WINDOW = 10 * 60 * 1000;
const LIMIT = 10;
const blocked = ip => {
    const f = failed.get(ip);
    if (!f || Date.now() - f.since > WINDOW) {
        failed.delete(ip);
        return false;
    }
    return f.count >= LIMIT;
};
const recordFailure = ip => {
    const f = failed.get(ip);
    if (!f || Date.now() - f.since > WINDOW) {
        failed.set(ip, { count: 1, since: Date.now() });
    } else {
        f.count++;
    }
};

app.post(
    "/api/auth/login",
    wrap((req, res) => {

        const { username, password } = req.body || {};
        if (blocked(req.ip)) {
            throw bad("Too many failed attempts. Try again in a few minutes.", 429);
        }


        const user =
            typeof username === "string" &&
            typeof password === "string" &&
            db.prepare("SELECT * FROM users WHERE username=?").get(username);


        if (
            !user ||
            !verifyPassword(
                password,
                user.password_hash
            )
        ) {

            recordFailure(req.ip);
            throw bad("Invalid username or password", 401);

        }
        failed.delete(req.ip);


        const token =
            jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    role: user.role
                },
                SECRET,
                {
                    expiresIn: "8h"
                }
            );


        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });

    })
);


/* =========================================================
   EVERYTHING BELOW REQUIRES AUTH
   ========================================================= */

app.use(
    "/api",
    authenticate
);


app.get(
    "/api/me",
    (req, res) =>
        res.json(req.user)
);


/* =========================================================
   CATEGORY HELPERS
   ========================================================= */

const catMap = () =>
    new Map(
        db
            .prepare(`
                SELECT
                    id,
                    name,
                    parent_id
                FROM categories
            `)
            .all()
            .map(
                category =>
                    [category.id, category]
            )
    );


const pathOf = (
    map,
    id
) => {

    const category =
        map.get(id);


    return category

        ? (
            category.parent_id
                ? pathOf(
                    map,
                    category.parent_id
                ) + " › "
                : ""
        ) + category.name

        : "";

};


const subtree = (
    map,
    id
) => {

    return [
        id,

        ...[
            ...map.values()
        ]
            .filter(
                category =>
                    category.parent_id === id
            )
            .flatMap(
                category =>
                    subtree(
                        map,
                        category.id
                    )
            )
    ];

};


/* =========================================================
   HYDRATE DATABASE ROWS
   INTO FRONTEND DATA MODEL
   ========================================================= */

function hydrate(rows) {

    if (!rows.length) {
        return [];
    }


    const map = catMap();

    const ids =
        rows.map(
            row => row.id
        );


    const keywordsByComponent = {};


    db.prepare(`
        SELECT
            ck.component_id AS id,
            k.word
        FROM component_keywords ck
        JOIN keywords k
            ON k.id = ck.keyword_id
        WHERE ck.component_id
            IN (${ids.map(() => "?").join()})
        ORDER BY k.word
    `)
        .all(...ids)
        .forEach(row => {

            (
                keywordsByComponent[row.id] ??= []
            ).push(row.word);

        });


    return rows.map(row => ({

        id: row.id,

        name: row.name,

        description:
            row.description,

        categoryId:
            row.category_id,

        categoryPath:
            pathOf(
                map,
                row.category_id
            ),

        type:
            row.type,

        language:
            row.type === "Code"
                ? row.tech
                : null,

        notation:
            row.type === "Design"
                ? row.tech
                : null,

        keywords:
            keywordsByComponent[row.id] ||
            [],

        url:
            row.url,

        usage: {
            used:
                row.used_count,

            queriedNotUsed:
                row.queried_not_used_count
        },

        addedOn:
            row.added_on

    }));

}


/* =========================================================
   SEARCH SQL
   ========================================================= */

const HAY = `
    lower(
        c.name ||
        ' ' ||
        c.description ||
        ' ' ||
        c.type ||
        ' ' ||
        c.tech ||
        ' ' ||
        (
            SELECT name
            FROM categories
            WHERE id = c.category_id
        ) ||
        ' ' ||
        coalesce(
            (
                SELECT group_concat(
                    k.word,
                    ' '
                )
                FROM component_keywords ck
                JOIN keywords k
                    ON k.id = ck.keyword_id
                WHERE ck.component_id = c.id
            ),
            ''
        )
    )
`;


const ORDER = {

    name:
        "c.name COLLATE NOCASE",

    usage:
        "c.used_count DESC, c.name",

    new:
        "c.added_on DESC, c.id DESC"

};


/* =========================================================
   FIND COMPONENTS
   ========================================================= */

function find({
    q = "",
    category,
    type,
    tech,
    sort = "name"
}) {

    const where = [];
    const args = [];


    for (
        const word of String(q)
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 8)
    ) {

        where.push(
            `${HAY} LIKE ? ESCAPE '\\'`
        );


        args.push(
            "%" +
            word.replace(
                /[\\%_]/g,
                "\\$&"
            ) +
            "%"
        );

    }


    if (category) {

        const map = catMap();

        const id =
            Number(category);


        if (map.has(id)) {

            const ids =
                subtree(
                    map,
                    id
                );


            where.push(
                `c.category_id IN (${ids.join()})`
            );

        } else {

            where.push("0");

        }

    }


    if (type) {

        where.push(
            "c.type=?"
        );

        args.push(
            String(type)
        );

    }


    if (tech) {

        where.push(
            "c.tech=? COLLATE NOCASE"
        );

        args.push(
            String(tech)
        );

    }


    const sql = `
        SELECT c.*
        FROM components c

        ${
            where.length
                ? "WHERE " +
                  where.join(" AND ")
                : ""
        }

        ORDER BY ${
            ORDER[sort] ||
            ORDER.name
        }
    `;


    return hydrate(
        db.prepare(sql)
            .all(...args)
    );

}


/* =========================================================
   COMPONENT INPUT VALIDATION
   ========================================================= */

function parseComponent(
    body = {}
) {

    const stringValue = (
        value,
        max
    ) =>
        (
            typeof value === "string"
                ? value.trim().slice(0, max)
                : ""
        );


    const component = {

        name:
            stringValue(
                body.name,
                120
            ),

        description:
            stringValue(
                body.description,
                2000
            ),

        type:
            body.type,

        tech:
            stringValue(
                body.tech ??
                body.language ??
                body.notation,
                60
            ),

        url:
            stringValue(
                body.url,
                300
            ),

        categoryId:
            Number(
                body.categoryId
            )

    };


    if (
        !component.name ||
        !component.description
    ) {

        throw bad(
            "name and description are required"
        );

    }


    if (
        ![
            "Code",
            "Design"
        ].includes(
            component.type
        )
    ) {

        throw bad(
            "type must be 'Code' or 'Design'"
        );

    }


    if (
        !catMap().has(
            component.categoryId
        )
    ) {

        throw bad(
            "unknown categoryId"
        );

    }


    if (
        component.url &&
        !/^https?:\/\//i.test(
            component.url
        )
    ) {

        throw bad(
            "url must start with http:// or https://"
        );

    }


    return component;

}


/* =========================================================
   KEYWORDS
   ========================================================= */

const parseKeywords =
    value => {

        const values =
            Array.isArray(value)
                ? value
                : String(
                    value ?? ""
                ).split(",");


        return [
            ...new Map(

                values
                    .map(
                        keyword =>
                            String(keyword)
                                .trim()
                                .slice(0, 40)
                    )
                    .filter(Boolean)
                    .map(
                        keyword => [
                            keyword.toLowerCase(),
                            keyword
                        ]
                    )

            ).values()

        ].slice(0, 20);

    };


const setKeywords =
    db.transaction(
        (
            componentId,
            words
        ) => {

            db.prepare(`
                DELETE FROM
                    component_keywords
                WHERE component_id=?
            `).run(componentId);


            for (
                const word of words
            ) {

                db.prepare(`
                    INSERT OR IGNORE INTO
                        keywords(word)
                    VALUES(?)
                `).run(word);


                const keyword =
                    db.prepare(`
                        SELECT id
                        FROM keywords
                        WHERE word=?
                    `).get(word);


                db.prepare(`
                    INSERT OR IGNORE INTO
                        component_keywords
                    VALUES(?,?)
                `).run(
                    componentId,
                    keyword.id
                );

            }

        }
    );


/* =========================================================
   404 COMPONENT
   ========================================================= */

const getOr404 =
    id => {

        const row =
            db.prepare(`
                SELECT *
                FROM components
                WHERE id=?
            `).get(
                Number(id)
            );


        if (!row) {

            throw bad(
                "Component not found",
                404
            );

        }


        return row;

    };


/* =========================================================
   CATEGORIES
   ========================================================= */

app.get(
    "/api/categories",
    wrap((_req, res) => {

        const map =
            catMap();


        res.json(
            [
                ...map.values()
            ].map(category => ({

                id:
                    category.id,

                name:
                    category.name,

                parentId:
                    category.parent_id,

                path:
                    pathOf(
                        map,
                        category.id
                    ),

                componentCount:
                    db.prepare(`
                        SELECT COUNT(*) AS n
                        FROM components
                        WHERE category_id
                            IN (
                                ${subtree(
                                    map,
                                    category.id
                                ).join()}
                            )
                    `).get().n

            }))
        );

    })
);


app.post(
    "/api/categories",
    allow("cataloguer"),

    wrap((req, res) => {

        const name =
            String(
                req.body?.name ?? ""
            )
                .trim()
                .slice(0, 60);


        const parent =
            req.body?.parentId ??
            null;


        if (!name) {

            throw bad(
                "name is required"
            );

        }


        if (
            parent !== null &&
            !catMap().has(
                Number(parent)
            )
        ) {

            throw bad(
                "unknown parentId"
            );

        }


        try {

            const id =
                db.prepare(`
                    INSERT INTO categories(
                        name,
                        parent_id
                    )
                    VALUES(?,?)
                `).run(
                    name,
                    parent === null
                        ? null
                        : Number(parent)
                ).lastInsertRowid;


            res.status(201).json({

                id,

                name,

                parentId:
                    parent

            });

        } catch (error) {

            throw (
                error.code ===
                "SQLITE_CONSTRAINT_UNIQUE"

                    ? bad(
                        "Category already exists",
                        409
                    )

                    : error
            );

        }

    })
);


app.delete(
    "/api/categories/:id",
    allow("cataloguer"),

    wrap((req, res) => {

        const id =
            Number(
                req.params.id
            );


        if (
            !catMap().has(id)
        ) {

            throw bad(
                "Category not found",
                404
            );

        }


        if (
            db.prepare(`
                SELECT 1
                FROM categories
                WHERE parent_id=?
            `).get(id)

            ||

            db.prepare(`
                SELECT 1
                FROM components
                WHERE category_id=?
            `).get(id)
        ) {

            throw bad(
                "Category is not empty",
                409
            );

        }


        db.prepare(`
            DELETE FROM categories
            WHERE id=?
        `).run(id);


        res.status(204).end();

    })
);


/* =========================================================
   COMPONENTS
   ========================================================= */

app.get(
    "/api/components",
    wrap((req, res) => {

        res.json(
            find(req.query)
        );

    })
);


app.get(
    "/api/components/:id",

    wrap((req, res) => {

        res.json(
            hydrate([
                getOr404(
                    req.params.id
                )
            ])[0]
        );

    })
);


app.post(
    "/api/components",
    allow("cataloguer"),

    wrap((req, res) => {

        const component =
            parseComponent(
                req.body
            );


        const keywords =
            parseKeywords(
                req.body.keywords
            );


        const id =
            db.transaction(() => {

                const result =
                    db.prepare(`
                        INSERT INTO components(
                            name,
                            description,
                            category_id,
                            type,
                            tech,
                            url,
                            created_by
                        )
                        VALUES(?,?,?,?,?,?,?)
                    `).run(
                        component.name,
                        component.description,
                        component.categoryId,
                        component.type,
                        component.tech,
                        component.url,
                        req.user.id
                    );


                const id =
                    result.lastInsertRowid;


                setKeywords(
                    id,
                    keywords
                );


                return id;

            })();


        res.status(201).json(
            hydrate([
                getOr404(id)
            ])[0]
        );

    })
);


app.put(
    "/api/components/:id/keywords",
    allow("cataloguer"),

    wrap((req, res) => {

        getOr404(
            req.params.id
        );


        setKeywords(
            Number(
                req.params.id
            ),
            parseKeywords(
                req.body?.keywords
            )
        );


        res.json(
            hydrate([
                getOr404(
                    req.params.id
                )
            ])[0]
        );

    })
);


app.delete(
    "/api/components/:id",
    allow(
        "cataloguer",
        "manager"
    ),

    wrap((req, res) => {

        getOr404(
            req.params.id
        );


        db.prepare(`
            DELETE FROM components
            WHERE id=?
        `).run(
            Number(
                req.params.id
            )
        );


        res.status(204).end();

    })
);


/* =========================================================
   SEARCH + USAGE
   ========================================================= */

app.get(
    "/api/search",

    wrap((req, res) => {

        const query =
            String(
                req.query.q ?? ""
            ).trim();


        if (!query) {

            return res.json({

                query: "",

                count: 0,

                results: []

            });

        }


        const results =
            find({
                q: query,
                sort: req.query.sort
            });


        db.transaction(() => {

            const update =
                db.prepare(`
                    UPDATE components
                    SET queried_not_used_count =
                        queried_not_used_count + 1
                    WHERE id=?
                `);


            results.forEach(
                result =>
                    update.run(
                        result.id
                    )
            );


            db.prepare(`
                INSERT INTO query_log(
                    user_id,
                    q,
                    result_count
                )
                VALUES(?,?,?)
            `).run(
                req.user.id,
                query.slice(0, 200),
                results.length
            );

        })();


        res.json({

            query,

            count:
                results.length,

            results

        });

    })
);


app.post(
    "/api/components/:id/use",

    wrap((req, res) => {

        getOr404(
            req.params.id
        );


        db.prepare(`
            UPDATE components

            SET
                used_count =
                    used_count + 1,

                queried_not_used_count =
                    MAX(
                        0,
                        queried_not_used_count - 1
                    )

            WHERE id=?
        `).run(
            Number(
                req.params.id
            )
        );


        res.json(
            hydrate([
                getOr404(
                    req.params.id
                )
            ])[0]
        );

    })
);


/* =========================================================
   STATISTICS
   ========================================================= */

app.get(
    "/api/stats",

    wrap((_req, res) => {

        const map =
            catMap();


        const totals =
            db.prepare(`
                SELECT

                    COUNT(*) AS components,

                    COALESCE(
                        SUM(used_count),
                        0
                    ) AS used,

                    COALESCE(
                        SUM(
                            queried_not_used_count
                        ),
                        0
                    ) AS notUsed

                FROM components
            `).get();


        const topCategories =
            [
                ...map.values()
            ]
                .filter(
                    category =>
                        !category.parent_id
                );


        res.json({

            ...totals,

            categories:
                topCategories.length,

            byCategory:
                topCategories.map(
                    category => ({

                        id:
                            category.id,

                        name:
                            category.name,

                        count:
                            db.prepare(`
                                SELECT COUNT(*) AS n
                                FROM components
                                WHERE category_id
                                    IN (
                                        ${subtree(
                                            map,
                                            category.id
                                        ).join()}
                                    )
                            `).get().n

                    })
                ),

            mostUsed:
                hydrate(
                    db.prepare(`
                        SELECT *
                        FROM components
                        ORDER BY
                            used_count DESC,
                            name
                        LIMIT 5
                    `).all()
                )

        });

    })
);


app.get(
    "/api/stats/purge-candidates",

    allow("manager"),

    wrap((req, res) => {

        const threshold =
            Number(
                req.query.threshold ??
                15
            );


        if (
            !Number.isFinite(threshold) ||
            threshold < 1
        ) {

            throw bad(
                "threshold must be a positive number"
            );

        }


        res.json(
            hydrate(
                db.prepare(`
                    SELECT *
                    FROM components
                    WHERE used_count<?
                    ORDER BY
                        used_count,
                        name
                `).all(threshold)
            )
        );

    })
);


/* =========================================================
   ERRORS
   ========================================================= */

app.use(
    "/api",
    (_req, _res, next) =>
        next(
            bad(
                "Not found",
                404
            )
        )
);


app.use(
    (
        error,
        _req,
        res,
        _next
    ) => {

        if (!error.status) {
            console.error(error);
        }


        res.status(
            error.status || 500
        ).json({

            error:
                error.status
                    ? error.message
                    : "Internal server error"

        });

    }
);


/* =========================================================
   START SERVER
   ========================================================= */

if (
    require.main === module
) {

    app.listen(
        process.env.PORT || 3000,
        () => {

            console.log(
                `ComponentHub API on :${
                    process.env.PORT || 3000
                }`
            );

        }
    );

}


module.exports = app;
