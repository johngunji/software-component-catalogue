# ComponentHub backend

REST API for the software component catalogue
(Node.js + Express + SQLite).

## Run

```bash
cd backend
cp .env.example .env      # NODE_ENV=development gives a dev JWT secret
npm install
npm start                 # http://localhost:3000
npm test                  # API tests (in-memory database)
```

On the first start the database `componenthub.db` is created from
`src/schema.sql` and filled with the demo catalogue
(`src/catalogue-seed.js`: 67 components, 49 categories, usage figures
and search history).

Accounts (password `changeme123` in development, or the
`SEED_*_PASSWORD` values from `.env`):

| Username     | Role       | Can do                                                                                                                   |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `user`       | user       | search, browse, view, use components                                                                                     |
| `cataloguer` | cataloguer | everything a user can, plus add / edit / delete components, edit key words, manage categories, read usage reports, purge |

To reload the demo data into an existing database:

```bash
npm run reset-catalogue -- --confirm
```

Databases created by the previous version (roles student / manager)
are converted automatically on start: student becomes user, manager
becomes cataloguer.

## Database

SQLite was kept deliberately: the data is relational (a category tree,
components, a many-to-many key word table) and the usage counters need
transactions. It also needs no separate server for the viva.

Tables: `users`, `categories`, `components`, `keywords`,
`component_keywords`, `query_log`, `query_results`, `usage_events`.

## Usage tracking

`components.used_count` and `components.queried_not_used_count` are
maintained as follows:

1. A search records which components it returned (`query_results`).
   Each component returned for a new query adds 1 to
   `queried_not_used_count`.
2. Repeating the same search within 60 seconds (reload, double submit)
   is the same query and is not counted again.
3. `POST /api/components/:id/use` adds 1 to `used_count`. If the
   request carries the `queryId` of the search the component came
   from, that search result is marked as used and
   `queried_not_used_count` goes down by 1 again. A use without a
   search (for example while browsing) only raises `used_count`.
4. The same user using the same component twice within
   `USE_DEDUPE_SECONDS` (default 30) is counted once.

## Purge rule

`GET /api/stats/purge-candidates` lists components that

- came up in at least `minShown` queries without being used (default 5),
- were used at most `maxUsed` times (default 2), and
- have been in the catalogue at least `minAgeDays` days (default 30),

so a component that was only just added is never proposed.
`POST /api/components/purge` removes the components the cataloguer
selected.

See `../docs/API.md` for all endpoints.
