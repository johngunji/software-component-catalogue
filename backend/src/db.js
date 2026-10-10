/* SQLite schema + first-run seed.
   Password hashing uses Node's built-in scrypt.
*/

const Database = require("better-sqlite3");
const crypto = require("crypto");
const {
    seedCatalogue,
    seedErdArtifacts,
    seedDesignArtifact,
    erdVariants,
    erdSvg,
    erdDrawio,
    getDesignArtifactFiles,
    designArtifacts,
    designVariantProfiles,
    applyDesignVariant,
    getDesignVariantReplacements,
    components
} = require("./catalogue-seed");

const path = require("path");
const fs = require("fs");

const resolveDbPath = () => {
    return process.env.DB_PATH
        ? path.resolve(process.cwd(), process.env.DB_PATH)
        : (fs.existsSync(path.resolve(__dirname, "../componenthub.db"))
            ? path.resolve(__dirname, "../componenthub.db")
            : (fs.existsSync(path.resolve(__dirname, "../../componenthub.db"))
                ? path.resolve(__dirname, "../../componenthub.db")
                : path.resolve(__dirname, "../componenthub.db")));
};

const initSchema = (database) => {
    database.pragma("journal_mode = WAL");
    database.pragma("foreign_keys = ON");

    database.exec(`
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
    artifact_format TEXT NOT NULL DEFAULT '',
    artifact_content TEXT NOT NULL DEFAULT '',
    usage_notes TEXT NOT NULL DEFAULT '',
    example_content TEXT NOT NULL DEFAULT '',
    delivery_method TEXT NOT NULL DEFAULT '',
    reuse_method TEXT NOT NULL DEFAULT '',
    install_command TEXT NOT NULL DEFAULT '',
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

CREATE TABLE IF NOT EXISTS component_artifacts(
    id INTEGER PRIMARY KEY,
    component_id INTEGER NOT NULL
        REFERENCES components(id)
        ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    variant_type TEXT NOT NULL,
    delivery_method TEXT NOT NULL,
    artifact_format TEXT NOT NULL,
    content TEXT NOT NULL,
    binary_content BLOB,
    content_type TEXT NOT NULL DEFAULT 'text/plain',
    download_filename TEXT NOT NULL,
    reuse_method TEXT NOT NULL DEFAULT '',
    is_primary INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
`);

    for (const column of [
        ["tech", "TEXT NOT NULL DEFAULT ''"],
        ["url", "TEXT NOT NULL DEFAULT ''"],
        ["artifact_format", "TEXT NOT NULL DEFAULT ''"],
        ["artifact_content", "TEXT NOT NULL DEFAULT ''"],
        ["usage_notes", "TEXT NOT NULL DEFAULT ''"],
        ["example_content", "TEXT NOT NULL DEFAULT ''"],
        ["delivery_method", "TEXT NOT NULL DEFAULT ''"],
        ["reuse_method", "TEXT NOT NULL DEFAULT ''"],
        ["install_command", "TEXT NOT NULL DEFAULT ''"],
        ["used_count", "INTEGER NOT NULL DEFAULT 0"],
        ["queried_not_used_count", "INTEGER NOT NULL DEFAULT 0"],
        ["added_on", "TEXT NOT NULL DEFAULT ''"],
        ["created_by", "INTEGER"]
    ]) {
        try {
            database.exec(`ALTER TABLE components ADD COLUMN ${column[0]} ${column[1]}`);
        } catch (error) {
            if (!String(error.message).includes("duplicate column name")) {
                throw error;
            }
        }
    }

    for (const column of [
        ["description", "TEXT NOT NULL DEFAULT ''"],
        ["reuse_method", "TEXT NOT NULL DEFAULT ''"],
        ["is_primary", "INTEGER NOT NULL DEFAULT 0"],
        ["sort_order", "INTEGER NOT NULL DEFAULT 0"],
        ["created_at", "TEXT NOT NULL DEFAULT ''"],
        ["binary_content", "BLOB"],
        ["content_type", "TEXT NOT NULL DEFAULT 'text/plain'"]
    ]) {
        try {
            database.exec(`ALTER TABLE component_artifacts ADD COLUMN ${column[0]} ${column[1]}`);
        } catch (error) {
            if (!String(error.message).includes("duplicate column name")) {
                throw error;
            }
        }
    }

    try {
        database.exec("ALTER TABLE users ADD COLUMN email TEXT");
    } catch (error) {
        if (!String(error.message).includes("duplicate column name")) {
            throw error;
        }
    }

    database.exec(`
CREATE INDEX IF NOT EXISTS idx_components_category
ON components(category_id);

CREATE INDEX IF NOT EXISTS idx_components_used
ON components(used_count);

CREATE INDEX IF NOT EXISTS idx_component_artifacts_component
ON component_artifacts(component_id, sort_order, id);

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
};

const hashPassword = password => {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}$${hash}`;
};

// Verify a plaintext password against a stored scrypt password record.
const verifyPassword = (password, stored) => {
    const [salt, hash] = stored.split("$");
    const a = Buffer.from(hash, "hex");
    const b = crypto.scryptSync(password, salt, 64);

    return (
        a.length === b.length &&
        crypto.timingSafeEqual(a, b)
    );
};

const initDatabase = (database, options = {}) => {
    initSchema(database);

    if (!database.prepare("SELECT 1 FROM users LIMIT 1").get()) {
        database.transaction(() => {
            const fallback = process.env.SEED_PASSWORD || options.seedPassword;
            if (!fallback && process.env.NODE_ENV !== "development") {
                throw new Error("Set SEED_PASSWORD (or NODE_ENV=development locally)");
            }

            for (const role of ["user", "cataloguer"]) {
                const password =
                    process.env[`SEED_${role.toUpperCase()}_PASSWORD`] ||
                    fallback ||
                    "changeme123";

                database.prepare(`
                    INSERT INTO users(username, password_hash, role)
                    VALUES(?,?,?)
                `).run(role, hashPassword(password), role);
            }

            const cataloguer = database.prepare(`
                SELECT id FROM users WHERE username = 'cataloguer'
            `).get();

            seedCatalogue(database, cataloguer.id);
        })();
    }

    const erd = database.prepare(`
        SELECT id
        FROM components
        WHERE name = 'Entity Relationship Diagram Template'
    `).get();

    if (erd && !database.prepare(`
        SELECT 1 FROM component_artifacts WHERE component_id=? LIMIT 1
    `).get(erd.id)) {
        seedErdArtifacts(database, erd.id);
    }

    // Seed design artifacts only when a component has none.
    // Never overwrite existing artifact content during normal startup.
    for (const component of components.filter(
        item => item.type === "Design" &&
            item.name !== "Entity Relationship Diagram Template"
    )) {
        const row = database.prepare(
            "SELECT id FROM components WHERE name=?"
        ).get(component.name);

        if (row) {
            const hasArtifacts = database.prepare(
                "SELECT 1 FROM component_artifacts WHERE component_id=? LIMIT 1"
            ).get(row.id);

            if (!hasArtifacts) {
                seedDesignArtifact(database, row.id, component);
            }
        }
    }

    if (erd) {
        database.prepare(`
            UPDATE components
            SET url='https://mermaid.js.org/syntax/entityRelationshipDiagram.html'
            WHERE id=? AND url='https://github.com/jgraph/drawio'
        `).run(erd.id);

        database.prepare(`
            UPDATE components
            SET url=''
            WHERE type='Design' AND url='https://github.com/jgraph/drawio'
        `).run();
    }
};

const resolvedDbPath = resolveDbPath();
const db = new Database(resolvedDbPath);
initDatabase(db);

module.exports = {
    db,
    hashPassword,
    verifyPassword,
    initDatabase,
    initSchema,
    resolveDbPath
};
