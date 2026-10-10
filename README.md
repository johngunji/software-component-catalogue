# ComponentHub

ComponentHub is a web application for cataloguing reusable software
Components. A Component can be either:

- **Code**, with a programming language or technology
- **Design**, with a design notation such as UML, ERD, or C4

Components are stored in hierarchical categories and can be found by name,
description, technology, category, or keywords. The catalogue records both
successful reuse and search results that were not subsequently used.

Design components can contain multiple reusable variants and artifacts. Text
artifacts such as Mermaid, PlantUML, Markdown, and Draw.io XML are stored in
SQLite and can be copied or downloaded directly. Each artifact has its own
format, filename, delivery method, and reuse guidance; downloading an artifact
records one component reuse event.

## Roles

The application has two roles:

| Role | Permissions |
| --- | --- |
| `user` | Sign in, browse categories, search the catalogue, view components, and mark a component as used |
| `cataloguer` | All user permissions, plus add, edit, delete, and keyword-manage components; create and delete empty categories; view purge candidates |

## Demo login

When the backend creates a new database in development mode without custom
password variables, the seeded accounts use the fallback password below:

| Username | Password | Role |
| --- | --- | --- |
| `user` | `changeme123` | User |
| `cataloguer` | `changeme123` | Cataloguer |

For a non-development environment, `SEED_PASSWORD` must be set. Individual
account passwords can be set with `SEED_USER_PASSWORD` and
`SEED_CATALOGUER_PASSWORD`.

## Repository layout

```text
frontend/
  index.html                 Home page
  login.html                 Sign-in page
  pages/                     Browse, search, component, add, and statistics pages
  js/catalogue.js            API client and browser session handling
  js/login.js                Login form
  js/app.js                  Application UI and page rendering
  css/style.css              Application styles

backend/
  src/server.js              Express API, authentication, validation, and routes
  src/db.js                  SQLite schema, password hashing, and initial seed
  src/catalogue-seed.js      Initial categories and catalogue components
  scripts/reset-catalogue.js Reset categories and components to seed data
  scripts/change-user-passwords.js
                             Update account password hashes
  componenthub.db            Local SQLite database when generated locally
  .env.example               Backend environment variable template

Problem-Statement.md         Functional requirements for the project
```

## Requirements

- Node.js `20.20.2` or a compatible Node.js 20 release
- npm

The backend dependencies are defined in [backend/package.json](backend/package.json).
The frontend is static HTML, CSS, and JavaScript and does not require a
separate frontend build step.

## Local setup

1. Install backend dependencies:

   ```bash
   cd backend
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

3. Start the API:

   ```bash
   npm start
   ```

   The API listens on port `3000` by default. Set `PORT` to use another port.

4. Serve the `frontend` directory with a static web server. For example:

   ```bash
   npx serve frontend -l 5501
   ```

5. Open the served `login.html` page and sign in with one of the demo
   accounts.    The frontend automatically uses `http://localhost:3000/api` on localhost
   and `https://componenthub-backend.onrender.com/api` when deployed. A
   manual override remains available:

   ```js
   localStorage.setItem("componentHub.apiBase", "http://localhost:3000/api");
   ```

   Then reload the page.

The backend creates `componenthub.db` on first start. It creates the schema,
two accounts, the initial category tree, and the initial catalogue
components. `DB_PATH` can be set to use a different SQLite file.

## Environment variables

The backend reads variables from `backend/.env`:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Use `development` for local fallback configuration |
| `JWT_SECRET` | Secret used to sign authentication tokens outside development |
| `CORS_ORIGIN` | Allowed frontend origin; defaults to permissive CORS when unset |
| `PORT` | API port; defaults to `3000` |
| `DB_PATH` | SQLite database path; defaults to `componenthub.db` |
| `SEED_PASSWORD` | Fallback password for both initial accounts |
| `SEED_USER_PASSWORD` | Initial password for the `user` account |
| `SEED_CATALOGUER_PASSWORD` | Initial password for the `cataloguer` account |

Do not commit `.env` files or real credentials.

## Catalogue behaviour

### Components

Each component contains:

- Name
- Description
- Type: `Code` or `Design`
- Language or notation
- Hierarchical category
- Up to 20 case-insensitively unique keywords
- Optional HTTP or HTTPS resource URL
- Date added
- Number of uses
- Number of search appearances not followed by use

### Categories

Categories form a tree. A category can be deleted only when it has no child
categories and no components assigned to it. Browsing a parent category
includes components in its descendant categories.

### Search and usage

Search accepts up to eight whitespace-separated terms and searches component
names, descriptions, type, technology, category names, and keywords. Each
matching component increments its `queriedNotUsed` counter. Marking a
component as used increments `used` and decreases `queriedNotUsed`, without
allowing that counter to become negative.

