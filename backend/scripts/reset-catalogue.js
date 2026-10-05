require("dotenv").config();

if (!process.argv.includes("--confirm")) {
    console.error("Refusing to reset catalogue without --confirm.");
    console.error("Usage: npm run reset-catalogue -- --confirm");
    process.exit(1);
}

const { db } = require("../src/db");
const { seedCatalogue } = require("../src/catalogue-seed");

db.pragma("foreign_keys = ON");

const count = table =>
    db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;

try {
    console.log("Before reset:");
    console.log(`components: ${count("components")}`);
    console.log(`categories: ${count("categories")}`);
    console.log(`users: ${count("users")}`);

    const reset = db.transaction(() => {
        const cataloguer = db.prepare(`
            SELECT id FROM users WHERE username = 'cataloguer'
        `).get();

        if (!cataloguer) {
            throw new Error("Existing cataloguer user was not found.");
        }

        db.prepare("DELETE FROM query_log").run();
        db.prepare("DELETE FROM component_keywords").run();
        db.prepare("DELETE FROM components").run();
        db.prepare("DELETE FROM keywords").run();
        const findLeaf = db.prepare(`
            SELECT c.id
            FROM categories c
            WHERE NOT EXISTS (
                SELECT 1
                FROM categories child
                WHERE child.parent_id = c.id
            )
            LIMIT 1
        `);
        const deleteCategory = db.prepare(
            "DELETE FROM categories WHERE id = ?"
        );

        let leaf;
        while ((leaf = findLeaf.get())) {
            deleteCategory.run(leaf.id);
        }

        seedCatalogue(db, cataloguer.id);
    });

    reset();

    console.log("After reset:");
    console.log(`components: ${count("components")}`);
    console.log(`categories: ${count("categories")}`);
    console.log(`users: ${count("users")}`);
    console.log(
        `components with non-empty URLs: ${
            db.prepare(`
                SELECT COUNT(*) AS count
                FROM components
                WHERE trim(url) <> ''
            `).get().count
        }`
    );
} catch (error) {
    console.error("Catalogue reset failed:", error.message);
    process.exitCode = 1;
} finally {
    db.close();
}
