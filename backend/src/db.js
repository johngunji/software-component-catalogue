/* SQLite connection, schema creation and first-run seed.
   Password hashing uses Node's built-in scrypt.
*/

const Database = require('better-sqlite3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {seedCatalogue} = require('./catalogue-seed');

const db = new Database(process.env.DB_PATH || 'componenthub.db');

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/* Older databases allowed the roles student/cataloguer/manager.
   The problem statement only has "user" and "cataloguer", so those
   rows are converted once (student -> user, manager -> cataloguer). */
const usersTable = db
    .prepare(
        `
    SELECT sql FROM sqlite_master
    WHERE type = 'table' AND name = 'users'
`,
    )
    .get();

if (usersTable && usersTable.sql.includes("'manager'")) {
    db.pragma('foreign_keys = OFF');
    db.transaction(() => {
        db.exec(`
            CREATE TABLE users_new(
                id INTEGER PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL
                    CHECK(role IN ('user','cataloguer'))
            );
            INSERT INTO users_new(id, username, password_hash, role)
                SELECT id, username, password_hash,
                    CASE role WHEN 'student' THEN 'user'
                              ELSE 'cataloguer' END
                FROM users;
            DROP TABLE users;
            ALTER TABLE users_new RENAME TO users;
        `);
    })();
    db.pragma('foreign_keys = ON');
}

db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}$${hash}`;
};

const verifyPassword = (password, stored) => {
    const [salt, hash] = stored.split('$');
    const a = Buffer.from(hash, 'hex');
    const b = crypto.scryptSync(password, salt, 64);

    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

if (!db.prepare('SELECT 1 FROM users LIMIT 1').get()) {
    db.transaction(() => {
        const fallback = process.env.SEED_PASSWORD;
        if (!fallback && process.env.NODE_ENV !== 'development') {
            throw new Error(
                'Set SEED_PASSWORD (or NODE_ENV=development locally)',
            );
        }

        for (const role of ['user', 'cataloguer']) {
            const password =
                process.env[`SEED_${role.toUpperCase()}_PASSWORD`] ||
                fallback ||
                'changeme123';

            db.prepare(
                `
                INSERT INTO users(username, password_hash, role)
                VALUES(?,?,?)
            `,
            ).run(role, hashPassword(password), role);
        }

        const cataloguer = db
            .prepare(
                `
            SELECT id FROM users WHERE username = 'cataloguer'
        `,
            )
            .get();

        seedCatalogue(db, cataloguer.id);
    })();
}

module.exports = {
    db,
    hashPassword,
    verifyPassword,
};
