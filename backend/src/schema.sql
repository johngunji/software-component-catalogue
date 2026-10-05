-- ComponentHub schema (SQLite).
-- Roles follow the problem statement: a "user" queries and uses
-- components, a "cataloguer" maintains the catalogue.

CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL
        CHECK(role IN ('user','cataloguer'))
);

-- Hierarchical classification: a category may have a parent.
CREATE TABLE IF NOT EXISTS categories(
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id INTEGER
        REFERENCES categories(id)
        ON DELETE RESTRICT,
    UNIQUE(parent_id, name)
);

-- A reusable component is either Code (tech = programming language)
-- or Design (tech = design notation such as UML, ERD, DFD).
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

-- Reuse information: a set of key words per component.
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

-- One row per search made by a user.
CREATE TABLE IF NOT EXISTS query_log(
    id INTEGER PRIMARY KEY,
    user_id INTEGER
        REFERENCES users(id),
    q TEXT NOT NULL,
    result_count INTEGER NOT NULL,
    at TEXT NOT NULL
        DEFAULT (datetime('now'))
);

-- Which components came up in which query, and whether that query
-- led to the component being used. used = 0 means "came up in a
-- query but was not used".
CREATE TABLE IF NOT EXISTS query_results(
    query_id INTEGER NOT NULL
        REFERENCES query_log(id)
        ON DELETE CASCADE,
    component_id INTEGER NOT NULL
        REFERENCES components(id)
        ON DELETE CASCADE,
    used INTEGER NOT NULL DEFAULT 0
        CHECK(used IN (0,1)),
    PRIMARY KEY(query_id, component_id)
);

-- One row per counted use of a component.
CREATE TABLE IF NOT EXISTS usage_events(
    id INTEGER PRIMARY KEY,
    component_id INTEGER NOT NULL
        REFERENCES components(id)
        ON DELETE CASCADE,
    user_id INTEGER
        REFERENCES users(id),
    query_id INTEGER
        REFERENCES query_log(id)
        ON DELETE SET NULL,
    at TEXT NOT NULL
        DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_components_category
ON components(category_id);

CREATE INDEX IF NOT EXISTS idx_components_used
ON components(used_count);

CREATE INDEX IF NOT EXISTS idx_components_type_tech
ON components(type, tech);

CREATE INDEX IF NOT EXISTS idx_query_log_lookup
ON query_log(user_id, at);

CREATE INDEX IF NOT EXISTS idx_usage_events_lookup
ON usage_events(component_id, user_id, at);
