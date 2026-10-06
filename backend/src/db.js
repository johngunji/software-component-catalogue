/* SQLite schema + first-run seed.
   Password hashing uses Node's built-in scrypt.
*/

const Database = require("better-sqlite3");
const crypto = require("crypto");
const { seedCatalogue } = require("./catalogue-seed");

const db = new Database(
    process.env.DB_PATH || "componenthub.db"
);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL
        CHECK(role IN ('user','cataloguer'))
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

CREATE INDEX IF NOT EXISTS idx_components_category
ON components(category_id);

CREATE INDEX IF NOT EXISTS idx_components_used
ON components(used_count);
`);

try {
    db.exec("ALTER TABLE users ADD COLUMN email TEXT");
} catch (error) {
    if (!String(error.message).includes("duplicate column name")) {
        throw error;
    }
}

db.exec(`
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
ON users(email)
WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS pending_signups(
    id INTEGER PRIMARY KEY,
    signup_token_hash TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    otp_expires_at INTEGER NOT NULL,
    otp_attempts INTEGER NOT NULL DEFAULT 0,
    last_sent_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_signups_username
ON pending_signups(username);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_signups_email
ON pending_signups(email);

CREATE TABLE IF NOT EXISTS password_resets(
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,
    email TEXT NOT NULL,
    reset_token_hash TEXT UNIQUE NOT NULL,
    otp_hash TEXT NOT NULL,
    otp_expires_at INTEGER NOT NULL,
    otp_attempts INTEGER NOT NULL DEFAULT 0,
    last_sent_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_password_resets_user
ON password_resets(user_id);

CREATE INDEX IF NOT EXISTS idx_password_resets_email
ON password_resets(email);
`);

const hashPassword = password => {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}$${hash}`;
};

const verifyPassword = (password, stored) => {
    const [salt, hash] = stored.split("$");
    const a = Buffer.from(hash, "hex");
    const b = crypto.scryptSync(password, salt, 64);

    return (
        a.length === b.length &&
        crypto.timingSafeEqual(a, b)
    );
};

if (!db.prepare("SELECT 1 FROM users LIMIT 1").get()) {
    db.transaction(() => {
        const fallback = process.env.SEED_PASSWORD;
        if (!fallback && process.env.NODE_ENV !== "development") {
            throw new Error("Set SEED_PASSWORD (or NODE_ENV=development locally)");
        }

        for (const role of ["user", "cataloguer"]) {
            const password =
                process.env[`SEED_${role.toUpperCase()}_PASSWORD`] ||
                fallback ||
                "changeme123";

            db.prepare(`
                INSERT INTO users(username, password_hash, role)
                VALUES(?,?,?)
            `).run(role, hashPassword(password), role);
        }

        const cataloguer = db.prepare(`
            SELECT id FROM users WHERE username = 'cataloguer'
        `).get();

        seedCatalogue(db, cataloguer.id);
    })();
}

module.exports = {
    db,
    hashPassword,
    verifyPassword
};
