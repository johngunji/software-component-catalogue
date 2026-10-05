# ComponentHub backend

REST API for the software component catalogue
(Node.js + Express + SQLite).

## Component editing

Cataloguers can update complete component metadata with:

```http
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