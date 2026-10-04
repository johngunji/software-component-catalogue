/* SQLite schema + first-run seed.
   Password hashing uses Node's built-in scrypt.
*/

const Database = require("better-sqlite3");
const crypto = require("crypto");

const db = new Database(
    process.env.DB_PATH || "componenthub.db"
);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");


/* =========================================================
   DATABASE SCHEMA
   ========================================================= */

db.exec(`
CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL
        CHECK(role IN ('student','cataloguer','manager'))
);


CREATE TABLE IF NOT EXISTS categories(
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id INTEGER
        REFERENCES categories(id)
        ON DELETE RESTRICT,

    UNIQUE(parent_id, name)
);


CREATE TABLE IF NOT EXISTS components(
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,

    category_id INTEGER NOT NULL
        REFERENCES categories(id)
        ON DELETE RESTRICT,

    type TEXT NOT NULL
        CHECK(type IN ('Code','Design')),

    tech TEXT NOT NULL DEFAULT '',

    /* language for Code, notation for Design */

    url TEXT NOT NULL DEFAULT '',

    used_count INTEGER NOT NULL DEFAULT 0,

    queried_not_used_count INTEGER NOT NULL DEFAULT 0,

    added_on TEXT NOT NULL
        DEFAULT (date('now')),

    created_by INTEGER
        REFERENCES users(id)
);


CREATE TABLE IF NOT EXISTS keywords(
    id INTEGER PRIMARY KEY,
    word TEXT UNIQUE NOT NULL
        COLLATE NOCASE
);


CREATE TABLE IF NOT EXISTS component_keywords(
    component_id INTEGER NOT NULL
        REFERENCES components(id)
        ON DELETE CASCADE,

    keyword_id INTEGER NOT NULL
        REFERENCES keywords(id),

    PRIMARY KEY(component_id, keyword_id)
);


CREATE TABLE IF NOT EXISTS query_log(
    id INTEGER PRIMARY KEY,

    user_id INTEGER
        REFERENCES users(id),

    q TEXT NOT NULL,

    result_count INTEGER NOT NULL,

    at TEXT NOT NULL
        DEFAULT (datetime('now'))
);


CREATE INDEX IF NOT EXISTS
    idx_components_category
ON components(category_id);


CREATE INDEX IF NOT EXISTS
    idx_components_used
ON components(used_count);
`);


/* =========================================================
   PASSWORD HASHING
   ========================================================= */

const hashPassword = password => {

    const salt =
        crypto.randomBytes(16).toString("hex");

    const hash =
        crypto.scryptSync(
            password,
            salt,
            64
        ).toString("hex");

    return `${salt}$${hash}`;
};


const verifyPassword = (
    password,
    stored
) => {

    const [salt, hash] =
        stored.split("$");

    const a =
        Buffer.from(hash, "hex");

    const b =
        crypto.scryptSync(
            password,
            salt,
            64
        );

    return (
        a.length === b.length &&
        crypto.timingSafeEqual(a, b)
    );
};


/* =========================================================
   FIRST-RUN SEED
   ========================================================= */

