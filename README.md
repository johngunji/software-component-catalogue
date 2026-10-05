# Software Component Catalogue

ComponentHub is a web application for cataloguing, searching, browsing, and
tracking reusable software and design components.

## Features

- User and cataloguer roles with JWT authentication
- Component creation, editing, viewing, and deletion
- Keyword-based search with ranked results
- Code and design component types
- Hierarchical categories
- Usage and search-result tracking
- Statistics and purge candidates for unused components
- Server-side pagination for component lists and searches

## Technology

- Frontend: HTML, CSS, and JavaScript
- Backend: Node.js, Express, and SQLite
- Authentication: JSON Web Tokens
- Password hashing: Node.js `scrypt`

## Project structure

```text
frontend/       Static frontend pages, styles, and API client
backend/        Express API, SQLite schema, seed data, and scripts
tests/          Backend API tests
docs/           API, requirements, and demonstration documentation
render.yaml     Render deployment blueprint
```

## Run locally

Requirements: Node.js 20.20.2 or compatible.

```bash
cd backend
cp .env.example .env
npm install
npm start
```

The API runs at `http://localhost:3000`.

Serve the `frontend/` directory with a static web server, such as VS Code
Live Server, at `http://localhost:5500`. The development CORS setting in
`backend/.env.example` is configured for that URL.

For development, the default account password is `changeme123` unless
overridden in `.env`:

| Username     | Role                                                                        |
| ------------ | --------------------------------------------------------------------------- |
| `user`       | Search, browse, view, and use components                                    |
| `cataloguer` | All user actions plus catalogue, category, statistics, and purge management |

## Test

Run the complete backend API test suite from the `backend/` directory:

```bash
cd backend
npm test
```

The suite uses an in-memory SQLite database and covers authentication, role
permissions, component management, categories, search, usage tracking, and
statistics.

## Render deployment

The [Render blueprint](./render.yaml) creates:

- `componenthub-backend`: Node.js web service
- `componenthub-frontend`: Render static site

The backend stores SQLite on a Render persistent disk at
`/var/data/componenthub.db`.

Set these secret environment variables in Render:

```text
JWT_SECRET
SEED_USER_PASSWORD
SEED_CATALOGUER_PASSWORD
```

The default service URLs are:

```text
https://componenthub-backend.onrender.com
https://componenthub-frontend.onrender.com
```

If the Render service names change, update `CORS_ORIGIN` on the backend and
the production API URL in `frontend/js/catalogue.js`.

## Documentation

- [Backend setup and deployment](./backend/README.md)
- [API reference](./docs/API.md)
- [Requirements mapping](./docs/REQUIREMENTS.md)
- [Demo walkthrough](./docs/DEMO.md)
