# API reference

Base URL: `http://localhost:3000/api`. All routes except
`/auth/login` need `Authorization: Bearer <token>`.

Roles: **user** (U) and **cataloguer** (C). Routes marked C return
`403` for a user.

## Authentication

| Method | Path          | Role | Body                   | Result                                              |
| ------ | ------------- | ---- | ---------------------- | --------------------------------------------------- |
| POST   | `/auth/login` | –    | `{username, password}` | `{token, user}`                                     |
| GET    | `/me`         | U C  |                        | token payload                                       |
| GET    | `/meta`       | U C  |                        | `{languages, notations}` used by the add/edit forms |

## Categories (hierarchy)

| Method | Path              | Role | Notes                                                                                |
| ------ | ----------------- | ---- | ------------------------------------------------------------------------------------ |
| GET    | `/categories`     | U C  | flat list: `id, name, parentId, path, componentCount` (count includes subcategories) |
| POST   | `/categories`     | C    | `{name, parentId?}`; `409` if a sibling has the same name                            |
| PUT    | `/categories/:id` | C    | `{name?, parentId?}` rename and/or move; `400` if moved below itself                 |
| DELETE | `/categories/:id` | C    | `409` unless the category has no subcategories and no components                     |

## Components

| Method | Path                       | Role | Notes                                                                                                                                                                                                                                                                 |
| ------ | -------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/components`              | U C  | browse, paged. Query: `category` (includes subcategories), `type`, `tech`, `q`, `sort` (`name`,`usage`,`new`,`relevance`), `match` (`all`,`any`), `page`, `limit` (max 50, default 12). Returns `{items, total, page, pageSize, pages}`. **Not recorded as a query.** |
| GET    | `/components/:id`          | U C  |                                                                                                                                                                                                                                                                       |
| POST   | `/components`              | C    | `{name, description, categoryId, type: "Code"\|"Design", tech, keywords[], url?}`. `tech` is the language (Code) or notation (Design) and is required. `409` for a duplicate name + tech in a category.                                                               |
| PUT    | `/components/:id`          | C    | same body as POST                                                                                                                                                                                                                                                     |
| PUT    | `/components/:id/keywords` | C    | `{keywords: []}`                                                                                                                                                                                                                                                      |
| DELETE | `/components/:id`          | C    |                                                                                                                                                                                                                                                                       |
| POST   | `/components/purge`        | C    | `{ids: []}` (1 to 200) returns `{deleted}`                                                                                                                                                                                                                            |

## Search and usage

| Method | Path                  | Role | Notes                                                                                                                                                                                                                                                                                            |
| ------ | --------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/search`             | U C  | `q` (key words), `match`, `type`, `tech`, `category`, `sort`, `page`, `limit` (default 20). Matches whole word prefixes, ranks key word (5) > name (4) > language/notation/type/category (2) > description (1). **Recorded as a query.** Returns `{query, queryId, total, page, pages, results}` |
| POST   | `/components/:id/use` | U C  | `{queryId?}` returns `{component, counted}`                                                                                                                                                                                                                                                      |

Rules for the two counters are described in `backend/README.md`.

## Statistics and reports

| Method | Path                      | Role | Notes                                                                                |
| ------ | ------------------------- | ---- | ------------------------------------------------------------------------------------ |
| GET    | `/stats`                  | U C  | totals, `byType`, `byCategory` (top level), `mostUsed`, `mostShownNotUsed`, `recent` |
| GET    | `/stats/queries`          | C    | top searches and searches with no results                                            |
| GET    | `/stats/purge-candidates` | C    | `minShown`, `maxUsed`, `minAgeDays` returns `{criteria, count, items}`               |