if (
    !db.prepare(
        "SELECT 1 FROM users LIMIT 1"
    ).get()
) {

    db.transaction(() => {

        const fallback = process.env.SEED_PASSWORD;
        if (!fallback && process.env.NODE_ENV !== "development") {
            throw new Error("Set SEED_PASSWORD (or NODE_ENV=development locally)");
        }

        for (const role of ["student", "cataloguer", "manager"]) {
            const password =
                process.env[`SEED_${role.toUpperCase()}_PASSWORD`] ||
                fallback ||
                "changeme123";

            db.prepare(`
                INSERT INTO users(
                    username,
                    password_hash,
                    role
                )
                VALUES(?,?,?)
            `).run(role, hashPassword(password), role);

        }


        /* ---------- categories ---------- */

        const categories = [

            [1, "Frontend", null],
            [2, "Forms", 1],
            [3, "Navigation", 1],

            [4, "Authentication", null],

            [5, "Database", null],

            [6, "API & Integration", null],

            [7, "Utilities", null],
            [8, "File Handling", 7]

        ];


        for (
            const [id, name, parent] of categories
        ) {

            db.prepare(`
                INSERT INTO categories(
                    id,
                    name,
                    parent_id
                )
                VALUES(?,?,?)
            `).run(
                id,
                name,
                parent
            );

        }


        /* ---------- components ---------- */

        const components = [

            [
                "JWT Authentication",
                "Reusable JWT-based authentication module for securing web applications.",
                4,
                "Code",
                "Python",
                ["JWT", "Auth", "Security"],
                24,
                8,
                "2026-08-01"
            ],

            [
                "Login Form",
                "Responsive login form component with email and password fields.",
                2,
                "Code",
                "JavaScript",
                ["Login", "Form", "UI"],
                18,
                7,
                "2026-07-28"
            ],

            [
                "MySQL CRUD Module",
                "Reusable module for performing common CRUD operations with MySQL.",
                5,
                "Code",
                "Python",
                ["MySQL", "CRUD", "Database"],
                31,
                10,
                "2026-07-25"
            ],

            [
                "REST API Client",
                "Utility for communicating with REST APIs using HTTP requests.",
                6,
                "Code",
                "Python",
                ["REST", "API", "HTTP"],
                16,
                6,
                "2026-07-22"
            ],

            [
                "Navigation Bar",
                "Responsive navigation bar suitable for modern web applications.",
                3,
                "Code",
                "JavaScript",
                ["Navbar", "Navigation", "UI"],
                27,
                9,
                "2026-08-05"
            ],

            [
                "Password Hashing",
                "Reusable password hashing and verification utility.",
                4,
                "Code",
                "Python",
                ["Password", "Hash", "Security"],
                22,
                8,
                "2026-08-06"
            ],

            [
                "Database ER Diagram",
                "Reusable entity relationship diagram template for database design.",
                5,
                "Design",
                "ERD",
                ["ER", "Database", "Design"],
                11,
                7,
                "2026-07-20"
            ],

            [
                "File Upload Handler",
                "Backend utility for validating and processing uploaded files.",
                8,
                "Code",
                "Python",
                ["File", "Upload", "Validation"],
                14,
                6,
                "2026-07-18"
            ],

            [
                "Search Bar",
                "Reusable search input component with responsive styling.",
                1,
                "Code",
                "JavaScript",
                ["Search", "UI", "Input"],
                35,
                12,
                "2026-08-09"
            ],

            [
                "API Error Handler",
                "Standardised error handling utility for REST API responses.",
                6,
                "Code",
                "Python",
                ["API", "Error", "REST"],
                19,
                8,
                "2026-08-10"
            ],

            [
                "Pagination Utility",
                "Reusable pagination logic for displaying large datasets.",
                7,
                "Code",
                "Python",
                ["Pagination", "Utility", "Data"],
                12,
                7,
                "2026-07-15"
            ],

            [
                "Class Diagram Template",
                "Reusable UML class diagram structure for software design.",
                7,
                "Design",
                "UML",
                ["UML", "Class", "Design"],
                9,
                8,
                "2026-07-12"
            ]

        ];


        for (
            const [
                name,
                description,
                categoryId,
                type,
                tech,
                keywords,
                used,
                queriedNotUsed,
                addedOn
            ] of components
        ) {

            const id =
                db.prepare(`
                    INSERT INTO components(
                        name,
                        description,
                        category_id,
                        type,
                        tech,
                        used_count,
                        queried_not_used_count,
                        added_on
                    )
                    VALUES(?,?,?,?,?,?,?,?)
                `).run(
                    name,
                    description,
                    categoryId,
                    type,
                    tech,
                    used,
                    queriedNotUsed,
                    addedOn
                ).lastInsertRowid;


            for (const word of keywords) {

                db.prepare(`
                    INSERT OR IGNORE INTO keywords(word)
                    VALUES(?)
                `).run(word);


                const keyword =
                    db.prepare(`
                        SELECT id
                        FROM keywords
                        WHERE word=?
                    `).get(word);


                db.prepare(`
                    INSERT INTO component_keywords
                    VALUES(?,?)
                `).run(
                    id,
                    keyword.id
                );

            }

        }

    })();

}


/* =========================================================
   EXPORTS
   ========================================================= */

module.exports = {
    db,
    hashPassword,
    verifyPassword
};