The statistics page shows component totals, category totals, total uses,
search appearances not followed by use, category counts, and the most-used
components. Cataloguers can also view components whose use count is below a
chosen threshold.

## API

The API base path is `/api`. `GET /health`, login, signup OTP, and
password-reset OTP endpoints are public. Catalogue API requests require a
bearer token returned by the login endpoint.

### Authentication

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | Public | Authenticate with `username` and `password` |
| `POST` | `/api/auth/signup` | Public | Start signup and send an email OTP |
| `POST` | `/api/auth/signup/verify` | Public | Verify signup OTP and create a `user` account |
| `POST` | `/api/auth/signup/resend` | Public | Resend signup OTP |
| `POST` | `/api/auth/forgot-password` | Public | Start password reset by email |
| `POST` | `/api/auth/forgot-password/resend` | Public | Resend password-reset OTP |
| `POST` | `/api/auth/reset-password` | Public | Verify OTP and set a new password |
| `GET` | `/api/me` | Signed-in users | Return the authenticated user |

### Categories and components

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/categories` | Signed-in users | List categories with paths and component counts |
| `POST` | `/api/categories` | Cataloguer | Create a category |
| `DELETE` | `/api/categories/:id` | Cataloguer | Delete an empty category |
| `GET` | `/api/components` | Signed-in users | List components; supports `q`, `category`, `type`, `tech`, and `sort` |
| `GET` | `/api/components/:id` | Signed-in users | Get one component |
| `POST` | `/api/components` | Cataloguer | Add a component and its keywords |
| `PUT` | `/api/components/:id` | Cataloguer | Replace component metadata and keywords |
| `PUT` | `/api/components/:id/keywords` | Cataloguer | Replace only the component keywords |
| `DELETE` | `/api/components/:id` | Cataloguer | Delete a component |
| `POST` | `/api/components/:id/use` | Signed-in users | Record reuse of a component |
| `GET` | `/api/components/:id/artifacts` | Signed-in users | List reusable variants and artifacts |
| `GET` | `/api/components/:id/artifacts/:artifactId/download` | Signed-in users | Download an artifact and record reuse |
| `POST` | `/api/components/:id/artifacts` | Cataloguer | Add an artifact |
| `PUT` | `/api/components/:id/artifacts/:artifactId` | Cataloguer | Edit an artifact |
| `DELETE` | `/api/components/:id/artifacts/:artifactId` | Cataloguer | Delete an artifact |

### Search and statistics

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/search?q=...` | Signed-in users | Search the catalogue and record the query |
| `GET` | `/api/stats` | Signed-in users | Return catalogue and usage statistics |
| `GET` | `/api/stats/purge-candidates?threshold=15` | Cataloguer | List components used fewer than the threshold |

Example login request:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"changeme123"}'
```

Use the returned token in subsequent requests:

```bash
curl http://localhost:3000/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Database

SQLite stores the following tables:

- `users`
- `categories`
- `components`
- `keywords`
- `component_keywords`
- `query_log`
- `pending_signups`
- `password_resets`

Passwords are stored as salted scrypt hashes. Authentication uses signed
JSON Web Tokens with an eight-hour expiry. Foreign-key enforcement and WAL
journaling are enabled for SQLite.

## Signup and password reset OTP

Signup and password reset use cryptographically secure six-digit email OTPs.
Only OTP hashes are stored, codes expire after ten minutes, verification
attempts are limited, and successful verification invalidates the OTP.
Resending replaces the previous code. The client never chooses an account
role; verified public signups always create the `user` role.

Email delivery uses Resend through `RESEND_API_KEY`, `EMAIL_FROM`, and the
optional `RESEND_API_URL` environment variables. Resend testing mode may only
deliver to the permitted test recipient. Use a verified sending domain for
general production delivery; never commit API keys or other secrets.

## Catalogue reset and password changes

Reset the categories and components to the built-in seed catalogue:

```bash
cd backend
npm run reset-catalogue
```

The reset script preserves users and their passwords. It is destructive for
catalogue data in the selected database.

To update both account passwords, set the required variables and run:

```bash
cd backend
SEED_USER_PASSWORD='new-user-password' \
SEED_CATALOGUER_PASSWORD='new-cataloguer-password' \
node scripts/change-user-passwords.js
```

Each password must contain at least eight characters.

## Verification

Validate the backend and frontend JavaScript syntax:

```bash
node --check backend/src/db.js
node --check backend/src/server.js
node --check frontend/js/catalogue.js
node --check frontend/js/app.js
```

Check the API health endpoint while the backend is running:

```bash
curl http://localhost:3000/health
```

The expected response is:

```json
{"ok":true}
```

## Functional source

The implementation follows the requirements in
[Problem-Statement.md](Problem-Statement.md), including cataloguer
maintenance, keyword association, keyword search, usage tracking, and
hierarchical browsing.
