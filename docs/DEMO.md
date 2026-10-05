# Viva demo script

Start the backend (`npm start` in `backend/`) and open `frontend/index.html`
with any static server (for example the VS Code Live Server on port 5500,
which is the `CORS_ORIGIN` in `.env.example`). Passwords are `changeme123`
in development.

1. **Sign in as `user`.** The menu has no Add Component or Categories entry.
2. **Browse.** Open Software Design, then Modelling Notations, then UML. Point out
   the tree, the counts, and that the parent category also shows the components of its children.
   Filter by type Design and notation ERD.
3. **Search.** Search `authentication`: results are ranked, key words rank first.
   Try `uml class diagram`, `binary search`, and `python web framework`. Switch to "match any word".
4. **Usage tracking.** Note the numbers on a result, open it from the search, press
   _Use this component_. "Times used" goes up and "Shown in search, not used" goes down.
   Press it again straight away: it is not counted twice.
5. **Sign out and in as `cataloguer`.**
    - _Add Component_: add a Design component with notation ERD, give it key words,
      then find it with a search.
    - _Edit key words_ inline on the component page.
    - _Categories_: add a subcategory, rename it, move it, try to move a category
      into its own child (refused), delete it.
6. **Statistics (cataloguer).** Show most used, most shown but not used, and the
   purge report: jQuery, Backbone.js, Apache Struts, Waterfall Model Flowchart and
   Moment.js have been shown many times and almost never used. Change the
   thresholds, select them, purge. Show "Searches with no results" (kubernetes,
   blockchain, graphql): these are components the catalogue is missing.
7. **If asked about scale:** lists are paged on the server; `npm test` runs 23 API tests.

To restore the demo data afterwards: `npm run reset-catalogue -- --confirm`.
