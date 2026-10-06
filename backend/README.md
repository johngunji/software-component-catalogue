# ComponentHub backend

REST API for the software component catalogue
(Node.js + Express + SQLite).

## Component editing

Cataloguers can update complete component metadata with:

```

The API listens on port `3000` by default. Set `PORT` to use another port.
For local development, serve the repository's `frontend` directory on port
`5501`.

## Authentication and OTP

The public authentication endpoints are:

- `POST /api/auth/login`
- `POST /api/auth/signup`
- `POST /api/auth/signup/verify`
- `POST /api/auth/signup/resend`
- `POST /api/auth/forgot-password`
- `POST /api/auth/forgot-password/resend`
- `POST /api/auth/reset-password`

Signup and password reset use ten-minute, six-digit email OTPs. OTP hashes
are stored in separate SQLite records, verification attempts are limited,
resends invalidate the previous code, and successful verification deletes the
record. Public signup always creates the `user` role; roles are never accepted
from the request body.

Email delivery uses Resend. Configure `RESEND_API_KEY` and `EMAIL_FROM` in
the ignored local `.env` file. `RESEND_API_URL` is optional for controlled
testing. Resend testing mode may restrict delivery to the permitted test
recipient; a verified sending domain is required for general production
delivery.

Catalogue endpoints below the authentication middleware require a valid JWT.
Backend role checks, rather than frontend visibility, enforce
cataloguer-only operations.http
PUT /api/components/:id
Authorization: Bearer <cataloguer-token>
Content-Type: application/json
```

The JSON body accepts `name`, `description`, `categoryId`, `type`
(`Code` or `Design`), `tech`, `keywords`, and an optional `url`.
The response is the fully hydrated component. Usage counters,
`added_on`, `created_by`, and the component ID are preserved.

The existing `PUT /api/components/:id/keywords` endpoint remains
available for keyword-only updates.

## Run

```bash
npm install
npm start